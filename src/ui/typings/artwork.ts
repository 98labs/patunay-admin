import { AssetEntity } from "./asset";

export interface TagEntity {
  id: string;
  active: boolean;
  read_write_count?: number;
  expiration_date?: string;
}

export interface ArtworkEntity {
  id?: string;
  id_number?: string;
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
  active?: boolean; // Legacy field for backward compatibility
  expirationDate?: Date;
  readWriteCount?: number;
  provenance?: string;
  bibliography?: string[];
  collectors?: string[];
  assets?: AssetEntity[] | null;
  tags?: TagEntity | null; // New nested tag data from JOIN
}
