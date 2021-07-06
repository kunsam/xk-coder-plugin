import * as vs from "vscode";
import * as ts from "typescript";
import { LanguageServiceHost } from "./languageServiceHost";
import * as utils from "../../utils/editor_util";
import { UnitTestStringBuilder } from "./unit_test_string_builder";
import { getFunctionEnumArgs } from "./argument_enumtor";
export class FuncParserX implements vs.Disposable {
  private _languageServiceHost: LanguageServiceHost;
  private _services: ts.LanguageService;
  constructor() {
    this._languageServiceHost = new LanguageServiceHost();

    this._services = ts.createLanguageService(
      this._languageServiceHost,
      ts.createDocumentRegistry()
    );
  }

  private _getSourceFile(document: vs.TextDocument) {
    const fileText = document.getText();
    const canonicalFileName = utils.getDocumentFileName(document);
    this._languageServiceHost.updateCurrentFile(canonicalFileName, fileText);

    this._services.getSyntacticDiagnostics(canonicalFileName);

    const sourceFile = this._services
      .getProgram()
      .getSourceFile(canonicalFileName);

    const newText = document.getText();
    sourceFile.update(newText, <ts.TextChangeRange>{
      newLength: newText.length,
      span: <ts.TextSpan>{
        start: 0,
        length: newText.length,
      },
    });

    return sourceFile;
  }

  writeUnitTestThis(
    editor: vs.TextEditor,
    commandName: string,
    forCompletion: boolean
  ) {
    const sourceFile = this._getSourceFile(editor.document);

    const selection = editor.selection;
    const caret = selection.start;

    const position = ts.getPositionOfLineAndCharacter(
      sourceFile,
      caret.line,
      caret.character
    );
    const node = utils.findChildForPosition(sourceFile, position);
    let documentNode = utils.nodeIsOfKind(node)
      ? node
      : utils.findFirstParent(node);

    if (
      documentNode &&
      documentNode.kind === ts.SyntaxKind.VariableDeclarationList
    ) {
      // extract VariableDeclaration from VariableDeclarationList
      documentNode = (<ts.VariableDeclarationList>documentNode).declarations[0];
    }

    if (!documentNode) {
      this._showFailureMessage(commandName, "at the current position");
      return;
    }

    const sb = new UnitTestStringBuilder();
    try {
      const docLocation = this._documentNode(sb, documentNode, sourceFile);
      if (docLocation) {
        this._insertDocumentation(sb, docLocation, editor, forCompletion);
      } else {
        this._showFailureMessage(commandName, "at the current position");
      }
    } catch (e) {
      console.log(e, "writeUnitTestThis");
    }
  }

  private _insertDocumentation(
    sb: UnitTestStringBuilder,
    location: ts.LineAndCharacter,
    editor: vs.TextEditor,
    forCompletion: boolean
  ) {
    const startPosition = new vs.Position(
      forCompletion ? location.line - 1 : location.line,
      location.character
    );
    const endPosition = new vs.Position(location.line, location.character);

    const range = new vs.Range(startPosition, endPosition);

    editor.insertSnippet(sb.toString(), range).then(() => {});
  }

  private _documentNode(
    sb: UnitTestStringBuilder,
    node: ts.Node,
    sourceFile: ts.SourceFile
  ): ts.LineAndCharacter | undefined {
    switch (node.kind) {
      case ts.SyntaxKind.CallSignature:
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.MethodSignature:
        this._emitMethodDeclaration(sb, <ts.MethodDeclaration>node);
        break;
      case ts.SyntaxKind.FunctionExpression:
      case ts.SyntaxKind.ArrowFunction: {
        return this._emitFunctionExpression(
          sb,
          <ts.FunctionExpression>node,
          sourceFile
        );
      }
      default: {
        return;
      }
    }
    return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  }

