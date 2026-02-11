interface SmoothButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function SmoothButton({ onClick, disabled, isProcessing }: SmoothButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className="px-8 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
    >
      {isProcessing ? (
        <>
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Analyzing...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          Analyze &amp; Smooth
        </>
      )}
    </button>
  );
}
