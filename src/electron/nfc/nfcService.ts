import { NFC, Reader, Card } from "nfc-pcsc";
import { BrowserWindow } from "electron";

let mainWindow: BrowserWindow | null = null;

export const initializeNfc = (window: BrowserWindow) => {
  mainWindow = window;

  const nfc = new NFC();

  nfc.on("reader", (reader: Reader) => {
    console.log(`${reader.reader.name} device attached`);

    reader.on("card", async (card: Card) => {
      console.log(`Card detected: ${JSON.stringify(card)}`);
      try {
        // reader.read(blockNumber, length, blockSize = 4, packetSize = 16)
        const data = await reader.read(4, 12); // starts reading in block 4, continues to 5 and 6 in order to read 12 bytes
        console.log(`data read`, data);
        const payload = data.toString(); // utf8 is default encoding
        console.log(`data converted`, payload);
        mainWindow?.webContents.send("nfc-card-detected", card);
      } catch (err) {
        console.error(`error when reading data`, err);
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
