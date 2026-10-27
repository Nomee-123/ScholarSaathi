create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb
    check (jsonb_typeof(profile) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_scholarships (
  user_id uuid not null references auth.users (id) on delete cascade,
  scholarship_id text not null
    check (char_length(scholarship_id) between 1 and 160),
  created_at timestamptz not null default now(),
  primary key (user_id, scholarship_id)
);

alter table public.student_profiles enable row level security;
alter table public.saved_scholarships enable row level security;

revoke all on table public.student_profiles from public, anon, authenticated;
revoke all on table public.saved_scholarships from public, anon, authenticated;

grant select, insert, update, delete on table public.student_profiles to authenticated;
grant select, insert, update, delete on table public.saved_scholarships to authenticated;

drop policy if exists "Students can read their own profile" on public.student_profiles;
create policy "Students can read their own profile"
  on public.student_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Students can create their own profile" on public.student_profiles;
create policy "Students can create their own profile"
  on public.student_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Students can update their own profile" on public.student_profiles;
create policy "Students can update their own profile"
  on public.student_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Students can delete their own profile" on public.student_profiles;
create policy "Students can delete their own profile"
  on public.student_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Students can read their own saved scholarships" on public.saved_scholarships;
create policy "Students can read their own saved scholarships"
  on public.saved_scholarships for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Students can save their own scholarships" on public.saved_scholarships;
create policy "Students can save their own scholarships"
  on public.saved_scholarships for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Students can remove their own saved scholarships" on public.saved_scholarships;
create policy "Students can remove their own saved scholarships"
  on public.saved_scholarships for delete to authenticated
  using ((select auth.uid()) = user_id);
