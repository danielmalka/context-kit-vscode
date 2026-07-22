<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# Go — Testing

Mandatory testing patterns for Go projects in the SDD framework.

## File Structure

```
package/
├── service.go
├── service_test.go      ← unit tests (same package or _test)
└── service_integration_test.go  ← integration tests (build tag)
```

## Table-Driven Tests (Mandatory)

```go
func TestProcessPayment(t *testing.T) {
    tests := []struct {
        name    string
        input   PaymentRequest
        want    *PaymentResult
        wantErr bool
    }{
        {
            name:  "valid payment",
            input: PaymentRequest{Amount: 100, Currency: "BRL"},
            want:  &PaymentResult{Status: "approved"},
        },
        {
            name:    "zero amount",
            input:   PaymentRequest{Amount: 0},
            wantErr: true,
        },
        {
            name:    "invalid currency",
            input:   PaymentRequest{Amount: 100, Currency: "XXX"},
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ProcessPayment(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
            }
            if !tt.wantErr && !reflect.DeepEqual(got, tt.want) {
                t.Errorf("got=%v, want=%v", got, tt.want)
            }
        })
    }
}
```

## Mocks via Interfaces

```go
// GOOD: Mock via interface — no external frameworks required
type MockUserRepository struct {
    FindByIDFunc func(ctx context.Context, id string) (*User, error)
}

func (m *MockUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    return m.FindByIDFunc(ctx, id)
}

// Or with testify/mock:
type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    args := m.Called(ctx, id)
    return args.Get(0).(*User), args.Error(1)
}
```

## Testify (Readable Assertions)

```go
import "github.com/stretchr/testify/assert"
import "github.com/stretchr/testify/require"

// require: fails immediately (use for preconditions)
require.NoError(t, err)
require.NotNil(t, result)

// assert: continues after failure (use for multiple checks)
assert.Equal(t, "approved", result.Status)
assert.Equal(t, 100, result.Amount)
```

## Integration Tests

```go
//go:build integration

package service_test

func TestCreateOrder_Integration(t *testing.T) {
    // setup real DB (or testcontainers)
    db := setupTestDB(t)
    defer cleanupDB(t, db)

    // test with real state
}
```

Run: `go test -tags=integration ./...`

## Test Naming

```
Test[FuncName]_[Scenario]_[ExpectedResult]

TestProcessPayment_ZeroAmount_ReturnsError
TestProcessPayment_ValidInput_ReturnsApproved
TestFindUser_NotFound_ReturnsErrNotFound
```

## Coverage

```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Minimum per type (see harness/checklist-code.md)
# Check branch coverage, not just line coverage
```

## Anti-Patterns

- BAD: `TestMain` with global state shared between tests
- BAD: Tests that depend on execution order
- BAD: Sleep in tests (`time.Sleep`) — use channels or polling with a timeout
- BAD: Tests without `t.Parallel()` when they could be parallel
- BAD: Mock that always returns success without testing the error path
