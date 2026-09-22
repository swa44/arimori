# PWA 설치 안내와 스크롤바 숨김 재사용 가이드

이 문서는 아리모리에 적용한 PWA 설치 안내 UI와 모바일 모달 스크롤바 숨김 방식을 다른 프로젝트에서도 재사용하기 위한 기록이다.

## 1. 현재 구현 파일

- 설치 안내 컴포넌트: `src/components/pwa/PwaInstallPrompt.tsx`
- 전역 배치와 Apple 메타데이터: `src/app/layout.tsx`
- Web App Manifest: `src/app/manifest.ts`
- Service Worker: `public/sw.js`
- PWA 아이콘: `public/icons/`
- 설치 안내와 스크롤바 CSS: `src/app/globals.css`

## 2. 필수 조건

- 배포 환경은 HTTPS여야 한다. 로컬 개발에서는 `localhost`가 허용된다.
- Manifest에 `name`, `short_name`, `start_url`, `scope`, `display: "standalone"`, 테마 색상과 아이콘을 넣는다.
- Android용으로 192px, 512px 아이콘과 `maskable` 아이콘을 제공한다.
- iOS용 180px Apple Touch Icon과 `appleWebApp.capable` 메타데이터를 제공한다.
- Service Worker를 등록해야 브라우저의 설치 가능 조건을 충족할 수 있다.

## 3. Android 설치 안내

Chrome, Samsung Internet 등 Chromium 계열 브라우저는 설치 조건이 충족되면 `beforeinstallprompt` 이벤트를 발생시킨다.

핵심 흐름:

```tsx
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

useEffect(() => {
  function capturePrompt(event: Event) {
    event.preventDefault();
    setInstallPrompt(event as BeforeInstallPromptEvent);
  }

  window.addEventListener("beforeinstallprompt", capturePrompt);
  return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
}, []);

async function install() {
  if (!installPrompt) return;
  await installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  if (outcome === "accepted") dismiss();
  setInstallPrompt(null);
}
```

- 이벤트 객체를 상태에 저장하고 사용자가 `설치` 버튼을 눌렀을 때만 `prompt()`를 실행한다.
- `appinstalled` 이벤트가 발생하면 설치 안내를 닫는다.
- 브라우저가 설치 조건을 충족하지 못하면 `beforeinstallprompt`가 발생하지 않으므로 설치 버튼도 표시하지 않는다.

## 4. iOS 설치 안내

iOS Safari는 `beforeinstallprompt`를 제공하지 않는다. 따라서 설치 버튼 대신 사용 방법을 안내한다.

```text
공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.
```

iOS 감지와 설치 완료 감지:

```tsx
const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);

const standalone = window.matchMedia("(display-mode: standalone)").matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
```

- iOS에서는 공유 아이콘과 안내 문구만 표시한다.
- 홈 화면에서 실행 중이면 `navigator.standalone`이 참이므로 안내를 표시하지 않는다.
- Android와 데스크톱 PWA는 `(display-mode: standalone)`으로 설치 실행 여부를 확인한다.

## 5. 안내 닫기 상태

아리모리는 사용자가 안내를 닫으면 현재 브라우저 세션 동안 다시 표시하지 않는다.

```tsx
sessionStorage.setItem("arimori-install-dismissed", "true");
```

- 탭이나 브라우저 세션이 종료된 뒤에는 다시 안내할 수 있다.
- 장기간 다시 표시하지 않으려면 `sessionStorage` 대신 `localStorage`를 사용한다.
- 프로젝트를 복사할 때 저장 키는 서비스별 고유 이름으로 변경한다.

## 6. 하단 설치 안내 배치

하단 내비게이션과 iPhone 안전영역을 피해서 배치한다.

```css
.install-prompt {
  bottom: calc(var(--nav-height) + 20px + env(safe-area-inset-bottom));
  left: 50%;
  max-width: 550px;
  position: fixed;
  transform: translateX(-50%);
  width: calc(100% - 28px);
  z-index: 1200;
}
```

- `env(safe-area-inset-bottom)`을 사용해야 홈 인디케이터와 겹치지 않는다.
- 설치 안내의 `z-index`는 일반 콘텐츠보다 높고 상세 모달보다 낮게 둔다.

