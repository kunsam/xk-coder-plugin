import * as fs from "fs";
import * as path from "path";
import { join, extname } from "path";
import { CoderNamespace } from "../base/typing";
import { ROOT_PATH } from "../config";
// import lineReader from "line-reader";

export class ImportUtilV2 {
  public static getFileExtedPathByImportPath(imp_path: string): string {
    if (extname(imp_path)) {
      return imp_path;
    }
    const imp_paths = imp_path.split("/");

    const dealPaths = (target_paths: string[]) => {
      let full_path: string = imp_path;
      const exts = ["js", "jsx", "ts", "tsx"];
      const filename = target_paths.pop();
      exts.every((ext) => {
        const f_path = join(target_paths.join("/"), `./${filename}.${ext}`);
        if (fs.existsSync(f_path)) {
          full_path = f_path;
        }
        return full_path === imp_path;
      });
      return full_path;
    };

    let result_full_path = imp_path;

    result_full_path = dealPaths([...imp_paths]);
    if (result_full_path !== imp_path) {
      return result_full_path;
    }
    result_full_path = dealPaths([...imp_paths, "index"]);

    return result_full_path;
  }

  // public static async getOnlyImportStrFromFileStr(
  //   filePath: string
  // ): Promise<string> {
  //   let fileStr = "";

  //   return new Promise((res) => {
  //     console.log(filePath, "123");
  //     lineReader.eachLine(filePath, function (lineText: string, last) {
  //       // 仅仅是 import 的情况 e.g. import './index.scss'
  //       console.log(lineText, last, "lineTextlineText");
  //       if (lineText !== "") {
  //         if (!/^import\s/.test(lineText)) {
  //           fileStr += lineText;
  //         }
  //       }
  //       if (last) {
  //         res(fileStr);
  //       }
  //     });
  //   });
  // }

  public static getImportNode(
    fileFullPath: string,
    isPackage: boolean,
    namedImports: { name: string; alias: string; fromId: string }[]
  ): CoderNamespace.ImportNode {
    const relativePath = isPackage
      ? fileFullPath
      : path.relative(ROOT_PATH, fileFullPath);
    return {
      relativePath,
      label: relativePath,
      fullPath: fileFullPath,
      namedImports: namedImports,
      fileType: this.getFileType(fileFullPath),
      scriptType: this.getScriptType(fileFullPath),
    };
  }

  public static getScriptType(
    filePath: string
  ): CoderNamespace.ScriptTypes | undefined {
    if (this.getFileType(filePath) !== CoderNamespace.FILE_TYPES.script) {
      return undefined;
    }
    const relativePaths = filePath.split("/");
    const srcIndex = relativePaths.findIndex((p) => p === "src");
    const srcNextPathName = relativePaths[srcIndex + 1];
    if (!srcNextPathName) {
      return CoderNamespace.ScriptTypes.other;
    }
    switch (srcNextPathName) {
      default: {
        return CoderNamespace.ScriptTypes.other;
      }
      case "frontend_utils": {
        return CoderNamespace.ScriptTypes.frontend_utils;
      }
      case "models": {
        return CoderNamespace.ScriptTypes.models;
      }
      case "api": {
        return CoderNamespace.ScriptTypes.api;
      }
      case "hooks": {
        return CoderNamespace.ScriptTypes.hooks;
      }
      case "page": {
        return CoderNamespace.ScriptTypes.page;
      }
      case "xkui":
      case "components":
      case "component": {
        return CoderNamespace.ScriptTypes.component;
      }
    }
  }

  public static getFileType(fullPath: string): CoderNamespace.FILE_TYPES {
    const fullPaths = fullPath.split("/");
    const lastPath = fullPaths.pop();
    let fileType: CoderNamespace.FILE_TYPES;
    if (!path.extname(lastPath)) {
      fileType = CoderNamespace.FILE_TYPES.node_modules;
    } else {
      switch (path.extname(lastPath)) {
        default: {
          fileType = CoderNamespace.FILE_TYPES.other;
          break;
        }
        case ".js":
        case ".jsx":
        case ".ts":
        case ".tsx": {
          fileType = CoderNamespace.FILE_TYPES.script;
          break;
        }
        case ".jpeg":
        case ".png":
        case ".jpg":
        case ".svg": {
          fileType = CoderNamespace.FILE_TYPES.picture;
          break;
        }
        case ".sass":
        case ".scss":
        case ".css":
        case ".less": {
          fileType = CoderNamespace.FILE_TYPES.style;
          break;
        }
      }
    }
    return fileType;
  }
}
