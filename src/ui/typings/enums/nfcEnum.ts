export enum NfcReadType {
  CARD_DETECTED = "CARD_DETECTED",
  CARD_REMOVED = "CARD_REMOVED",
  CARD_READ = "CARD_READ",
  CARD_WRITE = "CARD_WRITE",
}

export enum NfcModeEntity {
  Read = "read",
  Write = "write",
  Search = "search", // New mode for automatic navigation
}
