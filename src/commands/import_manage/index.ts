import * as vscode from "vscode";
import { CONFIG_PATH, ExtensionConfig, ROOT_PATH } from "../../config";
import { loadConifg, pickFiles2Open } from "../../utils/extension_util";
import * as fs from "fs";
import * as path from "path";
import { Graph } from "graphlib";
import { ImportUtilV2 } from "../../utils/import_util_v2";
import * as parseStaticImports from "parse-static-imports";
import { LAZY_IMPORT_FILES } from "./lazy_files_config";
import { CoderNamespace } from "../../base/typing";
import { ImportManager } from "../../base/imports_manager";
import { AppRouterManager } from "../../base/router_manager";

export default class ImportManageCommand {
  private importVisitedSet = new Set();

  public importGraph = new Graph();

  public impManager: ImportManager<CoderNamespace.ImportNode>;
  public loading = false;

  public async recursivParseImports(file_abs_path: string) {
    if (!fs.existsSync(file_abs_path)) {
      return;
    }
    const fileStr = fs.readFileSync(file_abs_path).toString();
    if (!fileStr) {
      return;
    }
    if (this.importVisitedSet.has(file_abs_path)) {
      return;
    }
    this.importVisitedSet.add(file_abs_path);
    this.importGraph.setNode(
      file_abs_path,
      ImportUtilV2.getImportNode(file_abs_path, false, [])
    );

    let willParserfileStr = fileStr;
    const imports = parseStaticImports(willParserfileStr);
    for await (let imp of imports) {
      const fileNode = this.importGraph.node(file_abs_path);
      const target_path = imp.moduleName.replace(/'|"/g, "");
      let target_abs_path = path.join(
        ROOT_PATH,
        target_path.replace(/@/g, "src")
      );
      const isPackage = /^(\.|@)/.test(target_path) === false;
      if (isPackage) {
        this.importGraph.setNode(file_abs_path, {
          ...fileNode,
          namedImports: [
            ...fileNode.namedImports,
            ...imp.namedImports.map((ni) => ({ ...ni, fromId: target_path })),
          ],
        });
        this.importGraph.setNode(
          target_path,
          ImportUtilV2.getImportNode(target_path, true, [])
        );
        this.importGraph.setEdge(target_path, file_abs_path);
        continue;
      }
      if (/^(\.)/.test(target_path)) {
        target_abs_path = path.join(path.dirname(file_abs_path), target_path);
      }

      const target_abs_path_withext =
        ImportUtilV2.getFileExtedPathByImportPath(target_abs_path);
      this.importGraph.setNode(file_abs_path, {
        ...fileNode,
        namedImports: [
          ...fileNode.namedImports,
          ...imp.namedImports.map((ni) => ({
            ...ni,
            fromId: target_abs_path_withext,
          })),
        ],
      });
      this.importGraph.setNode(
        target_abs_path_withext,
        ImportUtilV2.getImportNode(target_abs_path_withext, false, [])
      );
      this.importGraph.setEdge(target_abs_path_withext, file_abs_path);
      await this.recursivParseImports(target_abs_path_withext);
    }
  }

  async init(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderPlugin.refreshExtensionConfig",
        () => {
          this.refresh(true).then((success) => {
            if (success) {
              vscode.window.showInformationMessage("刷新成功！", {
                modal: true,
              });
            }
          });
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderPlugin.getImportGraphDumpJson",
        () => {
          console.log(this.importGraph.nodes());
          vscode.env.clipboard
            .writeText(
              JSON.stringify(
                {
                  nodes: this.importGraph.nodes(),
                  edges: this.importGraph.edges(),
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
    this.impManager = new ImportManager<CoderNamespace.ImportNode>(
      this.importGraph
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("XkCoderPlugin.getImportFileList", () => {
        const uri = vscode.window.activeTextEditor.document.uri;
        if (!uri) {
          vscode.window.showInformationMessage("不存在打开的文档");
          return;
        }
        const results = this.impManager.calPrevFileList(uri.fsPath);
        const flattened_results = results.reduce(
          (p, c) => [...p, ...c.map((cd, cdi) => ({ ...cd, depth: cdi }))],
          []
        );
        pickFiles2Open(
          flattened_results
            .filter(
              (r) => r.fileType !== CoderNamespace.FILE_TYPES.node_modules
            )
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
          const importFilePaths = this.impManager.calPrevFileList(
            uri.fsPath,
            true
          );
          console.log(importFilePaths, this.impManager, "importFilePaths");
          const results = AppRouterManager.queryFileRoutePaths(
            uri.fsPath,
            importFilePaths.map((ifp) => ifp.map((fpd) => fpd.fullPath))
          );
          console.log(results, "results");
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

    this.refresh();
  }

  async refresh(showErrorMessage?: boolean): Promise<boolean> {
    if (this.loading) {
      return false;
    }
    const config = await loadConifg<ExtensionConfig>(
      CONFIG_PATH,
      showErrorMessage
    );
    if (!config) {
      return false;
    }
    this.loading = true;
    this.importVisitedSet.clear();
    this.importGraph = new Graph();
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "更新计算中...",
        cancellable: false,
      },
      async (progress, token) => {
        if (config) {
          for await (let entry of config.imports_entires) {
            await this.recursivParseImports(path.join(ROOT_PATH, entry.path));
          }
          for await (let lazy_file of LAZY_IMPORT_FILES) {
            const file_abs_path = path.join(ROOT_PATH, lazy_file.rpath);
            await this.recursivParseImports(file_abs_path);
            this.importGraph.setEdge(
              file_abs_path,
              path.join(ROOT_PATH, lazy_file.from)
            );
          }
        }
      }
    );
    this.impManager = new ImportManager<CoderNamespace.ImportNode>(
      this.importGraph
    );
    this.loading = false;
  }
}
