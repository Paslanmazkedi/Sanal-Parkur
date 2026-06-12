"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, Fragment } from "react";
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
  // UI state for search and accordion
  const [searchTerm, setSearchTerm] = useState("");
  const [openRowId, setOpenRowId] = useState(null);

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

       {/* Management area: Search & Clean */}
       <div className="flex items-center justify-between mb-4">
         <div className="relative flex items-center w-64">
           <svg className="w-5 h-5 absolute left-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
           <input
             type="text"
             placeholder="İş emri no veya istasyon ara..."
             className="pl-8 pr-2 py-1 w-full rounded bg-slate-800 text-slate-200 focus:outline-none"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
         <button
           className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-600"
           onClick={() => console.log('Logları temizle')}
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2m-6 0h6" /></svg>
           Logları Temizle
         </button>
       </div>
       <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-wider text-slate-400">
               <tr>
                 <th className="px-3 py-3">Cihaz</th>
                 <th className="px-3 py-3">Sorgu</th>
                 <th className="px-3 py-3">Yön</th>
                 <th className="px-3 py-3">Tarih</th>
                 <th className="px-3 py-3">İşlem</th>
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

               {logs
                 .filter((log) => {
                   if (!searchTerm) return true;
                   const payload = log.payload || {};
                   const src = payload.payload || {};
                   const term = searchTerm.toLowerCase();
                   return (
                     (src.p_order_no && src.p_order_no.toString().toLowerCase().includes(term)) ||
                     (src.station_id && src.station_id.toString().toLowerCase().includes(term))
                   );
                 })
                 .map((log) => {
                   const payload = log.payload || {};
                   const src = payload.payload || {};
                   const device = src.station_id ? `İstasyon ${src.station_id}` : "-";
                   const query = src.p_order_no || "-";
                   const directionLabel = (
                     <span className="inline-flex rounded-md border px-2 py-1 text-xs font-semibold bg-sky-500/15 text-sky-300 border-sky-500/30">IN</span>
                   );
                   const time = new Date(log.created_at).toLocaleTimeString('tr-TR', { hour12: false });
                   const isOpen = openRowId === log.id;
                   return (
                      <Fragment key={log.id}>
                       <tr className="align-top odd:bg-slate-950/20">
                         <td className="px-3 py-3 text-slate-300">{device}</td>
                         <td className="px-3 py-3 text-slate-300">{query}</td>
                         <td className="px-3 py-3 text-slate-300">{directionLabel}</td>
                         <td className="px-3 py-3 text-slate-300">{time}</td>
                         <td className="px-3 py-3">
                           <button
                             className="text-blue-400 hover:underline"
                             onClick={() => setOpenRowId(isOpen ? null : log.id)}
                           >
                             {isOpen ? 'Detayları Gizle' : 'Detayları Göster'}
                           </button>
                         </td>
                       </tr>
                       {isOpen && (
                         <tr className="bg-slate-800/30">
                           <td colSpan={5} className="px-3 py-2">
                             <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-45 font-mono">
                               {JSON.stringify(payload, null, 2)}
                             </pre>
                           </td>
                         </tr>
                       )}
                     </Fragment>
                   );
                 })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
