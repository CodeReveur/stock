"use client";
import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
interface Sale{
  id: number,
  order_code: string,
  invoice: string,
  status: string,
  amount: number,
  created_at: string,
  customer: {
    id: number,
    name: string,
    phone: string,
    prefered_payment: string,
  },
  products: [{
    id: number,
    name: string,
    price: string,
    qty: string,
  }],
};
const formatNumber = (amount: number , decimal: number): string => {
  return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimal,
      maximumFractionDigits: decimal,
  }).format(amount);
};

function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}, ${day} ${year}`;
};
interface SaleProps{
  onViewSale: (order: any) => void;
}
const RecentSales = ({onViewSale}: SaleProps) => {
  
      const [sales, setSales] = useState<Sale[]>([]);
      const [showFilter, setShowFilter] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [startDate, setStartDate] = useState("");
      const [endDate, setEndDate] =useState("");
      const [search, setSearch] =useState("");
      const [status, setStatus] =useState("");
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [success, setSuccess] = useState<string | null>(null);
      
      useEffect(() => {
        if (error) {
          const timer = setTimeout(() => {
            setError(null);
          }, 10000);
          return () => clearTimeout(timer);
        }
      }, [error]);
      const handleEndDate =  (e: any) => {
        setEndDate(e.target.value);
      }
      const handleSearch =  (e: any) => {
        setSearch(e.target.value);
      }
      const handleStatus =  (e: any) => {
        setStatus(e.target.value);
      }
      const handleStartDate =  (e: any) => {
        setStartDate(e.target.value);
      }

      useEffect(()=> {
        const fetchSales = async () => {
          try {
            const response = await fetch(`/api/sales/get?startDate=${startDate}&endDate=${endDate}&search=${search}&status=${status}`);
            if (!response.ok) throw new Error("Failed to fetch sales");
            const data = await response.json();
            setSales(data);
            setLoading(false)
          } catch (error) {
            setLoading(false);
            setError("An error occurred while fetching sales: "+error);
          }
        };
        fetchSales();
      }, [search, startDate, endDate, status]);
      const itemsPerPage = 6;
    
      // Calculate total pages
      const totalPages = Math.ceil(sales.length / itemsPerPage);
    
      // Get Sales for the current page
      const currentSales = sales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    
      // Handle pagination navigation
      const handlePageChange = (page: number) => {
        setCurrentPage(page);
      };

      if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max my-2"></div>);
   
  return (
    <div className="">
      {error && (<AlertNotification message={error} type="error" />)}
      {success && (<AlertNotification message={success} type="success" />)}
    <div className="p-5 bg-neutral-900 rounded-lg h-max">      
     <div className="pb-4 flex justify-between items-center">
      <h4 className="text-orange-800">Recent Sales</h4>
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
                <input type="search" name="search" id="search" placeholder="Search product name" onChange={handleSearch}
                 className="border border-neutral-800 text-neutral-500 bg-black w-full py-2 px-4 rounded-md text-sm outline-0 focus:border-emerald-900"
                />
              </div>
              <select 
                name="batch" 
                id=""
                onChange={(e) => handleStatus(e)}
                className="bg-black rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
              >
                <option value="">Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
             <div className="relative w-full" title="From date">
              From:<input type="date" placeholder="By date" aria-placeholder="date" className="rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleStartDate}/>
             </div>
             <div className="relative w-full" title="To date">
              To:<input type="date" placeholder="By date" aria-placeholder="date" className="rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleEndDate}/>
             </div>
             <div className="relative w-full flex justify-end items-center">
                <button type="submit" className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
                 <i className="bi bi-funnel"></i> Filter
               </button>
              </div>
            </form>
          </div>
        )}
        </div>
       </div>
        <table className="w-full border-collapse">
          <thead className="text-sm text-neutral-600 border-y border-neutral-800">
           <tr className="px-2 text-left">
            <th className="px-2 py-3 font-normal">Customer</th>
            <th className="px-2 py-3 font-normal">Items</th>
            <th className="px-2 py-3 font-normal">Amount</th>
            <th className="px-2 py-3 font-normal">Date</th>
            <th className="px-2 py-3 font-normal">Actions</th>
           </tr>
          </thead>
          <tbody>
            {currentSales.map((row, i) => (
              <tr key={i} className="text-sm text-neutral-400 border-b border-neutral-800">
                <td className="p-2">{row.customer.name}</td>
                <td className="p-2">{formatNumber(row.products.length, 0)}</td>
                <td className="p-2">{formatNumber(row.amount, 0)} RWF</td>
                <td className="p-2">{formatDate(row.created_at)}</td>
                <td className="p-2 space-x-3">
                  <button className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => onViewSale(row)}><i className="bi bi-eye text-emerald-800"></i></button>
                </td>
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
  )
}
export default RecentSales;