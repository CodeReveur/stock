"use client";

const Danger = () => {

  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max border border-red-900">
       
      <div className="flex justify-between items-center">
        <h4 className="text-red-800 text-lg">Danger Zone</h4>
      </div>
      <div className="">
        <div className="text-neutral-600 text-sm my-1">
          <i className="bi bi-info-circle text-orange-700 mr-1"></i> 
          Uninstalling the software will lead to lost of informations, data, analytics, reports, you have not backed up, unless you first backup 
        </div>
        <form method="post" className="py-3 space-y-3">
          <div className="relative w-full flex items-center pt-1">
            <button type="submit" className="border border-red-700 px-2 py-1 text-red-800 cursor-pointer text-sm rounded-md">
              <i className="bi bi-trash"></i> Uninstall
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default  Danger;