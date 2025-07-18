import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
import Preloader from "../menu/buttonPreloader";

interface AddProps {
  onAddClick: () => void;
  onClose: () => void;
}
interface Category{
  id: number;
  name: string;
  limit: number;
}
const Add = ({ onAddClick, onClose }: AddProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  //const m = ["Electronics", "Buildings", "Plumbing", "Shops", "Furniture", "Clothing", "Automobiles", "Gardening", "Sports", "Books"];
  const [category, setCategory] = useState("");
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
    supplier: "",
    stock: "",
  });

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, success]); // Fix here
  

  useEffect(()=> {
    const fetchCategories= async () => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCategory(value);
    setFilteredCategories(categories.filter(cat => cat.name.toLowerCase().includes(value.toLowerCase())));
    setShowDropdown(value.length > 0);
    setFormData({ ...formData, category: value });
  };

  const selectCategory = (cat: string) => {
    setCategory(cat);
    setShowDropdown(false);
    setFormData({ ...formData, category: cat });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Product added successfully");
        //onClose(); // Close the modal
        setLoading(false);
      } else {
        setError(result.error.message || "Failed to add product");
        setLoading(false);
      }
    } catch (error) {
      setError("Something went wrong!: "+error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 z-30">
      {success && <AlertNotification message={success} type="success" />}
      {error && <AlertNotification message={error} type="error" />}
      <div className="bg-neutral-900 p-5 rounded-xl w-[35vw]">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">Add Product</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i> 
          Note that if category is not on the list, click on the add category button below to add it.
        </div>
        <form onSubmit={handleSubmit} className="py-3 space-y-3">
          <div className="relative w-full">
            <input type="text" name="name" placeholder="Product name" value={formData.name} onChange={handleInputChange} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" required />
          </div>
          <div className="relative w-full">
            <input 
              type="text" 
              name="category"
              placeholder="Category" 
              value={category}
              onChange={handleCategoryChange}
              onClick={() => setShowDropdown(true)}
              className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
              required 
            />
            {showDropdown && (
              <ul className="absolute bg-neutral-900 border border-neutral-800 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto">
                {loading && (<Preloader />)}
                <li className="px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => {selectCategory("");}}>Any</li>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat, index) => (
                    <li key={index} className="px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => selectCategory(cat.name)}>
                      {cat.name} - {`(${cat.limit})`}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-neutral-500">No matches found</li>
                )}
              </ul>
            )}
          </div>
          <div className="relative w-full">
            <input type="number" name="price" placeholder="Price in RWF" value={formData.price} onChange={handleInputChange} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" required />
          </div>
          <div className="relative w-full">
            <input type="text" name="unit" placeholder="Unit" value={formData.unit} onChange={handleInputChange} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" required />
          </div>
          <div className="relative w-full">
            <input type="text" name="supplier" placeholder="Supplier ie. Not optional" value={formData.supplier} onChange={handleInputChange} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"/>
          </div>
          <div className="relative w-full">
            <input type="number" name="stock" placeholder="Stock Amount" value={formData.stock} onChange={handleInputChange} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"/>
          </div>
          <div className="relative w-full flex justify-between items-center pt-4">
            <button type="button" className="border border-dashed border-emerald-700 px-2 py-1 text-emerald-700 cursor-pointer text-sm rounded-md" onClick={onAddClick}>
              <i className="bi bi-plus"></i> Add category
            </button>
            <button type="submit" className="border flex items-center space-x-1 bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              {loading && (<Preloader />)}<i className="bi bi-upload"></i> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Add;
