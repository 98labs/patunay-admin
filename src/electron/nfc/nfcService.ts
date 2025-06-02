import { NFC, Reader, Card } from "nfc-pcsc";
import { BrowserWindow } from "electron";
import { NfcModeEntity } from "../types/nfc.js";
import { electronLogger } from "../logging/electronLogger.js";
import { LogCategory } from "../../shared/logging/types.js";

let mainWindow: BrowserWindow | null = null;
let nfcInstance: NFC | null = null;
let isNfcInitialized = false;
let isNfcDeviceAvailable = false;
const connectedReaders: Map<string, Reader> = new Map();

let mode: NfcModeEntity = NfcModeEntity.Read;
let dataToWrite: string | null = null;

// Error types for better error handling
enum NfcErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  READER_CONNECTION_FAILED = 'READER_CONNECTION_FAILED',
  CARD_READ_FAILED = 'CARD_READ_FAILED',
  CARD_WRITE_FAILED = 'CARD_WRITE_FAILED',
  READER_ERROR = 'READER_ERROR',
  GENERAL_ERROR = 'GENERAL_ERROR'
}

interface NfcError extends Error {
  type: NfcErrorType;
  originalError?: Error | undefined;
}

const createNfcError = (type: NfcErrorType, message: string, originalError?: Error | undefined): NfcError => {
  const error = new Error(message) as NfcError;
  error.type = type;
  error.originalError = originalError;
  return error;
};

// Device status management
export const getNfcDeviceStatus = (): { available: boolean; readers: string[]; initialized: boolean } => {
  const readerNames = Array.from(connectedReaders.keys());
  electronLogger.debug("Getting NFC device status", LogCategory.NFC, { component: "DeviceStatus" }, {
    available: isNfcDeviceAvailable,
    readersCount: readerNames.length,
    readers: readerNames,
    initialized: isNfcInitialized
  });
  
  return {
    available: isNfcDeviceAvailable,
    readers: readerNames,
    initialized: isNfcInitialized
  };
};

export const refreshNfcDeviceStatus = (): void => {
  electronLogger.info("Manual NFC device status refresh requested", LogCategory.NFC, { component: "DeviceStatus" });
  
  // Send current status immediately
  const status = getNfcDeviceStatus();
  mainWindow?.webContents.send("nfc-device-status", status);
  
  // Re-initialize if no devices are available but service isn't initialized
  if (!status.available && !status.initialized && mainWindow) {
    electronLogger.info("Re-initializing NFC service due to manual refresh", LogCategory.NFC, { component: "DeviceStatus" });
    initializeNfc(mainWindow);
  }
};

const notifyDeviceStatusChange = (available: boolean, readerName?: string): void => {
  isNfcDeviceAvailable = available;
  const status = getNfcDeviceStatus();
  
  electronLogger.info("NFC device status changed", LogCategory.NFC, { component: "DeviceStatus" }, {
    available,
    readerName,
    totalReaders: status.readers.length,
    readers: status.readers
  });
  
  mainWindow?.webContents.send("nfc-device-status", status);
};

// Set NFC mode function
export const setNfcMode = (newMode: string, data?: string): void => {
  console.log(`🔧 setNfcMode called: ${mode} -> ${newMode}`, { data });
  
  electronLogger.info("Setting NFC mode", LogCategory.NFC, { component: "NfcService" }, { 
    previousMode: mode, 
    newMode, 
    hasData: !!data 
  });
  
  // Validate mode
  const validModes = Object.values(NfcModeEntity);
  if (!validModes.includes(newMode as NfcModeEntity)) {
    console.log(`❌ Invalid mode: ${newMode}, valid modes:`, validModes);
    electronLogger.error("Invalid NFC mode provided", LogCategory.NFC, { component: "NfcService" }, { 
      newMode, 
      validModes 
    });
    return;
  }
  
  mode = newMode as NfcModeEntity;
  dataToWrite = data || null;
  
  console.log(`✅ NFC mode updated successfully: ${mode}`);
  
  electronLogger.info("NFC mode updated successfully", LogCategory.NFC, { component: "NfcService" }, { 
    mode: mode,
    dataToWrite: dataToWrite 
  });
};

