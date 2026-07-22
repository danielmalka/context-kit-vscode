# TypeScript — Security

Mandatory security rules. Treat violations as BLOCKER at review gates.

## Secrets

```ts
// GOOD: env / secret store
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error("API_KEY missing");

// BLOCKER: hardcoded credentials
const apiKey = "sk-live-...."; // BAD
```

- Never commit `.env`. Ship `.env.example` with empty placeholders only.
- Do not log tokens, cookies, Authorization headers, or private keys.
- Extension settings may store *paths*, never API secrets in plaintext settings if avoidable.

## Injection

```ts
// GOOD: parameterized queries / ORMs
await db.query("SELECT id FROM users WHERE email = $1", [email]);

// BLOCKER: string-built SQL or shell
await db.query(`SELECT * FROM users WHERE email = '${email}'`); // BAD
exec(`rm -rf ${userPath}`); // BAD — validate and use APIs
```

- Prefer `fs`/`path` APIs over shell for file operations.
- When spawning processes, use `spawn(cmd, args, { shell: false })` with a fixed command allowlist.

## Path traversal

```ts
// GOOD: resolve under a root and verify prefix
import path from "node:path";

function underRoot(root: string, rel: string): string {
  const full = path.resolve(root, rel);
  const base = path.resolve(root);
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("path escapes root");
  }
  return full;
}
```

- Never write user-controlled relative paths into the filesystem without this check.
- Library/seed install paths must stay under the extension globalStorage or workspace root.

## XSS / untrusted content (webviews & HTTP)

- Webview HTML: no unescaped user content; use textContent or strict templating.
- CSP in webviews: local scripts only via `webview.asWebviewUri`; no remote CDNs in production.
- Treat skill/command markdown from disk as **data** when rendering; do not `eval`.

## Dependencies

- Add dependencies only with explicit approval.
- Run `npm audit` in CI or pre-release; no known critical vulns in production deps without a documented waiver.
- Lockfile (`package-lock.json` / `pnpm-lock.yaml`) is mandatory and committed.

## Prototype pollution & JSON

- Do not merge untrusted JSON into objects with recursive assign without a safe library.
- Validate external JSON with explicit schemas or narrow parsers (not “trust the shape”).
