"use client";
import { useEffect, useState } from "react";
import 'bootstrap-icons/font/bootstrap-icons.css';
import NavBar from "./components/menu/navbar";
import "./globals.css";
import TopBar from "./components/menu/TopBar";
import { usePathname } from "next/navigation";
import Activate from "./components/popups/activate";
import { motion } from "framer-motion";
import AlertNotification from "./components/menu/notify";


interface Activate {
  id: string;
  key: string;
  createdAt: string;
  used: boolean;
}

const AUTO_LOCK_TIME = 10 * 1000; // 10 seconds in milliseconds for testing
const CORRECT_PIN = "1234"; // For demo only, secure this in a real app

const manipulateUrl = (url: string) => {
  // Remove the '/i/' prefix
  if (url.startsWith('/')) {
    url = url.replace('/', '');
  } else {
    url = "home";
  }

  // Capitalize the first letter of the remaining word
  const capitalized = url.charAt(0).toUpperCase() + url.slice(1);

  return capitalized;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [productKey, setProductKey] = useState(true);
  const [loading, setLoading] = useState(true);
  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(false);
  const path = usePathname();
  const pathTitle = manipulateUrl(path) || "Dashboard";
  const [pageTitle, setPageTitle] = useState<string>(pathTitle); // State for dynamic page title
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error ) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const checkActivate = async () => {
    setLoading(true);
    try {
      await fetch("api/auth/access");
      const res = await fetch("/api/auth/test");
      const data = await res.json();
      
      setProductKey(data.used);
      setLoading(false);
    } catch (err) {
      console.error("Failed to check:", err);
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    setMenuCollapsed((prev) => !prev);
  };

  // Function to update page title when navigating
  const handlePageChange = (newPage: string) => {
    setPageTitle(newPage);
  };
 
  const sidebarWidth = menuCollapsed ? '80px' : '15vw';
  const mainMarginLeft = menuCollapsed ? '80px' : '15vw';

  useEffect(() => {
    checkActivate();
  }, [productKey]);

    // Track activity
    useEffect(() => {
      const resetTimer = () => setLastActivity(Date.now());
  
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("mouseover", resetTimer);

      return () => {
        window.removeEventListener("mousemove", resetTimer);
        window.addEventListener("mouseover", resetTimer);
        window.removeEventListener("keydown", resetTimer);
      };
    }, []);
  
    // Check inactivity every second
    useEffect(() => {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now - lastActivity > AUTO_LOCK_TIME) {
          setIsLocked(true);
        }
      }, 1000); // check every second
  
      return () => clearInterval(interval);
    }, [lastActivity]);

    if (isLocked) {
        return ( 
          <div className="fixed inset-0 bg-neutral-900 bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
             {error && (<AlertNotification message={error} type="error" />)}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className="bg-neutral-800 rounded-2xl shadow-lg p-6 w-11/12 max-w-sm"
            >
              <h2 className="text-xl font-semibold text-center text-white mb-6">
                🔒 App Locked
              </h2>
              <form className="space-y-4">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d*"
                  autoFocus
                  maxLength={4}
                  placeholder="Enter PIN"
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPinInput(val);
                    if ( val.length === 4) {
                     if(val === CORRECT_PIN) {
                      setIsLocked(false);
                      setLastActivity(Date.now());
                      setPinInput("");
                      setError(null)
                    }else{
                      setError("Invalid PIN")
                    }
                   }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 text-white text-center text-lg tracking-widest placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <p className="text-center text-neutral-400 text-sm">
                  Session locked due to inactivity.
                </p>
              </form>
            </motion.div>
          </div>
        );
      
    }
  
  return (
    <html lang="en">
      <head>
        <title>Kamero Stock Management</title>
        <link rel="shortcut icon" href="/logo.png" type="image/x-icon" />
      </head>
      <body>
        {!productKey ? (
          <Activate />
        ) : !loading ? (
          <>
            <NavBar menuCollapsed={menuCollapsed} onNavigate={handlePageChange} />
            <div
              className="fixed top-0 z-20 p-5 flex justify-between bg-black shadow-sm transition-all duration-300"
              style={{
                left: sidebarWidth,
                width: `calc(100% - ${sidebarWidth})`,
              }}
            >
              <TopBar page={pageTitle} toggleMenu={toggleMenu} menuCollapsed={menuCollapsed} />
            </div>
            <main
              className="px-5 transition-all duration-300 mt-[80px]"
              style={{ marginLeft: mainMarginLeft }}
            >
              {children}
            </main>
          </>
        ) : (
        <></>
        )}
      </body>
    </html>
  );
}
