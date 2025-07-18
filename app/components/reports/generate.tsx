import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
import Preloader from "../menu/buttonPreloader";

const GenerateReport = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [formData, setFormData] = useState({
      type:  "",
      title: "",
      from_date: "",
      to_date: "",
      doc_type: "",
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const indicators = formData.type === "FGR" ? "financial_growth" : formData.type === "SOR" ? 'sales' : "purchase";

        const response = await fetch(`/api/reports/${indicators}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
  
        const result = await response.json();
        if (response.ok) {
          setSuccess("Report generated successfully");
          //onClose(); // Close the modal
          setLoading(false);
        } else {
          setError(result.error.message || "Failed to generate report");
          setLoading(false);
        }
      } catch (error) {
        setError("Something went wrong!: "+error);
        setLoading(false);
      }
    };
  
  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max">

      {error && (<AlertNotification message={error} type="error"/>)}
      {success && (<AlertNotification message={success} type="success"/>)}
            
      <form onSubmit={handleSubmit} className="grid grid-cols-5 items-center gap-4 w-full py-4 space-x-3">
          <div className="relative w-full flex"> 
            <select 
            name="type" 
            id=""
            onChange={handleInputChange}
            className="bg-neutral-900 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            required
           >
            <option value="">Select type</option>
            <option value="FGR">Financial Growth Overview Report</option>
            <option value="POR">Purchase Summary Report</option>
            <option value="SOR">Sale Overview Report</option>
           </select>
           </div> 
          <div className="relative w-full flex items-center space-x-2">
            <label htmlFor="from_date">From: </label>
            <input type="date" name="from_date" placeholder="Category name" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
          </div>
          <div className="relative w-full flex items-center space-x-2">
            <label htmlFor="to">To: </label>
            <input type="date" name="to_date" placeholder="Category name" className="bg-transparent rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700" onChange={handleInputChange} required />
          </div>
          <div className="relative w-full flex"> 
            <select 
            name="doc_type" 
            id=""
            onChange={handleInputChange}
            defaultValue={"PDF"}
            className="bg-neutral-900 rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            required
           >
            <option value="PDF">PDF</option>
            <option value="Excel" disabled>Excel</option>
           </select>
           </div> 
          <div className="relative w-full flex justify-center items-center pt-1">
            <button type="submit" className="flex items-center border bg-emerald-900 border-emerald-700 px-4 py-2 text-emerald-400 cursor-pointer text-sm rounded-md">
              {loading && (<Preloader />)} <i className="bi bi-download"></i> Generate
            </button>
          </div>
        </form>
    </div>
  );
}
export default GenerateReport;