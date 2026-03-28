export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#faf8ff] dark:bg-slate-950">
      
      {/* Left Section */}
      <div className="flex items-center gap-8">
        <span className="text-2xl font-black text-[#113069] dark:text-blue-200 font-['Manrope'] tracking-tight">
          TaskGenie
        </span>

        <div className="hidden md:flex gap-6">
          <a className="text-[#113069] dark:text-slate-400 font-medium hover:text-[#0053db] transition-colors text-sm">
            Dashboard
          </a>
          <a className="text-[#113069] dark:text-slate-400 font-medium hover:text-[#0053db] transition-colors text-sm">
            Calendar
          </a>
          <a className="text-[#113069] dark:text-slate-400 font-medium hover:text-[#0053db] transition-colors text-sm">
            Roadmap
          </a>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg">
          <span className="material-symbols-outlined text-sm text-outline">
            search
          </span>
          <input
            className="bg-transparent border-none text-xs focus:ring-0 w-32 outline-none"
            placeholder="Search roadmap..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-[#f2f3ff] rounded-lg transition-all">
            notifications
          </button>

          <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-[#f2f3ff] rounded-lg transition-all">
            settings
          </button>

          <button className="bg-primary hover:bg-primary-dim text-on-primary px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 duration-150 ease-in-out">
            New Assignment
          </button>
        </div>
      </div>
    </nav>
  )
}