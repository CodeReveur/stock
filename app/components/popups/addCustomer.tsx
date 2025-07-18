"use client";
import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
import Preloader from "../menu/buttonPreloader";

interface addProps{
  onClose: () => void
}

const AddCustomers = ({ onClose }: addProps) => {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    prefered_payment: "",
    account: "",
    phone: "",
    email: "",
    title: "",
    tin: "",
  });

   useEffect(() => {
      if (error || success) {
        const timer = setTimeout(() => {
          setError(null);
          setSuccess(null);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }, [error, success]); // Fix here

  const handleAccountChange = (e: any) => {
    setAccount(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/customers/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Customer added successfully");
        setLoading(false);
        setFormData({ ...formData, name: "", phone: "", email: "", prefered_payment: "", title: "", account: "", tin: "" });
      } else {
        setError(result.error.message || "Failed to add customer");
        setLoading(false);
      }
    } catch (error) {
      setError("Something went wrong!: "+error);
      setLoading(false);
    }
  };

 
  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 backdrop-blur-xs z-30">
            {success && <AlertNotification message={success} type="success" />}
            {error && <AlertNotification message={error} type="error" />}
      <div className="bg-neutral-900 p-5 rounded-xl w-[35vw]">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">Add Customers</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i> 
          Fileds with {"(*)"}, are required. Customer details will be used in reports and analytics
        </div>
        <form onSubmit={handleSubmit} className="py-3 space-y-3" autoComplete="false">
          <div className="relative w-full">
            <input type="text" placeholder="Customer name *" name="name" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
          </div>
          <div className="relative w-full">
            <input type="text" name="phone" placeholder="Phone number " className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange}/>
          </div>
          <div className="relative w-full">
            <input type="text" name="email" placeholder="Email" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} />
          </div>
          <div className="relative w-full">
            <input type="text" name="tin" placeholder="TIN " className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} />
          </div>
          <div className="relative w-full">
            <select  name="prefered_payment" defaultValue={"Mobile Money"}  id="" className="bg-neutral-900 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
             onChange={(e) => {handleAccountChange(e); handleInputChange(e)}}
            >
              <option value="" selected disabled>Preferred payment</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          {account !== "Cash" && (
           <div className="relative w-full">
              <input type="text" placeholder={account+" Account"} name="account" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange}/>
            </div> 
          )}
          
          <div className="relative w-full">
            <select  name="title"  id="" className="bg-neutral-900 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
             onChange={handleInputChange}
             required
            >
              <option value="" selected disabled>Category *</option>
              <option value="Individual">Individual</option>
              <option value="Institution">Institution</option>
              <option value="-">Other</option>
            </select>
          </div>
          <div className="relative w-full flex justify-end items-center">
            <button type="submit" className="flex items-center space-x-1.5 border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              {loading && <Preloader />} <i className="bi bi-upload mx-2"></i> Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomers;
