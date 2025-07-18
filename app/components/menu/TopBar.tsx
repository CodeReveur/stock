"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import WindowControls from "./windowControls";
import AdminPopup from "../popups/admin";

interface Notification {
  id: string;
  file_url: string;
  type: string;
  details: string;
  action: string;
  createdAt: string;
  read: boolean; // Add a read status for notifications
}

interface TopBarProps {
  page: string;
  menuCollapsed: boolean;
  toggleMenu: () => void;
}
function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const prefix = Number(hours) >= 12 ? 'PM' : 'AM';

  return `${month}, ${day} ${year} ${hours}:${minutes} ${prefix}`;
};

const TopBar = ({ page, menuCollapsed, toggleMenu }: TopBarProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]); 
  const [isOn, setIsOn] = useState(false);

  const wrapperRef = useRef(null);
  
  const [showAdminPopup, setShowAdminPopup] = useState(false);

  const handleAdminToggle = () => {
    const isAdmin = localStorage.getItem("isAdmin") === "true"; 
    if (isAdmin) { 
      setIsOn(!isOn);
      localStorage.setItem("isAdmin", "false");
    } else { 
      setShowAdminPopup(true);
      setIsOn(!isOn);
    }
  }; 
  
  const runDailyPurchaseReports = async () => {
    try {
      const res = await fetch("/api/reports/daily/purchase");
      const data = await res.json();
      if(res.ok){
        console.log("Generated", data);
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  };
  const runDailySalesReports = async () => {
    try {
      const res = await fetch("/api/reports/daily/sales");
      const data = await res.json();
      if(res.ok){
        console.log("Generated", data);
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  };
  const runDailyGrowthReports = async () => {
    try {
      const res = await fetch("/api/reports/daily/financial_summary");
      const data = await res.json();
      if(res.ok){
        console.log("Generated", data);
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  };

  const cleanUp = async () => {
    try {
      const res = await fetch("/api/utils/cleanup");
      const data = await res.json();
      if(res.ok){
        console.log("Generated", data);
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  };

  const suggestionsStock = async () => {
    try {
      const res = await fetch("/api/reports/suggestions/stock");
      if (res.ok) {
        console.log("Suggestions updated");
      }
    } catch (err) {
      console.error("Failed to trigger update job:", err);
    }
  };

  const lowStockAlert = async () => {
    try {
      const res = await fetch("/api/reports/suggestions/low_alerts");
      if (res.ok) {
        console.log("Suggestions updated");
      }
    } catch (err) {
      console.error("Failed to trigger update job:", err);
    }
  };

  function scheduleDailyTrigger() {
    const TRIGGER_HOUR = 20; // 8 PM
    const STORAGE_KEY = "last_daily_trigger_date";
  
    const intervalId = setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toISOString().split("T")[0]; // 'YYYY-MM-DD'
      const lastTriggered = localStorage.getItem(STORAGE_KEY);

      if (hour === TRIGGER_HOUR && lastTriggered !== today) {
        // 👇 Your daily tasks here
        await runDailyPurchaseReports();
        await runDailySalesReports();
        await runDailyGrowthReports();
        await suggestionsStock();
        await cleanUp()
  
        console.log("✅ Daily task triggered at 8:00 PM");
        localStorage.setItem(STORAGE_KEY, today);
      }
    }, 1000 * 60); // Check every minute
  
    return () => clearInterval(intervalId); // Optional cleanup
  }
  

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []); 

  const updateNotifications = async () => {
    try {
      const res = await fetch("/api/reports/notifications/update");
      if (res.ok) {
        console.log("Notifications updated");
      }
    } catch (err) {
      console.error("Failed to trigger update job:", err);
    }
  };



  const unreadCount = notifications.filter((n) => n.action === "Unread").length;

  useEffect(() => {
    scheduleDailyTrigger();

    // Set interval to repeat every 5 seconds
    const interval = setInterval(() => {
      scheduleDailyTrigger();
      lowStockAlert();
    }, 1000 * 60 * 60); // 36000ms = 1 hour

    // Clear interval when component unmounts
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Initial calls
    fetchNotifications();

    // Set interval to repeat every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 1000 * 5); // 2000ms = 2 seconds

    // Clear interval when component unmounts
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => { 
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !(wrapperRef.current as any).contains(event.target)) {
        updateNotifications();
        setShowNotifications(false);
        
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div className="transition-transform duration-300 ease-in-out w-full space-y-3 relative">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center space-x-2">
          <button
            className="border border-neutral-500 p-[2px] px-1 text-sm rounded cursor-pointer hover:text-emerald-800 hover:border-emerald-800"
            onClick={toggleMenu}
          >
            <i className={`bi bi-chevron-${menuCollapsed ? "right" : "left"}`}></i>
          </button>
          <h4 className="text-emerald-800">{page}</h4>
        </div>
        
        <div className="flex items-center space-x-10">
        <div className="relative w-full flex items-center space-x-3">
            
            <div
              onClick={handleAdminToggle}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition duration-300 ${
              isOn ? "bg-orange-800" : "bg-neutral-700"
             }`}
            >
             <div
              className={`w-5 h-5 bg-neutral-300 rounded-full shadow-md transform transition duration-300 ${
              isOn ? "translate-x-7" : "translate-x-0"
              }`}
             ></div>
            </div>
            <h4 className="font-semibold text-sm">Admin</h4>
          </div>
        <div className="relative flex items-center">
         
        {/* Bell Icon */}
        <button
          className="border text-neutral-400 border-neutral-500 py-1 px-2 text-sm rounded-full cursor-pointer hover:text-emerald-800 hover:border-emerald-800 relative"
          onClick={() => setShowNotifications((prev) => !prev)}
        >
          <i className="bi bi-bell"></i>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-orange-800 backdrop-blur-xs text-neutral-200 text-xs rounded-full px-1.5 py-0.5 ">
              {unreadCount}
            </span>
          )}
        </button>
          {/* Notification Dropdown */}
          {showNotifications && (
            <div
              ref={wrapperRef}
              className="absolute top-12 right-2 z-20 w-[22vw] bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl text-sm text-white overflow-hidden"
            >
              <div className="p-4 font-semibold border-b border-neutral-700 text-emerald-800 text-base">
                Notifications
              </div>
              <ul className="max-h-96 overflow-y-auto divide-y divide-neutral-800">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`py-3 px-4 hover:bg-neutral-800 cursor-pointer space-y-1 ${
                        n.action === "Unread" ? "font-semibold text-neutral-100" : "text-neutral-400"
                      }`}
                    >
                      <div className="text-emerald-700">{n.type}</div>
                      <div>{n.details}</div>
                      <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                        <span className="text-orange-900">{formatDate(n.createdAt)}</span>
                        <a
                          href={n.file_url}
                          className="border-b border-emerald-800 px-2 py-[2px] rounded-dull text-emerald-700 flex justify-self-end"
                          target="_blank"
                        >
                          Open file
                        </a>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="p-3 text-gray-500 text-center">No notifications</li>
                )}
              </ul>
            </div>
          )}
        </div>
          <WindowControls />
        </div>
      </div>
      {showAdminPopup && (  <AdminPopup onClose={() => setShowAdminPopup(false)} onSuccess={() => setIsOn(true)}/>)}

    </div>
  );
};

export default TopBar;

