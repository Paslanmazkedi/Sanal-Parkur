import Link from 'next/link';
import AppIconMark from './AppIconMark';

const SIZE_MAP = {
  sm: {
    icon: 'h-7 w-7',
    title: 'text-sm',
    tagline: 'text-[9px]',
    gap: 'gap-2.5',
  },
  md: {
    icon: 'h-9 w-9',
    title: 'text-base',
    tagline: 'text-[10px]',
    gap: 'gap-3',
  },
  lg: {
    icon: 'h-12 w-12',
    title: 'text-xl',
    tagline: 'text-xs',
    gap: 'gap-3.5',
  },
};

export default function BrandLogo({
  size = 'md',
  showTagline = true,
  tagline = 'Kontrol Odası',
  href = '/',
  asLink = true,
  className = '',
}) {
  const config = SIZE_MAP[size] ?? SIZE_MAP.md;

  const content = (
    <div
      className={`inline-flex items-center ${config.gap} ${className}`}
      aria-label="Sanal Parkur"
    >
      <div
        className={`${config.icon} shrink-0 overflow-hidden rounded-[22%] border border-slate-800/80 bg-[#0A0A0A] shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/10`}
      >
        <AppIconMark className="h-full w-full" />
      </div>

      <div className="min-w-0 leading-tight">
        <p className={`${config.title} font-black tracking-[0.12em] text-white`}>
          Sanal{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
            Parkur
          </span>
        </p>

        {showTagline && (
          <p
            className={`${config.tagline} mt-0.5 font-mono uppercase tracking-[0.18em] text-slate-500`}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  );

  if (asLink && href) {
    return (
      <Link
        href={href}
        className="inline-flex rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        {content}
      </Link>
    );
  }

  return content;
}
