# 아리모리 공연팀 웹페이지 — 기획서

> 작성일: 2026-09-19
> 상태: 기획 확정, 스캐폴딩 전

## 1. 프로젝트 개요

- **대상**: 공연팀 "아리모리" 홍보/정보 제공용 웹페이지
- **형태**: 모바일 특화 웹앱 (정적 페이지 아님 — 추후 기능 확장 전제)
- **기술 스택**: Next.js (App Router) + TypeScript, Tailwind CSS
- **아이콘**: lucide-react
- **백엔드/DB**: Supabase (Vercel과 연동)
- **배포**: Vercel

## 2. 레이아웃 규칙

기존 송석준(icheon-next) 프로젝트에서 아래 3가지 레이아웃 규칙만 차용하고, 그 외 디자인·색상·스타일은 전부 새로 설계한다. (자세한 내용은 [DESIGN.md](./DESIGN.md) 참고)

1. `body`는 `max-width: 600px; margin: 0 auto;` — PC에서도 모바일 폭으로 중앙 정렬
2. 하단 내비게이션(`<nav>`)은 `position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); max-width: 600px;`로 화면 중앙 고정
3. `main`은 `padding-bottom: calc(var(--nav-height) + 20px)`로 하단 내비게이션에 콘텐츠가 가리지 않게 처리

## 3. 정보 구조 (하단 내비게이션 5개 탭)

| 순서 | 탭 이름 | 라우트 | lucide 아이콘 | 매칭 컬러 |
|---|---|---|---|---|
| 1 | 홈 | `/` | `Home` | `#889050` (올리브) |
| 2 | 소개 | `/about` | `Users` | `#70533d` (브라운) |
| 3 | 일정 | `/schedule` | `CalendarDays` | `#588d94` (틸) |
| 4 | 공연영상 | `/videos` | `PlayCircle` | `#82a381` (세이지) |
| 5 | 공연문의 | `/contact` | `Mail` | `#889050` (올리브, 재사용) |

- 미선택 아이콘: 검은색 계열(`#1c1c1c`)
- 선택 아이콘: 위 매칭 컬러로 전환 (색상 상세는 DESIGN.md 참고)
- 5번째 탭은 4색 순환이 끝나 1번 색상(올리브)을 재사용 — 필요 시 5번째 전용 컬러를 추가할 수도 있음(현재는 재사용으로 확정)

## 4. 탭별 콘텐츠 계획

### 홈 (`/`)
- 최신소식 섹션 (공지/SNS 피드형 리스트)
- 이벤트 섹션 (다가오는 공연 하이라이트)

### 소개 (`/about`)
- 팀 소개 (텍스트 + 이미지)
- 할 수 있는 공연 유형 (기획공연, 찾아가는 문화예술활동 등) — 카드/아코디언 형태

### 일정 (`/schedule`)
- 모바일 월간 캘린더에는 공연명 한 줄 또는 일정 개수를 간결하게 표시
- 날짜 선택 시 캘린더 아래에 해당 날짜의 공연 목록 표시
- 공연 선택 시 바텀시트 또는 모달로 포스터, 시간, 장소, 소개, 지도/길찾기 링크, 예매·안내 링크 표시
- 데이터는 Supabase에서 조회, 관리자 페이지에서 등록한 내용을 그대로 렌더링

### 공연영상 (`/videos`)
- 유튜브 영상 리스트 (썸네일 + 제목)
- 클릭 시 임베드 재생 또는 유튜브 이동

### 공연문의 (`/contact`)
- 섭외 연락처 (전화/이메일)
- SNS 링크
- 1차 개발에서는 개략적인 화면과 정보 구조만 구성
- 문의 폼, 개인정보 수집·이용 동의, 저장 방식, 관리자 알림 방식은 추후 확정

## 5. 관리자 페이지 (`/admin`)

- **목적**: 공연 일정 등록/수정/삭제
- **인증/보호 방식**:
  - Supabase Auth 이메일·비밀번호 인증 사용
  - 공개 회원가입은 허용하지 않고 관리자 계정은 직접 생성
  - 로그인 사용자 ID를 기준으로 관리자 권한 확인
  - Vercel 환경변수(`.env`, Vercel Project Settings의 Environment Variables)에 Supabase 서버용 키 등 민감 정보를 저장
  - 환경변수는 절대 클라이언트 번들에 노출되지 않도록 `NEXT_PUBLIC_` 접두사 없이 서버 전용으로 관리 (API route / Server Action에서만 사용)
  - 미들웨어(`middleware.ts`)에서 `/admin` 경로 접근 시 인증 세션 검증 → 실패 시 로그인 페이지로 리다이렉트
  - 외부에서 관리자 API를 직접 호출하는 것도 막기 위해 API route 또는 Server Action에서도 인증 및 관리자 권한을 재검증
  - Supabase RLS 정책으로 일정 등록/수정/삭제 권한을 관리자에게만 허용
- **기능**:
  - 일정 목록 조회
  - 일정 등록 (공연명, 날짜, 장소, 포스터 이미지 업로드)
  - 일정 수정/삭제

## 6. 데이터/백엔드 설계

- Supabase 사용 확정 (Postgres + Storage 활용)
  - `ARIMORI_admins` 테이블: Supabase Auth 사용자 중 관리자 권한을 가진 계정
  - `ARIMORI_schedules` 테이블: 공연 일정(제목, 시작/종료 일시, 장소, 주소, 소개, 포스터 경로, 지도·예매 링크, 공개/취소/메인 노출 여부 등)
  - `ARIMORI_contacts` 테이블: 문의 기능 확정 후 필요 여부 결정
  - Storage 버킷: 관리자가 업로드하는 공연 포스터 이미지 저장용
