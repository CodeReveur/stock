import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menu = [
  { name: "Home", url: "/", icon: "bi bi-grid" },
  { name: "Products", url: "/products/", icon: "bi bi-clipboard-plus" },
  { name: "Purchase", url: "/purchase/", icon: "bi bi-basket" },
  { name: "Stock", url: "/stock/", icon: "bi bi-clipboard-data" },
  { name: "Sales", url: "/sales/", icon: "bi bi-cash-stack" },
  { name: "Orders", url: "/orders/", icon: "bi bi-cart" },
  { name: "Customers", url: "/customers/", icon: "bi bi-people" },
];
const others = [
  { name: "Reports", url: "/reports/", icon: "bi bi-bar-chart" },
  { name: "Settings", url: "/settings/", icon: "bi bi-gear" },
  { name: "Preferences", url: "/preferences/", icon: "bi bi-sliders" },
];

interface NavBarProps {
  menuCollapsed: boolean;
  onNavigate: (page: string) => void; 
}


const NavBar = ({ menuCollapsed, onNavigate}: NavBarProps) => {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<string | null>(null);

  useEffect(() => {
    let previousValue = localStorage.getItem("isAdmin");
    setIsAdmin(previousValue);
  
    const interval = setInterval(() => {
      const currentValue = localStorage.getItem("isAdmin");
      if (currentValue !== previousValue) {
        previousValue = currentValue;
        setIsAdmin(currentValue);
      }
    }, 1000); // checks every 1 second
  
    return () => clearInterval(interval);
  }, []);
  
  return (
    <nav className={`fixed top-0 h-full bg-neutral-900 border-e border-black  rounded-b-lg shadow-lg ${menuCollapsed ? 'p-1' : 'p-4 w-[15vw]'} transition-transform ease-in-out duration-300`} >
        <menu className="flex flex-col">
          <div className="flex items-center px-1 my-2 space-x-3">
            <div className={`${menuCollapsed ? 'w-12 h-12' : 'w-14 h-14'} rounded-lg`}>
              <img src="/logo.png" alt="logo"  className="w-full h-full object-cover rounded-lg "/>
            </div>
            <h4 className={`${menuCollapsed ? 'hidden': ''} text-2xl`}>ksm</h4>
          </div>
          <div className="my-2 flex flex-col justify-between h-[85vh]">
            <div> 
            {menu.map((tab, index) => (
              isAdmin === "false" && (tab.name === "Stock" || tab.name === "Orders" ) ? (
                <span key={index}></span>
             ) : (
             <Link
              key={index}
              href={tab.url}
              title={tab.name}
              onClick={() => onNavigate(tab.name)}
              className={`flex items-center ${menuCollapsed ? 'p-2 justify-center' : 'my-1 py-2 px-3' } text-neutral-300 text-sm font-normal hover:bg-neutral-700 hover:text-emerald-700 transition-all duration-200 ${
                pathname === tab.url ? 'bg-neutral-700 border-r-6 border-emerald-700 font-medium text-white' : ''
              }`}
              >
              <i className={`${tab.icon} ${menuCollapsed ? '': 'mr-2'}  text-xl transition-all duration-300 hover:text-gray-900`}></i>
              <span className={`${menuCollapsed ? 'hidden ' : 'block sm:block md:block lg:block'} transition-all duration-300 `}>
                {tab.name}
              </span>
              </Link>
              )))} 
            </div>
            <div>
            {others.map((tab, index) => (
             isAdmin === "false" && (tab.name === "Reports") ? (
              <span key={index}></span>
           ) : (
           <Link
            key={index}
            href={tab.url}
            title={tab.name}
            onClick={() => onNavigate(tab.name)}
            className={`flex items-center ${menuCollapsed ? 'p-2 justify-center' : 'my-1 py-2 px-3' } text-neutral-300 text-sm font-normal hover:bg-neutral-700 hover:text-emerald-700 transition-all duration-200 ${
              pathname === tab.url ? 'bg-neutral-700 border-r-6 border-emerald-700 font-medium text-white' : ''
            }`}
            >
            <i className={`${tab.icon} ${menuCollapsed ? '': 'mr-2'}  text-xl transition-all duration-300 hover:text-gray-900`}></i>
            <span className={`${menuCollapsed ? 'hidden ' : 'block sm:block md:block lg:block'} transition-all duration-300 `}>
              {tab.name}
            </span>
            </Link>
            )))} 
            
            </div>
          </div>
        </menu>
    </nav>

  );
};
export default NavBar;