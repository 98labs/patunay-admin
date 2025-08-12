import supabase from "../index";
import { Appraisal } from "../../pages/DetailedArtwork/types";

export const getAppraisals = async (artworkId: string): Promise<Appraisal[]> => {
  try {
    const { data: appraisals, error } = await supabase
      .from('artwork_appraisals')
      .select(`
        id,
        condition,
        acquisition_cost,
        appraised_value,
        artist_info,
        recent_auction_references,
        notes,
        recommendation,
        appraisal_date,
        appraisal_appraisers!left (
          artwork_appraisers (
            name
          ),
          deleted_at
        )
      `)
      .eq('artwork_id', artworkId)
      .order('appraisal_date', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching appraisals:', error);
      throw error;
    }

    // Transform the data to match our Appraisal type
    const transformedAppraisals: Appraisal[] = (appraisals || []).map((appraisal: any) => ({
      id: appraisal.id,
      condition: appraisal.condition || '',
      acquisitionCost: appraisal.acquisition_cost || 0,
      appraisedValue: appraisal.appraised_value || 0,
      artistInfo: appraisal.artist_info || '',
      recentAuctionReferences: appraisal.recent_auction_references || [],
      notes: appraisal.notes || '',
      recommendation: appraisal.recommendation || '',
      appraisalDate: appraisal.appraisal_date || new Date().toISOString(),
      appraisedBy: (appraisal.appraisal_appraisers || [])
        .filter((aa: any) => !aa.deleted_at && aa.artwork_appraisers) // Filter out soft-deleted and null appraisers
        .map((aa: any) => ({
          name: aa.artwork_appraisers?.name || ''
        }))
    }));

    return transformedAppraisals;
  } catch (error) {
    console.error('Error in getAppraisals:', error);
    return [];
  }
};