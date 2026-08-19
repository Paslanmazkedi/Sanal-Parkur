'use client';

import Link from 'next/link';

/**
 * Sayfa içi başlık: büyük title üstte, altında küçük yol izi (Raporlar › Duraklamalar).
 * Üst Navbar'da sayfa adı gösterilmez.
 */
export default function PageHeader({
  title,
  crumbs = [],
  description,
  titleClassName = 'text-white',
  actions = null,
  className = '',
}) {
  return (
    <header
      className={`flex items-start justify-between gap-3 ${className}`.trim()}
    >
      <div className="min-w-0 flex-1">
        <h1
          className={`text-3xl font-black tracking-tight md:text-4xl ${titleClassName}`.trim()}
        >
          {title}
        </h1>

        {crumbs.length > 0 ? (
          <nav
            aria-label="Sayfa yolu"
            className="mt-1.5 flex flex-wrap items-center gap-x-1 text-[11px] leading-none text-slate-400"
          >
            {crumbs.map((crumb, index) => {
              const key = `${crumb.label}-${index}`;
              const isLast = index === crumbs.length - 1;

              return (
                <span key={key} className="inline-flex items-center gap-x-1">
                  {index > 0 ? <span className="text-slate-600" aria-hidden>›</span> : null}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-slate-200"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-slate-300' : undefined}>{crumb.label}</span>
                  )}
                </span>
              );
            })}
          </nav>
        ) : null}

        {description ? (
          <div className="mt-2 max-w-2xl text-sm text-slate-400">{description}</div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-2 pt-1">{actions}</div>
      ) : null}
    </header>
  );
}
