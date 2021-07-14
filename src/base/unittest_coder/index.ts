import { SourceFile } from "typescript";
import { UnitCoderNamespace } from "./typing";
import * as fes from "fs-extra";
import * as path from "path";

export class UnitTestGenerator {
  public static generators: Map<
    UnitCoderNamespace.TestTargetType,
    UnitCoderNamespace.DealerFunction
  > = new Map();
  public static register(
    type: UnitCoderNamespace.TestTargetType,
    func: UnitCoderNamespace.DealerFunction
  ) {
    this.generators.set(type, func);
  }
  public static async generaUnitTestFile(
    type: UnitCoderNamespace.TestTargetType,
    fileAbsPath: string,
    sf: SourceFile
  ) {
    if (this.generators.has(type)) {
      const result = await this.generators.get(type)(
        path.basename(fileAbsPath),
        sf
      );
      if (result.errorMsg) {
        return {
          errorMsg: result.errorMsg,
        };
      } else {
        let trueFileAbsPath = fileAbsPath;
        if (fes.existsSync(fileAbsPath)) {
          let fileNames = path.basename(fileAbsPath).split(".");
          if (fileNames.length > 1) {
            const ext = fileNames.pop();
            fileNames = [...fileNames, "test", ext];
          }
          if (fileNames.length > 2) {
            const onmae = fileNames[fileNames.length - 3];
            fileNames.splice(
              fileNames.length - 3,
              1,
              onmae + Math.round(Math.random() * 100 + 100)
            );
            trueFileAbsPath = path.join(
              path.dirname(fileAbsPath),
              fileNames.join(".")
            );
          }
        }
        await fes.ensureFile(trueFileAbsPath);
        await fes.writeFile(trueFileAbsPath, result.fileStr);
        return {};
      }
    }
    return {
      errorMsg: "no exist",
    };
  }
}
