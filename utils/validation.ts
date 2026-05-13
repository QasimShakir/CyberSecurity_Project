export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validatePassword(pw: string): string | null {
  if (pw.length < 8)              return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pw))          return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(pw))          return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(pw))          return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(pw))   return "Password must contain at least one special character";
  return null;
}

// SSRF allowlist: only Project Gutenberg HTTPS URLs are permitted for epub-proxy.
// Internal /api/books/epub-upload/ paths are handled separately in server.ts.
const ALLOWED_EPUB_HOSTS = ["www.gutenberg.org", "gutenberg.org"];

export function isAllowedEpubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_EPUB_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}
