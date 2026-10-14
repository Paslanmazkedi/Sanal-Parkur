import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';
import { applyStageAction } from '@/lib/operatorServer';

function getRequestIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 50);
  return (request.headers.get('x-real-ip') || '').slice(0, 50) || null;
}

export async function POST(request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth.user) return unauthorizedResponse(auth.error);

  try {
    const body = await request.json();
    const action = String(body.action || '').trim();
    const pOrderId = Number(body.p_order_id);
    const stationId = Number(body.station_id);

    if (!action || !Number.isFinite(pOrderId) || !Number.isFinite(stationId)) {
      return NextResponse.json(
        { success: false, error: 'action, p_order_id ve station_id zorunludur.' },
        { status: 400 },
      );
    }

    const updatedOrder = await applyStageAction({
      action,
      pOrderId,
      stationId,
      actorUserId: auth.user.id,
      pauseTypeId: body.prod_pause_type_id,
      pauseDetail: body.prod_detail,
      clientIp: getRequestIp(request),
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
