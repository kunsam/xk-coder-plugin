import { FigmaCoderUtil } from "./figma.coder.util";
import { Figma } from "./figma.typing";

export class FigmaReactCoder {
  public static getElementEventCode(
    node: Figma.NodeBaseLevel1,
    eventHandlerNameMap: Map<string, string>
  ) {
    let eventCode = "";
    if (node.reactData) {
      node.reactData.events.forEach((eventData) => {
        eventCode += `${eventData.name}={${eventHandlerNameMap.get(
          eventData.id
        )}} `;
      });
    }

    return eventCode;
  }

  public static getReactHtmlPrevCode({
    depth,
    tag,
    useTab,
    classNameCode,
    styleCode,
    contentCode,
    selfCloseTag,
    needBreakLine,
    eventCode,
  }: {
    depth: number;
    tag: string;
    classNameCode: string;
    styleCode: string;
    useTab: boolean;
    selfCloseTag: boolean;
    contentCode: string;
    needBreakLine: boolean;
    eventCode?: string;
  }) {
    let htmlCode = "";
    if (useTab) {
      htmlCode += `${FigmaCoderUtil.getTab(depth)}`;
    }
    htmlCode += `<${tag}`;
    if (classNameCode) {
      htmlCode += ` ${classNameCode}`;
    }
    if (styleCode) {
      htmlCode += ` ${styleCode}`;
    }
    if (eventCode) {
      htmlCode += ` ${eventCode}`;
    }

    if (selfCloseTag) {
      htmlCode += "/";
    }
    htmlCode += ">";
    if (needBreakLine) {
      htmlCode += `\n`;
    }
    if (contentCode) {
      htmlCode += `${contentCode}`;
      if (needBreakLine) {
        htmlCode += `\n`;
      }
    }

    return htmlCode;
  }

  public static getReactHtmlBackCode({
    needBreakLine,
    depth,
    tag,
    useTab,
  }: {
    depth: number;
    tag: string;
    useTab: boolean;
    needBreakLine: boolean;
  }) {
    let htmlCodeBack = "";
    htmlCodeBack += `${
      needBreakLine && useTab ? FigmaCoderUtil.getTab(depth) : ""
    }</${tag}>`;
    if (needBreakLine) {
      htmlCodeBack += `\n`;
    }
    return htmlCodeBack;
  }
}
