-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Bookings table
create table if not exists bookings (
  id text primary key,
  client_name text not null,
  client_phone text not null,
  client_email text,
  service_category text,
  service_detail text,
  preferred_date text,
  preferred_time text,
  price numeric default 0,
  notes text,
  status text default 'pending',
  payment_status text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Announcements table
create table if not exists announcements (
  id text primary key,
  message text not null,
  type text default 'info',
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Users table
create table if not exists users (
  id text primary key,
  name text,
  email text unique not null,
  role text default 'user',
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Allow public read on announcements and bookings (for the booking form)
alter table announcements enable row level security;
alter table bookings enable row level security;
alter table users enable row level security;

create policy "Public read announcements" on announcements for select using (true);
create policy "Public insert bookings" on bookings for insert with check (true);
create policy "Public read bookings by date" on bookings for select using (true);
create policy "Public read users" on users for select using (true);
create policy "Public insert users" on users for insert with check (true);
create policy "Public update users" on users for update using (true);
create policy "Public delete users" on users for delete using (true);
create policy "Public update bookings" on bookings for update using (true);
create policy "Public delete bookings" on bookings for delete using (true);
create policy "Public insert announcements" on announcements for insert with check (true);
create policy "Public update announcements" on announcements for update using (true);
create policy "Public delete announcements" on announcements for delete using (true);
