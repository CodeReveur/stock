"use client";

import { useState } from "react";

const Preferences = () => {
   const [isOn, setIsOn] = useState(false);

  return (
    <div className="">
      <div className="bg-neutral-900 text-neutral-400 flex justify-between px-4 py-5 rounded-xl">
        <div className="flex space-x-3 items-center">
          <i className="bi bi-sliders"></i><h4>Preferences</h4>
        </div>
       </div>
       <div className="grid gap-4 w-full my-6">
       <div className="p-5 bg-neutral-900 rounded-lg h-max">
       
       <div className="flex justify-between items-center">
         <h4 className="text-neutral-400 text-lg">Language change</h4>
       </div>
       <div className="px-1">
         <form method="post" className="py-3 text-neutral-500">
           <div className="relative w-full flex justify-between items-center">
             <h4 className="">Change language</h4>
             <select 
              name="batch" 
              id=""
              className="w-[20vw] bg-neutral-950 cursor-not-allowed rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 focus:border-emerald-700"
              disabled
             >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="pr">Portugue</option>
              </select>
           </div>
           <div className="text-neutral-600 text-xs">
             <i className="bi bi-info-circle text-emerald-700 px-1"></i> 
             This language change feature is comming soon
           </div>
         </form>
       </div>
       </div>
       <div className="p-5 bg-neutral-900 rounded-lg h-max">
       
       <div className="flex justify-between items-center">
         <h4 className="text-neutral-400 text-lg">Currency change</h4>
       </div>
       <div className="px-1">
         <form method="post" className="py-3 text-neutral-500">
           <div className="relative w-full flex justify-between items-center">
             <h4 className="">Change currency</h4>
             <select 
              name="batch" 
              id=""
              className="w-[20vw] bg-neutral-950 cursor-not-allowed rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 focus:border-emerald-700"
              disabled
             >
              <option value="RWF">RWF</option>
              <option value="FIFO">USD</option>
              <option value="LIFO">EUR</option>
              </select>
           </div>
           <div className="text-neutral-600 text-xs">
             <i className="bi bi-info-circle text-emerald-700 px-1"></i> 
             This currency change feature is comming soon
           </div>
         </form>
       </div>
       </div>

       <div className="p-5 bg-neutral-900 rounded-lg h-max">
       
       <div className="flex justify-between items-center">
         <h4 className="text-neutral-400 text-lg">Darkmode</h4>
       </div>
       <div className="px-1">
         <form method="post" className="py-3 text-neutral-500">
          <div className="relative w-full flex justify-between items-center">
            <h4 className="">Dark mode</h4>
            <div
              onClick={() => setIsOn(false)}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-not-allowed transition duration-300 ${
              isOn ? "bg-emerald-800" : "bg-neutral-950"
             }`}
            >
             <div
              className={`w-5 h-5 bg-neutral-300 rounded-full shadow-md transform transition duration-300 ${
              isOn ? "translate-x-7" : "translate-x-0"
              }`}
             ></div>
            </div>
          </div>
          <div className="text-neutral-600 text-xs">
            <i className="bi bi-info-circle text-emerald-700 px-1"></i> 
            Dark mode and light mode change feature is comming soon
          </div>
         </form>
       </div>
       </div>
       </div>
    </div>
  );
}
export default Preferences;