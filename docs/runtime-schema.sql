-- =============================================================================
-- Sanal Parkur — Runtime katmanı (Faz 1)
-- =============================================================================
-- Amaç:
--   Workcube ERP emir/istasyon master verisini OKUR;
--   saha gerçeğini (sayaç, duruş, cycle time, OEE girdileri) burada tutar;
--   emir bitince production_result_packages ile WEX'e paket gönderir.
--
-- Calistirma: Supabase SQL Editor (production schema mevcut olmali).
-- Onceden: docs/operator-workflow-schema.sql, docs/station-oee-schema.sql
-- =============================================================================

grant usage on schema production to service_role;
grant all privileges on all tables in schema production to service_role;
grant all privileges on all sequences in schema production to service_role;

-- -----------------------------------------------------------------------------
-- 0) Referans: durus / duraklatma nedenleri (Industry 4.0 — ERP'de yok)
-- -----------------------------------------------------------------------------
create table if not exists production.downtime_reasons (
  code text primary key,
  label text not null,
  category text not null check (category in ('pause', 'fault', 'changeover', 'material', 'quality', 'other')),
  is_planned boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

insert into production.downtime_reasons (code, label, category, is_planned, sort_order)
values
  ('PAUSE_BREAK', 'Mola', 'pause', true, 10),
  ('PAUSE_OPERATOR', 'Operatör duraklatma', 'pause', false, 20),
  ('FAULT_MACHINE', 'Makine arizasi', 'fault', false, 30),
  ('FAULT_TOOLING', 'Kalip / aparat', 'fault', false, 40),
  ('CHANGEOVER', 'Format degisimi', 'changeover', true, 50),
  ('MAT_SHORTAGE', 'Malzeme bekleme', 'material', false, 60),
  ('QUALITY_HOLD', 'Kalite kontrol bekleme', 'quality', false, 70),
  ('OTHER', 'Diger', 'other', false, 99)
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- 1) ERP eslestirme (Workcube WEX id <-> saha istasyonu)
-- -----------------------------------------------------------------------------
create table if not exists production.integration_mappings (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('station', 'order', 'product')),
  wex_company_id integer not null default 1,
  wex_external_id text not null,
  local_station_id integer,
  local_p_order_id integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, wex_company_id, wex_external_id)
);

create index if not exists integration_mappings_station_idx
on production.integration_mappings(local_station_id)
where entity_type = 'station';

-- -----------------------------------------------------------------------------
-- 2) Runtime oturumu — operatör ekraninin kalbi
-- -----------------------------------------------------------------------------
create table if not exists production.order_runtime_sessions (
  id uuid primary key default gen_random_uuid(),

  wex_company_id integer not null default 1,
  wex_p_order_id integer not null,
  p_order_no text,
  station_id integer not null,
  product_name text,
  lot_no text,

  runtime_status text not null default 'queued'
    check (runtime_status in ('queued', 'running', 'paused', 'finished', 'cancelled')),

  erp_stage integer,
  erp_stage_label text,

  target_quantity numeric(14,4),
  good_quantity numeric(14,4) not null default 0,
  scrap_quantity numeric(14,4) not null default 0,
  rework_quantity numeric(14,4) not null default 0,

  ideal_cycle_sec numeric(10,3),
  last_cycle_sec numeric(10,3),
  avg_cycle_sec numeric(10,3),

  run_sec integer not null default 0,
  down_sec integer not null default 0,

  pulse_count integer not null default 0,
  last_pulse_at timestamptz,

  active_operator_id uuid references production.operators(id),
  started_at timestamptz,
  last_resume_at timestamptz,
  paused_at timestamptz,
  finished_at timestamptz,

  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (wex_company_id, wex_p_order_id, station_id)
);

create index if not exists order_runtime_sessions_station_active_idx
on production.order_runtime_sessions(station_id, runtime_status)
where runtime_status in ('queued', 'running', 'paused');

create unique index if not exists order_runtime_sessions_one_active_per_station_uidx
on production.order_runtime_sessions(station_id)
where runtime_status in ('running', 'paused');

