import supabase from "../index";

export const getArtwork = async (uuid: string) => {
  const { data, error } = await supabase.rpc("get_artwork", {
    p_artwork_id: uuid,
  });

  if (error) throw error;
  return data;
};
