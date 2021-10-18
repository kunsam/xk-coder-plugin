export namespace SharedCode {
  // name: '全局主题1',
  // tags: ['theme'], // search
  // category: 'theme-x-x-x',
  // desc: '使用全局的主题上下文',
  // code: `const { currentTheme } = useTheme()`,

  export interface IData {
    name: string;
    code: string;

    desc?: string;
    tags?: string[];
    fastModeKey?: string;
    // category: string;
  }

  export interface ITreeItem {
    name?: string;
    data?: IData;
    requirePath?: string;
    children?: ITreeItem[];
  }
}
