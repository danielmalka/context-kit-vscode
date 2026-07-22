---
name: security-review
description: Proactive security checklist across 10 categories. Run before any commit involving authentication, authorization, external data input, or secret handling.
---

# Security Review

Run this review on all generated code before commit. For each category, mark OK or record the issue found.

## Category 1 — Secrets and credentials
- [ ] No password, token, API key, or secret hardcoded in the code
- [ ] Environment variables used for credentials — never literal values
- [ ] `.env` files listed in `.gitignore`
- [ ] Logs don't expose secret values (even partially)

**Patterns to search for:**
```
grep -rn "password\s*=\s*['\"]" .
grep -rn "api_key\s*=\s*['\"]" .
grep -rn "secret\s*=\s*['\"]" .
grep -rn "sk-\|Bearer " . --include="*.go" --include="*.php" --include="*.py" --include="*.ts"
```

## Category 2 — Input validation
- [ ] All external input validated before use (HTTP, CLI, file, env var)
- [ ] Validation on the server — never only on the client
- [ ] Types, sizes, and formats explicitly checked
- [ ] Explicit rejection for values outside the expected domain

## Category 3 — SQL Injection
- [ ] Queries use prepared statements or an ORM with parameter binding
- [ ] No string concatenation to build SQL
- [ ] User input never interpolated directly into a query

**Patterns to search for:**
```
grep -rn "fmt.Sprintf.*SELECT\|fmt.Sprintf.*INSERT\|fmt.Sprintf.*WHERE" .
grep -rn "\$_GET\|\$_POST.*query\|DB::statement.*\." .
grep -rn "f\"SELECT\|f'SELECT\|f\"INSERT" .
grep -rn "template.literal.*SELECT\|\`SELECT.*\${" .
```

## Category 4 — Authentication and authorization
- [ ] Authentication verified before any privileged operation
- [ ] Authorization checked per resource (not just global role)
- [ ] Tokens have a defined, validated expiration
- [ ] Authentication failures return a generic error (without revealing whether the user exists)
- [ ] Rate limiting on login endpoints

## Category 5 — XSS (Cross-Site Scripting)
- [ ] All output to HTML is escaped (htmlspecialchars, template auto-escaping)
- [ ] No `innerHTML` with unsanitized data
- [ ] CSP (Content Security Policy) configured
- [ ] Rich-text input sanitized with an allowlist (not a blocklist)

## Category 6 — CSRF (Cross-Site Request Forgery)
- [ ] CSRF token on all state-mutating forms
- [ ] CSRF verification on all POST/PUT/PATCH/DELETE endpoints
- [ ] SameSite cookie attribute set (Lax or Strict)

## Category 7 — Rate limiting and abuse
- [ ] Authentication endpoints rate-limited
- [ ] Upload/processing endpoints rate-limited
- [ ] Error responses don't reveal information about the system

## Category 8 — Sensitive data exposure
- [ ] API responses don't include unnecessary fields
- [ ] PII not logged in plain text
- [ ] Stack traces not exposed in production
- [ ] Response headers don't reveal server/framework version

## Category 9 — Dependencies
- [ ] `make check` includes a dependency audit for the project's language
- [ ] No dependency with an unmitigated known vulnerability (CVE)
- [ ] Pinned versions (not open ranges) for critical dependencies

## Category 10 — Logging and monitoring
- [ ] Security events logged: login, logout, auth failures, permission changes
- [ ] Logs contain no sensitive data
- [ ] Logs have timestamp, user ID, and IP (no additional PII)

---

## Verdict

After checking all categories:

- **APPROVED:** all categories OK
- **APPROVED WITH RESERVATIONS:** minor issues documented with a fix plan
- **REJECTED:** any category 1–4 with an issue → block the commit

Record: `VERDICT: [APPROVED|APPROVED WITH RESERVATIONS|REJECTED] — [categories with issues]`
