import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
import Preloader from "../menu/buttonPreloader";

interface addProps{
  purchaseCode: string;
  onClose: () => void;
}

const ConfrimStock = ({ onClose, purchaseCode }: addProps) => {
   const [formData, setFormData] = useState({
      purchase_code: purchaseCode,
      label: "",
      supplier: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
 
    useEffect(() => {
     if (error || success) {
       const timer = setTimeout(() => {
         setError(null);
         setSuccess(null);
       }, 10000);
       return () => clearTimeout(timer);
     }
   }, [error, success]); // Fix here
   
 
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
     setFormData({ ...formData, [e.target.name]: e.target.value });
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     try {
       const response = await fetch("/api/purchase/confirm", {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(formData),
       });
 
       const result = await response.json();
       if (response.ok) {
         setSuccess("Purchase confirmed successfully");
         //onClose(); // Close the modal
         setLoading(false);
       } else {
         setError(""+result.error);
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
          <h4 className="text-neutral-400 font-semibold">Confirm Stock</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i> 
          Confirm purchase order, it will be added to live stock. Supplier TIN can be added in brackets ie. Eric Tech {"(140197884)"}
        </div>
        <form onSubmit={handleSubmit} className="py-3 space-y-3">
          <div className="relative w-full">
            <input type="text" placeholder="Purchase code" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" value={purchaseCode} disabled required />
          </div>
          <div className="relative w-full">
            <textarea name="label" id="label" placeholder="Label eg. March electronics order" className="bg-transparent resize-none rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" value={formData.label} onChange={handleInputChange} required></textarea>
          </div>
          <div className="relative w-full">
            <input type="text" name="supplier" placeholder="Supplier eg. Eric Tech (140197884)" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" value={formData.supplier} onChange={handleInputChange} required />
          </div>
          <div className="relative w-full flex justify-end items-center pt-4">
            <button type="submit" className="flex items-center space-x-1 border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              {loading && (<Preloader />)}<i className="bi bi-upload"></i> Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfrimStock;
