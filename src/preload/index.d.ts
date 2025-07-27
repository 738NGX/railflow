import Project from '../../types/project'
import { Station } from '../../types/station'
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getProjects(): Promise<Project[]>
      addProject: (projectName: string) => Promise<Project>
      deleteProject: (projectId: string) => Promise<{ success: boolean }>
      updateProject: (projectId: string, projectData: { name: string }) => Promise<{ success: boolean; project?: Project }>
      getStations: (projectId: string) => Promise<Station[]>
      saveStations: (projectId: string, stations: Station[]) => Promise<{ success: boolean; error?: string }>
    }
  }
}
