"use client";
import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";
import Preloader from "../menu/buttonPreloader";

interface Data {
  id: number;
  site_name: string;
  contact_email: string;
  contact_phone: string;
  tin: string;
  address: string;
  stamp_url?: string; // Assuming server might return a stamp URL
}

const ChangeName = () => {
  const [loading, setLoading] = useState(false);
  const [appData, setAppData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    app_name: "",
    phone: "",
    email: "",
    tin: "",
    address: "",
  });
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/settings/get`);
        if (!response.ok) throw new Error("Failed to fetch settings.");
        const settings = await response.json();
        setAppData(settings);
        setFormData({
          app_name: settings.site_name || "",
          phone: settings.contact_phone || "",
          email: settings.contact_email || "",
          tin: settings.tin || "",
          address: settings.address || "",
        });
        if (settings.stamp_url) {
          setPreviewUrl(settings.stamp_url);
        }
      } catch (error: any) {
        setError("Error fetching settings: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStampFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Preview the file
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const uploadData = new FormData();
      uploadData.append("app_name", formData.app_name);
      uploadData.append("phone", formData.phone);
      uploadData.append("email", formData.email);
      uploadData.append("tin", formData.tin);
      uploadData.append("address", formData.address);
      if (stampFile) {
        uploadData.append("stamp", stampFile);
      }

      const res = await fetch("/api/settings/app_name", {
        method: "PATCH",
        body: uploadData,
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Details updated successfully!");
      } else {
        setError("Failed to update details.");
      }
    } catch (err: any) {
      setError("Unexpected error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max">
      {error && <AlertNotification message={error} type="error" />}
      {success && <AlertNotification message={success} type="success" />}

      <div className="flex justify-between items-center mb-2">
        <h4 className="text-neutral-400 text-lg">Edit Company Details</h4>
      </div>

      <div className="text-neutral-600 text-sm mb-4">
        <i className="bi bi-info-circle text-emerald-700 mr-1"></i>
        Changing business details will affect reports, emails, and notifications.
      </div>

      <form className="space-y-3" onSubmit={handleSave}>
        <div className="grid grid-cols-5 gap-2">
          <input
            type="text"
            name="app_name"
            placeholder="Business name e.g. Kamero Stock Management"
            className="bg-transparent rounded-md border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            value={formData.app_name}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone number e.g. +250781121117"
            className="bg-transparent rounded-md border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email e.g. info@kamero.rw"
            className="bg-transparent rounded-md border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="tin"
            placeholder="TIN Number"
            className="bg-transparent rounded-md border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            value={formData.tin}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            className="bg-transparent rounded-md border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            value={formData.address}
            onChange={handleInputChange}
            required
          />

          <div className="col-span-4">
            <label className="text-neutral-400 text-sm mb-1 block">
              Upload Stamp
            </label>
            <input
              type="file"
              name="stamp"
              accept="image/*"
              onChange={handleFileChange}
              className="bg-transparent rounded-md border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700"
            />
            {previewUrl && (
              <div className="mt-2">
                <img
                  src={previewUrl}
                  alt="Stamp Preview"
                  className="w-32 h-32 object-contain border border-neutral-700 rounded-md"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center border bg-emerald-900 border-emerald-700 px-3 py-1.5 text-emerald-400 text-sm rounded-md"
          >
            {loading && <Preloader />}
            <i className="bi bi-upload mr-2" />
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangeName;
