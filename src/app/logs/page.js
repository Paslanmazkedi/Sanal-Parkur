"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "incoming", label: "Gelen" },
  { value: "outgoing", label: "Giden" },
];

function getOutcomeClass(outcome) {
  if (outcome === "SUCCESS") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (outcome === "FAILED") return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  return "bg-sky-500/15 text-sky-300 border-sky-500/30";
}

function getLogTitle(log) {
  const payload = log.payload || {};
  const event = payload.event || "log";
  const orderNo = payload.payload?.p_order_no || payload.details?.criteria?.p_order_no;
  return orderNo ? `${event} / ${orderNo}` : event;
}

export default function LogPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      let query = supabase
        .schema("production")
        .from("logs")
        .select("id, ip, payload, direction, created_at");

      if (filter !== "all") query = query.eq("direction", filter);

      const { data, error } = await query.order("created_at", { ascending: false }).limit(200);

      if (error) {
        console.error(error);
        setErrorMsg(`Loglar getirilemedi: ${error.message || "Bilinmeyen hata"}`);
        setLogs([]);
        return;
      }

      setErrorMsg("");
      setLogs(data || []);
    };

    fetchLogs();
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight">Üretim Entegrasyon Logları</h1>
        <p className="text-slate-400 text-sm mt-1">WEX üzerinden gelen paketler ve üretim emri güncelleme sonuçları.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === item.value ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">
          {errorMsg}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-3">Tarih</th>
              <th className="px-3 py-3">Yön</th>
              <th className="px-3 py-3">Sonuç</th>
              <th className="px-3 py-3">İşlem</th>
              <th className="px-3 py-3">IP</th>
              <th className="px-3 py-3">Özet</th>
              <th className="px-3 py-3">Ham Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.length === 0 && (
              <tr>
                <td colSpan="7" className="px-3 py-8 text-center text-slate-500">
                  Henüz log kaydı yok.
                </td>
              </tr>
            )}

            {logs.map((log) => {
              const payload = log.payload || {};
              const sourcePayload = payload.payload || {};
              const outcome = payload.outcome || "-";

              return (
                <tr key={log.id} className="align-top odd:bg-slate-950/20">
                  <td className="px-3 py-3 whitespace-nowrap text-slate-300">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 capitalize text-slate-300">{log.direction}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getOutcomeClass(outcome)}`}>
                      {outcome}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-200">{getLogTitle(log)}</td>
                  <td className="px-3 py-3 text-slate-400">{log.ip || "-"}</td>
                  <td className="px-3 py-3 text-slate-300">
                    <div>Emir: {sourcePayload.p_order_no || "-"}</div>
                    <div>İstasyon: {sourcePayload.station_id ?? "-"}</div>
                    <div>Stage: {sourcePayload.is_stage ?? "-"}</div>
                    <div>Sayaç: {sourcePayload.counter_value ?? "-"}</div>
                    {payload.error && <div className="mt-1 text-rose-300">Hata: {payload.error}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <pre className="max-w-xl whitespace-pre-wrap break-all rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
                      {JSON.stringify(payload, null, 2)}
                    </pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
