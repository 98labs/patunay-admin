import { Button, FormField } from '@components';
import { ArtworkEntity } from '@typings';
import { Minus, Plus } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface Props {
  artwork: ArtworkEntity;
  onDataChange: (data: { [key: string]: string[] }) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

const Collector = ({ artwork, onDataChange, onPrev, onNext }: Props) => {
  const [currentEntry, setCurrentEntry] = useState('');
  const [collectorsList, setCollectorsList] = useState<string[]>([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddEntry = () => {
    if (!currentEntry.trim()) {
      setError('Please enter a collector name');
      return;
    }

    const updatedList = [...collectorsList, currentEntry.trim()];
    setCollectorsList(updatedList);
    onDataChange({ collectors: updatedList });
    setCurrentEntry('');
    setError('');

    // Refocus the input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleRemoveEntry = (index: number) => {
    const updatedList = collectorsList.filter((_, i) => i !== index);
    setCollectorsList(updatedList);
    onDataChange({ collectors: updatedList });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentEntry(e.target.value);
    if (error) setError('');
  };

  const validateForm = () => {
    if (collectorsList.length === 0) {
      setError('At least one collector is required');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (artwork?.collectors && artwork.collectors.length > 0) {
      setCollectorsList(artwork.collectors);
    }
  }, [artwork]);

  return (
    <div className="h-fill flex flex-2 flex-col justify-between gap-2">
      <div className="border-base-300 flex flex-col gap-4 rounded-2xl border p-4">
        <h2 className="text-xl font-semibold">Enter the artwork's collectors</h2>

        {/* Input Section */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <FormField
              ref={inputRef}
              value={currentEntry}
              placeholder="Enter collector name"
              onInputChange={handleInputChange}
              error={error}
              isLabelVisible={false}
            />
          </div>
          <Button
            onClick={handleAddEntry}
            disabled={!currentEntry.trim()}
            className="mb-auto h-14 rounded-full"
          >
            <Plus />
          </Button>
        </div>

        {/* Collectors List */}
        {collectorsList.length > 0 && (
          <div className="flex flex-col gap-2">
            {collectorsList.map((entry, index) => (
              <div key={index} className="flex gap-2">
                <div className="bg-base-100 border-base-300 flex flex-1 items-center justify-between rounded-lg border p-3">
                  <span className="text-base-content">{entry}</span>
                </div>
                <Button
                  onClick={() => handleRemoveEntry(index)}
                  className="h-14 w-14 cursor-pointer rounded-full p-1 text-[var(--color-neutral-white)] transition-all duration-300 ease-in hover:opacity-95"
                  aria-label="Remove entry"
                >
                  <Minus size={20} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" buttonType="secondary" buttonLabel="Back" onClick={onPrev} />
        <Button
          className="flex-1"
          buttonType="primary"
          buttonLabel="Continue"
          onClick={async () => {
            if (validateForm()) {
              onNext();
            }
          }}
        />
      </div>
    </div>
  );
};

export default Collector;
