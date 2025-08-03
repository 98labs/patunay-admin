import { useMemo } from "react";
import { format } from "date-fns";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { ArtworkEntity } from "../../../typings";
import { ArtworkImageCell } from '../components/ArtworkImageCell';

export function useArtworkColumns(): ColumnDef<ArtworkEntity>[] {
  return useMemo<ColumnDef<ArtworkEntity>[]>(() => [
    {
      header: "ID Number",
      accessorKey: "id_number",
      enableSorting: false,
      cell: ({ row }) => (
        <Link 
          to={`/dashboard/artworks/${row.original.id}`} 
          className="link link-primary hover:link-secondary transition-colors"
        >
          #{row.original.id_number || 'N/A'}
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
        
        return (
          <ArtworkImageCell 
            artworkId={row.original.id}
            title={row.original.title}
            imageUrl={imageUrl}
          />
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
  ], []);
}