import * as vscode from "vscode";
import type { CatalogAsset, AssetKind } from "../domain/types";

type TreeNode = CategoryNode | AssetNode;

class CategoryNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly kind: AssetKind | "scope",
    public readonly children: TreeNode[],
    collapsible: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded,
  ) {
    super(label, collapsible);
    this.contextValue = "category";
    this.iconPath = new vscode.ThemeIcon("folder");
  }
}

class AssetNode extends vscode.TreeItem {
  constructor(public readonly asset: CatalogAsset) {
    super(asset.name, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "asset";
    this.description = asset.userEdited ? "edited" : (asset.origin ?? asset.scope);
    this.tooltip = asset.description ?? asset.absolutePath;
    this.command = {
      command: "contextKit.openAsset",
      title: "Open",
      arguments: [asset],
    };
    this.iconPath = new vscode.ThemeIcon(
      asset.kind === "skill"
        ? "lightbulb"
        : asset.kind === "command"
          ? "terminal"
          : asset.kind === "agent"
            ? "person"
            : asset.kind === "workflow"
              ? "type-hierarchy"
              : asset.kind === "checklist"
                ? "checklist"
                : asset.userEdited
                  ? "edit"
                  : "file",
    );
    if (asset.userEdited) {
      this.description = "edited · " + (asset.scope === "library" ? "library" : "workspace");
    }
  }
}

export class CatalogTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChange = new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  private assets: CatalogAsset[] = [];

  refresh(assets: CatalogAsset[]): void {
    this.assets = assets;
    this._onDidChange.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      const library = this.assets.filter((a) => a.scope === "library");
      const workspace = this.assets.filter((a) => a.scope === "workspace");
      return [
        new CategoryNode(`Library (${library.length})`, "scope", this.byKind(library)),
        new CategoryNode(
          `Workspace .harness (${workspace.length})`,
          "scope",
          this.byKind(workspace),
          workspace.length
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.Collapsed,
        ),
      ];
    }
    if (element instanceof CategoryNode) {
      return element.children;
    }
    return [];
  }

  private byKind(assets: CatalogAsset[]): TreeNode[] {
    const groups = new Map<AssetKind, CatalogAsset[]>();
    for (const a of assets) {
      const list = groups.get(a.kind) ?? [];
      list.push(a);
      groups.set(a.kind, list);
    }
    const order: AssetKind[] = [
      "skill",
      "command",
      "agent",
      "checklist",
      "template",
      "rule",
      "prompt",
      "workflow",
    ];
    const nodes: TreeNode[] = [];
    for (const kind of order) {
      const list = groups.get(kind);
      if (!list?.length) continue;
      nodes.push(
        new CategoryNode(
          `${kind}s (${list.length})`,
          kind,
          list.map((a) => new AssetNode(a)),
          vscode.TreeItemCollapsibleState.Collapsed,
        ),
      );
    }
    return nodes;
  }
}
