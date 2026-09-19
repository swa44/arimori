# 핵심 자료 레퍼런스 (Key Reference)

> 목적: 아리모리 프로젝트에서 확정한 핵심 의사결정을 key-value 형태로 정리.
> 이후 비슷한 성격의 프로젝트(모바일 특화 소개/일정/문의형 웹앱)를 만들 때 그대로 참고 가능.

## 프로젝트 기본 정보

| Key | Value |
|---|---|
| 프로젝트명 | 아리모리 (공연팀) |
| 사이트 성격 | 모바일 특화 웹앱 (정적 페이지 아님, 기능 확장 전제) |
| 프레임워크 | Next.js (App Router) + TypeScript |
| 스타일링 | Tailwind CSS |
| 아이콘 라이브러리 | lucide-react |
| 백엔드/DB | Supabase |
| 배포 | Vercel |
| 관리자 인증 | Supabase Auth 이메일·비밀번호 + 관리자 권한 확인 + RLS |

## 레이아웃 3원칙 (재사용 가능한 코드 스니펫)

```css
body {
  max-width: 600px;
  margin: 0 auto;
}

nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  max-width: 600px;
  width: 100%;
}

main {
  padding-bottom: calc(var(--nav-height) + 20px);
}
```

- 출처: 송석준(icheon-next) 프로젝트의 `song.css`
- 용도: "모바일 폭 고정 + 하단 내비게이션 중앙 고정" 패턴이 필요한 모든 프로젝트에 재사용 가능
- 이 3가지 규칙 외의 디테일(카드 스타일, 색상, 애니메이션 등)은 프로젝트마다 새로 설계하는 것을 원칙으로 함

## 하단 내비게이션 구조 (재사용 패턴)

| Key | Value |
|---|---|
| 탭 개수 | 5개 (아리모리 기준) |
| 탭 구성 | 홈 / 소개 / 일정 / 공연영상 / 공연문의 |
| 아이콘 라이브러리 | lucide-react |
| 선택 상태 표현 방식 | 미선택=검은색(`--ink`), 선택=브랜드 컬러로 전환 |
| 컬러 매칭 방식 | 브랜드 컬러 개수만큼 탭에 순차 매칭, 초과 시 처음 컬러 재사용 |

## 브랜드 컬러 (아리모리)

| Key | Value |
|---|---|
| brand-olive | #889050 |
| brand-brown | #70533d |
| brand-teal | #588d94 |
| brand-sage | #82a381 |

## 라우트 네이밍 원칙

- 페이지 성격에 맞는 **의미 있는 영어 단어**로 라우트를 짓는다.
- 금지: `ari1`, `ari2`, `page1`처럼 순번만 붙이는 네이밍
- 예시: `/about`, `/schedule`, `/videos`, `/contact`, `/admin`

## 관리자 페이지 보호 원칙 (재사용 가능한 체크리스트)

- [ ] Supabase Auth 이메일·비밀번호 인증 적용
- [ ] 공개 회원가입을 차단하고 관리자 계정을 직접 생성
- [ ] 로그인 사용자 ID를 기준으로 관리자 권한 확인
- [ ] `NEXT_PUBLIC_` 접두사가 없는 `ARIMORI_` 서버 전용 환경변수에 민감 정보(Secret Key 등) 저장
- [ ] Vercel Project Settings의 Environment Variables에 프로덕션/프리뷰/개발 환경별로 등록
- [ ] `middleware.ts`에서 `/admin` 경로 접근 시 세션 검증 → 실패 시 로그인 페이지로 리다이렉트
- [ ] API route 또는 Server Action에서도 인증 및 관리자 권한 재검증 (미들웨어만 믿지 않음)
- [ ] RLS로 일정 등록/수정/삭제 권한을 관리자에게만 허용
- [ ] 클라이언트 번들에는 `NEXT_PUBLIC_ARIMORI_SUPABASE_URL`, `NEXT_PUBLIC_ARIMORI_SUPABASE_PUBLISHABLE_KEY`만 노출
- [ ] Secret Key는 일반적인 로그인이나 CRUD에 사용하지 않고, 필요한 서버 관리 작업으로 제한

