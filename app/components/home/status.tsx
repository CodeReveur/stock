import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface Status{
  customers: number;
  sales: number;
  products: number;
  stock: number;
  purchase: number;
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
              const response = await fetch(`/api/reports/analytics/status`);
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
    
  if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max my-2"></div>);
  
  return (
    <div className="grid grid-cols-5 gap-4 w-full">
      {error && (<AlertNotification message={error} type="error" />)}
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Total Products</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.products), 0)}</span>
          <i className="b bi-clipboard-plus text-slate-500 text-xl"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Total Stock</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.stock), 0)}</span>
          <i className="b bi-clipboard-data text-indigo-800 text-xl"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Total Sales</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.sales), 0)}</span>
          <span className="text-orange-800">RWF</span>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Total Customers</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.customers), 0)}</span>
          <i className="b bi-people text-emerald-800 text-xl"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Total Purchase</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.purchase), 0)}</span>
          <i className="b bi-cart text-sky-800 text-xl"></i>
        </div>
      </div>
    </div>
  );
}
export default StatusBar;