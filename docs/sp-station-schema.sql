-- SP_STATION — IoT kutu son nabzi (Sanal Parkur).
-- Emir / sonuc / QC tablolarina yazmaz. Guc vs payload JSON.
-- Calistirildiysa tekrar calistirmayin (IF NOT EXISTS).

grant usage on schema production to service_role;

create table if not exists production.sp_station (
  station_id bigint primary key,
  device_id uuid,
  overall_count numeric(14,4),
  machine_status smallint
    check (machine_status is null or machine_status in (0, 1, 2)),
  plc_p_order_id bigint,
  queue_p_order_id bigint,
  queue_quantity numeric(14,4),
  read_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table production.sp_station is
  'SP_STATION — IoT son paket. Kimlik: x-device-key (sonra integration_devices).';

grant select on production.sp_station to anon, authenticated;
grant insert, update on production.sp_station to authenticated;

alter table production.sp_station disable row level security;
