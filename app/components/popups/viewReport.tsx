import { useEffect, useState } from "react";
import AlertNotification from "../menu/notify";

interface ReportProps {
  report: {
    id: string;
    file_url: string;
    type: string;
    from_date: string;
    to_date: string;
    format: string;
    data: any;
    createdAt: string;
  };
  onClose: () => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const ViewReport = ({ report, onClose }: ReportProps) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDownload = () => {
    try {
      const blob = new Blob([JSON.stringify(report.data, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `report-${report.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Failed to download report: "+err);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 backdrop-blur-xs z-30">
      {error && <AlertNotification message={error} type="error" />}
      <div className="bg-neutral-900 p-5 rounded-xl w-[40vw] max-w-3xl max-h-[92vh]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-neutral-400 font-semibold">View Report</h4>
          <i
            className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2"
            onClick={onClose}
          ></i>
        </div>

        <div className="text-neutral-500 text-sm space-y-1 mb-4">
          <p><strong>Type:</strong> {report.type}</p>
          <p><strong>Format:</strong> {report.format}</p>
          <p><strong>From:</strong> {formatDate(report.from_date)}</p>
          <p><strong>To:</strong> {formatDate(report.to_date)}</p>
          <p><strong>Generated:</strong> {formatDate(report.createdAt)}</p>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded p-3 max-h-[45vh] overflow-y-auto text-sm text-green-400 font-mono whitespace-pre-wrap">
          {JSON.stringify(report.data, null, 2)}
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm bg-emerald-900 hover:bg-emerald-950 text-white cursor-pointer"
          >
            <i className="bi bi-download"></i>
            <span>Download JSON</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center space-x-1 border bg-gray-800 border-gray-600 px-3 py-1.5 text-gray-400 text-sm rounded-md cursor-pointer"
          >
            <i className="bi bi-x-circle mr-1"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewReport;
