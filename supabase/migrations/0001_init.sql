-- Little Plans data backend, initial schema.
-- Mirrors the flat-file JSON contract one-to-one so sync.js is a dumb upsert.
-- Run in the Supabase SQL editor or via: supabase db push

create table if not exists places (
  id          text primary key,
  source      text not null,
  name        text not null,
  kind        text not null,
  address     text,
  lat         double precision,
  lon         double precision,
  url         text,
  attrs       jsonb not null default '{}',
  status      text not null default 'draft' check (status in ('draft','approved','rejected')),
  first_seen  timestamptz,
  last_seen   timestamptz
);

create table if not exists happenings (
  id          text primary key,
  source      text not null,
  title       text not null,
  descr       text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  venue_name  text,
  address     text,
  lat         double precision,
  lon         double precision,
  age_min_m   integer,
  age_max_m   integer,
  cost        text,
  setting     text,
  weather     text,
  url         text,
  attrs       jsonb not null default '{}',
  status      text not null default 'draft' check (status in ('draft','approved','rejected')),
  fetched_at  timestamptz
);

create index if not exists happenings_starts_at_idx on happenings (starts_at);
create index if not exists happenings_status_idx    on happenings (status);
create index if not exists places_kind_idx          on places (kind);
create index if not exists places_status_idx        on places (status);

-- RLS: the anon key may read approved rows only; writes go through the
-- service role key held by the GitHub Action. Nothing user-identifying is
-- ever stored here, keeping the privacy-by-architecture promise intact.
alter table places     enable row level security;
alter table happenings enable row level security;

create policy places_public_read     on places     for select using (status = 'approved');
create policy happenings_public_read on happenings for select using (status = 'approved');
