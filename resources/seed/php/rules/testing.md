<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# PHP — Testing

Mandatory testing standards for PHP projects in the SDD framework.

## Structure

```
tests/
├── Unit/           ← unit tests without I/O
│   └── Domain/
│       └── PaymentServiceTest.php
├── Integration/    ← tests with database, queue, etc.
│   └── Repository/
│       └── UserRepositoryTest.php
└── Feature/        ← end-to-end HTTP tests
    └── PaymentControllerTest.php
```

## PHPUnit — Base Structure

```php
namespace Tests\Unit\Domain;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

final class PaymentServiceTest extends TestCase
{
    private PaymentService $sut;
    private MockObject $gateway;

    protected function setUp(): void
    {
        $this->gateway = $this->createMock(PaymentGateway::class);
        $this->sut = new PaymentService($this->gateway);
    }

    #[Test]
    public function it_processes_valid_payment(): void
    {
        $this->gateway
            ->expects($this->once())
            ->method('charge')
            ->willReturn(new ChargeResult('approved'));

        $result = $this->sut->process(new PaymentRequest(amount: 100));

        $this->assertSame('approved', $result->status);
    }

    #[Test]
    #[DataProvider('invalidAmounts')]
    public function it_rejects_invalid_amount(int $amount): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->sut->process(new PaymentRequest(amount: $amount));
    }

    public static function invalidAmounts(): array
    {
        return [
            'zero' => [0],
            'negative' => [-100],
        ];
    }
}
```

## Mocks with PHPUnit

```php
// GOOD: createMock for interfaces
$repo = $this->createMock(UserRepository::class);
$repo->method('findById')->willReturn(new User(id: '1', name: 'Daniel'));

// GOOD: expects() to verify the method was called
$repo->expects($this->once())->method('save');

// GOOD: Mockery for expressive mocks
$mock = Mockery::mock(PaymentGateway::class);
$mock->shouldReceive('charge')->once()->with(100)->andReturn('approved');
```

## Feature Tests (HTTP)

```php
// Laravel
final class CreateOrderTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function authenticated_user_can_create_order(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/orders', [
                'product_id' => 'prod_123',
                'quantity' => 2,
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'pending');
        $this->assertDatabaseHas('orders', ['user_id' => $user->id]);
    }
}
```

## Naming

```
[Context]Test.php

Methods: it_[does_something]_[when_condition]
or:      test[DoesSomething]_[condition]

it_processes_valid_payment
it_rejects_payment_when_amount_is_zero
it_throws_not_found_when_user_does_not_exist
```

## Coverage with Xdebug/PCOV

```bash
XDEBUG_MODE=coverage vendor/bin/phpunit --coverage-html coverage/
```

Minimums (see harness/checklist-code.md):
- Domain/Services: ≥ 90%
- Controllers: ≥ 80%
- Repositories (integration): ≥ 70%

## Anti-Patterns

- BAD: Tests that depend on pre-existing data in the database (use factories/fixtures)
- BAD: `sleep()` in tests — use fake timers or Carbon::setTestNow()
- BAD: Tests without assertions (`$this->assertTrue(true)`)
- BAD: Sharing state between tests via static properties
- BAD: Testing internal implementation instead of behavior
