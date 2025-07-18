"use client";
import CurrentCustomers from "@/app/components/customers/current";

interface ListProps{
  onAddClick: () => void;
}

const Customers = ({onAddClick}: ListProps) => {

  return (
    <div className="">
      <div className="bg-neutral-900 text-neutral-400 flex justify-between px-4 py-5 rounded-xl">
        <div className="flex space-x-3 items-center">
          <i className="bi bi-cash-stack"></i><h4>Customers</h4>
        </div>
        <div>
         <button
           onClick={onAddClick}
           title="Add customer"
           className="border border-neutral-500 p-[2px] px-2 text-sm rounded cursor-pointer hover:text-emerald-800 hover:border-emerald-800"
          ><i className="bi bi-plus"></i></button>
        </div>
       </div>
       <div className="grid gap-4 w-full">
        <CurrentCustomers />
       </div>
    </div>
  );
}
export default Customers;