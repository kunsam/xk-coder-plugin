import * as ts from "typescript";
import { UnitCoderNamespace } from "./typing";

export class UnittestCoderUtils {
  public static interfaceParametersMap: Map<
    string,
    UnitCoderNamespace.UnitTestSourceParameter[]
  > = new Map();

  public static getExportedFunctionsFromSourceFile(
    sourceFile: ts.SourceFile
  ): UnitCoderNamespace.UnitTestSource[] {
    const exportSet: Set<string> = new Set();
    const interfaceParametersMap: Map<
      string,
      UnitCoderNamespace.UnitTestSourceParameter[]
    > = new Map();
    let defaultExportedName = "";
    const sources: UnitCoderNamespace.UnitTestSource[] = [];
    sourceFile.forEachChild((node) => {
      console.log(node.kind, "start ----------");
      if (ts.isInterfaceDeclaration(node)) {
        const result = UnittestCoderUtils.getParametersFromInterfaceDeclaration(
          node,
          sourceFile
        );
        interfaceParametersMap.set(result.name, result.parameters);
        UnittestCoderUtils.interfaceParametersMap = interfaceParametersMap;
      }

      if (ts.isFunctionDeclaration(node)) {
        const result = UnittestCoderUtils.getSourcesFromFunctionDeclaration(
          node,
          sourceFile,
          defaultExportedName
        );
        result.exportSet.forEach((v) => exportSet.add(v));
        result.sources.forEach((sr) => sources.push(sr));
        console.log("end ----------");
        return;
      }

      if (ts.isVariableStatement(node)) {
        let nodeHasExport = false;
        node.forEachChild((childNode) => {
          if (childNode.kind === ts.SyntaxKind.ExportKeyword) {
            nodeHasExport = true;
          }
          if (nodeHasExport && ts.isVariableDeclarationList(childNode)) {
            childNode.forEachChild((ccnode) => {
              if (ts.isVariableDeclaration(ccnode)) {
                const result =
                  UnittestCoderUtils.getSourcesFromVariableDeclaration(
                    ccnode,
                    sourceFile,
                    interfaceParametersMap,
                    defaultExportedName
                  );
                result.exportSet.forEach((v) => exportSet.add(v));
                result.sources.forEach((sr) => sources.push(sr));
              }
            });
          }
        });
      }
      console.log("end ----------");
      if (ts.isExportAssignment(node)) {
        node.forEachChild((node) => {
          if (ts.isIdentifier(node)) {
            exportSet.add(node.escapedText.toString());
            defaultExportedName = node.escapedText.toString();
          }
          if (ts.isCallExpression(node)) {
            node.forEachChild((node) => {
              if (ts.isIdentifier(node)) {
                exportSet.add(node.escapedText.toString());
                defaultExportedName = node.escapedText.toString();
              }
            });
          }
        });
      }
    });

    sourceFile.forEachChild((node) => {
      if (ts.isVariableStatement(node)) {
        node.forEachChild((childNode) => {
          if (ts.isVariableDeclarationList(childNode)) {
            childNode.forEachChild((ccnode) => {
              if (ts.isVariableDeclaration(ccnode)) {
                if (ccnode.name) {
                  if (exportSet.has((ccnode.name as any).escapedText)) {
                    const result =
                      UnittestCoderUtils.getSourcesFromVariableDeclaration(
                        ccnode,
                        sourceFile,
                        interfaceParametersMap,
                        defaultExportedName
                      );
                    result.sources.forEach((sr) => sources.push(sr));
                  }
                }
              }
            });
          }
        });
      }
    });
    console.log(sources, "sources");
    return sources;
  }

