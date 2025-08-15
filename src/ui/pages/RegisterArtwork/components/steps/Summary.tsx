import { useEffect, useState } from 'react';

import { Button } from '@components';
import { ArtworkEntity, AssetEntity } from '@typings';
import { jsConfetti } from '../../../../lib/confetti/confetti';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  artwork: ArtworkEntity;
  onPrev: () => Promise<void>;
}

interface Detail {
  label: string;
  value?: AssetEntity[] | string | number | null;
}

const Summary = ({ artwork, onPrev }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);

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
    size_unit,
    tag_id,
    title,
    width,
    year,
  } = artwork;

  const details: Detail[] = [
    {
      label: 'Assets',
      value: typeof assets === 'string' ? (JSON.parse(assets) as AssetEntity[]) : assets,
    },
    { label: 'Title', value: title },
    { label: 'Artist', value: artist },
    { label: 'Description', value: description },
    { label: 'Medium', value: medium },
    {
      label: 'Size',
      value: `${height}${size_unit} × ${width}${size_unit}`,
    },
    { label: 'Year', value: year },
    { label: 'ID Number', value: id_number },
    { label: 'Tag ID', value: tag_id },
    { label: 'Provenance', value: provenance },

    { label: 'Read/Write Count', value: artwork.readWriteCount },
    {
      label: 'Bibliography',
      value: bibliography && bibliography.length > 0 ? bibliography.join(', ') : 'None',
    },
    {
      label: 'Collectors',
      value: collectors && collectors.length > 0 ? collectors.join(', ') : 'None',
    },
  ];

  useEffect(() => {
    jsConfetti.addConfetti();

    return () => {
      jsConfetti;
    };
  }, [jsConfetti]);

  return (
    <div className="h-fill flex flex-2 flex-col justify-between gap-2">
      <div className="border-base-300 flex flex-col gap-2 rounded-2xl border">
        <h2 className="px-4 pt-4 text-xl font-semibold">Successfully added an artwork!</h2>
        <div className="flex flex-col gap-2 pb-4">
          {details.map(({ label, value }) => {
            if (value === null || value === undefined) return null;

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
                  {/* Thumbnail row */}
                  <div className="border-base-300 p-4">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {assets.map((asset, index) => (
                        <div
                          key={index}
                          className={`relative flex-shrink-0 cursor-pointer overflow-clip rounded-lg transition-all duration-200 ease-in-out ${
                            index === activeIndex
                              ? 'border-2 border-[var(--color-primary-400)]'
                              : ''
                          }`}
                          onClick={() => setActiveIndex(index)}
                        >
                          <img
                            src={asset.url}
                            alt={asset.fileName}
                            className="h-20 w-20 rounded object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={label} className="flex gap-2 px-4">
                {label !== 'Assets' && <span className="font-semibold">{label}:</span>}
                <span>{String(value)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" buttonType="secondary" buttonLabel="Back" onClick={onPrev} />
        <Button
          className="flex-1"
          buttonType="primary"
          buttonLabel="Done"
          onClick={async () => {
            window.location.href = '/dashboard/artworks/';
          }}
        />
      </div>
    </div>
  );
};

export default Summary;
