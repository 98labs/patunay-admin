import supabase from '../index';
import { Tag } from '../../../typings';

export const getTags = async (): Promise<Tag[]> => {
  console.log('📟 Fetching all tags from database');

  try {
    const { data, error } = await supabase
      .from('tags')
      .select(
        `
        *,
        artworks (
          id,
          title
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('📟 Error fetching tags:', error);
      throw error;
    }

    console.log('📟 Fetched tags:', data?.length || 0);

    // Map the data to include artwork information
    const tags = (data || []).map((tag) => ({
      ...tag,
      artwork_id: tag.artworks?.[0]?.id || null,
      artwork_title: tag.artworks?.[0]?.title || null,
      artworks: undefined, // Remove the nested artworks array
    }));

    return tags;
  } catch (error) {
    console.error('📟 Failed to fetch tags:', error);
    throw error;
  }
};
