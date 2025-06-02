const { contextBridge, ipcRenderer } = require("electron");

// Define NfcModeEntity locally since we can't import it in CommonJS easily
const NfcModeEntity = {
  Read: 'read',
  Write: 'write',
  Search: 'search'
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
    console.log('🚀 Preload setMode called:', { mode, data });
    const payload = { mode, data };
    console.log('🚀 Sending payload to IPC:', payload);
    ipcRenderer.send("nfc-set-mode", payload);
  },

  writeOnTag: (data) => {
    ipcRenderer.send("nfc-write-tag", { data });
  },

  subscribeNfcWriteResult: (callback) => {
    ipcRenderer.on("nfc-write-result", (_, result) => {
      callback(result);
    });
  },

  subscribeNfcCardDetection: (callback) => {
    ipcRenderer.on("nfc-card-detected", (_, data) => {
      callback(data);
    });
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
    console.log('🔧 Setting up nfc-device-status listener in preload'); // Debug log
    console.log('🔧 Callback function provided:', typeof callback);
    ipcRenderer.on("nfc-device-status", (_, status) => {
      console.log('🔧 ========= DEVICE STATUS EVENT RECEIVED =========');
      console.log('🔧 Received nfc-device-status event in preload:', status);
      console.log('🔧 Status available:', status?.available);
      console.log('🔧 Status readers:', status?.readers);
      console.log('🔧 Status initialized:', status?.initialized);
      console.log('🔧 Calling React callback...');
      try {
        callback(status);
        console.log('🔧 React callback called successfully');
      } catch (error) {
        console.error('🔧 Error calling React callback:', error);
      }
      console.log('🔧 ===============================================');
    });
  },

  // NFC search and navigation
  subscribeNfcCardSearch: (callback) => {
    console.log('🚀 Setting up nfc-card-search listener in preload');
    console.log('🚀 Callback function provided:', typeof callback);
    ipcRenderer.on("nfc-card-search", (_, data) => {
      console.log('🚀 ========= NFC CARD SEARCH EVENT RECEIVED =========');
      console.log('🚀 Received nfc-card-search event in preload:', data);
      console.log('🚀 UID:', data?.uid);
      console.log('🚀 Data:', data?.data);
      console.log('🚀 Timestamp:', data?.timestamp);
      console.log('🚀 Calling React callback with data...');
      try {
        callback(data);
        console.log('🚀 React callback called successfully');
      } catch (error) {
        console.error('🚀 Error calling React callback:', error);
      }
      console.log('🚀 ===============================================');
    });
  },

  subscribeNfcSearchError: (callback) => {
    console.log('Setting up nfc-search-error listener in preload');
    ipcRenderer.on("nfc-search-error", (_, error) => {
      console.log('Received nfc-search-error event in preload:', error);
      callback(error);
    });
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electron", electronAPI);