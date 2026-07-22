---
name: threat-model
description: STRIDE worksheet for threat modeling before implementing features that handle authentication, authorization, sensitive data, or external integrations.
---

# Threat Model — STRIDE Worksheet

Use this template BEFORE implementing any feature that:
- Authenticates or authorizes users
- Stores or transmits sensitive data
- Integrates with external systems
- Exposes APIs or webhooks
- Processes files or commands

---

## 1. Feature surface

**What this feature does (1 paragraph):**
_[describe]_

**Actors involved:**
- Legitimate users: _[user types and permissions]_
- External systems: _[APIs, webhooks, queues]_
- Data handled: _[data types, sensitivity]_

**Entry points:**
- _[HTTP endpoint, parameter, file, env var]_

**Exit points (sinks):**
- _[database, file, external API, HTML render, command exec]_

---

## 2. STRIDE analysis

For each threat, answer: **Does it exist?** → **How to mitigate?** → **Mitigation implemented?**

### S — Spoofing
| Threat | Exists? | Mitigation | Implemented? |
|--------|---------|-----------|---------------|
| Attacker impersonates a legitimate user | | | |
| Forged or replayed token/session | | | |
| Unverified webhook origin | | | |

### T — Tampering
| Threat | Exists? | Mitigation | Implemented? |
|--------|---------|-----------|---------------|
| Input tampered with before reaching the server | | | |
| Data in transit modified (no TLS) | | | |
| Query parameter altered to access another user's resource | | | |

### R — Repudiation
| Threat | Exists? | Mitigation | Implemented? |
|--------|---------|-----------|---------------|
| Critical action with no audit trail | | | |
| Log alterable by the user themselves | | | |

### I — Information Disclosure
| Threat | Exists? | Mitigation | Implemented? |
|--------|---------|-----------|---------------|
| Stack trace exposed in production | | | |
| Response reveals existence of an unauthorized resource | | | |
| Log contains PII or a secret | | | |
| Differentiated error for user vs. nonexistent resource | | | |

### D — Denial of Service
| Threat | Exists? | Mitigation | Implemented? |
|--------|---------|-----------|---------------|
| Endpoint with no rate limiting | | | |
| Input causing O(n²) processing or unbounded allocation | | | |
| Upload with no size limit | | | |

### E — Elevation of Privilege
| Threat | Exists? | Mitigation | Implemented? |
|--------|---------|-----------|---------------|
| Missing permission check on an endpoint | | | |
| IDOR (access to another user's resource via manipulated ID) | | | |
| Privileged operation reachable via a parameter | | | |

---

## 3. Design decisions

For each threat with a pending mitigation, decide:

- **Accept:** risk documented and justified
- **Mitigate:** implement a control before launch
- **Transfer:** control at another layer (firewall, WAF)
- **Eliminate:** remove the feature or the risk

---

## 4. Pre-implementation checklist

- [ ] All STRIDE threats analyzed
- [ ] Critical mitigations (S, E) implemented or planned
- [ ] Log auditing defined for sensitive actions
- [ ] Rate limiting planned for public endpoints
- [ ] Security review scheduled (security-review after implementation)
