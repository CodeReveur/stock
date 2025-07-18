"use client";
import AlertNotification from "@/app/components/menu/notify";
import Edit from "@/app/components/popups/editProduct";
import { useEffect, useState } from "react";

interface ListProps{
  onAddClick: () => void;
}
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  supplier: string;
  created_at: string;
  unit: string;
}

interface Category{
  id: number;
  name: string;
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

const Products = ({onAddClick}: ListProps) => {
    // Sample data for 10 rows
    const [products, setProducts] = useState<Product[]> ([]) 
    const [showEdit, setShowEdit] = useState<any | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [category, setCategory] = useState("");
    const [filteredCategories, setFilteredCategories] = useState(categories);
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilter, setShowFilter] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filter, setFilter] =useState("");
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
  
    
    const closeEdit = () => {
      setShowEdit(null);
    }
    const handleSearch =  (e: any) => {
      setSearch(e.target.value);
    }
    const handleFilter =  (e: any) => {
      setFilter(e || e.target.value);
    }
    const handleStartDate =  (e: any) => {
      setStartDate(e.target.value);
    }
    const handleEndDate =  (e: any) => {
      setEndDate(e.target.value);
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
        const fetchProducts = async () => {
          try {
            const response = await fetch(`/api/products/get?startDate=${startDate}&endDate=${endDate}&search=${search}&category=${filter}`);
            if (!response.ok) throw new Error("Failed to fetch products");
            const data = await response.json();
            setProducts(data);
            setLoading(false)
          } catch (error) {
            setError("An error occurred while fetching Products: "+error);
          }
        };
        fetchProducts();
    }, [search, startDate, endDate, filter]);

    const handleDelete = async (productId: number) => {
      if(confirm("Are you sure to delete this product")){
      const response = await fetch(`/api/products/delete`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: productId }),
      });
    
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                setError(errorData.message);
            } catch (err) {
                setError("Failed to delete product: Server returned an error without JSON: "+err);
                return;
            }
            
            setError("Failed to delete product");
            return;
        }
        setSuccess("Product removed successfully");
        // Update the products list to remove the deleted product
        setProducts((prevProducts) => 
            prevProducts.filter(product => product.id !== productId)
        );
      }
    };

    const itemsPerPage = 9;
  
    // Calculate total pages
    const totalPages = Math.ceil(products.length / itemsPerPage);
  
    // Get products for the current page
    const currentProducts = products.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  
    // Handle pagination navigation
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };
  return (
    <div>
      {error && (<AlertNotification message={error} type="error" />)}
      {success && (<AlertNotification message={success} type="success" />)}
      <div className="bg-neutral-900 text-neutral-400 flex justify-between px-4 py-5 rounded-xl">
        <div className="flex space-x-3 items-center">
          <i className="bi bi-bag"></i><h4>Products</h4>
        </div>
        <div>
         <button
           onClick={onAddClick}
           className="border border-neutral-500 p-[2px] px-2 text-sm rounded cursor-pointer hover:text-emerald-800 hover:border-emerald-800"
          ><i className="bi bi-plus"></i></button>
        </div>
       </div>
       <div className="flex items-center justify-between my-2">
        <div>

        </div>
         
       </div>
       {/** list of products */}
       {loading ? (
        <div className="preloadder p-10 bg-neutral-900 rounded-lg mt-2"></div>
       ) : (
       <div className="p-4 bg-neutral-900 rounded-lg mt-2">
       <div className="pb-4 flex justify-between items-center">
        <h4 className="text-neutral-300">Products list</h4>
        <div className="flex space-x-2 items-center">
         <div className="border border-neutral-800 text-neutral-500 px-4 py-1.5 rounded-lg bg-black">
          <i className="bi bi-search"></i>
          <input type="search" placeholder="Search products" className="w-[20vw] pl-4 outline-0 text-sm text-neutral-500" onChange={handleSearch}/>
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
             <h4>Filter stock</h4>
             <form method="post" className="py-3 space-y-2">
               <div className="relative w-full" title="From date">
                 From:<input type="date" placeholder="By date" aria-placeholder="date" className="rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleStartDate}/>
               </div>
               <div className="relative w-full" title="To date">
                To:<input type="date" placeholder="By date" aria-placeholder="date" className="rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleEndDate}/>
               </div>
               <div className="relative w-full">
             <input 
              type="text" 
              placeholder="By category"
              name="filter" 
              value={category}
              onChange={(e) => {
                handleCategoryChange(e);
                handleFilter(e);
              }}
              onClick={() => setShowDropdown(true)}
              className="bg-black rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
             
              />
              {showDropdown && (
              <ul className="absolute bg-neutral-900 border border-neutral-800 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto">
                <li className="px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => {handleFilter(" "); selectCategory("");}}>Any</li>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat, index) => (
                    <li key={index} className="px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => {selectCategory(cat.name); handleFilter(cat);}}>
                      {cat.name}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-neutral-500">No matches found</li>
                )}
              </ul>
            )}
               </div>
              </form>
            </div>
          )}
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead className="text-sm text-neutral-600 border-y border-neutral-800">
           <tr className="px-2 text-left">
            <th className="px-2 py-3 font-normal">Id</th>
            <th className="px-2 py-3 font-normal">Name</th>
            <th className="px-2 py-3 font-normal">Current price</th>
            <th className="px-2 py-3 font-normal">Category</th>
            <th className="px-2 py-3 font-normal">Unit</th>
            <th className="px-2 py-3 font-normal">Stock</th>
            <th className="px-2 py-3 font-normal">Status</th>
            <th className="px-2 py-3 font-normal">Date</th>
            <th className="px-2 py-3 font-normal">Actions</th>
           </tr>
          </thead>
          <tbody>
            {currentProducts.map((row, i) => (
              <tr key={i} className="text-sm text-neutral-400 border-b border-neutral-800">
              <td className="p-2">#{row.id}</td>
              <td className="p-2">{row.name}</td>
              <td className="p-2">{formatNumber(row.price, 2)} RWF</td>
              <td className="p-2">{row.category}</td>
              <td className="p-2">{(row.unit)}</td>
              <td className="p-2">{formatNumber(row.stock, 0)}</td>
              <td className="p-2">
               <span
               className={`${row.stock <= 0 ? 'bg-red-900 border-red-400 text-red-400': row.stock >= 0 && row.stock <= 10 ? 'bg-orange-900 border-orange-400 text-orange-400' : 'bg-emerald-900 border-emerald-300 text-emerald-300'} border rounded px-1 py-[2px]`}
               >
                {row.stock <= 0 ? "Out of Stock" : row.stock <= 10 ? "Low stock" : "Available"}
               </span>
              </td>
              <td className="p-2">{formatDate(row.created_at)}</td>
              <td className="p-2 space-x-3">
                <button className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => setShowEdit(row)}><i className="bi bi-pencil mr-1 text-sky-800"></i>edit</button>
                {isAdmin === "true" && (  <button className="px-2 py-1 cursor-pointer text-sm rounded-md border border-neutral-800" onClick={() => handleDelete(row.id)}><i className="bi bi-trash mr-1 text-red-700"></i>Remove</button>)}
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
       </div>
       )}
       {showEdit && (<Edit product={showEdit} onClose={closeEdit}/>)}
    </div>
  );
}
export default Products;