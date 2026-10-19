import { serverSupabase as supabase } from '@/lib/serverSupabase';
import { trimProductionLogs } from '@/lib/trimProductionLogs';
import {
  getDefaultCompanyId,
  getWexPushStagePath,
  getWexSpInfoBaseUrl,
  isWexStagePushEnabled,
} from '@/lib/wexConfig';
import { formatWexFetchError, wexFetch } from '@/lib/wexFetch';

export function buildSpWexPushPayload({ order, isStage, companyId }) {
  return {
    P_ORDER_NO: order?.p_order_no || null,
    P_ORDER_ID: order?.p_order_id ?? null,
    STATION_ID: order?.station_id ?? null,
    IS_STAGE: Number(isStage),
    COMPANY_ID: companyId ?? getDefaultCompanyId(),
  };
}

async function writePushLog({ outcome, payload, error, details }) {
  const { error: logError } = await supabase.schema('production').from('logs').insert({
    direction: 'outgoing',
    ip: 'workcube',
    payload: {
      integration: 'wex',
      domain: 'production',
      event: 'wex_stage_push',
      outcome,
      error: error || null,
      details: details || null,
      payload,
    },
  });
  if (logError) {
    console.error('WEX stage push log insert error:', logError);
    return;
  }
  await trimProductionLogs(supabase);
}

export async function pushProductionOrderStage({ order, isStage, action = null }) {
  if (!order?.p_order_no && order?.p_order_id == null) {
    return { ok: false, skipped: true, error: 'Emir kimligi yok.' };
  }

  if (!isWexStagePushEnabled()) {
    return { ok: true, skipped: true };
  }

  const payload = buildSpWexPushPayload({ order, isStage });
  const url = `${getWexSpInfoBaseUrl()}/${getWexPushStagePath()}`;

  try {
    const response = await wexFetch(url, { method: 'POST', body: payload });
    const rawText = await response.text();
    let parsed = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const error = `Workcube stage push basarisiz (${response.status})`;
      await writePushLog({
        outcome: 'FAILED',
        payload,
        error,
        details: { url, action, status: response.status, body: rawText.slice(0, 400) },
      });
      return { ok: false, error, status: response.status };
    }

    await writePushLog({
      outcome: 'SUCCESS',
      payload,
      details: { url, action, status: response.status, response: parsed || rawText.slice(0, 400) },
    });
    return { ok: true, status: response.status, response: parsed };
  } catch (err) {
    const error = formatWexFetchError(err);
    await writePushLog({
      outcome: 'FAILED',
      payload,
      error,
      details: { url, action },
    });
    return { ok: false, error };
  }
}
