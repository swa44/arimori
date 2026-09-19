# 아리모리 Supabase 설정

> 아래 SQL은 자동으로 실행되지 않는다. Supabase Dashboard의 SQL Editor에서 사용자가 직접 실행한다.
> PostgreSQL에서 대문자가 포함된 이름은 반드시 큰따옴표로 감싼다.

## 1. 환경변수

```env
NEXT_PUBLIC_ARIMORI_SUPABASE_URL=https://zkogemvwkrjhttjvachs.supabase.co
NEXT_PUBLIC_ARIMORI_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

- Publishable Key는 Supabase Dashboard의 `Settings → API Keys`에서 확인한다.
- 현재 구조는 Supabase Auth 세션과 RLS로 CRUD를 처리하므로 Secret Key는 필요하지 않다.
- Secret Key가 추후 필요해지면 `ARIMORI_SUPABASE_SECRET_KEY`라는 서버 전용 변수로만 저장하고 브라우저에 노출하지 않는다.

## 2. 테이블·함수·RLS 생성 SQL

아래 블록 전체를 SQL Editor에서 한 번 실행한다.

```sql
create extension if not exists pgcrypto;

create table if not exists public."ARIMORI_admins" (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public."ARIMORI_schedules" (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  start_at timestamptz not null,
  end_at timestamptz,
  location text not null default '',
  address text,
  description text,
  poster_path text,
  map_url text,
  booking_url text,
  category text not null default '공연',
  is_public boolean not null default true,
  is_cancelled boolean not null default false,
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint "ARIMORI_schedules_valid_period"
    check (end_at is null or end_at >= start_at)
);

create or replace function public."ARIMORI_is_admin"()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public."ARIMORI_admins"
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public."ARIMORI_is_admin"() from public;
grant execute on function public."ARIMORI_is_admin"() to anon, authenticated;

create or replace function public."ARIMORI_set_updated_at"()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists "ARIMORI_schedules_updated_at" on public."ARIMORI_schedules";
create trigger "ARIMORI_schedules_updated_at"
before update on public."ARIMORI_schedules"
for each row execute function public."ARIMORI_set_updated_at"();

alter table public."ARIMORI_admins" enable row level security;
alter table public."ARIMORI_schedules" enable row level security;

revoke all on table public."ARIMORI_admins" from anon, authenticated;
grant select on table public."ARIMORI_schedules" to anon, authenticated;
grant insert, update, delete on table public."ARIMORI_schedules" to authenticated;

drop policy if exists "ARIMORI_public_read_schedules" on public."ARIMORI_schedules";
create policy "ARIMORI_public_read_schedules"
on public."ARIMORI_schedules"
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "ARIMORI_admin_read_schedules" on public."ARIMORI_schedules";
create policy "ARIMORI_admin_read_schedules"
on public."ARIMORI_schedules"
for select
to authenticated
using ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_insert_schedules" on public."ARIMORI_schedules";
create policy "ARIMORI_admin_insert_schedules"
on public."ARIMORI_schedules"
for insert
to authenticated
with check (
  (select public."ARIMORI_is_admin"())
  and created_by = (select auth.uid())
);

drop policy if exists "ARIMORI_admin_update_schedules" on public."ARIMORI_schedules";
create policy "ARIMORI_admin_update_schedules"
on public."ARIMORI_schedules"
for update
to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_delete_schedules" on public."ARIMORI_schedules";
create policy "ARIMORI_admin_delete_schedules"
on public."ARIMORI_schedules"
for delete
to authenticated
using ((select public."ARIMORI_is_admin"()));

create index if not exists "ARIMORI_schedules_start_at_idx"
  on public."ARIMORI_schedules" (start_at);
create index if not exists "ARIMORI_schedules_public_start_idx"
  on public."ARIMORI_schedules" (is_public, start_at);
```

## 3. 관리자 계정 등록

1. `Authentication → Users → Add user`에서 관리자 계정을 만든다.
2. 공개 회원가입은 비활성화한다.
3. 아래 SQL의 이메일을 실제 관리자 이메일로 바꾸고 실행한다.

```sql
insert into public."ARIMORI_admins" (user_id)
select id
from auth.users
where email = '관리자 이메일을 여기에 입력'
on conflict (user_id) do nothing;
```

등록 확인:

```sql
select a.user_id, u.email, a.created_at
from public."ARIMORI_admins" a
join auth.users u on u.id = a.user_id;
```

## 4. 포스터 Storage 생성

Dashboard의 `Storage → New bucket`에서 생성한다.

- Bucket name: `ARIMORI_posters`
- Public bucket: 켬
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- File size limit: `10MB`

버킷 생성 후 아래 Storage RLS SQL을 실행한다. 공개 URL을 통한 이미지 조회는 누구나 가능하고, 버킷 목록 조회와 업로드·수정·삭제는 관리자로 제한한다.

```sql
drop policy if exists "ARIMORI_admin_select_posters" on storage.objects;
create policy "ARIMORI_admin_select_posters"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ARIMORI_posters'
  and (select public."ARIMORI_is_admin"())
);

drop policy if exists "ARIMORI_admin_insert_posters" on storage.objects;
create policy "ARIMORI_admin_insert_posters"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ARIMORI_posters'
  and (select public."ARIMORI_is_admin"())
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp'])
);

drop policy if exists "ARIMORI_admin_update_posters" on storage.objects;
create policy "ARIMORI_admin_update_posters"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ARIMORI_posters'
  and (select public."ARIMORI_is_admin"())
)
with check (
  bucket_id = 'ARIMORI_posters'
  and (select public."ARIMORI_is_admin"())
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp'])
);

drop policy if exists "ARIMORI_admin_delete_posters" on storage.objects;
create policy "ARIMORI_admin_delete_posters"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ARIMORI_posters'
  and (select public."ARIMORI_is_admin"())
);
```

## 5. 적용 후 확인

- 로그아웃 상태: 공개 일정만 조회 가능
- 관리자 로그인 상태: 비공개 일정을 포함해 전체 조회 가능
- 일반 로그인 사용자: 일정 등록·수정·삭제 및 포스터 업로드 불가
- 관리자: 일정 CRUD와 포스터 업로드·수정·삭제 가능
