"use client";

import RecentOrders from "@/app/components/orders/orders";
import ViewOrder from "@/app/components/popups/viewOrder";
import { useEffect, useState } from "react";

interface ListProps{
  onAddClick: () => void;
}

const Orders = ({onAddClick}: ListProps) => {
  const [order, setOrder] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState<string | null>(null);

  const handleViewOrder = (Order: any) => {
    setOrder(Order);
  }

  const closeViewOrder = () => {
    setOrder(null);
  }
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
    <div className="">
      <div className="bg-neutral-900 text-neutral-400 flex justify-between px-4 py-5 rounded-xl">
        <div className="flex space-x-2 items-center">
         <i className="bi bi-cart"></i><h4>Orders</h4>
        </div>
        <div>
         {isAdmin === "true" && (
          <button
           onClick={onAddClick}
           title="Add customer"
           className="border border-neutral-500 p-[2px] px-2 text-sm rounded cursor-pointer hover:text-emerald-800 hover:border-emerald-800"
          ><i className="bi bi-plus"></i>
          </button>)}
        </div>
       </div>
       <div className="grid gap-4 w-full">
        <RecentOrders onViewOrder={handleViewOrder}/>
       </div>
       {order && <ViewOrder orders={order} onClose={closeViewOrder}/>}
    </div>
  );
}
export default Orders;  