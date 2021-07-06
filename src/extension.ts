"use strict";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { CONFIG_PATH, ExtensionConfig, ROOT_PATH } from "./config";
import { loadConifg, pickFiles2Open } from "./utils/extension_util";
// import parseImports from "parse-imports";
import { Graph } from "graphlib";
import { ImportUtilV2 } from "./utils/import_util_v2";
import * as parseStaticImports from "parse-static-imports";
import { SearchableCommands } from "./commands/config";
import { showAndExcuteCommands } from "./commands/utils";
import { ImportManager } from "./base/imports_manager";
import { CoderNamespace } from "./base/typing";
import { AppRouterManager } from "./base/router_manager";
import NodeFlowCommands from "./commands/code_tree";
import { FuncParserX } from "./base/function_parser";

const importGraph = new Graph();
const importVisitedSet = new Set();

const LAZY_FILES = [
  {
    from: "./src/pages/index.tsx",
    rpath: "./src/pages/Dashboard/DashboardRoute.tsx",
  },
  {
    from: "./src/pages/Dashboard/DashboardRoute.tsx",
    rpath: "./src/pages/Dashboard/index.tsx",
  },
  {
    from: "./src/pages/Dashboard/DashboardRoute.tsx",
    rpath: "./src/pages/Create/index.tsx",
  },
];

