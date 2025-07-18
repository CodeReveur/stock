const WindowControls = () => {
  return (
    <div className="flex items-center gap-3 text-neutral-400">
      <button
        onClick={() => window.electronAPI.minimize()}
         className="border border-neutral-500 py-1 px-2 text-sm rounded-full cursor-pointer hover:text-emerald-800 hover:border-emerald-800 relative"
      >
        <i className="bi bi-dash"></i>
      </button>
      <button
        onClick={() => window.electronAPI.maximize()}
         className="border border-neutral-500 py-1 px-2 text-sm rounded-full cursor-pointer hover:text-emerald-800 hover:border-emerald-800 relative"
      >
        <i className="bi bi-arrows-fullscreen"></i>
      </button>
      <button
        onClick={() => window.electronAPI.close()}
         className="border border-neutral-500 py-1 px-2 text-sm rounded-full cursor-pointer hover:text-emerald-800 hover:border-emerald-800 relative"
      >
        <i className="bi bi-x"></i>
      </button>
    </div>
  );
};

export default WindowControls;
