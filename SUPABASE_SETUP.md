# 아리모리 Supabase 설정

> 아래 SQL은 자동으로 실행되지 않는다. Supabase Dashboard의 SQL Editor에서 사용자가 직접 실행한다.
> PostgreSQL에서 대문자가 포함된 이름은 반드시 큰따옴표로 감싼다.

## 1. 환경변수

```env
NEXT_PUBLIC_ARIMORI_SUPABASE_URL=https://zkogemvwkrjhttjvachs.supabase.co
NEXT_PUBLIC_ARIMORI_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ARIMORI_SUPABASE_SECRET_KEY=sb_secret_...
ARIMORI_BIZGO_API_KEY=Bizgo_API_키
ARIMORI_BIZGO_SENDER_NUMBER=Bizgo에_등록한_발신번호
ARIMORI_SITE_URL=https://ari-mori.com
```

- Publishable Key는 Supabase Dashboard의 `Settings → API Keys`에서 확인한다.
- 문의 접수 후 알림 문자 상태를 서버에서 기록하기 위해 Secret Key가 필요하다.
- `ARIMORI_SUPABASE_SECRET_KEY`와 `ARIMORI_BIZGO_API_KEY`는 서버 전용이다. 이름 앞에 `NEXT_PUBLIC_`을 붙이면 안 된다.
- `ARIMORI_BIZGO_SENDER_NUMBER`에는 Bizgo에서 사전 등록·승인된 발신번호를 숫자만 입력한다.
- `ARIMORI_SITE_URL`에는 문자에서 열릴 실제 Vercel 도메인을 입력한다. 끝의 `/`는 생략한다.

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
  poster_paths text[] not null default '{}',
  map_query text,
  map_url text,
  booking_type text not null default 'free'
    check (booking_type in ('reservation', 'free', 'onsite')),
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

