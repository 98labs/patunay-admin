import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { AuctionProps } from "./types";
import { useAppraisalColumns } from "../hooks/useAppraisalColumns";

export default function AuctionRef({auctions}: AuctionProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([])
  
    const columns = useAppraisalColumns();
  
    const table = useReactTable({
      data: auctions,
      columns,
      state: {
        globalFilter,
        sorting,
      },
      onGlobalFilterChange: setGlobalFilter,
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      initialState: {
        pagination: { pageSize: 10 },
      },
      getFilteredRowModel: getFilteredRowModel(),
    });
  
  return (
    <div className="flex flex-col mt-6">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-x-auto border border-base-content/5 bg-base-100 md:rounded-lg">
                  <table className="table table-sm table-pin-rows table-pin-cols md:table-fixed table-zebra">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              onClick={header.column.getToggleSortingHandler()}
                              className={`${header.column.getCanSort() ? 'cursor-pointer' : ''} ${header.column.columnDef.meta?.className ?? ""}`}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className={
                                cell.column.columnDef.meta?.className ?? ""
                              }
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        </div>
  );
}