-- -----------------------------------------------------------------------------
-- 3) Sayaç olaylari — operatör veya IoT
-- -----------------------------------------------------------------------------
create table if not exists production.counter_events (
  id bigserial primary key,
  session_id uuid not null references production.order_runtime_sessions(id) on delete cascade,
  station_id integer not null,
  source text not null check (source in ('operator', 'plc', 'vision', 'manual_adjust', 'system')),
  event_type text not null default 'good'
    check (event_type in ('good', 'scrap', 'rework', 'pulse', 'reset')),
  delta numeric(14,4) not null default 1,
  quantity_after numeric(14,4),
  cycle_sec numeric(10,3),
  device_key text,
  operator_id uuid references production.operators(id),
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index if not exists counter_events_session_idx
on production.counter_events(session_id, recorded_at desc);

-- -----------------------------------------------------------------------------
-- 4) Duruş olaylari
-- -----------------------------------------------------------------------------
create table if not exists production.downtime_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references production.order_runtime_sessions(id) on delete set null,
  station_id integer not null,
  wex_p_order_id integer,
  reason_code text references production.downtime_reasons(code),
  reason_label text,
  category text not null default 'pause'
    check (category in ('pause', 'fault', 'changeover', 'material', 'quality', 'other')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_sec integer,
  opened_by uuid,
  closed_by uuid,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists downtime_events_station_open_idx
on production.downtime_events(station_id, started_at desc)
where ended_at is null;

-- -----------------------------------------------------------------------------
-- 5) Bitir paketi — WEX export
-- -----------------------------------------------------------------------------
create table if not exists production.production_result_packages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references production.order_runtime_sessions(id),
  finish_report_id uuid references production.order_finish_reports(id),
  wex_company_id integer not null default 1,
  wex_p_order_id integer not null,
  station_id integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'sealed', 'export_pending', 'exported', 'export_failed')),
  payload jsonb not null default '{}'::jsonb,
  sealed_at timestamptz,
  exported_at timestamptz,
  wex_response jsonb,
  export_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists production_result_packages_status_idx
on production.production_result_packages(status, created_at desc);

-- -----------------------------------------------------------------------------
-- 6) Mevcut tablolara runtime baglantisi
-- -----------------------------------------------------------------------------
alter table production.operator_actions
  add column if not exists session_id uuid references production.order_runtime_sessions(id);

alter table production.order_time_entries
  add column if not exists session_id uuid references production.order_runtime_sessions(id);

alter table production.order_finish_reports
  add column if not exists session_id uuid references production.order_runtime_sessions(id);

alter table production.station_events
  add column if not exists session_id uuid references production.order_runtime_sessions(id);

-- -----------------------------------------------------------------------------
-- 7) OEE girdileri gorunumu
-- -----------------------------------------------------------------------------
create or replace view production.v_runtime_oee_inputs as
select
  s.id as session_id,
  s.station_id,
  s.wex_p_order_id,
  s.p_order_no,
  s.runtime_status,
  s.target_quantity,
  s.good_quantity,
  s.scrap_quantity,
  s.run_sec,
  s.down_sec,
  s.avg_cycle_sec,
  s.ideal_cycle_sec,
  s.pulse_count,
  case
    when (s.run_sec + s.down_sec) > 0
      then round(100.0 * s.run_sec / (s.run_sec + s.down_sec), 2)
    else 0
  end as availability_pct,
  case
    when s.run_sec > 0 and s.ideal_cycle_sec is not null and s.good_quantity > 0
      then least(100, round(100.0 * (s.ideal_cycle_sec * s.good_quantity) / s.run_sec, 2))
    when s.target_quantity > 0
      then least(100, round(100.0 * s.good_quantity / s.target_quantity * 100, 2))
    else null
  end as performance_pct,
  case
    when (s.good_quantity + s.scrap_quantity) > 0
      then round(100.0 * s.good_quantity / (s.good_quantity + s.scrap_quantity), 2)
    else 100
  end as quality_pct
from production.order_runtime_sessions s
where s.runtime_status in ('running', 'paused', 'finished');

-- Faz 2 plan: telemetry_samples, routing_standards, station_oee_snapshots doldurma job