export const nfcWriteOnTag = (data?: string) => {
  try {
    if (!isNfcInitialized) {
      throw createNfcError(
        NfcErrorType.GENERAL_ERROR,
        'NFC service is not initialized. Please ensure NFC reader is connected.'
      );
    }
    
    mode = NfcModeEntity.Write;
    dataToWrite = data ? data : null;
    
    console.log(`NFC write mode set. Data to write: ${dataToWrite}`);
  } catch (error) {
    const nfcError = error as NfcError;
    console.error(`NFC write setup failed: ${nfcError.message}`);
    
    mainWindow?.webContents.send("nfc-write-result", {
      success: false,
      message: nfcError.message,
      error: nfcError.type,
    });
  }
};

export const initializeNfc = (window: BrowserWindow) => {
  mainWindow = window;

  try {
    electronLogger.info("Initializing NFC service", LogCategory.NFC, { component: "NfcService" });
    
    // Clean up existing instance if it exists
    if (nfcInstance) {
      electronLogger.debug('Cleaning up existing NFC instance', LogCategory.NFC, { component: "NfcService" });
      if (nfcInstance.removeAllListeners) {
        nfcInstance.removeAllListeners();
      } else {
        electronLogger.debug('removeAllListeners not available, skipping cleanup', LogCategory.NFC, { component: "NfcService" });
      }
      nfcInstance = null;
    }

    // Clear previous state
    isNfcInitialized = false;
    isNfcDeviceAvailable = false;
    connectedReaders.clear();

    nfcInstance = new NFC();
    electronLogger.debug("NFC instance created", LogCategory.NFC, { component: "NfcService" });

    nfcInstance.on("reader", (reader: Reader) => {
      const readerName = reader.reader.name;
      electronLogger.info(`NFC device attached: ${readerName}`, LogCategory.NFC, { component: "NfcService" }, { readerName });
      
      isNfcInitialized = true;
      connectedReaders.set(readerName, reader);
      
      // Check if this is an RFID/NFC reader (e.g., ACS ACR122U)
      const isCompatibleReader = readerName.toLowerCase().includes('acr122') || 
                                readerName.toLowerCase().includes('nfc') || 
                                readerName.toLowerCase().includes('rfid') ||
                                readerName.toLowerCase().includes('picc');
      
      electronLogger.info(`Reader compatibility check`, LogCategory.NFC, { component: "NfcService" }, { 
        readerName, 
        isCompatible: isCompatibleReader 
      });
      
      // Notify about device availability
      notifyDeviceStatusChange(true, readerName);

      // Notify renderer process about reader connection
      mainWindow?.webContents.send("nfc-reader-connected", {
        readerName: readerName,
        status: 'connected'
      });

      // Also send updated device status immediately
      setTimeout(() => {
        const currentStatus = getNfcDeviceStatus();
        electronLogger.info("Sending updated device status after reader connection", LogCategory.NFC, { component: "NfcService" }, currentStatus);
        mainWindow?.webContents.send("nfc-device-status", currentStatus);
      }, 100);

      reader.on("card", async (card: Card) => {
        console.log(`Card detected: ${JSON.stringify(card)}`);
        console.log(`mode: ${mode}`);

        const uid = card.uid;

        try {
          switch (mode) {
            case NfcModeEntity.Read:
              await handleCardRead(reader, uid);
              break;

            case NfcModeEntity.Write:
              await handleCardWrite(reader, uid);
              break;

            case NfcModeEntity.Search:
              await handleCardSearch(reader, uid);
              break;

            default:
              throw createNfcError(
                NfcErrorType.GENERAL_ERROR,
                `Unknown NFC mode: ${mode}`
              );
          }
        } catch (error) {
          const nfcError = error as NfcError;
          console.error(`Card operation failed: ${nfcError.message}`, nfcError.originalError);
          
          mainWindow?.webContents.send("nfc-operation-error", {
            type: nfcError.type,
            message: nfcError.message,
            uid,
            mode
          });
        }
      });

      reader.on("error", (err: Error) => {
        const nfcError = createNfcError(
          NfcErrorType.READER_ERROR,
          `Reader error: ${err.message}`,
          err
        );
        console.error(nfcError.message, nfcError.originalError);
        
        mainWindow?.webContents.send("nfc-reader-error", {
          type: nfcError.type,
          message: nfcError.message,
          readerName: reader.reader.name
        });
      });

      reader.on("end", () => {
        const readerName = reader.reader.name;
        electronLogger.info(`NFC device removed: ${readerName}`, LogCategory.NFC, { component: "NfcService" }, { readerName });
        
        connectedReaders.delete(readerName);
        
        // Update device availability status
        const hasOtherReaders = connectedReaders.size > 0;
        if (!hasOtherReaders) {
          isNfcInitialized = false;
          notifyDeviceStatusChange(false, readerName);
        }
        
        mainWindow?.webContents.send("nfc-reader-disconnected", {
          readerName: readerName,
          status: 'disconnected'
        });
      });
    });

    nfcInstance.on("error", (err: Error) => {
      const nfcError = createNfcError(
        NfcErrorType.INITIALIZATION_FAILED,
        `NFC initialization error: ${err.message}`,
        err
      );
      console.error(nfcError.message, nfcError.originalError);
      isNfcInitialized = false;
      
      mainWindow?.webContents.send("nfc-service-error", {
        type: nfcError.type,
        message: nfcError.message
      });
    });

    console.log('NFC service initialized successfully');
  } catch (error) {
    const nfcError = createNfcError(
      NfcErrorType.INITIALIZATION_FAILED,
      `Failed to initialize NFC service: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
    console.error(nfcError.message, nfcError.originalError);
    isNfcInitialized = false;
    
    mainWindow?.webContents.send("nfc-service-error", {
      type: nfcError.type,
      message: nfcError.message
    });
  }
};

// Helper function for card reading
const handleCardRead = async (reader: Reader, uid: string): Promise<void> => {
  try {
    const data = await reader.read(4, 64);
    const payload = data.toString();
    
    mainWindow?.webContents.send("nfc-card-detected", {
      uid,
      data: payload,
    });
    
    console.log(`Card read successful. UID: ${uid}, Data: ${payload}`);
  } catch (err) {
    throw createNfcError(
      NfcErrorType.CARD_READ_FAILED,
      `Failed to read card data: ${err instanceof Error ? err.message : String(err)}`,
      err instanceof Error ? err : undefined
    );
  }
};

// Helper function for card writing
const handleCardWrite = async (reader: Reader, uid: string): Promise<void> => {
  try {
    const text = dataToWrite ?? "No data";
    console.log(`Writing to card. UID: ${uid}, Text: ${text}`);

    // Validate data before writing
    if (text.length === 0) {
      throw createNfcError(
        NfcErrorType.CARD_WRITE_FAILED,
        'Cannot write empty data to NFC card'
      );
    }

    if (text.length > 64) {
      throw createNfcError(
        NfcErrorType.CARD_WRITE_FAILED,
        `Data too large for NFC card. Maximum 64 bytes, got ${text.length} bytes`
      );
    }

    const data = Buffer.allocUnsafe(text.length);
    data.fill(0);
    data.write(text);

    await reader.write(4, data);

    // Success notifications
    mainWindow?.webContents.send("nfc-card-detected", {
      uid,
      data: text,
    });
    
    mainWindow?.webContents.send("nfc-write-result", {
      success: true,
      message: "Data written successfully.",
      data: text,
    });

    // Reset to read mode
    mode = NfcModeEntity.Read;
    dataToWrite = null;
    
    console.log(`Card write successful. UID: ${uid}, Data: ${text}`);
  } catch (err) {
    // Reset mode on failure
    mode = NfcModeEntity.Read;
    dataToWrite = null;
    
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    const nfcError = createNfcError(
      NfcErrorType.CARD_WRITE_FAILED,
      `Failed to write card data: ${errorMessage}`,
      err instanceof Error ? err : undefined
    );
    
    mainWindow?.webContents.send("nfc-write-result", {
      success: false,
      message: nfcError.message,
      error: nfcError.type,
    });
    
    throw nfcError;
  }
};

// Helper function to extract UUID from NFC data
const extractUuidFromNfcData = (rawData: Buffer): string => {
  const dataString = rawData.toString();
  
  // UUID regex pattern (8-4-4-4-12 format)
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  
  // Try to find UUID in the string
  const match = dataString.match(uuidPattern);
  
  if (match) {
    return match[0];
  }
  
  // If no UUID found, try to clean up the string and look for UUID-like patterns
  // Remove null bytes and control characters
  const cleanedString = dataString.replace(/[\x00-\x1F\x7F]/g, '');
  const cleanedMatch = cleanedString.match(uuidPattern);
  
  if (cleanedMatch) {
    return cleanedMatch[0];
  }
  
  // If still no UUID found, return empty string
  return "";
};

// Helper function for card search/navigation
const handleCardSearch = async (reader: Reader, uid: string): Promise<void> => {
  try {
    electronLogger.info(`NFC search: Card detected for navigation`, LogCategory.NFC, { component: "Search" }, { uid });
    
    // For search mode, we need to read the data to get the artwork ID
    electronLogger.info(`NFC search: Reading NFC data to find artwork ID`, LogCategory.NFC, { component: "Search" }, { uid });
    
    let artworkId = "";
    
    try {
      // Try to read data from the NFC tag
      const data = await reader.read(4, 64);
      const rawDataString = data.toString();
      
      electronLogger.info(`NFC search: Raw data read from tag`, LogCategory.NFC, { component: "Search" }, { 
        uid, 
        rawData: rawDataString,
        dataLength: rawDataString.length 
      });
      
      // Extract UUID from the raw data
      artworkId = extractUuidFromNfcData(data);
      
      electronLogger.info(`NFC search: Extracted artwork ID from tag`, LogCategory.NFC, { component: "Search" }, { 
        uid, 
        artworkId,
        extractedSuccessfully: !!artworkId
      });
    } catch (readError) {
      // If reading fails, log the error but still send the event with empty data
      electronLogger.warn(`NFC search: Failed to read data from tag, proceeding with UID only`, LogCategory.NFC, { component: "Search" }, { 
        uid, 
        error: readError instanceof Error ? readError.message : String(readError)
      });
    }
    
    // Send search event to renderer process for navigation
    const searchEventData = {
      uid,
      data: artworkId, // Contains cleaned artwork ID from NFC tag data
      timestamp: new Date().toISOString(),
    };
    
    console.log(`📡 Sending nfc-card-search IPC event:`, searchEventData);
    electronLogger.info(`Sending nfc-card-search IPC event to renderer`, LogCategory.NFC, { component: "Search" }, searchEventData);
    
    mainWindow?.webContents.send("nfc-card-search", searchEventData);
    
    console.log(`NFC Search - Card detected. UID: ${uid}, Artwork ID: ${artworkId || 'none'}`);
  } catch (err) {
    const searchError = createNfcError(
      NfcErrorType.CARD_READ_FAILED,
      `Failed to process NFC card for search: ${err instanceof Error ? err.message : String(err)}`,
      err instanceof Error ? err : undefined
    );
    
    electronLogger.error(`NFC search failed`, LogCategory.NFC, { component: "Search" }, { uid }, searchError);
    
    // Send search error to renderer
    mainWindow?.webContents.send("nfc-search-error", {
      uid,
      error: searchError.type,
      message: searchError.message,
      timestamp: new Date().toISOString(),
    });
    
    throw searchError;
  }
};

// Cleanup function for graceful shutdown
export const cleanupNfc = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      console.log('Cleaning up NFC service');
      
      if (nfcInstance) {
        // Try to close NFC instance properly if it has a close method
        if (typeof (nfcInstance as any).close === 'function') {
          (nfcInstance as any).close();
        }
        
        // Remove all listeners if possible
        if (typeof (nfcInstance as any).removeAllListeners === 'function') {
          (nfcInstance as any).removeAllListeners();
        }
        
        nfcInstance = null;
      }
      
      isNfcInitialized = false;
      mode = NfcModeEntity.Read;
      dataToWrite = null;
      mainWindow = null;
      
      console.log('NFC service cleanup completed');
      
      // Add a small delay to ensure cleanup completes
      setTimeout(() => {
        resolve();
      }, 500);
      
    } catch (error) {
      console.error('Error during NFC cleanup:', error);
      resolve(); // Still resolve to allow app to quit
    }
  });
};
