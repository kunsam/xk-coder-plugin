import * as fs from "fs";
import * as path from "path";
import lineReader from "line-reader";

export interface FileNode {
  fspath: string;
  dirName: string;
  relativePath: string;
  filename: string; // include suffix
}

export namespace XkTsCode {
  export interface FileImportResultWithClass {
    file: FileNode;
    style: FileNode[];
    picture: FileNode[];
    node_modules: FileNode[];
    parentList: FileNode[]; // 需要Map化
    othes: FileNode[]; // 平铺式的
    // other: { file: FileNode; child: FileImportResultWithClass }[];
  }
}

export type ImportData = {
  names: string[];
  path: string;
};
export class FileImportUtil {
  public static getFileNode(
    filePath: string,
    projectRootPath: string
  ): FileNode {
    return {
      fspath: filePath,
      dirName: path.dirname(filePath),
      filename: path.basename(filePath),
      relativePath: path.relative(projectRootPath, filePath),
    };
  }

  public static getFileAbsolutePath(
    filePath: string,
    projectRootPath: string,
    isRelativeProject?: boolean
  ): string | undefined {
    // 没带后缀
    let fsPath = isRelativeProject
      ? path.resolve(path.join(projectRootPath, filePath))
      : filePath;
    fsPath = fsPath.replace(/\'|\"/g, "");
    let trueFsPath = undefined;
    if (fs.existsSync(fsPath)) {
      if (fs.statSync(fsPath).isDirectory()) {
        let NoneJSIndexes = [];
        fs.readdirSync(fsPath).forEach((f) => {
          if (f.includes("index")) {
            if (/\.(jsx?|tsx?)$/g.test(f)) {
              trueFsPath = path.join(fsPath, f);
            } else {
              NoneJSIndexes.push(path.join(fsPath, f));
            }
          }
        });
        if (!trueFsPath && NoneJSIndexes.length) {
          NoneJSIndexes.forEach((indexPath) => {
            if (/\.(s?css|less|sass)$/g.test(indexPath)) {
              trueFsPath = indexPath;
            }
          });
        }
      } else {
        trueFsPath = fsPath;
      }
    } else {
      // 可能是由没带后缀引起的
      const dirName = path.dirname(fsPath);
      if (fs.existsSync(dirName)) {
        fs.readdirSync(dirName).every((f) => {
          // 只判断这两种类型
          if (/\.(jsx?|tsx?)$/g.test(f)) {
            if (f.split(".")[0] === path.basename(fsPath)) {
              if (!fs.statSync(path.join(dirName, f)).isDirectory()) {
                trueFsPath = path.join(dirName, f);
              }
            }
          }
          return !trueFsPath;
        });
      }
    }
    return trueFsPath;
  }

  public static async getFileArrayImports(
    filePaths: string[],
    options: {
      projectRootPath: string;
    }
  ): Promise<Map<string, XkTsCode.FileImportResultWithClass>> {
    const allFilesImortsMap: Map<string, XkTsCode.FileImportResultWithClass> =
      new Map();
    for (const target of filePaths) {
      console.log(target, "target开始计算");
      await this.getFileImports(target, options, allFilesImortsMap);
      console.log(target, "target计算完毕");
    }
    return allFilesImortsMap;
  }

  public static async getFileImports(
    filePath: string,
    options: {
      projectRootPath: string;
    },
    resultMap: Map<string, XkTsCode.FileImportResultWithClass>,
    fileImportsCacheMap: Map<string, ImportData[]> = new Map(),
    importNames: string[] = []
    // parentMap?: Map<string, boolean> // 全部父亲，因为不能引用回父亲
  ): Promise<Map<string, XkTsCode.FileImportResultWithClass>> {
    if (!filePath) return;
    if (!fs.existsSync(filePath)) return;

    let importWithClass: XkTsCode.FileImportResultWithClass = resultMap.get(
      filePath
    ) || {
      style: [],
      othes: [],
      picture: [],
      node_modules: [],
      parentList: [],
      file: FileImportUtil.getFileNode(filePath, options.projectRootPath),
    };

    async function getImportWithClassOnEnd(imports: ImportData[]) {
      const handleFilePath = (from: string, isRelativeProject: boolean) => {
        if (!isRelativeProject) {
          return path.join(path.dirname(filePath), from);
        } else {
          return path.join(options.projectRootPath, `./${from}`);
        }
      };

      if (importNames.length) {
        // 引用名称中存在的
        imports = imports.filter((data) => {
          if (!data.names.length) {
            return true;
          }
          return !!importNames.find((idname) => {
            return !!data.names.find((dname) => dname === idname);
          });
        });
      }

      for (const target of imports) {
        const isRelativeProject = !/^\.+\//.test(target.path);
        if (isRelativeProject) {
          const absPath = path.join(
            options.projectRootPath,
            "./node_modules",
            target.path
          );
          if (fs.existsSync(absPath)) {
            if (absPath) {
              if (
                !importWithClass.node_modules.find((n) => n.fspath === absPath)
              ) {
                importWithClass.node_modules.push(
                  FileImportUtil.getFileNode(absPath, options.projectRootPath)
                );
              }
            }
            continue;
          }
        }
        if (/\.(css|scss|sass|less$)/.test(target.path)) {
          const absPath = handleFilePath(target.path, isRelativeProject);
          if (absPath) {
            if (!importWithClass.style.find((n) => n.fspath === absPath)) {
              importWithClass.style.push(
                FileImportUtil.getFileNode(absPath, options.projectRootPath)
              );
            }
          }
          continue;
        }
        if (/\.(svg|png|gif|jpg|jpeg)/.test(target.path)) {
          const absPath = handleFilePath(target.path, isRelativeProject);
          if (absPath) {
            if (!importWithClass.picture.find((n) => n.fspath === absPath)) {
              importWithClass.picture.push(
                FileImportUtil.getFileNode(absPath, options.projectRootPath)
              );
            }
          }
          continue;
        }
        const fromPath = handleFilePath(target.path, isRelativeProject);
        const importFilePath = FileImportUtil.getFileAbsolutePath(
          fromPath,
          options.projectRootPath
        );
        // redux-persist/lib/storage/session
        if (!importFilePath) {
          // 暂时不处理
          continue;
        }
        if (importFilePath) {
          // 是否儿子中存在自身
          if (importWithClass.othes.find((n) => n.fspath === importFilePath)) {
            continue;
          }
          // 是否父亲中存在自身
          if (
            importWithClass.parentList.find((n) => n.fspath === importFilePath)
          ) {
            continue;
          }

          const childImportWithClass: XkTsCode.FileImportResultWithClass =
            resultMap.get(importFilePath) || {
              style: [],
              othes: [],
              picture: [],
              node_modules: [],
              parentList: [importWithClass.file],
              file: FileImportUtil.getFileNode(
                importFilePath,
                options.projectRootPath
              ),
            };
          resultMap.set(filePath, importWithClass);
          resultMap.set(importFilePath, childImportWithClass);
          importWithClass.othes.push(childImportWithClass.file);
          if (
            !childImportWithClass.parentList.find(
              (n) => n.fspath === importWithClass.file.fspath
            )
          ) {
            childImportWithClass.parentList.push(importWithClass.file);
          }
          await FileImportUtil.getFileImports(
            importFilePath,
            options,
            resultMap,
            fileImportsCacheMap,
            imports.reduce((p, c) => p.concat(c.names), [])
          );
        }
      }
      resultMap.set(filePath, importWithClass);
      return true;
    }

    const caculatingPromise: Promise<
      Map<string, XkTsCode.FileImportResultWithClass>
    > = new Promise((res) => {
      const cacheImports = fileImportsCacheMap.get(filePath);
      if (cacheImports) {
        getImportWithClassOnEnd(cacheImports).then(() => {
          res(resultMap);
        });
        return;
      }
      const imports: ImportData[] = [];
      let hasImportStartWithoutFrom = false;

      let names: string[] = [];
      lineReader.eachLine(filePath, async function (lineText, last) {
        // 仅仅是 import 的情况 e.g. import './index.scss'
        // TODO 并不是所有imports都有效，需要用上层的parentNames过滤
        if (/^import/.test(lineText)) {
          hasImportStartWithoutFrom = true;
        }
        if (
          !names.length &&
          /^import(.+)from/.test(lineText) &&
          lineText.includes("{")
        ) {
          let texts = lineText.match(/^import(.+)from/)[0];
          if (texts) {
            texts = texts.replace(/(\s|\{|\}|import|from)/g, "");
            texts = texts.split(",");
            if (texts.length) {
              texts.forEach((text) => {
                names.push(text);
              });
            }
          }
        }

        if (hasImportStartWithoutFrom && !/\sfrom\s\'/.test(lineText)) {
          let texts = lineText.replace(/\s/g, "");
          if (texts) {
            texts.split(",").forEach((text) => {
              names.push(text);
            });
          }
        }

        if (/^import/.test(lineText)) {
          const texts = lineText.split(" ");
          const hasTarget = texts.reduce(
            (p, c) => p || /\'|\"/g.test(c),
            false
          );
          if (hasTarget && texts[1] && /\'|\"/g.test(texts[1])) {
            const item = texts[1].replace(/\\|\'|\"/g, "");
            item &&
              imports.push({
                names,
                path: item,
              });
            names = [];
            return true;
          }
        }

        if (hasImportStartWithoutFrom && /\sfrom\s\'/.test(lineText)) {
          hasImportStartWithoutFrom = false;
          const texts = lineText.split(" ");
          if (texts[texts.length - 1]) {
            const item = texts[texts.length - 1].replace(/\'|\"/g, "");
            item &&
              imports.push({
                names,
                path: item,
              });
            names = [];
            return true;
          }
        }

        if (/^export/.test(lineText) && /\sfrom\s\'/.test(lineText)) {
          const texts = lineText.split(" ");
          if (texts[texts.length - 1]) {
            const item = texts[texts.length - 1].replace(/\'|\"/g, "");
            item &&
              imports.push({
                names,
                path: item,
              });
            names = [];
            return true;
          }
        }

        if (/import\(\'/.test(lineText)) {
          const texts = lineText.split("'");
          if (texts[1]) {
            const item = texts[1].replace(/\'|\"/g, "");
            item &&
              imports.push({
                names,
                path: item,
              });
            names = [];
            return true;
          }
        }

        if (last) {
          fileImportsCacheMap.set(filePath, imports);
          await getImportWithClassOnEnd(imports);
          res(resultMap);
          return false; // stop reading
        }
      });
    });

    // timeout放在这线程没有退出
    // const timeoutPromise: Promise<
    //   LeTsCode.FileImportResultWithClass
    // > = new Promise(res => {
    //   setTimeout(() => {
    //     // console.log(filePath, "getFileImports 超时");
    //     res(importWithClass);
    //   }, 10000);
    // });
    //  return await Promise.race([caculatingPromise, timeoutPromise]);
    return await caculatingPromise;
  }
}
