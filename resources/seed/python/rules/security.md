<!-- Ported from vault PowerAI/frameworks/sdd (2026-07-17). -->

# Python — Security

Mandatory security rules. BLOCKER at Gate 4 if violated.

## SQL Injection

```python
# GOOD: Always use parameters — SQLAlchemy, psycopg2, etc.
# SQLAlchemy ORM:
user = session.query(User).filter(User.email == email).first()

# SQLAlchemy Core / psycopg2:
result = conn.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
)

# BLOCKER: f-string or concatenation in queries
query = f"SELECT * FROM users WHERE email = '{email}'"  # BAD
query = "SELECT * FROM users WHERE email = '" + email + "'"  # BAD
```

## Secrets

```python
# GOOD: Read from environment variables
import os
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    api_key: str

    class Config:
        env_file = ".env"

# GOOD: .env in .gitignore, .env.example in the repo
# GOOD: python-dotenv or pydantic-settings to load them

# BLOCKER: hardcoded secrets
SECRET_KEY = "super-secret-key-123"  # BAD — gitleaks:allow
DATABASE_URL = "postgresql://root:password@prod-db/app"  # BAD — gitleaks:allow
```

## Passwords

```python
# GOOD: bcrypt or argon2-cffi for passwords
import bcrypt

hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
is_valid = bcrypt.checkpw(password.encode(), hashed)

# Or passlib
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
hashed = pwd_context.hash(password)

# BLOCKER: hashlib.md5/sha1/sha256 for passwords
import hashlib
hashed = hashlib.md5(password.encode()).hexdigest()  # BAD
```

## Secure Tokens

```python
# GOOD: secrets.token_urlsafe() for tokens
import secrets
token = secrets.token_urlsafe(32)

# BLOCKER: random for security tokens
import random
token = str(random.randint(100000, 999999))  # BAD
```

## Input Validation

```python
# GOOD: Pydantic for external data validation
from pydantic import BaseModel, validator, constr

class CreateUserRequest(BaseModel):
    email: str
    name: constr(min_length=1, max_length=100)
    age: int

    @validator('email')
    def email_must_be_valid(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v.lower()

# GOOD: Validate BEFORE processing — at the system boundary
```

## Path Traversal

```python
# GOOD: Use pathlib and validate it's within the allowed directory
from pathlib import Path

BASE_DIR = Path("/app/uploads").resolve()

def safe_path(user_input: str) -> Path:
    path = (BASE_DIR / user_input).resolve()
    if not path.is_relative_to(BASE_DIR):
        raise ValueError("Path traversal detected")
    return path
```

## Bandit (Static Analysis)

```bash
# GOOD: Run bandit on every PR
pip install bandit
bandit -r src/ -ll  # reports only medium and high severity
```

Common issues bandit detects:
- B101: use of assert in production code
- B108: insecure temp files
- B201: Flask debug=True
- B301/B302: pickle/marshal (insecure deserialization)
- B324: md5/sha1 for security

## Security Review Checklist (Python)

- [ ] Zero f-strings or concatenation in SQL queries
- [ ] Zero secrets in code — everything in environment variables
- [ ] bcrypt or argon2 for passwords (never hashlib for passwords)
- [ ] secrets.token_urlsafe() for tokens (never random)
- [ ] External inputs validated with Pydantic or equivalent
- [ ] bandit running with no high/medium severity issues
- [ ] Path traversal protected with pathlib + is_relative_to()
