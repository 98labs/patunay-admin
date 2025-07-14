const { contextBridge, ipcRenderer } = require("electron");

// Get NfcModeEntity from the compiled output
const NfcModeEntity = {
  Read: 'Read',
  Write: 'Write'
};

// Implement the complete ElectronAPI
const electronAPI = {
  // System information
  getStaticData: () => ipcRenderer.invoke("getStatisticData"),
  
  // Logging support
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data)
  },
  
  subscribeStatistics: (callback) => {
    ipcRenderer.on("statistics", (_, stats) => {
      callback(stats);
    });
  },

  // NFC operations
  setMode: (mode, data) => {
    ipcRenderer.send("nfc-set-mode", { mode, data });
  },

  writeOnTag: (data) => {
    ipcRenderer.send("nfc-write-tag", { data });
  },

  subscribeNfcWriteResult: (callback) => {
    const handler = (_, result) => {
      console.log('🔵 NFC write result in preload:', result);
      callback(result);
    };
    ipcRenderer.on("nfc-write-result", handler);
    
    // Return unsubscribe function
    return () => {
      console.log('🔵 Unsubscribing from nfc-write-result');
      ipcRenderer.removeListener("nfc-write-result", handler);
    };
  },
  
  unsubscribeNfcWriteResult: (callback) => {
    // Legacy support - no longer needed with return function above
    console.log('🔵 Legacy unsubscribeNfcWriteResult called');
  },

  subscribeNfcCardDetection: (callback) => {
    const handler = (_, data) => {
      console.log('🔵 NFC card detected in preload:', data);
      callback(data);
    };
    ipcRenderer.on("nfc-card-detected", handler);
    
    // Return unsubscribe function
    return () => {
      console.log('🔵 Unsubscribing from nfc-card-detected');
      ipcRenderer.removeListener("nfc-card-detected", handler);
    };
  },

  // Enhanced NFC event listeners for better error handling
  subscribeNfcOperationError: (callback) => {
    ipcRenderer.on("nfc-operation-error", (_, error) => {
      callback(error);
    });
  },

  subscribeNfcReaderConnected: (callback) => {
    ipcRenderer.on("nfc-reader-connected", (_, status) => {
      callback(status);
    });
  },

  subscribeNfcReaderDisconnected: (callback) => {
    ipcRenderer.on("nfc-reader-disconnected", (_, status) => {
      callback(status);
    });
  },

  subscribeNfcServiceError: (callback) => {
    ipcRenderer.on("nfc-service-error", (_, error) => {
      callback(error);
    });
  },

  // NFC device status management
  getNfcDeviceStatus: () => {
    console.log('Invoking nfc-get-device-status via IPC'); // Debug log
    return ipcRenderer.invoke("nfc-get-device-status").then(status => {
      console.log('Received status from nfc-get-device-status:', status); // Debug log
      return status;
    });
  },
  
  refreshNfcDeviceStatus: () => {
    ipcRenderer.send("nfc-refresh-device-status");
  },

  subscribeNfcDeviceStatus: (callback) => {
    console.log('Setting up nfc-device-status listener in preload'); // Debug log
    ipcRenderer.on("nfc-device-status", (_, status) => {
      console.log('Received nfc-device-status event in preload:', status); // Debug log
      callback(status);
    });
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electron", electronAPI);