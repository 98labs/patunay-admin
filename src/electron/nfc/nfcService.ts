import { NFC, Reader, Card } from "nfc-pcsc";
import { BrowserWindow } from "electron";

enum NfcModeEntity {
  Read = "read",
  Write = "write",
}

let mainWindow: BrowserWindow | null = null;

let mode: NfcModeEntity = NfcModeEntity.Write;
let dataToWrite: string | null = null;

export const setNfcMode = (newMode: NfcModeEntity, data?: string) => {
  mode = newMode;
  dataToWrite = newMode === NfcModeEntity.Write && data ? data : null;
};

export const initializeNfc = (window: BrowserWindow) => {
  mainWindow = window;

  const nfc = new NFC();

  nfc.on("reader", (reader: Reader) => {
    console.log(`${reader.reader.name} device attached`);

    reader.on("card", async (card: Card) => {
      console.log(`Card detected: ${JSON.stringify(card)}`);
      console.log(`mode: ${mode}`);

      switch (mode) {
        case NfcModeEntity.Read:
          // read
          try {
            const data = await reader.read(4, 12); // starts reading in block 4, continues to 5 and 6 in order to read 12 bytes
            const payload = data.toString(); // utf8 is default encoding
            mainWindow?.webContents.send("nfc-card-detected", payload);
          } catch (err) {
            console.error(`error when reading data`, err);
          }
          break;

        case NfcModeEntity.Write:
          // write
          try {
            const data = Buffer.allocUnsafe(12);
            data.fill(0);
            const text = dataToWrite ?? "No data";
            data.write(text); // if text is longer than 12 bytes, it will be cut off
            // reader.write(blockNumber, data, blockSize = 4)
            await reader.write(4, data); // starts writing in block 4, continues to 5 and 6 in order to write 12 bytes
            console.log(`data written`);
            mainWindow?.webContents.send("nfc-card-detected", text);
          } catch (err) {
            console.error(`error when writing data`, err);
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
