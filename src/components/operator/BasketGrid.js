'use client';

const COLUMNS = [
  { key: 'stock_code', label: 'Stok Kodu', width: 'min-w-[110px]' },
  { key: 'product_name', label: 'Urun Adi', width: 'min-w-[140px]' },
  { key: 'spec', label: 'Spec', width: 'min-w-[100px]' },
  { key: 'lot_no', label: 'Lot No', width: 'min-w-[100px]' },
  { key: 'serial_no', label: 'Seri No', width: 'min-w-[100px]' },
  { key: 'quantity', label: 'Adet', width: 'min-w-[80px]' },
  { key: 'unit', label: 'Birim', width: 'min-w-[80px]' },
];

const toneClasses = {
  emerald: 'border-emerald-500/30 bg-emerald-500/5',
  sky: 'border-sky-500/30 bg-sky-500/5',
  rose: 'border-rose-500/30 bg-rose-500/5',
};

export default function BasketGrid({ title, tone = 'emerald', lines, onChange, onAddLine, onRemoveLine }) {
  const updateLine = (index, key, value) => {
    const next = lines.map((line, i) => (i === index ? { ...line, [key]: value } : line));
    onChange(next);
  };

  return (
    <section className={`rounded-2xl border p-4 ${toneClasses[tone] || toneClasses.emerald}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">{title}</h3>
        <button
          type="button"
          onClick={onAddLine}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-white"
        >
          + Satir Ekle
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
              {COLUMNS.map((col) => (
                <th key={col.key} className={`px-2 py-2 ${col.width}`}>
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2 w-16" />
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-slate-500">
                  Henuz satir yok.
                </td>
              </tr>
            )}
            {lines.map((line, index) => (
              <tr key={index} className="border-t border-slate-800/80">
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-2 py-2">
                    <input
                      type={col.key === 'quantity' ? 'number' : 'text'}
                      min={col.key === 'quantity' ? '0' : undefined}
                      step={col.key === 'quantity' ? 'any' : undefined}
                      value={line[col.key]}
                      onChange={(e) => updateLine(index, col.key, e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-sm text-white"
                    />
                  </td>
                ))}
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => onRemoveLine(index)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
