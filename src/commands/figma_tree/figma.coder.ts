import { FigmaCoderUtil } from "./figma.coder.util";
import { inferNodeComponent } from "./figma.componentInfer";
import { FigmaReactCoder } from "./figma.react.coder";
import { Figma } from "./figma.typing";

const getTab = FigmaCoderUtil.getTab;
const getNodeClassName = FigmaCoderUtil.getNodeClassName;

const getContentCode = (node: Figma.NodeBaseLevel1, content?: string) => {
  if (!node.reactData) {
    return content || node.name;
  }
  const { props, states } = node.reactData;
  if (props.length) {
    return `{props.${props[0].name}}`;
  } else if (states.length) {
    return `{${states[0].name}}`;
  }
  return content || node.name;
};

function CommonCSSProvider(
  node: Figma.NodeBaseLevel1,
  parent: Figma.NodeBaseLevel1 | undefined,
  args: {
    depth: number;
    isAbsolteLayout?: boolean;
  }
) {
  const cssLineCodes: string[] = [];
  let cssClassName: string = "";
  let cssCode: string = "";

  if (node.children?.length === 0) {
    return {
      cssClassName: "",
      cssCode: "",
    };
  }

  if (args.depth === 0) {
    cssClassName = "Container";
  } else {
    cssClassName = "Container_" + getNodeClassName(node);
  }

  cssLineCodes.push(`width: ${node.absoluteBoundingBox.width}px;`);
  cssLineCodes.push(`height: ${node.absoluteBoundingBox.height}px;`);

  if (args.isAbsolteLayout) {
    cssLineCodes.push(`position: absolute;`);
    if (parent) {
      const left = node.absoluteBoundingBox.x - parent.absoluteBoundingBox.x;
      const right =
        parent.absoluteBoundingBox.x +
        parent.absoluteBoundingBox.width -
        node.absoluteBoundingBox.x -
        node.absoluteBoundingBox.width;
      if (left < right) {
        cssLineCodes.push(`left: ${left}px;`);
      } else {
        cssLineCodes.push(`right: ${right}px;`);
      }
      const top = node.absoluteBoundingBox.y - parent.absoluteBoundingBox.y;
      const bottom =
        parent.absoluteBoundingBox.y +
        parent.absoluteBoundingBox.height -
        node.absoluteBoundingBox.y -
        node.absoluteBoundingBox.height;
      if (top < bottom) {
        cssLineCodes.push(`top: ${top}px;`);
      } else {
        cssLineCodes.push(`bottom: ${bottom}px;`);
      }
    } else {
      cssLineCodes.push(`left: 0px;`);
      cssLineCodes.push(`top: 0px;`);
    }
  }

  if (node.children && node.children?.length >= 2) {
    cssLineCodes.push(`display: flex;`);
  }

  // if (node.backgroundColor) {
  //   cssLineCodes.push(`background-color: ${node.backgroundColor};`);
  // }
  // if (node.paddingLeft) {
  //   cssLineCodes.push(`padding-left: ${node.paddingLeft};`);
  // }
  // if (node.paddingRight) {
  //   cssLineCodes.push(`padding-right: ${node.paddingRight};`);
  // }
  // if (node.rectangleCornerRadii) {
  //   const ra = node.rectangleCornerRadii;
  //   cssLineCodes.push(
  // 	`border-radius: ${ra[0]}px ${ra[1]}px ${ra[2]}px ${ra[3]}px;`
  //   );
  // }

  cssCode += `.${cssClassName}\n{${cssLineCodes
    .map((code) => `\t${code}`)
    .join("\n")}\n}\n`;

  return {
    cssClassName,
    cssCode,
  };
}

