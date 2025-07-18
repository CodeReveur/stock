"use client";
import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
import ViewReport from "../popups/viewReport";
interface Reports{
  id: number;
  file_url: string;
  data: string;
  type: string;
  from_date: string;
  to_date: string; 
  format: string;
  createdAt: string;
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
  const prefix = Number(hours) >= 12 ? 'PM' : 'AM';
  return `${month}, ${day} ${year} ${hours}:${minutes}:${seconds} ${prefix}`;
};

const RecentReports = () => {
      const [reports, setReports] = useState<Reports[]>([]);
      const [showFilter, setShowFilter] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [endDate, setEndDate] =useState("");
      const [search, setSearch] =useState("");
      const [startDate, setStartDate] =useState("");
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [success, setSuccess] = useState<string | null>(null);
      const [showEdit, setShowEdit] = useState<any | null>(null);
      

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
      const handleStartDate =  (e: any) => {
        setStartDate(e.target.value);
      }
      const closeEdit = () => {
       setShowEdit(null);
      }
      useEffect(()=> {
        const fetchreports = async () => {
          try {
            const response = await fetch(`/api/reports/get?from_date=${startDate}&to_date=${endDate}&type=${search}`);
            if (!response.ok) throw new Error("Failed to fetch reports");
            const data = await response.json();
            setReports(data);
            setLoading(false)
          } catch (error) {
            setLoading(false);
            setError("An error occurred while fetching reports: "+error);
          }
        };
        fetchreports();
      }, [search, startDate, endDate]);

      const itemsPerPage = 9;
    
      // Calculate total pages
      const totalPages = Math.ceil(reports.length / itemsPerPage);
    
      // Get reports for the current page
      const currentReports = reports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    
      // Handle pagination navigation
      const handlePageChange = (page: number) => {
        setCurrentPage(page);
      };

      const handleDelete = async (customerId: any) => {
        if(confirm("⚠️ Are you sure to remove report data")){
        const response = await fetch(`/api/reports/delete`, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id: customerId }),
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
          // Update the customers list to remove the deleted customer
          setReports((prevReports) => 
              prevReports.filter(report=> report.id !== customerId)
          );
        }
      };

  if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max my-2"></div>);
   
  return (
    <div className="">
      {error && (<AlertNotification message={error} type="error"/>)}
      {success && (<AlertNotification message={success} type="success"/>)}
    <div className="p-5 bg-neutral-900 rounded-lg h-max">      
     <div className="pb-4 flex justify-between items-center">
      <h4 className="text-neutral-500">Recently generated</h4>
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
               <input type="text" placeholder="Report type. eg sales, purchase, financial_growth " className="bg-black rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleSearch}/>
             </div>
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
            <th className="px-2 py-3 font-normal">Title</th>
            <th className="px-2 py-3 font-normal">Format</th>
            <th className="px-2 py-3 font-normal">From</th>
            <th className="px-2 py-3 font-normal">To</th>
            <th className="px-2 py-3 font-normal">Created At</th>
            <th className="px-2 py-3 font-normal">Actions</th>
           </tr>
          </thead>
          <tbody>
            {currentReports.map((row, i) => (
              <tr key={i} className="text-sm text-neutral-400 border-b border-neutral-800">
              <td className="p-2">{row.type}</td>
              <td className="p-2">{row.format}</td>
              <td className="p-2">{formatDate(row.from_date)}</td>
              <td className="p-2">{formatDate(row.to_date)}</td>
              <td className="p-2">{formatDate(row.createdAt)}</td>
              <td className="p-2 space-x-3">
              <button title="Delete report" className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => setShowEdit(row)}><i className="bi bi-eye text-orange-800"></i></button>
                <button title="Delete report" className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => handleDelete(row.id)}><i className="bi bi-trash text-red-800"></i></button>
                <a href={row.file_url} title="Download report" className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" download={true}><i className="bi bi-download text-emerald-800"></i></a>
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
    {showEdit && (<ViewReport report={showEdit} onClose={closeEdit}/>)}
    </div>
  )
}
export default RecentReports;