  public static getSourcesFromVariableDeclaration(
    ccnode: ts.VariableDeclaration,
    sourceFile: ts.SourceFile,
    interfaceParametersMap: Map<
      string,
      UnitCoderNamespace.UnitTestSourceParameter[]
    >,
    defaultExportedName: string
  ) {
    const exportSet: Set<string> = new Set();
    const sources: UnitCoderNamespace.UnitTestSource[] = [];
    const ccnodeChilds: ts.Node[] = [];
    ccnode.forEachChild((varnode) => {
      ccnodeChilds.push(varnode);
    });
    const joinKindIds = ccnodeChilds.map((child) => child.kind).join("-");
    console.log("getSourcesFromVariableDeclaration", joinKindIds);
    // TODO 可以更简单
    if (joinKindIds === "78-210") {
      // Identifier - ArrowFunction
      const functionName = (
        ccnodeChilds[0] as ts.Identifier
      ).escapedText.toString();
      sources.push({
        functionName,
        isExportDefault: defaultExportedName === functionName,
        parameters: UnittestCoderUtils.getParametersFromArrowFunction(
          ccnodeChilds[1] as ts.ArrowFunction,
          sourceFile
        ),
      });
    } else if (joinKindIds === "78-204") {
      // Identifier - CallExpression
      const functionName = (
        ccnodeChilds[0] as ts.Identifier
      ).escapedText.toString();
      sources.push({
        functionName,
        isExportDefault: defaultExportedName === functionName,
        parameters: UnittestCoderUtils.getParametersFromCallExpression(
          ccnodeChilds[1] as ts.CallExpression,
          sourceFile
        ),
      });
    } else if (joinKindIds === "78-174-204") {
      const functionName = (
        ccnodeChilds[0] as ts.Identifier
      ).escapedText.toString();
      ccnodeChilds[1].forEachChild((ccc1) => {
        if (ts.isTypeLiteralNode(ccc1)) {
          sources.push({
            functionName,
            isExportDefault: defaultExportedName === functionName,
            parameters: UnittestCoderUtils.getParametersFromTypeLiteral(
              ccc1,
              sourceFile,
              true
            ),
          });
        }
        if (ts.isTypeReferenceNode(ccc1)) {
          const typename = (ccc1.typeName as any).escapedText;
          if (interfaceParametersMap.has(typename)) {
            sources.push({
              functionName,
              isExportDefault: defaultExportedName === functionName,
              parameters: interfaceParametersMap.get(typename),
            });
          }
        }
      });
    } else if (joinKindIds === "78-174-210") {
      const functionName = (
        ccnodeChilds[0] as ts.Identifier
      ).escapedText.toString();

      ccnodeChilds[1].forEachChild((node) => {
        if (ts.isTypeLiteralNode(node)) {
          sources.push({
            functionName,
            isExportDefault: defaultExportedName === functionName,
            parameters: UnittestCoderUtils.getParametersFromTypeLiteral(
              node,
              sourceFile,
              true
            ),
          });
        }
        if (ts.isTypeReferenceNode(node)) {
          const typename = (node.typeName as any).escapedText;
          if (interfaceParametersMap.has(typename)) {
            sources.push({
              functionName,
              isExportDefault: defaultExportedName === functionName,
              parameters: interfaceParametersMap.get(typename),
            });
          }
        }
      });
    } else if (joinKindIds === "78-78") {
      const functionName = (
        ccnodeChilds[1] as ts.Identifier
      ).escapedText.toString();
      exportSet.add(functionName);
    } else if (joinKindIds === "202-78") {
      const functionName = (
        ccnodeChilds[1] as ts.Identifier
      ).escapedText.toString();
      exportSet.add(functionName);
    } else {
      console.log(ccnodeChilds, "ccnodeChildsccnodeChilds");
    }

    return {
      sources,
      exportSet,
    };
  }

  public static getSourcesFromFunctionDeclaration(
    ccnode: ts.FunctionDeclaration,
    sourceFile: ts.SourceFile,
    defaultExportedName: string
  ) {
    const exportSet: Set<string> = new Set();
    const sources: UnitCoderNamespace.UnitTestSource[] = [];
    let functionName: string;
    let parameters = [];
    ccnode.forEachChild((varnode) => {
      if (ts.isIdentifier(varnode)) {
        functionName = varnode.escapedText.toString();
      }
      if (functionName && ts.isParameter(varnode)) {
        const nps = UnittestCoderUtils.getParametersFromParameter(
          varnode,
          sourceFile
        );
        parameters = [...parameters, ...nps];
      }
    });

    if (functionName) {
      sources.push({
        functionName,
        isExportDefault: defaultExportedName === functionName,
        parameters,
      });
    }
    // todo 处理 export default functionName
    // 暂未处理 export XXX
    return {
      sources,
      exportSet,
    };
  }

