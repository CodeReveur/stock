import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface addProps {
  purchase: {
    id: number;
    purchase_code: string;
    label: string;
    product: [{
      id: any;
      name: string;
      price: any;
      stock: any;
    }],
    sum: number;//sum of prices on single code
    stock: number;
    supplier: string;
    status: string;
    created_at: string;  
  }
  onClose: () => void;
}
interface Item{
  id: string;
  name: string;
}
const EditPurchase = ({ purchase, onClose }: addProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [item, setItem] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [id, setId] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);
  const [showDropdown, setShowDropdown] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; price:string; stock: string }[]>(purchase.product);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/purchase/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({products: products, purchase_code: purchase.purchase_code}),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Purchase saved successfully");
        setLoading(false);
      } else {
        setError(""+result.error);
        setLoading(false);
      }
    } catch (error) {
      setError("Something went wrong!: "+error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, success]); // Fix here
  

  const handleItemChange = (e: any) => {
    const value = e.target.value;
    setItem(value);
    setFilteredItems(items.filter(cat => cat.name.toLowerCase().includes(value.toLowerCase())));
    setShowDropdown(value.length > 0);
  };

  const selectItem = (cat: string) => {
    setItem(cat);
    setShowDropdown(false);
  };

  const handleStockChange = (e: any) => {
    setStock(e.target.value);
  };
  
  const handlePriceChange = (e: any) => {
    setPrice(e.target.value);
  };

  useEffect(()=> {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products/get`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setItems(data);
        setLoading(false)
      } catch (error) {
        setLoading(false)
        setError("An error occurred while fetching products: "+error);
      }
    };
    fetchProducts();
  }, []);
  
  const handleAddProduct = () => {
    if (item.trim() && stock.trim()) {
      // Check if product already exists
      if (!products.some((product) => product.id === id)) {
        setProducts([...products, { id, name: item, price, stock }]);
        setItem("");
        setStock("");
        setPrice("");
        setId("");
        setError(null);
      }else {
        setError("Item is lready added!");
      }
    }
  };

  const handleRemoveProduct = (name: string) => {
    setProducts(products.filter(product => product.name !== name));
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 z-30">
      {error && (<AlertNotification message={error} type="error"/>)}
      {success && (<AlertNotification message={success} type="success"/>)}

      <div className="bg-neutral-900 p-5 rounded-xl flex space-x-5">
        <div className="w-[30vw]">
          <div className="flex items-center justify-between">
            <h4 className="text-neutral-400 font-semibold">Edit Purchase</h4>
          </div>
          <div className="text-neutral-600 text-sm my-2">
            <i className="bi bi-info text-emerald-700"></i> 
            <ul>
              <li>Purchase Code: {purchase.purchase_code}</li>
              <li>Supplier: {purchase.supplier}</li>
              <li>Price: {purchase.sum} RWF</li>
            </ul>
          </div>
           <i title="Reload" className="bi bi-arrow-counterclockwise text-emerald-700 flex justify-self-end cursor-pointer"></i>
          <form method="post" className="py-3 space-y-3" onSubmit={handleAddProduct}>
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Product eg. Light bulb 5w" 
                value={item}
                onChange={handleItemChange}
                onClick={() => setShowDropdown(true)}
                className={`${loading ? 'preloadder' : 'bg-transparent'} rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700`}
                required 
              />
              {showDropdown && (
                <ul className="absolute bg-neutral-900 border border-neutral-800 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((cat, index) => (
                      <li key={index} className="px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => {selectItem(cat.name); setId(cat.id)}}>
                        {cat.name}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-neutral-500">No matches found</li>
                  )}
                </ul>
              )}
            </div>
            <div className="relative w-full">
              <input 
                type="number" 
                placeholder="Quantity eg. 750" 
                value={stock}
                onChange={handleStockChange}
                className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" 
                required 
              />
            </div>
            <div className="relative w-full">
              <input 
                type="number" 
                placeholder="Unit price in RWF eg. 9,500" 
                value={price}
                onChange={handlePriceChange}
                className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" 
                required 
              />
            </div>
            <div className="relative w-full flex justify-end items-center pt-4">
              <button 
                type="button" 
                onClick={handleAddProduct}
                className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
                <i className="bi bi-plus"></i> Update
              </button>
            </div>
          </form>
        </div>

        {/* Right Side - Display Products */}
        <div className="w-[30vw]">
          <div className="flex items-center justify-between">
            <h4>{products.length > 0 ? products.length : '' }</h4>
            <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
          </div>
          <form onSubmit={handleSubmit} className="py-3 space-y-3">
            <div className="products min-h-[34vh] max-h-[30vh] overflow-hidden overflow-y-visible space-y-2">
              {products.length > 0 ? (
                products.map((product, index) => (
                  <div key={index} className="flex justify-between items-center space-x-1">
                    <div className="w-[90%] flex items-center justify-between bg-neutral-800 px-3 py-2  rounded-md text-neutral-400 ">
                      <span>{product.name}</span>
                      <span>{product.price} RWF</span>
                      <span>{product.stock}</span>
                    </div>
                    <i 
                      className="bi bi-dash-circle border border-neutral-800 py-1 px-2 rounded-md cursor-pointer text-orange-500 text-lg"
                      onClick={() => handleRemoveProduct(product.name)}
                    ></i>
                  </div>
                ))
              ) : (
                <p className="text-neutral-500 text-sm text-center">No products added yet</p>
              )}
            </div>

            <div className="relative w-full flex justify-end items-center pt-4">
              <button type="submit" className={`border ${products.length <= 0 ? 'bg-neutral-950 cursor-not-allowed text-neutral-500 border-neutral-800': 'text-emerald-400 bg-emerald-900 cursor-pointer border-emerald-700'}   px-2 py-1   text-sm rounded-md`} disabled={products.length <= 0}>
                <i className="bi bi-upload"></i> Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPurchase;
