"use client";
import { useEffect, useState } from "react";
import Preloader from "../menu/buttonPreloader";
import AlertNotification from "../menu/notify";

interface Data{
  id: number;
  site_name: string;
  low_stock_alert: boolean;
  notify_admin: boolean;
  stamp_url: string;
}

const ReportsNotifications = () => {
  const [isOn, setIsOn] = useState(false);
  const [isOnB, setIsOnB] = useState(false);
  const [isOnC, setIsOnC] = useState(false);
  const [isOnD, setIsOnD] = useState(false);
  const [appName, setAppName] = useState<string>(""); // Ensure it's always a string
  const [loading, setLoading] = useState(false);
  const [appData, setAppData] = useState<Data | null>(null); // Ensure it's always a string
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/settings/get`);
        if (!response.ok) throw new Error("Failed to fetch");
        const settings  = await response.json();
        setAppData(settings); // <- extract app_name (site_name)
      } catch (error) {
        setError("An error occurred while fetching: "+error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  
  useEffect(() => {
    if (appData?.site_name) {
      setAppName(appData.site_name)
      setIsOn(appData.low_stock_alert)
      setIsOnB(appData.notify_admin)
      appData.stamp_url !== "" ? setIsOnD(true) : setIsOnD(false);
    }
  }, [appData]);
  
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("app_name", appName);

      const res = await fetch("/api/settings/report_add", {
        method: "PATCH",
        body: JSON.stringify({notify_admin: isOnB, low_stock_alert: isOn, mailing: isOnC, stamp: isOnD}),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Changes saved!");
      } else {
        setError("Failed to update.");
      }
    } catch {
      setError("Failed to update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max">
        {error && <AlertNotification message={error} type="error" />}
        {success && <AlertNotification message={success} type="success" />}
      <div className="flex justify-between items-center">
        <h4 className="text-neutral-400 text-lg">Reports and notifications</h4>
      </div>
      <div className="px-1">
        <form className="py-3 space-y-3 text-neutral-500"  onSubmit={handleSave}>
          <div className="relative w-full flex justify-between items-center">
            <h4 className="">Allow auto report generate</h4>
            <div
              onClick={() => setIsOn(!isOn)}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition duration-300 ${
              isOn ? "bg-emerald-800" : "bg-neutral-700"
             }`}
            >
             <div
              className={`w-5 h-5 bg-neutral-300 rounded-full shadow-md transform transition duration-300 ${
              isOn ? "translate-x-7" : "translate-x-0"
              }`}
             ></div>
            </div>
          </div>
          <div className="text-neutral-600 text-xs">
            <i className="bi bi-info-circle text-emerald-700 px-2"></i> 
            This generate montly report depending on data in system
          </div>
          <div className="relative w-full flex justify-between items-center">
            <h4 className="">Enable stamping </h4>
            <div
              onClick={() => setIsOnD(!isOnD)}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition duration-300 ${
              isOnD ? "bg-emerald-800" : "bg-neutral-700"
             }`}
            >
             <div
              className={`w-5 h-5 bg-neutral-300 rounded-full shadow-md transform transition duration-300 ${
              isOnD ? "translate-x-7" : "translate-x-0"
              }`}
             ></div>
            </div>
          </div>
          <div className="text-neutral-600 text-xs">
            <i className="bi bi-info-circle text-emerald-700 px-2"></i> 
            To enable this feature, you have to ensure that stamp file has been uploaded on edit company details section.
          </div>
          <div className="relative w-full flex justify-between items-center">
            <h4 className="">Allow sales suggestions</h4>
            <div
              onClick={() => setIsOnB(!isOnB)}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition duration-300 ${
              isOnB ? "bg-emerald-800" : "bg-neutral-700"
             }`} 
            >
             <div
              className={`w-5 h-5 bg-neutral-300 rounded-full shadow-md transform transition duration-300 ${
              isOnB ? "translate-x-7" : "translate-x-0"
              }`}
             ></div>
            </div>
          </div>
          <div className="text-neutral-600 text-xs">
            <i className="bi bi-info-circle text-emerald-700 px-2"></i> 
            This feature works on FIFO and old stock products
          </div>
          <div className="relative w-full flex justify-between items-center">
            <h4 className="">Allow mailing system</h4>
            <div
              onClick={() => setIsOnC(false)}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-not-allowed transition duration-300 ${
              isOnC ? "bg-emerald-800" : "bg-neutral-950"
             }`}
            >
             <div
              className={`w-5 h-5 bg-neutral-300 rounded-full shadow-md transform transition duration-300 ${
              isOnC ? "translate-x-7" : "translate-x-0"
              }`}
             ></div>
            </div>
          </div>
          <div className="text-neutral-600 text-xs">
            <i className="bi bi-info-circle text-emerald-700 px-2"></i> 
            This feature in comming soon
          </div>
          <div className="relative w-full flex justify-end items-center pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md"
            >
              {loading && <Preloader />}
              <i className="bi bi-upload ml-1" /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default  ReportsNotifications;