  public static getParameterFromPropertySignature(
    node: ts.PropertySignature,
    sourceFile: ts.SourceFile,
    isRequired: boolean
  ): UnitCoderNamespace.UnitTestSourceParameter {
    let name = "";
    let type: any = "any";
    let hasQuestionToken = false;
    node.forEachChild((n) => {
      if (n.kind === ts.SyntaxKind.QuestionToken) {
        hasQuestionToken = true;
      }
      if (ts.isIdentifier(n)) {
        name = n.escapedText.toString(); // n.getFullText(sourceFile);
      } else if (ts.isTypeLiteralNode(n)) {
        const parameters = UnittestCoderUtils.getParametersFromTypeLiteral(
          n,
          sourceFile,
          !hasQuestionToken
        );
        type = {};
        parameters.forEach((para) => {
          const obj = JSON.parse(para);
          type[obj.name] = obj.type;
        });
      } else {
        type = n.getFullText(sourceFile).replace(/\n|\s/g, "");
      }
    });
    return JSON.stringify({
      name,
      type,
      isRequired,
    });
  }
  public static getParametersFromInterfaceDeclaration(
    node: ts.InterfaceDeclaration,
    sourceFile: ts.SourceFile
  ): {
    name: string;
    parameters: UnitCoderNamespace.UnitTestSourceParameter[];
  } {
    let parameters: UnitCoderNamespace.UnitTestSourceParameter[] = [];
    let name = "";
    let questionToken = false;
    node.forEachChild((n) => {
      if (n.kind === ts.SyntaxKind.QuestionToken) {
        questionToken = true;
      }
      if (ts.isIdentifier(n)) {
        name = n.escapedText.toString();
      } else if (ts.isPropertySignature(n)) {
        parameters.push(
          UnittestCoderUtils.getParameterFromPropertySignature(
            n,
            sourceFile,
            !questionToken
          )
        );
      } else {
        console.log(
          n.kind,
          n.getFullText(sourceFile),
          "getParametersFromInterfaceDeclaration otherwise"
        );
      }
    });
    return {
      name,
      parameters,
    };
  }
  public static getParametersFromArrowFunction(
    node: ts.ArrowFunction,
    sourceFile: ts.SourceFile
  ): UnitCoderNamespace.UnitTestSourceParameter[] {
    const childs: ts.Node[] = [];

    node.forEachChild((n) => {
      childs.push(n);
    });

    if (ts.isParameter(childs[0])) {
      let parameters = [];
      childs[0].forEachChild((ccild) => {
        if (ts.isTypeReferenceNode(ccild)) {
          const typename = (ccild.typeName as any).escapedText;
          if (UnittestCoderUtils.interfaceParametersMap.has(typename)) {
            parameters =
              UnittestCoderUtils.interfaceParametersMap.get(typename);
          }
        }
      });
      if (parameters.length) {
        return parameters;
      }
      return UnittestCoderUtils.getParametersFromParameter(
        childs[0],
        sourceFile
      );
    } else {
      console.log(childs, "getParametersFromArrowFunction childs");
    }
    return [];
  }

  public static getParametersFromCallExpression(
    node: ts.CallExpression,
    sourceFile: ts.SourceFile
  ): UnitCoderNamespace.UnitTestSourceParameter[] {
    let parameters: UnitCoderNamespace.UnitTestSourceParameter[] = [];
    node.forEachChild((c1) => {
      if (ts.isArrowFunction(c1)) {
        parameters = UnittestCoderUtils.getParametersFromArrowFunction(
          c1,
          sourceFile
        );
      } else if (ts.isFunctionExpression(c1)) {
        c1.forEachChild((c11) => {
          if (ts.isParameter(c11)) {
            parameters = UnittestCoderUtils.getParametersFromParameter(
              c11,
              sourceFile
            );
          }
        });
      } else {
        console.log(
          c1.kind,
          c1.getFullText(sourceFile),
          "getParametersFromCallExpression otherwise"
        );
      }
    });
    return parameters;
  }

