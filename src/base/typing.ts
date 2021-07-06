export namespace CoderNamespace {
  export enum FILE_TYPES {
    "style" = "style",
    "picture" = "picture",
    "script" = "script",
    "node_modules" = "node_modules",
    "other" = "other",
  }

  export enum ScriptTypes {
    "frontend_utils" = "frontend_utils",
    "models" = "models",
    "api" = "api",
    "hooks" = "hooks",
    "page" = "page",
    "component" = "component",
    "other" = "other",
  }

  export interface ImportNode {
    label: string;
    relativePath: string;
    fileType: FILE_TYPES;
    fullPath: string; // id
    scriptType?: ScriptTypes;
    namedImports: {
      name: string;
      alias: string;
      fromId: string;
    }[];
  }

  export interface RouteNode {
    fileRelativePath: string; // id
    path: string;
    label: string;
    params: {
      key: string;
      debugValue: string;
    }[];
    query: {
      key: string;
      debugValue: string;
    }[];
  }
}
