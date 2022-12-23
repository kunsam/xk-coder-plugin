import { FigmaNodeInferData } from "./figma.componentInfer";

export type FigmaTreeNode = {
  // 多次出现以第一个为准
  text: string;
  type: string;
  children?: FigmaTreeNode[];
  parent?: FigmaTreeNode;
  id: string; // 自动化生成后反向查找
  projectId: string;
};

export namespace Figma {
  export enum NodeTypes {
    GROUP = "GROUP",
    FRAME = "FRAME",
    CANVAS = "CANVAS",
    DOCUMENT = "DOCUMENT",
    VECTOR = "VECTOR",
    STAR = "STAR",
    LINE = "LINE",
    ELLIPSE = "ELLIPSE",
    REGULAR_POLYGON = "REGULAR_POLYGON",
    RECTANGLE = "RECTANGLE",
    TEXT = "TEXT",
    SLICE = "SLICE",
    COMPONENT = "COMPONENT",
    STICKY = "STICKY",
    INSTANCE = "INSTANCE",
    SHAPE_WITH_TEXT = "SHAPE_WITH_TEXT",
    CONNECTOR = "CONNECTOR",
  }
  export enum CounterAxisAlignItems {
    MIN = "MIN",
    CENTER = "CENTER",
    MAX = "MAX",
    BASELINE = "BASELINE",
  }

  export enum PrimaryAxisAlignItems {
    MIN = "MIN",
    CENTER = "CENTER",
    MAX = "MAX",
    SPACE_BETWEEN = "SPACE_BETWEEN",
  }
  export enum LayoutMode {
    NONE = "NONE",
    HORIZONTAL = "HORIZONTAL",
    VERTICAL = "VERTICAL",
  }

  export interface Bound {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  export interface NodeBase {
    id: string;
    name: string;
    type: string;
    children?: NodeBase[];
    // 推断信息
    inferedData?: FigmaNodeInferData;
    // 相似信息
    similarData?: {
      similarChildrenFirstIndexGroup: number[];
      similarChildrenGroup: {
        similarChildrenIndexes: number[];
      }[];
    };
  }

  export interface NodeBaseLevel1 extends NodeBase {
    absoluteBoundingBox: Bound;
    absoluteRenderBounds: Bound;
    children?: NodeBaseLevel1[];
  }

  export interface Group extends NodeBaseLevel1 {
    cornerRadius: number;
    backgroundColor: { r: number; g: number; b: number; a: number };
  }
  export interface Frame extends NodeBaseLevel1 {
    paddingLeft: number;
    paddingRight: number;
    layoutMode?: LayoutMode;
    rectangleCornerRadii: number[];
    backgroundColor: { r: number; g: number; b: number; a: number };
    counterAxisAlignItems?: CounterAxisAlignItems;
    primaryAxisAlignItems?: PrimaryAxisAlignItems;
  }
  export interface RECTANGLE extends NodeBaseLevel1 {
    d: number;
  }
  export interface TEXT extends NodeBaseLevel1 {
    characters: string;
    // style: React.CSSProperties;
    style: any;
  }

  export interface File {
    fileKey: string;
    fileName: string;
    document: {
      children: NodeBase[];
    };
  }
  export interface Project {
    id: string;
    name: string;
  }

  export interface ProjectData {
    project: Project;
    files: File[];
  }

  export interface NodeSelectionBase {
    id: string;
    x: number;
    y: number;
    children: NodeSelectionBase[];
  }
}
