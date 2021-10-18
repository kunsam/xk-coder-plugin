import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { PROJECT_SHAREDCODE_DIR, ROOT_PATH } from "../../config";
import { SharedCode } from "./typing";

const CONFIG_FILE_ABS_PATH = path.join(
  ROOT_PATH,
  PROJECT_SHAREDCODE_DIR,
  "/index.js"
);

export default class SharedCodeFeature {
  private _root: SharedCode.ITreeItem = {
    children: [],
  };

  private _fastKeyMap: Map<string, SharedCode.ITreeItem> = new Map();

  private _travese(
    root: SharedCode.ITreeItem,
    callBack: (item: SharedCode.ITreeItem) => void
  ) {
    if (root.children) {
      root.children.forEach((c) => {
        callBack(c);
        this._travese(c, callBack);
      });
    }
  }

  private _getDatasFromPath(path: string) {
    let datas: SharedCode.ITreeItem[] = [];
    if (fs.existsSync(path)) {
      datas = __non_webpack_require__(`${path}`);
      delete __non_webpack_require__.cache[
        __non_webpack_require__.resolve(`${path}`)
      ];
    }
    return datas;
  }

  private _initTreeRercursive(element: SharedCode.ITreeItem) {
    if (element.requirePath) {
      const truePath = path.join(
        ROOT_PATH,
        PROJECT_SHAREDCODE_DIR,
        element.requirePath
      );
      try {
        element.children = __non_webpack_require__(`${truePath}`);
        delete __non_webpack_require__.cache[
          __non_webpack_require__.resolve(`${truePath}`)
        ];
      } catch {
        vscode.window.showErrorMessage(`加载SharedCode路径错误：${truePath}`);
      }
    }

    if (element.data) {
      if (element.data.fastModeKey) {
        this._fastKeyMap.set(element.data.fastModeKey, element);
      }
    }

    if (element.children && element.children.length) {
      element.children.forEach((c) => {
        this._initTreeRercursive(c);
      });
    }
  }

  constructor() {
    this.init();
  }

  public init() {
    this.loadProjectCodes();

    vscode.commands.registerCommand("XkCoderPlugin.refreshSharedCode", () => {
      vscode.window.showInformationMessage(
        `XkCoderPlugin called refreshSharedCode.`
      );
      this.loadProjectCodes();
    });

    vscode.commands.registerCommand(
      "XkCoderPlugin.openInputSearchSharedCode",
      this.openSearchSharedCode
    );

    vscode.commands.registerCommand(
      "XkCoderPlugin.generateSharedCodeData",
      () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const range = new vscode.Range(
            editor.selection.start,
            editor.selection.end
          );
          const text = editor.document.getText(range);
          if (text) {
            const data: SharedCode.ITreeItem = {
              data: {
                name: "name",
                desc: "",
                code: text,
                fastModeKey: "可以填或者可以不填",
              },
            };

            vscode.env.clipboard
              .writeText(JSON.stringify(data, null, 2))
              .then(() => {
                vscode.window.showInformationMessage("已复制到剪切板");
              });
          }
        }
      }
    );
  }

  public openSearchSharedCode = () => {
    vscode.window
      .showQuickPick([
        { id: "1", label: "1. 使用标签搜索" },
        { id: "2", label: "2. 使用树形选择" },
        { id: "3", label: "3. 使用快速字符" },
      ])
      .then((data) => {
        if (data) {
          switch (data.id) {
            case "1": {
              this.openTagSearchSharedCode();
              break;
            }
            case "2": {
              this.openSelectSearchSharedCode();
              break;
            }
            case "3": {
              this.openInputSearchSharedCode();
              break;
            }
          }
        }
      });
  };

  private _searchTags = (key: string) => {
    let results: SharedCode.ITreeItem[] = [];
    this._travese(this._root, (item) => {
      if (item.data && item.data.tags) {
        const finded = item.data.tags.find((tag) => tag.includes(key));
        if (finded) {
          results.push(item);
        }
      }
    });
    return results;
  };

  private _copyDataCode(item: SharedCode.ITreeItem) {
    if (item.data) {
      vscode.env.clipboard.writeText(item.data.code).then(() => {
        vscode.window.showInformationMessage("复制成功！");
      });
    }
  }

  public openTagSearchSharedCode = () => {
    vscode.window.showInputBox({ placeHolder: "输入关键词" }).then((data) => {
      if (!data) {
        return;
      }
      const results = this._searchTags(data);
      if (!results.length) {
        vscode.window.showWarningMessage("没有找到结果");
      }
      if (results.length) {
        vscode.window
          .showQuickPick(
            results.map((r, ri) => ({
              id: ri,
              label: this._getItemLabel(r),
              data: r,
            }))
          )
          .then((pr) => {
            this._copyDataCode(pr.data);
          });
      }
    });
  };

  private _getItemLabel = (item: SharedCode.ITreeItem) => {
    let ret: string = "";
    if (item.data) {
      ret = item.data.name;
      if (item.data.desc) {
        ret += `  ${item.data.desc}`;
      }
    } else {
      ret = item.name || item.requirePath || "暂无名称";
    }
    return ret;
  };

  private _recurseOpenSelectSearch = (root: SharedCode.ITreeItem) => {
    if (root.children) {
      vscode.window
        .showQuickPick(
          root.children.map((item) => ({
            label: this._getItemLabel(item),
            data: item,
          }))
        )
        .then((picked) => {
          if (picked.data.children && picked.data.children.length) {
            this._recurseOpenSelectSearch(picked.data);
          } else {
            this._copyDataCode(picked.data);
          }
        });
    }
  };

  public openSelectSearchSharedCode = () => {
    this._recurseOpenSelectSearch(this._root);
  };

  public openInputSearchSharedCode = () => {
    vscode.window.showInputBox({ placeHolder: "请输入快速key" }).then((key) => {
      const item = this._fastKeyMap.get(key);
      if (!item) {
        vscode.window.showWarningMessage("没有找到结果");
      } else {
        this._copyDataCode(item);
      }
    });
  };

  public loadProjectCodes() {
    this._fastKeyMap.clear();
    this._root.children = this._getDatasFromPath(CONFIG_FILE_ABS_PATH);
    this._initTreeRercursive(this._root);
  }
}
