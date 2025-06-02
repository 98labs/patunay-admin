import { app, BrowserWindow, ipcMain, dialog } from "electron";
import pkg from "electron-updater";
import path from "path";
import { createRequire } from "module";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { getStatisticData } from "./resourceManager.js";
import { initializeNfc, nfcWriteOnTag, cleanupNfc, getNfcDeviceStatus, refreshNfcDeviceStatus } from "./nfc/nfcService.js";
import { electronLogger } from "./logging/electronLogger.js";
import { LogCategory } from "../shared/logging/types.js";

const require = createRequire(import.meta.url);
const { autoUpdater } = pkg;

if (require("electron-squirrel-startup")) {
  app.quit();
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
let mainWindow: any;

// Set Chromium flags to reduce warnings
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-dev-tools-fonts');
app.commandLine.appendSwitch('--disable-extensions');
app.commandLine.appendSwitch('--disable-plugins');

// Suppress DevTools autofill warnings at the process level
if (isDev()) {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Autofill.enable') || 
        message.includes('Autofill.setAddresses') ||
        message.includes('Request Autofill')) {
      return; // Suppress these specific warnings
    }
    originalConsoleError.apply(console, args);
  };
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      // Disable various features that might cause DevTools warnings
      autoplayPolicy: 'no-user-gesture-required',
      disableDialogs: true
    },
  });

  if (isDev()) {
    const devPort = process.env["VITE_DEV_PORT"] || "5173";
    const devUrl = `http://localhost:${devPort}/login`;
    
    // Wait for Vite dev server to be ready before loading
    const waitForServer = async () => {
      const maxAttempts = 30; // 30 seconds max wait
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`http://localhost:${devPort}/`);
          if (response.ok) {
            electronLogger.info("Vite server is ready", LogCategory.SYSTEM, { component: "Main" });
            mainWindow.loadURL(devUrl);
            electronLogger.info("Loading development URL", LogCategory.SYSTEM, { component: "Main" }, { url: devUrl });
            
            // Only open DevTools if explicitly requested (set ENABLE_DEVTOOLS=true to enable)
            if (process.env.ENABLE_DEVTOOLS === 'true') {
              mainWindow.webContents.openDevTools();
            }
            return;
          }
        } catch (error) {
          // Server not ready yet, continue waiting
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
      
      // If we get here, the server didn't start in time
      electronLogger.error("Vite server failed to start within 30 seconds", LogCategory.SYSTEM, { component: "Main" });
      mainWindow.loadURL(`data:text/html,<html><body><h1>Waiting for dev server...</h1><p>Please start the React dev server with: npm run dev:react</p></body></html>`);
    };
    
    waitForServer().catch(error => {
      electronLogger.error("Error waiting for Vite server", LogCategory.SYSTEM, { component: "Main" }, error);
    });
  } else {
    const indexPath = path.join(app.getAppPath(), "dist-react/index.html");
    electronLogger.info("Loading production file", LogCategory.SYSTEM, { component: "Main" }, { path: indexPath });
    mainWindow.loadFile(indexPath);

    autoUpdater.checkForUpdatesAndNotify();
  }

  initializeNfc(mainWindow);

  ipcMain.handle("getStatisticData", () => getStatisticData());

  // NFC device status handlers
  ipcMain.handle("nfc-get-device-status", () => {
    const status = getNfcDeviceStatus();
    electronLogger.info("IPC: Getting NFC device status", LogCategory.NFC, { component: "IPC" }, status);
    return status;
  });

  ipcMain.on("nfc-refresh-device-status", () => {
    electronLogger.info("IPC: Manual NFC device status refresh requested", LogCategory.NFC, { component: "IPC" });
    refreshNfcDeviceStatus();
  });

  // Handle log entries from renderer process
  ipcMain.on("log-entry", (_event, logEntry) => {
    try {
      electronLogger.info(
        `[Renderer] ${logEntry.message}`,
        logEntry.category || LogCategory.UI,
        {
          component: 'RendererProcess',
          originalContext: logEntry.context
        },
        {
          level: logEntry.level,
          data: logEntry.data,
          error: logEntry.error,
          duration: logEntry.duration
        }
      );
    } catch (error) {
      electronLogger.error("Failed to process renderer log entry", LogCategory.SYSTEM, { component: "IPC" }, { logEntry }, error as Error);
    }
  });

  ipcMain.on("nfc-write-tag", (_event, payload: unknown) => {
    // Validate IPC payload
    if (!payload || typeof payload !== 'object') {
      electronLogger.error('Invalid nfc-write-tag payload: expected object', LogCategory.SECURITY, { component: "IPC" }, { payload });
      return;
    }

    const typedPayload = payload as Record<string, unknown>;
    
    // Validate data field if present
    if (typedPayload["data"] !== undefined && typeof typedPayload["data"] !== 'string') {
      electronLogger.error('Invalid nfc-write-tag payload: data must be string or undefined', LogCategory.SECURITY, { component: "IPC" }, { payload: typedPayload });
      return;
    }

    electronLogger.info("Processing NFC write request", LogCategory.NFC, { component: "IPC" }, { hasData: !!typedPayload["data"] });
    nfcWriteOnTag(typedPayload["data"] as string | undefined);
  });
};
app.setAppUserModelId("com.patunay");

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
  electronLogger.info("Checking for updates", LogCategory.SYSTEM, { component: "AutoUpdater" });
});

