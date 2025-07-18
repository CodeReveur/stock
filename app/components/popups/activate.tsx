import { useEffect, useState } from "react";
import Preloader from "../menu/buttonPreloader";
import AlertNotification from "../menu/notify";

const Activate = () => {
  const [formData, setFormData] = useState({
    key: "",
    appId: "",
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
  }, [error, success]);

  const formatKey = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleanedValue = value.replace(/[^A-Za-z0-9]/g, '');

    // Split the cleaned value into segments of 4 characters each
    const segments = cleanedValue.match(/.{1,4}/g) || [];

    // Join the segments with hyphens
    return segments.join('-').toUpperCase();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const formattedKey = formatKey(e.target.value);
    setFormData({ ...formData, [e.target.name]: formattedKey });
  };

  useEffect(() => {
   const CreateKey = async () => {
    //setLoading(true);
    try {
      const res = await fetch("/api/auth/key");
      if(res.ok){
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to produce:", err);
      setLoading(false);
    }
   };
   CreateKey();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/activate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess("Activated successfully");
        window.location.reload();
        setLoading(false);
      } else {
        setError("" + result.message);
        setLoading(false);
      }
    } catch (error) {
      setError("Something went wrong!: " + error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-neutral-950 backdrop-blur-3xl z-50">
      {success && <AlertNotification message={success} type="success" />}
      {error && <AlertNotification message={error} type="error" />}

      <div className="bg-neutral-900 py-5 px-10 rounded-xl w-[30vw] max-w-md">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">Enter the appId and product key</h4>
        </div>

        <form onSubmit={handleSubmit} className="py-3 space-y-5">
          <div className="relative w-full space-y-4">
            <input
              type="text"
              name="appId"
              placeholder="AppId eg. 88971b..."
              className="bg-transparent rounded-md outline-0 text-xl border border-neutral-700 py-2 px-5 text-neutral-500 w-full focus:border-emerald-700 text-center"
              onChange={handleInputChange}
              value={formData.appId}
              required
            />
            <input
              type="text"
              name="key"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="bg-transparent rounded-md outline-0 text-xl border border-neutral-700 py-2 px-5 text-neutral-500 w-full focus:border-emerald-700 text-center"
              max={19}
              maxLength={19}
              onChange={handleInputChange}
              value={formData.key}
              required
            />
          </div>
          <div className="relative w-full flex justify-between items-center pt-1">
            <a href={`https://kamero.rw/contact-us?auth=KSM_ID_${new Date().getMonth()}&access=${new Date().getDate()}APS`} target="_blank" rel="noopener noreferrer" className="text-sm mr-2 text-orange-700">Lost key?</a>
            <button
              type="submit"
              className="flex items-center space-x-1 border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md"
            >
              {loading && <Preloader />}
              <i className="bi bi-check-circle mr-1"></i> ACTIVATE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Activate;
