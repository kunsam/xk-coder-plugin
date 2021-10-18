import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export const PROJECT_DIR = "/.xkool";
export const PROJECT_WORKFLOWS_DIR = "/.xkool_workflows";

export const PROJECT_SHAREDCODE_DIR = "/.xkool_sharedcode";

export const ROOT_PATH: string =
  vscode.workspace.workspaceFolders[0] &&
  vscode.workspace.workspaceFolders[0].uri.path;

export const CONFIG_PATH = path.join(ROOT_PATH, PROJECT_DIR, "config.js");

export const CONTENT_MANAGER_CONFIG = {
  projectDirPath: ROOT_PATH,
  folderPaths: ["src/", "storybook/stories"],
};

export interface ExtensionConfig {
  ones: {
    email: string;
    password: string;
  };
  imports_entires: {
    path: string;
  }[];
}
