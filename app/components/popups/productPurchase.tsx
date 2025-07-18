"use client";

import { useState } from "react";

interface addProps {
  product: string;
  onClose: () => void;
}

const ProductPurchase = ({ onClose, product }: addProps) => {
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [label, setLabel] = useState("");
  const [supplier, setSupplier] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !price || !label || !supplier) return;

    setLoading(true);
    try {
      const res = await fetch("/api/purchase/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          label,
          supplier,
          amount,
          price,
          stock: amount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Purchase successful:", data);
        onClose();
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 backdrop-blur-xs z-30">
      <div className="bg-neutral-900 p-5 rounded-xl w-[35vw]">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">Purchase product</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i> 
          Required fields are product, label, supplier, amount.
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="py-3 space-y-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Product"
              className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
              value={product}
              disabled
              required
            />
          </div>
          <div className="relative w-full">
            <input
              type="number"
              placeholder="Amount eg. 450"
              className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="relative w-full">
            <input
              type="number"
              placeholder="Unit price eg. 9500"
              className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="relative w-full">
            <textarea
              name="label"
              id="label"
              placeholder="Label"
              className="bg-transparent resize-none rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Supplier eg. Eric Tech (140197884)"
              className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              required
            />
          </div>
          <div className="relative w-full flex justify-end items-center pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md disabled:opacity-60"
              disabled={loading}
            >
              <i className="bi bi-upload"></i> {loading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductPurchase;
