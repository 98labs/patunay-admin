import supabase from "../index";

export const attachNfcTag = async (artworkId: string, tagId: string) => {
  console.log('📎 Attaching NFC tag to artwork:', { artworkId, tagId });
  console.log('📎 Tag ID type:', typeof tagId, 'Tag ID value:', tagId);
  console.log('📎 Artwork ID type:', typeof artworkId, 'Artwork ID value:', artworkId);
  
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('📎 Error getting user:', userError);
  }
  
  const userId = userData?.user?.id || null;
  
  try {
    // First, check if the tag already exists in the tags table
    const { data: existingTag, error: checkError } = await supabase
      .from('tags')
      .select('id, active, read_write_count')
      .eq('id', tagId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('📎 Error checking existing tag:', checkError);
      throw checkError;
    }
    
    // If tag doesn't exist, create it
    if (!existingTag) {
      console.log('📎 Creating new tag entry:', tagId);
      
      const { data: newTag, error: insertError } = await supabase
        .from('tags')
        .insert({
          id: tagId,
          active: true,
          created_by: userId,
          created_at: new Date().toISOString(),
          user_id: userId,
          read_write_count: 1
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('📎 Error creating tag:', insertError);
        throw insertError;
      }
      
      console.log('📎 Successfully created tag:', newTag);
    } else if (!existingTag.active) {
      // If tag exists but is inactive, reactivate it
      console.log('📎 Reactivating existing tag:', tagId);
      
      const { error: updateTagError } = await supabase
        .from('tags')
        .update({
          active: true,
          updated_at: new Date().toISOString(),
          updated_by: userId,
          read_write_count: (existingTag.read_write_count || 0) + 1
        })
        .eq('id', tagId);
      
      if (updateTagError) {
        console.error('📎 Error reactivating tag:', updateTagError);
        throw updateTagError;
      }
    } else {
      // Tag exists and is active, just increment the count
      console.log('📎 Incrementing read/write count for existing tag:', tagId);
      
      const { error: incrementError } = await supabase
        .from('tags')
        .update({
          read_write_count: (existingTag.read_write_count || 0) + 1,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', tagId);
      
      if (incrementError) {
        console.error('📎 Error incrementing tag count:', incrementError);
        // Don't throw here, continue with artwork update
      }
    }
    
    // Now update the artwork with the tag ID
    const updateData = {
      tag_id: tagId,
      tag_issued_at: new Date().toISOString(),
      tag_issued_by: userId,
      updated_at: new Date().toISOString()
    };
    
    console.log('📎 Update data:', updateData);
    
    const { data, error } = await supabase
      .from('artworks')
      .update(updateData)
      .eq('id', artworkId)
      .select();

    if (error) {
      console.error('📎 Error attaching NFC tag:', error);
      console.error('📎 Error details:', JSON.stringify(error, null, 2));
      
      // Check for specific error types
      if (error.code === '23505') {
        throw new Error('This NFC tag is already attached to another artwork');
      } else if (error.code === '42501') {
        throw new Error('You do not have permission to attach NFC tags');
      } else if (error.code === 'PGRST204') {
        throw new Error('Artwork not found or update failed');
      } else if (error.code === '23503' && error.message?.includes('tag_id')) {
        throw new Error('Failed to link tag to artwork. The tag may not have been created properly.');
      }
      
      throw error;
    }
    
    console.log('📎 Successfully attached NFC tag:', data);
    console.log('📎 Updated artwork data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('📎 Transaction failed:', error);
    throw error;
  }
};