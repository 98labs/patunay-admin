import { NfcReadType } from "./enums/nfcEnum";

export interface NfcEventEntity {
  type: NfcReadType;
  card: any;
  data?: string;
}
