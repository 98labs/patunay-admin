import { ArtworkEntity } from "@typings";
import supabase from "../index";

export const updateArtwork = async (artwork: ArtworkEntity) => {
  console.log('🔄 updateArtwork RPC - Input artwork:', artwork);
  console.log('🔄 updateArtwork RPC - Bibliography:', artwork.bibliography);
  console.log('🔄 updateArtwork RPC - Collectors:', artwork.collectors);
  
  // The current update_artwork function expects TEXT parameters for bibliography and collectors
  // but the columns are JSONB. Until the function is updated, use updateArtworkDirect instead.
  
  const params = {
    p_artwork_id: artwork.id,
    p_title: artwork.title,
    p_description: artwork.description ?? null,
    p_height: artwork.height ?? null,
    p_width: artwork.width ?? null,
    p_size_unit: artwork.size_unit ?? artwork.sizeUnit ?? null,
    p_artist: artwork.artist ?? null,
    p_year: artwork.year ?? null,
    p_medium: artwork.medium ?? null,
    p_tag_id: artwork.tag_id ?? null,
    p_expiration_date: artwork.expirationDate ?? null,
    p_read_write_count: artwork.readWriteCount,
    p_assets: artwork.assets ?? null,
    p_provenance: artwork.provenance ?? null,
    p_bibliography: JSON.stringify(artwork.bibliography ?? []),  // Needs to be stringified for current function signature
    p_collectors: JSON.stringify(artwork.collectors ?? []),      // Needs to be stringified for current function signature
    p_id_number: artwork.id_number ?? null,
  };
  
  console.log('🔄 updateArtwork RPC - Parameters:', params);
  console.log('🔄 updateArtwork RPC - p_bibliography:', params.p_bibliography);
  console.log('🔄 updateArtwork RPC - p_collectors:', params.p_collectors);
  
  const { data, error } = await supabase.rpc("update_artwork", params);

  if (error) {
    console.error('🔄 updateArtwork RPC - Error:', error);
    throw error;
  }
  
  console.log('🔄 updateArtwork RPC - Result:', data);
  return data;
};
