import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import moment from "moment";
import supabase from "../../supabase";

import { ArtworkEntity } from "@typings";
import { Button, Loading } from "@components";
import { deleteArtwork } from "../../supabase/rpc/deleteArtwork";
import { safeJsonParse } from "../Artworks/components/utils";
import { updateArtwork } from "../../supabase/rpc/updateArtwork";

const DetailArtwork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<ArtworkEntity | null>(null);
  const [loading, setLoading] = useState(true);

  const detailedArtworkFormats: { title: string; value: any }[] = [
    {
      title: "Size",
      value: `${artwork?.height}cm by ${artwork?.width}cm`,
    },
    {
      title: "Medium",
      value: artwork?.medium,
    },
    {
      title: "Description",
      value: artwork?.description,
    },
    {
      title: "Identifier",
      value: artwork?.idNumber,
    },
    {
      title: "Provenance",
      value: `${artwork?.height}cm by ${artwork?.width}cm`,
    },
    {
      title: "Bibliography",
      value: artwork?.bibliography?.join(", ") ?? "No bibliography available",
    },
    {
      title: "Collector",
      value: artwork?.collectors?.join(", ") ?? "No collectors available",
    },
    {
      title: "Artwork ID",
      value: artwork?.id,
    },
    {
      title: "NFC Tag ID",
      value: artwork?.tag_id,
    },
  ];

  const handleDetachArtwork = async () => {
    try {
      const result = await updateArtwork({ ...artwork!, tag_id: null });

      if (result) console.log("✅ Success:", result);
    } catch (error) {
      console.error("Failed to detach NFC tag from artwork:", error);
    }
  };

  const handleOnDelete = async () => {
    try {
      const result = await deleteArtwork(artwork!.id as string);

      if (result) {
        navigate(`/dashboard/artworks/`);
      }
    } catch (error) {
      console.error("Failed to delete artwork:", error);
    }
  };

  useEffect(() => {
    const fetchArtwork = async () => {
      const { data, error } = await supabase.rpc("get_artwork", {
        p_artwork_id: id,
      });

      if (error) {
        console.error("Error fetching artwork:", error.message);
        navigate("/dashboard/artworks");
      } else {
        setArtwork({
          ...data[0],
          bibliography: safeJsonParse(data[0].bibliography),
          collectors: safeJsonParse(data[0].collectors),
        });
      }
      setLoading(false);
    };
    fetchArtwork();
  }, [id, navigate]);

  if (loading) return <Loading fullScreen={false} />;
  if (!artwork) return <div className="p-6">Artwork not found.</div>;
  return (
    <div className="text-base-content">
      <div className="flex justify-between items-center">
        <div className="breadcrumbs text-sm">
          <ul className="font-semibold">
            <li>
              <Link to="/dashboard/artworks" className="text-2xl">
                Artworks
              </Link>
            </li>
            <li className="text-base">{artwork.title}</li>
          </ul>
        </div>
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            {artwork.tag_id ? (
              <Button
                buttonType="secondary"
                buttonLabel="Detach NFC Tag"
                className="btn-sm"
                onClick={handleDetachArtwork}
              />
            ) : (
              <Button
                buttonType="secondary"
                buttonLabel="Attach NFC Tag"
                className="btn-sm"
                onClick={async () => {}}
              />
            )}
            <Button
              className="transition-all bg-tertiary-red-400 border-none shadow-none btn-sm text-white hover:opacity-95"
              buttonLabel="Delete artwork"
              onClick={handleOnDelete}
            />
          </div>
        </div>
      </div>

      <section className="hero text-base-content">
        <div className="hero-content flex-col lg:flex-row">
          <div className="lg:w-1/3">
            {/* <ArtworkImageModal
              images={artwork.assets?.map((asset) => asset.url) || []}
              title={artwork.title}
            /> */}
          </div>
          <div className="flex-1">
            <ul>
              <h2 className="text-2xl font-bold">{artwork.title}</h2>
              <p className="text-gray-500 text-xs">
                {artwork.artist}{" "}
                <span className="italic">
                  ({moment(artwork.tag_issued_at).format("YYYY")})
                </span>
              </p>
            </ul>
            <ul className="flex flex-col gap-4 mt-4 text-sm">
              {detailedArtworkFormats.map(
                ({ title, value }) =>
                  value && (
                    <div key={title} className="flex">
                      <strong className="flex-1/4">{title}</strong>
                      <span className="flex-3/4">{value}</span>
                    </div>
                  )
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DetailArtwork;
