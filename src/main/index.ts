import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { Station } from '../../types/station'

const documentsPath = app.getPath('documents')
const railflowProjectsPath = join(documentsPath, 'RailFlow')

async function ensureProjectsDir(): Promise<void> {
  try {
    await fs.access(railflowProjectsPath)
  } catch {
    await fs.mkdir(railflowProjectsPath, { recursive: true })
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 处理窗口关闭前的逻辑
  mainWindow.on('close', async (event) => {
    event.preventDefault()

    try {
      // 直接通过executeJavaScript获取状态并处理确认对话框
      const shouldClose = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          if (window.projectStore && window.projectStore.hasUnsavedChanges) {
            const { ElMessageBox } = await import('element-plus')
            try {
              await ElMessageBox.confirm(
                '您有未保存的更改，确定要退出吗？',
                '确认退出',
                {
                  confirmButtonText: '退出',
                  cancelButtonText: '取消',
                  type: 'warning'
                }
              )
              return true
            } catch {
              return false
            }
          }
          return true
        })()
      `)

      if (shouldClose) {
        mainWindow.destroy()
      }
    } catch (error) {
      console.error('Error during close confirmation:', error)
      mainWindow.destroy()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('get-projects', async () => {
    await ensureProjectsDir()
    const projectFolders = await fs.readdir(railflowProjectsPath, { withFileTypes: true })
    const projects = projectFolders
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    const projectDetails = await Promise.all(
      projects.map(async (projectId) => {
        try {
          const projectJsonPath = join(railflowProjectsPath, projectId, 'project.json')
          const data = await fs.readFile(projectJsonPath, 'utf-8')
          return { id: projectId, ...JSON.parse(data) }
        } catch (error) {
          console.error(`Failed to read project.json for ${projectId}`, error)
          return { id: projectId, name: 'Invalid Project', error: true }
        }
      })
    )
    return projectDetails
  })

  ipcMain.handle('add-project', async (_, projectName: string) => {
    await ensureProjectsDir()
    const projectId = uuidv4()
    const projectPath = join(railflowProjectsPath, projectId)
    await fs.mkdir(projectPath)

    const projectJson = {
      id: projectId,
      name: projectName,
      createdAt: new Date().toISOString(),
      savedAt: new Date().toISOString()
    }
    await fs.writeFile(join(projectPath, 'project.json'), JSON.stringify(projectJson, null, 2))
    await fs.writeFile(join(projectPath, 'lines.json'), '[]')
    await fs.writeFile(join(projectPath, 'stations.json'), '[]')
    await fs.writeFile(join(projectPath, 'devices.json'), '[]')

    return projectJson
  })

  ipcMain.handle('delete-project', async (_, projectId: string) => {
    const projectPath = join(railflowProjectsPath, projectId)
    await fs.rm(projectPath, { recursive: true, force: true })
    return { success: true }
  })

  ipcMain.handle('update-project', async (_, projectId: string, projectData: { name: string }) => {
    const projectJsonPath = join(railflowProjectsPath, projectId, 'project.json')
    try {
      const data = await fs.readFile(projectJsonPath, 'utf-8')
      const project = JSON.parse(data)
      project.name = projectData.name
      project.savedAt = new Date().toISOString()
      await fs.writeFile(projectJsonPath, JSON.stringify(project, null, 2))
      return { success: true, project }
    } catch (error) {
      console.error(`Failed to update project.json for ${projectId}`, error)
      return { success: false, error: 'Failed to update project' }
    }
  })

  ipcMain.handle('get-stations', async (_, projectId: string) => {
    const stationsJsonPath = join(railflowProjectsPath, projectId, 'stations.json')
    try {
      const data = await fs.readFile(stationsJsonPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error(`Failed to read stations.json for ${projectId}`, error)
      return []
    }
  })

  ipcMain.handle('save-stations', async (_, projectId: string, stations: Station[]) => {
    const stationsJsonPath = join(railflowProjectsPath, projectId, 'stations.json')
    try {
      await fs.writeFile(stationsJsonPath, JSON.stringify(stations, null, 2))
      // Also update the project's savedAt timestamp
      const projectJsonPath = join(railflowProjectsPath, projectId, 'project.json')
      const projectData = await fs.readFile(projectJsonPath, 'utf-8')
      const project = JSON.parse(projectData)
      project.savedAt = new Date().toISOString()
      await fs.writeFile(projectJsonPath, JSON.stringify(project, null, 2))
      return { success: true }
    } catch (error) {
      console.error(`Failed to save stations.json for ${projectId}`, error)
      return { success: false, error: 'Failed to save stations' }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
