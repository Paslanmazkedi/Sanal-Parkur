export default function DashboardSection({ id, title, description, action, children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-6 ${className}`}>
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
