-- SP_STATION canli is kolonlari (mevcut tabloya ekle).
-- Supabase SQL editor'de bir kez calistirin.

alter table production.sp_station
  add column if not exists counter_value numeric(14,4),
  add column if not exists slot_count integer,
  add column if not exists active_slot_count integer,
  add column if not exists cycle_time numeric(10,3),
  add column if not exists machine_speed numeric(10,3);

comment on column production.sp_station.counter_value is 'COUNTER_VALUE — is sayaci';
comment on column production.sp_station.slot_count is 'SLOT_COUNT — kalip/aparat toplam yuva';
comment on column production.sp_station.active_slot_count is 'ACTIVE_SLOT_COUNT — acik yuva';
comment on column production.sp_station.cycle_time is 'CYCLE_TIME — cevrim sn';
comment on column production.sp_station.machine_speed is 'MACHINE_SPEED';
