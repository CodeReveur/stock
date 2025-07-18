"use client"
import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface AddProps {
  onClose: () => void;
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
  supplier_name: string;
  supplier_tin: string;
  supplier_contact: string;
  comment: string;
  products: Product[];
}

const AddOrder = ({ onClose }: AddProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [formData, setFormData] = useState<FormData>({
    supplier_name: "",
    supplier_tin: "",
    supplier_contact: "",
    comment: "",
    products: [],
  });
  const [showDrop, setShowDrop] = useState(false);
  const [products, setProducts] = useState<{ id: number; name: string; price: string; amount: string }[]>([]);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [item, setItem] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItem(value);
    setFilteredItems(items.filter(cat => cat.name.toLowerCase().includes(value.toLowerCase())));
    setShowDrop(value.length > 0);
  };

  const handleAddProduct = (id: number, p: string, price: string, qty: string) => {
    if (p.trim() && qty.trim() && price.trim()) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/orders/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccess("Order data saved successfully");
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
          <h4 className="text-neutral-400 font-semibold">Create Import Order</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i>
          Order is a tool to maintain deliveries and time sales, make sure to change status when completed. 
        </div>
        <form onSubmit={handleSubmit} className="py-3 space-y-3">
          <div className="relative w-full">
            <div className="relative w-full">
              <input name="supplier_name" id="supplier" placeholder="Supplier name" className="bg-transparent resize-none rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
            </div>
          </div>
          <div className="relative w-full">
            <input name="supplier_tin" id="supplier" placeholder="Supplier TIN" className="bg-transparent resize-none rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
          </div>
          <div className="relative w-full">
            <input name="supplier_contact" id="supplier" placeholder="Contacts" className="bg-transparent resize-none rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} />
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
                    <li key={index} className="flex items-center justify-between px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => handleAddProduct(itm.id, itm.name, price, amount)}>
                      <span>{itm.name+ " ("+itm.stock+")"}</span>
                      <input type="number" placeholder="Unit price" value={price} className="bg-neutral-950 w-[8vw] rounded-md outline-0 border border-neutral-700 py-1 px-1 text-neutral-500 focus:border-emerald-700" onChange={handlePriceChange} />
                      <input type="number" placeholder="Qty" value={amount} className="bg-neutral-950 w-[5vw] rounded-md outline-0 border border-neutral-700 py-1 px-2 text-neutral-500 focus:border-emerald-700" onChange={handleAmountChange} />
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-neutral-500">No matches found</li>
                )}
              </ul>
            )}
          </div>

          <div className="relative w-full">
            <textarea name="label" id="label" placeholder="Comment" className="bg-transparent resize-none rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange}></textarea>
          </div>
          <div className="relative w-full flex justify-end items-center">
            <button type="submit" className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              <i className="bi bi-upload"></i> Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrder;