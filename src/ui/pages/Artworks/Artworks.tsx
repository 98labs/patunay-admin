import { useEffect, useState } from "react";
import supabase from "../../supabase";
import UploadButton from "./components/UploadButton";
import moment from "moment";
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
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
        getDataList()
      return () => {
        setArtList([])
      }
    }, [])
    
    // Pagination calculations
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentArts = artList.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(artList.length / itemsPerPage);

    const nextPage = () => {
        setCurrentPage((p) => Math.min(totalPages, p + 1))
    };

    const prevPage = () => {
        setCurrentPage((p) => Math.max(1, p - 1))
    };
    
  const handleFile = (file: any) => {
    console.log('Selected file:', file.name);
    // You can do something with the file here
  };

  return (
    <section className="container text-base-content">
        <div className="flex flex-col @max-md:flex-row">
            <div className="sm:flex sm:items-center sm:justify-between">
                <h2 className="text-lg font-medium dark:text-neutral-white">ArtWork</h2>

                <div className="flex items-center mt-4 gap-x-3">
                    <button className="w-1/2 px-5 py-2 text-sm text-gray-800 transition-colors duration-200 bg-white border rounded-lg sm:w-auto dark:hover:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 dark:text-white dark:border-gray-700" disabled>
                        Download all
                    </button>

                    <UploadButton onFileSelect={handleFile} />
                </div>
            </div>

            <div className="flex flex-col mt-6">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 md:rounded-lg">
                        {loading ? (
                            <Loading fullScreen={false} />
                        ) : (
                            <table className="table table-xs table-pin-rows table-pin-cols md:table-fixed">
                                <thead>
                                    <tr>
                                        <th>
                                            No.
                                        </th>
                                        <th>
                                            Image
                                        </th>
                                        <th>
                                            Name
                                        </th>
                                        <th>
                                            Author
                                        </th>
                                        <th>
                                            Date Added
                                        </th>
                                        <th>
                                            NFC status
                                        </th>
                                        <th>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentArts && currentArts.map((art, index) => (
                                        <tr key={index}>
                                            <td className="text-sm font-normal whitespace-nowrap">
                                                {art.idnumber}
                                            </td>
                                            <td>
                                                {art.artist}
                                            </td>
                                            <td className="text-sm font-normal whitespace-nowrap">
                                                {art.title}
                                            </td>
                                            <td className="px-4 py-4 text-sm whitespace-nowrap">{art.artist}</td>
                                            <td className="px-4 py-4 text-sm whitespace-nowrap">{moment(art.tag_issued_at).format('MMM DD, YYYY')}</td>
                                            <td className="px-4 py-4 text-sm whitespace-nowrap">Status</td>
                                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                                                <button className="px-1 py-1 text-gray-500 transition-colors duration-200 rounded-lg dark:text-gray-300 hover:bg-gray-100">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                                    </svg>
                                                </button>
                                            </td>
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
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="btn btn-soft btn-primary"
                >
                ⬅ Prev
                </button>

                <div className="items-center hidden md:flex gap-x-3 join">
                    <div className="join-item btn btn-disabled">Page {currentPage} of {totalPages}</div>
                    
                </div>

                <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
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
