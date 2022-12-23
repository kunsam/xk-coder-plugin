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

    let queryString = "";
    if (pressedSet.has("Shift")) {
      queryString += `?reactCode=1`;
    }
    if (pressedSet.has("s") || pressedSet.has("S")) {
      if (!queryString) {
        queryString += `?`;
      }
      queryString += "cssCode=1";
    }

    fetch(`http://127.0.0.1:3779/handle${queryString}`, {
      method: "POST",
      body: JSON.stringify(node),
      headers: { "Content-Type": "application/json" },
    }).then((res) => {
      if (res.status === 200) {
        figma.notify("处理成功");
      } else {
        figma.notify("处理失败");
      }
    });
  }
});