create table if not exists public."ARIMORI_videos" (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  youtube_url text not null,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  display_order integer not null default 0,
  is_public boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."ARIMORI_inquiries" (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 50),
  phone text not null check (char_length(trim(phone)) between 8 and 20),
  email text not null check (char_length(trim(email)) between 3 and 254),
  message text not null check (char_length(trim(message)) between 10 and 2000),
  privacy_agreed boolean not null check (privacy_agreed = true),
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed')),
  sms_status text not null default 'pending' check (sms_status in ('pending', 'sent', 'failed', 'not_configured')),
  sms_sent_at timestamptz,
  sms_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."ARIMORI_inquiry_settings" (
  id boolean primary key default true check (id = true),
  notification_phone text,
  updated_at timestamptz not null default now()
);

insert into public."ARIMORI_inquiry_settings" (id, notification_phone)
values (true, null)
on conflict (id) do nothing;

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

drop trigger if exists "ARIMORI_videos_updated_at" on public."ARIMORI_videos";
create trigger "ARIMORI_videos_updated_at"
before update on public."ARIMORI_videos"
for each row execute function public."ARIMORI_set_updated_at"();

drop trigger if exists "ARIMORI_inquiries_updated_at" on public."ARIMORI_inquiries";
create trigger "ARIMORI_inquiries_updated_at"
before update on public."ARIMORI_inquiries"
for each row execute function public."ARIMORI_set_updated_at"();

drop trigger if exists "ARIMORI_inquiry_settings_updated_at" on public."ARIMORI_inquiry_settings";
create trigger "ARIMORI_inquiry_settings_updated_at"
before update on public."ARIMORI_inquiry_settings"
for each row execute function public."ARIMORI_set_updated_at"();

alter table public."ARIMORI_admins" enable row level security;
alter table public."ARIMORI_schedules" enable row level security;
alter table public."ARIMORI_videos" enable row level security;
alter table public."ARIMORI_inquiries" enable row level security;
alter table public."ARIMORI_inquiry_settings" enable row level security;

revoke all on table public."ARIMORI_admins" from anon, authenticated;
grant select on table public."ARIMORI_schedules" to anon, authenticated;
grant insert, update, delete on table public."ARIMORI_schedules" to authenticated;
grant select on table public."ARIMORI_videos" to anon, authenticated;
grant insert, update, delete on table public."ARIMORI_videos" to authenticated;
revoke all on table public."ARIMORI_inquiries" from anon, authenticated;
grant insert on table public."ARIMORI_inquiries" to anon, authenticated;
grant select, update, delete on table public."ARIMORI_inquiries" to authenticated;
revoke all on table public."ARIMORI_inquiry_settings" from anon, authenticated;
grant select, insert, update on table public."ARIMORI_inquiry_settings" to authenticated;

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

drop policy if exists "ARIMORI_public_insert_inquiries" on public."ARIMORI_inquiries";
create policy "ARIMORI_public_insert_inquiries"
on public."ARIMORI_inquiries"
for insert
to anon, authenticated
with check (
  privacy_agreed = true
  and status = 'new'
  and sms_status = 'pending'
  and sms_sent_at is null
  and sms_error is null
);

drop policy if exists "ARIMORI_admin_read_inquiries" on public."ARIMORI_inquiries";
create policy "ARIMORI_admin_read_inquiries"
on public."ARIMORI_inquiries"
for select
to authenticated
using ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_update_inquiries" on public."ARIMORI_inquiries";
create policy "ARIMORI_admin_update_inquiries"
on public."ARIMORI_inquiries"
for update
to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_delete_inquiries" on public."ARIMORI_inquiries";
create policy "ARIMORI_admin_delete_inquiries"
on public."ARIMORI_inquiries"
for delete
to authenticated
using ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_read_inquiry_settings" on public."ARIMORI_inquiry_settings";
create policy "ARIMORI_admin_read_inquiry_settings"
on public."ARIMORI_inquiry_settings"
for select to authenticated
using ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_insert_inquiry_settings" on public."ARIMORI_inquiry_settings";
create policy "ARIMORI_admin_insert_inquiry_settings"
on public."ARIMORI_inquiry_settings"
for insert to authenticated
with check ((select public."ARIMORI_is_admin"()) and id = true);

drop policy if exists "ARIMORI_admin_update_inquiry_settings" on public."ARIMORI_inquiry_settings";
create policy "ARIMORI_admin_update_inquiry_settings"
on public."ARIMORI_inquiry_settings"
for update to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()) and id = true);

drop policy if exists "ARIMORI_public_read_videos" on public."ARIMORI_videos";
create policy "ARIMORI_public_read_videos"
on public."ARIMORI_videos"
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "ARIMORI_admin_read_videos" on public."ARIMORI_videos";
create policy "ARIMORI_admin_read_videos"
on public."ARIMORI_videos"
for select
to authenticated
using ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_insert_videos" on public."ARIMORI_videos";
create policy "ARIMORI_admin_insert_videos"
on public."ARIMORI_videos"
for insert
to authenticated
with check (
  (select public."ARIMORI_is_admin"())
  and created_by = (select auth.uid())
);

drop policy if exists "ARIMORI_admin_update_videos" on public."ARIMORI_videos";
create policy "ARIMORI_admin_update_videos"
on public."ARIMORI_videos"
for update
to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_delete_videos" on public."ARIMORI_videos";
create policy "ARIMORI_admin_delete_videos"
on public."ARIMORI_videos"
for delete
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
create index if not exists "ARIMORI_videos_public_order_idx"
  on public."ARIMORI_videos" (is_public, display_order, created_at desc);
create index if not exists "ARIMORI_inquiries_status_created_idx"
  on public."ARIMORI_inquiries" (status, created_at desc);
