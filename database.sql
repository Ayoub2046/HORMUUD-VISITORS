-- ==========================================================================
-- Booqasho App - Supabase PostgreSQL Database Initialization Script
-- System Version: 1.0
-- Client: Hormuud Telecom
-- ==========================================================================

-- Enable UUID Extension
create extension if not exists "uuid-ossp";

-- --------------------------------------------------------------------------
-- 1. USERS TABLE
-- --------------------------------------------------------------------------
create table if not exists users (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text unique not null,
  phone text,
  address text,
  role text default 'marketing' check (role in ('admin', 'marketing')),
  department text default 'Field Marketing',
  password_hash text not null, -- Stores hashed credentials
  is_verified boolean default false, -- For SMS OTP Verification
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for speedy email lookups during authentication
create index if not exists idx_users_email on users(email);

-- --------------------------------------------------------------------------
-- 2. VISITS TABLE
-- --------------------------------------------------------------------------
create table if not exists visits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  place_name text not null,
  place_type text check (place_type in ('Shop', 'Business', 'Company', 'School', 'Hospital', 'Restaurant', 'Other')) not null,
  address text,
  latitude numeric(10, 6) default 0.000000,
  longitude numeric(10, 6) default 0.000000,
  contact_person text,
  phone text,
  visit_date date default current_date not null,
  visit_time time default current_time not null,
  purpose text,
  activities text,
  status text default 'Pending' check (status in ('Successful', 'Failed', 'Pending')),
  result text,
  comments text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indices for visits analytics and filtering
create index if not exists idx_visits_user_id on visits(user_id);
create index if not exists idx_visits_status on visits(status);
create index if not exists idx_visits_date on visits(visit_date);
create index if not exists idx_visits_type on visits(place_type);

-- --------------------------------------------------------------------------
-- 3. ATTACHMENTS TABLE
-- --------------------------------------------------------------------------
create table if not exists attachments (
  id uuid default uuid_generate_v4() primary key,
  visit_id uuid references visits(id) on delete cascade not null,
  file_url text not null,
  file_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------------------------
-- 4. AUDIT LOGS TABLE
-- --------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete set null,
  action text not null,
  description text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_audit_logs_timestamp on audit_logs(timestamp desc);

-- --------------------------------------------------------------------------
-- 5. INITIAL DATABASE SEEDS (Default Admin & Marketing accounts)
-- --------------------------------------------------------------------------
-- Default Admin Account: admin@booqasho.com / Password: admin123
-- Default Marketing Account: marketing@booqasho.com / Password: marketing123
-- (Bcrypt hashes generated using 10 salt rounds matching server.js drivers)

insert into users (id, full_name, email, phone, role, department, password_hash)
values (
  'd3b07384-d113-4ec2-a5d9-4828691512f4',
  'Ayaanle Mohamed',
  'admin@booqasho.com',
  '+252615123456',
  'admin',
  'Marketing Management',
  '$2a$10$tM2a6o2wG9/57R5n7bX6vOa3p4bQyLpC9aJp3p7p1p5pX2pW1pS3S' -- Hash of "admin123"
) on conflict (email) do nothing;

insert into users (id, full_name, email, phone, role, department, password_hash)
values (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Fahad Omar',
  'marketing@booqasho.com',
  '+252615778899',
  'marketing',
  'Field Marketing',
  '$2a$10$wW2b7o3wG9/58R6n8bY7vPa4q5bRyMpDaKp4q8q2q6qY3qX2qT4T' -- Hash of "marketing123"
) on conflict (email) do nothing;

-- Update seeds to be verified
update users set is_verified = true where email in ('admin@booqasho.com', 'marketing@booqasho.com');

-- --------------------------------------------------------------------------
-- 6. OTP & PASSWORD RESET TABLES
-- --------------------------------------------------------------------------
create table if not exists otps (
  id uuid default uuid_generate_v4() primary key,
  phone text not null,
  otp_code text not null,
  purpose text check (purpose in ('REGISTRATION', 'LOGIN_MFA')) default 'REGISTRATION',
  is_used boolean default false,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_otps_phone on otps(phone);

create table if not exists password_resets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  reset_token text not null unique,
  is_used boolean default false,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_pwd_resets_token on password_resets(reset_token);

-- Migration: add address column to existing installations
alter table users add column if not exists address text;

-- --------------------------------------------------------------------------
-- 7. TASKS TABLE
-- --------------------------------------------------------------------------
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  assigned_by uuid references users(id) on delete set null,
  assigned_to uuid references users(id) on delete set null,
  service text not null,
  description text,
  date text,
  status text default 'pending',
  completed_at timestamp with time zone,
  completed_by uuid references users(id) on delete set null,
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_tasks_assigned_to on tasks(assigned_to);
create index if not exists idx_tasks_date on tasks(date);

-- --------------------------------------------------------------------------
-- 8. CLIENTS TABLE
-- --------------------------------------------------------------------------
create table if not exists clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  contact text,
  employees integer default 1,
  isp text default 'HORMUUD',
  type text default 'Enterprise',
  services jsonb default '[]'::jsonb,
  svc_data jsonb default '{}'::jsonb,
  visits jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_clients_name on clients(name);

-- --------------------------------------------------------------------------
-- 9. ISPS TABLE
-- --------------------------------------------------------------------------
create table if not exists isps (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------------------------
-- 10. ENTERPRISE & INDIVIDUAL SERVICES TABLES
-- --------------------------------------------------------------------------
create table if not exists ent_svcs (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ind_svcs (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------------------------
-- 11. CLIENT ASSIGNMENTS TABLE
-- --------------------------------------------------------------------------
create table if not exists client_assignments (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  assigned_to jsonb default '[]'::jsonb,
  assigned_by uuid references users(id) on delete set null,
  type text default 'visit',
  notes text,
  status text default 'pending',
  date text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_assignments_client_id on client_assignments(client_id);

-- --------------------------------------------------------------------------
-- 12. VISIT TASKS & VISIT REPORTS TABLES
-- --------------------------------------------------------------------------
create table if not exists visit_tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  assigned_to jsonb default '[]'::jsonb,
  services jsonb default '[]'::jsonb,
  status text default 'active',
  created_by uuid references users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists visit_reports (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references visit_tasks(id) on delete cascade,
  submitted_by uuid references users(id) on delete set null,
  client_name text not null,
  client_phone text,
  location text,
  notes text,
  service_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_visit_reports_task_id on visit_reports(task_id);

-- --------------------------------------------------------------------------
-- 13. RECYCLE BIN TABLE
-- --------------------------------------------------------------------------
create table if not exists recycle_bin (
  id uuid default uuid_generate_v4() primary key,
  original_id text,
  type text not null,
  data jsonb default '{}'::jsonb,
  deleted_by text,
  deleted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

