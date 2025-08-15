import { Badge, Button, FormField } from '@components';
import { ColumnFiltersState } from '@tanstack/react-table';
import { Plus, Search, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../components/NotificationMessage/slice';
import { cleanAndValidateData, uploadInBatches } from './utils';

interface ArtworksFiltersProps {
  globalFilter: string;
  onGlobalFilterChange: (filter: string) => void;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  onDataRefresh?: () => void;
}

export const ArtworksFilters = ({
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
  onDataRefresh,
}: ArtworksFiltersProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeNfcFilter, setActiveNfcFilter] = useState('all');

  const handleNfcFilterChange = (value: string) => {
    setActiveNfcFilter(value);

    const filtered = columnFilters.filter((f) => f.id !== 'tag_id');
    if (value !== 'all') {
      filtered.push({ id: 'tag_id', value });
    }
    onColumnFiltersChange(filtered);
  };

  const handleAddNewArtwork = () => {
    navigate('/dashboard/artworks/register');
  };

  const handleUploadCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input value
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        setIsLoading(true);
        try {
          const validatedData = cleanAndValidateData(result.data);

          // Upload in chunks
          await uploadInBatches(validatedData, 100); // batch size = 100 artworks at a time

          dispatch(
            showNotification({
              title: 'ArtList',
              message: 'Successfully Uploaded!',
              status: 'success',
            })
          );

          // Refresh the data if callback is provided
          if (onDataRefresh) {
            onDataRefresh();
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          dispatch(
            showNotification({
              message: `Upload failed: ${errorMessage}`,
              status: 'error',
            })
          );
          console.error('Upload error:', error);
        } finally {
          setIsLoading(false);
        }
      },
      error: (err) => {
        setIsLoading(false);
        dispatch(
          showNotification({
            message: 'CSV parsing error',
            status: 'error',
          })
        );
        console.error('CSV parse error:', err);
      },
    });
  };

  return (
    <div className="flex gap-4">
      <div className="flex shrink-0 justify-start gap-2">
        <Badge
          onClick={() => handleNfcFilterChange('all')}
          variant={activeNfcFilter === 'all' ? 'primary' : 'secondary'}
        >
          All
        </Badge>
        <Badge
          onClick={() => handleNfcFilterChange('with')}
          variant={activeNfcFilter === 'with' ? 'primary' : 'secondary'}
        >
          With NFC Tag
        </Badge>
        <Badge
          onClick={() => handleNfcFilterChange('none')}
          variant={activeNfcFilter === 'none' ? 'primary' : 'secondary'}
        >
          Without NFC Tag
        </Badge>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <div className="flex-1">
          <FormField
            isLabelVisible={false}
            className="py-2"
            prefixIcon={Search}
            placeholder="Search artworks by title, artist, or ID..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
          />
        </div>
        <Button
          className="rounded-lg border-none bg-[var(--color-neutral-gray-01)] text-[var(--color-neutral-black-02)] shadow-none hover:bg-[var(--color-neutral-gray-02)]/50"
          onClick={handleUploadCSVClick}
          disabled={isLoading}
        >
          <div className="flex items-center gap-1">
            <Upload size={20} />
            <span className=""> {isLoading ? 'Uploading...' : 'Upload CSV'}</span>
          </div>
        </Button>
        <Button className="rounded-lg border-none shadow-none" onClick={handleAddNewArtwork}>
          <div className="flex items-center gap-1">
            <Plus size={20} /> <span className="">Add New Artwork</span>
          </div>
        </Button>
      </div>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
