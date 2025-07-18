import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface Status{
  reserved_stock: number;
  fifo_stock: number;
  lifo_stock: number;
  pending_stock: number;
  live_stock: number;
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
        const response = await fetch(`/api/stock/status`);
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
    <div className="grid grid-cols-5 gap-4 w-full">
      {error && (<AlertNotification message={error} type="error"/>)}
      <div className={`${loading ? 'preloadder': ''} bg-neutral-900 p-6 rounded-lg space-y-2`}>
        <h4 className="text-sm text-neutral-500">Reserved Stock</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.reserved_stock), 0)}</span>
          <i className="b bi-clipboard text-slate-500"></i>
        </div>
      </div>
      <div className={`${loading ? 'preloadder': ''} bg-neutral-900 p-6 rounded-lg space-y-2`}>
        <h4 className="text-sm text-neutral-500">FIFO Stock</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.fifo_stock), 0)}</span>
          <i className="b bi-clipboard-data text-indigo-800"></i>
        </div>
      </div>
      <div className={`${loading ? 'preloadder': ''} bg-neutral-900 p-6 rounded-lg space-y-2`}>
        <h4 className="text-sm text-neutral-500">LIFO Stock</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.lifo_stock), 0)}</span>
          <i className="b bi-clipboard-data text-violet-800"></i>
        </div>
      </div>
      <div className={`${loading ? 'preloadder': ''} bg-neutral-900 p-6 rounded-lg space-y-2`}>
        <h4 className="text-sm text-neutral-500">Pending Stock</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.pending_stock), 0)}</span>
          <i className="b bi-clipboard-plus text-orange-800"></i>
        </div>
      </div>
      <div className={`${loading ? 'preloadder': ''} bg-neutral-900 p-6 rounded-lg space-y-2`}>
        <h4 className="text-sm text-neutral-500">Live Safety Stock</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.live_stock), 0)}</span>
          <i className="b bi-clipboard-data text-emerald-800"></i>
        </div>
      </div>
    </div>
  );
}
export default StatusBar;