import CreateDoc from "@/app/components/popups/docCreate";
import GenerateReport from "@/app/components/reports/generate";
import RecentReports from "@/app/components/reports/recent";
import { useState } from "react";

const Reports = () => {
  const [isOn, setIsOn] = useState(false);
  const closeDocCreate = () => {
    setIsOn(false);
  }
  return (
    <div className="">
      <div className="bg-neutral-900 text-neutral-400 flex justify-between px-4 py-5 rounded-xl">
        <div className="flex space-x-3 items-center">
          <i className="bi bi-bar-chart"></i><h4>Reports</h4>
        </div>
        <button
           onClick={() => setIsOn(!isOn)}
           className="border border-neutral-500 p-[2px] px-2 text-sm rounded cursor-pointer hover:text-emerald-800 hover:border-emerald-800"
          ><i className="bi bi-plus-circle"></i> Create Document</button>
       </div>
       <div className="grid gap-4 w-full my-6">
        <GenerateReport />
        <RecentReports />
       </div>
       {isOn && (<CreateDoc onClose={closeDocCreate} />)}
    </div>
  );
}
export default Reports;