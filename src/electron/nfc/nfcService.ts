import { NFC, Reader, Card } from "nfc-pcsc";
import { BrowserWindow } from "electron";
import { NfcModeEntity } from "../types/nfc.js";

let mainWindow: BrowserWindow | null = null;
let nfcInstance: NFC | null = null;
let isNfcInitialized = false;

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
    // Clean up existing instance if it exists
    if (nfcInstance) {
      console.log('Cleaning up existing NFC instance');
      // Remove specific event listeners since removeAllListeners is not available
      nfcInstance.removeAllListeners?.() || console.log('removeAllListeners not available, skipping cleanup');
      nfcInstance = null;
    }

    nfcInstance = new NFC();

    nfcInstance.on("reader", (reader: Reader) => {
      console.log(`${reader.reader.name} device attached`);
      isNfcInitialized = true;

      // Notify renderer process about reader connection
      mainWindow?.webContents.send("nfc-reader-connected", {
        readerName: reader.reader.name,
        status: 'connected'
      });

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
        console.log(`${reader.reader.name} device removed`);
        isNfcInitialized = false;
        
        mainWindow?.webContents.send("nfc-reader-disconnected", {
          readerName: reader.reader.name,
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

// Cleanup function for graceful shutdown
export const cleanupNfc = (): void => {
  try {
    if (nfcInstance) {
      console.log('Cleaning up NFC service');
      // Since removeAllListeners is not available in the API, we'll just set to null
      // The NFC instance will be garbage collected
      nfcInstance = null;
    }
    isNfcInitialized = false;
    mode = NfcModeEntity.Read;
    dataToWrite = null;
    mainWindow = null;
  } catch (error) {
    console.error('Error during NFC cleanup:', error);
  }
};
