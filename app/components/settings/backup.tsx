"use client";

const Backups = () => {

  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max">
       
      <div className="flex justify-between items-center">
        <h4 className="text-neutral-400 text-lg">Backup</h4>
      </div>
      <div className="">
        <div className="text-neutral-600 text-sm my-1">
          <i className="bi bi-info-circle text-emerald-700 mr-1"></i> 
          This feature is underway, coming soon. 
        </div>
        <form method="post" className="py-3 space-y-3">
          <div className="relative w-full flex items-center pt-1">
            <button type="submit" className="border bg-neutral-950 border-neutral-700 px-4 py-2 text-neutral-400 text-sm rounded-md cursor-not-allowed" disabled>
              <i className="bi bi-check-circle"></i> Backup Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default  Backups;