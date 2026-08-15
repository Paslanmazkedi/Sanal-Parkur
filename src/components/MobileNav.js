'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  MOBILE_TABS,
  PRODUCTION_LINKS,
  REPORTS_LINKS,
  REPORTS_SECTION_LABEL,
  WEX_LAB_LINKS,
  WEX_LAB_SECTION_LABEL,
  isExactOrNestedPath,
  isSectionActive,
} from '../lib/navigation';

function TabIcon({ sectionKey, active }) {
  const className = `h-5 w-5 ${active ? 'text-emerald-400' : 'text-current'}`;

  if (sectionKey === 'general') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
      </svg>
    );
  }

  if (sectionKey === 'production') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );
  }

  if (sectionKey === 'reports') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v4" />
        <path d="M12 11v8" />
        <path d="M16 7v12" />
      </svg>
    );
  }

  if (sectionKey === 'quality') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l7 4v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V7l7-4z" />
        <path d="m9.5 12 2 2 4-4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function SheetLinks({ title, links, pathname, onClose, activeClass = 'bg-emerald-600 text-white' }) {
  return (
    <>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-1">
        {links.map((link) => {
          const active = isExactOrNestedPath(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`block rounded-xl px-3 py-3 text-sm font-medium ${
                active ? activeClass : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const [productionOpen, setProductionOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const closeSheets = () => {
    setProductionOpen(false);
    setReportsOpen(false);
  };

  const sheetOpen = productionOpen || reportsOpen;

  return (
    <>
      {sheetOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-slate-950/70"
            onClick={closeSheets}
          />
          <div
            className="absolute inset-x-0 bottom-16 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 px-4 py-4 shadow-2xl"
            style={{ paddingBottom: '0.5rem' }}
          >
            {productionOpen ? (
              <>
                <SheetLinks title="Üretim" links={PRODUCTION_LINKS} pathname={pathname} onClose={closeSheets} />
                <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-violet-400/80">
                  {WEX_LAB_SECTION_LABEL}
                </p>
                <div className="space-y-1">
                  {WEX_LAB_LINKS.map((link) => {
                    const active = isExactOrNestedPath(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeSheets}
                        className={`block rounded-xl px-3 py-3 text-sm font-medium ${
                          active ? 'bg-violet-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <SheetLinks
                title={REPORTS_SECTION_LABEL}
                links={REPORTS_LINKS}
                pathname={pathname}
                onClose={closeSheets}
              />
            )}
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid h-16 grid-cols-5">
          {MOBILE_TABS.map((tab) => {
            const active = isSectionActive(pathname, tab.key);

            if (tab.key === 'production' || tab.key === 'reports') {
              const open = tab.key === 'production' ? productionOpen : reportsOpen;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    if (tab.key === 'production') {
                      setProductionOpen((value) => !value);
                      setReportsOpen(false);
                    } else {
                      setReportsOpen((value) => !value);
                      setProductionOpen(false);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                    active || open ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <TabIcon sectionKey={tab.key} active={active || open} />
                  <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.key}
                href={tab.href}
                onClick={closeSheets}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <TabIcon sectionKey={tab.key} active={active} />
                <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
