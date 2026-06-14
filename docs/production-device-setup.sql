-- Production device identity layer.
-- production.workstations = ERP/Workcube station master data.
-- production.machines = Sanal Parkur communication endpoint, tied to workstations by station_id.
-- production.integration_devices = physical PLC/gateway credentials, tied to machines by machine_key.

grant usage on schema production to service_role;
grant all privileges on all tables in schema production to service_role;
grant all privileges on all sequences in schema production to service_role;

alter default privileges in schema production
grant all privileges on tables to service_role;

alter default privileges in schema production
grant all privileges on sequences to service_role;

create unique index if not exists machines_machine_key_uidx
on production.machines(machine_key);

create table if not exists production.integration_devices (
  id uuid primary key default gen_random_uuid(),
  machine_key text not null references production.machines(machine_key),
  device_name text not null,
  device_key text not null unique,
  is_active boolean not null default true,
  allowed_ip text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integration_devices_machine_key_idx
on production.integration_devices(machine_key);

create unique index if not exists integration_devices_device_key_uidx
on production.integration_devices(device_key);

create unique index if not exists production_orders_p_order_no_uidx
on production.production_orders(p_order_no);

-- Example seed rows for your current sample machines.
-- Replace device_key values with long random secrets before using in production.
insert into production.integration_devices (machine_key, device_name, device_key)
values
  ('mert_modbus_1', 'PACK-02 Modbus Gateway', 'dev_pack_02_change_me'),
  ('kd_weld_1', 'WELD-01 Modbus Gateway', 'dev_weld_01_change_me')
on conflict (device_key) do nothing;

-- Server route handlers use SUPABASE_SERVICE_ROLE_KEY and bypass RLS.
-- Client pages still need select policies if RLS is enabled and you want to view rows in the app.