function CommonNodeHtmlProvider(
  node: Figma.NodeBaseLevel1,
  parent: Figma.NodeBaseLevel1 | undefined,
  depth: number,
  className: string,
  eventHandlerNameMap: Map<string, string>
) {
  let htmlCodePrev: string = "";
  let htmlCodeBack: string = "";
  let tag = "div";
  let styleCode = "";
  let classNameCode = "";
  let contentCode = "";

  let selfCloseTag = true;
  let needBreakLine = false;
  if (node.children && node.children.length > 0) {
    selfCloseTag = false;
    needBreakLine = true;
  }

  if (className) {
    classNameCode += `className={styles.${className}}`;
  }

  switch (node.type) {
    default: {
      if (!node.children || node.children.length === 0) {
        contentCode = getContentCode(node);
        selfCloseTag = false;
      }
      break;
    }
    case Figma.NodeTypes.VECTOR: {
      tag = `Icon${node.name.replace(/[\s\(\)]/g, "")}`;
      styleCode = `style={{ fontSize: ${Math.ceil(
        node.absoluteBoundingBox.width
      )} }}`;
      break;
    }
    case Figma.NodeTypes.INSTANCE: {
      if (node.inferedData?.isButton) {
        tag = "Button";
        selfCloseTag = false;
        contentCode = getContentCode(node);
      }
      break;
    }
  }
  const eventCode = FigmaReactCoder.getElementEventCode(
    node,
    eventHandlerNameMap
  );
  htmlCodePrev += FigmaReactCoder.getReactHtmlPrevCode({
    depth,
    tag,
    useTab: true,
    classNameCode,
    styleCode,
    selfCloseTag,
    contentCode,
    needBreakLine,
    eventCode,
  });

  if (!selfCloseTag) {
    htmlCodeBack += FigmaReactCoder.getReactHtmlBackCode({
      depth,
      tag,
      useTab: true,
      needBreakLine,
    });
  }

  return {
    htmlCodePrev,
    htmlCodeBack,
  };
}

function FrameCSSProvider(
  node: Figma.Frame,
  parent: Figma.NodeBaseLevel1 | undefined,
  args: {
    depth: number;
    isAbsolteLayout?: boolean;
  }
) {
  const cssLineCodes: string[] = [];
  let cssClassName: string = "";
  let cssCode: string = "";
  let isFlexContainer = false;
  if (node.children && node.children?.length >= 2) {
    if (node.counterAxisAlignItems || node.primaryAxisAlignItems) {
      isFlexContainer = true;
    }
  }

  if (args.depth === 0) {
    cssClassName = "Container";
  } else {
    cssClassName = "Container_" + getNodeClassName(node);
  }

  if (!isFlexContainer) {
    cssLineCodes.push(`width: ${node.absoluteBoundingBox.width}px;`);
    cssLineCodes.push(`height: ${node.absoluteBoundingBox.height}px;`);
  }

  if (args.isAbsolteLayout) {
    cssLineCodes.push(`position: absolute;`);
    if (parent) {
      const left = node.absoluteBoundingBox.x - parent.absoluteBoundingBox.x;
      const right =
        parent.absoluteBoundingBox.x +
        parent.absoluteBoundingBox.width -
        node.absoluteBoundingBox.x -
        node.absoluteBoundingBox.width;
      if (left < right) {
        cssLineCodes.push(`left: ${left}px;`);
      } else {
        cssLineCodes.push(`right: ${right}px;`);
      }
      const top = node.absoluteBoundingBox.y - parent.absoluteBoundingBox.y;
      const bottom =
        parent.absoluteBoundingBox.y +
        parent.absoluteBoundingBox.height -
        node.absoluteBoundingBox.y -
        node.absoluteBoundingBox.height;
      if (top < bottom) {
        cssLineCodes.push(`top: ${top}px;`);
      } else {
        cssLineCodes.push(`bottom: ${bottom}px;`);
      }
    } else {
      cssLineCodes.push(`left: 0px;`);
      cssLineCodes.push(`top: 0px;`);
    }
  }

  if (isFlexContainer) {
    cssLineCodes.push(`display: flex;`);
    if (node.layoutMode === Figma.LayoutMode.VERTICAL) {
      cssLineCodes.push(`flex-direction: column;`);
    }

    switch (node.counterAxisAlignItems) {
      default: {
        break;
      }
      case Figma.CounterAxisAlignItems.CENTER: {
        cssLineCodes.push(`align-items: center;`);
        break;
      }
    }
    switch (node.primaryAxisAlignItems) {
      default: {
        break;
      }
      case Figma.PrimaryAxisAlignItems.CENTER: {
        cssLineCodes.push(`justify-content: center;`);
        break;
      }
      case Figma.PrimaryAxisAlignItems.SPACE_BETWEEN: {
        cssLineCodes.push(`justify-content: space-between;`);
        break;
      }
    }
  }

  if (node.backgroundColor) {
    cssLineCodes.push(`background-color: ${node.backgroundColor};`);
  }
  if (node.paddingLeft) {
    cssLineCodes.push(`padding-left: ${node.paddingLeft};`);
  }
  if (node.paddingRight) {
    cssLineCodes.push(`padding-right: ${node.paddingRight};`);
  }
  if (node.rectangleCornerRadii) {
    const ra = node.rectangleCornerRadii;
    cssLineCodes.push(
      `border-radius: ${ra[0]}px ${ra[1]}px ${ra[2]}px ${ra[3]}px;`
    );
  }

  cssCode += `.${cssClassName}\n{${cssLineCodes
    .map((code) => `\t${code}`)
    .join("\n")}\n}\n`;

  return {
    cssClassName,
    cssCode,
  };
}

