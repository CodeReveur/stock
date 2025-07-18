import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface Status{
  total_customers: number,
  payments: number,
  individauls: number,
  institutions: number,
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
          const response = await fetch(`/api/customers/status`);
          if (!response.ok) throw new Error("Failed to fetch status");
          const data = await response.json();
          setStatus(data);
          setLoading(false)
        } catch (error) {
          setLoading(false);
          setError("An error occurred while fetching status.: "+error);
        }
      };
      fetchStatus();
    }, []);

    if(loading) return (<div className="preloadder bg-neutral-900 p-10 rounded-xl h-max my-2"></div>);

  return (
    <div className="grid grid-cols-4 gap-4 w-full py-4">
      {error && <AlertNotification type="error" message={error} />}
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Total Customers</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.total_customers), 0)}</span>
          <i className="bi bi-people text-orange-500"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Payments</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.payments), 0)}</span>
          <i className="bi bi-receipt text-indigo-800"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Individuals</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.individauls), 0)}</span>
          <i className="bi bi-person text-violet-800"></i>
        </div>
      </div>
      <div className="preloader bg-neutral-900 p-6 rounded-lg space-y-2">
        <h4 className="text-sm text-neutral-500">Institutions</h4>
        <div>
          <span className="text-2xl font-medium text-white mr-2">{formatNumber(Number(status?.institutions), 0)}</span>
          <i className="bi bi-buildings text-emerald-800"></i>
        </div>
      </div>
    </div>
  );
}
export default StatusBar;