import supabase from "../index";

// Cache to store artwork data and prevent multiple simultaneous fetches
const artworkCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

export const getArtworkDirectCached = async (uuid: string) => {
  // Check cache first
  const cached = artworkCache.get(uuid);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // First, get the artwork basic data
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select(`
        *,
        tags!tag_id (
          id,
          active
        )
      `)
      .eq('id', uuid)
      .single();

    if (artworkError) throw artworkError;
    if (!artwork) return null;

    // Get assets separately
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('filename, url, sort_order')
      .eq('artwork_id', uuid)
      .order('sort_order');

    if (assetsError && assetsError.code !== '42P01') {
      console.warn('Error fetching assets:', assetsError);
    }

    // Combine all data without appraisals for now
    const result = {
      ...artwork,
      active: artwork.tags?.active ?? true,
      assets: assets || [],
      artwork_appraisals: [], // Always return empty array for now
      // For created_by and tag_issued_by, we'll just use the UUIDs
      // to avoid the profiles table recursion issue
    };

    const finalResult = [result]; // Return as array to match expected format
    
    // Cache the result
    artworkCache.set(uuid, { data: finalResult, timestamp: Date.now() });
    
    return finalResult;
  } catch (error) {
    console.error('Error in getArtworkDirectCached:', error);
    throw error;
  }
};