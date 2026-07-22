<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# Python — Testing

Mandatory testing patterns for Python projects in the SDD framework.

## Structure

```
tests/
├── unit/
│   └── domain/
│       └── test_payment_service.py
├── integration/
│   └── repository/
│       └── test_user_repository.py
└── e2e/
    └── test_payment_flow.py

conftest.py   ← shared fixtures
pytest.ini    ← configuration
```

## pytest — Base Structure

```python
import pytest
from unittest.mock import MagicMock, patch

class TestPaymentService:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.gateway = MagicMock(spec=PaymentGateway)
        self.sut = PaymentService(gateway=self.gateway)

    def test_processes_valid_payment(self):
        self.gateway.charge.return_value = ChargeResult(status="approved")

        result = self.sut.process(PaymentRequest(amount=100, currency="BRL"))

        assert result.status == "approved"
        self.gateway.charge.assert_called_once_with(100)

    def test_raises_when_amount_is_zero(self):
        with pytest.raises(ValueError, match="Amount cannot be negative"):
            self.sut.process(PaymentRequest(amount=0, currency="BRL"))
```

## Parametrize (Mandatory for multiple scenarios)

```python
@pytest.mark.parametrize("amount,expected_error", [
    (0, "Amount cannot be negative"),
    (-100, "Amount cannot be negative"),
    (999999999, "Amount exceeds maximum"),
])
def test_rejects_invalid_amounts(amount: int, expected_error: str):
    with pytest.raises(ValueError, match=expected_error):
        PaymentService().process(PaymentRequest(amount=amount))
```

## Fixtures

```python
# conftest.py
import pytest

@pytest.fixture
def valid_payment_request() -> PaymentRequest:
    return PaymentRequest(amount=100, currency="BRL")

@pytest.fixture
def mock_gateway() -> MagicMock:
    gateway = MagicMock(spec=PaymentGateway)
    gateway.charge.return_value = ChargeResult(status="approved")
    return gateway

# Usage:
def test_payment_flow(valid_payment_request, mock_gateway):
    service = PaymentService(gateway=mock_gateway)
    result = service.process(valid_payment_request)
    assert result.status == "approved"
```

## Mocks with unittest.mock

```python
from unittest.mock import MagicMock, patch, AsyncMock

# MagicMock with spec — fails if the method doesn't exist on the interface
repo = MagicMock(spec=UserRepository)
repo.find_by_id.return_value = User(id="1", name="Daniel")

# patch as a decorator — for global dependencies
@patch("app.services.payment.stripe_client")
def test_with_stripe_patch(mock_stripe):
    mock_stripe.charge.return_value = {"status": "success"}
    ...

# AsyncMock for coroutines
async_repo = AsyncMock(spec=AsyncUserRepository)
```

## Database Integration Tests

```python
# pytest-postgresql or testcontainers
import pytest
from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def postgres():
    with PostgresContainer("postgres:15") as container:
        yield container

@pytest.fixture
def db_session(postgres):
    engine = create_engine(postgres.get_connection_url())
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.rollback()
    session.close()
```

## Naming

```
test_[does_something]_[under_condition]
test_[does_something]_[expected_result]

test_process_payment_returns_approved_for_valid_input
test_process_payment_raises_value_error_for_zero_amount
test_find_user_returns_none_when_not_found
```

## Coverage

`check-strict` enforces the floor via `COVERAGE_MIN` (default 80, see `verifications/Makefile`). To check locally with the same threshold:

```bash
pytest --cov=src --cov-report=html --cov-fail-under=$COVERAGE_MIN
```

`pytest.ini`:
```ini
[pytest]
addopts = --strict-markers -v
testpaths = tests
markers =
    unit: unit tests
    integration: integration tests (require external services)
    e2e: end-to-end tests
```

## Anti-Patterns

- BAD: `time.sleep()` in tests — use freezegun or monkeypatch of `datetime`
- BAD: Tests that mutate global state (`sys.path`, module-level variables)
- BAD: MagicMock without `spec=` — doesn't validate that the method exists
- BAD: Fixtures with the wrong scope (session when it should be function)
- BAD: Testing implementation (private methods) instead of behavior
