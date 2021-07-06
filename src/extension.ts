"use strict";
import * as vscode from "vscode";
import { SearchableCommands } from "./commands/config";
import { showAndExcuteCommands } from "./commands/utils";
import NodeFlowCommands from "./commands/code_tree";
import { FuncParserX } from "./base/function_parser";
import ImportManageCommand from "./commands/import_manage";

export async function activate(context: vscode.ExtensionContext) {
  const impManage = new ImportManageCommand();
  impManage.init(context);

  new NodeFlowCommands(context);
  context.subscriptions.push(
    vscode.commands.registerCommand("XkCoderPlugin.openSearchEgnine", () => {
      showAndExcuteCommands(SearchableCommands);
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
}
