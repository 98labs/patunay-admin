import supabase from "../index";

export const registerTag = async (tagId: string) => {
  console.log('📟 Registering new tag:', tagId);
  
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('📟 Error getting user:', userError);
    throw new Error('Failed to get current user');
  }
  
  const userId = userData?.user?.id || null;
  
  try {
    // Check if tag already exists
    const { data: existingTag, error: checkError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('📟 Error checking existing tag:', checkError);
      throw checkError;
    }
    
    if (existingTag) {
      console.log('📟 Tag already exists:', existingTag);
      
      // Check if it's attached to an artwork
      const { data: artwork } = await supabase
        .from('artworks')
        .select('id, title')
        .eq('tag_id', tagId)
        .single();
      
      if (artwork) {
        throw new Error(`Tag is already attached to artwork: ${artwork.title}`);
      }
      
      // If tag exists but is inactive, reactivate it
      if (!existingTag.active) {
        const { data, error: updateError } = await supabase
          .from('tags')
          .update({
            active: true,
            read_write_count: existingTag.read_write_count + 1,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', tagId)
          .select()
          .single();
        
        if (updateError) {
          console.error('📟 Error reactivating tag:', updateError);
          throw updateError;
        }
        
        console.log('📟 Reactivated existing tag:', data);
        return data;
      }
      
      throw new Error('Tag already registered and active');
    }
    
    // Create new tag
    const { data, error } = await supabase
      .from('tags')
      .insert({
        id: tagId,
        active: true,
        created_by: userId,
        user_id: userId,
        read_write_count: 1,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('📟 Error creating tag:', error);
      
      if (error.code === '23505') {
        throw new Error('Tag already exists');
      }
      
      throw error;
    }
    
    console.log('📟 Successfully registered tag:', data);
    return data;
  } catch (error) {
    console.error('📟 Failed to register tag:', error);
    throw error;
  }
};