  public static getParametersFromParameter(
    node: ts.ParameterDeclaration,
    sourceFile: ts.SourceFile
  ): UnitCoderNamespace.UnitTestSourceParameter[] {
    let parameters: UnitCoderNamespace.UnitTestSourceParameter[] = [];
    let idNode: ts.Identifier | undefined;
    let questioNode = false;
    node.forEachChild((cnode) => {
      if (ts.isIdentifier(cnode)) {
        idNode = cnode;
      }
      if (cnode.kind === ts.SyntaxKind.QuestionToken) {
        questioNode = true;
      }
      const isRequired = !!idNode && !questioNode;
      if (ts.isTypeLiteralNode(cnode)) {
        parameters = UnittestCoderUtils.getParametersFromTypeLiteral(
          cnode,
          sourceFile,
          isRequired
        );
      } else if (idNode) {
        const paras = this.getBasicTypeParameterFromNode(
          cnode,
          idNode,
          sourceFile,
          isRequired
        );
        parameters = [...parameters, ...paras];
      } else {
        if (ts.isTypeReferenceNode(cnode)) {
          const typename = (cnode.typeName as any).escapedText;
          if (this.interfaceParametersMap.has(typename)) {
            const pas = this.interfaceParametersMap.get(typename);
            parameters = [...parameters, ...pas];
          }
        } else {
          console.log(
            cnode.kind,
            cnode.getFullText(sourceFile),
            "getParametersFromParameter otherwise"
          );
        }
      }
    });
    console.log(parameters, "getParametersFromParameter parameters");
    return parameters;
  }

  public static getBasicTypeParameterFromNode(
    cnode: ts.Node,
    idNode: ts.Identifier,
    sourceFile: ts.SourceFile,
    isRequired: boolean
  ): string[] {
    if (
      cnode.kind === ts.SyntaxKind.NumberKeyword ||
      cnode.kind === ts.SyntaxKind.ArrayType ||
      cnode.kind === ts.SyntaxKind.BooleanKeyword ||
      cnode.kind === ts.SyntaxKind.StringKeyword ||
      cnode.kind === ts.SyntaxKind.AnyKeyword
    ) {
      return [
        JSON.stringify({
          isRequired,
          name: idNode.escapedText.toString(),
          type: cnode.getFullText(sourceFile).replace(/\n|\s/g, ""),
        }),
      ];
    }

    if (cnode.kind === ts.SyntaxKind.TupleType) {
      return [
        JSON.stringify({
          isRequired,
          name: idNode.escapedText.toString(),
          type: cnode.getFullText(sourceFile).replace(/^\s/, ""),
        }),
      ];
    }

    if (cnode.kind === ts.SyntaxKind.FunctionType) {
      return [
        JSON.stringify({
          isRequired,
          name: idNode.escapedText.toString(),
          type: "() => {}",
        }),
      ];
    }

    if (ts.isTypeReferenceNode(cnode)) {
      const typename = (cnode.typeName as any).escapedText;
      if (this.interfaceParametersMap.has(typename)) {
        const types = this.interfaceParametersMap.get(typename);
        let obj = {};
        types.forEach((type) => {
          const parsed = JSON.parse(type);
          obj[parsed.name] = parsed.type;
        });
        return [
          JSON.stringify({
            isRequired,
            name: idNode.escapedText.toString(),
            type: obj,
          }),
        ];
      } else {
        return [
          JSON.stringify({
            isRequired,
            name: idNode.escapedText.toString(),
            type: cnode.getFullText(sourceFile).replace(/\n|\s/g, ""),
          }),
        ];
      }
    }
    console.log(
      cnode.kind,
      cnode.getFullText(sourceFile),
      "getBasicTypeParameterFromNode"
    );

    return [];
  }

  public static getParametersFromTypeLiteral(
    node: ts.TypeLiteralNode,
    sourceFile: ts.SourceFile,
    isRequired: boolean
  ): UnitCoderNamespace.UnitTestSourceParameter[] {
    let parameters: UnitCoderNamespace.UnitTestSourceParameter[] = [];
    let idNode: ts.Identifier | undefined;
    let questioNode: ts.Node | undefined;
    node.forEachChild((cnode) => {
      if (ts.isIdentifier(cnode)) {
        idNode = cnode;
      }
      if (cnode.kind === ts.SyntaxKind.QuestionToken) {
        questioNode = cnode;
      }
      if (ts.isPropertySignature(cnode)) {
        parameters.push(
          UnittestCoderUtils.getParameterFromPropertySignature(
            cnode,
            sourceFile,
            isRequired
          )
        );
      } else if (idNode) {
        const paras = this.getBasicTypeParameterFromNode(
          cnode,
          idNode,
          sourceFile,
          !!idNode && !questioNode
        );
        parameters = [...parameters, ...paras];
      } else {
        console.log(
          cnode.kind,
          cnode.getFullText(sourceFile),
          "getParametersFromTypeLiteral otherwise"
        );
      }
    });
    return parameters;
  }
}