```

### 기존 일정 테이블에 여러 포스터 기능 추가

이미 `ARIMORI_schedules` 테이블이 있는 프로젝트에서는 아래 SQL을 한 번 실행한다. 기존 단일 포스터는 배열의 첫 번째 이미지로 자동 이전된다.

```sql
alter table public."ARIMORI_schedules"
add column if not exists poster_paths text[] not null default '{}';

update public."ARIMORI_schedules"
set poster_paths = array[poster_path]
where poster_path is not null
  and trim(poster_path) <> ''
  and coalesce(array_length(poster_paths, 1), 0) = 0;
```

### 아리모리 소식 관리

홈 화면 소식과 관리자 소식 관리 기능을 사용하기 전에 아래 SQL 블록 전체를 한 번 실행한다.

```sql
create table if not exists public."ARIMORI_news" (
  id uuid primary key default gen_random_uuid(),
  badge text not null check (char_length(badge) between 1 and 20),
  title text not null check (char_length(title) between 1 and 160),
  content text not null check (char_length(content) between 1 and 5000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists "ARIMORI_news_updated_at" on public."ARIMORI_news";
create trigger "ARIMORI_news_updated_at"
before update on public."ARIMORI_news"
for each row execute function public."ARIMORI_set_updated_at"();

create index if not exists "ARIMORI_news_created_at_idx"
  on public."ARIMORI_news" (created_at desc);

alter table public."ARIMORI_news" enable row level security;

revoke all on table public."ARIMORI_news" from anon, authenticated;
grant select on table public."ARIMORI_news" to anon, authenticated;
grant insert, update, delete on table public."ARIMORI_news" to authenticated;

drop policy if exists "ARIMORI_public_read_news" on public."ARIMORI_news";
create policy "ARIMORI_public_read_news"
on public."ARIMORI_news"
for select to anon, authenticated
using (true);

drop policy if exists "ARIMORI_admin_insert_news" on public."ARIMORI_news";
create policy "ARIMORI_admin_insert_news"
on public."ARIMORI_news"
for insert to authenticated
with check ((select public."ARIMORI_is_admin"()) and created_by = (select auth.uid()));

drop policy if exists "ARIMORI_admin_update_news" on public."ARIMORI_news";
create policy "ARIMORI_admin_update_news"
on public."ARIMORI_news"
for update to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_delete_news" on public."ARIMORI_news";
create policy "ARIMORI_admin_delete_news"
on public."ARIMORI_news"
for delete to authenticated
using ((select public."ARIMORI_is_admin"()));
```

### 소개 페이지 대표 사진 설정

관리자에서 소개 사진을 등록하기 전에 아래 SQL 블록 전체를 한 번 실행한다.

```sql
create table if not exists public."ARIMORI_site_settings" (
  id boolean primary key default true check (id = true),
  about_image_path text,
  home_hero_kicker text not null default 'TRADITION, CLOSE TO YOU',
  home_hero_title text not null default '오래된 멋을',
  home_hero_subtitle text not null default '오늘의 우리 곁으로',
  updated_at timestamptz not null default now()
);

alter table public."ARIMORI_site_settings"
  add column if not exists home_hero_kicker text not null default 'TRADITION, CLOSE TO YOU',
  add column if not exists home_hero_title text not null default '오래된 멋을',
  add column if not exists home_hero_subtitle text not null default '오늘의 우리 곁으로';

insert into public."ARIMORI_site_settings" (id, about_image_path)
values (true, null)
on conflict (id) do nothing;

drop trigger if exists "ARIMORI_site_settings_updated_at" on public."ARIMORI_site_settings";
create trigger "ARIMORI_site_settings_updated_at"
before update on public."ARIMORI_site_settings"
for each row execute function public."ARIMORI_set_updated_at"();

alter table public."ARIMORI_site_settings" enable row level security;

revoke all on table public."ARIMORI_site_settings" from anon, authenticated;
grant select on table public."ARIMORI_site_settings" to anon, authenticated;
grant insert, update on table public."ARIMORI_site_settings" to authenticated;

drop policy if exists "ARIMORI_public_read_site_settings" on public."ARIMORI_site_settings";
create policy "ARIMORI_public_read_site_settings"
on public."ARIMORI_site_settings"
for select to anon, authenticated
using (true);

drop policy if exists "ARIMORI_admin_insert_site_settings" on public."ARIMORI_site_settings";
create policy "ARIMORI_admin_insert_site_settings"
on public."ARIMORI_site_settings"
for insert to authenticated
with check ((select public."ARIMORI_is_admin"()) and id = true);

drop policy if exists "ARIMORI_admin_update_site_settings" on public."ARIMORI_site_settings";
create policy "ARIMORI_admin_update_site_settings"
on public."ARIMORI_site_settings"
for update to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()) and id = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ARIMORI_site_images',
  'ARIMORI_site_images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ARIMORI_public_read_site_images" on storage.objects;
create policy "ARIMORI_public_read_site_images"
on storage.objects
for select to anon, authenticated
using (bucket_id = 'ARIMORI_site_images');

drop policy if exists "ARIMORI_admin_insert_site_images" on storage.objects;
create policy "ARIMORI_admin_insert_site_images"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'ARIMORI_site_images'
  and (select public."ARIMORI_is_admin"())
);

