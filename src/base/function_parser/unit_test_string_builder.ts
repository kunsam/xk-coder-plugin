import * as vscode from "vscode";
import { SnippetStringBuilder } from "../../utils/editor_util";

export class UnitTestStringBuilder {
  private readonly _sb1 = new SnippetStringBuilder();
  // private readonly _sb2 = new SnippetStringBuilder();

  public insertArgTest(
    argsIndex: number,
    functionName: string,
    args: any[],
    getFullArg: (arg: any) => any[]
  ) {
    this._sb1.append(
      `describe('test ${functionName} with args${argsIndex}', () => {`
    );

    args.forEach((arg, argi) => {
      const fullArgs = getFullArg(arg);
      const argName = `args${argsIndex}_${argi}`;
      // this._sb1.append(
      //   `const ${argName} = ${JSON.stringify(fullArgs, null, 2)};`
      // );
      let excuteText = `${functionName}(`;
      fullArgs.forEach((farg) => {
        excuteText += `${
          typeof farg == "object" ? JSON.stringify(farg) : farg
        }, `;
      });
      excuteText += ")";
      this._sb1.append(`console.log('${argName}:', ${excuteText}))`);
      this._sb1.appendLine();
      this._sb1.append(
        `it('${functionName} should correct when pass args: ${argName}', (): void => {`
      );
      this._sb1.appendLine();
      this._sb1.append(`expect(${excuteText}).toBe(\$\{${argName}\} result);`);
      this._sb1.appendLine();
      this._sb1.append("});");
      this._sb1.appendLine();
      // this.insertArgsLogRecord(
      //   getFullArg(arg),
      //   `args${argsIndex}_`,
      //   argi,
      //   functionName
      // );
      // this.insertItTestCase(`args${argsIndex}_`, argi, functionName);
    });
    this._sb1.append("});");
  }

  public insertArgsLogRecord(
    args: any,
    argName: string,
    index: number,
    functionName: string
  ) {
    this._sb1.append(
      `const ${argName}${index} = ${JSON.stringify(args, null, 2)};`
    );
    this._sb1.append(
      `console.log('\n${argName}${index}:', ${functionName}(${argName}${index}))`
    );
    this._sb1.appendLine();
  }

  public insertItTestCase(
    argName: string,
    index: number,
    functionName: string
  ) {
    this._sb1.append(
      `it('${functionName} should correct when pass args: ${argName}${index}', (): void => {`
    );
    this._sb1.append(
      `expect(functionName(${argName}${index})).toBe(\$\{${index}\});`
    );
    this._sb1.append("});");
    this._sb1.appendLine();
  }

  public toString(): vscode.SnippetString {
    return this._sb1.toCommentValue();
  }
}
