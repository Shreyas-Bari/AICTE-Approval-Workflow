import { verifyAccessToken } from '../utils/token.js';
import { getDatabaseClient } from '../database/index.js';

export interface SocketLike {
  id: string;
  handshake: {
    headers?: Record<string, string | string[] | undefined>;
    auth?: Record<string, unknown>;
  };
  data: Record<string, unknown>;
  join: (room: string) => void | Promise<void>;
  disconnect: (close?: boolean) => void;
}

export interface ServerLike {
  in: (room: string) => {
    disconnectSockets: (close: boolean) => void;
  };
}

/**
 * Extract the raw access token from a socket handshake.
 * Supports HttpOnly cookie parsing from handshake headers or the auth payload.
 */
export function extractSocketToken(socket: SocketLike): string | null {
  // Check auth payload first
  if (typeof socket.handshake.auth?.token === 'string') {
    return socket.handshake.auth.token;
  }

  // Parse Cookie header from handshake
  const rawCookie = socket.handshake.headers?.cookie;
  if (typeof rawCookie === 'string') {
    const cookies = Object.fromEntries(
      rawCookie.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    if (cookies.access_token) {
      return cookies.access_token;
    }
  }

  // Secondary fallback to Authorization header (strictly for non-browser tooling/testing)
  const authHeader = socket.handshake.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Verify socket handshake authentication and enforce active account status.
 * Rejects connection if token is invalid, expired, or if user is SUSPENDED / INACTIVE.
 */
export async function authenticateSocketHandshake(socket: SocketLike): Promise<{ id: string; status: string }> {
  const token = extractSocketToken(socket);
  if (!token) {
    throw new Error('Socket authentication failed: No access token provided');
  }

  const payload = await verifyAccessToken(token);
  const userId = payload.sub;
  if (!userId) {
    throw new Error('Socket authentication failed: Token missing subject');
  }

  const prisma = getDatabaseClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true }
  });

  if (!user) {
    throw new Error('Socket authentication failed: User account not found');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Socket authentication failed: Account is suspended or inactive');
  }

  // Join the individual user room for targeted notifications and reliable eviction
  await socket.join(`user:${user.id}`);
  socket.data.userId = user.id;

  return user;
}

/**
 * Custom error thrown during privileged socket event authorization failure.
 */
export class SocketEventAuthError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SocketEventAuthError';
    this.code = code;
  }
}

/**
 * Reusable per-event authorization guard for privileged / mutating Socket.IO incoming events.
 *
 * Enforces Decision Q-01 §4.3 item 3:
 * "Before processing any mutating or privileged incoming socket event, the server re-validates account status."
 *
 * Operational behavior:
 * 1. Checks that socket.data.userId exists (populated during handshake). If missing, disconnects socket
 *    and throws SocketEventAuthError('SOCKET_UNAUTHENTICATED').
 * 2. Re-queries PostgreSQL for current User.status.
 * 3. If a database error occurs, fails closed safely without leaking internal connection details,
 *    disconnects socket, and throws SocketEventAuthError('DATABASE_UNAVAILABLE').
 * 4. If user no longer exists, disconnects socket and throws SocketEventAuthError('USER_NOT_FOUND').
 * 5. If user status is SUSPENDED or INACTIVE, disconnects socket and throws SocketEventAuthError('ACCOUNT_SUSPENDED').
 * 6. If the incoming event includes an acknowledgment callback as its last argument,
 *    it invokes the callback with an error object before throwing/disconnecting.
 * 7. If user is ACTIVE, executes the provided handler.
 *
 * Note on Integration Status:
 * This helper provides the reusable guard for event-level protection.
 * Actual Socket.IO real-time event listeners will be registered in Phase 4 (Real-time and Alerts).
 * Any incoming privileged or mutating event MUST wrap its handler with this guard.
 */
export function guardPrivilegedSocketEvent<TArgs extends any[], TReturn>(
  socket: SocketLike,
  handler: (...args: TArgs) => Promise<TReturn> | TReturn
): (...args: TArgs) => Promise<TReturn | void> {
  return async (...args: TArgs): Promise<TReturn | void> => {
    const userId = socket.data?.userId as string | undefined;

    const maybeAck = args[args.length - 1];
    const sendAckError = (code: string, message: string) => {
      if (typeof maybeAck === 'function') {
        try {
          maybeAck({ error: { code, message } });
        } catch {
          // Ignore ack invocation error
        }
      }
    };

    if (!userId) {
      sendAckError('SOCKET_UNAUTHENTICATED', 'Socket session is not authenticated');
      socket.disconnect(true);
      throw new SocketEventAuthError('SOCKET_UNAUTHENTICATED', 'Socket session is not authenticated');
    }

    let user;
    try {
      const prisma = getDatabaseClient();
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true }
      });
    } catch {
      // Fail closed safely on database error
      sendAckError('DATABASE_UNAVAILABLE', 'Database unavailable during event authorization');
      socket.disconnect(true);
      throw new SocketEventAuthError('DATABASE_UNAVAILABLE', 'Database unavailable during event authorization');
    }

    if (!user) {
      sendAckError('USER_NOT_FOUND', 'User account associated with socket session not found');
      socket.disconnect(true);
      throw new SocketEventAuthError('USER_NOT_FOUND', 'User account associated with socket session not found');
    }

    if (user.status !== 'ACTIVE') {
      sendAckError('ACCOUNT_SUSPENDED', 'Account is suspended or inactive: Event execution revoked');
      socket.disconnect(true);
      throw new SocketEventAuthError('ACCOUNT_SUSPENDED', 'Account is suspended or inactive: Event execution revoked');
    }

    return handler(...args);
  };
}

/**
 * Reliably evicts all active sockets belonging to a user when their account is suspended.
 * Fulfills Decision Q-01 §4.3: immediate socket eviction upon administrative suspension commit.
 *
 * @param io - Socket.IO server or namespace instance
 * @param userId - Target user ID to evict
 */
export function evictUserSockets(io: ServerLike, userId: string): void {
  io.in(`user:${userId}`).disconnectSockets(true);
}
