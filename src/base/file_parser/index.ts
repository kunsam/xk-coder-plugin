import * as vs from "vscode";
import * as ts from "typescript";
import { LanguageServiceHost } from "./languageServiceHost";
import { getDocumentFileName } from "../../utils/editor_util";

export class FileParser implements vs.Disposable {
  private _languageServiceHost: LanguageServiceHost;
  private _services: ts.LanguageService;
  constructor() {
    this._languageServiceHost = new LanguageServiceHost();
    this._services = ts.createLanguageService(
      this._languageServiceHost,
      ts.createDocumentRegistry()
    );
  }

  public getSourceFile(document: vs.TextDocument) {
    const fileText = document.getText();
    const canonicalFileName = getDocumentFileName(document);
    this._languageServiceHost.updateCurrentFile(canonicalFileName, fileText);
    this._services.getSyntacticDiagnostics(canonicalFileName);

    console.log(
      this._services.getNavigationTree(canonicalFileName),
      "this._services"
    );

    const sourceFile = this._services
      .getProgram()
      .getSourceFile(canonicalFileName);
    const newText = document.getText();
    sourceFile.update(newText, <ts.TextChangeRange>{
      newLength: newText.length,
      span: <ts.TextSpan>{
        start: 0,
        length: newText.length,
      },
    });
    return sourceFile;
  }

  public dispose() {}
}