## 7. Service Worker 주의사항

- 관리자 화면과 React Server Component 요청은 캐시하지 않는다.
- 페이지 이동 요청은 네트워크를 우선 사용하고 실패하면 캐시 또는 오프라인 페이지를 표시한다.
- 아이콘과 `/_next/static/` 정적 파일은 캐시 우선 전략을 사용할 수 있다.
- 캐시 정책을 변경하면 `CACHE_NAME`의 버전을 올려 이전 캐시를 정리한다.

## 8. Android·iOS·PC 스크롤바 숨김

스크롤 기능은 유지하고 오른쪽 스크롤바만 숨겨야 한다. `overflow: hidden`을 사용하면 사용자가 내용을 스크롤할 수 없으므로 사용하지 않는다.

```css
.scroll-container {
  -ms-overflow-style: none;
  overflow: auto;
  scrollbar-width: none;
}

.scroll-container::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}
```

브라우저별 역할:

- `scrollbar-width: none`: Firefox
- `::-webkit-scrollbar`: Android Chrome, Samsung Internet, iOS Safari, macOS Safari, Chrome
- `-ms-overflow-style: none`: 구형 Edge와 IE 계열 보조 대응
- `overflow: auto`: 터치, 휠, 트랙패드 스크롤 유지

아리모리 상세 모달 적용 예시:

```css
.detail-sheet {
  -ms-overflow-style: none;
  max-height: 85vh;
  overflow: auto;
  scrollbar-width: none;
}

.detail-sheet::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}
```

모달을 열었을 때 배경 페이지까지 함께 움직이지 않도록 다음 처리도 사용한다.

```tsx
useEffect(() => {
  document.body.style.overflow = modalOpen ? "hidden" : "";
  return () => { document.body.style.overflow = ""; };
}, [modalOpen]);
```

### Samsung Internet PWA의 오른쪽 스크롤 위치 표시기

갤럭시에서 Samsung Internet으로 설치한 PWA는 `html` 또는 `body`가 문서 스크롤을 담당하면 `::-webkit-scrollbar`를 숨겨도 화면 오른쪽에 네이티브 스크롤 위치 표시기를 별도로 표시할 수 있다. 이 경우에는 최상위 문서의 스크롤을 막고, 앱 컨테이너가 스크롤을 담당하도록 구조를 바꾼다.

아리모리에서는 `.site-shell`을 앱 스크롤 컨테이너로 사용한다.

```css
html {
  height: 100%;
  overflow: hidden;
}

body {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.site-shell {
  height: 100vh;  /* 100dvh 미지원 브라우저용 */
  height: 100dvh;
  min-height: 0;
  -ms-overflow-style: none;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.site-shell::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}
```

이 구조에서는 `window`가 아니라 `.site-shell`이 스크롤되므로 페이지가 바뀔 때 스크롤 위치도 직접 초기화해야 한다.

```tsx
useEffect(() => {
  document.querySelector<HTMLElement>(".site-shell")?.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
}, [pathname]);
```

주의사항:

- `html`, `body`에만 스크롤바 숨김 CSS를 추가하는 것으로는 Samsung Internet PWA의 네이티브 표시기가 남을 수 있다.
- 실제 스크롤은 `.site-shell`의 `overflow-y: auto`로 유지한다.
- `100vh`를 먼저 쓰고 `100dvh`를 뒤에 두어 구형 브라우저와 동적 모바일 화면 높이를 함께 대응한다.
- 내부 스크롤 컨테이너로 변경한 뒤에는 하단 고정 내비게이션, 전체 화면 모달, iOS 안전 영역을 함께 확인한다.
- 설치된 PWA가 이전 CSS를 캐시했다면 앱을 완전히 종료한 뒤 다시 실행하거나 새로고침해서 확인한다.

## 9. 하단 내비게이션 이동 반응과 로딩 화면

서버 컴포넌트에서 Supabase 데이터를 불러오는 동적 페이지는 링크를 누른 후 새 화면이 준비될 때까지 짧은 대기 시간이 생길 수 있다. 이때 이전 화면을 그대로 둔 채 내비게이션의 활성 상태만 먼저 바꾸면 화면과 메뉴가 서로 다른 페이지를 가리키는 것처럼 보인다.

