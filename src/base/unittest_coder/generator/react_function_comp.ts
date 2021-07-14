import { UnitCoderNamespace } from "../typing";
import * as ts from "typescript";
import { UnitTestGenerator } from "..";
import { UnittestCoderUtils } from "../utils";

class FunctionUnitTestGenerator {
  public getImportsCode(
    fileName: string,
    sources: UnitCoderNamespace.UnitTestSource[]
  ) {
    let str = "import renderer from 'react-test-renderer';\n";
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
      str += "}";
    }
    const fileNames = fileName.split(".");
    fileNames.pop();
    str += ` from './${fileNames.join(".")}';`;
    return str;
  }

  public getLifecycleCode() {
    let str = `/* Lifecyle AREA */\n`;
    str += "/* think if need to add sth or just delete it */\n";
    str += "beforeAll(() => {});\n";
    str += "beforeEach(() => {});\n";
    str += "afterEach(() => {});";
    return str;
  }

  public getDocsCode() {
    let str = "";
    str += `// check: https://reactjs.org/docs/test-renderer.html\n`;
    str += `// check: https://jestjs.io/docs/api\n`;
    return str;
  }

  public getDescireCode(sources: UnitCoderNamespace.UnitTestSource[]) {
    let str = "";
    sources.forEach(({ functionName, parameters }) => {
      str += `describe('${functionName} test should be correct', () => {\n`;
      let obj = {};
      console.log(parameters, "parameters");
      parameters.forEach((pa) => {
        const parsed = JSON.parse(pa);
        obj[parsed.name] = parsed.type;
      });
      str += `\tconst testProps: any = ${JSON.stringify(obj)};\n`;
      parameters.forEach((pa) => {
        const parsed = JSON.parse(pa);
        str += `\ttest('${functionName} props ${parsed.name} test should be correct', () => {\n`;
        str += `\t\ttestProps.${parsed.name} = 'change_me';\n`;
        str += `\t\tconst component = renderer.create(<${functionName} {...testProps} />);\n`;
        str += `\t\t\/\/you can add more test here\n`;
        str += `\t\tconst tree = component.toJSON();\n`;
        str += `\t\texpect(tree).toMatchSnapshot();\n`;
        str += `\t});\n`;
      });
      if (parameters.length === 0) {
        str += `\ttest('${functionName} render test should be correct', () => {\n`;
        str += `\t\tconst component = renderer.create(<${functionName} {...testProps} />);\n`;
        str += `\t\tconst tree = component.toJSON();\n`;
        str += `\t\texpect(tree).toMatchSnapshot();\n`;
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
    str += this.getLifecycleCode();
    str += "\n\n";
    str += this.getDocsCode();
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
      if (ts.isInterfaceDeclaration(node)) {
        const result = UnittestCoderUtils.getParametersFromInterfaceDeclaration(
          node,
          sourceFile
        );
        interfaceParametersMap.set(result.name, result.parameters);
        UnittestCoderUtils.interfaceParametersMap = interfaceParametersMap;
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
                    ""
                  );
                result.exportSet.forEach((v) => exportSet.add(v));
                result.sources.forEach((sr) => sources.push(sr));
              }
            });
          }
        });
      }
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
  UnitCoderNamespace.TestTargetType.react_class_comp,
  finst.dealGenerator.bind(finst)
);
