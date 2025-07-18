"use client";
import { useEffect, useState } from "react";

interface Selling {
  id: number,
  name: string,
  category: string,
  batch: string,
  unit: string,
  quantity_sold: number,
  live_stock: number,
  sold_percentage: any,
}

const TopSelling = () => {
  const [sellings, setSellings] =  useState<Selling[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSearch =  (e: any) => {
    setSearch(e.target.value);
  }

  useEffect(()=> {
    const fetchSellings = async () => {
      try {
        const response = await fetch(`/api/sales/top_selling?search=${search}`);
        if (!response.ok) throw new Error("Failed to fetch Sellings");
        const data = await response.json();
        setSellings(data);
        setLoading(false)
      } catch (error) {
        setError("An error occurred while fetching Sellings: "+error);
      }
    };
    fetchSellings();
  }, [search]);

  const itemsPerPage = 9;
    
// Calculate total pages
 const totalPages = Math.ceil(sellings.length / itemsPerPage);

// Get Sellings for the current page
 const currentSellings = sellings.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

// Handle pagination navigation
const handlePageChange = (page: number) => {
  setCurrentPage(page);
};

  if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max my-2"></div>);
  
  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max">
      <div className="pb-4 flex justify-between items-center">
        <h4 className="text-emerald-800 ">Top selling products</h4>
        <div>
        <div  
         onClick={() => setShowFilter(!showFilter)}
         className="flex items-center space-x-1 border py-1 px-3 border-neutral-800 text-neutral-500 bg-black rounded-md cursor-pointer hover:text-emerald-900 hover:border-emerald-900">
          <i className="bi bi-funnel"> </i>
        </div>
        {showFilter && (
          <div
            className="absolute right-4 transition-transform duration-300 ease-in-out bg-neutral-900 text-neutral-500 p-4 rounded-md border border-neutral-800 w-[20vw]"
          >
           <h4>Filter stock</h4>
           <form method="post" className="py-3 space-y-2">
              <div className="relative w-full">
                <input type="search" name="search" id="search" placeholder="Search name, category, batch..." onChange={handleSearch}
                 className="border border-neutral-800 text-neutral-500 bg-black w-full py-2 px-4 rounded-md text-sm outline-0 focus:border-emerald-900"
                />
              </div>
              <div className="relative w-full">
            </div>
            </form>
          </div>
        )}
        </div>

      </div>
      <div className="pb-4 max-h-[40vh] overflow-hidden overflow-y-visible">
         <table className="w-full border-collapse">
          <thead className="text-sm text-neutral-600 bg-black rounded-t ">
            <tr className="px-2 text-left">
              <th className="p-2 font-normal">Product</th>
              <th className="p-2 font-normal">Sales</th>
              <th className="p-2 font-normal">Indicator</th>
              <th className="p-2 font-normal">%</th>
              <th className="p-2 font-normal">Category</th>
            </tr>
          </thead>
          <tbody className=" max-h-[2vh] overflow-hidden overflow-y-visible">
            {currentSellings.map((row, i) => (
            <tr key={i} className="text-sm text-neutral-500 border-b bg-neutral-90 border-neutral-800">
              <td className="p-2">{row.name}</td>
              <td className="p-2">{row.quantity_sold} {row.unit}</td>
              <td className="p-2">{row.batch}</td>
              <td className={`p-2 ${row.sold_percentage < 50 ? 'text-orange-700' : 'text-emerald-700'}`}>{row.sold_percentage} %</td>
              <td className="p-2">{row.category}</td>
            </tr>
          ))}
           
          </tbody>
         </table> 
{/* Pagination Controls */}
<div className="flex justify-end items-center space-x-2 mt-2">
  {/* Previous Button */}
  <button
    onClick={() => handlePageChange(currentPage - 1)}
    disabled={currentPage === 1}
    className={`px-2 py-1 text-sm font-medium border border-neutral-500 rounded-md transition-colors ${
      currentPage === 1
        ? "bg-neutral-900 text-gray-500 cursor-not-allowed"
        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-500"
    }`}
  >
    <i className="bi bi-chevron-left"></i>
  </button>

  {/* Page Numbers */}
  {Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(page => {
      return (
        page === 1 || 
        page === totalPages ||
        (page >= currentPage - 1 && page <= currentPage + 1)
      );
    })
    .reduce((acc: (number | string)[], page, i, arr) => {
      if (i > 0 && typeof arr[i - 1] === 'number' && (page as number) - (arr[i - 1] as number) > 1) {
        acc.push("...");
      }
      acc.push(page);
      return acc;
    }, [])
    .map((page, i) =>
      page === "..." ? (
        <span key={`ellipsis-${i}`} className="px-2 text-neutral-500">...</span>
      ) : (
        <button
          key={page}
          onClick={() => handlePageChange(page as number)}
          className={`px-2 py-1 text-sm font-medium border rounded-md transition-colors ${
            currentPage === page
              ? "bg-emerald-800 text-emerald-300 border-emerald-500"
              : "bg-neutral-700 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-500"
          }`}
        >
          {page}
        </button>
      )
    )}

  {/* Next Button */}
  <button
    onClick={() => handlePageChange(currentPage + 1)}
    disabled={currentPage === totalPages}
    className={`px-2 py-1 text-sm font-medium border rounded-md transition-colors ${
      currentPage === totalPages
        ? "bg-neutral-900 text-gray-500 cursor-not-allowed"
        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-500"
    }`}
  >
    <i className="bi bi-chevron-right"></i>
  </button>
</div>

   </div>
  </div>
  );
}
export default  TopSelling;