async function recursivParseImports(file_abs_path: string) {
  if (!fs.existsSync(file_abs_path)) {
    return;
  }
  const fileStr = fs.readFileSync(file_abs_path).toString();
  if (!fileStr) {
    return;
  }
  if (importVisitedSet.has(file_abs_path)) {
    return;
  }
  importVisitedSet.add(file_abs_path);
  importGraph.setNode(
    file_abs_path,
    ImportUtilV2.getImportNode(file_abs_path, false, [])
  );

  let willParserfileStr = fileStr;
  const imports = parseStaticImports(willParserfileStr);
  for await (let imp of imports) {
    const fileNode = importGraph.node(file_abs_path);
    const target_path = imp.moduleName.replace(/'|"/g, "");
    let target_abs_path = path.join(
      ROOT_PATH,
      target_path.replace(/@/g, "src")
    );
    const isPackage = /^(\.|@)/.test(target_path) === false;
    if (isPackage) {
      importGraph.setNode(file_abs_path, {
        ...fileNode,
        namedImports: [
          ...fileNode.namedImports,
          ...imp.namedImports.map((ni) => ({ ...ni, fromId: target_path })),
        ],
      });
      importGraph.setNode(
        target_path,
        ImportUtilV2.getImportNode(target_path, true, [])
      );
      importGraph.setEdge(target_path, file_abs_path);
      continue;
    }
    if (/^(\.)/.test(target_path)) {
      target_abs_path = path.join(path.dirname(file_abs_path), target_path);
    }

    const target_abs_path_withext =
      ImportUtilV2.getFileExtedPathByImportPath(target_abs_path);
    importGraph.setNode(file_abs_path, {
      ...fileNode,
      namedImports: [
        ...fileNode.namedImports,
        ...imp.namedImports.map((ni) => ({
          ...ni,
          fromId: target_abs_path_withext,
        })),
      ],
    });
    importGraph.setNode(
      target_abs_path_withext,
      ImportUtilV2.getImportNode(target_abs_path_withext, false, [])
    );
    importGraph.setEdge(target_abs_path_withext, file_abs_path);
    await recursivParseImports(target_abs_path_withext);
  }
  // for await (let imp of imports) {
  //   importGraph.setNode(file_abs_path, imp);
  //   const target_path = imp.moduleSpecifier.code.replace(/'|"/g, "");
  //   const isPackage =
  //     !target_path.includes("@") && imp.moduleSpecifier.type === "package";
  //   if (isPackage) {
  //     continue;
  //   }
  //   let target_abs_path = path.join(
  //     ROOT_PATH,
  //     target_path.replace(/@/g, "src")
  //   );
  //   if (imp.moduleSpecifier.type === "relative") {
  //     target_abs_path = path.join(path.dirname(file_abs_path), target_path);
  //   }
  //   const target_abs_path_withext =
  //     ImportUtilV2.getFileExtedPathByImportPath(target_abs_path);
  //   console.log(target_abs_path_withext, target_abs_path, "target_abs_path");
  //   await recursivParseImports(target_abs_path_withext);
  // }
}

export async function activate(context: vscode.ExtensionContext) {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "初始化中...",
      cancellable: false,
    },
    async (progress, token) => {
      const config = await loadConifg<ExtensionConfig>(CONFIG_PATH);
      if (config) {
        for await (let entry of config.imports_entires) {
          await recursivParseImports(path.join(ROOT_PATH, entry.path));
        }
        for await (let lazy_file of LAZY_FILES) {
          const file_abs_path = path.join(ROOT_PATH, lazy_file.rpath);
          await recursivParseImports(file_abs_path);
          importGraph.setEdge(
            file_abs_path,
            path.join(ROOT_PATH, lazy_file.from)
          );
        }
      }
    }
  );

  new NodeFlowCommands(context);
  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.openSearchEgnine", () => {
      showAndExcuteCommands(SearchableCommands);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "XkCoderPlugin.getImportGraphDumpJson",
      () => {
        console.log(importGraph.nodes());
        vscode.env.clipboard
          .writeText(
            JSON.stringify(
              {
                nodes: importGraph.nodes(),
                edges: importGraph.edges(),
              },
              null,
              2
            )
          )
          .then(() => {
            vscode.window.showInformationMessage("复制成功！");
          });
      }
    )
  );

  const impManager = new ImportManager<CoderNamespace.ImportNode>(importGraph);
  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.getImportFileList", () => {
      const uri = vscode.window.activeTextEditor.document.uri;
      if (!uri) {
        vscode.window.showInformationMessage("不存在打开的文档");
        return;
      }
      const results = impManager.calPrevFileList(uri.fsPath);
      const flattened_results = results.reduce(
        (p, c) => [...p, ...c.map((cd, cdi) => ({ ...cd, depth: cdi }))],
        []
      );
      pickFiles2Open(
        flattened_results
          .filter((r) => r.fileType !== CoderNamespace.FILE_TYPES.node_modules)
          .map((r: any) => ({
            label: `${new Array(r.depth).fill("    ").join("")}➡️ ${
              r.relativePath
            }`,
            target: r.fullPath,
          }))
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.getRoutePaths", () => {
      const uri = vscode.window.activeTextEditor.document.uri;
      if (!uri) {
        vscode.window.showInformationMessage("不存在打开的文档");
        return;
      }
      try {
        const importFilePaths = impManager.calPrevFileList(uri.fsPath, true);
        const results = AppRouterManager.queryFileRoutePaths(
          uri.fsPath,
          importFilePaths.map((ifp) => ifp.map((fpd) => fpd.fullPath))
        );

        const flattened_results = results.reduce(
          (p, c) => [
            ...p,
            ...c.map((cd, cdi) => ({
              ...cd,
              depth: cdi,
              relativePath: cd.fileRelativePath,
              fullPath: path.join(ROOT_PATH, cd.fileRelativePath),
            })),
          ],
          []
        );
        pickFiles2Open(
          flattened_results.map((r: any) => ({
            label: `${new Array(r.depth).fill("    ").join("")}➡️ ${r.path}`,
            target: r.fullPath,
          }))
        );
      } catch (e) {
        console.log(e, "");
      }
    })
  );

  const fpx = new FuncParserX();
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "XkCoderPlugin.getFunctionUnitTestCode",
      (forCompletion: boolean) => {
        fpx.writeUnitTestThis(
          vscode.window.activeTextEditor,
          "getFunctionUnitTestCode",
          forCompletion
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.getDataFlowPaths", () => {
      vscode.window.showInformationMessage("正在施工中...");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.getEventPaths", () => {
      vscode.window.showInformationMessage("正在施工中...");
    })
  );

  // xk.icon.list
  // xk.sn.comp 这个放补全就好
  // const provider1 = vscode.languages.registerCompletionItemProvider('plaintext', {
  //   provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

  //     // a simple completion item which inserts `Hello World!`
  //     const simpleCompletion = new vscode.CompletionItem('Hello World!');

  //     // a completion item that inserts its text as snippet,
  //     // the `insertText`-property is a `SnippetString` which will be
  //     // honored by the editor.
  //     const snippetCompletion = new vscode.CompletionItem('Good part of the day');
  //     snippetCompletion.insertText = new vscode.SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?');
  //     snippetCompletion.documentation = new vscode.MarkdownString("Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting.");

  //     // a completion item that can be accepted by a commit character,
  //     // the `commitCharacters`-property is set which means that the completion will
  //     // be inserted and then the character will be typed.
  //     const commitCharacterCompletion = new vscode.CompletionItem('console');
  //     commitCharacterCompletion.commitCharacters = ['.'];
  //     commitCharacterCompletion.documentation = new vscode.MarkdownString('Press `.` to get `console.`');

  //     // a completion item that retriggers IntelliSense when being accepted,
  //     // the `command`-property is set which the editor will execute after
  //     // completion has been inserted. Also, the `insertText` is set so that
  //     // a space is inserted after `new`
  //     const commandCompletion = new vscode.CompletionItem('new');
  //     commandCompletion.kind = vscode.CompletionItemKind.Keyword;
  //     commandCompletion.insertText = 'new ';
  //     commandCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };

  //     // return all completion items as array
  //     return [
  //       simpleCompletion,
  //       snippetCompletion,
  //       commitCharacterCompletion,
  //       commandCompletion
  //     ];
  //   }
  // });

  // const provider2 = vscode.languages.registerCompletionItemProvider(
  //   'plaintext',
  //   {
  //     provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

  //       // get all text until the `position` and check if it reads `console.`
  //       // and if so then complete if `log`, `warn`, and `error`
  //       const linePrefix = document.lineAt(position).text.substr(0, position.character);
  //       if (!linePrefix.endsWith('console.')) {
  //         return undefined;
  //       }

  //       return [
  //         new vscode.CompletionItem('log', vscode.CompletionItemKind.Method),
  //         new vscode.CompletionItem('warn', vscode.CompletionItemKind.Method),
  //         new vscode.CompletionItem('error', vscode.CompletionItemKind.Method),
  //       ];
  //     }
  //   },
  //   '.' // triggered whenever a '.' is being typed
  // );
  // context.subscriptions.push(provider1, provider2);
}
