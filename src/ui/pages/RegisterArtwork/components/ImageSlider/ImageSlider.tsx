import { AssetEntity } from "@typings";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  assets: AssetEntity[];
  showOtherImages?: boolean;
  showImageIndicator?: boolean;
  imageDirection?: "vertical" | "horizontal";
}

const ImageSlider = ({
  assets,
  showOtherImages = true,
  showImageIndicator = true,
  imageDirection = "horizontal",
}: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeAsset, setActiveAsset] = useState<AssetEntity>(
    assets[activeIndex]
  );
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleSetActiveAsset = (asset: AssetEntity, index: number) => {
    setActiveIndex(index);
    setActiveAsset(asset);
  };

  const handlePrev = () => {
    setActiveIndex(activeIndex === 0 ? assets.length - 1 : activeIndex - 1);
  };
  const handleNext = () => {
    setActiveIndex((activeIndex + 1) % assets.length);
  };

  useEffect(() => {
    setActiveAsset(assets[activeIndex]);

    const activeRef = thumbnailRefs.current[activeIndex];
    if (activeRef) {
      activeRef.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  return (
    <>
      <div className="flex flex-col gap-4 select-none">
        <div className="relative w-full">
          <div className="flex items-center justify-center">
            <img
              src={activeAsset.url}
              className="rounded-lg h-96 object-contain"
              height={384}
            />
          </div>
          <div className="absolute w-full h-full top-0.25 flex justify-between items-center overflow-hidden">
            <div
              className="transition-all px-1 h-full flex items-center cursor-pointer hover:scale-105 hover:bg-base-content/10"
              onClick={handlePrev}
            >
              <div className=" bg-base-300/90 rounded-full w-8 h-8">
                <ChevronLeft className="text-base-content text-center mx-auto h-full" />
              </div>
            </div>
            <div
              className="transition-all px-1 h-full flex items-center cursor-pointer hover:scale-105 hover:bg-base-content/10"
              onClick={handleNext}
            >
              <div className="bg-base-300/90 rounded-full w-8 h-8">
                <ChevronRight className="text-base-content text-center mx-auto h-full" />
              </div>
            </div>
          </div>
          {showImageIndicator && (
            <div className="absolute bottom-0 flex justify-center gap-1 w-full p-2">
              {assets.map((asset, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${asset.url === activeAsset.url ? "bg-primary" : "bg-base-300"}`}
                  onClick={() => handleSetActiveAsset(asset, index)}
                />
              ))}
            </div>
          )}
        </div>
        {showOtherImages && imageDirection === "horizontal" && (
          <div className="flex gap-2 px-2 pb-2 overflow-x-auto">
            {assets.map((asset, index) => (
              <div
                key={index}
                ref={(el) => {
                  thumbnailRefs.current[index] = el;
                }}
                className="w-[calc(100%/3)] flex-shrink-0 h-40"
                onClick={() => handleSetActiveAsset(asset, index)}
              >
                <img
                  src={asset.url}
                  className={`transition-all rounded-lg object-cover w-full h-full cursor-pointer ${asset.url === activeAsset.url && "border-2 border-primary p-0.5 overflow-hidden"}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ImageSlider;