- Next.js API routes 또는 Server Actions에서 Supabase 서버 클라이언트로 CRUD 처리
- 일정 일시는 한국 시간대를 기준으로 처리
- Supabase 관련 환경변수, 테이블, Storage 이름에는 프로젝트 식별자 `ARIMORI_`를 사용
  - 서버 전용 환경변수 예: `ARIMORI_SUPABASE_SECRET_KEY` (필요할 때만 사용)
  - 브라우저 공개 환경변수는 Next.js 규칙상 `NEXT_PUBLIC_`을 먼저 붙여 `NEXT_PUBLIC_ARIMORI_SUPABASE_URL`, `NEXT_PUBLIC_ARIMORI_SUPABASE_PUBLISHABLE_KEY`로 사용
  - 테이블 예: `ARIMORI_admins`, `ARIMORI_schedules`, `ARIMORI_contacts`
  - Storage 버킷 예: `ARIMORI_posters`
- PostgreSQL에서 대문자가 포함된 테이블명은 SQL 작성 시 `"ARIMORI_schedules"`처럼 큰따옴표로 감싸서 사용
- `ARIMORI_SUPABASE_SECRET_KEY`가 필요한 경우 서버 전용 환경변수로만 사용하며, 일반적인 관리자 인증이나 CRUD는 Supabase Auth와 RLS를 우선 사용

## 7. 폴더/라우트 구조 (의미 기반 영어 네이밍)

```
arimori/
  PLAN.md
  DESIGN.md
  REFERENCE.md
  (Next.js 프로젝트는 스캐폴딩 시 생성 예정)
  src/app/
    layout.tsx              - 공통 레이아웃 + 하단 내비게이션(BottomNav)
    page.tsx                 - 홈 (최신소식, 이벤트)
    about/
      page.tsx                - 소개, 공연 유형
    schedule/
      page.tsx                - 월간 캘린더 + 날짜별 목록 + 공연 상세
    videos/
      page.tsx                - 유튜브 영상 리스트
    contact/
      page.tsx                - 섭외 연락처, SNS (문의 기능은 추후 확정)
    admin/
      page.tsx                - 관리자 메인 (일정 목록)
      login/page.tsx           - 관리자 로그인
      schedule/
        new/page.tsx            - 일정 등록
        [id]/edit/page.tsx       - 일정 수정
    api/
      schedule/route.ts        - 일정 CRUD API
      contact/route.ts         - 문의 기능 확정 시 추가 검토
  src/components/
    layout/BottomNav.tsx       - 하단 내비게이션 (탭별 컬러 전환 포함)
    schedule/CalendarView.tsx    - 일정 캘린더
    schedule/ScheduleList.tsx    - 선택 날짜 공연 목록
    schedule/ScheduleDetail.tsx  - 공연 상세 바텀시트/모달
  src/lib/
    supabase/client.ts          - 브라우저용 Supabase 클라이언트
    supabase/server.ts          - 서버용 Supabase 클라이언트
  middleware.ts                - /admin 접근 인증 검증
  public/
    logo.png
    assets/
      ...                       - 로고 외 고정 이미지/장식 요소
```

- 관리자가 등록하는 공연 포스터는 `public` 폴더가 아닌 Supabase Storage에 저장한다.

## 8. 확정된 결정 사항 요약

- [x] 하단 탭 5개: 홈 / 소개 / 일정 / 공연영상 / 공연문의
- [x] 탭 아이콘: lucide-react
- [x] 탭 선택 색상: 로고 4색을 탭마다 하나씩 매칭 (5번째는 1번 재사용)
- [x] 관리자 페이지: Supabase + Vercel 연동, 환경변수로 외부 접근 차단
- [x] 관리자 인증: Supabase Auth 사용, 공개 회원가입 차단
- [x] 모바일 일정 UX: 월간 캘린더 + 선택 날짜 공연 목록 + 공연 상세 바텀시트/모달
- [x] 관리자 업로드 공연 포스터: Supabase Storage 사용
- [x] Supabase 관련 환경변수·테이블·Storage 이름: `ARIMORI_` 프로젝트 식별자 사용 (`NEXT_PUBLIC_` 변수는 `NEXT_PUBLIC_ARIMORI_...`)
- [x] 페이지 라우트 네이밍: 페이지 성격에 맞는 영어 단어 사용 (ari1, ari2 방식 금지)
- [x] 레이아웃은 송석준 페이지의 3가지 규칙만 차용, 나머지는 신규 설계
- [ ] 문의 폼·저장·알림 방식: 추후 확정

## 9. 다음 단계 (스캐폴딩 시 진행할 것)

1. Next.js 프로젝트 생성 (TypeScript, Tailwind, App Router)
2. Supabase 프로젝트 생성 및 환경변수 설정 (`.env.local`, Vercel 환경변수)
3. 레이아웃 3원칙 + 브랜드 컬러 변수 적용한 `globals.css` 작성
4. `BottomNav` 컴포넌트 (5탭, 색상 전환) 구현
5. 각 탭 페이지 뼈대 생성 (콘텐츠는 순차적으로 채움)
6. `schedule` 월간 캘린더 + 날짜별 목록 + 공연 상세 바텀시트/모달 구현
7. Supabase Auth 기반 `admin` 인증 + 일정 CRUD + RLS 적용
8. Vercel 배포 + Supabase 연동 환경변수 설정
