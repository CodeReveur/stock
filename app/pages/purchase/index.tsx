"use client";
import AlertNotification from "@/app/components/menu/notify";
import ViewOrder from "@/app/components/popups/viewPurchase";
import { useEffect, useState } from "react";

interface ListProps{
  onAddClick: () => void;
}
interface Purchase{
  id: number;
  purchase_code: string;
  label: string;
  product: [{
    id: number;
    name: string;
    price: number;
    stock: number;
    unit: string;
  }],
  sum: number;//sum of prices on single code
  stock: number;
  supplier: string;
  status: string;
  created_at: string;

}

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
}
const Purchase = ({onAddClick}: ListProps) => {
    // Sample data for 10 rows
       // Sample data for 10 rows
       const [purchase, setPurchase] = useState<Purchase[]> ([]) 
       const [showEdit, setShowEdit] = useState<any | null>(null);
       const [currentPage, setCurrentPage] = useState(1);
       const [showFilter, setShowFilter] = useState(false);
       const [startDate, setStartDate] = useState("");
       const [endDate, setEndDate] = useState("");
       const [supplier, setSupplier] =useState("");
       const [search, setSearch] = useState("");
       const [loading, setLoading] = useState(false);
       const [error, setError] = useState<string | null>(null);
       const [success, setSuccess] = useState<string | null>(null);
       const [isAdmin, setIsAdmin] = useState<string | null>(null);

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
    const handleSupplier =  (e: any) => {
      setSupplier(e.target.value);
    }
    const handleStartDate =  (e: any) => {
      setStartDate(e.target.value);
    }
    const handleEndDate =  (e: any) => {
      setEndDate(e.target.value);
    }

     useEffect(()=> {
            const fetchPurchase = async () => {
              try {
                const response = await fetch(`/api/purchase/get?startDate=${startDate}&endDate=${endDate}&search=${search}&supplier=${supplier}`);
                if (!response.ok) throw new Error("Failed to fetch purchase");
                const data = await response.json();
                setPurchase(data);
                setLoading(false)
              } catch (error) {
                setError("An error occurred while fetching Purchase: "+error);
              }
            };
            fetchPurchase();
     }, [search, startDate, endDate, supplier]);

    const itemsPerPage = 9;
  
    // Calculate total pages
    const totalPages = Math.ceil(purchase.length / itemsPerPage);
  
    // Get Purchase for the current page
    const currentPurchase = purchase.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  
    // Handle pagination navigation
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };
  
    // Hover Popup State
    const [popup, setPopup] = useState<{
      visible: boolean;
      data: any;
      x: number;
      y: number;
    }>({ visible: false, data: null, x: 0, y: 0 });
  
   // Show popup on mouse enter
    const showPopup = (e: React.MouseEvent<HTMLTableRowElement>, row: any) => {
      setPopup({
        visible: true,
        data: row,
        x: e.clientX + 10,
        y: e.clientY + 10,
      });
    };

    // Hide popup on mouse leave
    const hidePopup = () => {
      setPopup({ visible: false, data: null, x: 0, y: 0 });
    };
    
    const handleDelete = async (purchaseId: string) => {
      if(confirm("Are you sure to delete this purchase")){
      const response = await fetch(`/api/purchase/revoke`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: purchaseId }),
      });
    
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                setError(errorData.message);
            } catch (err) {
                setError("Failed to delete purchase: Server returned an error without JSON: "+err);
                return;
            }
            
            setError("Failed to delete purchase");
            return;
        }
        setSuccess("Purchase removed successfully");
        // Update the purchases list to remove the deleted purchase
        setPurchase((prevPurchases) => 
            prevPurchases.filter(purchase => purchase.purchase_code !== purchaseId)
        );
      }
    };
  return (
    <div>
       {error && (<AlertNotification message={error} type="error" />)}
       {success && (<AlertNotification message={success} type="success" />)}
       
      <div className="bg-neutral-900 text-neutral-400 flex justify-between px-4 py-5 rounded-xl space-y-2">
        <div className="flex space-x-3 items-center">
          <i className="bi bi-basket"></i><h4>Purchase</h4>
        </div>
        <div>
         <button
           onClick={onAddClick}
           className="border border-neutral-500 p-[2px] px-2 text-sm rounded cursor-pointer hover:text-emerald-800 hover:border-emerald-800"
          ><i className="bi bi-plus"></i></button>
        </div>
       </div>
       {/** list of Purchase */}
       <div className="p-4 bg-neutral-900 rounded-lg mt-2">
       <div className="pb-4 flex justify-between items-center">
        <h4 className="text-neutral-300">Purchase list</h4>
        <div className="flex items-center space-x-2">
         <div className="border border-neutral-800 text-neutral-500 px-4 py-1.5 rounded-lg bg-black">
          <i className="bi bi-search"></i>
          <input type="search" placeholder="Search Purchase" className="w-[20vw] pl-4 outline-0 text-sm text-neutral-500" onChange={handleSearch}/>
          </div>
          <div  
           onClick={() => setShowFilter(!showFilter)}
           className="flex items-center space-x-1 border py-1 px-3 border-neutral-800 text-neutral-500 bg-black rounded-md cursor-pointer hover:text-emerald-900 hover:border-emerald-900">
            <i className="bi bi-funnel"> </i>
          </div>
          {showFilter && (
            <div
              className="absolute right-4 transition-transform duration-300 ease-in-out bg-neutral-900 text-neutral-500 p-4 rounded-md border border-neutral-800 w-[20vw]"
            >
             <h4>Filter purchase</h4>
             <form method="post" className="py-3 space-y-2">
              <div className="relative w-full" title="From date">
                 <input type="text" placeholder="Supplier" aria-placeholder="supplier" className="bg-neutral-950 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleSupplier}/>
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
            <th className="px-2 py-3 font-normal">Purchase Code</th>
            <th className="px-2 py-3 font-normal">Label</th>
            <th className="px-2 py-3 font-normal">Amount</th>
            <th className="px-2 py-3 font-normal">Items</th>
            <th className="px-2 py-3 font-normal">Supplier</th>
            <th className="px-2 py-3 font-normal">Date</th>
            <th className="px-2 py-3 font-normal">Actions</th>
           </tr>
          </thead>
          <tbody>
          {currentPurchase.map((row, i) => (
              <tr
                key={i}
                className="text-sm text-neutral-400 border-b border-neutral-800"
                onMouseEnter={(e) => showPopup(e, row)}
                onMouseLeave={hidePopup}
              >
                <td className="p-2">#{row.purchase_code}</td>
                <td className="p-2">{row.label}</td>
                <td className="p-2">{formatNumber(row.sum, 2)} RWF</td>
                <td className="p-2">{formatNumber(row.product.length, 0)}</td>
                <td className="p-2">{row.supplier}</td>
                <td className="p-2">{formatDate(row.created_at)}</td>
                <td className="p-2 space-x-3">
                {isAdmin === "true" && (  
                  <button className="px-2 py-1 text-sm border border-neutral-800 rounded-md cursor-pointer" onClick={() => handleDelete(row.purchase_code)}>
                    <i className="bi bi-archive mr-1 text-yellow-700"></i>Revoke
                  </button>
                )}
                  <button  className="px-2 py-1 text-sm border border-neutral-800 rounded-md cursor-pointer" onClick={() => setShowEdit(row)}>
                    <i className="bi bi-eye mr-1 text-emerald-700"></i>View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        
          {/* Pagination Controls */}
       <div className="flex justify-end items-center space-x-2 mt-2">
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

  {Array.from({ length: totalPages }, (_, index: any) => (
    <button
      key={index + 1}
      className={`px-2 py-1 text-sm font-medium border rounded-md transition-colors ${
        currentPage === index + 1
          ? "bg-emerald-800 text-emerald-300 border-emerald-500"
          : "bg-neutral-700 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-500"
      }`}
      onClick={() => handlePageChange(index + 1)}
    >
      {index + 1}
    </button>
  ))}

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
       {/* Hover Popup */}
       {popup.visible && popup.data && (
          <div
            className="absolute bg-neutral-900 text-neutral-500 p-4 rounded-lg shadow-3xl shadow-emerald-700 border border-neutral-800 w-72"
            style={{
              top: popup.y,
              left: popup.x,
            }}
          >
            <h3 className="text-lg font-bold text-emerald-700">
              {popup.data.label}
            </h3>
            <p className="text-sm">Code: {popup.data.purchase_code}</p>
            <p className="text-sm">Amount: {formatNumber(popup.data.sum, 0)} RWF</p>
            <p className="text-sm">Date: {formatDate(popup.data.created_at)}</p>
            <h4 className="mt-2 text-sm font-semibold">Items:</h4>
            <ul className="text-xs list-disc pl-5">
              {popup.data.product.map((item: any, index: number) => (
                <li key={index}>
                  {item.name} - {formatNumber(item.stock, 0)+" "+item.unit}  x {formatNumber(item.price, 2)} RWF
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {showEdit && (<ViewOrder orders={showEdit} onClose={closeEdit}/>)}
    </div>
  );
}
export default Purchase;