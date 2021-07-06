import * as path from "path";
import * as vscode from "vscode";
import { XkCoderTreeNode } from "./typing";

export default class NodeFlowsUtil {
  static getEditorCursorText(editor: vscode.TextEditor) {
    const wordRange = editor.document.getWordRangeAtPosition(
      editor.selection.start
    );
    const text = editor.document.getText(wordRange);
    return text;
  }

  static async getEditorCursorKReactFlowNode(editor: vscode.TextEditor) {
    const wordRange = editor.document.getWordRangeAtPosition(
      editor.selection.start
    );
    if (!wordRange) return;
    const text = editor.document.getText(wordRange);
    if (text) {
      const findResult = await vscode.commands
        .executeCommand(
          "vscode.executeDocumentSymbolProvider",
          editor.document.uri
        )
        .then((result: vscode.SymbolInformation[]) => {
          result = result.filter((r) => {
            return r.location.range.contains(wordRange);
          });
          if (result.length === 1) {
            return result;
          }
        });
      if (findResult.length === 1) {
        if (findResult[0].location.range.isEqual(wordRange)) {
          return {
            // text: "节点描述",
            symbol: findResult[0].name,
            filePattern: path.relative(
              vscode.workspace.workspaceFolders[0].uri.path,
              editor.document.uri.path
            ),
          };
        } else {
          return {
            // text: "节点描述",
            symbol: findResult[0].name,
            filePattern: path.relative(
              vscode.workspace.workspaceFolders[0].uri.path,
              editor.document.uri.path
            ),
            textPattern: text,
          };
        }
      }
    }
    return undefined;
  }

  public static dump(element: XkCoderTreeNode) {
    let _element: any = {
      // _id: NodeFlowsUtil.elementId(element)
    };
    [
      "symbol",
      "text",
      "document",
      // 'children',
      "routers",
      "operationKeys",
      "textPattern",
      "filePattern",
      "requirePath",
    ].forEach((key) => {
      if (element[key]) {
        _element[key] = element[key];
      }
    });
    if (element.children && !element.requirePath) {
      _element.children = element.children.map((c) => ({
        // _id: NodeFlowsUtil.elementId(c),
        ...NodeFlowsUtil.dump(c),
      }));
    }
    return _element;
  }

  public static elementId(element: XkCoderTreeNode, useRandom = false) {
    return `${element.filePattern || ""}-${element.symbol || ""}-${
      element.textPattern || ""
    }-${element.text || ""}-${useRandom ? Math.random().toFixed(6) : ""}`;
  }

  public static isElementEqual(
    element: XkCoderTreeNode,
    element2: XkCoderTreeNode
  ) {
    return (
      NodeFlowsUtil.elementId(element) === NodeFlowsUtil.elementId(element2)
    );
  }

  public static findNodeLine(node: XkCoderTreeNode, doc: vscode.TextDocument) {
    const originTexts = new Array(doc.lineCount - 1).fill(null).map((_, i) => ({
      text: doc.lineAt(i + 1).text.replace(/\"\'/g, ""),
      line: i + 1,
    }));
    const filterArray = ["filePattern", "text", "symbol", "document"].filter(
      (a) => node[a]
    );
    let resultLine = null;
    let minResults = originTexts;
    filterArray.every((filter) => {
      const findByFilter = originTexts.filter(
        (t) =>
          !!(t.text && t.text.indexOf(node[filter].replace(/\"\'/g, "")) > 0)
      );
      if (findByFilter.length === 1) {
        resultLine = findByFilter[0].line;
        return false;
      }
      if (minResults.length > findByFilter.length) {
        minResults = findByFilter;
      }
      return resultLine === null;
    });
    if (
      resultLine === null &&
      minResults.length &&
      minResults.length !== originTexts.length
    ) {
      return minResults[0].line;
    }
    return resultLine;
  }
}
