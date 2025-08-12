import { ArtworkEntity } from "@typings";
import supabase from "../index";

export const addArtwork = async (artwork: ArtworkEntity) => {
  const { data, error } = await supabase.rpc("add_artwork", {
    p_id_number: artwork.id_number,
    p_title: artwork.title,
    p_description: artwork.description ?? null,
    p_height: artwork.height,
    p_width: artwork.width,
    p_size_unit: artwork.sizeUnit,
    p_artist: artwork.artist,
    p_year: artwork.year,
    p_medium: artwork.medium,
    p_tag_id: artwork.tag_id,
    p_assets: artwork.assets,
    p_provenance: artwork.provenance,
    p_bibliography: artwork.bibliography || [],
    p_collectors: artwork.collectors || [],
  });

  if (error) throw error;
  return data;
};
