import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { FigmaApi } from "./figma.api";
import { FigmaTree } from "./figma.tree";
import { Figma, FigmaTreeNode } from "./figma.typing";
import * as express from "express";
import * as http from "http";
import * as bodyParser from "body-parser";
import { FigmaProjectCodeProvider } from "./figma.coder";
import { vscodeInsertText } from "../../utils/extension_util";

// 点击开始可以获得这段代码
const Port = 3779;

const FigmaDataCachePath = path.join(__dirname, "figmaDataCache.json");
const FigmaDataFileCachePath = (fileKey: string) =>
  path.join(__dirname, `figmaDataCache.${fileKey}.json`);

const TeamId = "983579574468501597";
const TOKEN = "figd_rcNHrbnI19chi6oSrWhYxBrRjw7XcQE7HIyqDci4";

export class FigmaTreeApp {
  private _view: vscode.TreeView<FigmaTreeNode>;
  private _treeDataProvider: FigmaTree;
  private _server?: http.Server;
  private _currentActiveNode?: FigmaTreeNode;

  constructor(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderFigma.startFigmaCode",
        async (selectedNode: FigmaTreeNode) => {
          this.handleSelection(selectedNode);
        }
      )
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderFigma.refreshFigmaDataCache",
        async () => {
          if (fs.existsSync(FigmaDataCachePath)) {
            fs.unlinkSync(FigmaDataCachePath);
            this.init().then(() => {
              vscode.window.showInformationMessage("刷新成功");
            });
          }
        }
      )
    );
  }

  private async getFileData(fileId: string, fileName: string) {
    let fileData: Figma.File | undefined;
    const cachePath = FigmaDataFileCachePath(fileId);
    if (fs.existsSync(cachePath)) {
      fileData = __non_webpack_require__(`${cachePath}`);
      console.log(fileData, "fileData");
    } else {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "请求Figma文件数据中",
        },
        async (progress) => {
          fileData = await FigmaApi.getProjectFileAllInfo(
            fileId,
            fileName,
            TOKEN
          );
          console.log(fileData, "fileData");
        }
      );
      fs.writeFileSync(FigmaDataCachePath, JSON.stringify(fileData));
    }
    return fileData;
  }

  public async init() {
    let projectDatas: Figma.ProjectData[];
    if (fs.existsSync(FigmaDataCachePath)) {
      projectDatas = __non_webpack_require__(`${FigmaDataCachePath}`);
      console.log(projectDatas, "FigmaDataCachePath");
    } else {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "请求Figma数据中",
        },
        async (progress) => {
          projectDatas = await FigmaApi.getUserProjectData(TeamId, TOKEN);
        }
      );
      fs.writeFileSync(FigmaDataCachePath, JSON.stringify(projectDatas));
    }

    this._treeDataProvider = new FigmaTree(projectDatas);

    this._view = vscode.window.createTreeView("XkCoderFigma", {
      treeDataProvider: this._treeDataProvider,
      showCollapseAll: true,
    });

    if (!this._server) {
      await this.initServer();
    }

    this._view.onDidChangeSelection((e) => {
      e.selection.forEach((data) => {});
    });
  }

  public get treeDataProvider() {
    return this._treeDataProvider;
  }
  public refresh() {
    this._treeDataProvider.refresh();
  }

  public reset() {
    this.init();
  }

  private handleSelection(data: FigmaTreeNode) {
    if (data.type === "file") {
      vscode.window
        .showInformationMessage(
          "请在打开Figma页面后，将figmaVscodeScript运行代码复制到调试面板使用",
          {
            modal: true,
          }
        )
        .then(() => {
          this._currentActiveNode = data;
          vscode.env.openExternal(
            vscode.Uri.parse(`https://www.figma.com/file/${data.id}`)
          );
        });
      //
    }
  }

  private initServer() {
    return new Promise<void>((resolve) => {
      const config = {
        server_port: Port,
      };
      if (config) {
        const app = express();
        //Here we are configuring express to use body-parser as middle-ware.
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.all("*", function (req, res, next) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "X-Requested-With");
          res.header(
            "Access-Control-Allow-Methods",
            "PUT,POST,GET,DELETE,OPTIONS"
          );
          res.header("X-Powered-By", " 3.2.1");
          res.header("Content-Type", "application/json;charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,HEAD,OPTIONS,POST,PUT"
          );
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
          );
          next();
        });

        const router = express.Router();

        router.post("/handle", (request, response) => {
          const data: Figma.NodeBaseLevel1 = request.body;
          console.log(data, request.query, "data");
          if (data && request.query) {
            const codeProvider = new FigmaProjectCodeProvider();
            const result = codeProvider.getCode(data);
            if (request.query.reactCode) {
              vscodeInsertText((x) => result.reactCode);
            }
            if (request.query.cssCode) {
              vscodeInsertText((x) => result.cssCode);
            }
          }
          response.send(true);
        });

        app.use("/", router);

        this._server = app.listen(config.server_port, () => {
          vscode.window.showInformationMessage(
            `已在${config.server_port}端口开启Figma服务`
          );
          resolve();
        });
      }
    });
  }
}
