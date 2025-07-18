"use client";
import { useState } from "react";
import AlertNotification from "../menu/notify";

interface AdminPopupProps {
  onClose: () => void;
  onSuccess: () => void;
}
function formatDate(dateString: any) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1); // getMonth() is 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${Number(day)}/${Number(month)}/${year}`;
}

const AdminPopup = ({ onClose, onSuccess }: AdminPopupProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCheck = () => {
    const today = new Date();
    const date = formatDate(today);
    setError(date);
    if (password === "KSM-"+date) {
      localStorage.setItem("isAdmin", "true");
      onSuccess();
      onClose();
    } else {
      setError("Incorrect password!"); 
    }
  }; 
   
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
       {error && (<AlertNotification message={error} type="error" />)}
      <form className="bg-neutral-900 p-6 rounded-lg space-y-4 border border-neutral-700 w-[90%] max-w-sm">
        <h2 className="text-lg font-semibold text-white">Admin Access</h2>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-neutral-800 text-white border border-neutral-600 focus:outline-none"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-neutral-700 text-sm text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCheck}
            className="px-3 py-1 rounded bg-emerald-800 text-sm text-white"
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPopup;
