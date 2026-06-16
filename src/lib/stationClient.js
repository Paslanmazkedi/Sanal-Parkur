'use client';

const STORAGE_KEY = 'station_device_key';

export function getStoredDeviceKey() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORAGE_KEY) || '';
}

export function setStoredDeviceKey(deviceKey) {
  if (typeof window === 'undefined') return;
  if (deviceKey) {
    window.localStorage.setItem(STORAGE_KEY, deviceKey);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export async function fetchStationOrders({ deviceKey, stationId, apiKey }) {
  const params = new URLSearchParams();
  if (stationId) params.set('station_id', String(stationId));

  const headers = {};
  if (deviceKey) headers['x-device-key'] = deviceKey;
  if (apiKey) headers['x-wex-api-key'] = apiKey;

  const response = await fetch(`/api/station/orders?${params.toString()}`, { headers });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Istasyon verisi alinamadi.');
  }

  return payload;
}

export async function fetchStationContext({ deviceKey, stationId, apiKey }) {
  const params = new URLSearchParams();
  if (stationId) params.set('station_id', String(stationId));

  const headers = {};
  if (deviceKey) headers['x-device-key'] = deviceKey;
  if (apiKey) headers['x-wex-api-key'] = apiKey;

  const response = await fetch(`/api/station/context?${params.toString()}`, { headers });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Istasyon baglami alinamadi.');
  }

  return payload;
}
