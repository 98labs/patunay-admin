import { Appraisal } from "pages/DetailedArtwork/types";
import supabase from "../index";

export async function upsertAppraisal(appraisal: Appraisal, artworkId: string) {
  console.log('upsertAppraisal: Starting with data:', { appraisal, artworkId });
  
  try {
    // 1. Upsert into artwork_appraisals
    // Filter out empty auction references
    const filteredAuctionReferences = appraisal.recentAuctionReferences
      .filter(ref => ref && ref.trim() !== "");
    
    const appraisalPayload = {
      id: appraisal.id,
      artwork_id: artworkId,
      condition: appraisal.condition,
      acquisition_cost: appraisal.acquisitionCost,
      appraised_value: appraisal.appraisedValue,
      artist_info: appraisal.artistInfo,
      recent_auction_references: filteredAuctionReferences.length > 0 ? filteredAuctionReferences : null,
      notes: appraisal.notes,
      recommendation: appraisal.recommendation,
      appraisal_date: appraisal.appraisalDate ? appraisal.appraisalDate.split('T')[0] : null,
    };
    
    console.log('upsertAppraisal: Upserting appraisal with payload:', appraisalPayload);
    
    const { data: appraisalData, error: appraisalError } = await supabase
      .from("artwork_appraisals")
      .upsert(appraisalPayload)
      .select("id") // Return the ID for linking
      .single();

    if (appraisalError) {
      console.error('upsertAppraisal: Error upserting appraisal:', appraisalError);
      return { success: false, error: appraisalError.message };
    }

    console.log('upsertAppraisal: Appraisal created/updated:', appraisalData);
    const appraisalId = appraisalData.id;

    // 2. Handle existing appraisers - RLS blocks DELETE, so we need to work around it
    console.log('upsertAppraisal: Checking existing appraisers for appraisal:', appraisalId);
    
    // First, get all existing appraiser relationships
    const { data: existingRelations, error: fetchError } = await supabase
      .from("appraisal_appraisers")
      .select("*")
      .eq("appraisal_id", appraisalId);
    
    if (fetchError) {
      console.error('upsertAppraisal: Error fetching existing appraisers:', fetchError);
      throw fetchError;
    }
    
    console.log('upsertAppraisal: Found existing appraiser relationships:', existingRelations?.length || 0);
    
    // Try to delete existing relationships (this will fail due to RLS, but we'll handle it)
    if (existingRelations && existingRelations.length > 0) {
      const { data: deletedData, error: deleteError } = await supabase
        .from("appraisal_appraisers")
        .delete()
        .eq("appraisal_id", appraisalId)
        .select();
      
      if (deleteError) {
        console.warn('upsertAppraisal: Could not delete existing appraisers (likely due to RLS):', deleteError);
        console.log('upsertAppraisal: Will proceed with soft delete approach');
        
        // Soft delete approach: mark existing records as deleted
        const { error: softDeleteError } = await supabase
          .from("appraisal_appraisers")
          .update({ 
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("appraisal_id", appraisalId)
          .is("deleted_at", null); // Only update non-deleted records
        
        if (softDeleteError) {
          console.error('upsertAppraisal: Error soft deleting existing appraisers:', softDeleteError);
          // Continue anyway - we'll create new relationships
        } else {
          console.log('upsertAppraisal: Soft deleted existing appraiser relationships');
        }
      } else {
        console.log('upsertAppraisal: Successfully deleted existing appraiser relationships:', deletedData?.length || 0);
      }
    }

    // 3. Process and insert new appraisers
    // Only process appraisers if there are any with valid names
    const validAppraisers = appraisal.appraisedBy.filter(a => a.name && a.name.trim());
    console.log('upsertAppraisal: Valid appraisers to process:', validAppraisers.length);
    
    if (validAppraisers.length > 0) {
      // Get all existing active relationships for this appraisal to avoid duplicates
      const { data: existingActiveRelations, error: activeCheckError } = await supabase
        .from("appraisal_appraisers")
        .select("appraiser_id, artwork_appraisers!inner(name)")
        .eq("appraisal_id", appraisalId)
        .is("deleted_at", null);
      
      if (activeCheckError) {
        console.error('upsertAppraisal: Error checking active relationships:', activeCheckError);
      }
      
      const existingAppraiserNames = new Set(
        existingActiveRelations?.map(rel => rel.artwork_appraisers?.name) || []
      );
      
      const appraiserInsertResults = await Promise.all(
        validAppraisers.map(async (a) => {
          const trimmedName = a.name.trim();
          console.log('upsertAppraisal: Processing appraiser:', trimmedName);
          
          // Skip if this appraiser is already linked to this appraisal
          if (existingAppraiserNames.has(trimmedName)) {
            console.log('upsertAppraisal: Appraiser already linked, skipping:', trimmedName);
            return null;
          }
          
          // First try to find existing appraiser
          const { data: existingAppraiser, error: findError } = await supabase
            .from("artwork_appraisers")
            .select("id")
            .eq("name", trimmedName)
            .single();
          
          if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error('upsertAppraisal: Error finding appraiser:', findError);
            throw findError;
          }
          
          if (existingAppraiser) {
            console.log('upsertAppraisal: Found existing appraiser:', existingAppraiser);
            return existingAppraiser.id;
          }
          
          // If not found, insert new appraiser
          console.log('upsertAppraisal: Inserting new appraiser:', trimmedName);
          const { data: newAppraiser, error: insertError } = await supabase
            .from("artwork_appraisers")
            .insert({ name: trimmedName })
            .select("id")
            .single();

          if (insertError) {
            console.error('upsertAppraisal: Error inserting appraiser:', insertError);
            throw insertError;
          }
          
          console.log('upsertAppraisal: Appraiser inserted:', newAppraiser);
          return newAppraiser.id;
        })
      );

      // Filter out null values (appraisers that were already linked)
      const newAppraiserIds = appraiserInsertResults.filter(id => id !== null);
      console.log('upsertAppraisal: New appraisers to link:', newAppraiserIds.length);

      // 4. Link new appraisers to appraisal
      if (newAppraiserIds.length > 0) {
        const appraiserRelations = newAppraiserIds.map((appraiserId) => ({
          appraisal_id: appraisalId,
          appraiser_id: appraiserId,
        }));

        console.log('upsertAppraisal: Linking appraisers to appraisal:', appraiserRelations);

        const { error: linkError } = await supabase
          .from("appraisal_appraisers")
          .insert(appraiserRelations);

        if (linkError) {
          console.error('upsertAppraisal: Error linking appraisers:', linkError);
          throw linkError;
        }
        
        console.log('upsertAppraisal: Successfully linked', appraiserRelations.length, 'appraisers');
      } else {
        console.log('upsertAppraisal: All appraisers were already linked');
      }
    } else {
      console.log('upsertAppraisal: No valid appraisers to link');
    }

    console.log('upsertAppraisal: Successfully completed');
    return { success: true };
  } catch (error) {
    console.error('upsertAppraisal: Error in process:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}