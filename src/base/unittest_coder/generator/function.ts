import { UnitCoderNamespace } from "../typing";
import * as ts from "typescript";
import { UnitTestGenerator } from "..";
import { UnittestCoderUtils } from "../utils";

class FunctionUnitTestGenerator {
  public isNodeExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node as ts.Declaration) &
        ts.ModifierFlags.Export) !==
        0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }

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

  public getDefaultValueByTypeString(type: string) {
    if (/\[\]$/.test(type)) {
      return "[]";
    } else if (type === "string") {
      return "string";
    } else if (type === "number") {
      return "0";
    } else if (type === "boolean") {
      return "false";
    } else if (/^Map/.test(type)) {
      return "new Map()";
    } else if (typeof type === "object") {
      return JSON.stringify(type);
    } else if (type === "any") {
      return `'any'`;
    } else if (/^\[(.+)\]$/.test(type)) {
      const types = type
        .replace(/\[|\]|\s/g, "")
        .split(",")
        .map((subs) => this.getDefaultValueByTypeString(subs));
      return `[${types.join(", ")}]`;
    } else {
      return type;
    }
  }

  public getObjStr(obj: any) {
    let str = "";
    const keys = Object.keys(obj);
    keys.forEach((key, kindex) => {
      str += `${key}: ${obj[key]}`;
      if (kindex !== keys.length - 1) {
        str += ", ";
      }
    });
    return str;
  }

  public getDescireCode(sources: UnitCoderNamespace.UnitTestSource[]) {
    let str = "";
    sources.forEach(({ functionName, parameters }) => {
      str += `describe('${functionName} test should be correct', () => {\n`;
      let obj = {};
      parameters.forEach((pa) => {
        const parsed = JSON.parse(pa);
        obj[parsed.name] = this.getDefaultValueByTypeString(parsed.type);
      });
      if (parameters.length > 1) {
        str += `\tconst defaultArgs: any = {${this.getObjStr(obj)}};\n`;
      }

      const getCallsArgs = (index: number, undefinedTest?: boolean) => {
        let str = "";
        const keys = Object.keys(obj);
        keys.forEach((key, kindex) => {
          if (kindex === index) {
            if (!undefinedTest) {
              str += `'change_me'`;
            } else {
              str += "undefined";
            }
          } else {
            str += `defaultArgs.${key}`;
          }
          if (kindex !== keys.length - 1) {
            str += ", ";
          }
        });
        return str;
      };
      parameters.forEach((pa, paindex) => {
        const parsed = JSON.parse(pa);
        str += `\ttest('arg ${parsed.name} test should be correct', () => {\n`;
        str += `\t\tconst result = ${functionName}(${getCallsArgs(paindex)})\n`;
        str += `\t\texpect(result).toBe('change_me');\n`;
        str += `\t});\n`;
        if (!parsed.isRequired) {
          str += `\ttest('arg ${parsed.name} undefined test should be correct', () => {\n`;
          str += `\t\tconst result = ${functionName}(${getCallsArgs(
            paindex,
            true
          )})\n`;
          str += `\t\texpect(result).toBe('change_me');\n`;
          str += `\t});\n`;
        }
      });
      if (parameters.length === 0) {
        str += `\ttest('${functionName} test should be correct', () => {\n`;
        str += `\t\tconst result = ${functionName}()\n`;
        str += `\t\texpect(result).toBe('change_me');\n`;
        str += `\t});\n`;
      }
      str += `});\n\n`;
    });
    return str;
  }
  public getTestCode(
    fileName: string,
    sources: UnitCoderNamespace.UnitTestSource[]
  ) {
    let str = "";
    str += this.getImportsCode(fileName, sources);
    str += "\n\n";
    str += this.getDescireCode(sources);
    return str;
  }

  public async dealGenerator(fileName: string, sourceFile: ts.SourceFile) {
    const exportSet: Set<string> = new Set();
    const interfaceParametersMap: Map<
      string,
      UnitCoderNamespace.UnitTestSourceParameter[]
    > = new Map();
    let defaultExportedName = "";
    const sources: UnitCoderNamespace.UnitTestSource[] = [];
    sourceFile.forEachChild((node) => {
      console.log(node.kind, "start ----------\n");
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
        console.log("end ----------\n");
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
      console.log("end ----------\n");
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
    const fileStr = this.getTestCode(fileName, sources);
    return { fileStr };
  }
}

const finst = new FunctionUnitTestGenerator();

UnitTestGenerator.register(
  UnitCoderNamespace.TestTargetType.function,
  finst.dealGenerator.bind(finst)
);
