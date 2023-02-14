import { FigmaProjectCodeProvider } from "./figma.coder";
import { Figma, ReactData, ReactEvents } from "./figma.typing";

const NODE_keys = [
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
  "fills",
];

const figma = (window as any).figma;

const pressedSet = new Set();

let popupDiv: HTMLDivElement | undefined;
let lastMouseDownPointer: { x: number; y: number } | undefined;
const nodeReactDataMap: Map<string, ReactData> = new Map();

window.addEventListener("keydown", (e) => {
  pressedSet.add(e.key);
});

window.addEventListener("keyup", (e) => {
  pressedSet.delete(e.key);
});

window.addEventListener("mousedown", (e) => {
  lastMouseDownPointer = {
    x: e.pageX,
    y: e.pageY,
  };
});
window.addEventListener("mouseup", (e) => {
  lastMouseDownPointer = undefined;
});

// let nodeData: any;
// async function getFileNodeData() {
//   console.time("getFileNodeData");
//   const TOKEN = "figd_rcNHrbnI19chi6oSrWhYxBrRjw7XcQE7HIyqDci4";
//   const response = await fetch(
//     `https://api.figma.com/v1/files/${figma.fileKey}`,
//     {
//       method: "GET",
//       headers: {
//         "X-FIGMA-TOKEN": TOKEN,
//       },
//     }
//   );
//   const data = await response.json();
//   console.log(data, "datadata");
//   nodeData = data;
//   figma.notify("figma数据已返回");
//   console.timeEnd("getFileNodeData");
// }

function openInput({
  placeholder,
  onPressEnter,
  parentDiv,
}: {
  placeholder: string;
  onPressEnter: (v: string) => void;
  parentDiv: HTMLDivElement;
}) {
  const input = document.createElement("input") as HTMLInputElement;
  input.placeholder = placeholder;
  input.style.position = "absolute";
  input.style.left = `0px`;
  input.style.top = `-40px`;
  input.style.width = "150px";
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      onPressEnter(input.value);
      parentDiv.removeChild(input);
    }
  };
  parentDiv.appendChild(input);
  input.focus();
}

function openSelect({
  onSelect,
  parentDiv,
}: {
  onSelect: (v: string) => void;
  parentDiv: HTMLDivElement;
}) {
  const select = document.createElement("select") as HTMLSelectElement;

  let innerHtml = "";
  Object.values(ReactEvents).forEach((eventName) => {
    innerHtml += `<option value="${eventName}">${eventName}</option>`;
  });
  select.innerHTML = innerHtml;

  select.style.position = "absolute";
  select.style.left = `0px`;
  select.style.top = `-40px`;
  select.style.width = "150px";
  select.onchange = () => {
    onSelect(select.value);
    parentDiv.removeChild(select);
  };
  parentDiv.appendChild(select);
}

function openChooseMenu({
  left,
  top,
  nodeId,
}: {
  left: number;
  top: number;
  nodeId: string;
}) {
  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.left = `${left}px`;
  div.style.top = `${top}px`;
  div.style.width = `150px`;
  div.style.background = "#ffffff";

  const containerDiv = document.createElement("div");
  containerDiv.style.position = "relative";

  div.appendChild(containerDiv);

  const p1 = document.createElement("p");
  p1.innerText = "1.绑定为props字段";
  p1.onclick = () => {
    openInput({
      parentDiv: containerDiv,
      placeholder: "请输入props名称",
      onPressEnter: (value) => {
        if (value) {
          const prev = nodeReactDataMap.get(nodeId) || {
            events: [],
            props: [],
            states: [],
          };
          prev.props = [{ name: value }];
          nodeReactDataMap.set(nodeId, prev);
        }
      },
    });
  };
  containerDiv.appendChild(p1);

  const p2 = document.createElement("p");
  p2.innerText = "2.绑定state字段";
  p2.onclick = () => {
    openInput({
      parentDiv: containerDiv,
      placeholder: "请输入state名称",
      onPressEnter: (value) => {
        if (value) {
          const prev = nodeReactDataMap.get(nodeId) || {
            events: [],
            props: [],
            states: [],
          };
          prev.states = [{ name: value }];
          nodeReactDataMap.set(nodeId, prev);
        }
      },
    });
  };
  containerDiv.appendChild(p2);

  const p3 = document.createElement("p");
  p3.innerText = "3.绑定一个事件";
  p3.onclick = () => {
    openSelect({
      parentDiv: containerDiv,
      onSelect: (value) => {
        if (value) {
          const prev = nodeReactDataMap.get(nodeId) || {
            events: [],
            props: [],
            states: [],
          };
          prev.events = [{ name: value, id: `${nodeId}${value}` }];
          nodeReactDataMap.set(nodeId, prev);
        }
      },
    });
  };
  containerDiv.appendChild(p3);

  popupDiv = div;
  div.onclick = (e) => {
    e.stopPropagation();
  };

  document.body.appendChild(div);
}

figma.on("selectionchange", async () => {
  // if (!nodeData) {
  //   figma.notify("figma数据未返回，请稍后重试");
  //   return;
  // }

  if (popupDiv) {
    document.body.removeChild(popupDiv);
    popupDiv = undefined;
  }

  const needDeal =
    pressedSet.has("x") ||
    pressedSet.has("X") ||
    pressedSet.has("s") ||
    pressedSet.has("S") ||
    pressedSet.has("e") ||
    pressedSet.has("E");
  if (!needDeal) {
    return;
  }

  const first = figma.currentPage.selection[0];

  const isEditMode = pressedSet.has("E") || pressedSet.has("e");

  if (isEditMode && first && lastMouseDownPointer) {
    openChooseMenu({
      left: lastMouseDownPointer.x + 10,
      top: lastMouseDownPointer.y + 10,
      nodeId: first.id as string,
    });
    return;
  }

  function travese(figmaNode: any) {
    const children = figmaNode.children || [];
    const data = {
      ...figmaNode,
      children: children.map((child) => travese(child)),
    };
    NODE_keys.forEach((key) => {
      if (figmaNode[key] !== undefined) {
        data[key] = figmaNode[key];
      }
    });
    const reactData = nodeReactDataMap.get(data.id);
    if (reactData) {
      data.reactData = reactData;
    }
    return data;
  }
  if (first) {
    const node = travese(first) as Figma.NodeBaseLevel1;
    console.log(first, "origin selection");
    console.log(node, "node");

    const provider = new FigmaProjectCodeProvider();
    const code = provider.getCode(node);

    if (pressedSet.has("X") || pressedSet.has("x")) {
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
figma.notify("已加载 Xkool Figma");
