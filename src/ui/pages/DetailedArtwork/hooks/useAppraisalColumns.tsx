import { useMemo } from "react";
import moment from "moment";
import { ColumnDef } from "@tanstack/react-table";
import { AuctionRefProps } from "../components/types";


export function useAppraisalColumns(): ColumnDef<AuctionRefProps>[] {
  return useMemo<ColumnDef<AuctionRefProps>[]>(() => [
    {
    accessorKey: "condition",
    header: "Condition",
  },
  {
    accessorKey: "acquisition_cost",
    header: "Acquisition Cost",
    cell: info => {
      const value = info.getValue();
      return typeof value === 'number' ? `$${value.toLocaleString()}` : "—";
    }
  },
  {
    accessorKey: "appraised_value",
    header: "Appraised Value",
    cell: info => {
      const value = info.getValue();
      return typeof value === 'number' ? `$${value.toLocaleString()}` : "—";
    }
  },
  {
    accessorKey: "artist_info",
    header: "Artist Info",
  },
  {
    accessorKey: "recent_auction_references",
    header: "Recent Auction References",
    cell: ({ getValue }) => {
      const items = getValue<string[]>() ?? []
      return items.length ? items.join(", ") : "—"
    }
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ getValue }) => {
      const text = getValue<string>()
      return text?.length > 50 ? text.slice(0, 50) + "..." : text || "—"
    }
  },
  {
    accessorKey: "recommendation",
    header: "Recommendation",
  },
  {
    accessorKey: "appraisal_date",
    header: "Appraisal Date",
    cell: ({ getValue }) => {
      const date = new Date(getValue<string>())
      return date.toLocaleDateString()
    }
  },
  {
    accessorKey: "appraisers",
    header: "Appraised By",
    cell: ({ getValue }) => {
      const appraisers = getValue<{ name: string }[]>() ?? []
      return appraisers.map(a => a.name).join(", ") || "—"
    }
  }
  ], []);
}
