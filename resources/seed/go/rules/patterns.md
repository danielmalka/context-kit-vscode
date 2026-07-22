<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# Go — Patterns

Mandatory idiomatic patterns for Go projects within the SDD framework.

## Interfaces

```go
// GOOD: Define interfaces on the consumer side, not the implementer's
// Package A (consumer):
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

// BAD: Don't create interfaces "just in case" — only when there are multiple implementations
// or a need for testing/mocking
```

## Errors

```go
// GOOD: Errors as values — always handle, never ignore
result, err := doSomething()
if err != nil {
    return fmt.Errorf("doSomething: %w", err) // wrap for context
}

// GOOD: Sentinel errors for expected cases
var ErrNotFound = errors.New("not found")
if errors.Is(err, ErrNotFound) { ... }

// BAD: Never ignore errors with _
result, _ := doSomething()

// BAD: Never use panic() in production code (only in init/setup)
```

## Context

```go
// GOOD: Context is always the first parameter
func ProcessOrder(ctx context.Context, orderID string) error { ... }

// GOOD: Propagate cancellation and deadline
select {
case <-ctx.Done():
    return ctx.Err()
case result := <-ch:
    return result
}

// BAD: Never store context in a struct
type Service struct {
    ctx context.Context // BAD
}
```

## Goroutines and Concurrency

```go
// GOOD: Never spawn a goroutine without a guarantee it will terminate
var wg sync.WaitGroup
wg.Add(1)
go func() {
    defer wg.Done()
    doWork()
}()
wg.Wait()

// GOOD: Use channels to communicate, mutexes for shared state
// GOOD: Prefer sync.Mutex over sync/atomic for complex logic

// BAD: Goroutine leak: spawning a goroutine that may never finish
go func() {
    for { // no stop condition BAD
        doWork()
    }
}()
```

## Structs and Constructors

```go
// GOOD: Use a constructor for validation and invariants
func NewUser(email, name string) (*User, error) {
    if email == "" {
        return nil, errors.New("email is required")
    }
    return &User{Email: email, Name: name}, nil
}

// GOOD: Return a pointer when the struct is mutable or large
// Return a value when it's small and immutable
```

## Packages

```go
// GOOD: Package names: short, lowercase, no underscores
// GOOD: One package per cohesive responsibility
// GOOD: internal/ for code not exported outside the module

// BAD: Package "utils", "helpers", "common" — a sign of undefined responsibility
// BAD: Circular imports
```

## Dependency Injection

```go
// GOOD: Inject dependencies via constructor
func NewOrderService(repo OrderRepository, notifier Notifier) *OrderService {
    return &OrderService{repo: repo, notifier: notifier}
}

// BAD: Mutable global variables as dependencies
var globalDB *sql.DB // BAD
```

## Naming

- Single-method interfaces: method name + `er` (Reader, Writer, Closer)
- Exported names: descriptive PascalCase (`ProcessPayment`, not `Process`)
- Unexported: camelCase (`processPayment`)
- Avoid obscure abbreviations (`usr` → `user`, `cfg` → `config`)
