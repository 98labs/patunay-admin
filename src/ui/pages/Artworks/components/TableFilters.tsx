import { TableFilterProp } from "./types";

const TableFilters = <T,>({
  table,
  globalFilter,
  setGlobalFilter,
  nfcFilter,
  setNfcFilter,
}: TableFilterProp<T>) => {
  const handleNfcChange = (value: 'all' | 'with' | 'none') => {
    setNfcFilter(value);
    table.getColumn('tag_id')?.setFilterValue(value);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-4">
      <div className="flex gap-2">
        <button
          className={`btn btn-sm ${nfcFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleNfcChange('all')}
        >
          All
        </button>
        <button
          className={`btn btn-sm ${nfcFilter === 'with' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleNfcChange('with')}
        >
          With NFC
        </button>
        <button
          className={`btn btn-sm ${nfcFilter === 'none' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => handleNfcChange('none')}
        >
          No NFC
        </button>
      </div>

      <input
        type="text"
        className="input input-bordered input-sm w-full max-w-xs"
        placeholder="Search artworks..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />
    </div>
  );
};

export default TableFilters;
