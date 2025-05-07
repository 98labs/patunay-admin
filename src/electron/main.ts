import { app, BrowserWindow, ipcMain, dialog } from "electron";
import pkg from 'electron-updater';
import path from "path";
import { createRequire } from "module";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { getStatisticData, pollResources } from "./resourceManager.js";
// import { initializeNfc, nfcWriteOnTag } from "./nfc/nfcService.js";
const require = createRequire(import.meta.url);
const { autoUpdater } = pkg;

if (require("electron-squirrel-startup")) {
  app.quit();
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
let mainWindow: any;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      // devTools: false, // Uncomment to disable devtools
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5173/login");
    console.log("Loading URL: http://localhost:5173/login");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), "dist-react/index.html");
    console.log(`Loading file: ${indexPath}`);
    mainWindow.loadFile(indexPath);

    autoUpdater.checkForUpdatesAndNotify();

  }

  // initializeNfc(mainWindow);

  ipcMain.handle("getStatisticData", () => getStatisticData());
  // ipcMain.on("nfc-write-tag", (_event, payload: { data?: string }) => {
  //   nfcWriteOnTag(payload.data);
  // });

  // ipcMain.handle("getStatisticData", () => getStatisticData());
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
// ===========================
//  AUTOUPDATER HANDLERS
// ===========================

autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
});

autoUpdater.on("update-available", () => {
  console.log("Update available. Downloading...");

  dialog
    .showMessageBox(mainWindow, {
      type: "info",
      title: "Update Available",
      message: "A new version is downloading in the background.",
      buttons: ["OK"],
    })
    .then(() => {
      console.log("User acknowledged update download.");
    });
});

autoUpdater.on("update-not-available", () => {
  console.log("No updates available.");
});

autoUpdater.on("download-progress", (progress) => {
  console.log(`Download progress: ${progress.percent.toFixed(2)}%`);
});

autoUpdater.on("update-downloaded", () => {
  console.log("Update downloaded.");

  dialog
    .showMessageBox(mainWindow, {
      type: "question",
      buttons: ["Restart", "Later"],
      title: "Install Updates",
      message: "An update has been downloaded. Restart the app to install it?",
    })
    .then((result) => {
      if (result.response === 0) {
        console.log("User chose to restart and install.");
        autoUpdater.quitAndInstall();
      } else {
        console.log("User chose to install later.");
      }
    });
});

autoUpdater.on("error", (error) => {
  console.error("Error during update process:", error.message);
});