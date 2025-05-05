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
  tagId?: string | null;
  expirationDate?: Date;
  readWriteCount?: number;
  provenance?: string;
  collectors?: string[];
  assets?: AssetEntity[] | null;
}
