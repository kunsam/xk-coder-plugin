import { Graph } from "graphlib";
import { ROOT_PATH } from "../config";
import { CoderNamespace } from "./typing";
import { join, relative } from "path";

type RouteNodeData = CoderNamespace.RouteNode & {
  //   fromIds: string[];
  toIds: string[];
  isRoute?: boolean;
  fromActionFileIds: string[]; // 从文件来的
};

const ROUTES_MAP: RouteNodeData[] = [
  {
    path: "/",
    fileRelativePath: "src/pages/index.tsx",
    label: "根路由容器",
    params: [],
    query: [],
    toIds: [
      "/u",
      "/u/login",
      "/u/register",
      "/u/reset",
      "/u/bind",
      "/u/helpcenter",
    ],
    fromActionFileIds: [],
  },
  {
    path: "/u",
    fileRelativePath: "src/pages/Dashboard/DashboardRoute.tsx",
    label: "Dashboard路由容器",
    params: [],
    query: [],
    toIds: ["/u/dashboard/:menuType/:fileType?/:folderId?"],
    fromActionFileIds: [],
  },
  {
    path: "/u/dashboard",
    fileRelativePath: "src/pages/Dashboard/DashboardRoute.tsx",
    label: "Dashboard路由容器",
    params: [],
    query: [],
    toIds: ["/u/dashboard/:menuType/:fileType?/:folderId?"],
    fromActionFileIds: [],
  },

  {
    path: "/u/login",
    fileRelativePath: "src/pages/User/Login/index.tsx",
    label: "登陆页",
    params: [],
    query: [],
    toIds: ["/u/dashboard", "/u/bind"],
    fromActionFileIds: ["src/frontend_utils/axios/interceptors.ts"],
  },

  {
    path: "/u/register",
    fileRelativePath: "src/pages/User/Register/index.tsx",
    label: "注册页",
    params: [],
    query: [],

    toIds: ["/u/dashboard", "/u/login"],
    fromActionFileIds: [],
  },

  {
    path: "/u/reset",
    fileRelativePath: "src/pages/User/ResetPassword/index.tsx",
    label: "重置密码页",
    params: [],
    query: [],
    toIds: ["/u/login"],
    fromActionFileIds: [],
  },
  {
    path: "/u/bind",
    fileRelativePath: "src/pages/User/WeixinBind/index.tsx",
    label: "微信绑定页",
    params: [],
    query: [],
    toIds: ["/u/login", "/u/dashboard", "/u/register"],
    fromActionFileIds: [],
  },
  {
    path: "/u/helpcenter",
    fileRelativePath: "src/pages/HelpCenter/index.tsx",
    label: "帮助中心页",
    params: [],
    query: [],
    toIds: ["/u/helpcenter/manual", "/u/helpcenter/videohelp"],
    fromActionFileIds: [],
  },
  {
    path: "/u/helpcenter/manual",
    fileRelativePath: "src/pages/HelpCenter/Manual/index.tsx",
    label: "帮助手册页",
    params: [],
    query: [],
    toIds: [],
    fromActionFileIds: [],
  },
  {
    path: "/u/helpcenter/videohelp",
    fileRelativePath: "src/pages/HelpCenter/VideoHelp/index.tsx",
    label: "帮助视频页",
    params: [],
    query: [],
    toIds: [],
    fromActionFileIds: [],
  },
  {
    path: "/u/p/:projectId/create",
    fileRelativePath: "src/pages/Create/index.tsx",
    label: "创建项目页",
    params: [],
    query: [],
    toIds: ["/u/dashboard/:menuType/:fileType?/:folderId?"],
    fromActionFileIds: [],
  },

  {
    path: "/u/dashboard/:menuType/:fileType?/:folderId?",
    fileRelativePath: "src/pages/Dashboard/index.tsx",
    label: "项目",
    params: [],
    query: [],
    toIds: ["/u/p/:projectId/create", "/u/login"],
    fromActionFileIds: [],
  },
];

export class RouterManager {
  private _graph: Graph;
  private _filePathRoutePathMap: Map<string, string> = new Map();
  constructor() {
    this._graph = new Graph();
    this._init();
  }
  private _init() {
    ROUTES_MAP.forEach((route) => {
      this._filePathRoutePathMap.set(
        join(ROOT_PATH, route.fileRelativePath),
        route.path
      );
      this._graph.setNode(route.path, route);
    });
    ROUTES_MAP.forEach((route) => {
      route.toIds.forEach((routeTo) => {
        this._graph.setEdge(route.path, routeTo, { isRoute: true });
      });
      route.fromActionFileIds.forEach((fromFile) => {
        this._graph.setNode(fromFile, {
          path: fromFile,
          fileRelativePath: fromFile,
          label: "",
          params: [],
          query: [],
          toIds: [],
          fromActionFileIds: [],
          isRoute: false,
        });
        this._graph.setEdge(fromFile, route.path, {
          isRoute: false,
        });
      });
    });
  }
  public queryFileRoutePaths(
    file_abs_path: string,
    imported_file_abs_paths: string[][]
  ): RouteNodeData[][] {
    let ret = [];
    imported_file_abs_paths.forEach((impaths: string[]) => {
      const all_file_paths = [file_abs_path, ...impaths];
      const all_route_paths = all_file_paths
        .map((file_path) => this._filePathRoutePathMap.get(file_path))
        .filter((a) => !!a);
      const findedRoutePath: string = all_route_paths.find(
        (ap) => !!this._graph.node(ap)
      );

      if (findedRoutePath) {
        const prevRouteList = this.calPrevRouteList(findedRoutePath);
        console.log("findedRoutePath", findedRoutePath, prevRouteList);
        ret = [...ret, ...prevRouteList];
      }
    });

    return ret;
  }

  public calPrevRouteList(route_path: string): RouteNodeData[][] {
    let currentNode: RouteNodeData = this._graph.node(route_path);
    if (!currentNode) {
      return [];
    }
    const ret: RouteNodeData[][] = [];
    const node_queue: string[] = [];
    const path_queue: RouteNodeData[][] = [];
    node_queue.push(route_path);
    path_queue.push([]);
    while (node_queue.length) {
      const node: string = node_queue.shift();
      const current_paths = path_queue.shift();
      const froms = this._graph.predecessors(node);
      if (froms && froms.length) {
        const pathSet = new Set(current_paths);
        froms.forEach((from) => {
          if (from === route_path) {
            return;
          }
          const fromNode: RouteNodeData = this._graph.node(from);
          if (fromNode === undefined) {
            return;
          }
          if (pathSet.has(fromNode)) {
            if (current_paths.length) {
              ret.push(current_paths);
            }
            return;
          }
          node_queue.push(from);
          path_queue.push([...current_paths, fromNode]);
        });
      } else {
        ret.push(current_paths);
      }
    }
    return ret;
  }
}

export const AppRouterManager = new RouterManager();
