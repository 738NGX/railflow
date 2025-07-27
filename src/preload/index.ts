import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Station } from '../../types/station'

// Custom APIs for renderer
const api = {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  addProject: (projectName: string) => ipcRenderer.invoke('add-project', projectName),
  deleteProject: (projectId: string) => ipcRenderer.invoke('delete-project', projectId),
  updateProject: (projectId: string, projectData: { name: string }) => ipcRenderer.invoke('update-project', projectId, projectData),
  getStations: (projectId: string) => ipcRenderer.invoke('get-stations', projectId),
  saveStations: (projectId: string, stations: Station[]) => ipcRenderer.invoke('save-stations', projectId, stations)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
