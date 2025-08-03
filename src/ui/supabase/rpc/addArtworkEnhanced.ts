import { ArtworkEntity } from "@typings";
import { callRpc } from "./rpcWrapper";
import { ValidationError } from "../../utils/errorHandling";

export const addArtworkEnhanced = async (artwork: ArtworkEntity) => {
  // Validate required fields
  if (!artwork.id_number) {
    throw new ValidationError("ID number is required");
  }
  
  if (!artwork.title) {
    throw new ValidationError("Title is required");
  }
  
  if (!artwork.artist) {
    throw new ValidationError("Artist is required");
  }
  
  
  if (!artwork.expirationDate) {
    throw new ValidationError("Expiration date is required");
  }

  try {
    const data = await callRpc("add_artwork", {
      p_idnumber: artwork.id_number,
      p_title: artwork.title,
      p_description: artwork.description ?? null,
      p_height: artwork.height,
      p_width: artwork.width,
      p_size_unit: artwork.sizeUnit,
      p_artist: artwork.artist,
      p_year: artwork.year,
      p_medium: artwork.medium,
      p_tag_id: artwork.tag_id,
      p_expiration_date: artwork.expirationDate.toISOString(),
      p_read_write_count: artwork.readWriteCount,
      p_assets: artwork.assets,
      p_provenance: artwork.provenance,
      p_bibliography: artwork.bibliography || [],
      p_collectors: artwork.collectors || [],
    }, {
      retries: 2, // Less retries for write operations
      timeout: 45000 // Longer timeout for complex operations
    });
    
    return data;
  } catch (error) {
    // Log the error for debugging
    console.error('Failed to add artwork:', error);
    
    // Re-throw with more context if needed
    if (error instanceof Error && error.message.includes('duplicate key')) {
      throw new ValidationError(`An artwork with ID number ${artwork.id_number} already exists`);
    }
    
    throw error;
  }
};