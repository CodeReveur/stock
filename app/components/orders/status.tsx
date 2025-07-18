import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface Status{
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  shippedOrders: number;
  canceledOrders: number;
  deliveredOrders: number;
};

const formatNumber = (amount: number , decimal: number): string => {
  return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimal,
      maximumFractionDigits: decimal,
  }).format(amount);
};

const StatusBar = () => {
  const [status, setStatus] = useState<Status>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=> {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/orders/status`);
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();
        setStatus(data);
        setLoading(false)
      } catch (error) {
        setLoading(false);
        setError("An error occurred while fetching status: "+error);
      }
    };
    fetchStatus();
  }, []);
  
  if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max"></div>);

  return (
    <div className="grid grid-cols-4 gap-4 w-full py-4">
      {error && (<AlertNotification message={error} type="error"/>)}
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Total Orders</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.totalOrders), 0)}</span>
          <i className="bi bi-cart text-neutral-500 text-lg"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Completed / Shipped</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber((Number(status?.shippedOrders) + Number(status?.completedOrders) + Number(status?.deliveredOrders)), 0)}</span>
          <i className="bi bi-cart-check text-emerald-800 text-lg"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Cancelled</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.canceledOrders), 0)}</span>
          <i className="bi bi-cart-dash text-red-800 text-lg"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Pending</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.pendingOrders), 0)}</span>
          <i className="bi bi-cart-plus text-orange-800 text-lg"></i>
        </div>
      </div>
    </div>
  );
}
export default StatusBar;