import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 p-1.5 sm:p-3 bg-white/90 backdrop-blur border-b border-indigo-100 dark:bg-slate-900/90 dark:border-slate-700">
      <div className="min-w-0">
        <h2 className="text-[10px] sm:text-sm md:text-base font-semibold tracking-wide text-gray-800 dark:text-slate-100 truncate">
          EnviroEdge AI Console
        </h2>
        <p className="hidden sm:block text-[11px] sm:text-xs text-gray-500 dark:text-slate-400">
          Live Environment and Risk Analytics
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 justify-end">
        <span className="hidden md:inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          System Online
        </span>
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Navbar;