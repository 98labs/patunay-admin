declare module "nfc-pcsc" {
  export class NFC {
    on(event: "reader", callback: (reader: Reader) => void): void;
    on(event: "error", callback: (error: Error) => void): void;
    removeListener?(event: string, callback: Function): void;
    removeAllListeners?(event?: string): void;
  }

  export class Reader {
    reader: {
      name: string;
    };

    on(event: "card", callback: (card: Card) => void): void;
    on(event: "error", callback: (error: Error) => void): void;
    on(event: "end", callback: () => void): void;

    // Add this ↓↓↓
    read(
      blockNumber: number,
      length: number,
      blockSize?: number,
      packetSize?: number
    ): Promise<Buffer>;

    write(blockNumber: number, data: Buffer, blockSize?: number): Promise<void>;
  }

  export class Card {
    uid: string;
    [key: string]: any;
  }
}
