import { FigmaCoderUtil } from "./figma.coder.util";

export class FigmaReactCoder {
  public static getReactHtmlPrevCode({
    depth,
    tag,
    useTab,
    classNameCode,
    styleCode,
    contentCode,
    selfCloseTag,
    needBreakLine,
  }: {
    depth: number;
    tag: string;
    classNameCode: string;
    styleCode: string;
    useTab: boolean;
    selfCloseTag: boolean;
    contentCode: string;
    needBreakLine: boolean;
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
