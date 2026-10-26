import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractSocketToken,
  authenticateSocketHandshake,
  evictUserSockets,
  guardPrivilegedSocketEvent,
  SocketEventAuthError,
  SocketLike
} from '../src/sockets/auth.js';
import { createAccessToken } from '../src/utils/token.js';
import * as databaseModule from '../src/database/index.js';

describe('Socket.IO Authentication & Eviction Foundation', () => {
  const mockFindUnique = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindUnique.mockReset();

    vi.spyOn(databaseModule, 'getDatabaseClient').mockReturnValue({
      user: {
        findUnique: mockFindUnique
      }
    } as unknown as ReturnType<typeof databaseModule.getDatabaseClient>);
  });

  describe('Socket Token Extraction', () => {
    it('should extract token from handshake auth payload', () => {
      const socket: SocketLike = {
        id: 'sock-1',
        handshake: {
          headers: {},
          auth: { token: 'jwt.token.from.auth' }
        },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn()
      };

      expect(extractSocketToken(socket)).toBe('jwt.token.from.auth');
    });

    it('should extract token from handshake cookie header', () => {
      const socket: SocketLike = {
        id: 'sock-2',
        handshake: {
          headers: {
            cookie: 'other_cookie=xyz; access_token=jwt.token.from.cookie; session=123'
          }
        },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn()
      };

      expect(extractSocketToken(socket)).toBe('jwt.token.from.cookie');
    });

    it('should extract token from handshake authorization header', () => {
      const socket: SocketLike = {
        id: 'sock-3',
        handshake: {
          headers: {
            authorization: 'Bearer jwt.token.from.header'
          }
        },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn()
      };

      expect(extractSocketToken(socket)).toBe('jwt.token.from.header');
    });

    it('should return null if no token is found', () => {
      const socket: SocketLike = {
        id: 'sock-4',
        handshake: { headers: {} },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn()
      };

      expect(extractSocketToken(socket)).toBeNull();
    });
  });

  describe('Socket Handshake Authentication & Status Gate', () => {
    it('should reject handshake when token is missing', async () => {
      const socket: SocketLike = {
        id: 'sock-err-1',
        handshake: { headers: {} },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn()
      };

      await expect(authenticateSocketHandshake(socket)).rejects.toThrow('No access token provided');
    });

    it('should reject handshake when user is SUSPENDED, even if token is valid', async () => {
      const userId = 'socket-suspended-user';
      const token = await createAccessToken(userId);

      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'SUSPENDED'
      });

      const socket: SocketLike = {
        id: 'sock-susp',
        handshake: {
          headers: {},
          auth: { token }
        },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn()
      };

      await expect(authenticateSocketHandshake(socket)).rejects.toThrow('Account is suspended or inactive');
    });

    it('should succeed and join user room when user is ACTIVE', async () => {
      const userId = 'socket-active-user';
      const token = await createAccessToken(userId);

      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'ACTIVE'
      });

      const joinMock = vi.fn();
      const socket: SocketLike = {
        id: 'sock-ok',
        handshake: {
          headers: {},
          auth: { token }
        },
        data: {},
        join: joinMock,
        disconnect: vi.fn()
      };

      const user = await authenticateSocketHandshake(socket);
      expect(user.id).toBe(userId);
      expect(user.status).toBe('ACTIVE');
      expect(joinMock).toHaveBeenCalledWith(`user:${userId}`);
      expect(socket.data.userId).toBe(userId);
    });
  });

  describe('Reliable Active Socket Eviction (Decision Q-01 §4.3)', () => {
    it('should evict all active sockets in the user room upon suspension', () => {
      const disconnectSocketsMock = vi.fn();
      const mockIo = {
        in: vi.fn().mockReturnValue({
          disconnectSockets: disconnectSocketsMock
        })
      };

      const userId = 'target-evict-user-id';
      evictUserSockets(mockIo, userId);

      expect(mockIo.in).toHaveBeenCalledWith(`user:${userId}`);
      expect(disconnectSocketsMock).toHaveBeenCalledWith(true);
    });
  });

  describe('Privileged Socket Event Status Guard (guardPrivilegedSocketEvent)', () => {
    it('should permit event execution when user status is ACTIVE', async () => {
      const userId = 'active-event-user';
      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'ACTIVE'
      });

      const disconnectMock = vi.fn();
      const socket: SocketLike = {
        id: 'sock-active-event',
        handshake: { headers: {} },
        data: { userId },
        join: vi.fn(),
        disconnect: disconnectMock
      };

      const originalHandler = vi.fn().mockResolvedValue('mutation-success');
      const guardedHandler = guardPrivilegedSocketEvent(socket, originalHandler);

      const result = await guardedHandler({ payload: 123 }, 'param2');
      expect(result).toBe('mutation-success');
      expect(originalHandler).toHaveBeenCalledWith({ payload: 123 }, 'param2');
      expect(disconnectMock).not.toHaveBeenCalled();
    });

    it('should reject event, disconnect socket, and throw ACCOUNT_SUSPENDED when user is SUSPENDED', async () => {
      const userId = 'suspended-event-user';
      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'SUSPENDED'
      });

      const disconnectMock = vi.fn();
      const socket: SocketLike = {
        id: 'sock-susp-event',
        handshake: { headers: {} },
        data: { userId },
        join: vi.fn(),
        disconnect: disconnectMock
      };

      const originalHandler = vi.fn();
      const guardedHandler = guardPrivilegedSocketEvent(socket, originalHandler);

      await expect(guardedHandler({ action: 'privileged_mutation' })).rejects.toThrow(
        'Account is suspended or inactive: Event execution revoked'
      );
      expect(originalHandler).not.toHaveBeenCalled();
      expect(disconnectMock).toHaveBeenCalledWith(true);
    });

    it('should reject event, disconnect socket, and throw ACCOUNT_SUSPENDED when user is INACTIVE', async () => {
      const userId = 'inactive-event-user';
      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'INACTIVE'
      });

      const disconnectMock = vi.fn();
      const socket: SocketLike = {
        id: 'sock-inact-event',
        handshake: { headers: {} },
        data: { userId },
        join: vi.fn(),
        disconnect: disconnectMock
      };

      const originalHandler = vi.fn();
      const guardedHandler = guardPrivilegedSocketEvent(socket, originalHandler);

      await expect(guardedHandler()).rejects.toThrow('Account is suspended or inactive');
      expect(originalHandler).not.toHaveBeenCalled();
      expect(disconnectMock).toHaveBeenCalledWith(true);
    });

    it('should reject event, disconnect socket, and throw USER_NOT_FOUND when user does not exist', async () => {
      const userId = 'deleted-event-user';
      mockFindUnique.mockResolvedValueOnce(null);

      const disconnectMock = vi.fn();
      const socket: SocketLike = {
        id: 'sock-not-found',
        handshake: { headers: {} },
        data: { userId },
        join: vi.fn(),
        disconnect: disconnectMock
      };

      const originalHandler = vi.fn();
      const guardedHandler = guardPrivilegedSocketEvent(socket, originalHandler);

      await expect(guardedHandler()).rejects.toThrow('User account associated with socket session not found');
      expect(originalHandler).not.toHaveBeenCalled();
      expect(disconnectMock).toHaveBeenCalledWith(true);
    });

    it('should reject unauthenticated socket without userId, disconnect socket, and throw SOCKET_UNAUTHENTICATED', async () => {
      const disconnectMock = vi.fn();
      const socket: SocketLike = {
        id: 'sock-no-user',
        handshake: { headers: {} },
        data: {}, // No userId
        join: vi.fn(),
        disconnect: disconnectMock
      };

      const originalHandler = vi.fn();
      const guardedHandler = guardPrivilegedSocketEvent(socket, originalHandler);

      await expect(guardedHandler()).rejects.toThrow('Socket session is not authenticated');
      expect(originalHandler).not.toHaveBeenCalled();
      expect(disconnectMock).toHaveBeenCalledWith(true);
    });

    it('should fail closed safely when database query throws, disconnecting socket and throwing DATABASE_UNAVAILABLE', async () => {
      const userId = 'db-error-user';
      mockFindUnique.mockRejectedValueOnce(new Error('Connection terminated unexpectedly'));

      const disconnectMock = vi.fn();
      const socket: SocketLike = {
        id: 'sock-dberr',
        handshake: { headers: {} },
        data: { userId },
        join: vi.fn(),
        disconnect: disconnectMock
      };

      const originalHandler = vi.fn();
      const guardedHandler = guardPrivilegedSocketEvent(socket, originalHandler);

      await expect(guardedHandler()).rejects.toThrow('Database unavailable during event authorization');
      expect(originalHandler).not.toHaveBeenCalled();
      expect(disconnectMock).toHaveBeenCalledWith(true);
    });

    it('should invoke acknowledgment callback with error payload when provided as last argument', async () => {
      const userId = 'ack-test-user';
      mockFindUnique.mockResolvedValueOnce({
        id: userId,
        status: 'SUSPENDED'
      });

      const disconnectMock = vi.fn();
      const socket: SocketLike = {
        id: 'sock-ack-test',
        handshake: { headers: {} },
        data: { userId },
        join: vi.fn(),
        disconnect: disconnectMock
      };

      const ackCallback = vi.fn();
      const originalHandler = vi.fn();
      const guardedHandler = guardPrivilegedSocketEvent(socket, originalHandler);

      await expect(guardedHandler({ data: 1 }, ackCallback)).rejects.toThrow();
      expect(ackCallback).toHaveBeenCalledWith({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Account is suspended or inactive: Event execution revoked'
        }
      });
      expect(disconnectMock).toHaveBeenCalledWith(true);
    });
  });
});
