interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="28" height="28" rx="6" className="fill-[#0B1120] dark:fill-[#2563EB]" />
        <path
          d="M8.5 8.5H13.5C17.0899 8.5 19.5 10.9101 19.5 14C19.5 17.0899 17.0899 19.5 13.5 19.5H8.5V8.5Z"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="13.5" cy="14" r="2" className="fill-[#06B6D4]" />
      </svg>
      <span className="font-display font-bold tracking-tight text-[#0B1120] dark:text-white text-[17px]">
        DayTech Solutions
      </span>
    </span>
  );
}
