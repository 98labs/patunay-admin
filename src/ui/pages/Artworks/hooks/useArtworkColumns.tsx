import { useMemo } from "react";
import moment from "moment";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import DropdownAction from "../components/DropdownAction";
import { ArtistType } from "../types";
import logo from '../../../../assets/logo/patunay-256x256.png'


export function useArtworkColumns(
  onEdit: (art: ArtistType) => void,
  onDelete: (art: ArtistType) => void
): ColumnDef<ArtistType>[] {
  return useMemo<ColumnDef<ArtistType>[]>(() => [
    {
      header: "ID",
      accessorKey: "idnumber",
      cell: ({ row }) => (
        <Link to={`/dashboard/artworks/${row.original.id}`} className="link">
          {row.original.idnumber}
        </Link>
      ),
      meta: { className: "hidden lg:table-cell" },
    },
    {
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.original.assets?.[0]?.url || logo;
        return imageUrl ? (
          <Link to={`/dashboard/artworks/${row.original.id}`} className="link">
            <img src={imageUrl} alt="Artwork" className="h-10 w-10 object-cover" />
          </Link>
        ) : (
          <Link to={`/dashboard/artworks/${row.original.id}`} className="link">
            <span>No image</span>
          </Link>
        );
      },
      meta: { className: "hidden lg:table-cell" },
    },
    {
      header: "Title",
      cell: ({ row }) => (
        <Link to={`/dashboard/artworks/${row.original.id}`} className="link">
          {row.original.title}
        </Link>
      ),
    },
    {
      header: "Artist",
      accessorKey: "artist",
    },
    {
      header: "Date Added",
      cell: ({ row }) => moment(row.original.tag_issued_at).format("MMM DD, YYYY"),
      meta: { className: "hidden lg:table-cell" },
    },
    {
      header: "NFC",
      accessorKey: "tag_id",
      cell: ({ row }) => {
        const status = row.original.tag_id && row.original.active ? "Attached" : row.original.tag_id && row.original.active === false ? "Detached" : "No NFC";
        return (
          <span className={`badge ${status === "Attached" ? "badge-success" : status === "Detached" ? "badge-warning" : "badge-error"} whitespace-nowrap`}>
            {status}
          </span>
        );
      },
      filterFn: (row: Row<ArtistType>, columnId, filterValue: string) => {
        const hasNfc = !!row.original.tag_id;
        const isActive = !!row.original.active;
        if (filterValue === "with") return hasNfc && isActive;
        if (filterValue === "detach") return !isActive && hasNfc;
        if (filterValue === "none") return !hasNfc;
        return true;
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <DropdownAction
          artwork={row.original}
          onAttach={onEdit}
          onDetach={onDelete}
          onDelete={onDelete}
        />
      ),
    },
  ], [onEdit, onDelete]);
}
