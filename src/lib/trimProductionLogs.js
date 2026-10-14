export const LOG_KEEP_COUNT = 10;

export async function trimProductionLogs(supabaseClient, keep = LOG_KEEP_COUNT) {
  const { data: newest, error: listError } = await supabaseClient
    .schema('production')
    .from('logs')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(keep);

  if (listError) return { ok: false, error: listError.message, deleted: 0 };
  if (!newest?.length) return { ok: true, deleted: 0 };

  const keepIds = newest.map((row) => row.id);
  const { data: extra, error: extraError } = await supabaseClient
    .schema('production')
    .from('logs')
    .select('id')
    .not('id', 'in', `(${keepIds.join(',')})`);

  if (extraError) return { ok: false, error: extraError.message, deleted: 0 };
  if (!extra?.length) return { ok: true, deleted: 0 };

  const { error: deleteError } = await supabaseClient
    .schema('production')
    .from('logs')
    .delete()
    .not('id', 'in', `(${keepIds.join(',')})`);

  if (deleteError) return { ok: false, error: deleteError.message, deleted: 0 };
  return { ok: true, deleted: extra.length };
}
