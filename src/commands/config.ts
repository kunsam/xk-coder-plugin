export interface SearchableCommand {
  id?: string;
  name: string;
  tags: string[];
}

export const SearchableCommands: SearchableCommand[] = [
  {
    id: "XkCoderPlugin.getImportFileList",
    name: "📡  查询当前文件依赖路径",
    tags: [],
  },
  {
    id: "XkCoderPlugin.getRoutePaths",
    name: "🗾 查询当前文件路由路径",
    tags: [],
  },
  {
    id: "XkCoderPlugin.getRoutePaths",
    name: "〰️ 查询数据流路径",
    tags: [],
  },
  {
    id: "XkCoderPlugin.getRoutePaths",
    name: "🪄 查询事件流路径",
    tags: [],
  },
  {
    id: "XkCoderPlugin.getImportGraphDumpJson",
    name: "😄 导出依赖图Json数据",
    tags: [],
  },
];
