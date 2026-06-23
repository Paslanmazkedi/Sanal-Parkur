import { NextResponse } from 'next/server';
import { getCompanyOptions } from '@/lib/wexConfig';
import { fetchWexWorkstations } from '@/lib/wexSpInfoClient';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const data = await fetchWexWorkstations(companyId);

    return NextResponse.json({
      success: true,
      ...data,
      companyOptions: getCompanyOptions(),
    });
  } catch (error) {
    console.error('W3 workstations pull error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Workcube WEX istasyon verisi alinamadi.',
      },
      { status: 502 },
    );
  }
}