function FrameHtmlProvider(
  node: Figma.Frame,
  parent: Figma.NodeBase | undefined,
  cssClassName: string,
  depth: number,
  eventHandlerNameMap: Map<string, string>
) {
  let htmlCodePrev: string = "";
  let htmlCodeBack: string = "";
  let tag = "div";
  let classNameCode = "";
  let styleCode = "";
  if (cssClassName) {
    classNameCode += `className={styles.${cssClassName}}`;
  }

  // infter
  if (node.inferedData?.isInputCombine) {
    let iconCode = "";
    if (node.inferedData?.isInputCombineHasIconChild) {
      iconCode = 'prefix={<Icon type="icon" />';
    }
    htmlCodePrev += `${getTab(
      depth
    )}<Input className={styles.${cssClassName}} ${iconCode} />\n`;
  }

  const eventCode = FigmaReactCoder.getElementEventCode(
    node,
    eventHandlerNameMap
  );

  htmlCodePrev += FigmaReactCoder.getReactHtmlPrevCode({
    depth,
    tag,
    useTab: true,
    classNameCode,
    styleCode,
    selfCloseTag: false,
    contentCode: "",
    needBreakLine: true,
    eventCode,
  });

  htmlCodeBack += FigmaReactCoder.getReactHtmlBackCode({
    depth,
    tag,
    useTab: true,
    needBreakLine: true,
  });

  return {
    htmlCodePrev,
    htmlCodeBack,
  };
}

function getTextColorStr(node: Figma.TEXT) {
  let nodeColor = "";
  if (node.fills.length === 1) {
    const nfill = node.fills[0];
    const toNum = (num: number) => Math.round(num * 255);
    nodeColor = `rgba(${toNum(nfill.color.r)}, ${toNum(nfill.color.g)}, ${toNum(
      nfill.color.b
    )}, ${nfill.opacity})`;
  }
  return nodeColor;
}

function getTextClassName(node: Figma.TEXT) {
  if (node.fontWeight !== 400 && node.fontWeight !== "normal") {
    return "Title";
  }
  // TODO: 更详细的逻辑是
  // 在flex容器左边的可以叫 Label
  // 存在子树的叶节点叫 Content
  return "Text";
}

function TextCSSProvider(
  node: Figma.TEXT,
  textStyleCodeMap: Map<string, { className: string; codes: string[] }>
) {
  let cssLineCodes: string[] = [];
  let cssClassName: string = "";
  let cssCode: string = "";
  let textStyleKey = "";

  const nodeColor = getTextColorStr(node);

  textStyleKey += `${node.fontSize}${node.fontWeight}${nodeColor}`;
  if (textStyleCodeMap.has(textStyleKey)) {
    const data = textStyleCodeMap.get(textStyleKey)!;
    cssClassName = data.className;
    cssLineCodes = data.codes;
  } else {
    if (node.fontWeight) {
      cssLineCodes.push(`font-weight: ${node.fontWeight};`);
    }
    if (node.fontSize) {
      cssLineCodes.push(`font-size: ${node.fontSize}px;`);
    }
    if (nodeColor) {
      cssLineCodes.push(`color: ${nodeColor};`);
    }
    cssClassName = "Text" + getTextClassName(node);
    textStyleCodeMap.set(textStyleKey, {
      className: cssClassName,
      codes: cssLineCodes,
    });
  }

  cssCode += `.${cssClassName}{\n${cssLineCodes
    .map((code) => `\t${code}`)
    .join("\n")}\n}\n`;

  return {
    cssClassName,
    cssCode,
  };
}

