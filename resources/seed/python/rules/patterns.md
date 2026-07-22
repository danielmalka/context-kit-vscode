<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# Python — Patterns

Mandatory idiomatic patterns for Python projects in the SDD framework.

## Type Hints (Mandatory)

```python
# GOOD: Type hints on all public functions
from typing import Optional
from collections.abc import Sequence

def process_payment(request: PaymentRequest) -> PaymentResult:
    ...

def find_user(email: str) -> Optional[User]:
    ...

def batch_process(items: Sequence[Item]) -> list[Result]:
    ...

# GOOD: Dataclasses for data structures
from dataclasses import dataclass, field

@dataclass(frozen=True)  # frozen = immutable
class Money:
    amount: int  # cents
    currency: str

    def __post_init__(self) -> None:
        if self.amount < 0:
            raise ValueError("Amount cannot be negative")
```

## Dependency Injection

```python
# GOOD: Inject dependencies through the constructor
class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        payment_gateway: PaymentGateway,
        event_bus: EventBus,
    ) -> None:
        self._order_repo = order_repo
        self._payment_gateway = payment_gateway
        self._event_bus = event_bus

# GOOD: Use Protocol for interfaces (Python 3.8+)
from typing import Protocol

class UserRepository(Protocol):
    def find_by_id(self, user_id: str) -> Optional[User]: ...
    def save(self, user: User) -> None: ...
```

## Exceptions

```python
# GOOD: Domain-specific exceptions
class UserNotFoundError(DomainError):
    pass

class InsufficientFundsError(DomainError):
    def __init__(self, required: Money, available: Money) -> None:
        self.required = required
        self.available = available
        super().__init__(f"Need {required}, have {available}")

# GOOD: Never swallow exceptions silently
try:
    result = gateway.charge(amount)
except PaymentDeclinedError as e:
    raise OrderFailedError("Payment declined") from e

# BAD: Never a silent generic catch
except Exception:
    pass  # BAD
```

## Context Managers

```python
# GOOD: Use context managers for resources
with database.transaction() as txn:
    txn.save(order)
    txn.publish_event(OrderCreated(order.id))
# transaction committed or rolled back automatically

# GOOD: Implement __enter__/__exit__ or use @contextmanager
from contextlib import contextmanager

@contextmanager
def timer(name: str):
    start = time.monotonic()
    try:
        yield
    finally:
        elapsed = time.monotonic() - start
        logger.info(f"{name} took {elapsed:.3f}s")
```

## Modules and Organization

```
src/
├── domain/          ← entities, value objects, interfaces
│   ├── payment/
│   │   ├── __init__.py
│   │   ├── entities.py
│   │   ├── repository.py  ← Protocol/ABC
│   │   └── service.py
├── infra/           ← concrete implementations
│   └── payment/
│       └── stripe_gateway.py
└── api/             ← controllers/handlers
    └── payment/
        └── routes.py
```

## Naming

- Classes: PascalCase (`PaymentService`, `UserRepository`)
- Functions/methods: snake_case (`process_payment`, `find_by_id`)
- Constants: UPPER_SNAKE (`MAX_RETRY_COUNT = 3`)
- Modules: snake_case (`payment_service.py`)
- Private: `_` prefix (`_internal_method`)

## SOLID in Python

```python
# Single Responsibility: one class, one reason to change
# Open/Closed: extend via Protocol/ABC, not modification
# Liskov: Protocol guarantees safe substitution
# Interface Segregation: small, cohesive Protocols
# Dependency Inversion: depend on Protocol, not concrete implementation
```
