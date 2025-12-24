interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function HamburgerButton({ isOpen, onClick, className = '' }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-11 h-11 flex items-center justify-center rounded-md hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="w-6 h-5 relative flex flex-col justify-between">
        {/* Top bar */}
        <span
          className={`block h-0.5 w-full bg-slate-100 transition-all duration-300 ease-in-out ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        {/* Middle bar */}
        <span
          className={`block h-0.5 w-full bg-slate-100 transition-all duration-300 ease-in-out ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* Bottom bar */}
        <span
          className={`block h-0.5 w-full bg-slate-100 transition-all duration-300 ease-in-out ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </div>
    </button>
  );
}