## Supabase 데이터 모델 (초안)

| 테이블 | 주요 컬럼 | 용도 |
|---|---|---|
| `ARIMORI_admins` | user_id, created_at | Supabase Auth 사용자 중 관리자 권한 관리 |
| `ARIMORI_schedules` | title, start_at, end_at, location, address, description, poster_path, map_url, booking_url, is_public, is_cancelled, is_featured | 공연 일정 + 날짜별 목록 + 공연 상세 |
| `ARIMORI_contacts` (미정) | 문의 기능 확정 후 결정 | 문의 폼 저장 여부와 알림 방식은 추후 확정 |
| Storage bucket | `ARIMORI_posters` | 관리자가 업로드하는 공연 포스터 이미지 저장 |

- 일정 일시는 한국 시간대를 기준으로 처리한다.
- 로고와 고정 장식 이미지는 `public`, 관리자가 올리는 공연 포스터는 Supabase Storage로 구분한다.

## Supabase 명명 규칙

- Supabase 관련 환경변수, 테이블, Storage 이름은 `ARIMORI_` 프로젝트 식별자를 사용한다.
- 서버 전용 환경변수 예: `ARIMORI_SUPABASE_SECRET_KEY` (필요할 때만 사용)
- Next.js 공개 환경변수는 프레임워크 규칙상 `NEXT_PUBLIC_`이 앞에 필요하므로 `NEXT_PUBLIC_ARIMORI_SUPABASE_URL`, `NEXT_PUBLIC_ARIMORI_SUPABASE_PUBLISHABLE_KEY`로 사용한다.
- 테이블: `ARIMORI_admins`, `ARIMORI_schedules`, `ARIMORI_contacts`
- 공연 포스터 Storage 버킷: `ARIMORI_posters`
- PostgreSQL에서 대문자가 포함된 테이블명은 SQL 작성 시 `"ARIMORI_schedules"`처럼 큰따옴표로 감싸서 사용한다.

## 모바일 일정 UX

- 월간 캘린더 셀에는 공연명 한 줄 또는 일정 개수를 간결하게 표시
- 날짜를 선택하면 달력 아래에 해당 날짜의 공연 목록 표시
- 공연을 선택하면 바텀시트 또는 모달로 포스터, 시간, 장소, 소개, 지도/길찾기, 예매/안내 링크 표시

## 브랜드 분위기

- 전통적이지만 고루하지 않음
- 자연스럽고 따뜻함
- 지역 문화예술의 친근함
- 전통 요소는 은은한 질감, 여백, 절제된 곡선과 색 조합으로 현대적으로 표현

## 아이콘 라이브러리 선택 기준 (다음 프로젝트에도 적용 가능)

| 후보 | 특징 | 적합한 경우 |
|---|---|---|
| lucide-react (기본 선택) | 표준급, 트리쉐이킹 지원, props로 색상 전환 쉬움 | 대부분의 경우 기본값으로 채택 |
| Phosphor Icons | thin/regular/bold/fill 등 굵기 옵션 다양 | "선택됨" 상태를 굵기+색상으로 동시에 표현하고 싶을 때 |
| Tabler Icons | lucide와 유사한 라인 스타일, 아이콘 수가 더 많음 | 특수 도메인(공연/문화예술 등) 아이콘이 부족할 때 |

## 프로젝트 문서 구성 패턴 (다음에도 이렇게 나눌 것)

| 파일 | 역할 |
|---|---|
| `PLAN.md` | 정보 구조, 기능 범위, 폴더/라우트 구조, 확정된 의사결정 목록 |
| `DESIGN.md` | 레이아웃 규칙, 컬러 시스템, 아이콘 시스템, 컴포넌트 스타일 방향 |
| `REFERENCE.md` | 재사용 가능한 핵심 자료를 key-value로 압축 (이 문서) |
