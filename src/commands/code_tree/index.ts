import * as vscode from "vscode";
import { XkCoderTreeNode } from "./typing";
import NodeFlowsUtil from "./nodeFlowsUtil";
import { NodeFlowsView } from "./nodeFlowsView";
// import { compress } from "lzutf8";
import { pack } from "lzwcompress";

export default class NodeFlowCommands {
  constructor(context: vscode.ExtensionContext) {
    this.init(context);
  }

  init(context) {
    const nodeFlowsView = new NodeFlowsView();
    vscode.commands.registerCommand("XkCoderPlugin.refreshCodeTree", () => {
      vscode.window.showInformationMessage(`XkCoderPlugin called refresh.`);
      nodeFlowsView.reset();
    });

    // 需要左边 XkCoderPlugin 面板打开才执行
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderPlugin.getCodeTreeNode",
        async () => {
          const editor = vscode.window.activeTextEditor;
          const node = await NodeFlowsUtil.getEditorCursorKReactFlowNode(
            editor
          );
          if (node) {
            const text = JSON.stringify({
              ...node,
              filePattern: node.filePattern,
            });
            vscode.env.clipboard.writeText(
              JSON.stringify(
                { text: "节点描述", lzwcompress: pack(text).join("-") },
                null,
                2
              )
            );
            vscode.window.showInformationMessage(
              `Successfully wrote into clipboard.`
            );
          } else {
            vscode.window.showErrorMessage(
              `Get XkCoderPlugin Node Code failed`
            );
          }
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderPlugin.editCodeTreeNode",
        async (selectedNode: XkCoderTreeNode) => {
          if (!selectedNode) {
            return;
          }
          const data =
            nodeFlowsView.treeDataProvider.topRequirePath(selectedNode);
          vscode.workspace.openTextDocument(data.requirePath).then((doc) => {
            vscode.window.showTextDocument(doc).then((editor) => {
              const line = NodeFlowsUtil.findNodeLine(selectedNode, doc);
              if (line !== null) {
                var newSelection = new vscode.Selection(
                  new vscode.Position(line, 0),
                  new vscode.Position(line, 0)
                );
                editor.selection = newSelection;
                editor.revealRange(
                  new vscode.Range(newSelection.anchor, newSelection.active)
                );
              }
            });
          });
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderPlugin.openCodeNodeDocumentInBroswer",
        this.openCodeNodeDocumentInBroswer.bind(this)
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderPlugin.openCodeNodeGitlabInBroswer",
        this.openCodeNodeGitlabInBroswer.bind(this)
      )
    );
  }
  openCodeNodeDocumentInBroswer(selectedNode: XkCoderTreeNode) {
    if (selectedNode && selectedNode.document) {
      vscode.env.openExternal(vscode.Uri.parse(selectedNode.document));
    }
  }

  openCodeNodeGitlabInBroswer() {}
}
