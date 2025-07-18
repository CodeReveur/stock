"use client";

import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
interface Stock{
  name: string;
  stock: string;
  unit: string;
  supplier: string;
  created_at: string;
};
interface Category{
  id: number;
  name: string;
  batch: string;
};

function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");

  const prefix = Number(hours) >= 12 ? 'PM' : 'AM';
  return `${month}, ${day} ${year} ${prefix}`;
};

const FifoStock = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [stock, setStock] = useState<Stock[]> ([]);
    const [category, setCategory] = useState("");
    const [filteredCategories, setFilteredCategories] = useState(categories);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] =useState("");
    const [supplier, setSupplier] =useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
      if (error) {
        const timer = setTimeout(() => {
          setError(null);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }, [error]); 

    useEffect(()=> {
      const fetchCategories = async () => {
        try {
          const response = await fetch(`/api/categories/get`);
          if (!response.ok) throw new Error("Failed to fetch categories");
          const data = await response.json();
          setCategories(data);
          setLoading(false)
        } catch (error) {
          setError("An error occurred while fetching categories: "+error);
        }
      };
      fetchCategories();
    }, []);

    const handleEndDate =  (e: any) => {
      setEndDate(e.target.value);
    }
    const handleSupplier =  (e: any) => {
      setSupplier(e.target.value);
    }
    const handleStartDate =  (e: any) => {
      setStartDate(e.target.value);
    }

    const handleCategoryChange = (e: any) => {
      const value = e.target.value;
      setCategory(value);
      setFilteredCategories(categories.filter(cat => cat.name.toLowerCase().includes(value.toLowerCase())));
      setShowDropdown(value.length > 0);
    };
  
    const selectCategory = (cat: string) => {
      setCategory(cat);
      setShowDropdown(false);
    };

  
    useEffect(()=> {
      const fetchStock = async () => {
        try {
          const response = await fetch(`/api/stock/batch_stock?batch=FIFO&startDate=${startDate}&category=${category}&endDate=${endDate}&supplier=${supplier}`);
          if (!response.ok) throw new Error("Failed to fetch stock");
          const data = await response.json();
          setStock(data);
          setLoading(false)
        } catch (error) {
          setLoading(false);
          setError("An error occurred while fetching stock: "+error);
        }
      };
      fetchStock();
  }, [category, startDate, supplier, endDate]);
  const itemsPerPage = 9;
    
  // Calculate total pages
  const totalPages = Math.ceil(stock.length / itemsPerPage);

  // Get stock for the current page
  const currentStock = stock.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle pagination navigation
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max"></div>);

  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max">
       {error && (<AlertNotification message={error} type="error" />)}
      <div className="pb-4 flex justify-between items-center">
        <h4 className="text-indigo-800 ">FIFO stock</h4>
        <div>
        <div  
         onClick={() => setShowFilter(!showFilter)}
         className="flex items-center space-x-1 border py-1 px-3 border-neutral-800 text-neutral-500 bg-black rounded-md cursor-pointer hover:text-emerald-900 hover:border-emerald-900">
          <i className="bi bi-funnel"> </i>
        </div>
        {showFilter && (
          <div
            className="absolute transition-transform duration-300 ease-in-out bg-neutral-900 text-neutral-500 p-4 rounded-md border border-neutral-800 w-[20vw]"
          >
           <h4>Filter products</h4>
             <form method="post" className="py-3 space-y-2">
              <div className="relative w-full">
                <input type="text" onChange={handleSupplier} placeholder="By supplier" className="bg-black rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" />
              </div>
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="By category" 
                  value={category}
                  onChange={handleCategoryChange}
                  onClick={() => setShowDropdown(true)}
                  className="bg-black rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
                />
                {showDropdown && (
                  <ul className="absolute bg-neutral-900 border border-neutral-800 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto">
                   {filteredCategories.length > 0 ? (
                     filteredCategories.map((cat, index) => (
                      <li key={index} className="px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => selectCategory(cat.name)}>
                       {cat.name}
                      </li>
                    ))) : (
                      <li className="px-4 py-2 text-neutral-500">No matches found</li>
                    )}
                  </ul>
                )}
              </div>
              <div className="relative w-full">
                From:
               <input type="date" placeholder="By date" onChange={handleStartDate} className="bg-black rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" />
              </div>
              <div className="relative w-full">
                To:
               <input type="date" placeholder="By date" onChange={handleEndDate} className="bg-black rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" />
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
              <th className="p-2 font-normal">Product name</th>
              <th className="p-2 font-normal">Stock</th>
              <th className="p-2 font-normal">Supplier</th>
              <th className="p-2 font-normal">Date</th>
            </tr>
          </thead>
          <tbody className=" max-h-[2vh] overflow-hidden overflow-y-visible">
            {currentStock.length > 0 && (
              currentStock.map((item, i) => (
                <tr key={i} className="text-sm text-neutral-500 border-b border-neutral-800">
                  <td className="p-2">{item.name}</td>
                  <td className="py-2 px-3 text-orange-900">{item.stock} {item.unit}</td>
                  <td className="p-2">{item.supplier}</td>
                  <td className="p-2">{formatDate(item.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
         </table> 
        </div>
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
  );
}
export default  FifoStock;