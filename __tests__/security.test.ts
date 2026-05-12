/**
 * Security regression tests for The Shelf.
 * Covers password validation, email validation, path traversal prevention,
 * and JWT token integrity — the four security-critical code paths.
 */

import path from "path";
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { validatePassword, EMAIL_RE } from "../utils/validation";

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
