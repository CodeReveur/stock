import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface OrderProps {
  orders: {
    id: number;
    purchase_code: string;
    label: string;
    product: [{
      id: any;
      name: string;
      price: any;
      stock: any;
      unit: string;
    }],
    sum: number;//sum of prices on single code
    stock: number;
    supplier: string;
    status: string;
    created_at: string; 
   };
  onClose: () => void;
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

const ViewOrder = ({ orders, onClose }: OrderProps) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 backdrop-blur-xs z-30">
      {error && <AlertNotification message={error} type="error" />}
      <div className="bg-neutral-900 p-5 rounded-xl w-[40vw] max-w-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">View Purchase Order</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info-circle text-emerald-700 mr-1"></i> 
          Order details listed below. Review before confirmation.
          <ul className="mt-2 p-1 text-neutral-500 text-sm space-y-2 border-emerald-900">
            <li className="text-xl text-emerald-800"><strong>{orders.label}</strong> </li>
            <li><strong>Code:</strong> {orders.purchase_code}</li>
            <li><strong>Supplier:</strong> {orders.supplier}</li>
            <li><strong>Total Price:</strong> {formatNumber(orders.sum, 2)} RWF</li>
            <li><strong>Date:</strong> {formatDate(orders.created_at)}</li>
          </ul>
        </div>
        <div className="border border-neutral-700 rounded-md max-h-[35vh] overflow-hidden overflow-y-visible mt-2">
          <table className="w-full text-sm text-left text-neutral-400">
            <thead className="bg-neutral-800 text-neutral-500">
              <tr>
                <th className="py-2 px-4">Product</th>
                <th className="py-2 px-4">Stock</th>
                <th className="py-2 px-4">Price</th>
              </tr>
            </thead>
            <tbody>
              {orders.product.map((order, index) => (
                <tr key={order.id} className={index % 2 === 0 ? "bg-neutral-850" : ""}>
                  <td className="py-2 px-4">{order.name}</td>
                  <td className="py-2 px-4">{formatNumber(order.stock, 0)}</td>
                  <td className="py-2 px-4">{formatNumber(order.price, 2)} RWF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="relative w-full flex justify-end items-center pt-4">
          <button onClick={onClose} className="flex items-center space-x-1 border bg-gray-800 border-gray-600 px-2 py-1 text-gray-400 cursor-pointer text-sm rounded-md">
            <i className="bi bi-x-circle mr-1"></i> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewOrder;
