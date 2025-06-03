import { ArtworkEntity } from "@typings";
import supabase from "../index";

export const updateArtworkDirect = async (artwork: Partial<ArtworkEntity> & { id: string }) => {
  console.log('📝 Updating artwork directly:', artwork);
  console.log('📝 All keys in artwork object:', Object.keys(artwork));
  
  const { id, ...updateData } = artwork;
  
  // Remove any undefined or function values and exclude fields that don't exist in the database
  const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
    // Exclude fields that don't exist in the database
    const excludedFields = ['active', 'expirationDate', 'readWriteCount', 'assets', 'tags', 'sizeUnit'];
    
    if (value !== undefined && typeof value !== 'function' && !excludedFields.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
  
  // Map frontend field names to database field names if needed
  // (currently no mapping needed)
  
  // Ensure arrays are properly formatted (JSONB columns accept arrays directly)
  if (cleanedData.bibliography) {
    console.log('📝 Bibliography before update:', cleanedData.bibliography);
    // Keep as array - Supabase handles JSONB conversion
  }
  if (cleanedData.collectors) {
    console.log('📝 Collectors before update:', cleanedData.collectors);
    // Keep as array - Supabase handles JSONB conversion
  }
  
  console.log('📝 Cleaned update data:', cleanedData);
  console.log('📝 Keys being updated:', Object.keys(cleanedData));
  
  const { data, error } = await supabase
    .from('artworks')
    .update({
      ...cleanedData,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id || null
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('📝 Error updating artwork:', error);
    throw error;
  }
  
  console.log('📝 Successfully updated artwork:', data);
  return data;
};