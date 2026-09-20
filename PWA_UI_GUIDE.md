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

## 9. 재사용 체크리스트

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
