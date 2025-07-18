"use client";
import { useEffect, useState } from "react";

import StatusBar from "@/app/components/stock/status";
import NextStockSales from "@/app/components/stock/pending";
import RecentStockSales from "@/app/components/stock/sales";

import ConfrimStock from "@/app/components/popups/confirmPurchase";
import FifoStock from "@/app/components/stock/fifo";
import LifoStock from "@/app/components/stock/lifo";
import ReservedStock from "@/app/components/stock/reserved";
import OutOfStock from "@/app/components/stock/empty";
import ProductPurchase from "@/app/components/popups/productPurchase";

const Stock = () => {
  const [purchaseCode, setPurchaseCode] = useState<string | null>(null);
  const [purchaseProduct, setPurchaseProduct] = useState<string | null>(null);

  const handleConfirmClick = (Code: string) => {
    setPurchaseCode(Code); 
  };

  const closeConfirm = () => {
    setPurchaseCode(null);
  };
  const handlePurchaseClick = (Product: string) => {
    setPurchaseProduct(Product); 
  };

  const closePurchase = () => {
    setPurchaseProduct(null);
  };
  return(
    <div>
      {/** status bar */}
      <StatusBar />

      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="grid gap-3 grid-cols-1">
          <RecentStockSales />
          <OutOfStock onPurchase={handlePurchaseClick}/>
          <ReservedStock />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <NextStockSales onConfirm={handleConfirmClick}/> 
          <LifoStock />
          <FifoStock />
        </div>
      </div>
      {purchaseCode && (<ConfrimStock purchaseCode={purchaseCode} onClose={closeConfirm}/>)}
      {purchaseProduct && (<ProductPurchase product={purchaseProduct} onClose={closePurchase}/>)}
    </div>
  );
}
export default Stock;