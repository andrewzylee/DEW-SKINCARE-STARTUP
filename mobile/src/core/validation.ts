// Client-side checks for the email/password forms. These exist to give an instant, specific error
// instead of a round-trip and a generic one — Supabase still enforces its own rules server-side.

export const MIN_PASSWORD_LENGTH = 8;

// Deliberately permissive: the only authority on whether an address works is whether the
// confirmation email arrives. This just catches obvious typos before a network call.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailError(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Enter your email.';
  if (!EMAIL_RE.test(v)) return 'That does not look like an email address.';
  return null;
}

export function passwordError(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (/^\d+$/.test(password)) return 'Use more than just numbers.';
  return null;
}

export function displayNameError(name: string): string | null {
  const v = name.trim();
  if (!v) return 'Enter your name.';
  if (v.length > 60) return 'That name is too long.';
  return null;
}

// Supabase surfaces auth failures as terse strings meant for developers. Translate the common ones;
// pass anything unrecognised through so we never swallow a real error.
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Wrong email or password.';
  if (m.includes('email not confirmed')) return 'Confirm your email first — check your inbox.';
  if (m.includes('user already registered')) return 'That email already has an account. Sign in instead.';
  if (m.includes('password should be at least')) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (m.includes('unable to validate email address')) return 'That does not look like an email address.';
  if (m.includes('email rate limit') || m.includes('too many requests') || m.includes('rate limit')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (m.includes('network') || m.includes('fetch')) return 'No connection. Check your network and try again.';
  return message;
}
