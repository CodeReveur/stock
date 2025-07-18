"use client"
import { useState } from "react";
import Orders from "../pages/orders";
import AddOrder from "../components/popups/addOrders";

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
      <Orders onAddClick={toggleAdd}/>
      {showAdd && (<AddOrder onClose={closeAdd}/>)}
    </>
  );
}
