import * as vscode from "vscode";

export type KC_RouterInfo = {
  pathname: string;
  query: {
    key?: string;
  };
};

// 先指定 filePattern
// 然后寻找 symbol 查找节点必须存在，不存在未纯文字展示类型
// a.b.c 分步查找 symbol
// 根据 textPattern 过滤 查找结果
// 将结果写入node 子节点中并展开
// 点击子节点跳转到对应文档位置

export enum KC_NODE_ICON_TYPE {
  text = "text",
  node = "node",
  result = "result",
  file = "file",
}

export type XkCoderTreeNode = {
  // 如果全局存在多个symbol最好指定 文件 filePattern
  symbol?: string; // 没有symbol 仅显示文字，点击没用    react项目中可能symbol 会相同
  // 多次出现以第一个为准
  text: string;

  document?: string;
  children?: XkCoderTreeNode[];

  routers?: string[]; // 对应的路由列表
  operationKeys?: string; // 会做一个操作表  在其他地方如谷歌拓展程序里查找对应的操作流，根据操作流执行，定位到具体的UI页面/组件

  // 本来想用 symbol + line 的方式定位调用处的，但是想着line经常会变动，还是不要用这种方式了
  // line?: number // symbol + line 方式定位
  // TODO 到时候增加一个右键菜单，获取相对路径，用于在chrome打断点调试 以查看调用栈

  textPattern?: string; // symbol + textPattern 模式找到调用处的位置，textPattern 可能会存在多个，#指定第几个
  filePattern?: string; // 唯一指定

  // 直接点位
  location?: vscode.Location;
  parent?: XkCoderTreeNode;

  iconType?: KC_NODE_ICON_TYPE;
  requirePath?: string; // 如果存在，这个是相对路径(.xkool_workflows/index.js) 使用 requirePath 加载children
  _id?: string; // 自动化生成后反向查找

  lzwcompress?: string;
};

export type SceneWorkflows = {
  title: string;
  list: XkCoderTreeNode[];
};

// export interface CommonUIViewNode {
//   id: string;
//   text: string;
//   parent?: CommonUIViewNode;
//   _origin: XkCoderTreeNode;
//   children: CommonUIViewNode[];
// }
