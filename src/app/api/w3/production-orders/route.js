import { NextResponse } from 'next/server';
import { getCompanyOptions } from '@/lib/wexConfig';
import { fetchWexProductionOrders } from '@/lib/wexSpInfoClient';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const startDate = searchParams.get('start_date') || undefined;
    const finishDate = searchParams.get('finish_date') || undefined;
    const data = await fetchWexProductionOrders(companyId, { startDate, finishDate });

    return NextResponse.json({
      success: true,
      ...data,
      companyOptions: getCompanyOptions(),
    });
  } catch (error) {
    console.error('W3 production orders pull error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Workcube WEX uretim emri verisi alinamadi.',
      },
      { status: 502 },
    );
  }
}
