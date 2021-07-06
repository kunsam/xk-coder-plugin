import * as vscode from "vscode";

interface TreeNode {
  text: string;
  parent?: TreeNode;
  children?: TreeNode[];
}

export class PluginTreeDataProvider implements vscode.TreeDataProvider<TreeNode> {
  private _tree: TreeNode[];
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeNode | undefined
  > = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined> = this
    ._onDidChangeTreeData.event;

  constructor(tree: TreeNode[]) {
    tree.forEach(ct => {
      this._initTree(ct);
    });
    this._tree = tree;
  }
  private _initTree(element: TreeNode) {
    if (element.children && element.children.length) {
      element.children.forEach(c => {
        c.parent = element;
        this._initTree(c);
      });
    }
  }
  public getChildren(element: TreeNode) {
    if (!element) return this._tree;
    return element.children || [];
  }
  public getTreeItem(element: TreeNode): vscode.TreeItem {
    return {
      label: element.text,
      collapsibleState:
        element.children && element.children.length
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None
    };
  }
  public getParent(element: TreeNode) {
    return element.parent;
  }
  public refresh() {
    this._onDidChangeTreeData.fire();
  }
}
