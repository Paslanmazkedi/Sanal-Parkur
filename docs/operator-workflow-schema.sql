-- Operatör iş akışı: zaman girişi, bitir basketleri, aksiyon logları.
-- Supabase SQL Editor'de calistirin. Service role API route'lari bu tablolari kullanir.

grant usage on schema production to service_role;
grant all privileges on all tables in schema production to service_role;

-- Personel master (RFID / kod ile eslestirme icin)
create table if not exists production.operators (
  id uuid primary key default gen_random_uuid(),
  operator_code text not null unique,
  full_name text not null,
  rfid_uid text unique,
  default_station_id integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Toplu zaman girisi basligi (tek emir + istasyon + tarih)
create table if not exists production.order_time_entries (
  id uuid primary key default gen_random_uuid(),
  p_order_id integer not null,
  station_id integer not null,
  entry_date date not null default current_date,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists order_time_entries_order_idx
on production.order_time_entries(p_order_id, entry_date desc);

-- Zaman satirlari (coklu personel)
create table if not exists production.order_time_entry_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references production.order_time_entries(id) on delete cascade,
  operator_id uuid references production.operators(id),
  operator_name text not null,
  minutes_spent numeric(10,2) not null check (minutes_spent > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_time_entry_lines_entry_idx
on production.order_time_entry_lines(entry_id);

-- Bitir raporu basligi
create table if not exists production.order_finish_reports (
  id uuid primary key default gen_random_uuid(),
  p_order_id integer not null,
  station_id integer not null,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists order_finish_reports_order_idx
on production.order_finish_reports(p_order_id, created_at desc);

-- Basket satirlari: produced | consumed | scrap
create table if not exists production.order_finish_lines (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references production.order_finish_reports(id) on delete cascade,
  basket_type text not null check (basket_type in ('produced', 'consumed', 'scrap')),
  stock_code text,
  product_name text,
  spec text,
  lot_no text,
  serial_no text,
  quantity numeric(14,4) not null default 0,
  unit text not null default 'Adet',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_finish_lines_report_idx
on production.order_finish_lines(report_id, basket_type, sort_order);

-- Operatör aksiyon audit (baslat, duraklat, kontrol, bitir)
create table if not exists production.operator_actions (
  id uuid primary key default gen_random_uuid(),
  p_order_id integer not null,
  station_id integer not null,
  action_type text not null,
  from_stage integer,
  to_stage integer,
  actor_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operator_actions_order_idx
on production.operator_actions(p_order_id, created_at desc);

insert into production.operators (operator_code, full_name)
values
  ('OP-001', 'Ali Yilmaz'),
  ('OP-002', 'Ayse Demir'),
  ('OP-003', 'Mehmet Kaya')
on conflict (operator_code) do nothing;
