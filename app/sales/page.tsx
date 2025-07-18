"use client"
import { useState } from "react";
import Sales from "../pages/sales";
import AddSale from "../components/popups/addSales";
import AddCustomers from "../components/popups/addCustomer";

export default function Home() {
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const toggleAdd = () => {
    setShowAdd(true);
  }
  const closeAdd = () => {
    setShowAdd(false);
  }
  const toggleAddCustomer = () => {
    setShowAddCustomer(true);
  }
  const closeAddCustomer = () => {
    setShowAddCustomer(false);
  }
  return (
    <>
      <Sales onAddClick={toggleAdd}/>
      {showAdd && (<AddSale addCustomer={toggleAddCustomer} onClose={closeAdd}/>)}
      {showAddCustomer &&(<AddCustomers onClose={closeAddCustomer}/>)}
    </>
  );
}