drop policy if exists "ARIMORI_admin_update_site_images" on storage.objects;
create policy "ARIMORI_admin_update_site_images"
on storage.objects
for update to authenticated
using (
  bucket_id = 'ARIMORI_site_images'
  and (select public."ARIMORI_is_admin"())
)
with check (
  bucket_id = 'ARIMORI_site_images'
  and (select public."ARIMORI_is_admin"())
);

drop policy if exists "ARIMORI_admin_delete_site_images" on storage.objects;
create policy "ARIMORI_admin_delete_site_images"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'ARIMORI_site_images'
  and (select public."ARIMORI_is_admin"())
);
```

### 기존 일정 테이블에 길찾기 검색 문구 추가

이미 `ARIMORI_schedules` 테이블을 만든 프로젝트에서는 아래 SQL을 한 번 실행한다. 기존 일정은 장소명을 초기 검색 문구로 사용한다.

```sql
alter table public."ARIMORI_schedules"
add column if not exists map_query text;

update public."ARIMORI_schedules"
set map_query = location
where map_query is null or trim(map_query) = '';

alter table public."ARIMORI_schedules"
add column if not exists booking_type text not null default 'free';

update public."ARIMORI_schedules"
set booking_type = 'reservation'
where booking_url is not null and trim(booking_url) <> '';

alter table public."ARIMORI_schedules"
drop constraint if exists "ARIMORI_schedules_booking_type_check";

