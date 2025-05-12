import { ArtworkEntity } from "@typings";
import supabase from "../index";

export const updateArtwork = async (artwork: ArtworkEntity) => {
  const { data, error } = await supabase.rpc("update_artwork", {
    p_artwork_id: artwork.id,
    p_title: artwork.title,
    p_description: artwork.description ?? null,
    p_height: artwork.height ?? null,
    p_width: artwork.width ?? null,
    p_size_unit: artwork.sizeUnit ?? null,
    p_artist: artwork.artist ?? null,
    p_year: artwork.year ?? null,
    p_medium: artwork.medium ?? null,
    p_tag_id: artwork.tag_id ?? null,
    p_expiration_date: artwork.expirationDate ?? null,
    p_read_write_count: artwork.readWriteCount ?? null,
    p_assets: artwork.assets ?? null,
    p_provenance: artwork.provenance ?? null,
    p_bibliography: JSON.stringify(artwork.bibliography ?? []),
    p_collectors: JSON.stringify(artwork.collectors ?? []),
  });

  if (error) throw error;
  return data;
};
