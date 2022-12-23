import { FigmaProjectCodeProvider } from "./figma.coder";

const figma = (window as any).figma;

const pressedSet = new Set();

window.addEventListener("keydown", (e) => {
  pressedSet.add(e.key);
});

window.addEventListener("keyup", (e) => {
  pressedSet.delete(e.key);
});

figma.on("selectionchange", () => {
  const needDeal =
    pressedSet.has("Shift") || pressedSet.has("s") || pressedSet.has("S");
  if (!needDeal) {
    return;
  }

  const keys = [
    "absoluteBoundingBox",
    "absoluteRenderBounds",
    "backgrounds",
    "bottomLeftRadius",
    "bottomRightRadius",
    "cornerRadius",
    "counterAxisAlignItems",
    "layoutMode",
    "name",
    "opacity",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "primaryAxisAlignItems",
    "relativeTransform",
    "rotation",
    "topLeftRadius",
    "topRightRadius",
    "x",
    "y",
    "scaleFactor",
    "characters",
    "fontName",
    "fontSize",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "textDecoration",
    "textAlignHorizontal",
    "textAlignVertical",
    "type",
  ];
  const first = figma.currentPage.selection[0];
  function travese(figmaNode) {
    const children = figmaNode.children || [];
    const data = {
      ...figmaNode,
      children: children.map((child) => travese(child)),
    };
    keys.forEach((key) => {
      if (figmaNode[key] !== undefined) {
        data[key] = figmaNode[key];
      }
    });
    return data;
  }
  if (first) {
    const node = travese(first);
    console.log(node, "node");

    const provider = new FigmaProjectCodeProvider();
    const code = provider.getCode(node);

    if (pressedSet.has("Shift")) {
      navigator.clipboard.writeText(`${code.reactCode}`).then(() => {
        figma.notify("已复制ReactCode");
      });
    }
    if (pressedSet.has("S") || pressedSet.has("s")) {
      navigator.clipboard.writeText(`${code.cssCode}`).then(() => {
        figma.notify("已复制CssCode");
      });
    }
  }
});
