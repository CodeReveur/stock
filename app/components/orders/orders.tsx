"use client";
import { useEffect, useState } from "react";
import StatusBar from "./status";

interface Order {
  id: number,
  order_code: string,
  status: string,
  amount: number,
  comment: string,
  created_at: string,
  supplier: {
    name: string,
    contact: string,
    tin: string,
  },
  products: [{
    id: number,
    name: string,
    price: number,
    qty: number,
  }],
};

interface OrderProps{
  onViewOrder: (order: any) => void;
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
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const prefix = Number(hours) > 12 ? 'PM' : 'AM';
  return `${month}, ${day} ${year} ${hours}:${minutes}:${seconds} ${prefix}`;
};

const RecentOrders = ({onViewOrder}: OrderProps) => {
       const [orders, setOrders] = useState<Order[]>([]);
       const [showFilter, setShowFilter] = useState(false);
       const [currentPage, setCurrentPage] = useState(1);
       const [startDate, setStartDate] = useState("");
       const [endDate, setEndDate] =useState("");
       const [search, setSearch] =useState("");
       const [status, setStatus] =useState("");
       const [loading, setLoading] = useState(true);
       const [error, setError] = useState<string | null>(null);
       const [success, setSuccess] = useState<string | null>(null);
       const [isAdmin, setIsAdmin] = useState<string | null>(null);

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
             const response = await fetch(`/api/orders/get?startDate=${startDate}&endDate=${endDate}&search=${search}&status=${status}`);
             if (!response.ok) throw new Error("Failed to fetch sales");
             const data = await response.json();
             setOrders(data);
             setLoading(false)
           } catch (error) {
             setLoading(false);
             setError("An error occurred while fetching sales: "+error);
           }
         };
         fetchSales();
       }, [search, startDate, endDate, status]);

       const itemsPerPage = 9;
     
       // Calculate total pages
       const totalPages = Math.ceil(orders.length / itemsPerPage);
     
       // Get Sales for the current page
       const currentOrders = orders.slice(
         (currentPage - 1) * itemsPerPage,
         currentPage * itemsPerPage
       );
     
       // Handle pagination navigation
       const handlePageChange = (page: number) => {
         setCurrentPage(page);
       };
 
       const handleDelete = async (orderId: number) => {
         if(confirm("⚠️ Are you sure to remove Order! Note that it will affect stock deduction, orders and reports")){
         const response = await fetch(`/api/orders/delete`, {
           method: 'DELETE',
           headers: {
             "Content-Type": "application/json",
             Accept: "application/json",
           },
           body: JSON.stringify({ id: orderId }),
         });
       
           if (!response.ok) {
               let errorData;
               try {
                   errorData = await response.json();
                   setError(errorData.message);
               } catch (err) {
                   setError("Failed to delete: Server returned an error without JSON: "+err);
                   return;
               }
               
               setError("Failed to delete");
               return;
           }
           setSuccess("Row removed successfully");
           setOrders((prevOrders) => 
               prevOrders.filter(order => order.id !== orderId)
           );
         }
       };
       useEffect(() => {
        let previousValue = localStorage.getItem("isAdmin");
        setIsAdmin(previousValue);
      
        const interval = setInterval(() => {
          const currentValue = localStorage.getItem("isAdmin");
          if (currentValue !== previousValue) {
            previousValue = currentValue;
            setIsAdmin(currentValue);
          }
        }, 1000); // checks every 1 second
      
        return () => clearInterval(interval);
      }, []);
      
  if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max my-2"></div>);
    
  return (
    <div className="">
    <StatusBar />

    <div className="p-5 bg-neutral-900 rounded-lg h-max"> 
   
     <div className="pb-4 flex justify-between items-center">
      <h4 className="text-orange-800">Orders</h4>
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
                <input type="search" name="search" id="search" placeholder="Search supplier, product ..." onChange={handleSearch}
                 className="border border-neutral-800 text-neutral-500 bg-black w-full py-2 px-4 rounded-md text-sm outline-0 focus:border-emerald-900"
                />
              </div>
              <select 
                name="status" 
                id=""
                onChange={(e) => handleStatus(e)}
                className="bg-black rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
              >
                <option value="">Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Canceled">Canceled</option>
              </select>
             <div className="relative w-full" title="From date">
              From:<input type="date" placeholder="By date" aria-placeholder="date" className="rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleStartDate}/>
             </div>
             <div className="relative w-full" title="To date">
              To:<input type="date" placeholder="By date" aria-placeholder="date" className="rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleEndDate}/>
             </div>
            </form>
          </div>
        )}
       </div>
       </div>
        <table className="w-full border-collapse">
          <thead className="text-sm text-neutral-600 border-y border-neutral-800">
           <tr className="px-2 text-left">
            <th className="px-2 py-3 font-normal">Code</th>
            <th className="px-2 py-3 font-normal">Supplier</th>
            <th className="px-2 py-3 font-normal">Contacts</th>
            <th className="px-2 py-3 font-normal">Items</th>
            <th className="px-2 py-3 font-normal">Total Costs</th>
            <th className="px-2 py-3 font-normal">Status</th>
            <th className="px-2 py-3 font-normal">Date</th>
            <th className="px-2 py-3 font-normal">Comment</th>
            {isAdmin === "true" && ( <th className="px-2 py-3 font-normal">Actions</th>)}
           </tr>
          </thead>
          <tbody>
            {currentOrders.map((row, i) => (
              <tr key={i} className="text-sm text-neutral-400 border-b border-neutral-800">
              <td className="p-2">{row.order_code}</td>
              <td className="p-2">{row.supplier.name} {row.supplier.tin !== ""? ` (${row.supplier.tin})` : ''}</td>
              <td className="p-2">{row.supplier.contact || "N/A"}</td>
              <td className="p-2">{formatNumber(row.products.length, 0)}</td>
              <td className="p-2">{formatNumber(row.amount, 0)} RWF</td>
              <td className="p-2">{row.status}</td>
              <td className="p-2">{formatDate(row.created_at)}</td>
              <td className="p-2">{row.comment || "N/A"}</td>
              {isAdmin === "true" && (
                <td className="p-2 space-x-1">
                  <button title="Edit order" className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" ><i className="bi bi-pencil text-sky-800"></i></button>
                  <button title="View order details" className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => onViewOrder(row)}><i className="bi bi-eye text-emerald-800"></i></button>
                  <button title="Remove order" className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => handleDelete(row.id)}><i className="bi bi-trash text-red-800"></i></button>
                </td>
              )}
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
export default RecentOrders;