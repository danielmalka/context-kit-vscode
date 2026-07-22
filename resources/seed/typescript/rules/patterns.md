# TypeScript — Patterns

Mandatory idiomatic patterns for TypeScript/Node projects within the SDD harness.

## Types first

```ts
// GOOD: explicit public API types; narrow at boundaries
export function parseSlug(raw: unknown): string {
  if (typeof raw !== "string" || !/^[a-z0-9-]+$/.test(raw)) {
    throw new Error("invalid slug");
  }
  return raw;
}

// GOOD: discriminated unions over booleans + optional fields
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

// BAD: any / unknown without narrowing
function handle(x: any) {
  return x.foo.bar;
}
```

## Modules and structure

- Prefer small modules with a single export surface (`types.ts`, `parse.ts`, `scan.ts`).
- Keep side effects (fs, network, VS Code API) at the edges; pure logic in `domain/`.
- Dependency direction: `ui → publish/library → domain` — domain never imports vscode.

## Async and errors

```ts
// GOOD: async/await + typed failure at the boundary
async function readConfig(path: string): Promise<Config> {
  try {
    const raw = await fs.promises.readFile(path, "utf8");
    return parseConfig(raw);
  } catch (e) {
    throw new Error(`readConfig ${path}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// BAD: floating promises
doWork(); // must await or void with intent
```

## Immutability and data

- Prefer `readonly` properties and `ReadonlyArray<T>` for shared structures.
- Prefer spreading new objects over mutating shared state across modules.
- Config objects over long positional argument lists (>3 params).

## Exhaustiveness

```ts
// GOOD: switch on discriminated union with never check
function label(kind: "skill" | "command"): string {
  switch (kind) {
    case "skill":
      return "Skill";
    case "command":
      return "Command";
    default: {
      const _x: never = kind;
      return _x;
    }
  }
}
```

## VS Code / extension hosts (when applicable)

- `vscode` is only imported from `extension.ts` and `ui/*` (or a thin adapter).
- Never bundle `vscode` — mark it `external` in the bundler.
- Prefer `workspace.fs` when writing tests that must stay host-agnostic is hard; for pure logic, inject `fs` or paths.

## Forbidden

- `as any` / `@ts-ignore` / `@ts-expect-error` without a one-line justification
- `var`
- Default exports for domain modules (named exports only — easier refactors)
- Deep relative imports that skip the public module boundary (`../../../`) when a path alias or local barrel would clarify — prefer shallow trees over barrels-for-everything
