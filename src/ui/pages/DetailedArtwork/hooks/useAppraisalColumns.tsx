import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Appraisal } from "../types";


export function useAppraisalColumns(): ColumnDef<Appraisal>[] {
  return useMemo<ColumnDef<Appraisal>[]>(() => [
    {
    accessorKey: "condition",
    header: "Condition",
  },
  {
    accessorKey: "acquisitionCost",
    header: "Acquisition Cost",
    cell: info => {
      const value = info.getValue();
      return typeof value === 'number' ? `$${value.toLocaleString()}` : "—";
    }
  },
  {
    accessorKey: "appraisedValue",
    header: "Appraised Value",
    cell: info => {
      const value = info.getValue();
      return typeof value === 'number' ? `$${value.toLocaleString()}` : "—";
    }
  },
  {
    accessorKey: "artistInfo",
    header: "Artist Info",
  },
  {
    accessorKey: "recentAuctionReferences",
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
    accessorKey: "appraisalDate",
    header: "Appraisal Date",
    cell: ({ getValue }) => {
      const dateValue = getValue<string>();
      if (!dateValue) return "—";
      const date = new Date(dateValue);
      return date.toLocaleDateString();
    },
    sortingFn: "datetime",
    sortDescFirst: true,
  },
  {
    accessorKey: "appraisedBy",
    header: "Appraised By",
    cell: ({ getValue }) => {
      const appraisers = getValue<{ name: string }[]>() ?? []
      return appraisers.map(a => a.name).join(", ") || "—"
    }
  }
  ], []);
}
