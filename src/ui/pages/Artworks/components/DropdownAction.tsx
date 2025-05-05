import React from 'react';
type DropdownActionProps = {
  artwork: any;
  onAttach: (artwork: any) => void;
  onDetach: (artwork: any) => void;
  onDelete: (artwork: any) => void;
};

const DropdownAction = ({ artwork, onAttach, onDetach, onDelete }: DropdownActionProps) => {

  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6v.01M12 12v.01M12 18v.01"
          />
        </svg>
      </label>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-200 text-base-content rounded-box z-1 w-52 p-2 shadow-sm"
        >
          {artwork.tag_id ? (
            <li>
              <button onClick={() => onDetach(artwork)}>Detach NFC</button>
            </li>
          ) : (
            <li>
              <button onClick={() => onAttach(artwork)}>Attach NFC</button>
            </li>
          )}
          <li>
            <button onClick={() => onDelete(artwork)} className="text-red-600">
              Delete Artwork
            </button>
          </li>
        </ul>
    </div>
  );
};

export default DropdownAction;
