import { Button } from '@components';
import { ArtworkEntity, AssetEntity } from '@typings';
import { handleAddArtwork } from '../../hooks/handleAddArtwork';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';

interface Props {
  artwork: ArtworkEntity;
  onAddArtwork: (result: ArtworkEntity) => void;
  onPrev: () => Promise<void>;
}

interface Detail {
  label: string;
  value?: AssetEntity[] | string | number | null;
}

const ReviewArtwork = ({ artwork, onAddArtwork, onPrev }: Props) => {
  const {
    artist,
    assets,
    bibliography,
    collectors,
    description,
    height,
    id_number,
    medium,
    provenance,
    sizeUnit,
    tag_id,
    title,
    width,
    year,
  } = artwork;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useAuth();

  const details: Detail[] = [
    {
      label: 'Assets',
      value: typeof assets === 'string' ? (JSON.parse(assets) as AssetEntity[]) : '',
    },
    { label: 'Title', value: title },
    { label: 'Artist', value: artist },
    { label: 'Description', value: description },
    { label: 'Medium', value: medium },
    {
      label: 'Size',
      value: `${height}${sizeUnit} × ${width}${sizeUnit}`,
    },
    { label: 'Year', value: year },
    { label: 'ID Number', value: id_number },
    { label: 'Tag ID', value: tag_id },
    { label: 'Provenance', value: provenance },

    { label: 'Read/Write Count', value: artwork.readWriteCount },
    {
      label: 'Bibliography',
      value: bibliography ? bibliography.join(', ') : '',
    },
    { label: 'Collectors', value: collectors ? collectors.join(', ') : '' },
  ];

  const handleSubmitArtwork = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await handleAddArtwork({
        data: artwork,
      });

      onAddArtwork({ ...res, assets: assets });

      // Let the normal flow continue to Summary instead of redirecting
    } catch (error) {
      console.error('Error in submitting artwork:', error);
      setIsSubmitting(false);
    }
  };

  const handleOnPrev = async () => {
    if (isSubmitting) return;

    onPrev();
  };

  return (
    <>
      <div className="h-fill flex flex-2 flex-col justify-between gap-2">
        <div className="border-base-300 flex flex-col gap-2 rounded-2xl border">
          <h2 className="px-4 pt-4 text-xl font-semibold">Review the details before submitting</h2>
          <div className="flex flex-col gap-2 pb-4">
            {details.map(({ label, value }) => {
              if (!value) return null;

              if (Array.isArray(value) && value.length > 0) {
                const assets = value as AssetEntity[];
                return (
                  <div key={label} className="flex flex-col select-none">
                    {/* Main image viewer */}
                    <div className="relative flex justify-center">
                      <div className="absolute flex h-full w-full justify-between">
                        <div
                          onClick={() =>
                            setActiveIndex(activeIndex <= 0 ? assets.length - 1 : activeIndex - 1)
                          }
                          className="flex cursor-pointer items-center px-1 transition duration-100 ease-out hover:bg-[var(--color-neutral-black-01)]/10"
                        >
                          <Button className="pointer-events-none h-8 w-8 rounded-full border-none bg-[var(--color-neutral-white)] shadow-none">
                            <ChevronLeft className="text-[var(--color-neutral-black-02)]" />
                          </Button>
                        </div>
                        <div
                          onClick={() => setActiveIndex((activeIndex + 1) % assets.length)}
                          className="flex cursor-pointer items-center px-1 transition duration-100 ease-out hover:bg-[var(--color-neutral-black-02)]/10"
                        >
                          <Button className="pointer-events-none h-8 w-8 rounded-full border-none bg-[var(--color-neutral-white)] shadow-none">
                            <ChevronRight className="text-[var(--color-neutral-black-02)]" />
                          </Button>
                        </div>
                      </div>
                      <img
                        src={assets[activeIndex]?.url}
                        className="h-96 max-w-full object-contain"
                        alt={assets[activeIndex]?.fileName}
                      />
                    </div>
                    {/* Keep only the image indicator, not the full ImageSlider */}
                    <div className="mt-4 flex justify-center">
                      <div className="flex gap-2">
                        {assets.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              index === activeIndex
                                ? 'bg-[var(--color-primary-400)]'
                                : 'bg-base-content/30'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={label} className="flex gap-2 px-4">
                  {label !== 'Assets' && <span className="font-semibold">{label}:</span>}
                  <span>{value}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            buttonType="secondary"
            buttonLabel="Back"
            disabled={isSubmitting}
            onClick={onPrev}
          />
          <Button
            className="flex-1"
            buttonType="primary"
            buttonLabel="Submit"
            disabled={isSubmitting}
            onClick={handleSubmitArtwork}
          />
        </div>
      </div>
    </>
  );
};

export default ReviewArtwork;
