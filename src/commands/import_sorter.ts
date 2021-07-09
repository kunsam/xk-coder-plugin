import * as vscode from "vscode";
import parseImports, { Import } from "parse-imports";

type ArrayTransformer = (lines: string[]) => Promise<string[]>;

export class ImportSorter {
  public static async sort(transformers: ArrayTransformer[]) {
    const editor = vscode.window.activeTextEditor;
    const selection = editor.selection;
    const startLine = selection.start.line;
    const endLine = selection.end.line;
    let lines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push(editor.document.lineAt(i).text);
    }

    for await (let transformer of transformers) {
      lines = await transformer(lines);
    }

    return editor.edit((editBuilder) => {
      const range = new vscode.Range(
        startLine,
        0,
        endLine,
        editor.document.lineAt(endLine).text.length
      );
      editBuilder.replace(range, lines.join("\n"));
    });
  }

  public static getImpNamedString(
    named: { specifier: string; binding: string }[]
  ) {
    let str = "{ ";

    named
      .sort((a, b) => a.specifier.length - b.specifier.length)
      .forEach((name, nameindex) => {
        if (name.specifier === name.binding) {
          str += `${name.specifier}`;
        } else {
          str += `${name.specifier} as ${name.binding}`;
        }
        if (nameindex !== named.length - 1) {
          str += ",";
        }
        str += " ";
      });

    str += "} ";

    return str;
  }

  public static getImpString(
    impData: Import,
    isType: boolean,
    includeAny: boolean
  ): string {
    let impString = "import ";
    if (impData.importClause) {
      if (isType) {
        impString += "type ";
      }
      if (includeAny) {
        impString += `* as `;
      }
      if (impData.importClause.named.length) {
        impString += this.getImpNamedString(impData.importClause.named);
      } else {
        if (impData.importClause.namespace) {
          impString += impData.importClause.namespace;
        } else {
          impString += impData.importClause.default;
        }
        impString += " ";
      }
      impString += "from ";
      impString += impData.moduleSpecifier.code;
    }
    return impString;
  }

  public static async sortWithTsEslint() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor.selection;
    const startLine = selection.start.line;
    const endLine = selection.end.line;

    const text = editor.document.getText(
      new vscode.Range(selection.start, selection.end)
    );

    const imports = [...(await parseImports(text))];

    let node_modules_imports: Import[] = [];
    let ts_root_relative_imports: Import[] = [];
    let relative_imports: Import[] = [];
    let other_imports: Import[] = [];
    console.log(imports, "imports");
    imports.forEach((imp) => {
      switch (imp.moduleSpecifier.type) {
        case "package": {
          if (/^@/.test(imp.moduleSpecifier.value)) {
            ts_root_relative_imports.push(imp);
          } else {
            node_modules_imports.push(imp);
          }
          break;
        }
        case "relative":
        case "absolute": {
          relative_imports.push(imp);
          break;
        }
        default: {
          other_imports.push(imp);
          break;
        }
      }
    });

    const getImportsString = (imps: Import[]) => {
      return imps
        .map((imp) => {
          const impCode = text.substring(imp.startIndex, imp.endIndex);
          return this.getImpString(
            imp,
            /^import\stype/.test(impCode),
            /^import\s\*/.test(impCode)
          );
        })
        .sort((a, b) => a.length - b.length);
    };
    let lines: string[] = [
      getImportsString(node_modules_imports).join("\n"),
      getImportsString(ts_root_relative_imports).join("\n"),
      getImportsString(relative_imports).join("\n"),
      getImportsString(other_imports).join("\n"),
    ];

    console.log(lines, "lines");
    return editor.edit((editBuilder) => {
      const range = new vscode.Range(
        startLine,
        0,
        endLine,
        editor.document.lineAt(endLine).text.length
      );
      editBuilder.replace(range, lines.join(`\n\n`));
    });
  }
  //   public static async sortWithTsEslint() {
  //     const transformer: ArrayTransformer = async (lines: string[]) => {
  //       const filterNoImportLines = lines.filter((line) => /^import/.test(line));

  //       let sortedLines = [...filterNoImportLines];
  //       let node_modules_imports = [];
  //       let ts_root_relative_imports = [];
  //       let relative_imports = [];

  //       for await (let line of filterNoImportLines) {
  //         const imports = [...(await parseImports(line))];
  //         const importData = imports[0];
  //         if (importData) {
  //           switch (importData.moduleSpecifier.type) {
  //             case "builtin":
  //             case "package": {
  //               node_modules_imports.push(line);
  //               break;
  //             }
  //             case "relative": {
  //               break;
  //             }
  //             case "absolute":
  //             case "relative": {
  //               break;
  //             }
  //           }
  //         }
  //       }
  //       return lines;
  //     };

  //     return await this.sort([transformer]);
  //   }
}
