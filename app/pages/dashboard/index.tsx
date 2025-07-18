"use client";
import StatusBar from "@/app/components/home/status";
import RecentSales from "@/app/components/home/recent";
import RecentReports from "@/app/components/home/reports";
import Analytics from "@/app/components/home/analytics";
import Victory from "@/app/components/home/victory";
import { useState } from "react";
import ViewSalesOrder from "@/app/components/popups/viewSale";

const Dashboard = () => {
    const [sale, setSale] = useState<any | null>(null);
  
    const handleViewSale = (saleOrder: any) => {
      setSale(saleOrder);
    }
  
    const closeViewSale = () => {
      setSale(null);
    }
  
  return(
    <div>
      {/** status bar */}
      <StatusBar />
      <div className="grid grid-cols-2 gap-4 my-6">
        <Analytics />
        <Victory />
        <RecentSales onViewSale={handleViewSale}/>
        <RecentReports />
      </div>
      {sale && (<ViewSalesOrder orders={sale} onClose={closeViewSale} />)}
    </div>
  );
}
export default Dashboard;