alter table public."ARIMORI_schedules"
add constraint "ARIMORI_schedules_booking_type_check"
check (booking_type in ('reservation', 'free', 'onsite'));
```

### 기존 프로젝트에 공연영상 테이블 추가

현재 운영 중인 프로젝트에서는 아래 SQL 블록 전체를 SQL Editor에서 한 번 실행한다.

```sql
create table if not exists public."ARIMORI_videos" (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  youtube_url text not null,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  display_order integer not null default 0,
  is_public boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists "ARIMORI_videos_updated_at" on public."ARIMORI_videos";
create trigger "ARIMORI_videos_updated_at"
before update on public."ARIMORI_videos"
for each row execute function public."ARIMORI_set_updated_at"();

alter table public."ARIMORI_videos" enable row level security;

grant select on table public."ARIMORI_videos" to anon, authenticated;
grant insert, update, delete on table public."ARIMORI_videos" to authenticated;

drop policy if exists "ARIMORI_public_read_videos" on public."ARIMORI_videos";
create policy "ARIMORI_public_read_videos"
on public."ARIMORI_videos"
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "ARIMORI_admin_read_videos" on public."ARIMORI_videos";
create policy "ARIMORI_admin_read_videos"
on public."ARIMORI_videos"
for select
to authenticated
using ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_insert_videos" on public."ARIMORI_videos";
create policy "ARIMORI_admin_insert_videos"
on public."ARIMORI_videos"
for insert
to authenticated
with check (
  (select public."ARIMORI_is_admin"())
  and created_by = (select auth.uid())
);

drop policy if exists "ARIMORI_admin_update_videos" on public."ARIMORI_videos";
create policy "ARIMORI_admin_update_videos"
on public."ARIMORI_videos"
for update
to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_delete_videos" on public."ARIMORI_videos";
create policy "ARIMORI_admin_delete_videos"
on public."ARIMORI_videos"
for delete
to authenticated
using ((select public."ARIMORI_is_admin"()));

create index if not exists "ARIMORI_videos_public_order_idx"
  on public."ARIMORI_videos" (is_public, display_order, created_at desc);
```

### 기존 프로젝트에 공연문의 테이블 추가

문의 폼을 사용하기 전에 아래 SQL 블록 전체를 SQL Editor에서 한 번 실행한다.

```sql
create table if not exists public."ARIMORI_inquiries" (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 50),
  phone text not null check (char_length(trim(phone)) between 8 and 20),
  email text not null check (char_length(trim(email)) between 3 and 254),
  message text not null check (char_length(trim(message)) between 10 and 2000),
  privacy_agreed boolean not null check (privacy_agreed = true),
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed')),
  sms_status text not null default 'pending' check (sms_status in ('pending', 'sent', 'failed', 'not_configured')),
  sms_sent_at timestamptz,
  sms_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public."ARIMORI_inquiries"
  add column if not exists sms_status text not null default 'pending',
  add column if not exists sms_sent_at timestamptz,
  add column if not exists sms_error text;

alter table public."ARIMORI_inquiries"
  drop constraint if exists "ARIMORI_inquiries_sms_status_check";
alter table public."ARIMORI_inquiries"
  add constraint "ARIMORI_inquiries_sms_status_check"
  check (sms_status in ('pending', 'sent', 'failed', 'not_configured'));

create table if not exists public."ARIMORI_inquiry_settings" (
  id boolean primary key default true check (id = true),
  notification_phone text,
  updated_at timestamptz not null default now()
);

insert into public."ARIMORI_inquiry_settings" (id, notification_phone)
values (true, null)
on conflict (id) do nothing;

drop trigger if exists "ARIMORI_inquiries_updated_at" on public."ARIMORI_inquiries";
create trigger "ARIMORI_inquiries_updated_at"
before update on public."ARIMORI_inquiries"
for each row execute function public."ARIMORI_set_updated_at"();

drop trigger if exists "ARIMORI_inquiry_settings_updated_at" on public."ARIMORI_inquiry_settings";
create trigger "ARIMORI_inquiry_settings_updated_at"
before update on public."ARIMORI_inquiry_settings"
for each row execute function public."ARIMORI_set_updated_at"();

alter table public."ARIMORI_inquiries" enable row level security;
alter table public."ARIMORI_inquiry_settings" enable row level security;

revoke all on table public."ARIMORI_inquiries" from anon, authenticated;
grant insert on table public."ARIMORI_inquiries" to anon, authenticated;
grant select, update, delete on table public."ARIMORI_inquiries" to authenticated;
revoke all on table public."ARIMORI_inquiry_settings" from anon, authenticated;
grant select, insert, update on table public."ARIMORI_inquiry_settings" to authenticated;

drop policy if exists "ARIMORI_public_insert_inquiries" on public."ARIMORI_inquiries";
create policy "ARIMORI_public_insert_inquiries"
on public."ARIMORI_inquiries"
for insert
to anon, authenticated
with check (
  privacy_agreed = true
  and status = 'new'
  and sms_status = 'pending'
  and sms_sent_at is null
  and sms_error is null
);

drop policy if exists "ARIMORI_admin_read_inquiries" on public."ARIMORI_inquiries";
create policy "ARIMORI_admin_read_inquiries"
on public."ARIMORI_inquiries"
for select
to authenticated
using ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_read_inquiry_settings" on public."ARIMORI_inquiry_settings";
create policy "ARIMORI_admin_read_inquiry_settings"
on public."ARIMORI_inquiry_settings"
for select to authenticated
using ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_insert_inquiry_settings" on public."ARIMORI_inquiry_settings";
create policy "ARIMORI_admin_insert_inquiry_settings"
on public."ARIMORI_inquiry_settings"
for insert to authenticated
with check ((select public."ARIMORI_is_admin"()) and id = true);

drop policy if exists "ARIMORI_admin_update_inquiry_settings" on public."ARIMORI_inquiry_settings";
create policy "ARIMORI_admin_update_inquiry_settings"
on public."ARIMORI_inquiry_settings"
for update to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()) and id = true);