function TextHtmlProvider(
  node: Figma.TEXT,
  depth: number,
  cssClassName: string,
  eventHandlerNameMap: Map<string, string>,
  parent: Figma.NodeBase | undefined
) {
  let htmlCodePrev = "";
  let htmlCodeBack = "";

  let tag = "span";

  // 计算tag
  if (parent?.children?.length) {
    if (parent?.children?.length === 2) {
      tag = "label";
    } else {
      tag = "span";
    }
  } else if (node.fontSize) {
    const fontSize = node.fontSize;
    if (fontSize >= 40) {
      tag = "h0";
    } else if (fontSize < 40 && fontSize >= 32) {
      tag = "h1";
    } else if (fontSize < 32 && fontSize >= 26) {
      tag = "h2";
    } else if (fontSize < 26 && fontSize >= 22) {
      tag = "h3";
    } else if (fontSize < 22 && fontSize >= 20) {
      tag = "h4";
    } else {
      tag = "p";
    }
  }
  let classNameCode = "";
  if (cssClassName) {
    classNameCode = `className={styles.${cssClassName}}`;
  }
  const eventCode = FigmaReactCoder.getElementEventCode(
    node,
    eventHandlerNameMap
  );
  htmlCodePrev += `${getTab(depth)}<${tag}`;
  if (classNameCode) {
    htmlCodePrev += ` ${classNameCode}`;
  }
  if (eventCode) {
    htmlCodePrev += ` ${eventCode}`;
  }

  htmlCodePrev += `>${getContentCode(node, node.characters)}</${tag}>\n`;
  return {
    htmlCodePrev,
    htmlCodeBack,
  };
}

// 特征分析
// 左侧面板选择当前激活的文件
// 306:3404
export class FigmaProjectCodeProvider {
  traverseSelectionNodeByDFS(
    callback: (
      node: Figma.NodeSelectionBase,
      parent?: Figma.NodeSelectionBase
    ) => boolean,
    node: Figma.NodeSelectionBase,
    parent?: Figma.NodeSelectionBase
  ) {
    if (callback(node, parent)) {
      return true;
    }
    node.children?.find((child) => {
      return this.traverseSelectionNodeByDFS(callback, child, node);
    });
    return false;
  }

  traverseNodeByDFS(
    callback: (node: Figma.NodeBase, parent?: Figma.NodeBase) => boolean,
    node: Figma.NodeBase,
    parent?: Figma.NodeBase
  ) {
    if (callback(node, parent)) {
      return true;
    }
    node.children?.find((child) => {
      return this.traverseNodeByDFS(callback, child, node);
    });
    return false;
  }

