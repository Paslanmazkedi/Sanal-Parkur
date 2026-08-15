'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { resolveKioskEnabled } from '@/lib/kiosk';

export function useOperatorKiosk() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useMemo(() => resolveKioskEnabled(pathname, searchParams), [pathname, searchParams]);
}
