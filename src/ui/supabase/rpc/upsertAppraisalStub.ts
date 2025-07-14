import { Appraisal } from "pages/DetailedArtwork/types";

// Stub implementation until appraisals tables are created
export async function upsertAppraisal(appraisal: Appraisal, artworkId: string) {
  console.warn('upsertAppraisal called but appraisals tables do not exist yet');
  
  // Return success: false to indicate the operation didn't complete
  // This will show an error message to the user
  return { success: false };
}