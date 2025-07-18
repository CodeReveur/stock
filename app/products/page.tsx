"use client"
import { useState } from "react";
import Products from "../pages/products";
import Add from "../components/popups/addProduct";
import AddCategory from "../components/popups/addCategory";

export default function Home() {
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  const toggleAdd = () => {
    setShowAdd(true);
  }
  const closeAdd = () => {
    setShowAdd(false);
  }

  const toggleAddCategory = () => {
    setShowAddCategory(true);
  }
  const closeAddCategory = () => {
    setShowAddCategory(false);
  }
  return (
    <>
      <Products onAddClick={toggleAdd}/>
      {showAdd && (<Add onAddClick={toggleAddCategory} onClose={closeAdd}/>)}
      {showAddCategory && (<AddCategory onClose={closeAddCategory}/>)}
    </>
  );
}
