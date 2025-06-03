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
    year: new Date().getFullYear().toString(),
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
    id_number: result.id_number,
    sizeUnit: result.size_unit,
    tag_id: result.tag_id,
    bibliography: result.bibliography ? JSON.parse(result.collectors) : [],
    collectors: result.collectors ? JSON.parse(result.collectors) : [],
    assets: result.assets
      ? result.assets.map((asset: any) => ({
          fileName: asset.filename ?? "",
          url: asset.url,
          sortOrder: asset.sort_order,
        }))
      : null,
  };

  return parsedRes;
};
