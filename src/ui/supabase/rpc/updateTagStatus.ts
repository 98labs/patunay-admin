import supabase from "../index";

export const updateTagStatus = async (tagId: string, active: boolean) => {
  console.log('📟 Updating tag status:', { tagId, active });
  
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('📟 Error getting user:', userError);
    throw new Error('Failed to get current user');
  }
  
  const userId = userData?.user?.id || null;
  
  try {
    // Check if tag is attached to an artwork
    if (!active) {
      const { data: artwork } = await supabase
        .from('artworks')
        .select('id, title')
        .eq('tag_id', tagId)
        .single();
      
      if (artwork) {
        throw new Error(`Cannot deactivate tag that is attached to artwork: ${artwork.title}`);
      }
    }
    
    const { data, error } = await supabase
      .from('tags')
      .update({
        active,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', tagId)
      .select()
      .single();
    
    if (error) {
      console.error('📟 Error updating tag status:', error);
      throw error;
    }
    
    console.log('📟 Successfully updated tag status:', data);
    return data;
  } catch (error) {
    console.error('📟 Failed to update tag status:', error);
    throw error;
  }
};