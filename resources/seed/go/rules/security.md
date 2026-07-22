<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# Go — Security

Mandatory security rules for the Reviewer to verify at Gate 4.

## SQL Injection

```go
// GOOD: Always use parameters — never concatenate SQL
rows, err := db.QueryContext(ctx,
    "SELECT id, name FROM users WHERE email = $1",
    email,
)

// BLOCKER: string concatenation in a query
query := "SELECT * FROM users WHERE email = '" + email + "'" // BAD
```

## Secrets and Credentials

```go
// GOOD: Read secrets from environment variables or a secret manager
dsn := os.Getenv("DATABASE_URL")

// GOOD: Validate that secrets are not empty at startup
if dsn == "" {
    return fmt.Errorf("DATABASE_URL is required")
}

// BLOCKER: no hardcoded secrets in code
const apiKey = "sk-prod-abc123" // BAD — gitleaks:allow
```

## Input Validation

```go
// GOOD: Validate ALL external input at the system boundary
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }
    if err := req.Validate(); err != nil { // explicit validation
        http.Error(w, err.Error(), http.StatusUnprocessableEntity)
        return
    }
}

// GOOD: Use validation libraries (go-playground/validator) for complex structs
```

## Safe Error Handling

```go
// GOOD: Don't expose internal details to the client
func (h *Handler) handle(w http.ResponseWriter, err error) {
    log.Error("internal error", "err", err) // full log internally
    http.Error(w, "internal server error", http.StatusInternalServerError) // generic to client
}

// BAD: Never return stack traces or DB messages to the user
http.Error(w, err.Error(), 500) // may leak: "pq: duplicate key value violates..."
```

## CSRF and HTTP Headers

```go
// GOOD: Configure security headers in middleware
w.Header().Set("X-Content-Type-Options", "nosniff")
w.Header().Set("X-Frame-Options", "DENY")
w.Header().Set("Content-Security-Policy", "default-src 'self'")

// GOOD: CSRF tokens for state-changing endpoints
```

## Cryptography

```go
// GOOD: Use bcrypt or argon2 for passwords
hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

// GOOD: Use crypto/rand for tokens, never math/rand
token := make([]byte, 32)
_, err := crypto_rand.Read(token)

// BLOCKER: md5/sha1 for passwords
// BLOCKER: math/rand for security tokens
```

## Path Traversal

```go
// GOOD: Normalize and validate file paths before use
cleanPath := filepath.Clean(userInput)
if !strings.HasPrefix(cleanPath, allowedBase) {
    return errors.New("path traversal detected")
}
```

## Security Review Checklist (Go)

- [ ] Zero queries with string concatenation
- [ ] Zero hardcoded secrets (`grep -r "sk-\|password =\|api_key ="`)
- [ ] All external input validated at the boundary
- [ ] Internal errors not exposed to the client
- [ ] crypto/rand for token generation
- [ ] bcrypt/argon2 for passwords
- [ ] Security headers on HTTP responses
