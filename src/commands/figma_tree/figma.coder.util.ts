import { Figma } from "./figma.typing";

export class FigmaCoderUtil {
  public static upperFirst(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  public static getTab(depth: number) {
    return new Array(depth).fill("\t").join("");
  }

  public static getNodeClassName(node: Figma.NodeBase) {
    return `${node.name.replace(/[:\s\/\-]/g, "_")}`;
  }

  public static getNodeComponentName(node: Figma.NodeBase) {
    return `${FigmaCoderUtil.upperFirst(node.name).replace(/[:\s\/\-]/g, "")}`;
  }
}
