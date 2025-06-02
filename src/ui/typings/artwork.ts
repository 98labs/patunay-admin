import { AssetEntity } from "./asset";

export interface ArtworkEntity {
  id?: string;
  idnumber?: string;
  title?: string;
  description?: string;
  height?: number;
  width?: number;
  size_unit?: string;
  artist?: string;
  year?: string;
  medium?: string;
  tag_id?: string | null;
  tag_issued_at?: string;
  created_at?: string;
  updated_at?: string;
  active?: boolean;
  expirationDate?: Date;
  readWriteCount?: number;
  provenance?: string;
  bibliography?: string[];
  collectors?: string[];
  assets?: AssetEntity[] | null;
}
