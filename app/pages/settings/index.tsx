"use client";

import Backups from "@/app/components/settings/backup";
import Danger from "@/app/components/settings/danger";
import ChangeName from "@/app/components/settings/name";
import ReportsNotifications from "@/app/components/settings/reports";
import Support from "@/app/components/settings/support";


const Settings = () => {

  return (
    <div className="">
      <div className="bg-neutral-900 text-neutral-400 flex justify-between px-4 py-5 rounded-xl">
        <div className="flex space-x-3 items-center">
          <i className="bi bi-gear"></i><h4>Settings</h4>
        </div>
       </div>
       <div className="grid gap-4 w-full my-6">
        <ChangeName />
        <ReportsNotifications />
        <Support />
        <Backups />
        <Danger />
       </div>
    </div>
  );
}
export default Settings;