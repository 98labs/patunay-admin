/**
 * NFC Tag type definition
 * Represents an NFC tag in the system
 */
export interface Tag {
  // Core properties
  id: string;
  read_write_count: number;
  expiration_date: string | null;
  active: boolean;
  
  // User tracking
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
  user_id: string | null;
  
  // Soft delete tracking
  deleted_at?: string | null;
  deleted_by?: string | null;
  
  // Associated artwork (from join)
  artwork_id?: string | null;
  artwork_title?: string | null;
  artworks?: any;
}

/**
 * Tag creation payload
 */
export interface CreateTagPayload {
  id: string;
  active?: boolean;
}

/**
 * Tag update payload
 */
export interface UpdateTagPayload {
  active?: boolean;
  expiration_date?: string | null;
}

/**
 * Tag status for display
 */
export type TagStatus = 'active' | 'inactive' | 'expired' | 'attached';

/**
 * Helper to get tag status
 */
export const getTagStatus = (tag: Tag): TagStatus => {
  if (!tag.active) return 'inactive';
  if (tag.artwork_id) return 'attached';
  if (tag.expiration_date && new Date(tag.expiration_date) < new Date()) return 'expired';
  return 'active';
};