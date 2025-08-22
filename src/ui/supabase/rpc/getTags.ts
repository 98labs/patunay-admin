import supabase from '../index';
import { Tag } from '../../../typings';

export const getTags = async (): Promise<Tag[]> => {
  console.log('📟 Fetching all tags from database');

  try {
    // Use the RPC function to get tags with artwork information
    const { data, error } = await supabase.rpc('get_tags_with_artworks');

    if (error) {
      console.error('📟 Error fetching tags:', error);
      throw error;
    }

    console.log('📟 Fetched tags:', data?.length || 0);

    // Data already has artwork_id and artwork_title from the RPC
    // Just return it directly as it matches our Tag type
    return data || [];
  } catch (error) {
    console.error('📟 Failed to fetch tags:', error);
    throw error;
  }
};
export type { Tag };
