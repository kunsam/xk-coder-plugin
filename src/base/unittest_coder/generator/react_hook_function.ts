import { UnitCoderNamespace } from "../typing";
import * as ts from "typescript";
import { UnitTestGenerator } from "..";
import { UnittestCoderUtils } from "../utils";

class FunctionUnitTestGenerator {
  public getImportsCode(
    fileName: string,
    sources: UnitCoderNamespace.UnitTestSource[]
  ) {
    let str = "";
    const findDefault = sources.find((s) => s.isExportDefault);
    str += "import ";
    let hasNamedLength = sources.length;
    if (findDefault) {
      str += `${findDefault.functionName}`;
      hasNamedLength--;
    }
    if (hasNamedLength > 0) {
      if (findDefault) {
        str += ", ";
      }
      str += "{ ";
      sources.forEach((source, sourcei) => {
        if (!source.isExportDefault) {
          str += `${source.functionName}`;
          if (sourcei !== hasNamedLength - 1) {
            str += ", ";
          }
        }
      });
      str += " }";
    }
    const fileNames = fileName.split(".");
    fileNames.pop();
    str += ` from './${fileNames.join(".")}';`;
    return str;
  }

  public getExpectStateCode(
    states: string[],
    visitPath: string,
    tabStr: string
  ) {
    let str = "";
    states.forEach((state) => {
      str += `${tabStr}expect(${visitPath}.${state}).toBe('change_me');\n`;
    });
    return str;
  }

  public getDescireCode(
    sources: UnitCoderNamespace.UnitTestSource[],
    statesMap: Map<string, string[]>,
    handlersMap: Map<string, string[]>
  ) {
    let str = "";

    sources.forEach(({ functionName, parameters }) => {
      str += `describe('${functionName} test should be correct', () => {\n`;
      let obj = {};

      parameters.forEach((pa) => {
        const parsed = JSON.parse(pa);
        obj[parsed.name] = parsed.type;
      });
      str += `\tconst testProps: any = ${JSON.stringify(obj)};\n`;
      str += `\tconst hooks = ${functionName}(testProps);\n`;

      const states = statesMap.get(functionName) || [];
      const stateExpectStr = this.getExpectStateCode(
        states,
        "hooks.state",
        "\t\t"
      );
      const handlersStr: { name: string; str: string }[] = [
        { name: "init", str: "\n" },
      ];
      const handlers = handlersMap.get(functionName) || [];
      handlers.forEach((handler) => {
        // str += 'next version i can fill this change_me'
        handlersStr.push({
          name: handler,
          str: `\t\thooks.handler.${handler}('change_me');\n`,
        });
      });
      handlersStr.forEach((handlerStr) => {
        str += `\tit('${functionName} ${handlerStr.name} test should be correct', () => {\n`;
        str += handlerStr.str;
        str += stateExpectStr;
        str += "\t});\n";
      });
      str += `});\n\n`;
    });
    return str;
  }
  public getTestCode(
    fileName: string,
    sources: UnitCoderNamespace.UnitTestSource[],
    statesMap: Map<string, string[]>,
    handlersMap: Map<string, string[]>
  ) {
    let str = "";
    str += this.getImportsCode(fileName, sources);
    str += "\n\n";
    str += this.getDescireCode(sources, statesMap, handlersMap);
    return str;
  }

  public getObjFromObjectLiteralExpression(
    node: ts.ObjectLiteralExpression,
    sourceFile: ts.SourceFile
  ): string[] {
    let keys: string[] = [];
    node.forEachChild((cnode) => {
      if (cnode.kind === ts.SyntaxKind.PropertyAssignment) {
        cnode.forEachChild((ccnode) => {
          if (ts.isObjectLiteralExpression(ccnode)) {
            keys = [
              ...keys,
              ...this.getObjFromObjectLiteralExpression(ccnode, sourceFile),
            ];
          }
        });
      }
      if (cnode.kind === ts.SyntaxKind.ShorthandPropertyAssignment) {
        keys.push(cnode.getFullText(sourceFile).replace(/\s/g, ""));
      }
    });
    return keys;
  }

