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
import moment from "moment";
import { AuctionProps, } from "./types";
import { Appraisal } from "../types";
import { useAppraisalColumns } from "../hooks/useAppraisalColumns";

export default function AuctionRef({auctions, addRow }: AuctionProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([])
  const [newRow, setNewRow] = useState<Appraisal | null>(null);

  // const handleAddRow = () => {
  //   setNewRow({
  //     id: auctions.length + 1,
  //     title: "",
  //     size: "",
  //     price: "",
  //     description: "",
  //     date: moment().format("YYYY"), // Default to today's date
  //   });
  // };

  // const handleSaveRow = () => {
  //   if (newRow) {
  //     addRow(newRow); // Pass newRow to parent to update data
  //     setNewRow(null);
  //   }
  // };

  // const handleCancelRow = () => {
  //   setNewRow(null);
  // };
  
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
              <div className="flex justify-end mb-4">
                <button className="btn btn-primary" onClick={addRow}>
                  Add Appraisal
                </button>
              </div>
              {/* {newRow && (
                <table className="table table-sm table-pin-rows table-pin-cols md:table-fixed table-zebra">
                  <tbody>
                    <tr>
                      <td><input value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} className="input input-sm input-bordered w-full" /></td>
                      <td><input value={newRow.date} onChange={e => setNewRow({ ...newRow, date: e.target.value })} className="input input-sm input-bordered w-full" /></td>
                      <td><input value={newRow.size} onChange={e => setNewRow({ ...newRow, size: e.target.value })} className="input input-sm input-bordered w-full" /></td>
                      <td><input value={newRow.price} onChange={e => setNewRow({ ...newRow, price: e.target.value })} className="input input-sm input-bordered w-full" /></td>
                      <td><input value={newRow.description} onChange={e => setNewRow({ ...newRow, description: e.target.value })} className="input input-sm input-bordered w-full" /></td>
                      <td className="flex gap-2">
                        <button className="btn btn-sm btn-success" onClick={handleSaveRow}>Save</button>
                        <button className="btn btn-sm btn-ghost" onClick={handleCancelRow}>X</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )} */}
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
