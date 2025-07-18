"use client"
import { useState } from "react";
import Customers from "../pages/customers";
import AddCustomers from "../components/popups/addCustomer";

export default function Home() {
  const [showAdd, setShowAdd] = useState(false);
  
  const toggleAdd = () => {
    setShowAdd(true);
  }
  const closeAdd = () => {
    setShowAdd(false);
  }
  return (
    <>
      <Customers onAddClick={toggleAdd}/>
      {showAdd && (<AddCustomers onClose={closeAdd}/>)}
    </>
  );
}
