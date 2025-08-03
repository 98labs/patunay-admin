import { ColumnFiltersState } from '@tanstack/react-table';

interface ArtworksFiltersProps {
  globalFilter: string;
  onGlobalFilterChange: (filter: string) => void;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}

export const ArtworksFilters = ({
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
}: ArtworksFiltersProps) => {
  const nfcFilter = columnFilters.find((f) => f.id === 'tag_id')?.value || 'all';

  const handleNfcFilterChange = (value: string) => {
    onColumnFiltersChange((prev) => {
      const filtered = prev.filter((f) => f.id !== 'tag_id');
      if (value !== 'all') {
        filtered.push({ id: 'tag_id', value });
      }
      return filtered;
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search artworks by title, artist, or ID..."
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      <div className="sm:w-48">
        <select
          value={nfcFilter}
          onChange={(e) => handleNfcFilterChange(e.target.value)}
          className="select select-bordered w-full"
        >
          <option value="all">All NFCs</option>
          <option value="with">Attached</option>
          <option value="none">No NFC</option>
        </select>
      </div>
    </div>
  );
};