drop policy if exists "ARIMORI_admin_update_inquiries" on public."ARIMORI_inquiries";
create policy "ARIMORI_admin_update_inquiries"
on public."ARIMORI_inquiries"
for update
to authenticated
using ((select public."ARIMORI_is_admin"()))
with check ((select public."ARIMORI_is_admin"()));

drop policy if exists "ARIMORI_admin_delete_inquiries" on public."ARIMORI_inquiries";
create policy "ARIMORI_admin_delete_inquiries"
on public."ARIMORI_inquiries"
for delete
to authenticated
using ((select public."ARIMORI_is_admin"()));

create index if not exists "ARIMORI_inquiries_status_created_idx"
  on public."ARIMORI_inquiries" (status, created_at desc);
```

### Bizgo 공연문의 알림 설정

1. Vercel 환경변수에 `ARIMORI_SUPABASE_SECRET_KEY`, `ARIMORI_BIZGO_API_KEY`, `ARIMORI_BIZGO_SENDER_NUMBER`, `ARIMORI_SITE_URL`을 추가한다.
2. `ARIMORI_BIZGO_SENDER_NUMBER`는 Bizgo에 등록된 발신번호를 숫자만 입력한다.
3. `ARIMORI_SITE_URL`은 `https://ari-mori.com`을 입력한다.
4. 재배포 후 `/admin?tab=inquiries`에서 알림을 받을 휴대전화 번호를 저장한다.

문의 알림은 관리자 상세 링크 때문에 SMS 길이를 넘을 수 있어 첨부파일 없는 LMS 방식으로 발송한다. API 키와 Supabase Secret Key는 서버에서만 사용하며 공개 접두사 `NEXT_PUBLIC_`을 붙이지 않는다.

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

## 6. 이벤트(모바일 스탬프·공연 후기) 테이블

아래 SQL은 Supabase의 **SQL Editor**에서 한 번에 실행한다. 참가자의 연락처는 공개 테이블 조회로 노출되지 않으며, 홈페이지의 참여 요청은 서버에서만 처리한다.

