import { useMemo } from "react";
import moment from "moment";
import { ColumnDef } from "@tanstack/react-table";
import { AuctionRefProps } from "../components/types";


export function useAppraisalColumns(): ColumnDef<AuctionRefProps>[] {
  return useMemo<ColumnDef<AuctionRefProps>[]>(() => [
    {
      header: "Id",
      accessorKey: "id",
      meta: { className: "hidden" },
    },
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
    },
    {
      header: "Year",
      id: 'year',
      accessorKey: 'date',
      cell: ({ row }) => moment(row.original.date).format("YYYY"),
      sortingFn: 'datetime',
      enableSorting: true,
    },
    {
      header: "Size",
      accessorKey: "size",
      enableSorting: false,
    },
    {
      header: "Price",
      accessorKey: "price",
      enableSorting: false,
    },
    {
      header: "Description",
      accessorKey: "description",
      enableSorting: false,
    },
  ], []);
}
