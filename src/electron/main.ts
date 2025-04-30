import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { getStatisticData, pollResources } from "./resourceManager.js";
import { nfcWriteOnTag, initializeNfc } from "./nfc/nfcService.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
      // devTools: false, // Uncomment to disable devtools
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5173");
    console.log("Loading URL: http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), "dist-react/index.html");
    console.log(`Loading file: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }

  initializeNfc(mainWindow);

  ipcMain.on("nfc-write-tag", (_event, payload: { data?: string }) => {
    nfcWriteOnTag(payload.data);
  });

  ipcMain.handle("getStatisticData", () => getStatisticData());
};

app.setAppUserModelId("com.ne-labs.Patunay");

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
