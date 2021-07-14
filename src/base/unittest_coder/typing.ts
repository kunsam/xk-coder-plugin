import { SourceFile } from "typescript";
export namespace UnitCoderNamespace {
  export enum TestTargetType {
    function = "function",
    react_function = "react_function",
    react_function_comp = "react_function_comp",
    react_class_comp = "react_class_comp",
    util_class = "util_class",
  }

  export type DealerFunction = (
    fileName: string,
    sourceFile: SourceFile
  ) => Promise<{ errorMsg?: string; fileStr: string }>;

  export interface UnitTestSource {
    isExportDefault?: boolean;
    functionName: string;
    parameters: UnitTestSourceParameter[];
  }
  export type UnitTestSourceParameter = string; // JSON string
  // export interface UnitTestSourceParameter {
  //   name: string;
  //   type: string;
  //   isRequired: boolean
  // }
}
