import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface AddProps {
  addCustomer: () => void;
  onClose: () => void;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface Item {
  id: number;
  name: string;
  stock: number;
}

interface Product {
  id: number;
  price: number;
  qty: number;
}

interface FormData {
  status: string;
  customer: string;
  products: Product[];
}

const AddSale = ({ addCustomer, onClose }: AddProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [formData, setFormData] = useState<FormData>({
    status: "",
    customer: "",
    products: [],
  });
  const [customer, setCustomer] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [products, setProducts] = useState<{ id: number; name: string; price: string; amount: string }[]>([]);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [item, setItem] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
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
  }, [error, success]); // Fix here
  
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomer(value);
    
    // Filter by both name and phone
    setFilteredCustomers(
      customers.filter(cat =>
        cat.name.toLowerCase().includes(value.toLowerCase()) || 
        cat.phone.includes(value) // No `.toLowerCase()` for phone since it's numeric
      )
    );
  
    setShowDropdown(value.length > 0);
  };
  

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItem(value);
    setFilteredItems(items.filter(cat => cat.name.toLowerCase().includes(value.toLowerCase())));
    setShowDrop(value.length > 0);
  };

  const selectCustomer = (name: string, id: number) => {
    setCustomer(name);
    setFormData({ ...formData, customer: id.toString() });
    setShowDropdown(false);
  };

  const handleAddProduct = (id: number, p: string, price: string, qty: string, cstock: number) => {
    if (p.trim() && qty.trim() && price.trim()) {
     if(cstock > 0 && Number(qty) <= cstock){
      if (!products.some(product => product.id === id)) {
        const updatedProducts = [...products, { id, name: p, price: price, amount: qty }];
        setProducts(updatedProducts);
        setFormData({ ...formData, products: updatedProducts.map(prod => ({ id: prod.id, price: parseInt(prod.price), qty: parseInt(prod.amount) })) });
        setItem("");
        setPrice("");
        setAmount("");
        setError(null);
      } else {
        setError("Item is already added!");
      }
     }else{
      setError("Product is low in stock, please purchase more")
     }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/get`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setItems(data);
        setLoading(false);
      } catch {
        setLoading(false);
        setError("An error occurred while fetching products.");
      }
    };

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/customers/get`);
        if (!response.ok) throw new Error("Failed to fetch customers");
        const data = await response.json();
        setCustomers(data);
        setLoading(false);
      } catch {
        setLoading(false);
        setError("An error occurred while fetching customers.");
      }
    };

    fetchCustomers();
    fetchProducts();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };

  const handleRemoveProduct = (id: number) => {
    const updatedProducts = products.filter(product => product.id !== id);
    setProducts(updatedProducts);
    setFormData({ ...formData, products: updatedProducts.map(prod => ({ id: prod.id, price: parseInt(prod.price), qty: parseInt(prod.amount) })) });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/sales/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccess("Sales data saved successfully");
        setLoading(false);
      } else {
        setLoading(false);
        setError(result.error || "Failed to save");
      }
    } catch {
      setLoading(false);
      setError("Something went wrong!");
    } 
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 backdrop-blur-sm z-30">
      {error && (<AlertNotification message={error} type="error"/>)}
      {success && (<AlertNotification message={success} type="success"/>)}
      <div className="bg-neutral-900 p-5 rounded-xl w-[35vw]">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">Add sale 🙈</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i>
          Confirm sales will affect performance, make sure that provided informations are real.
        </div>
        <form onSubmit={handleSubmit} className="py-3 space-y-3">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Customer" 
              value={customer}
              onChange={handleCustomerChange}
              onClick={() => setShowDropdown(true)}
              className={`${loading ? 'preloadder': 'bg-neutral-950'} rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700`}
              required 
            />
            {showDropdown && (
              <ul className="absolute bg-neutral-900 border border-neutral-800 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto">
                <li onClick={addCustomer} className="px-4 py-2 text-emerald-800 cursor-pointer"> <i className="bi bi-plus"></i> Add new customer</li>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c, index) => (
                    <li key={index} className="px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => selectCustomer(c.name, c.id)}>
                      {c.name+" ("+c.phone+")"}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-neutral-500">No matches found</li>
                )}
              </ul>
            )}
          </div>
          <div className="max-h-[20vh] w-full flex flex-wrap items-center">
            {products.length > 0 && (
              products.map((product, index) => (
                <div key={index} className="flex items-center space-x-2 w-max rounded-md m-[2px] bg-neutral-800 border border-neutral-800 px-2 py-1">
                  <div className="flex items-center space-x-2 justify-between  text-sm text-neutral-500 ">
                    <span>{product.name} </span>
                    <span className="text-emerald-700">{product.amount} x <span className="text-orange-700">{product.price} RWF</span></span>

                  </div>
                  <i 
                    className="bi bi-dash-circle rounded-md cursor-pointer text-orange-500"
                    onClick={() => handleRemoveProduct(product.id)}
                  ></i>
                </div>
              )))}
          </div>
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Product eg. Light bulb 5w" 
              value={item}
              onChange={handleItemChange}
              onClick={() => setShowDrop(true)}
              className={`${loading ? 'preloadder': 'bg-neutral-950'} rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700`}
            />
            {showDrop && (
              <ul className="absolute bg-neutral-900 border border-neutral-800 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  filteredItems.map((itm, index) => (
                    <li key={index} className="flex items-center justify-between px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => handleAddProduct(itm.id, itm.name, price, amount, itm.stock)}>
                      <span>{itm.name+ " ("+itm.stock+")"}</span>
                      <input type="number" placeholder="Unit price" value={price} className="bg-neutral-950 w-[8vw] rounded-md outline-0 border border-neutral-700 py-1 px-2 text-neutral-500 focus:border-emerald-700" onChange={handlePriceChange} />
                      <input type="number" placeholder="Qty" value={amount} className="bg-neutral-950 w-[5vw] rounded-md outline-0 border border-neutral-700 py-1 px-2 text-neutral-500 focus:border-emerald-700" onChange={handleAmountChange} />
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-neutral-500">No matches found</li>
                )}
              </ul>
            )}
          </div>
          <div className="w-full relative">
            <select 
             name="status" 
             id=""
             onChange={(e) => handleInputChange(e)}
             className={`${loading ? 'preloadder': 'bg-neutral-950'} rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700`}
             required
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="relative w-full flex justify-end items-center">
            <button type="submit" className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              <i className="bi bi-plus-circle"></i> Create sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSale;