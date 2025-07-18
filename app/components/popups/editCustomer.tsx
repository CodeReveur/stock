import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
import Preloader from "../menu/buttonPreloader";

interface UpdateProps {
  customer: {
    id: number;
    name: string;
    prefered_payment: string;
    account: number;
    phone: number;
    email: string;
    title: string;
    created_at: string;
    total_sales: number;
  }
  onClose: () => void;
}

const Edit = ({ customer, onClose }: UpdateProps) => {
  const [account, setAccount] = useState<any>(customer.account);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: customer.name || "",
    prefered_payment: customer.prefered_payment || "",
    account: customer.account || "",
    phone: customer.phone || "",
    email: customer.email || "",
    title: customer.title || "",
    id: customer.id,
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
      const response = await fetch("/api/customers/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Customer updated successfully");
        //onClose(); // Close the modal
        setLoading(false);
      } else {
        setError(result.error.message || "Failed to update customer");
        setLoading(false);
      }
    } catch (error) {
      setError("Something went wrong!: "+error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 backdrop-blur-sm z-30">
      {success && <AlertNotification message={success} type="success" />}
      {error && <AlertNotification message={error} type="error" />}
      <div className="bg-neutral-900 p-5 rounded-xl w-[35vw]">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">Edit product</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i> 
          Note that no field have to be submitted empty, all are required.
        </div>
        <form onSubmit={handleSubmit} className="py-3 space-y-3">
          <div className="relative w-full">
            <input type="text" placeholder="Customer name" name="name" value={formData.name} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
          </div>
          <div className="relative w-full">
            <input type="text" name="phone" placeholder="Phone number eg. 0781234567" value={formData.phone} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
          </div>
          <div className="relative w-full">
            <input type="text" name="email" placeholder="Email eg. johndoe@gmail.com" value={(formData.email)} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} />
          </div>
          <div className="relative w-full">
            <select  name="prefered_payment"  id="" className="bg-neutral-900 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
             onChange={handleAccountChange}
             required
            >
              <option value={formData.prefered_payment} selected disabled>{formData.prefered_payment}</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          {account !== "Cash" && (
           <div className="relative w-full">
              <input type="text" placeholder={account+" Account"} name="account" value={formData.account} className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange}/>
            </div> 
          )}
          
          <div className="relative w-full">
            <select  name="title"  id="" className="bg-neutral-900 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
             onChange={handleInputChange}
             required
            >
              <option value={formData.title} selected disabled>{formData.title}</option>
              <option value="Individual">Individual</option>
              <option value="Institution">Instution</option>
              <option value="-">Other</option>
            </select>
          </div>
          <div className="relative w-full flex justify-end items-center">
            <button type="submit" className="flex items-center space-x-2 border bg-orange-900 border-orange-700 px-2 py-1 text-orange-400 cursor-pointer text-sm rounded-md">
              {loading && <Preloader />} <i className="bi bi-pencil mr-1"></i> Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edit;
