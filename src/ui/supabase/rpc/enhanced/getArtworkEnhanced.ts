import { callRpc } from "../rpcWrapper";
import { NotFoundError, ValidationError } from "../../../utils/errorHandling";

export const getArtworkEnhanced = async (artworkId: string) => {
  if (!artworkId) {
    throw new ValidationError("Artwork ID is required");
  }

  try {
    const data = await callRpc("get_artwork", {
      p_artwork_id: artworkId
    }, {
      retries: 3,
      timeout: 20000
    });
    
    if (!data) {
      throw new NotFoundError("Artwork");
    }
    
    return data;
  } catch (error) {
    // Add specific error handling
    if (error instanceof Error && error.message.includes("not found")) {
      throw new NotFoundError("Artwork");
    }
    
    throw error;
  }
};