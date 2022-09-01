import * as vscode from "vscode";
import * as express from "express";
import * as http from "http";
import * as bodyParser from "body-parser";
import { DebugNode } from "./debugger.typing";
import { GotoTextDocument } from "../../utils/extension_util";

export class DebuggerCommand {
  private _server: http.Server;

  constructor(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderPlugin.openDebuggerServer",
        this.initServer.bind(this)
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "XkCoderPlugin.closeDebuggerServer",
        () => {
          this._server.close();
          this._server = undefined;
          vscode.window.showInformationMessage("已关闭");
        }
      )
    );
  }

  private initServer() {
    const config = {
      server_port: 3778,
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
        const data: DebugNode = request.body;
        if (data) {
          this.openDebugInfo(data);
        }
        response.send(true);
      });

      app.use("/", router);

      this._server = app.listen(config.server_port || 3778, () => {
        vscode.window.showInformationMessage(
          `已在${config.server_port || 3778}端口开启`
        );
      });
    }
  }

  public openDebugInfo(data: DebugNode) {
    let items: { label: string; data: DebugNode }[] = [];
    let currentData: DebugNode | undefined = data;
    let depth: number = 0;

    const getFileName = (filename: string) => {
      const groups = filename.split("/");
      let name = groups[groups.length - 1] || filename;
      if (name.includes("index") && groups.length > 1) {
        name = groups[groups.length - 2];
      }
      return name;
    };

    while (currentData) {
      if (currentData) {
        items.push({
          data: currentData,
          label: `${new Array(depth).fill("\t").join()}.${getFileName(
            currentData.current.fileName
          )}`,
        });
      }
      currentData = currentData.child;
    }

    vscode.window.showQuickPick(items).then((result) => {
      if (result) {
        const { fileName, lineNumber, columnNumber } = result.data.current;
        GotoTextDocument(fileName, {
          range: {
            start: {
              line: lineNumber,
              character: columnNumber,
            },
            end: {
              line: lineNumber,
              character: columnNumber,
            },
          },
        });
      }
    });
  }
}
