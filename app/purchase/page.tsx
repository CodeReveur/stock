"use client"
import { useState } from "react";
import Add from "../components/popups/addProduct";
import AddCategory from "../components/popups/addCategory";
import AddPurchase from "../components/popups/addPurchase";
import Purchase from "../pages/purchase";

export default function Home() {
  const [showAdd, setShowAdd] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const toggleAdd = () => {
    setShowAdd(true);
  }
  const closeAdd = () => {
    setShowAdd(false);
  }

  const toggleAddProduct = () => {
    setShowAddProduct(true);
  }
  const closeAddProduct = () => {
    setShowAddProduct(false);
  }
  const toggleAddCategory = () => {
    setShowAddCategory(true);
  }
  const closeAddCategory = () => {
    setShowAddCategory(false);
  }

  return (
    <>
      <Purchase onAddClick={toggleAdd}/>
      {showAdd && (<AddPurchase onAddClick={toggleAddProduct} onClose={closeAdd}/>)}
      {showAddProduct && (<Add onAddClick={toggleAddCategory} onClose={closeAddProduct}/>)}
      {showAddCategory && (<AddCategory onClose={closeAddCategory}/>)}
    </>
  );
}
