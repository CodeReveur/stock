"use client";
import ViewSalesOrder from "@/app/components/popups/viewSale";
import RecentSales from "@/app/components/sales/recent";
import TopCustomers from "@/app/components/sales/top_customers";
import TopSelling from "@/app/components/sales/top_selling";
import { useEffect, useState } from "react";

interface ListProps{
  onAddClick: () => void;
}

const Sales = ({onAddClick}: ListProps) => {
  const [sale, setSale] = useState<any | null>(null);

  const handleViewSale = (saleOrder: any) => {
    setSale(saleOrder);
  }

  const closeViewSale = () => {
    setSale(null);
  }


  return (
    <div className="mb-4">
      <div className="bg-neutral-900 text-neutral-400 flex justify-between px-4 py-5 rounded-xl">
        <div className="flex space-x-3 items-center">
          <i className="bi bi-cash-stack"></i><h4>Sales</h4>
        </div>
        <div>
         <button
           onClick={onAddClick}
           className="border border-neutral-500 p-[2px] px-2 text-sm rounded cursor-pointer hover:text-emerald-800 hover:border-emerald-800"
          ><i className="bi bi-plus"></i></button>
        </div>
       </div>
       <div className="grid gap-4 w-full">
        <RecentSales onViewSale={handleViewSale}/>
        <div className="grid grid-cols-2 gap-4">
          <TopSelling />
          <TopCustomers />
        </div>
        
       </div>
       {sale && <ViewSalesOrder orders={sale} onClose={closeViewSale}/>}
    </div>
  );
}
export default Sales;