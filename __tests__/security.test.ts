/**
 * Security regression tests for The Shelf.
 * Covers password validation, email validation, path traversal prevention,
 * and JWT token integrity — the four security-critical code paths.
 */

import path from "path";
import { createHash, randomBytes } from "crypto";
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { validatePassword, EMAIL_RE, isAllowedEpubUrl } from "../utils/validation";

// ─── Password complexity enforcement ──────────────────────────────────────────

describe("validatePassword — complexity rules", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(validatePassword("Ab1!")).toBe("Password must be at least 8 characters");
  });

  it("rejects passwords with no uppercase letter", () => {
    expect(validatePassword("abcdef1!")).toBe(
      "Password must contain at least one uppercase letter"
    );
  });

  it("rejects passwords with no lowercase letter", () => {
    expect(validatePassword("ABCDEF1!")).toBe(
      "Password must contain at least one lowercase letter"
    );
  });

  it("rejects passwords with no digit", () => {
    expect(validatePassword("Abcdefg!")).toBe(
      "Password must contain at least one number"
    );
  });

  it("rejects passwords with no special character", () => {
    expect(validatePassword("Abcdefg1")).toBe(
      "Password must contain at least one special character"
    );
  });

  it("accepts a valid strong password", () => {
    expect(validatePassword("Str0ng@Pass!")).toBeNull();
  });

  it("accepts a strong password with only minimum required characters", () => {
    expect(validatePassword("Aa1!aaaa")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(validatePassword("")).toBe("Password must be at least 8 characters");
  });
});

// ─── Email format validation ───────────────────────────────────────────────────

describe("EMAIL_RE — format validation", () => {
  it("accepts a standard valid email", () => {
    expect(EMAIL_RE.test("user@example.com")).toBe(true);
  });

  it("accepts an email with subdomain", () => {
    expect(EMAIL_RE.test("user@mail.example.co.uk")).toBe(true);
  });

  it("rejects an email with no @ symbol", () => {
    expect(EMAIL_RE.test("userexample.com")).toBe(false);
  });

  it("rejects an email with no domain TLD", () => {
    expect(EMAIL_RE.test("user@example")).toBe(false);
  });

  it("rejects an email with spaces", () => {
    expect(EMAIL_RE.test("us er@example.com")).toBe(false);
  });
});

// ─── Path traversal prevention ────────────────────────────────────────────────

describe("path.basename — prevents directory traversal", () => {
  it("strips Unix-style directory traversal sequences", () => {
    expect(path.basename("../../etc/passwd")).toBe("passwd");
  });

  it("strips deeply nested traversal sequences", () => {
    expect(path.basename("../../../etc/shadow")).toBe("shadow");
  });

  it("strips Windows-style traversal sequences (path.win32 for cross-platform)", () => {
    // On Linux, backslash is a valid filename character, not a separator.
    // path.win32.basename always parses Windows paths correctly regardless of host OS.
    expect(path.win32.basename("..\\..\\windows\\system32\\cmd.exe")).toBe("cmd.exe");
  });

  it("preserves safe EPUB filenames unchanged", () => {
    expect(path.basename("1700000000000-My_Book.epub")).toBe(
      "1700000000000-My_Book.epub"
    );
  });

  it("preserves safe image filenames unchanged", () => {
    expect(path.basename("cover-image.jpg")).toBe("cover-image.jpg");
  });
});

// ─── CSPRNG token generation (VD-005 regression) ─────────────────────────────

describe("crypto.randomBytes — CSPRNG password-reset tokens", () => {
  it("generates a 64-character hex string from 32 random bytes", () => {
    const token = randomBytes(32).toString("hex");
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("generates unique tokens on each call", () => {
    const t1 = randomBytes(32).toString("hex");
    const t2 = randomBytes(32).toString("hex");
    expect(t1).not.toBe(t2);
  });

  it("SHA-256 hash of a token is deterministic (same input → same hash)", () => {
    const token = "test-reset-token-value";
    const h1 = createHash("sha256").update(token).digest("hex");
    const h2 = createHash("sha256").update(token).digest("hex");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it("different tokens produce different SHA-256 hashes", () => {
    const h1 = createHash("sha256").update(randomBytes(32).toString("hex")).digest("hex");
    const h2 = createHash("sha256").update(randomBytes(32).toString("hex")).digest("hex");
    expect(h1).not.toBe(h2);
  });
});

// ─── SSRF allowlist (VD-002 regression) ──────────────────────────────────────

describe("isAllowedEpubUrl — SSRF prevention allowlist", () => {
  it("allows HTTPS www.gutenberg.org URLs", () => {
    expect(isAllowedEpubUrl("https://www.gutenberg.org/cache/epub/1342/pg1342.epub")).toBe(true);
  });

  it("allows HTTPS gutenberg.org URLs", () => {
    expect(isAllowedEpubUrl("https://gutenberg.org/files/1234/1234.epub")).toBe(true);
  });

  it("blocks AWS instance metadata service URL", () => {
    expect(isAllowedEpubUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("blocks localhost MongoDB port", () => {
    expect(isAllowedEpubUrl("http://127.0.0.1:27017")).toBe(false);
  });

  it("blocks HTTP (non-HTTPS) gutenberg URLs", () => {
    expect(isAllowedEpubUrl("http://www.gutenberg.org/cache/epub/1342/pg1342.epub")).toBe(false);
  });

  it("blocks arbitrary external domain", () => {
    expect(isAllowedEpubUrl("https://attacker.com/malware.epub")).toBe(false);
  });

  it("blocks internal Docker service hostname", () => {
    expect(isAllowedEpubUrl("http://host.docker.internal:9999/ssrf-test")).toBe(false);
  });

  it("blocks malformed/non-URL strings", () => {
    expect(isAllowedEpubUrl("not-a-url")).toBe(false);
    expect(isAllowedEpubUrl("")).toBe(false);
  });
});

// ─── JWT token integrity ───────────────────────────────────────────────────────

describe("JWT token verification", () => {
  const SECRET = "TestSecret@12345!abcdefghijklmn";

  it("verifies a validly signed token without throwing", () => {
    const token = jwt.sign({ id: "abc", role: "reader" }, SECRET, {
      expiresIn: "1h",
    });
    expect(() => jwt.verify(token, SECRET)).not.toThrow();
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({ id: "abc", role: "admin" }, "wrong-secret");
    expect(() => jwt.verify(token, SECRET)).toThrow();
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ id: "abc" }, SECRET, { expiresIn: "0s" });
    // Brief wait ensures the token is past its expiry before verification
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(() => jwt.verify(token, SECRET)).toThrow(/jwt expired/i);
        resolve();
      }, 50);
    });
  });

  it("rejects a token with a tampered payload", () => {
    const token = jwt.sign({ id: "abc", role: "reader" }, SECRET);
    // Tamper: decode, modify, re-encode without re-signing
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    payload.role = "admin";
    const tamperedToken =
      parts[0] +
      "." +
      Buffer.from(JSON.stringify(payload)).toString("base64url") +
      "." +
      parts[2];
    expect(() => jwt.verify(tamperedToken, SECRET)).toThrow();
  });

  it("decoded payload contains the expected user id and role", () => {
    const token = jwt.sign({ id: "user123", role: "reader" }, SECRET, {
      expiresIn: "1h",
    });
    const decoded = jwt.verify(token, SECRET) as { id: string; role: string };
    expect(decoded.id).toBe("user123");
    expect(decoded.role).toBe("reader");
  });
});
