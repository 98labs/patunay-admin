import { useState } from "react";
import { ArtworkImageModalProps } from "./types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import logo from '../../../../assets/logo/patunay-256x256.png'
import { checkImage } from "./utils";

const ArtworkImageModal = ({ images, title, modalId, onClose }: ArtworkImageModalProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isValidImg, setisValidImg] = useState(false);
  // const modalId = useId();
  checkImage(images[currentImage])
    .then((isValid) => {
      setisValidImg(isValid as boolean);
      return isValid;
    });
  const hasImages = images && images.length > 0;
  const currentSrc = hasImages && isValidImg ? images[currentImage] : logo;

  const goNext = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const goPrev = () => {
    setCurrentImage((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };
  
  return (
    <>
      {/* Trigger image */}

      {/* Modal */}
      <div className="modal modal-open">
        <div className="modal-box max-w-5xl w-full">
          <h3 className="font-bold text-xl mb-2">{title}</h3>
          {/* Arrows + Main Image */}
          <div className="relative flex items-center justify-center">
          {hasImages && (
              <button
                onClick={goPrev}
                className="absolute left-0 z-10 p-2 bg-base-200 rounded-full hover:bg-base-300"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={currentSrc}
              alt={title}
              className="mx-auto max-h-[70vh] object-contain"
            />

            {hasImages && (
              <button
                onClick={goNext}
                className="absolute right-0 z-10 p-2 bg-base-200 rounded-full hover:bg-base-300"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
          {/* Thumbnails */}
          <div className="flex overflow-x-auto gap-2 mt-4">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                className={`h-20 cursor-pointer rounded border-2 ${
                  idx === currentImage ? "border-primary" : "border-base-200"
                }`}
                onClick={() => setCurrentImage(idx)}
              />
            ))}
          </div>
          <div className="modal-action">
            <label htmlFor={modalId} className="btn" onClick={onClose}>Close</label>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArtworkImageModal;