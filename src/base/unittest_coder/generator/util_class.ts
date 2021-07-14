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
    className: string,
    isDefaultExport: boolean
  ) {
    let str = "";
    if (isDefaultExport) {
      str += `import ${className}`;
    } else {
      str += `import { ${className} }`;
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

  public getDescireCode(
    sources: UnitCoderNamespace.UnitTestSource[],
    className: string
  ) {
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
        str += `\t\tconst result = ${className}.${functionName}(${getCallsArgs(
          paindex
        )})\n`;
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
    className: string,
    isDefaultExport: boolean,
    sources: UnitCoderNamespace.UnitTestSource[]
  ) {
    let str = "";
    str += this.getImportsCode(fileName, className, isDefaultExport);
    str += "\n\n";
    str += this.getDescireCode(sources, className);
    return str;
  }

  public async dealGenerator(fileName: string, sourceFile: ts.SourceFile) {
    let defaultExportedName = "";
    const sources: UnitCoderNamespace.UnitTestSource[] = [];
    let className: string;
    let isDefaultExport = false;
    sourceFile.forEachChild((node) => {
      console.log(node.kind, "start ----------\n");
      if (ts.isClassDeclaration(node)) {
        node.forEachChild((cnode) => {
          if (cnode.kind === ts.SyntaxKind.DefaultKeyword) {
            isDefaultExport = true;
          }
          if (ts.isPropertyDeclaration(cnode)) {
            let functionName: string;
            cnode.forEachChild((ccnode) => {
              if (ts.isIdentifier(ccnode)) {
                functionName = ccnode.escapedText.toString();
              }
              if (functionName && ts.isArrowFunction(ccnode)) {
                sources.push({
                  functionName,
                  isExportDefault: defaultExportedName === functionName,
                  parameters: UnittestCoderUtils.getParametersFromArrowFunction(
                    ccnode,
                    sourceFile
                  ),
                });
              }

              if (ts.isFunctionDeclaration(ccnode)) {
                const result =
                  UnittestCoderUtils.getSourcesFromFunctionDeclaration(
                    ccnode,
                    sourceFile,
                    defaultExportedName
                  );
                result.sources.forEach((sr) => sources.push(sr));
              }
            });
          }
          if (ts.isMethodDeclaration(cnode)) {
            let functionName: string;
            let parameters: string[] = [];
            cnode.forEachChild((ccnode) => {
              if (ts.isIdentifier(ccnode)) {
                functionName = ccnode.escapedText.toString();
              }
              if (ts.isParameter(ccnode)) {
                const pas = UnittestCoderUtils.getParametersFromParameter(
                  ccnode,
                  sourceFile
                );
                parameters = [...parameters, ...pas];
              }
            });
            if (functionName) {
              sources.push({
                functionName,
                isExportDefault: defaultExportedName === functionName,
                parameters,
              });
            }
          }
          if (ts.isIdentifier(cnode)) {
            className = cnode.escapedText.toString();
          }
        });
      }
      console.log("end ----------\n");
    });
    console.log(sources, "sources");
    const fileStr = this.getTestCode(
      fileName,
      className,
      isDefaultExport,
      sources
    );
    return { fileStr };
  }
}

const finst = new FunctionUnitTestGenerator();

UnitTestGenerator.register(
  UnitCoderNamespace.TestTargetType.util_class,
  finst.dealGenerator.bind(finst)
);
