import { Figma } from "./figma.typing";

// TODO: 还需要补充
const NodeNameInferMap = {
  isForm: ["form"],
  isInputCombine: ["input"],
  isButton: ["button"],
};

// TODO: 还可以增加，比如isIcon
export interface FigmaNodeInferData {
  // 是否是表单
  isForm?: boolean;
  // 是否是按钮
  isButton?: boolean;
  // 是否是输入框（包含组合）
  isInputCombine?: boolean;
  isInputCombineHasIconChild?: boolean;
}

function traverseNode(
  callback: (node: Figma.NodeBase, parent?: Figma.NodeBase) => boolean,
  node: Figma.NodeBase,
  parent?: Figma.NodeBase
) {
  if (callback(node, parent)) {
    return true;
  }
  node.children?.find((child) => {
    return traverseNode(callback, child, node);
  });
  return false;
}

function hasIconChild(node: Figma.NodeBase, maxDepth?: number) {
  let hasIcon = false;
  let currentDepth = 0;
  traverseNode((cn) => {
    if (maxDepth !== undefined) {
      if (currentDepth > maxDepth) {
        return true;
      }
    }
    if (cn.type === Figma.NodeTypes.VECTOR) {
      hasIcon = true;
      return true;
    }
    currentDepth++;
    return false;
  }, node);
  return hasIcon;
}

/**
 * 组件类型推断器
 */
export function inferNodeComponent(node: Figma.NodeBase) {
  if (node.type !== Figma.NodeTypes.INSTANCE) return;

  let isInferSuccess = false; // 控制互斥
  let isForm = false;
  let isInputCombine = false;
  let isInputCombineHasIconChild = false;

  if (!node.inferedData) {
    node.inferedData = {};
  }

  if (NodeNameInferMap.isForm.find((key) => node.name.includes(key))) {
    isForm = true;
    isInferSuccess = true;
  }

  if (
    !isInferSuccess &&
    NodeNameInferMap.isInputCombine.find((key) => node.name.includes(key))
  ) {
    isInputCombine = true;
  }

  if (!isInferSuccess && !isInputCombine && node.children.length === 2) {
    if (node.children[1].type === Figma.NodeTypes.TEXT) {
      if (hasIconChild(node.children[0], 2)) {
        isInputCombine = true;
        isInputCombineHasIconChild = true;
      }
    }
  }

  let isButton = false;
  if (
    !isInferSuccess &&
    NodeNameInferMap.isButton.find((key) => node.name.includes(key))
  ) {
    isButton = true;
  }

  node.inferedData = {
    ...node.inferedData,
    isForm,
    isInputCombine,
    isButton,
    isInputCombineHasIconChild,
  };
  // return {}
}
