# 아리모리 공연팀 웹페이지 — 디자인 가이드

> 작성일: 2026-09-19
> 참고: 송석준(icheon-next) 프로젝트에서는 레이아웃 3원칙만 차용, 그 외 모든 디자인은 신규 설계

## 1. 레이아웃 3원칙 (유일하게 차용한 부분)

```css
/* 1. 전체 컨테이너 — PC에서도 모바일 폭 유지 */
body {
  max-width: 600px;
  margin: 0 auto;
}

/* 2. 하단 고정 내비게이션 — 화면 중앙 고정 */
nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  max-width: 600px;
  width: 100%;
  z-index: 1000;
}

/* 3. 메인 콘텐츠 — 하단 내비게이션에 가리지 않게 여백 확보 */
main {
  padding-bottom: calc(var(--nav-height) + 20px);
}
```

이 외의 카드 스타일, 애니메이션, 색상, 타이포그래피 등은 전부 신규로 설계한다.

## 2. 브랜드 컬러

로고에 사용된 4가지 색을 CSS 변수로 등록하고, 탭 선택 상태 색상에 1:1로 매칭한다.

```css
:root {
  --brand-olive: #889050;   /* 로고 컬러 1 */
  --brand-brown: #70533d;   /* 로고 컬러 2 */
  --brand-teal:  #588d94;   /* 로고 컬러 3 */
  --brand-sage:  #82a381;   /* 로고 컬러 4 */

  --ink: #1c1c1c;           /* 미선택 아이콘/텍스트 기본색 */
  --nav-height: 64px;
}
```

### 탭 ↔ 컬러 매칭

| 탭 | 아이콘 | 선택 시 색상 변수 | HEX |
|---|---|---|---|
| 홈 | `Home` | `--brand-olive` | `#889050` |
| 소개 | `Users` | `--brand-brown` | `#70533d` |
| 일정 | `CalendarDays` | `--brand-teal` | `#588d94` |
| 공연영상 | `PlayCircle` | `--brand-sage` | `#82a381` |
| 공연문의 | `Mail` | `--brand-olive` (재사용) | `#889050` |

- 미선택 상태: 아이콘/라벨 모두 `--ink` (검은색 계열)
- 선택 상태: 아이콘/라벨 모두 해당 탭의 매칭 컬러로 전환
- 전환 방식: lucide-react 아이콘의 `color` prop (또는 `stroke`)에 현재 활성 탭 여부에 따라 변수 값을 바인딩

```tsx
// BottomNav 아이콘 색상 전환 예시 개념
const TAB_COLORS: Record<string, string> = {
  home: "var(--brand-olive)",
  about: "var(--brand-brown)",
  schedule: "var(--brand-teal)",
  videos: "var(--brand-sage)",
  contact: "var(--brand-olive)",
};

<Home color={isActive ? TAB_COLORS.home : "var(--ink)"} />
```

## 3. 아이콘 시스템

- **라이브러리**: `lucide-react`
- **선정 이유**:
  - Next.js/React 생태계 표준급으로 널리 쓰임
  - 트리쉐이킹 지원 → 사용한 아이콘만 번들에 포함되어 용량 최소화
  - `color`, `size`, `strokeWidth` 등 props로 상태별 스타일 전환이 간단
  - 일관된 스트로크 기반 디자인으로 트렌디한 느낌
- **하단 내비게이션 아이콘 매핑**

| 탭 | 아이콘 컴포넌트 |
|---|---|
| 홈 | `Home` |
| 소개 | `Users` |
| 일정 | `CalendarDays` |
| 공연영상 | `PlayCircle` |
| 공연문의 | `Mail` |

- **대안으로 검토 가능한 라이브러리** (필요 시 참고)
  - Phosphor Icons — thin/regular/bold/fill 스타일 옵션이 다양해 "선택됨" 상태를 굵기+색상으로 동시에 표현하고 싶을 때 유리
  - Tabler Icons — lucide와 유사한 라인 스타일이지만 아이콘 개수가 더 많음. 공연/문화예술 관련 특수 아이콘이 필요해지면 검토

## 4. 타이포그래피 / 폰트

- 프로젝트 신규 설계 — 특정 폰트 강제하지 않되, 가독성 좋은 한글 웹폰트(Pretendard 등) 사용을 기본값으로 검토
- 최종 폰트는 스캐폴딩 단계에서 확정

## 5. 브랜드 분위기

아리모리의 시각적 분위기는 아래 세 가지 키워드가 함께 느껴지도록 설계한다.

- 전통적이지만 고루하지 않음
- 자연스럽고 따뜻함
- 지역 문화예술의 친근함

전통적인 요소는 문양을 과도하게 직접 사용하기보다 여백, 종이·직물 계열의 은은한 질감, 절제된 곡선과 색 조합으로 현대적으로 표현한다. 공연 사진과 포스터가 중심이 되도록 장식 요소는 보조적으로 사용한다.

## 6. 컴포넌트 스타일 방향 (초안 — 추후 확정)

- 카드형 UI: 둥근 모서리(`border-radius`), 은은한 그림자 사용해 콘텐츠 구분
- 캘린더 뷰: 월간 셀에는 공연명 한 줄 또는 일정 개수를 표시하고, 선택 날짜의 공연 목록을 달력 아래에 노출
- 공연 상세: 모바일에서는 바텀시트를 우선 검토하고, 포스터·시간·장소·소개·지도/길찾기·예매/안내 링크를 제공
- 캘린더 강조색: 일정 탭 컬러(`--brand-teal`) 사용
- 문의 페이지: 1차 개발에서는 연락처와 SNS를 중심으로 개략적인 화면만 구성하고, 폼 스타일은 기능 확정 후 설계
- 하단 내비게이션: 시맨틱 요소로 `<nav>`를 사용하고 관리자 화면에서는 숨김
- 활성 탭: 색상뿐 아니라 아이콘 굵기, 배경 또는 표시선 중 하나를 함께 사용해 상태를 구분

## 7. 반응형 원칙

- 기준 폭 600px 컨테이너 안에서 모든 요소가 반응형으로 동작
- PC 브라우저에서 접속해도 좌우 여백을 두고 모바일 레이아웃을 그대로 노출 (모바일 특화 컨셉 유지)
- 하단 내비게이션은 모바일 기기의 하단 안전 영역(`safe-area-inset-bottom`)을 고려

## 8. Supabase 명명 규칙

- Supabase 관련 환경변수, 테이블, Storage 이름에는 `ARIMORI_` 프로젝트 식별자를 사용한다.
- 서버 전용 환경변수 예: `ARIMORI_SUPABASE_SECRET_KEY` (필요할 때만 사용)
- 공개 환경변수는 Next.js 요구사항에 따라 `NEXT_PUBLIC_ARIMORI_SUPABASE_URL`, `NEXT_PUBLIC_ARIMORI_SUPABASE_PUBLISHABLE_KEY` 형태로 사용한다.
- 테이블 예: `ARIMORI_admins`, `ARIMORI_schedules`, `ARIMORI_contacts`
- 공연 포스터 Storage 버킷 예: `ARIMORI_posters`
- PostgreSQL에서 대문자가 포함된 테이블명은 SQL 작성 시 `"ARIMORI_schedules"`처럼 큰따옴표로 감싸서 사용한다.
