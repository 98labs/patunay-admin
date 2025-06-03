import supabase from "../index";

export const getArtworkDirect = async (uuid: string) => {
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

    if (assetsError) console.warn('Error fetching assets:', assetsError);

    // Get appraisals separately (if table exists)
    let appraisals = [];
    try {
      const { data, error } = await supabase
        .from('appraisals')
        .select('*')
        .eq('artwork_id', uuid);
      
      if (error && error.code !== '42P01') { // 42P01 = table does not exist
        console.warn('Error fetching appraisals:', error);
      } else if (data) {
        appraisals = data;
      }
    } catch (e) {
      // Table might not exist, continue without appraisals
      console.warn('Appraisals table might not exist');
    }

    // Combine all data
    const result = {
      ...artwork,
      active: artwork.tags?.active ?? true,
      assets: assets || [],
      artwork_appraisals: appraisals,
      // For created_by and tag_issued_by, we'll just use the UUIDs
      // to avoid the profiles table recursion issue
    };

    return [result]; // Return as array to match expected format
  } catch (error) {
    console.error('Error in getArtworkDirect:', error);
    throw error;
  }
};