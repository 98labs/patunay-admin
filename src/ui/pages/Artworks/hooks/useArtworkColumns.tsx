import { useMemo } from "react";
import { format } from "date-fns";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import DropdownAction from "../components/DropdownAction";
import { ArtworkEntity } from "../../../typings";
import logo from '../../../../assets/logo/patunay-256x256.png';

export function useArtworkColumns(
  onEdit: (artwork: ArtworkEntity) => void,
  onDetach: (artwork: ArtworkEntity) => void,
  onDelete: (artwork: ArtworkEntity) => void
): ColumnDef<ArtworkEntity>[] {
  return useMemo<ColumnDef<ArtworkEntity>[]>(() => [
    {
      header: "ID",
      accessorKey: "idnumber",
      enableSorting: false,
      cell: ({ row }) => (
        <Link 
          to={`/dashboard/artworks/${row.original.id}`} 
          className="link link-primary hover:link-secondary transition-colors"
        >
          #{row.original.idnumber || 'N/A'}
        </Link>
      ),
      meta: { className: "hidden lg:table-cell w-20" },
    },
    {
      header: "Image",
      accessorKey: "assets",
      enableSorting: false,
      cell: ({ row }) => {
        const firstAsset = row.original.assets?.[0];
        const imageUrl = firstAsset?.url;
        const hasValidImage = imageUrl && imageUrl.trim() !== '';
        
        return (
          <Link 
            to={`/dashboard/artworks/${row.original.id}`} 
            className="block"
          >
            <div className="avatar">
              <div className="w-12 h-12 rounded border border-base-300">
                {hasValidImage ? (
                  <img 
                    src={imageUrl} 
                    alt={row.original.title || "Artwork"} 
                    className="object-cover w-full h-full rounded"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full bg-base-200 flex items-center justify-center rounded ${hasValidImage ? 'hidden' : 'flex'}`}
                  style={{ display: hasValidImage ? 'none' : 'flex' }}
                >
                  <img 
                    src={logo} 
                    alt="Default artwork" 
                    className="w-8 h-8 opacity-60"
                  />
                </div>
              </div>
            </div>
          </Link>
        );
      },
      meta: { className: "hidden sm:table-cell w-16" },
    },
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Link 
            to={`/dashboard/artworks/${row.original.id}`} 
            className="link link-primary hover:link-secondary font-medium transition-colors"
          >
            {row.original.title || 'Untitled'}
          </Link>
          {/* Show artist on mobile */}
          <span className="text-xs text-base-content/60 sm:hidden">
            by {row.original.artist || 'Unknown Artist'}
          </span>
        </div>
      ),
      meta: { className: "min-w-40" },
    },
    {
      header: "Artist",
      accessorKey: "artist",
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue() as string || 'Unknown Artist'}</span>
      ),
      meta: { className: "hidden sm:table-cell min-w-32" },
    },
    {
      header: "Date Added",
      accessorKey: "created_at",
      enableSorting: true,
      cell: ({ getValue }) => {
        const date = getValue() as string;
        if (!date) return <span className="text-base-content/60">—</span>;
        
        try {
          return (
            <span className="text-sm text-base-content/70">
              {format(new Date(date), "MMM dd, yyyy")}
            </span>
          );
        } catch {
          return <span className="text-base-content/60">Invalid date</span>;
        }
      },
      meta: { className: "hidden lg:table-cell w-32" },
    },
    {
      header: "NFC Status",
      accessorKey: "tag_id",
      enableSorting: false,
      cell: ({ row }) => {
        const tagId = row.original.tag_id;
        
        let status: string;
        let badgeClass: string;
        
        if (tagId && tagId.trim() !== '') {
          status = "Attached";
          badgeClass = "badge-success";
        } else {
          status = "No NFC";
          badgeClass = "badge-error";
        }
        
        return (
          <span className={`badge ${badgeClass} badge-sm whitespace-nowrap`}>
            {status}
          </span>
        );
      },
      filterFn: (row: Row<ArtworkEntity>, columnId, filterValue: string) => {
        const tagId = row.original.tag_id;
        const hasNfc = tagId && tagId.trim() !== '';
        
        switch (filterValue) {
          case "with":
            return hasNfc;
          case "none":
            return !hasNfc;
          default:
            return true;
        }
      },
      meta: { className: "w-24" },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownAction
          artwork={row.original}
          onAttach={onEdit}
          onDetach={onDetach}
          onDelete={onDelete}
        />
      ),
      meta: { className: "w-16" },
    },
  ], [onEdit, onDetach, onDelete]);
}