autoUpdater.on("update-available", () => {
  electronLogger.info("Update available, downloading", LogCategory.SYSTEM, { component: "AutoUpdater" });

  dialog
    .showMessageBox(mainWindow, {
      type: "info",
      title: "Update Available",
      message: "A new version is downloading in the background.",
      buttons: ["OK"],
    })
    .then(() => {
      electronLogger.info("User acknowledged update download", LogCategory.SYSTEM, { component: "AutoUpdater" });
    });
});

autoUpdater.on("update-not-available", () => {
  electronLogger.info("No updates available", LogCategory.SYSTEM, { component: "AutoUpdater" });
});

autoUpdater.on("download-progress", (progress) => {
  electronLogger.debug("Update download progress", LogCategory.SYSTEM, { component: "AutoUpdater" }, { percent: progress.percent.toFixed(2) });
});

autoUpdater.on("update-downloaded", () => {
  electronLogger.info("Update downloaded", LogCategory.SYSTEM, { component: "AutoUpdater" });

  dialog
    .showMessageBox(mainWindow, {
      type: "question",
      buttons: ["Restart", "Later"],
      title: "Install Updates",
      message: "An update has been downloaded. Restart the app to install it?",
    })
    .then((result) => {
      if (result.response === 0) {
        electronLogger.info("User chose to restart and install update", LogCategory.SYSTEM, { component: "AutoUpdater" });
        autoUpdater.quitAndInstall();
      } else {
        electronLogger.info("User chose to install update later", LogCategory.SYSTEM, { component: "AutoUpdater" });
      }
    });
});

autoUpdater.on("error", (error) => {
  electronLogger.error("Error during update process", LogCategory.SYSTEM, { component: "AutoUpdater" }, { errorMessage: error.message }, error);
});

// Cleanup on app exit
app.on("before-quit", async (event) => {
  event.preventDefault(); // Prevent immediate quit
  electronLogger.info("Application shutting down, cleaning up NFC service", LogCategory.SYSTEM, { component: "Main" });
  
  try {
    await cleanupNfc();
    electronLogger.info("NFC cleanup completed, quitting application", LogCategory.SYSTEM, { component: "Main" });
  } catch (error) {
    electronLogger.error("Error during NFC cleanup", LogCategory.SYSTEM, { component: "Main" }, error as Error);
  } finally {
    app.exit(0); // Force quit after cleanup
  }
});

app.on("window-all-closed", async () => {
  try {
    await cleanupNfc();
    electronLogger.info("NFC cleanup completed after window close", LogCategory.SYSTEM, { component: "Main" });
  } catch (error) {
    electronLogger.error("Error during NFC cleanup on window close", LogCategory.SYSTEM, { component: "Main" }, error as Error);
  }
  
  if (process.platform !== "darwin") {
    app.quit();
  }
});