```sql
create table if not exists public."ARIMORI_stamp_programs" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text,
  schedule_id uuid references public."ARIMORI_schedules"(id) on delete set null,
  starts_on date not null,
  ends_on date not null,
  required_stamps integer not null default 1 check (required_stamps between 1 and 100),
  is_active boolean not null default true,
  winners_announced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public."ARIMORI_stamp_booths" (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public."ARIMORI_stamp_programs"(id) on delete cascade,
  name text not null,
  description text,
  access_code_hash text,
  access_code_encrypted text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 위 이벤트 테이블을 이미 생성한 프로젝트용 추가 컬럼
alter table public."ARIMORI_stamp_programs"
  add column if not exists schedule_id uuid references public."ARIMORI_schedules"(id) on delete set null;
alter table public."ARIMORI_stamp_booths"
  add column if not exists access_code_hash text;
alter table public."ARIMORI_stamp_booths"
  add column if not exists access_code_encrypted text;
create unique index if not exists "ARIMORI_stamp_programs_schedule_unique"
  on public."ARIMORI_stamp_programs" (schedule_id) where schedule_id is not null;

create table if not exists public."ARIMORI_stamp_participants" (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public."ARIMORI_stamp_programs"(id) on delete cascade,
  public_token uuid not null unique default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 30),
  phone text not null,
  privacy_agreed boolean not null check (privacy_agreed),
  completed_at timestamptz,
  reward_redeemed_at timestamptz,
  is_winner boolean not null default false,
  created_at timestamptz not null default now(),
  unique (program_id, phone)
);

-- 위 스탬프 테이블을 이미 생성한 프로젝트용 당첨자 발표 컬럼
alter table public."ARIMORI_stamp_programs"
  add column if not exists winners_announced boolean not null default false;
alter table public."ARIMORI_stamp_participants"
  add column if not exists is_winner boolean not null default false;

create table if not exists public."ARIMORI_stamp_records" (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public."ARIMORI_stamp_participants"(id) on delete cascade,
  booth_id uuid not null references public."ARIMORI_stamp_booths"(id) on delete cascade,
  stamped_by uuid references auth.users(id) on delete set null,
  stamped_at timestamptz not null default now(),
  unique (participant_id, booth_id)
);

create table if not exists public."ARIMORI_review_campaigns" (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public."ARIMORI_schedules"(id) on delete cascade,
  title text not null,
  access_token uuid not null unique default gen_random_uuid(),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at > opens_at)
);

create table if not exists public."ARIMORI_event_reviews" (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public."ARIMORI_review_campaigns"(id) on delete cascade,
  schedule_id uuid not null references public."ARIMORI_schedules"(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  phone text not null,
  content text not null check (char_length(content) between 1 and 500),
  privacy_agreed boolean not null check (privacy_agreed),
  public_agreed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_winner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, phone)
);

create index if not exists "ARIMORI_stamp_booths_program_idx" on public."ARIMORI_stamp_booths" (program_id, display_order);
create index if not exists "ARIMORI_stamp_participants_program_idx" on public."ARIMORI_stamp_participants" (program_id, created_at desc);
create index if not exists "ARIMORI_stamp_records_participant_idx" on public."ARIMORI_stamp_records" (participant_id);
create index if not exists "ARIMORI_review_campaigns_schedule_idx" on public."ARIMORI_review_campaigns" (schedule_id);
create index if not exists "ARIMORI_event_reviews_campaign_idx" on public."ARIMORI_event_reviews" (campaign_id, created_at desc);
create index if not exists "ARIMORI_event_reviews_public_idx" on public."ARIMORI_event_reviews" (schedule_id, created_at desc) where status = 'approved' and public_agreed = true;

drop trigger if exists "ARIMORI_stamp_programs_updated_at" on public."ARIMORI_stamp_programs";
create trigger "ARIMORI_stamp_programs_updated_at" before update on public."ARIMORI_stamp_programs"
for each row execute function public."ARIMORI_set_updated_at"();
drop trigger if exists "ARIMORI_review_campaigns_updated_at" on public."ARIMORI_review_campaigns";
create trigger "ARIMORI_review_campaigns_updated_at" before update on public."ARIMORI_review_campaigns"
for each row execute function public."ARIMORI_set_updated_at"();
drop trigger if exists "ARIMORI_event_reviews_updated_at" on public."ARIMORI_event_reviews";
create trigger "ARIMORI_event_reviews_updated_at" before update on public."ARIMORI_event_reviews"
for each row execute function public."ARIMORI_set_updated_at"();

alter table public."ARIMORI_stamp_programs" enable row level security;
alter table public."ARIMORI_stamp_booths" enable row level security;
alter table public."ARIMORI_stamp_participants" enable row level security;
alter table public."ARIMORI_stamp_records" enable row level security;
alter table public."ARIMORI_review_campaigns" enable row level security;
alter table public."ARIMORI_event_reviews" enable row level security;

revoke all on public."ARIMORI_stamp_programs" from anon, authenticated;
revoke all on public."ARIMORI_stamp_booths" from anon, authenticated;
revoke all on public."ARIMORI_stamp_participants" from anon, authenticated;
revoke all on public."ARIMORI_stamp_records" from anon, authenticated;
revoke all on public."ARIMORI_review_campaigns" from anon, authenticated;
revoke all on public."ARIMORI_event_reviews" from anon, authenticated;

grant select, insert, update, delete on public."ARIMORI_stamp_programs" to authenticated;
grant select, insert, update, delete on public."ARIMORI_stamp_booths" to authenticated;
grant select, insert, update, delete on public."ARIMORI_stamp_participants" to authenticated;
grant select, insert, update, delete on public."ARIMORI_stamp_records" to authenticated;
grant select, insert, update, delete on public."ARIMORI_review_campaigns" to authenticated;
grant select, insert, update, delete on public."ARIMORI_event_reviews" to authenticated;

drop policy if exists "ARIMORI_admin_all_stamp_programs" on public."ARIMORI_stamp_programs";
drop policy if exists "ARIMORI_admin_all_stamp_booths" on public."ARIMORI_stamp_booths";
drop policy if exists "ARIMORI_admin_all_stamp_participants" on public."ARIMORI_stamp_participants";
drop policy if exists "ARIMORI_admin_all_stamp_records" on public."ARIMORI_stamp_records";
drop policy if exists "ARIMORI_admin_all_review_campaigns" on public."ARIMORI_review_campaigns";
drop policy if exists "ARIMORI_admin_all_event_reviews" on public."ARIMORI_event_reviews";

create policy "ARIMORI_admin_all_stamp_programs" on public."ARIMORI_stamp_programs" for all to authenticated using ((select public."ARIMORI_is_admin"())) with check ((select public."ARIMORI_is_admin"()));
create policy "ARIMORI_admin_all_stamp_booths" on public."ARIMORI_stamp_booths" for all to authenticated using ((select public."ARIMORI_is_admin"())) with check ((select public."ARIMORI_is_admin"()));
create policy "ARIMORI_admin_all_stamp_participants" on public."ARIMORI_stamp_participants" for all to authenticated using ((select public."ARIMORI_is_admin"())) with check ((select public."ARIMORI_is_admin"()));
create policy "ARIMORI_admin_all_stamp_records" on public."ARIMORI_stamp_records" for all to authenticated using ((select public."ARIMORI_is_admin"())) with check ((select public."ARIMORI_is_admin"()));
create policy "ARIMORI_admin_all_review_campaigns" on public."ARIMORI_review_campaigns" for all to authenticated using ((select public."ARIMORI_is_admin"())) with check ((select public."ARIMORI_is_admin"()));
create policy "ARIMORI_admin_all_event_reviews" on public."ARIMORI_event_reviews" for all to authenticated using ((select public."ARIMORI_is_admin"())) with check ((select public."ARIMORI_is_admin"()));
```

Vercel과 로컬 `.env.local`에는 서버 전용 환경변수 `ARIMORI_SUPABASE_SECRET_KEY`가 필요하다. 이 값에는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 참여 QR의 주소를 정확히 만들기 위해 아래 값도 사용한다.

```env
ARIMORI_SITE_URL=https://ari-mori.com
```

이벤트 SQL 실행 후 관리자 페이지의 **이벤트** 탭에서 프로그램을 생성한다. 스탬프는 `참여 시작 QR → 참가자 카드 발급 → 각 부스 스캔 화면에서 참가자 QR 스캔` 순서이며, 후기는 `후기 이벤트 생성 → 참여 QR 저장 → 후기 승인` 순서다.
