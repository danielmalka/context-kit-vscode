<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# PHP — Security

Mandatory security rules. BLOCKER on Gate 4 if violated.

## SQL Injection

```php
// GOOD: Always use prepared statements — PDO or ORM
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);

// GOOD: With Doctrine
$user = $this->em->createQuery('SELECT u FROM User u WHERE u.email = :email')
    ->setParameter('email', $email)
    ->getOneOrNullResult();

// BLOCKER: concatenation or interpolation in queries
$sql = "SELECT * FROM users WHERE email = '$email'"; // BAD
$sql = "SELECT * FROM users WHERE email = " . $email; // BAD
```

## XSS (Cross-Site Scripting)

```php
// GOOD: Escape output in templates
// Twig: automatic with {{ }}
{{ user.name }}  // escaped automatically

// Plain PHP: htmlspecialchars
echo htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8');

// BLOCKER: echoing user input directly
echo $_GET['name']; // BAD
echo $request->get('name'); // BAD: without sanitization
```

## CSRF

```php
// GOOD: CSRF token on every form that mutates state
// Laravel: @csrf in the view, automatic verification
// Symfony: CsrfTokenManager

// GOOD: Verify the token on the server, not just the client
```

## Authentication and Passwords

```php
// GOOD: password_hash() for passwords
$hash = password_hash($password, PASSWORD_ARGON2ID);

// GOOD: password_verify() for verification
if (!password_verify($password, $storedHash)) {
    throw new AuthenticationException('Invalid credentials');
}

// BLOCKER: md5/sha1/sha256 for passwords
$hash = md5($password); // BAD
```

## Secrets and Configuration

```php
// GOOD: Environment variables, never hardcoded
$dsn = $_ENV['DATABASE_URL'];

// GOOD: .env in .gitignore, .env.example in the repo
// GOOD: Use symfony/dotenv or vlucas/phpdotenv

// BLOCKER: credentials in code
$pdo = new PDO('mysql:host=prod-db', 'root', 'password123'); // BAD — gitleaks:allow
```

## File Uploads

```php
// GOOD: Validate MIME type on the server (don't trust the client)
$finfo = new \finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($_FILES['upload']['tmp_name']);
$allowed = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($mimeType, $allowed, strict: true)) {
    throw new \InvalidArgumentException('Invalid file type');
}

// GOOD: Rename the file on the server — never use the original name
$filename = bin2hex(random_bytes(16)) . '.jpg';

// GOOD: Store outside the webroot or use presigned URLs
```

## Path Traversal

```php
// GOOD: Normalize and validate paths
$realPath = realpath($basePath . '/' . $userInput);
if ($realPath === false || !str_starts_with($realPath, $basePath)) {
    throw new \InvalidArgumentException('Invalid path');
}
```

## Security Review Checklist (PHP)

- [ ] Zero queries with variable concatenation/interpolation
- [ ] Zero secrets in code — everything in environment variables
- [ ] HTML output always escaped with htmlspecialchars or a template engine
- [ ] password_hash/password_verify for passwords (never md5/sha1)
- [ ] CSRF tokens on all mutating forms
- [ ] Uploads validated by MIME type on the server
- [ ] No direct echo/print of user input
