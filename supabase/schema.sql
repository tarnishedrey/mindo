create or replace function public.is_campus_email(email text)
returns boolean language sql immutable as $$
  select lower(email) like '%.ac.id' or lower(email) like '%@demo.mindo.test'
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  university text not null default '',
  city text not null default '',
  faculty text not null default '',
  study_program text not null default '',
  year smallint not null default 1 check (year between 1 and 8),
  bio text not null default '' check (char_length(bio) <= 280),
  courses text[] not null default '{}',
  availability text[] not null default '{}',
  quiz_answers smallint[] check (quiz_answers is null or array_length(quiz_answers, 1) = 8),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Signed-in students can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "Students create their own profile with a campus email"
  on public.profiles for insert to authenticated
  with check (id = auth.uid() and public.is_campus_email(auth.jwt() ->> 'email'));

create policy "Students update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create unique index connections_pair_idx
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

alter table public.connections enable row level security;

create policy "Students see their own connections"
  on public.connections for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

create policy "Students send requests as themselves"
  on public.connections for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

create policy "Only the receiver answers a request"
  on public.connections for update to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid() and status in ('accepted', 'declined'));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  kind text not null default 'text' check (kind in ('text', 'session')),
  session jsonb,
  created_at timestamptz not null default now()
);

create index messages_connection_idx on public.messages (connection_id, created_at);

alter table public.messages enable row level security;

create or replace function public.is_accepted_member(conn uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.connections c
    where c.id = conn and c.status = 'accepted' and auth.uid() in (c.requester_id, c.addressee_id)
  )
$$;

create policy "Connected students read their chat"
  on public.messages for select to authenticated
  using (public.is_accepted_member(connection_id));

create policy "Connected students write to their chat"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_accepted_member(connection_id));

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.connections;

create or replace function public.sample_auto_accept()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sample_name text;
begin
  select split_part(full_name, ' ', 1) into sample_name
  from profiles where id = new.addressee_id and is_sample;
  if sample_name is null then
    return new;
  end if;
  update connections set status = 'accepted' where id = new.id;
  insert into messages (connection_id, sender_id, body)
  values (new.id, new.addressee_id,
          'Hai! ' || sample_name || ' di sini. Makasih udah ngajak, ayo belajar bareng!');
  return new;
end $$;

create trigger connections_sample_auto_accept
  after insert on public.connections
  for each row execute function public.sample_auto_accept();

create or replace function public.sample_auto_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  other uuid;
  replies text[] := array[
    'Boleh banget! Kamu biasanya paling enak belajar jam berapa?',
    'Siap, aku juga lagi butuh teman buat bahas materi ini 😄',
    'Oke, nanti aku bawa rangkuman bab kemarin ya.',
    'Sip, kabari aja kalau mau mulai.'
  ];
  n int;
begin
  select case when c.requester_id = new.sender_id then c.addressee_id else c.requester_id end
    into other
  from connections c where c.id = new.connection_id;

  if not exists (select 1 from profiles where id = other and is_sample)
     or exists (select 1 from profiles where id = new.sender_id and is_sample) then
    return new;
  end if;

  select count(*) into n from messages where connection_id = new.connection_id;
  insert into messages (connection_id, sender_id, body)
  values (new.connection_id, other,
          case when new.kind = 'session' then 'Jadwalnya cocok, aku ikut! Sampai ketemu nanti 👍'
               else replies[(n % 4) + 1] end);
  return new;
end $$;

create trigger messages_sample_auto_reply
  after insert on public.messages
  for each row execute function public.sample_auto_reply();

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.connections to authenticated;
grant select, insert on public.messages to authenticated;
grant execute on function public.is_campus_email(text) to authenticated;
grant execute on function public.is_accepted_member(uuid) to authenticated;
revoke all on public.profiles, public.connections, public.messages from anon;
