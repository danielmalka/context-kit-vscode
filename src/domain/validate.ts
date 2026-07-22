export interface ValidationIssue {
  level: "error" | "warning";
  message: string;
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function isValidSlug(name: string): boolean {
  return SLUG_RE.test(name);
}

export function validateSkillMeta(input: {
  name: string;
  description?: string;
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!input.name) {
    issues.push({ level: "error", message: "name is required" });
  } else if (!isValidSlug(input.name)) {
    issues.push({
      level: "error",
      message:
        "name must be a slug: lowercase letters, digits, hyphens; 2–64 chars; start/end alnum",
    });
  }
  if (!input.description || !input.description.trim()) {
    issues.push({
      level: "warning",
      message: "description is empty — auto-invoke / discovery will be weak",
    });
  }
  return issues;
}
