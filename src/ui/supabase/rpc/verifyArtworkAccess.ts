import supabase from "../index";

export const verifyArtworkAccess = async (artworkId: string) => {
  console.log('🔍 Verifying artwork access for:', artworkId);
  
  // First check if we can read the artwork
  const { data: readData, error: readError } = await supabase
    .from('artworks')
    .select('id, tag_id, title')
    .eq('id', artworkId)
    .single();
    
  if (readError) {
    console.error('🔍 Cannot read artwork:', readError);
    return { canRead: false, canUpdate: false, error: readError };
  }
  
  console.log('🔍 Can read artwork:', readData);
  
  // Try a dummy update to check write permissions
  const testData = { updated_at: new Date().toISOString() };
  const { error: updateError } = await supabase
    .from('artworks')
    .update(testData)
    .eq('id', artworkId);
    
  if (updateError) {
    console.error('🔍 Cannot update artwork:', updateError);
    return { canRead: true, canUpdate: false, error: updateError, artwork: readData };
  }
  
  console.log('🔍 Can update artwork');
  return { canRead: true, canUpdate: true, artwork: readData };
};