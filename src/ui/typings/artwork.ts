import { AssetEntity } from "./asset";

export interface ArtworkEntity {
  id?: string;
  idNumber?: string;
  title?: string;
  description?: string;
  height?: number;
  width?: number;
  sizeUnit?: string;
  artist?: string;
  year?: string;
  medium?: string;
  tag_id?: string | null;
  tag_issued_at?: string;
  expirationDate?: Date;
  readWriteCount?: number;
  provenance?: string;
  bibliography?: string[];
  collectors?: string[];
  assets?: AssetEntity[] | null;
}