  traverseByDFSGetCode(
    node: Figma.NodeBaseLevel1,
    parent: Figma.NodeBaseLevel1 | undefined,
    args: {
      depth: number;
      eventHandlerNameMap: Map<string, string>;
      textStyleCodeMap: Map<string, { className: string; codes: string[] }>;
    }
  ): {
    htmlCode: string;
    cssCode: string;
    extraCode: string;
  } {
    // 跳过的情况(忽略无效空节点)
    if (node.children && node.children.length === 1) {
      return this.traverseByDFSGetCode(node.children[0], parent, args);
    }

    let htmlCode: string = "";
    let cssCode: string = "";
    let extraCode: string = "";

    // 先处理子节点
    if (node.children) {
      // 先处理相似子节点
      const similarNodeCodeMap: Map<string, string> = new Map();
      if (node.similarData) {
        node.similarData.similarChildrenFirstIndexGroup.forEach(
          (firstIndex, sindex) => {
            const child = node.children[firstIndex];
            if (child) {
              const ret = this.traverseByDFSGetCode(child, node, {
                ...args,
                depth: args.depth + 1,
              });
              cssCode += ret.cssCode;
              const componentName = FigmaCoderUtil.getNodeComponentName(child);
              extraCode += `const ${componentName} = () => {
              return (${ret.htmlCode})
            }\n`;
              const componentHtmlCode = `${getTab(
                args.depth
              )}<${componentName} />\n`;
              node.similarData.similarChildrenGroup[
                sindex
              ]!.similarChildrenIndexes.forEach((childIndex) => {
                const child = node.children[childIndex];
                similarNodeCodeMap.set(child.id, componentHtmlCode);
              });
            }
          }
        );
      }

      const sortedByPositionChild = node.children.sort((a, b) => {
        if (a.absoluteBoundingBox.y !== b.absoluteBoundingBox.y) {
          return a.absoluteBoundingBox.y - b.absoluteBoundingBox.y;
        }
        return a.absoluteBoundingBox.x - b.absoluteBoundingBox.x;
      });

      sortedByPositionChild.forEach((child) => {
        if (similarNodeCodeMap.has(child.id)) {
          const htmlCallCode = similarNodeCodeMap.get(child.id);
          htmlCode += htmlCallCode;
          return;
        }
        const ret = this.traverseByDFSGetCode(child, node, {
          ...args,
          depth: args.depth + 1,
        });
        cssCode += ret.cssCode;
        htmlCode += ret.htmlCode;
        extraCode += ret.extraCode;
      });
    }

    // 当前节点的
    let htmlCodePrevNode: string = "";
    let htmlCodeBackNode: string = "";
    switch (node.type) {
      default: {
        const cssData = CommonCSSProvider(node, parent, {
          depth: args.depth,
          isAbsolteLayout: false,
        });
        const htmlData = CommonNodeHtmlProvider(
          node,
          parent,
          args.depth,
          cssData.cssClassName,
          args.eventHandlerNameMap
        );
        htmlCodePrevNode += htmlData.htmlCodePrev;
        htmlCodeBackNode += htmlData.htmlCodeBack;
        cssCode += cssData.cssCode;
        break;
      }
      case Figma.NodeTypes.FRAME: {
        const cssData = FrameCSSProvider(node as Figma.Frame, parent, {
          depth: args.depth,
          isAbsolteLayout: false,
        });
        const htmlData = FrameHtmlProvider(
          node as Figma.Frame,
          parent,
          cssData.cssClassName,
          args.depth,
          args.eventHandlerNameMap
        );
        htmlCodePrevNode += htmlData.htmlCodePrev;
        htmlCodeBackNode += htmlData.htmlCodeBack;
        cssCode += cssData.cssCode;
        break;
      }
      case Figma.NodeTypes.TEXT: {
        const cssData = TextCSSProvider(
          node as Figma.TEXT,
          args.textStyleCodeMap
        );
        const htmlData = TextHtmlProvider(
          node as Figma.TEXT,
          args.depth,
          cssData.cssClassName,
          args.eventHandlerNameMap,
          parent
        );
        htmlCodePrevNode += htmlData.htmlCodePrev;
        htmlCodeBackNode += htmlData.htmlCodeBack;
        cssCode += cssData.cssCode;
        break;
      }
    }

    return {
      extraCode,
      htmlCode: `${htmlCodePrevNode}${htmlCode}${htmlCodeBackNode}`,
      cssCode,
    };
  }

  traverseCopySimilarSubTree(
    firstChild: Figma.NodeBase,
    otherSimilarChilds: Figma.NodeBase[]
  ) {
    const findOtherReactData = otherSimilarChilds.find(
      (child) => child.reactData
    );
    const findOtherInferData = otherSimilarChilds.find(
      (child) => child.inferedData
    );
    if (findOtherReactData) {
      firstChild.reactData = findOtherReactData.reactData;
      findOtherReactData.reactData = undefined;
    }
    if (findOtherInferData) {
      firstChild.inferedData = findOtherReactData.inferedData;
      findOtherInferData.inferedData = undefined;
    }
    firstChild.children.forEach((childChild, childChildIndex) => {
      let otherChilds: Figma.NodeBase[] = [];
      otherSimilarChilds.forEach((sChild) => {
        otherChilds.push(sChild.children[childChildIndex]!);
      });
      this.traverseCopySimilarSubTree(childChild, otherChilds);
    });
  }

