import supabase from "../index";

export const deleteArtwork = async (uuid: string) => {
  const { data, error } = await supabase.rpc("delete_artwork", {
    input_artwork_id: uuid,
  });

  if (error) throw error;
  return data;
};