  private _emitFunctionExpression(
    sb: UnitTestStringBuilder,
    node: ts.FunctionExpression | ts.ArrowFunction,
    sourceFile: ts.SourceFile
  ) {
    let targetNode = node.parent;

    if (
      node.parent.kind !== ts.SyntaxKind.PropertyAssignment &&
      node.parent.kind !== ts.SyntaxKind.BinaryExpression &&
      node.parent.kind !== ts.SyntaxKind.PropertyDeclaration
    ) {
      targetNode = utils.findFirstParent(targetNode, [
        ts.SyntaxKind.VariableDeclarationList,
        ts.SyntaxKind.VariableDeclaration,
      ]);
      if (!targetNode) {
        return;
      }
    }
    // this._emitDescriptionHeader(sb);
    // this._emitAuthor(sb);
    // this._emitDate(sb);
    this._emitTypeParameters(sb, node);
    this._emitParameters(sb, node);
    this._emitReturns(sb, node);
    // this._emitMemberOf(sb, node.parent);
    return ts.getLineAndCharacterOfPosition(sourceFile, targetNode.getStart());
  }

  private _emitMethodDeclaration(
    sb: UnitTestStringBuilder,
    node: ts.MethodDeclaration | ts.FunctionDeclaration
  ) {
    // this._emitDescriptionHeader(sb);
    // this._emitAuthor(sb);
    // this._emitDate(sb);
    // this._emitModifiers(sb, node);
    this._emitTypeParameters(sb, node);
    this._emitParameters(sb, node);
    this._emitReturns(sb, node);
    // this._emitMemberOf(sb, node.parent);
  }

  private _showFailureMessage(commandName: string, condition: string) {
    vs.window.showErrorMessage(
      `Sorry! '${commandName}' wasn't able to produce documentation ${condition}.`
    );
  }

  private _emitTypeParameters(
    sb: UnitTestStringBuilder,
    node:
      | ts.ClassLikeDeclaration
      | ts.InterfaceDeclaration
      | ts.MethodDeclaration
      | ts.FunctionDeclaration
      | ts.FunctionExpression
      | ts.ArrowFunction
  ) {
    if (!node.typeParameters) {
      return;
    }
    console.log("node.typeParameters _emitTypeParameters", node.typeParameters);
    // node.typeParameters.forEach((parameter) => {
    //   sb.append(`@template ${parameter.name.getText()}`);
    //   sb.appendSnippetTabstop();
    //   sb.appendLine();
    // });
  }

  private _emitParameters(
    sb: UnitTestStringBuilder,
    node:
      | ts.MethodDeclaration
      | ts.FunctionDeclaration
      | ts.ConstructorDeclaration
      | ts.FunctionExpression
      | ts.ArrowFunction
      | ts.PropertyDeclaration
  ) {
    if (node.kind === ts.SyntaxKind.PropertyDeclaration) {
      const propertyChildren: ts.Node[] = node.getChildren();

      const arrowFunction: ts.Node = propertyChildren.find((child: ts.Node) => {
        return child.kind === ts.SyntaxKind.ArrowFunction;
      });

      if (!arrowFunction) {
        return;
      }

      const isArrowFunction: boolean = ts.isArrowFunction(arrowFunction);

      if (!isArrowFunction) {
        return;
      }

      this._generateParameters(sb, arrowFunction as ts.ArrowFunction);
    } else {
      if (!node.parameters) {
        return;
      }

      this._generateParameters(sb, node);
    }
  }

  private _generateParameters(
    sb: UnitTestStringBuilder,
    node:
      | ts.MethodDeclaration
      | ts.FunctionDeclaration
      | ts.ConstructorDeclaration
      | ts.FunctionExpression
      | ts.ArrowFunction
  ): void {
    console.log("node.parameters _generateParameters", node, node.parameters);

    const parametersDefaultValues = node.parameters.map(
      this._getParametersDefaultValue.bind(this)
    );
    console.log("parametersDefaultValues", parametersDefaultValues);
    node.parameters.forEach((parameter: any, parameteri) => {
      if (parameter.type && parameter.type.kind) {
        const args = getFunctionEnumArgs(
          parameter.type.kind,
          parameter.symbol.escapedName
        );
        const parametersValues = [...parametersDefaultValues];
        sb.insertArgTest(
          parameteri,
          (node as any).name.escapedText,
          args,
          (arg) => {
            parametersValues[parameteri] = arg;
            return parametersValues;
          }
        );
      }
    });
  }

