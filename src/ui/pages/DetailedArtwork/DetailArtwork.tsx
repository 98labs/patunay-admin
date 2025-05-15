import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import moment from "moment";
import supabase from "../../supabase";
import { Loading, DetachNFCModal } from "@components";
import ArtworkImageModal from "./components/ArtworkImageModal";
import { ArtworkType } from "./types";

const DetailArtwork = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artwork, setArtwork] = useState<ArtworkType | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetachModal, setShowDetachModal] = useState(false);
    const [artworkId, setArtworkId] = useState("");
  
    useEffect(() => {
      const fetchArtwork = async () => {
        const { data, error } = await supabase.rpc("get_artwork", {p_artwork_id: id});

        if (error) {
          console.error("Error fetching artwork:", error.message);
          navigate("/dashboard/artworks");
        } else {
          setArtwork(data[0]);
        }
        setLoading(false);
      };
      fetchArtwork();
    }, [id, navigate]);

    const handleDelete = async () => {
      if (artwork?.tag_id) {
         setArtworkId(artwork?.tag_id);
        setShowDetachModal(true);
      }
      };
  
    if (loading) return <Loading fullScreen={false} />;
    if (!artwork) return <div className="p-6">Artwork not found.</div>;

    return (
      <div className="text-base-content">
        <div className="breadcrumbs text-sm">
          <ul>
            <li><Link to="/dashboard/artworks">Artworks</Link></li>
            <li>{artwork.title}</li>
          </ul>
        </div>
        <section className="hero bg-base-200 text-base-content">
          <div className="hero-content flex-col lg:flex-row">
            <div className="lg:w-1/3">
              <ArtworkImageModal
                images={artwork.assets?.map(asset => asset.url) || []}
                title={artwork.title}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">
                  {artwork.title}
                </h2>
                <div className="flex gap-2">
                  <button className={`btn btn-outline btn-sm ${artwork.tag_id ? "" : "hidden"}`} onClick={handleDelete}>Detach NFC Tag</button>
                  <button className="btn btn-error btn-sm text-white">Delete artwork</button>
                </div>
              </div>
              <p className="text-gray-500">{artwork.artist} ({moment(artwork.tag_issued_at).format("YYYY")})</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div><strong>Size:</strong> {artwork.height}cm by {artwork.width}cm</div>
                <div><strong>Medium:</strong> {artwork.medium}</div>
                <div className="col-span-2">
                  <strong>Description:</strong>
                  <p>{artwork.description}</p>
                </div>
                <div><strong>Identifier:</strong> {artwork.idnumber}</div>
                <div><strong>Provenance:</strong> {artwork.provenance}</div>
                <div><strong>Bibliography:</strong>
                  {typeof artwork.bibliography === 'string' ? <p>No bibliography available</p> : 
                    <ul>
                      {artwork.bibliography.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  }
                </div>
                <div><strong>Collector:</strong>
                  {typeof artwork.collectors === 'string' ? <p>No collectors available</p> :
                    <ul>
                      {artwork.collectors.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  }
                </div>
                <div><strong>Artwork ID:</strong> {artwork.tag_id}</div>
                <div><strong>NFC Tag ID:</strong> 00:00:00:00:00:00</div> 
              </div>
            </div>
          </div>
            {showDetachModal && (
              <DetachNFCModal
                tagId={artworkId}
                onClose={() => {
                  setShowDetachModal(false);
                }}
              />
            )}
        </section>
      </div>
    );
  };

export default DetailArtwork;
