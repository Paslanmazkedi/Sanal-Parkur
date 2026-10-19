import PageHeader from '@/components/PageHeader';

export default function ServicePage() {
  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      <PageHeader
        title="Servis"
        titleClassName="text-sky-100"
        crumbs={[{ label: 'Servis' }]}
      />

      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 px-4 py-16 text-center text-sm text-slate-500">
        İçerik oluşturulmadı.
      </div>
    </div>
  );
}
