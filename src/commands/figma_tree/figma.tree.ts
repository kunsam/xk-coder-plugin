import * as vscode from "vscode";
import { Figma, FigmaTreeNode } from "./figma.typing";

export class FigmaTree implements vscode.TreeDataProvider<FigmaTreeNode> {
  private _tree: FigmaTreeNode[];
  private _onDidChangeTreeData: vscode.EventEmitter<FigmaTreeNode | undefined> =
    new vscode.EventEmitter<FigmaTreeNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FigmaTreeNode | undefined> =
    this._onDidChangeTreeData.event;
  public readonly projectsData: Figma.ProjectData[];

  constructor(projects: Figma.ProjectData[]) {
    this.projectsData = projects;
    const tree: FigmaTreeNode[] = [];
    projects.forEach((data) => {
      const parent: FigmaTreeNode = {
        text: data.project.name,
        children: [],
        type: "project",
        id: data.project.id,
        projectId: data.project.id,
      };
      const children: FigmaTreeNode[] = data.files.map((file) => ({
        text: file.fileName,
        id: file.fileKey,
        type: "file",
        children: [],
        parent,
        projectId: data.project.id,
      }));
      parent.children = children;
      tree.push(parent);
    });
    this._tree = tree;
  }

  public getChildren(element: FigmaTreeNode) {
    if (!element) return this._tree;
    return element.children || [];
  }

  public getTreeItem(element: FigmaTreeNode): vscode.TreeItem {
    return {
      label: element.text,

      collapsibleState:
        element.children && element.children.length
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None,
    };
  }
  public getParent(element: FigmaTreeNode) {
    return element.parent;
  }
  public refresh() {
    this._onDidChangeTreeData.fire();
  }
}
