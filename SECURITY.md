# Security Policy

## Supported Versions

The Shelf is an educational DevSecOps project. Only the latest version on the `main` branch receives security fixes.

| Version | Supported |
|---|---|
| `main` (latest) | Yes |
| Older branches | No |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security vulnerabilities by emailing the repository owner directly:

**Email:** [QasimShakir on GitHub](https://github.com/QasimShakir) — use the email listed on his GitHub profile

Include the following in your report:

1. **Description** — what is the vulnerability and what can an attacker do with it?
2. **Steps to reproduce** — minimal proof-of-concept or curl commands
3. **Affected component** — backend route, frontend page, Docker config, CI pipeline, etc.
4. **Severity estimate** — your CVSS v3 score or DREAD rating if possible
5. **Suggested fix** (optional but appreciated)

---

## Response Timeline

| Milestone | Target |
|---|---|
| Acknowledgement | 48 hours |
| Initial triage | 5 business days |
| Fix + patch release | 14 days for High/Critical |
| Public disclosure | After patch is released |

---

## Known Security Controls

The following controls are already in place and have been reviewed as part of the DevSecOps pipeline:

| Control | Details |
|---|---|
| Authentication | JWT (HS256), bcrypt password hashing (10 rounds) |
| Account lockout | 5 failed attempts → 15-minute lock |
| Rate limiting | Auth: 20 req/15 min · API: 200 req/min |
| Security headers | Helmet (all protections except CSP which is custom) |
| Input validation | Type checks + email regex + password complexity on all auth endpoints |
| RBAC | `admin` / `reader` roles enforced in middleware on every route |
| HTTPS | Self-signed TLS on port 3443; production deployments should use a trusted CA |
| SAST | Semgrep scans on every push to `main` |
| SCA | `npm audit` quality gate on every push to `main` |
| DAST | OWASP ZAP baseline scan on every push to `main` |

---

## Out of Scope

The following are **out of scope** for this project's security policy:

- Denial-of-service attacks against the hosted demo instance
- Social engineering attacks against project members
- Vulnerabilities in Project Gutenberg's external service
- Issues that require physical access to the server
- Self-signed certificate warnings in the browser (by design for the demo)

---

## Disclosure Policy

We follow a **coordinated disclosure** model. Reporters are credited in the relevant commit message or release notes unless they prefer to remain anonymous.