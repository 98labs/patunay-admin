import { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";

import supabase from "../../supabase";

import UploadButton from "./components/UploadButton";
import { selectNotif } from "../../components/NotificationMessage/selector";
import { ArtistType } from "./types";
import { useArtworkColumns } from "./hooks/useArtworkColumns";
import TablePagination from "./components/TablePagination";
import TableFilters from "./components/TableFilters";
import { Loading, DetachNFCModal, DeleteArtworkModal } from "@components";

const Artworks = () => {
  const [artList, setArtList] = useState<ArtistType[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const { title, status } = useSelector(selectNotif);
  const [nfcFilter, setNfcFilter] = useState<"all" | "with" | "none">("all");
  const [showDetachModal, setShowDetachModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagId, setTagId] = useState("");
  const [artworkId, setArtworkId] = useState("");

  const getDataList = async () => {
    const { data, error } = await supabase.rpc("get_artwork_list", {});

    if (error) {
      setLoading(false);
      setArtList([]);
      console.error("RPC Error:", error.message);
    }
    setLoading(false);
    setArtList(data || []);
  };

  useEffect(() => {
    getDataList();
    return () => {
      setArtList([]);
    };
  }, []);

  useEffect(() => {
    if (status === "success" && title === "ArtList") {
      getDataList();
    }
  }, [status, title]);

  const handleEdit = useCallback((art: ArtistType) => {
    console.log("art", art);
  }, []);

  const handleDetach = useCallback(async (art: ArtistType) => {
    if (art.tag_id) {
      setTagId(art.tag_id);
      setShowDetachModal(true);
    }
  }, []);

  const handleDelete = useCallback(async (art: ArtistType) => {
    if (art.id) {
      setArtworkId(art.id);
      setShowDeleteModal(true);
    }
  }, []);

  const columns = useArtworkColumns(handleEdit, handleDetach, handleDelete);

  const tableConfig = useMemo(() => ({
    data: artList,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
    getFilteredRowModel: getFilteredRowModel(),
  }), [artList, columns, globalFilter, setGlobalFilter]);

  const table = useReactTable(tableConfig);

  const handleFile = useCallback((file: any) => {
    console.log("Selected file:", file);
    // You can do something with the file here
  }, []);

  return (
    <section className="container text-base-content">
      <div className="flex flex-col @max-md:flex-row">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium">ArtWork</h2>

          <div className="flex items-center mt-4 gap-x-3">
            <UploadButton onFileSelect={handleFile} />
          </div>
        </div>

        <div className="flex flex-col mt-6">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <TableFilters
                table={table}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                nfcFilter={nfcFilter}
                setNfcFilter={setNfcFilter}
              />
              <div className="overflow-x-auto border border-base-content/5 bg-base-100 md:rounded-lg">
                {loading ? (
                  <Loading fullScreen={false} />
                ) : (
                  <table className="table table-sm table-pin-rows table-pin-cols md:table-fixed table-zebra">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className={
                                header.column.columnDef.meta?.className ?? ""
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
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
                )}
              </div>
            </div>
          </div>
        </div>

        <TablePagination table={table} />
        {showDetachModal && (
          <DetachNFCModal
            tagId={tagId}
            onClose={() => {
              setShowDetachModal(false);
              getDataList();
            }}
          />
        )}
        {showDeleteModal && (
          <DeleteArtworkModal
            artworkId={artworkId as string}
            onClose={() => {
              setShowDeleteModal(false);
            }}
          />
        )}
      </div>
    </section>
  );
};

export default Artworks;
