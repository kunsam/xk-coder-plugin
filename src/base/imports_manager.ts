import { Graph } from "graphlib";

export class ImportManager<T> {
  // 路由图数据
  // 查询节点

  private _graph: Graph;
  constructor(graph: Graph) {
    this._graph = graph;
  }

  private _calPrevFileListCache: Map<string, T[][]> = new Map();

  public clearCache() {
    this._calPrevFileListCache.clear();
  }

  public calPrevFileList(
    file_abs_path: string,
    useCache: boolean = false
  ): T[][] {
    if (useCache) {
      if (this._calPrevFileListCache.has(file_abs_path)) {
        return this._calPrevFileListCache.get(file_abs_path);
      }
    }
    let currentNode: T = this._graph.node(file_abs_path);
    if (!currentNode) {
      return [];
    }
    const ret: T[][] = [];
    const node_queue: string[] = [];
    const path_queue: T[][] = [];
    node_queue.push(file_abs_path);
    path_queue.push([]);
    const visited_paths = new Set();
    while (node_queue.length) {
      const node: string = node_queue.shift();
      const current_paths = path_queue.shift();
      if (visited_paths.has(current_paths.join())) {
        continue;
      }
      visited_paths.add(current_paths.join());
      const froms = this._graph.successors(node);
      if (froms && froms.length) {
        froms.forEach((from) => {
          node_queue.push(from);
          const fromNode: T = this._graph.node(from);
          path_queue.push([...current_paths, fromNode]);
        });
      } else {
        ret.push(current_paths);
      }
    }
    this._calPrevFileListCache.set(file_abs_path, ret);
    return ret;
  }
}
