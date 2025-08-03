import { ArtworkEntity } from "@typings";
import { addArtwork } from "../../../supabase/rpc/addArtwork";

interface Props {
  data: ArtworkEntity;
  tagId?: string;
}

export const handleAddArtwork = async ({ data, tagId }: Props) => {
  const artwork: ArtworkEntity = {
    id_number: data.id_number,
    title: data.title,
    description: data.description,
    height: data.height,
    width: data.width,
    sizeUnit: data.sizeUnit,
    artist: data.artist,
    year: data.year || new Date().getFullYear().toString(),
    medium: data.medium,
    tag_id: tagId ?? null,
    expirationDate: new Date("2025-12-31"),
    readWriteCount: 0,
    provenance: data.provenance,
    bibliography: data.bibliography,
    collectors: data.collectors,
    assets:
      typeof data.assets === "string" ? JSON.parse(data.assets) : data.assets,
  };

  const result = (await addArtwork(artwork))[0];

  const parsedRes: ArtworkEntity = {
    ...result,
    id: result.id,
    id_number: result.idnumber,  // Database returns idnumber, not id_number
    sizeUnit: result.size_unit,
    tag_id: result.tag_id,
    bibliography: result.bibliography || [],
    collectors: result.collectors || [],
    assets: result.assets
      ? result.assets.map((asset: any) => ({
          fileName: asset.fileName ?? "",
          url: asset.url,
          sortOrder: asset.sortOrder,
        }))
      : null,
  };

  return parsedRes;
};
