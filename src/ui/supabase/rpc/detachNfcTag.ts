import supabase from "../index";

export const detachNfcTag = async (artworkId: string) => {
  console.log('🏷️ Detaching NFC tag from artwork:', artworkId);
  
  const { data, error } = await supabase
    .from('artworks')
    .update({ 
      tag_id: null,
      tag_issued_at: null,
      tag_issued_by: null,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id || null
    })
    .eq('id', artworkId)
    .select();

  if (error) {
    console.error('🏷️ Error detaching NFC tag:', error);
    throw error;
  }
  
  console.log('🏷️ Successfully detached NFC tag:', data);
  return data;
};