import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath } from './pathResolver.js'
import { getStatisticData, pollResources } from './resourceManager.js';

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: getPreloadPath()
        }
    });
    if (isDev()) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), 'dist-react/index.html'));
    }

    pollResources(mainWindow);

    ipcMain.handle("getStatisticData", () => getStatisticData())
    
}
app.setAppUserModelId("com.ne-labs.Patunay");
if (require('electron-squirrel-startup')) app.quit();
app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })