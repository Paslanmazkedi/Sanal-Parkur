-- Gelecek OEE ve operatör kimlik katmanı.
-- MVP ekranları mevcut production_orders + workstations ile calisir.
-- Asagidaki tablolar dolduruldukca /lib/oee.js gercek metriklere gecirilebilir.

-- Istasyon olaylari: baslat, durdur, ariza, vardiya
create table if not exists production.station_events (
  id bigserial primary key,
  station_id integer not null,
  p_order_id integer,
  event_type text not null, -- run_start, run_stop, fault, shift_start, shift_end
  duration_sec integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists station_events_station_id_idx
on production.station_events(station_id, created_at desc);

-- Vardiya / gunluk OEE snapshot (hesaplanmis degerler)
create table if not exists production.station_oee_snapshots (
  id bigserial primary key,
  station_id integer not null,
  shift_date date not null,
  shift_name text not null default 'default',
  planned_sec integer not null default 0,
  run_sec integer not null default 0,
  down_sec integer not null default 0,
  good_count integer not null default 0,
  total_count integer not null default 0,
  scrap_count integer not null default 0,
  availability_pct numeric(5,2) not null default 0,
  performance_pct numeric(5,2) not null default 0,
  quality_pct numeric(5,2) not null default 0,
  oee_pct numeric(5,2) not null default 0,
  calculated_at timestamptz not null default now(),
  unique (station_id, shift_date, shift_name)
);

-- Operatör kimligi (RFID / kart / badge)
create table if not exists production.operators (
  id uuid primary key default gen_random_uuid(),
  operator_code text not null unique,
  full_name text not null,
  rfid_uid text unique,
  default_station_id integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Operatör oturumlari (RFID okuma veya cihaz acilisi)
create table if not exists production.operator_sessions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references production.operators(id),
  station_id integer not null,
  device_key text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists operator_sessions_station_idx
on production.operator_sessions(station_id, started_at desc);

-- Ornek: WEX is_stage degisince station_events'e yazmak icin trigger veya edge function eklenebilir.