특히 모바일에서 `onPointerDown`으로 활성 상태를 바꾸면 손가락을 떼지 않고 길게 누르는 동안 다음 문제가 발생한다.

1. `pointerdown`은 발생해 내비게이션 표시가 먼저 바뀐다.
2. 실제 링크 클릭과 페이지 이동은 손가락을 뗀 뒤에 발생한다.
3. 사용자가 계속 누르고 있으면 이전 화면과 다음 메뉴 활성 상태가 동시에 보인다.

따라서 내비게이션 이동 상태는 `onPointerDown`이 아니라 Next.js `Link`의 실제 클라이언트 이동이 확정되는 `onNavigate`에서 시작한다.

```tsx
<Link
  href={href}
  onNavigate={() => {
    if (!isCurrentPath(href)) setPendingHref(href);
  }}
>
  {label}
</Link>
```

이동이 시작되면 기존 페이지를 계속 보여주는 대신 콘텐츠 영역을 즉시 로딩 화면으로 덮는다. 하단 내비게이션은 로딩 화면보다 높은 `z-index`를 사용해 현재 이동 대상을 계속 보여준다.

```tsx
{pendingHref && !isCurrentPath(pendingHref) ? (
  <div className="route-loading-overlay" role="status" aria-live="polite">
    <span className="route-loading-spinner" aria-hidden="true" />
    <span className="sr-only">페이지를 불러오는 중입니다.</span>
  </div>
) : null}
```

```css
.route-loading-overlay {
  align-items: center;
  background: var(--paper);
  display: flex;
  inset: 0;
  justify-content: center;
  position: fixed;
  z-index: 900;
}

.route-loading-spinner {
  animation: route-loading-spin 700ms linear infinite;
  border: 3px solid rgba(88, 141, 148, 0.2);
  border-radius: 50%;
  border-top-color: var(--brand-teal);
  height: 30px;
  width: 30px;
}

@keyframes route-loading-spin {
  to { transform: rotate(360deg); }
}
```

페이지 경로가 바뀌면 대기 상태를 해제한다. 네트워크 오류 등으로 경로가 바뀌지 않는 경우 화면이 계속 가려지지 않도록 안전 해제 시간도 함께 둔다.

```tsx
useEffect(() => {
  const resetPending = window.setTimeout(() => setPendingHref(null), 0);
  return () => window.clearTimeout(resetPending);
}, [pathname]);

useEffect(() => {
  if (!pendingHref) return;
  const safetyReset = window.setTimeout(() => setPendingHref(null), 10000);
  return () => window.clearTimeout(safetyReset);
}, [pendingHref]);
```

추가로 주요 메뉴를 미리 불러오면 실제 대기 시간도 줄일 수 있다.

```tsx
useEffect(() => {
  tabs.forEach(({ href }) => router.prefetch(href));
}, [router]);
```

핵심 원칙:

- 터치가 시작된 시점과 실제 이동이 확정된 시점을 구분한다.
- 길게 누르기만 했을 때는 활성 메뉴와 화면을 바꾸지 않는다.
- 이동이 확정되면 이전 화면을 즉시 가리고 로딩 상태를 명확히 보여준다.
- 현재 페이지를 다시 누른 경우에는 로딩 화면을 띄우지 않는다.
- 데이터 요청 시간을 숨기기만 하지 말고 `prefetch`를 사용해 실제 이동 시간도 줄인다.
- 비정상적으로 이동이 오래 걸릴 경우를 대비해 로딩 상태의 안전 해제를 둔다.

## 10. 일반 앱과 관리자 앱을 서로 다른 PWA로 분리

아리모리는 같은 Vercel 프로젝트를 사용하면서 도메인을 다음처럼 분리한다.

- 일반 앱: `https://ari-mori.com`
- 관리자 앱: `https://admin.ari-mori.com/admin`
- 관리자 로그인: `https://admin.ari-mori.com/admin/login`

Vercel 프로젝트의 `Settings → Domains`에 `admin.ari-mori.com`을 추가하고, Vercel이 안내하는 CNAME 레코드를 DNS에 등록한다. 연결 상태가 `Valid Configuration`이 되면 별도 프로젝트나 별도 배포 없이 같은 코드가 두 도메인에서 동작한다.

