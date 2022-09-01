"use strict";
import * as vscode from "vscode";
import { SearchableCommands } from "./commands/config";
import { showAndExcuteCommands } from "./commands/utils";
import NodeFlowCommands from "./commands/code_tree";
import { FuncParserX } from "./base/function_parser";
import ImportManageCommand from "./commands/import_manage";
import { ImportSorter } from "./commands/import_sorter";
import { generateTestFileCommand } from "./base/unittest_coder/interactor";
import "./base/unittest_coder/generator";
import SharedCodeFeature from "./commands/shared_code";
import { DebuggerCommand } from "./commands/debugger";

export async function activate(context: vscode.ExtensionContext) {
  const impManage = new ImportManageCommand();
  impManage.init(context);

  new NodeFlowCommands(context);
  new SharedCodeFeature();

  new DebuggerCommand(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.openSearchEgnine", () => {
      showAndExcuteCommands(SearchableCommands);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.openWikiGuide", () => {
      vscode.env.openExternal(
        vscode.Uri.parse(
          "https://www.notion.so/kunsam624/xkool-e63205c83ff64a44ae1bdad001a2c080"
        )
      );
    })
  );

  const fpx = new FuncParserX();
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "XkCoderPlugin.getFunctionUnitTestCode",
      () => {
        const uri = vscode.window.activeTextEditor.document.uri;
        if (!uri) {
          vscode.window.showInformationMessage("不存在打开的文档");
          return;
        }

        generateTestFileCommand(uri.fsPath);

        // fpx.writeUnitTestThis(
        //   vscode.window.activeTextEditor,
        //   "getFunctionUnitTestCode",
        //   forCompletion
        // );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.sortFrontEndImports", () => {
      ImportSorter.sortWithTsEslint();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.getDataFlowPaths", () => {
      vscode.window.showInputBox().then((result) => {
        vscode.window.showInformationMessage("正在施工中...");
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.getEventPaths", () => {
      vscode.window.showInputBox().then((result) => {
        vscode.window.showInformationMessage("正在施工中...");
      });
    })
  );
}
