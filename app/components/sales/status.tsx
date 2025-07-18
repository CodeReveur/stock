import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface Status{
  total_cogs: number;
  total_revenue: number;
  margin: number;
  profit: number;
  closing_stock: number;
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
            const response = await fetch(`/api/sales/status`);
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
    <div className="grid grid-cols-4 gap-4 w-full py-4">

      {error && <AlertNotification type="error" message={error} />}

      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Total Costs</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.total_cogs), 0)}</span>
          <span className="text-orange-500">RWF</span>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Revenue</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.total_revenue), 0)}</span>
          <span className="text-indigo-800">RWF</span>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Margin</h4>
        <div>
          <span className={`${String(status?.margin).includes("-") ? 'text-red-800': 'text-white'} text-2xl font-medium mr-2`}>{status?.margin}</span>
          <span className="text-violet-800">RWF</span>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Profit</h4>
        <div>
          <span className={`${Number(status?.profit) <= 0 ? 'text-red-800': 'text-white'} text-2xl font-medium mr-2`}>{formatNumber(Number(status?.profit), 0)}</span>
          <span className="text-emerald-800">RWF</span>
        </div>
      </div>
    </div>
  );
}
export default StatusBar;