export default function Footer() {
  return (
    <footer className="bg-background/85 border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">

        {/* Left */}
        <div className="space-y-4">
          <span className="font-['Manrope'] font-bold text-foreground text-2xl">
            TaskGenie
          </span>
          <p className="text-xs text-muted-foreground max-w-xs">
            Make the next study block obvious.
          </p>
        </div>

        {/* Middle Links */}
        <div className="flex flex-wrap gap-8">
          <a className="text-muted-foreground hover:text-primary text-xs transition-colors">
            Privacy Policy
          </a>
          <a className="text-muted-foreground hover:text-primary text-xs transition-colors">
            Terms of Service
          </a>
          <a className="text-muted-foreground hover:text-primary text-xs transition-colors">
            AI Ethics
          </a>
          <a className="text-muted-foreground hover:text-primary text-xs transition-colors">
            Support
          </a>
        </div>

        {/* Right Icons */}
        <div className="flex gap-4">
          <button type="button" aria-label="Language settings" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-container text-muted-foreground transition-all hover:bg-surface-container-high hover:text-primary">
            <span className="material-symbols-outlined text-lg">
              language
            </span>
          </button>

          <button type="button" aria-label="Contact support" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-container text-muted-foreground transition-all hover:bg-surface-container-high hover:text-primary">
            <span className="material-symbols-outlined text-lg">
              alternate_email
            </span>
          </button>
        </div>

      </div>
    </footer>
  )
}
