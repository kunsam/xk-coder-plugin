import { Figma } from "./figma.typing";

function upperFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export class FigmaCoderUtil {
  public static getTab(depth: number) {
    return new Array(depth).fill("\t").join("");
  }

  public static getNodeClassName(node: Figma.NodeBase) {
    return `${node.name.replace(/[:\s\/\-]/g, "_")}`;
  }

  public static getNodeComponentName(node: Figma.NodeBase) {
    return `${upperFirst(node.name).replace(/[:\s\/\-]/g, "")}`;
  }
}
