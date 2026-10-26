import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Loader2,
  FileText,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context';
import { ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils/cn';

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Safely resolves and validates a return destination from location.state.from.
 *
 * Requirements:
 * 1. Validates the pathname separately from search and hash.
 * 2. Rejects external URLs, protocol-relative paths, raw or encoded backslash bypasses,
 *    control characters, malformed percent-encoding in the pathname, and /login redirect loops.
 * 3. Preserves valid internal pathname, query, and hash exactly as supplied without
 *    rewriting or decoding query/hash values.
 * 4. Falls back safely to '/' for missing or invalid destinations.
 */
export function resolveSafeReturnPath(fromState: unknown): string {
  if (!fromState) {
    return '/';
  }

  let rawPathname = '';
  let rawSearch = '';
  let rawHash = '';

  if (typeof fromState === 'string') {
    const trimmed = fromState.trim();
    const match = trimmed.match(/^([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/);
    if (match) {
      rawPathname = match[1];
      rawSearch = match[2] !== undefined ? `?${match[2]}` : '';
      rawHash = match[3] !== undefined ? `#${match[3]}` : '';
    }
  } else if (typeof fromState === 'object' && fromState !== null) {
    const loc = fromState as { pathname?: unknown; search?: unknown; hash?: unknown };
    const objPath = typeof loc.pathname === 'string' ? loc.pathname.trim() : '';
    const match = objPath.match(/^([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/);
    if (match) {
      rawPathname = match[1];
      const embeddedSearch = match[2] !== undefined ? `?${match[2]}` : '';
      const embeddedHash = match[3] !== undefined ? `#${match[3]}` : '';
      rawSearch = typeof loc.search === 'string' && loc.search.trim() ? loc.search.trim() : embeddedSearch;
      rawHash = typeof loc.hash === 'string' && loc.hash.trim() ? loc.hash.trim() : embeddedHash;
    }
  }

  // Must have a non-empty pathname starting with a single slash, not protocol-relative '//'
  if (!rawPathname || !rawPathname.startsWith('/') || rawPathname.startsWith('//')) {
    return '/';
  }

  // Reject raw backslashes and control characters in the pathname
  if (rawPathname.includes('\\') || /[\u0000-\u001F\u007F]/.test(rawPathname)) {
    return '/';
  }

  // Reject control characters in search or hash
  if (/[\u0000-\u001F\u007F]/.test(rawSearch) || /[\u0000-\u001F\u007F]/.test(rawHash)) {
    return '/';
  }

  // Validate the pathname across nested percent-encoded layers (bounded to max 3 iterations)
  // to catch nested bypasses (e.g. '/%252fevil.com' -> '/%2fevil.com' -> '//evil.com',
  // '/%255cevil.com' -> '/%5cevil.com' -> '/\\evil.com', '/%256c%256f%2567%2569%256e' -> '/login')
  let currentDecoded = rawPathname;
  let converged = false;
  const maxIterations = 3;

  for (let i = 0; i < maxIterations; i++) {
    let nextDecoded = '';
    try {
      nextDecoded = decodeURIComponent(currentDecoded);
    } catch {
      // Malformed percent-encoding in the pathname is invalid
      return '/';
    }

    // Invariants enforced at EVERY decoded layer:
    if (!nextDecoded.startsWith('/') || nextDecoded.startsWith('//') || nextDecoded.includes('\\')) {
      return '/';
    }

    if (/[\u0000-\u001F\u007F]/.test(nextDecoded)) {
      return '/';
    }

    // Disallow external URI schemes within the pathname (e.g. '/https://', '/javascript:')
    if (nextDecoded.includes(':')) {
      return '/';
    }

    // Prevent redirect loops to login (case-insensitive, trailing slashes removed)
    const normalized = nextDecoded.toLowerCase().replace(/\/+$/, '') || '/';
    if (normalized === '/login') {
      return '/';
    }

    // If no further percent-encoded sequences remain, the pathname has converged
    if (!/%[0-9a-fA-F]{2}/.test(nextDecoded)) {
      converged = true;
      break;
    }

    currentDecoded = nextDecoded;
  }

  // Reject pathnames with unbounded or excessively deep percent-encoding
  if (!converged) {
    return '/';
  }

  // Normalize search/hash prefixes if needed while preserving query/hash contents untouched
  const searchPart = rawSearch ? (rawSearch.startsWith('?') ? rawSearch : `?${rawSearch}`) : '';
  const hashPart = rawHash ? (rawHash.startsWith('#') ? rawHash : `#${rawHash}`) : '';

  return `${rawPathname}${searchPart}${hashPart}`;
}

export const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = (location.state as { from?: unknown } | null)?.from;
  const returnPath = resolveSafeReturnPath(rawFrom);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to validated target destination or root
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate(returnPath, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, returnPath]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Enter a valid email address format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length > 1024) {
      newErrors.password = 'Password exceeds maximum allowed length (1024 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      // Successful login navigates to validated return path or root overview
      navigate(returnPath, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setServerError('Invalid email or password. Please verify your credentials and try again.');
        } else if (err.code === 'ACCOUNT_SUSPENDED' || err.status === 403) {
          setServerError(
            'Your account is suspended or inactive. Please contact an administrator.',
          );
        } else if (err.code === 'VALIDATION_ERROR') {
          const fieldErrors: FormErrors = {};
          err.details?.forEach((d) => {
            if (d.field === 'email' && !fieldErrors.email) {
              fieldErrors.email = d.message;
            }
            if (d.field === 'password' && !fieldErrors.password) {
              fieldErrors.password = d.message;
            }
          });
          if (Object.keys(fieldErrors).length > 0) {
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
          }
          const detailsMsg = err.details?.map((d) => d.message).join('. ');
          setServerError(detailsMsg || err.message || 'Please provide valid credentials.');
        } else {
          setServerError(err.message || 'Authentication failed. Please try again.');
        }
      } else if (err instanceof Error) {
        setServerError(
          err.message || 'Unable to connect to the authentication server. Please check your network.',
        );
      } else {
        setServerError('An unexpected error occurred during sign in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-text-secondary font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel: Prototype Context & Architecture Overview */}
      <div className="lg:w-5/12 xl:w-1/2 bg-navy text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden bg-gradient-to-br from-[#17243A] via-[#101C30] to-[#0A1322]">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Identity & Purpose */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="inline-block text-[11px] font-semibold tracking-wider text-blue-200 bg-white/10 px-2.5 py-1 rounded-md border border-white/10 uppercase">
              Independent Prototype &bull; SIH26262
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                AICTE Approval Workflow
              </h2>
              <span className="text-xs text-white/70">
                Integrated Approval Workflow Automation &amp; Compliance System
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-lg">
            A functional workflow prototype modeling institutional approval applications,
            multi-tier scrutiny queues, expert visit committee (EVC) coordination, and statutory
            compliance tracking.
          </p>
        </div>

        {/* Middle: Core Modules */}
        <div className="relative z-10 my-8 sm:my-10 space-y-3 max-w-lg">
          <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white">Application Scrutiny</h3>
              <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                Multi-stage review queues, structured deficiency tracking, and institutional resubmissions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white">Committee Coordination</h3>
              <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                Expert visit committee (EVC) inspection schedules, committee proceedings, and reporting.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white">Compliance &amp; Audit</h3>
              <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                Obligation monitoring, deadline tracking, and immutable audit logging.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Prototype Disclaimer */}
        <div className="relative z-10 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 leading-relaxed">
            Independent research &amp; demonstration prototype for the AICTE Approval Workflow problem statement.
            Not an official portal of the All India Council for Technical Education.
          </p>
        </div>
      </div>

      {/* Right Panel: Clean Authentication Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Navigation back to overview */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded py-1 px-1.5 -ml-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Overview
            </Link>
          </div>

          {/* Form Header */}
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-strong tracking-tight">
                Portal Sign In
              </h1>
              <span className="text-[11px] font-medium text-text-secondary bg-surface-muted px-2 py-0.5 rounded border border-border/60">
                Prototype Environment
              </span>
            </div>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Enter your credentials to access your review console or institutional dashboard.
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-3 p-4 bg-danger-bg border border-danger/20 rounded-xl text-danger text-sm leading-snug"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Authentication Failed</span>
                <span className="text-xs sm:text-sm text-danger/90">{serverError}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-text-strong uppercase tracking-wider mb-1.5"
              >
                Email Address <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@institution.edu.in"
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 bg-surface border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:bg-surface-muted',
                    errors.email
                      ? 'border-danger focus:ring-danger/20 focus:border-danger'
                      : 'border-border',
                  )}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-danger font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-text-strong uppercase tracking-wider mb-1.5"
              >
                Password <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  className={cn(
                    'w-full pl-10 pr-11 py-2.5 bg-surface border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:bg-surface-muted',
                    errors.password
                      ? 'border-danger focus:ring-danger/20 focus:border-danger'
                      : 'border-border',
                  )}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary p-1 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1.5 text-xs text-danger font-medium flex items-center gap-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Assistance Information */}
            <div className="pt-1">
              <p className="text-xs text-text-secondary leading-relaxed">
                For demonstration credentials or account access, refer to the local repository configuration.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full h-11 text-sm font-semibold tracking-wide gap-2 shadow-xs mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </Button>
          </form>

          {/* Security Transport Footer */}
          <div className="pt-4 border-t border-border/80 text-center">
            <span className="text-xs text-text-secondary inline-flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              HttpOnly session cookies &bull; CSRF protected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
