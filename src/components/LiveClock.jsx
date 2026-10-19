'use client';

import { useEffect, useState } from 'react';

function formatClock(date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
      className={`shrink-0 font-mono text-sm font-semibold tabular-nums text-slate-200 ${className}`.trim()}
      aria-label="Saat"
    >
      {formatClock(now)}
    </time>
  );
}
