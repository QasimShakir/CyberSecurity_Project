# Contributing to The Shelf

Thank you for contributing. Please read these guidelines before opening a PR.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Branch Naming](#branch-naming)
3. [Commit Format](#commit-format)
4. [Code Style](#code-style)
5. [Pull Requests](#pull-requests)
6. [Security Issues](#security-issues)

---

## Getting Started

```bash
git clone https://github.com/QasimShakir/CyberSecurity_Project.git
cd CyberSecurity_Project
npm install
cp .env.example .env.local   # fill in MONGODB_URI and JWT_SECRET
npm run dev                  # starts Vite + Express on port 3000
```

Run the full stack locally with Docker:

```bash
docker compose run --rm certgen          # generate self-signed TLS cert (once)
docker compose up -d --build --wait      # http://localhost:3000 / https://localhost:3443
```

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/reading-progress-sync` |
| Bug fix | `fix/<short-description>` | `fix/lockout-reset-on-success` |
| Security | `security/<short-description>` | `security/helmet-csp` |
| Docs | `docs/<short-description>` | `docs/api-reference` |
| CI/Pipeline | `ci/<short-description>` | `ci/dast-dockerise` |

---

## Commit Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary>

[optional body — wrap at 72 chars]

[optional footer — issue refs, breaking change notes]
```

**Types:** `feat` · `fix` · `docs` · `refactor` · `test` · `ci` · `security` · `chore`

**Examples:**

```
feat: add server-side pagination to /api/books
fix: reset failedLoginAttempts on successful login
security: add password complexity validation on signup
ci: dockerise DAST stage with docker compose up --wait
docs: update API reference with admin user endpoints
```

Rules:
- Use the imperative mood ("add", not "added" or "adds")
- Keep the subject line under 72 characters
- Reference closed issues with `Fixes #N` or `Refs #N` in the footer
- Do not end the subject line with a period

---

## Code Style

**TypeScript / React**
- The project uses the existing `tsconfig.json` — do not loosen `strict` settings
- Prefer `const` over `let`; avoid `var`
- No `any` types on public API surfaces (internal Express middleware is exempt)
- Keep component files to a single default export
- Use named exports for utility functions

**Backend (server.ts)**
- Validate all user-supplied input at the boundary (`typeof` checks + regex)
- Never concatenate user input into MongoDB queries — use `{ $eq: value }` or Mongoose
- Log security-relevant events (login failures, admin actions) via `logActivity()`
- All new routes that require authentication must call `verifyToken` middleware
- Admin-only routes must additionally call `isAdmin` middleware

**No console.log in committed code** — use `console.warn` for recoverable issues and `console.error` for failures. Development debug logs must be removed before merging.

---

## Pull Requests

1. Open a PR against `main`
2. Fill in the PR template — summary, test plan, checklist
3. All three CI jobs must pass (SCA, SAST, DAST) before merging
4. At least one approval is required
5. Squash-merge to keep history clean; include the issue reference in the merge commit

**Checklist before opening a PR:**

- [ ] `npm run build` succeeds locally
- [ ] No new `npm audit` critical/high vulnerabilities (`npm audit --audit-level=high`)
- [ ] No new Semgrep ERROR findings
- [ ] Docker Compose stack starts cleanly (`docker compose up -d --build --wait`)
- [ ] New endpoints are documented in the API Reference section of `README.md`
- [ ] Sensitive data (keys, tokens, passwords) is not hard-coded or committed

---

## Security Issues

Do **not** open a public GitHub issue for security vulnerabilities. See [SECURITY.md](SECURITY.md) for the responsible disclosure process.