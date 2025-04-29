import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { useSelector } from "react-redux";

import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
  } from '@tanstack/react-table';

import supabase from "../../supabase";
import UploadButton from "./components/UploadButton";
import DropdownAction from "./components/DropdownAction";
import { selectNotif } from "../../components/NotificationMessage/selector";
import { Loading } from "@components";

type ArtistType = {
    idnumber: number;
    assets: any;
    title: string;
    artist: string;
    tag_issued_at: string;
  };

const Artworks = () => {
    const [artList, setArtList] = useState<ArtistType[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const { title, status } = useSelector(selectNotif);

    const getDataList = async () => {
        const { data, error } = await supabase.rpc("get_artwork_list", {});
        
        if (error) {
            setLoading(false);
            setArtList([])
            console.error("RPC Error:", error.message);
        }
        setLoading(false);
        setArtList(data || [])
    };


    const handleEdit = (art: ArtistType) => {
        console.log('art', art)
    };

    const handleDelete = async (art: ArtistType) => {
        const confirmed = confirm(`Are you sure you want to delete ${art.title}?`);
        if (!confirmed) return;
        // Replace with actual delete logic
        console.log('art', art)
    };

    useEffect(() => {
        getDataList()
      return () => {
        setArtList([])
      }
    }, [])

    useEffect(() => {
        if (status === "success" && title === "ArtList") {
            getDataList()
        }
    }, [status, title]);

    const columns = useMemo(() => [
        {
          header: "ID",
          accessorKey: "idnumber",
        },
        {
          header: "Image",
          cell: ({ row }: any) => {
            const imageUrl = row.original.assets?.[0]?.url || "";
            return imageUrl ? <img src={imageUrl} alt="Artwork" className="h-10 w-10 object-cover" /> : <span>No image</span>
          },
        },
        {
          header: "Title",
          accessorKey: "title",
        },
        {
          header: "Artist",
          accessorKey: "artist",
        },
        {
          header: "Date Added",
          cell: ({ row }: any) => moment(row.original.tag_issued_at).format("MMM DD, YYYY"),
        },
        {
          header: "Status",
          cell: ({ row }: any) => {
            const status = row.original.tag_id ? "Attached" : "No NFC attached";
            return <span className={`badge ${status === "Attached" ? "badge-success" : "badge-error"}`}>{status}</span>;
          },
        },
        {
          header: "Actions",
          cell: ({ row }) => (
            <DropdownAction
              artwork={row.original}
              onAttach={handleEdit}
              onDetach={handleDelete}
              onDelete={handleDelete}
            />
          ),
        },
      ], []);
    
      const table = useReactTable({
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
      });
    

  const handleFile = (file: any) => {
    console.log('Selected file:', file);
    // You can do something with the file here
  };

  return (
    <section className="container text-base-content">
        <div className="flex flex-col @max-md:flex-row">
            <div className="sm:flex sm:items-center sm:justify-between">
                <h2 className="text-lg font-medium dark:text-neutral-white">ArtWork</h2>

                <div className="flex items-center mt-4 gap-x-3">
                    <UploadButton onFileSelect={handleFile} />
                </div>
            </div>
            
            <div className="flex flex-col mt-6">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full max-w-xs my-4"
                        placeholder="Search artworks..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 md:rounded-lg">
                        {loading ? (
                            <Loading fullScreen={false} />
                        ) : (
                            <table className="table table-xs table-pin-rows table-pin-cols md:table-fixed">
                                <thead>
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id}>
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map(row => (
                                        <tr key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

            <div className="flex items-center justify-between mt-6">
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="btn btn-soft btn-primary"
                >
                ⬅ Prev
                </button>

                <div className="items-center hidden md:flex gap-x-3 join">
                    <div className="join-item btn btn-disabled">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
                    
                </div>

                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="btn btn-soft btn-primary"
                >
                Next ➡
                </button>
            </div>
        </div>
    </section>
  );
};

export default Artworks;
