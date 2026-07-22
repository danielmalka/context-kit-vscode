<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# PHP — Patterns

Mandatory idiomatic patterns for PHP projects within the SDD framework.

## PSR Standards

```php
// GOOD: PSR-4: Autoloading — namespaces mirror folder structure
namespace App\Domain\Payment;

class PaymentService { ... }
// src/Domain/Payment/PaymentService.php

// GOOD: PSR-12: Coding Style — use PHP-CS-Fixer or PHPCS
// GOOD: PSR-7: HTTP Messages (if using your own HTTP framework)
// GOOD: PSR-11: Container Interface for DI
```

## Type Declarations (PHP 8+)

```php
// GOOD: Always declare types on parameters and return values
function processPayment(PaymentRequest $request): PaymentResult
{
    // ...
}

// GOOD: Nullable with ?
function findUser(?string $email): ?User { ... }

// GOOD: Union types when needed (PHP 8)
function format(int|float $value): string { ... }

// BAD: Avoid mixed — specify the type
function process(mixed $data): mixed { } // BAD
```

## Dependency Injection

```php
// GOOD: Inject dependencies through the constructor
final class OrderService
{
    public function __construct(
        private readonly OrderRepository $orders,
        private readonly PaymentGateway $gateway,
        private readonly EventDispatcher $events,
    ) {}
}

// BAD: new inside classes (couples to the concrete implementation)
class OrderService {
    private $repo;
    public function __construct() {
        $this->repo = new MySQLOrderRepository(); // BAD
    }
}
```

## Repository Pattern

```php
// GOOD: Interface in the domain, implementation in the infrastructure
interface UserRepository
{
    public function findById(string $id): ?User;
    public function save(User $user): void;
}

// Implementation:
class DoctrineUserRepository implements UserRepository
{
    public function findById(string $id): ?User
    {
        return $this->em->find(User::class, $id);
    }
}
```

## Value Objects

```php
// GOOD: Use Value Objects for domain concepts
final class Money
{
    public function __construct(
        private readonly int $amount,    // in cents
        private readonly string $currency,
    ) {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Amount cannot be negative');
        }
    }

    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \LogicException('Cannot add different currencies');
        }
        return new self($this->amount + $other->amount, $this->currency);
    }
}
```

## Exceptions

```php
// GOOD: Domain-specific exceptions
class UserNotFoundException extends DomainException {}
class InsufficientFundsException extends DomainException {}

// GOOD: Never use the generic Exception in domain code
// GOOD: Catch specific exceptions, never a silent generic catch
try {
    $this->gateway->charge($amount);
} catch (PaymentDeclinedException $e) {
    // handle specifically
    throw new OrderFailedException($e->getMessage(), previous: $e);
}

// BAD: Catch and silence
} catch (\Exception $e) { } // BAD
```

## Naming

- Classes: PascalCase (`PaymentService`, `OrderRepository`)
- Methods: camelCase, verbs (`processPayment`, `findById`)
- Interfaces: no `I` prefix — use a suffix if needed (`UserRepository`, not `IUserRepository`)
- `final` by default, remove it only when inheritance is intentional
