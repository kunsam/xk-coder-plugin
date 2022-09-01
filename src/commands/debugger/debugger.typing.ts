export interface DebugNode {
  current: {
    type: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
  child?: DebugNode;
}
