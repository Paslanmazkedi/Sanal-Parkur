'use client';

import { useEffect, useState } from 'react';

function formatDate(date) {
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function LiveClock({ className = '' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <time
      dateTime={now.toISOString()}
      className={`shrink-0 text-right font-mono ${className}`.trim()}
      aria-label={`${formatDate(now)} ${formatTime(now)}`}
    >
      <span className="block text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">
        {formatDate(now)}
      </span>
      <span className="block text-xs font-semibold tabular-nums leading-tight text-slate-200 sm:text-sm">
        {formatTime(now)}
      </span>
    </time>
  );
}
