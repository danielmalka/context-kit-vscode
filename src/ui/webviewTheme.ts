/** Shared CSS using VS Code theme tokens for extension webviews. */
export function webviewBaseStyles(): string {
  return `
:root {
  color-scheme: light dark;
  --bg: var(--vscode-editor-background);
  --fg: var(--vscode-editor-foreground);
  --muted: var(--vscode-descriptionForeground);
  --border: var(--vscode-panel-border, var(--vscode-widget-border));
  --btn: var(--vscode-button-background);
  --btn-fg: var(--vscode-button-foreground);
  --btn-hover: var(--vscode-button-hoverBackground);
  --secondary: var(--vscode-button-secondaryBackground);
  --secondary-fg: var(--vscode-button-secondaryForeground);
  --input-bg: var(--vscode-input-background);
  --input-fg: var(--vscode-input-foreground);
  --badge: var(--vscode-badge-background);
  --badge-fg: var(--vscode-badge-foreground);
  --focus: var(--vscode-focusBorder);
  --list-hover: var(--vscode-list-hoverBackground);
  --error: var(--vscode-errorForeground);
  --ok: var(--vscode-testing-iconPassed, #3fb950);
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  background: var(--bg);
  color: var(--fg);
}
body { padding: 16px 18px 28px; }
h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.02em; }
h2 { font-size: 0.95rem; font-weight: 600; margin: 20px 0 8px; color: var(--fg); }
.sub { color: var(--muted); margin: 0 0 16px; font-size: 0.9rem; line-height: 1.4; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
button {
  appearance: none;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font: inherit;
  cursor: pointer;
  background: var(--btn);
  color: var(--btn-fg);
}
button:hover { background: var(--btn-hover); }
button.secondary {
  background: var(--secondary);
  color: var(--secondary-fg);
}
button:focus-visible { outline: 1px solid var(--focus); outline-offset: 1px; }
button:disabled { opacity: 0.5; cursor: default; }
.card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: color-mix(in srgb, var(--bg) 92%, var(--fg));
}
.card:hover { background: var(--list-hover); }
.card-title { font-weight: 600; margin: 0 0 4px; }
.meta { color: var(--muted); font-size: 0.85rem; line-height: 1.35; word-break: break-all; }
.badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--badge);
  color: var(--badge-fg);
  margin-right: 6px;
}
.badge.running { background: color-mix(in srgb, var(--ok) 35%, var(--badge)); }
.badge.error { color: var(--error); }
.actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--border); }
th { color: var(--muted); font-weight: 500; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.dot.yes { background: var(--ok); }
.dot.no { background: var(--muted); opacity: 0.5; }
.empty { color: var(--muted); padding: 24px 8px; text-align: center; }
code { font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
