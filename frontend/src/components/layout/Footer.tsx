export default function Footer() {
  return (
    <footer className="bg-[#faf8ff] dark:bg-slate-950 border-t border-[#98b1f2]/10 py-16">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">

        {/* Left */}
        <div className="space-y-4">
          <span className="font-['Manrope'] font-bold text-[#113069] text-2xl">
            TaskGenie
          </span>
          <p className="text-xs text-[#113069]/60 max-w-xs">
            © 2024 TaskGenie AI. Intelligent Quietude for the Cognitive Elite.
          </p>
        </div>

        {/* Middle Links */}
        <div className="flex flex-wrap gap-8">
          <a className="text-[#113069]/60 hover:text-[#0053db] text-xs transition-colors">
            Privacy Policy
          </a>
          <a className="text-[#113069]/60 hover:text-[#0053db] text-xs transition-colors">
            Terms of Service
          </a>
          <a className="text-[#113069]/60 hover:text-[#0053db] text-xs transition-colors">
            AI Ethics
          </a>
          <a className="text-[#113069]/60 hover:text-[#0053db] text-xs transition-colors">
            Support
          </a>
        </div>

        {/* Right Icons */}
        <div className="flex gap-4">
          <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-[#113069]/60 hover:text-primary transition-all">
            <span className="material-symbols-outlined text-lg">
              language
            </span>
          </button>

          <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-[#113069]/60 hover:text-primary transition-all">
            <span className="material-symbols-outlined text-lg">
              alternate_email
            </span>
          </button>
        </div>

      </div>
    </footer>
  )
}