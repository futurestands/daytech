import { useState } from 'react';
import { Layers } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackLabel,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Layers className="w-8 h-8 mb-2 text-[#2563EB]" strokeWidth={1.5} />
        <span className="text-xs font-medium text-center">{fallbackLabel || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