  public getReturnedStateAndCallbacks(
    node: ts.Block,
    sourceFile: ts.SourceFile
  ): { states: string[]; handlers: string[] } {
    const stateKeys = new Set();
    const handlerKeys = new Set();

    const stateReturnedKeys: Set<string> = new Set();
    const handlerReturnedKeys: Set<string> = new Set();

    node.forEachChild((cnode) => {
      cnode.forEachChild((ccnode) => {
        if (cnode.kind === ts.SyntaxKind.VariableStatement) {
          // 233-251
          if (ccnode.kind === ts.SyntaxKind.VariableDeclarationList) {
            ccnode.forEachChild((cccnode) => {
              if (ts.isVariableDeclaration(cccnode)) {
                let idNode: ts.Identifier;
                cccnode.forEachChild((stateNode) => {
                  if (!idNode && ts.isIdentifier(stateNode)) {
                    idNode = stateNode;
                  }
                  if (stateNode.kind === ts.SyntaxKind.ArrayBindingPattern) {
                    const texts = stateNode
                      .getFullText(sourceFile)
                      .replace(/\[|\]|\s/g, "")
                      .split(",");
                    stateKeys.add(texts[0]);
                    handlerKeys.add(texts[1]);
                  }
                  if (
                    idNode &&
                    stateNode.kind === ts.SyntaxKind.CallExpression
                  ) {
                    if (
                      stateNode.getFullText(sourceFile).includes("useCallback")
                    ) {
                      handlerKeys.add(idNode.escapedText.toString());
                    }
                  }
                });
              }
            });
          }
        }
        if (cnode.kind === ts.SyntaxKind.ReturnStatement) {
          if (ccnode.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            const keys = this.getObjFromObjectLiteralExpression(
              ccnode as ts.ObjectLiteralExpression,
              sourceFile
            );
            keys.forEach((key) => {
              if (stateKeys.has(key)) {
                stateReturnedKeys.add(key);
              }
              if (handlerKeys.has(key)) {
                handlerReturnedKeys.add(key);
              }
            });
          }
        }
      });
    });
    return {
      states: Array.from(stateReturnedKeys),
      handlers: Array.from(handlerReturnedKeys),
    };
  }

  public async dealGenerator(fileName: string, sourceFile: ts.SourceFile) {
    const sources =
      UnittestCoderUtils.getExportedFunctionsFromSourceFile(sourceFile);

    let statesMap: Map<string, string[]> = new Map();
    let handlersMap: Map<string, string[]> = new Map();

    sourceFile.forEachChild((snode) => {
      if (ts.isFunctionDeclaration(snode)) {
        let functionName: string;
        let findFunctionName = false;
        snode.forEachChild((fnode) => {
          if (ts.isIdentifier(fnode)) {
            functionName = fnode.escapedText.toString();
            findFunctionName = !!sources.find(
              (s) => s.functionName === functionName
            );
          }
          if (findFunctionName) {
            if (ts.isBlock(fnode)) {
              const result = this.getReturnedStateAndCallbacks(
                fnode,
                sourceFile
              );
              statesMap.set(functionName, result.states);
              handlersMap.set(functionName, result.handlers);
            }
          }
        });
      }
      if (ts.isVariableStatement(snode)) {
        snode.forEachChild((childNode) => {
          if (ts.isVariableDeclarationList(childNode)) {
            childNode.forEachChild((ccnode) => {
              if (ts.isVariableDeclaration(ccnode)) {
                let functionName: string;
                ccnode.forEachChild((bnode) => {
                  if (ts.isIdentifier(bnode)) {
                    functionName = bnode.escapedText.toString();
                  }
                  if (functionName && ts.isArrowFunction(bnode)) {
                    bnode.forEachChild((bcnode) => {
                      if (ts.isBlock(bcnode)) {
                        const result = this.getReturnedStateAndCallbacks(
                          bcnode,
                          sourceFile
                        );
                        statesMap.set(functionName, result.states);
                        handlersMap.set(functionName, result.handlers);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    const fileStr = this.getTestCode(fileName, sources, statesMap, handlersMap);
    return { fileStr };
  }
}

const finst = new FunctionUnitTestGenerator();

UnitTestGenerator.register(
  UnitCoderNamespace.TestTargetType.react_function,
  finst.dealGenerator.bind(finst)
);