  private _getDefaultValueByKind(kind: ts.SyntaxKind) {
    switch (kind) {
      case ts.SyntaxKind.NumberKeyword: {
        return 0;
      }
      case ts.SyntaxKind.NullKeyword: {
        return null;
      }
      case ts.SyntaxKind.StringKeyword: {
        return "";
      }
      case ts.SyntaxKind.FunctionType: {
        return function () {};
      }
    }
  }

  private _getDefaultValueByNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.NumberKeyword:
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.StringKeyword: {
        return this._getDefaultValueByKind(node.kind);
      }
      case ts.SyntaxKind.TypeLiteral: {
        let res = {};
        const findChildren: ts.TypeLiteralNode | undefined = node
          .getChildren()
          .find(
            (c) => c.kind === ts.SyntaxKind.TypeLiteral
          ) as ts.TypeLiteralNode;
        if (findChildren) {
          findChildren.members.forEach((mnode: any) => {
            res[mnode.name.escapedText] = this._getParametersDefaultValue(
              mnode as ts.ParameterDeclaration
            );
          });
          return res;
        }
        return res;
      }
    }
  }

  private _getParametersDefaultValue(node: ts.ParameterDeclaration) {
    if (!node.type) {
      return undefined;
    }
    switch (node.type.kind) {
      case ts.SyntaxKind.NumberKeyword:
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.FunctionType:
      case ts.SyntaxKind.StringKeyword: {
        return this._getDefaultValueByKind(node.type.kind);
      }
      case ts.SyntaxKind.UnionType: {
        const nodeTyps = (node.type as any).types as ts.TypeNode[];
        if (nodeTyps[0]) {
          return this._getDefaultValueByKind(nodeTyps[0].kind);
        }
      }
      case ts.SyntaxKind.ArrayType: {
        let result = [];
        node.getChildren().forEach((child) => {
          if (child.kind === ts.SyntaxKind.ArrayType) {
            const cchilds = child.getChildren();
            cchilds.forEach((cchild, cchildi) => {
              if (cchild.kind === ts.SyntaxKind.OpenBracketToken) {
                if (cchildi >= 1) {
                  result.push(
                    this._getDefaultValueByNode(cchilds[cchildi - 1])
                  );
                }
              }
            });
          }
        });
        return result;
      }
      case ts.SyntaxKind.TypeLiteral: {
        const findChildren: ts.TypeLiteralNode | undefined = node
          .getChildren()
          .find(
            (c) => c.kind === ts.SyntaxKind.TypeLiteral
          ) as ts.TypeLiteralNode;
        if (findChildren) {
          let res = {};
          findChildren.members.forEach((mnode: any) => {
            res[mnode.name.escapedText] = this._getParametersDefaultValue(
              mnode as ts.ParameterDeclaration
            );
          });
          return res;
        }
        return {};
      }
      case ts.SyntaxKind.TypeReference: {
        const typeNode = node.type as any;
        if (typeNode.typeName && typeNode.typeName.escapedText === "Function") {
          return this._getDefaultValueByKind(ts.SyntaxKind.FunctionType);
        }
        if (typeNode.typeName && typeNode.typeName.escapedText === "Map") {
          return new Map();
        }
        if (typeNode.typeName && typeNode.typeName.escapedText === "Set") {
          return new Set();
        }
        if (
          typeNode.typeName &&
          typeNode.typeName.escapedText === "Uint8Array"
        ) {
          return new Uint8Array();
        }
      }
      case ts.SyntaxKind.UnionType: {
      }
    }
  }

  private _emitReturns(
    sb: UnitTestStringBuilder,
    node:
      | ts.MethodDeclaration
      | ts.FunctionDeclaration
      | ts.FunctionExpression
      | ts.ArrowFunction
  ) {
    // console.log(node.type && node.type.getText(), node.name.getText(), "_emitReturns");
    // if (
    //   utils.findNonVoidReturnInCurrentScope(node) ||
    //   (node.type && node.type.getText() !== "void")
    // ) {
    //   if (vs.workspace.getConfiguration().get("docthis.returnsTag", true)) {
    //     sb.append("@returns {*} ");
    //   } else {
    //     sb.append("@return {*} ");
    //   }
    // }
  }

  public dispose() {}
}
