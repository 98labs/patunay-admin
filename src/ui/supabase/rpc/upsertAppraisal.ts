import { Appraisal } from "pages/DetailedArtwork/types";
import supabase from "../index";

export async function upsertAppraisal(appraisal: Appraisal, artworkId: string) {
  // 1. Upsert into artwork_appraisals
  const { data: appraisalData, error: appraisalError } = await supabase
    .from("artwork_appraisals")
    .upsert({
      id: appraisal.id,
      artwork_id: artworkId,
      condition: appraisal.condition,
      acquisition_cost: appraisal.acquisitionCost,
      appraised_value: appraisal.appraisedValue,
      artist_info: appraisal.artistInfo,
      recent_auction_references: appraisal.recentAuctionReferences,
      notes: appraisal.notes,
      recommendation: appraisal.recommendation,
      appraisal_date: appraisal.appraisalDate,
    })
    .select("id") // Return the ID for linking
    .single();

  if (appraisalError) return { success: false };

  const appraisalId = appraisalData.id;

  // 2. Upsert appraisers
  const appraiserInsertResults = await Promise.all(
    appraisal.appraisedBy.map(async (a) => {
      const { data, error } = await supabase
        .from("artwork_appraisers")
        .upsert({ name: a.name }, { onConflict: "name" })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    })
  );

  // 3. Link appraisers to appraisal
  const appraiserRelations = appraiserInsertResults.map((appraiserId) => ({
    appraisal_id: appraisalId,
    appraiser_id: appraiserId,
  }));

  const { error: linkError } = await supabase
    .from("appraisal_appraisers")
    .upsert(appraiserRelations, { ignoreDuplicates: true });

  if (linkError) throw linkError;

  return { success: true };
}