라우팅은 `src/proxy.ts`에서 처리한다.

- `admin.ari-mori.com`의 루트(`/`)는 `/admin`으로 이동한다.
- 일반 도메인의 `/admin` 경로는 같은 경로를 유지한 채 `admin.ari-mori.com`으로 이동한다.
- localhost와 `192.168.x.x` 개발 주소에서는 기존 `/admin` 접근을 그대로 허용한다.
- `/admin/manifest.webmanifest`는 로그인하지 않은 상태에서도 반드시 읽을 수 있어야 한다. 이 경로를 인증으로 막으면 로그인 화면에서 Android의 `beforeinstallprompt`가 발생하지 않는다.

관리자 PWA 설정 파일:

- 관리자 레이아웃 및 Manifest 연결: `src/app/admin/layout.tsx`
- 관리자 Manifest: `src/app/admin/manifest.ts`
- 공통 설치 안내: `src/components/pwa/PwaInstallPrompt.tsx`
- Service Worker: `public/sw.js`

관리자 Manifest의 주요 값은 다음과 같다.

```ts
{
  id: "/admin",
  name: "아리모리 관리",
  start_url: "/admin",
  scope: "/admin",
  display: "standalone",
}
```

일반 앱과 관리자 앱은 서로 다른 origin이므로 Android에서 각각 별도의 설치 가능 여부, 브라우저 저장소, PWA 앱 ID를 사용한다. 관리자 앱 설치 테스트는 기존 일반 앱 내부가 아니라 Chrome 또는 Samsung Internet 주소창에서 `https://admin.ari-mori.com/admin/login`을 직접 열어 진행한다.

문의 접수 문자에 포함되는 관리자 상세 링크도 `https://admin.ari-mori.com/admin/inquiry/{id}` 형식을 사용한다. 필요할 경우 배포 환경변수 `ARIMORI_ADMIN_URL`로 관리자 origin을 덮어쓸 수 있으며, 설정하지 않으면 `https://admin.ari-mori.com`을 기본값으로 사용한다.

재설치 테스트 순서:

1. 기존 일반 앱 또는 관리자 앱을 기기에서 삭제한다.
2. 브라우저의 기존 아리모리 탭을 닫고 브라우저를 다시 실행한다.
3. 일반 앱은 `https://ari-mori.com`, 관리자 앱은 `https://admin.ari-mori.com/admin/login`을 각각 브라우저 주소창에서 연다.
4. Android는 설치 안내의 `설치` 버튼으로 PWA 설치를 진행한다.
5. iOS는 공유 버튼의 `홈 화면에 추가`를 사용한다.
6. 안내를 닫은 기록이 남아 있으면 해당 브라우저 탭을 완전히 닫거나 사이트 데이터를 초기화한 뒤 다시 확인한다.

다음에 관리자 PWA 설치 방법을 안내할 때는 이 절의 도메인, 매니페스트 공개 예외, 재설치 순서를 기준으로 설명한다.

## 11. 재사용 체크리스트

1. Manifest 경로와 앱 이름을 새 프로젝트에 맞게 변경한다.
2. 180px, 192px, 512px 아이콘을 교체한다.
3. `maskable` 아이콘은 로고 주변에 안전 여백을 충분히 둔다.
4. Service Worker의 캐시 이름과 오프라인 경로를 변경한다.
5. 설치 안내의 `sessionStorage` 키를 서비스별로 변경한다.
6. 하단 내비게이션 높이와 `safe-area-inset-bottom`을 설치 안내 위치에 반영한다.
7. iOS에서는 설치 버튼이 아니라 공유 메뉴 안내를 표시한다.
8. 이미 standalone으로 실행 중이면 설치 안내를 숨긴다.
9. 스크롤바를 숨길 때 `overflow: auto`는 유지한다.
10. Android Chrome, Samsung Internet, iOS Safari, 설치된 PWA 모드에서 각각 확인한다.
11. Samsung Internet PWA에서 네이티브 스크롤 표시기가 남으면 문서 대신 앱 컨테이너를 스크롤하도록 구성한다.
12. 모바일 하단 메뉴는 `onPointerDown`으로 이동 상태를 시작하지 않고 실제 탐색이 확정된 뒤 로딩 상태를 표시한다.