  traverseSimilarSubTree(node: Figma.NodeBase): string {
    let allChildTreeId: string = "";

    if (node.children.length) {
      let childTreeIdMap: Map<string, number[]> = new Map();
      node.children.forEach((child, childIndex) => {
        const childTreeId = this.traverseSimilarSubTree(child);
        const prev = childTreeIdMap.get(childTreeId) || [];
        // 叶节点相似不计入相似
        if (child.children?.length) {
          childTreeIdMap.set(childTreeId, [...prev, childIndex]);
        }
        allChildTreeId += childTreeId;
      });

      // const findHave = Array.from(childTreeIdMap.values()).find(
      //   (data) => data.length > 1
      // );
      // if (findHave) {
      //   console.log(node.name, "traverseSimilarSubTree node name");
      // }
      childTreeIdMap.forEach((childIndexes) => {
        if (childIndexes.length > 1) {
          if (!node.similarData) {
            // 找其他有数据的，复制
            const allChild = childIndexes.map((ci) => node.children[ci]);
            this.traverseCopySimilarSubTree(allChild[0], allChild.slice(1));
            node.similarData = {
              similarChildrenFirstIndexGroup: [],
              similarChildrenGroup: [],
            };
          }
          node.similarData.similarChildrenFirstIndexGroup.push(childIndexes[0]);
          node.similarData.similarChildrenGroup.push({
            similarChildrenIndexes: childIndexes,
          });
        }
      });
    }
    const currentNodeTreeId = `${node.type}-${
      node.children?.length || 0
    }-${allChildTreeId}`;
    return currentNodeTreeId;
  }

  traverseInferNodeComponent(node: Figma.NodeBase) {
    inferNodeComponent(node);
    if (node.children.length) {
      node.children.forEach((child) => {
        this.traverseInferNodeComponent(child);
      });
    }
  }

  getHandleEventsCode(
    events: { name: string; id: string }[],
    eventHandlerNameMap: Map<string, string>
  ) {
    let code = "";
    if (events.length) {
      events.forEach((eventData) => {
        const handlerName = eventHandlerNameMap.get(eventData.id) || "";
        code += `const ${handlerName} = useCallBack(() => {}, []);\n`;
      });
    }
    return code;
  }

  getStatesCode(states: { name: string }[]) {
    let code = "";
    if (states.length) {
      states.forEach((state) => {
        code += `const [${state.name}, set${FigmaCoderUtil.upperFirst(
          state.name
        )}] = useState<any>();\n`;
      });
    }
    return code;
  }

  getPropsCode(props: { name: string }[]) {
    let code = "";
    if (props.length) {
      code += "props: {";
      props.forEach((prop) => {
        code += `${prop.name}: any;`;
      });
      code += "}";
    }
    return code;
  }

  getCode(selectedTopNode: Figma.NodeBaseLevel1) {
    const textStyleCodeMap: Map<
      string,
      { className: string; codes: string[] }
    > = new Map();
    if (
      selectedTopNode.type === Figma.NodeTypes.CANVAS ||
      selectedTopNode.type === Figma.NodeTypes.DOCUMENT
    ) {
      return undefined;
    }

    // 树相似分析（用于抽离组件）
    this.traverseSimilarSubTree(selectedTopNode);
    // 组件推断分析
    this.traverseInferNodeComponent(selectedTopNode);

    const allChildProps: { name: string }[] = [];
    const allChildStates: { name: string }[] = [];
    const allChildEvents: { name: string; id: string }[] = [];
    const eventHandlerNameMap: Map<string, string> = new Map();
    this.traverseNodeByDFS((cnode) => {
      if (cnode.reactData?.props) {
        allChildProps.push(...cnode.reactData.props);
      }
      if (cnode.reactData?.states) {
        allChildStates.push(...cnode.reactData.states);
      }
      if (cnode.reactData?.events) {
        cnode.reactData?.events.forEach((eventData) => {
          eventHandlerNameMap.set(
            eventData.id,
            `handle${eventData.name.replace("on", "")}${allChildEvents.length}`
          );
        });
        allChildEvents.push(...cnode.reactData.events);
      }
      return false;
    }, selectedTopNode);

    const data = this.traverseByDFSGetCode(selectedTopNode, undefined, {
      textStyleCodeMap,
      eventHandlerNameMap,
      depth: 0,
    });

    let reactCode = "";

    const isComponentNode =
      allChildProps.length > 0 ||
      allChildStates.length > 0 ||
      allChildEvents.length > 0;

    if (data.extraCode || isComponentNode) {
      reactCode += data.extraCode;
      reactCode += `\n`;
      reactCode += `const ${FigmaCoderUtil.getNodeComponentName(
        selectedTopNode
      )} = (${this.getPropsCode(allChildProps)}) => {
        ${this.getStatesCode(allChildStates)}
        ${this.getHandleEventsCode(allChildEvents, eventHandlerNameMap)}
        return (
          ${data.htmlCode}
        )
      }`;
    } else {
      reactCode = data.htmlCode;
    }

    return { cssCode: data.cssCode, reactCode };
  }
}
