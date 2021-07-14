import * as vscode from "vscode";
import { UnitTestGenerator } from ".";
import { FileParser } from "../file_parser";
import { UnitCoderNamespace } from "./typing";

const fileParser = new FileParser();

export function generateTestFileCommand(fileAbsPath: string) {
  vscode.window
    .showQuickPick([
      {
        label: "纯函数",
        target: UnitCoderNamespace.TestTargetType.function,
      },
      {
        label: "react函数组件",
        target: UnitCoderNamespace.TestTargetType.react_function_comp,
      },
      {
        label: "react hook/viewmodel",
        target: UnitCoderNamespace.TestTargetType.react_function,
      },
      {
        label: "react Class 组件",
        target: UnitCoderNamespace.TestTargetType.react_class_comp,
      },
      {
        label: "util Class",
        target: UnitCoderNamespace.TestTargetType.util_class,
      },
    ])
    .then((result) => {
      if (result) {
        if (
          result.target === UnitCoderNamespace.TestTargetType.react_class_comp
        ) {
          vscode.window.showInformationMessage("暂未开放！");
          return;
        }
        UnitTestGenerator.generaUnitTestFile(
          result.target,
          fileAbsPath,
          fileParser.getSourceFile(vscode.window.activeTextEditor.document)
        ).then((result) => {
          if (result.errorMsg) {
            vscode.window.showErrorMessage(result.errorMsg);
          } else {
            vscode.window.showInformationMessage("生成成功！");
          }
        });
      }
    });
}
