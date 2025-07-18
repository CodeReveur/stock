"use client";
import { useEffect, useState } from "react";
import StatusBar from "./status";
import AlertNotification from "../menu/notify";
import Edit from "../popups/editCustomer";

interface Customer {
  id: number;
  name: string;
  prefered_payment: string;
  account: number;
  phone: number;
  email: string;
  title: string;
  tin: string;
  created_at: string;
  total_sales: number;
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
  const prefix = Number(hours) > 12 ? 'PM' : 'AM';
  return `${month}, ${day} ${year} ${hours}:${minutes} ${prefix}`;
}


const CurrentCustomers = () => {
      const [customers, setCustomers] =  useState<Customer[]>([]);
      const [showFilter, setShowFilter] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [startDate, setStartDate] = useState("");
      const [endDate, setEndDate] = useState("");
      const [payment, setPayment] =useState("");
      const [title, setTitle] =useState("");
      const [search, setSearch] = useState("");
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [success, setSuccess] = useState<string | null>(null);
      const [showEdit, setShowEdit] = useState<any | null>(null);
      const [isAdmin, setIsAdmin] = useState<string | null>(null);

      useEffect(() => {
        if (error || success) {
          const timer = setTimeout(() => {
            setError(null);
            setSuccess(null);
          }, 10000);
          return () => clearTimeout(timer);
        }
      }, [error, success]);

      const closeEdit = () => {
        setShowEdit(null);
      }
      const handleSearch =  (e: any) => {
        setSearch(e.target.value);
      }
      const handlePayment =  (e: any) => {
        setPayment(e.target.value);
      }
      const handleTitle =  (e: any) => {
        setTitle(e.target.value);
      }
      const handleStartDate =  (e: any) => {
        setStartDate(e.target.value);
      }
      const handleEndDate =  (e: any) => {
        setEndDate(e.target.value);
      }

    useEffect(()=> {
              const fetchCustomers = async () => {
                try {
                  const response = await fetch(`/api/customers/get?startDate=${startDate}&endDate=${endDate}&search=${search}&payment=${payment}&title=${title}`);
                  if (!response.ok) throw new Error("Failed to fetch customers");
                  const data = await response.json();
                  setCustomers(data);
                  setLoading(false)
                } catch (error) {
                  setError("An error occurred while fetching customers: "+error);
                }
              };
              fetchCustomers();
      }, [search, startDate, endDate, payment, title]);
     
      const itemsPerPage = 9;
    
      // Calculate total pages
      const totalPages = Math.ceil(customers.length / itemsPerPage);
    
      // Get customers for the current page
      const currentCustomers = customers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
    
      // Handle pagination navigation
      const handlePageChange = (page: number) => {
        setCurrentPage(page);
      };
  
      const handleDelete = async (customerId: number) => {
        if(confirm("⚠️ Are you sure to remove the customer! Note that it will affect sales, orders and reports")){
        const response = await fetch(`/api/customers/delete`, {
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
                  setError("Failed to delete customer: Server returned an error without JSON. "+err);
                  return;
              }
              
              setError("Failed to delete customer");
              return;
          }
          setSuccess("Customer removed successfully");
          // Update the customers list to remove the deleted customer
          setCustomers((prevCustomers) => 
              prevCustomers.filter(customer => customer.id !== customerId)
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
      {error && (<AlertNotification message={error} type="error" />)}
      {success && (<AlertNotification message={success} type="success" />)}
     <StatusBar />
     {/** list of products */}
     {loading ? (
        <div className="preloadder p-10 bg-neutral-900 rounded-lg"></div>
       ) : (
      <div className="p-5 bg-neutral-900 rounded-lg h-max">      
      <div className="pb-4 flex justify-between items-center">
      <h4 className="text-orange-800">Customers</h4>
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
                <input type="search" name="search" id="search" placeholder="Search" onChange={handleSearch}
                 className="border border-neutral-800 text-neutral-500 bg-black w-full py-2 px-4 rounded-md text-sm outline-0 focus:border-emerald-900"
                />
              </div>
              <div className="relative w-full">
            <select  name="payment"  id="" className="bg-neutral-950 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
             onChange={handlePayment}
             required
            >
              <option value="" selected disabled>Payment method</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            </div>
            <div className="relative w-full">
             <select  name="title"  id="" className="bg-neutral-950 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
             onChange={handleTitle}
             required
             >
              <option value="" selected disabled>Category</option>
              <option value="Individual">Individual</option>
              <option value="Institution">Instution</option>
              <option value="-">Other</option>
             </select>
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
            <th className="px-2 py-3 font-normal">Name</th>
            <th className="px-2 py-3 font-normal">Phone / email</th>
            <th className="px-2 py-3 font-normal">Account</th>
            <th className="px-2 py-3 font-normal">Payment</th>
            <th className="px-2 py-3 font-normal">Type</th>
            <th className="px-2 py-3 font-normal">Sales</th>
            <th className="px-2 py-3 font-normal">TIN</th>
            <th className="px-2 py-3 font-normal">Date</th>
            {isAdmin === "true" && (  <th className="px-2 py-3 font-normal">Actions</th>)}
           </tr>
          </thead>
          <tbody>
            {currentCustomers.map((row, i) => (
              <tr key={i} className="text-sm text-neutral-400 border-b border-neutral-800">
              <td className="p-2">{row.name}</td>
              <td className="p-2">{row.email+" / "+row.phone}</td>
              <td className="p-2">{row.account}</td>
              <td className="p-2">{row.prefered_payment}</td>
              <td className="p-2">{row.title}</td>
              <td className="p-2">{formatNumber(row.total_sales, 0)}</td>
              <td className="p-2">{row.tin}</td>
              <td className="p-2">{formatDate(row.created_at)}</td>
              {isAdmin === "true" && ( 
               <td className="p-2 space-x-1">
                <button className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => setShowEdit(row)}><i className="bi bi-pencil text-sky-800"></i></button>
                <button className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => setShowEdit(row.id)}><i className="bi bi-eye text-emerald-800"></i></button>
                <button className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => handleDelete(row.id)}><i className="bi bi-trash text-red-800"></i></button>
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
   )}
    {showEdit && <Edit onClose={closeEdit} customer={showEdit}/>}
 
    </div>
  )
}
export default CurrentCustomers;