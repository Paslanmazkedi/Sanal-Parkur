import { supabase } from '@/supabase';

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Oturum bulunamadi. Lutfen tekrar giris yapin.');
  }
  return data.session.access_token;
}

async function operatorFetch(path, body) {
  const token = await getAccessToken();
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Islem basarisiz.');
  }
  return payload;
}

export function postOperatorAction({ action, pOrderId, stationId }) {
  return operatorFetch('/api/operator/action', {
    action,
    p_order_id: pOrderId,
    station_id: stationId,
  });
}

export function postTimeEntry({ pOrderId, stationId, entryDate, notes, lines }) {
  return operatorFetch('/api/operator/time', {
    p_order_id: pOrderId,
    station_id: stationId,
    entry_date: entryDate,
    notes,
    lines,
  });
}

export function postFinishReport({ pOrderId, stationId, notes, produced, consumed, scrap }) {
  return operatorFetch('/api/operator/finish', {
    p_order_id: pOrderId,
    station_id: stationId,
    notes,
    produced,
    consumed,
    scrap,
  });
}
