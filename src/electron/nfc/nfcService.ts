import { NFC, Reader, Card } from "nfc-pcsc";
import { BrowserWindow } from "electron";
import { NfcModeEntity } from "../types/nfc.js";

let mainWindow: BrowserWindow | null = null;

let mode: NfcModeEntity = NfcModeEntity.Read;
let dataToWrite: string | null = null;

export const nfcWriteOnTag = (data?: string) => {
  mode = NfcModeEntity.Write;
  dataToWrite = data ? data : null;
};

export const initializeNfc = (window: BrowserWindow) => {
  mainWindow = window;

  const nfc = new NFC();

  nfc.on("reader", (reader: Reader) => {
    console.log(`${reader.reader.name} device attached`);

    reader.on("card", async (card: Card) => {
      console.log(`Card detected: ${JSON.stringify(card)}`);
      console.log(`mode: ${mode}`);

      const uid = card.uid;

      switch (mode) {
        case NfcModeEntity.Read:
          try {
            const data = await reader.read(4, 12);
            const payload = data.toString();
            mainWindow?.webContents.send("nfc-card-detected", {
              uid,
              data: payload,
            });
          } catch (err) {
            console.error(`error when reading data`, err);
          }
          break;

        case NfcModeEntity.Write:
          try {
            const data = Buffer.allocUnsafe(12);
            data.fill(0);
            const text = dataToWrite ?? "No data";
            data.write(text);

            await reader.write(4, data);
            console.log(`data written`);

            mainWindow?.webContents.send("nfc-card-detected", {
              uid,
              data: text,
            });
            mainWindow?.webContents.send("nfc-write-result", {
              success: true,
              message: "Data written successfully.",
              data: text,
            });
          } catch (err) {
            console.error(`error when writing data`, err);

            const errorMessage =
              err instanceof Error ? err.message : String(err);

            mainWindow?.webContents.send("nfc-write-result", {
              success: false,
              message: "Failed to write data.",
              error: errorMessage,
            });
          }
          break;
      }
    });

    reader.on("error", (err: Error) => {
      console.error(`Reader error: ${err.message}`);
    });

    reader.on("end", () => {
      console.log(`${reader.reader.name} device removed`);
    });
  });

  nfc.on("error", (err: Error) => {
    console.error(`NFC error: ${err.message}`);
  });
};
