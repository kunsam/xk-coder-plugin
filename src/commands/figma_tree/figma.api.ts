import axios from "axios";
import fetch from "node-fetch";
import { Figma } from "./figma.typing";

function getFile(file: any, token: string) {
  return new Promise<Figma.File | undefined>((resovlve) => {
    axios
      .get(`https://api.figma.com/v1/files/${file.key}?depth=1`, {
        headers: {
          "X-FIGMA-TOKEN": token,
        },
      })
      .then((response) => {
        console.log(file.key, response.data.document, "response");
        resovlve({
          fileKey: file.key,
          fileName: file.name,
          document: response.data.document,
        } as Figma.File);
      })
      .catch(() => {
        resovlve(undefined);
      });
  });
}
export class FigmaApi {
  public static async getProjectFileAllInfo(
    fileKey: string,
    fileName: string,
    token: string
  ): Promise<Figma.File> {
    const response = await axios.get(
      `https://api.figma.com/v1/files/${fileKey}`,
      {
        headers: {
          "X-FIGMA-TOKEN": token,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    return {
      fileKey: fileKey,
      fileName: fileName,
      document: response.data.document,
    } as Figma.File;
  }

  public static async getProjectFiles(
    projectId: string,
    token: string
  ): Promise<Figma.File[]> {
    return new Promise((resolve) => {
      axios
        .get(`https://api.figma.com/v1/projects/${projectId}/files`, {
          headers: {
            "X-FIGMA-TOKEN": token,
          },
        })
        .then(async (res) => {
          const rfiles = [...res.data.files];
          const files: Figma.File[] = [];
          for await (const file of rfiles) {
            const fileResult = await getFile(file, token);
            if (fileResult) {
              files.push(fileResult);
            }
          }
          resolve(files);
        });
    });
  }

  public static async getUserProjects(
    teamId: string,
    token: string
  ): Promise<Figma.Project[]> {
    const projectRes = await axios.get(
      `https://api.figma.com/v1/teams/${teamId}/projects`,
      {
        method: "GET",
        headers: {
          "X-FIGMA-TOKEN": token,
        },
      }
    );
    return projectRes.data.projects.map((project: any) => ({
      id: project.id,
      name: project.name,
    }));
  }

  public static async getUserProjectData(
    teamId: string,
    token: string
  ): Promise<Figma.ProjectData[]> {
    const projects = await FigmaApi.getUserProjects(teamId, token);
    const projectDatas = await Promise.all<Figma.ProjectData>(
      projects.map((project) => {
        return new Promise((resolve) => {
          FigmaApi.getProjectFiles(project.id, token).then((data) => {
            resolve({
              project,
              files: data,
            } as Figma.ProjectData);
          });
        });
      })
    );
    return projectDatas;
  }
}
