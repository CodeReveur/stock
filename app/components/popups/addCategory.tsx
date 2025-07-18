import { useEffect, useState } from "react";
import Preloader from "../menu/buttonPreloader";
import AlertNotification from "../menu/notify";

interface addProps{
  onClose: () => void
}

const AddCategory = ({ onClose }: addProps) => {
  const [formData, setFormData] = useState({
     batch: "",
     name: "",
     low_limit: "",
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
  

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/categories/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Category added successfully");
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
          <h4 className="text-neutral-400 font-semibold">Add Category</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i> 
          Sub categories can be added the same way by now
        </div>
        <form onSubmit={handleSubmit} className="py-3 space-y-3">
          <select 
            name="batch" 
            id=""
            onChange={(e) => handleInputChange(e)}
            className="bg-neutral-900 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            required
          >
            <option value="">Select batch</option>
            <option value="FIFO">FIFO{" (First In First Out)"}</option>
            <option value="LIFO">LIFO{" (Last In First Out)"}</option>
          </select>
          <div className="relative w-full">
            <input type="text" name="name" placeholder="Category name" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
          </div>
          <div className="relative w-full" title="This help the system to know when to tell you stock is low, ie if your sales hit the limit low number you will be notified that stock is low">
            <input type="number" name="low_limit" placeholder="Limit number" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
          </div>
          <div className="relative w-full flex justify-end items-center pt-1">
            <button type="submit" className="flex items-center space-x-1 border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              {loading && (<Preloader />)}<i className="bi bi-upload"></i> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategory;
