# 06. Frontend and Style Spec

## Follow-up To-do
- [ ] [added: 2026-02-28] [status: decision-needed] Node image 비율/크롭 규칙(`cover` vs `contain`)을 Figma Inspect 기준으로 확정
- [ ] [added: 2026-02-28] [status: decision-needed] Title/Body 타이포(폰트 패밀리, 크기, 굵기, line-height) 확정
- [ ] [added: 2026-02-28] [status: decision-needed] 6하원칙 chip 토큰 이름(`--chip-when` vs `--chip-where`) 최종 확정
- [x] [added: 2026-02-28] [status: completed 2026-02-28] Drawer 좌측 강조를 위해 lemon strip 레이어를 추가한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] Drawer 좌측 white overlay alpha를 약화해 레몬 강조가 눌리지 않게 미세 조정한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] Right Agent Drawer content 영역에 Top Bar safe zone을 적용해 상단 겹침을 제거한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] Top Bar 광학 중심 보정을 위해 아이콘 정사각 프레임 + 좌우 고정 슬롯 레이아웃을 적용한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] [Phase 1.1-reopen] Right Agent Drawer 시각 리파인을 구조 회귀 없이 재적용한다(원형 Tip/Chat + 보라 점 + 단순 gradient field, content/glass/full-height 유지).
- [x] [added: 2026-02-28] [status: completed 2026-02-28] [Phase 1.2] Drawer 좌측 경계 블렌딩을 overlay-first(무마스크) 방식으로 재구성한다(`base linear fade + radial alpha + canvas-color edge overlay`).
- [x] [added: 2026-02-28] [status: completed 2026-02-28] [Phase 1.3] Drawer 좌측 경계 품질 보정을 위해 `content safe inset`과 `transparent tail`을 강화한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] [Phase 1.4] 경계 미세 절단감 제거를 위해 `alpha-tail 0 종료 + neutral alpha overlay + rail strip 약화 + safe inset 확대`를 적용한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] [Phase 1] 우측 Agent Drawer(`Glow rail + filled field + content panel`) 열기/닫기 구조를 Tip/Chat 토글과 함께 구현한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] [Phase 2] 기존 `ChatDialog` 로직을 Drawer Chat body로 이관/재사용해 채팅 기능을 유지한다.
- [ ] [added: 2026-02-28] [status: execution-needed] [Phase 3] 우측 상단 context shelf에 노드 드래그 첨부 UI를 연결하고, 첨부 카드 맥락을 AI 응답 입력 컨텍스트로 전달한다.
- [ ] [added: 2026-02-28] [status: execution-needed] Canvas 단계 전환 상태(stage state)와 배경 토큰(`data-stage`) 매핑 로직을 연결한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] Canvas 단면 배경(base + 중앙 gradient) 스타일을 초기 stage(`research-diverge`) 기준으로 코드에 적용
- [x] [added: 2026-02-28] [status: completed 2026-02-28] 관리자 모드 단축키(`Ctrl/Cmd+Shift+A`)와 초기 진입 안내 UI를 추가하고, 프로토타입 상태 배지를 관리자 모드로 제한
- [x] [added: 2026-02-28] [status: completed 2026-02-28] 빈 캔버스 드래그 pan(배경 이동) 인터랙션을 NodeMap에 반영
- [x] [added: 2026-02-28] [status: completed 2026-02-28] `Instrument Sans` 웹 폰트를 설치하고 기본 UI/Node 텍스트에 적용
- [x] [added: 2026-02-28] [status: completed 2026-02-28] pan 동작의 modifier key 정책을 `기본 drag pan`으로 확정
- [x] [added: 2026-02-28] [status: completed 2026-02-28] `Instrument Sans` 적용 범위를 전체 UI로 확정하고, 제목급 텍스트는 `Inter` 예외 정책으로 확정
- [x] [added: 2026-02-28] [status: completed 2026-02-28] (1차) 노드 연결선 프론트 스타일(2px 흰 선, 연결 side 포트, 52px 앵커, fanout/clearance)을 적용
- [x] [added: 2026-02-28] [status: completed 2026-02-28] 노드 연결선 코너 처리 방식을 `orthogonal + arc`로 확정
- [ ] [added: 2026-02-28] [status: execution-needed] (2차) 원인→결과 자동 정렬/정합 강화 규칙을 도입한다. 필요 이유: 현재는 source/target 의미 보존과 사용자 수동 배치 의도를 우선해야 하므로, 강제 재정렬은 의미 왜곡/UX 충돌 리스크가 있어 별도 단계로 분리

## 1. Document Meta
- Version: `v0.5-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`
- Related Mockups:
  - Figma: `ccid-Visual-Thinking-Machine` (`node-id=566-870`)
  - Node reference image: user-provided card preview (Title + body + chips)
  - Node image variant reference: user-provided card preview (Title + body + image + chips)

## 2. Purpose
목업 기반 프론트엔드 구조와 스타일 규칙을 명시한다.  
현재 문서는 **Node Card + Canvas Background + Top Bar + Right Agent Drawer** 디자인 규칙을 중심으로 확정/가확정 값을 정리한다.

## 3. Visual Direction
- Keywords: `clean`, `compact`, `semantic chips`, `idea summary`
- Tone: professional, minimal, readable
- Do: 짧은 요약 + 핵심 메타(category/phase)를 한 카드에서 즉시 인지
- Don't: 과한 장식, 긴 본문 노출, 불명확한 색상 의미

## 4. Screen Inventory
| Screen | Route | Purpose | Source Mockup |
|---|---|---|---|
| Main Canvas | `/` |  |  |
|  |  |  |  |

## 5. Layout Template
### 5.1 Global Layout
- Header:
- Main:
- Side Panel:
- Dialog/Overlay:

### 5.2 Grid and Spacing
- Base grid:
- Container width:
- Spacing scale:

## 6. Design Tokens
### 6.1 Color Tokens
| Token | Hex | Usage |
|---|---|---|
| `--node-bg` | `#FFFFFF` | Node Card 배경 |
| `--node-title` | `#4A4A4A` | Node title 텍스트 |
| `--node-body` | `#666666` | Node body 텍스트 |
| `--chip-when-bg` | `#9DBCFF` | `When` chip 배경 |
| `--chip-where-bg` | `#E6E8B4` | `Where` chip 배경 |
| `--chip-how-bg` | `#8FE5EA` | `How` chip 배경 |
| `--chip-what-bg` | `#97E9C0` | `What` chip 배경 |
| `--chip-why-bg` | `#D2EEA1` | `Why` chip 배경 |
| `--chip-who-bg` | `#A999F1` | `Who` chip 배경 |
| `--chip-problem-bg` | `#EFAEA8` | `Problem` chip 배경 |
| `--chip-solution-bg` | `#E8A0E6` | `Solution` chip 배경 |
| `--chip-text` | `#111111` | 공통 chip 텍스트 |
| `--canvas-bg-base` | `#A6FFD3` | 단면 캔버스 기본 배경 |
| `--canvas-stage-research-diverge` | `#4DD6F8` | 리서치 확산 단계 중심 gradient 색상 |
| `--canvas-stage-research-converge` | `#FFFF86` | 리서치 수렴 단계 중심 gradient 색상 |
| `--canvas-stage-ideation-diverge` | `#FF969F` | 아이디에이션 확산 단계 중심 gradient 색상 |
| `--canvas-stage-ideation-converge` | `#D5A6FF` | 아이디에이션 수렴 단계 중심 gradient 색상 |
| `--canvas-gradient-center-x` | `50%` | 중심 gradient X 위치 |
| `--canvas-gradient-center-y` | `80%` | 중심 gradient Y 위치 |
| `--canvas-gradient-radius-x` | `60%` | 중심 gradient 가로 반경 |
| `--canvas-gradient-radius-y` | `78%` | 중심 gradient 세로 반경 |

### 6.2 Typography Tokens
| Token | Value | Usage |
|---|---|---|
| `--font-family-ui` | `"Instrument Sans", "Inter", "system-ui", sans-serif` | 앱 공통 UI 텍스트 (default) |
| `--font-family-heading` | `"Inter", "Instrument Sans", "system-ui", sans-serif` | 제목급 텍스트 (Node Card title 포함) |
| `--font-family-node-body` | `"Instrument Sans", "Inter", "system-ui", sans-serif` | Node body/보조 텍스트 |
| `--font-size-node-title` | TBD | Title(summary) 라인 |
| `--font-size-node-body` | TBD | 본문 미리보기 텍스트 |
| `--font-weight-node-title` | TBD | Title 강조 |
| `--line-height-node-title` | TBD | Title 가독성 |
| `--line-height-node-body` | TBD | Body 가독성 |

### 6.5 Interaction Tokens (Canvas Pan)
| Token | Value | Usage |
|---|---|---|
| `--canvas-pan-enabled` | `true` | 빈 캔버스 drag 이동 활성화 |
| `--canvas-pan-mode` | `drag-empty-space` (default) | pan 트리거 방식 |
| `--canvas-pan-modifier` | `none` (resolved) | modifier key 요구 여부 |
| `--admin-shortcut` | `Ctrl/Cmd + Shift + A` | 관리자 모드 토글 단축키 |
| `--admin-mode-default` | `off` | 초기 관리자 모드 상태 |
| `--admin-shortcut-hint` | `on-first-entry` | 초기 진입 시 단축키 안내 노출 정책 |
| `--agent-drawer-default-mode` | `chat` | Drawer 초기 모드 |
| `--agent-drawer-open-state` | `closed` | Drawer 초기 열림 상태 |
| `--agent-context-max-items` | `2` (initial) | 상단 context shelf 카드 최대 개수(초기값) |
| `--agent-rail-width` | `78px` | Tip/Chat 세로 버튼 레일 폭(구현값) |
| `--agent-toggle-size` | `52px` (target) | Tip/Chat 원형 버튼 크기 |
| `--agent-toggle-gap` | `10px` (target) | Tip/Chat 버튼 간 간격 |
| `--agent-toggle-bg` | `#FFFFFF` | Tip/Chat 버튼 배경 |
| `--agent-toggle-text` | `#111111` | Tip/Chat 버튼 텍스트 |
| `--agent-tip-dot-size` | `12px` (target) | Tip 버튼 보라색 상태 점 크기 |
| `--agent-tip-dot-color` | `#C084FC` | Tip 버튼 상태 점 색상 |
| `--agent-field-bg-base` | `#AEE7D0` | 우측 drawer field 기본 채우기 |
| `--agent-field-radial` | `radial-gradient(100.27% 97.75% at 97.75% 50%, #E0FFF4 0%, #AEF1DA 22.12%, #BBD8E6 80.17%, #FFFFEA 100%)` | 우측 drawer radial gradient |
| `--agent-field-base-fade` | `linear-gradient(90deg, rgba(166,255,211,0) 0%, rgba(166,255,211,0.70) 24%, rgba(166,255,211,1) 46%)` | base 채움의 좌측 투명 페이드(끝점 alpha 0 보장) |
| `--agent-field-radial-tail-alpha` | `0` (at 100%) | radial gradient 말단 alpha 종료값 |
| `--agent-field-lemon-strip` | `linear-gradient(90deg, rgba(241,255,138,0) 0%, rgba(241,255,138,0.70) 22%, rgba(241,255,138,0.34) 54%, rgba(241,255,138,0) 100%)` | 좌측 레몬 강조 스트립 레이어(투명 시작 feather) |
| `--agent-field-lemon-strip-width` | `172px` | drawer shell 좌측 레몬 스트립 폭(rail+field seam 포함) |
| `--agent-shell-overflow` | `visible` | rail 버튼 클리핑 방지를 위한 shell overflow 정책 |
| `--agent-field-edge-overlay` | `linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 100%)` | 좌측 경계 neutral alpha-fade 오버레이(윤곽 feather 복원) |
| `--agent-field-edge-overlay-role` | `alpha-fade-only` | 오버레이 용도(색 보정 금지) |
| `--agent-field-edge-overlay-width` | `64px` | 좌측 경계 마감 오버레이 폭 |
| `--agent-content-safe-inset-left` | `40px` (phase 1.4 target) | 좌측 경계와 glass 콘텐츠 간 안전 여백 |
| `--agent-content-safe-inset-right` | `28px` (phase 1.4 target) | 우측 경계와 glass 콘텐츠 간 안전 여백 |
| `--agent-content-safe-inset-top` | `56px` (target) | Drawer content 상단 보호 여백(Top Bar overlap 방지) |
| `--agent-rail-strip-opacity-peak` | `0.10` (phase 1.4 target) | rail 경계 강조 strip 최대 alpha |
| `--agent-rail-strip-width` | `4px` (phase 1.4 target) | rail 경계 강조 strip 폭 |
| `--agent-field-mask-policy` | `none` | 경계 블렌딩은 mask 대신 overlay로 처리 |
| `--agent-field-radial-blur` | `0px` | 우측 drawer radial blur (회색 눌림 방지 목적) |
| `--agent-field-radial-border` | `none` | 우측 drawer radial overlay border |
| `--agent-drawer-inset-top` | `0px` | Drawer 상단 여백(기본 0) |
| `--agent-drawer-inset-bottom` | `0px` | Drawer 하단 여백(기본 0) |
| `--agent-drawer-motion` | `off-canvas-slide` | drawer open/close 모션(`width` tween 금지) |
| `--agent-field-width` | `430px` | 우측 drawer field 고정 폭 |
| `--agent-field-left-corner-radius` | `30px` | drawer field 좌측 상/하단 코너 라운드 |
| `--agent-content-glass-bg` | `rgba(255,255,255,0.32)` | content panel 글라스 배경 |
| `--agent-content-glass-border` | `rgba(255,255,255,0.65)` | content panel 글라스 보더 |
| `--agent-content-glass-blur` | `12px` | content panel blur 강도 |

### 6.3 Radius / Shadow / Border
| Token | Value | Usage |
|---|---|---|
| `--radius-node` | `30px` | Node 카드 외곽 |
| `--shadow-node` | `0 8px 24px -12px rgba(0,0,0,0.22)` | Node 카드 그림자 |
| `--border-node` | `none` | Node 카드 보더 |
| `--radius-chip` | pill (`9999px`) | Category/Phase chip |
| `--radius-node-image` | `30px` | Node 내부 이미지 라운드 |

### 6.4 Spacing Tokens
| Token | Value | Usage |
|---|---|---|
| `--space-node-x` | `11px` | Node 좌/우 패딩 |
| `--space-node-top` | `16px` | Node 상단 패딩 |
| `--space-node-bottom` | `12px` | Node 하단 패딩 |
| `--space-node-gap` | `12px` | Node 내부 블록 간격 |
| `--space-node-image-h` | `136px` | Node 이미지 영역 높이 (code 기준) |
| `--chip-pad-y` | `6px` | Chip 수직 패딩 |
| `--chip-pad-x` | `8px` | Chip 수평 패딩 |
| `--chip-gap-inner` | `4px` | Chip 내부 gap |

### 6.6 Connector Tokens
| Token | Value | Usage |
|---|---|---|
| `--edge-line-color` | `#FFFFFF` | 노드 간 연결선 기본 색상 |
| `--edge-line-width` | `2px` | 노드 간 연결선 두께 (확정) |
| `--edge-port-offset-top` | `52px` | 카드 상단 기준 포트 Y 기준점 |
| `--edge-port-outer-size` | `20px` | 포트 외곽 원(white ring 포함) |
| `--edge-port-inner-size` | `12px` | 포트 내부 컬러 원 |
| `--edge-port-ring-color` | `#FFFFFF` | 포트 외곽 링 색상 |
| `--edge-clearance-x` | `20px` | 카드에서 선이 빠져나갈 최소 수평 이격 |
| `--edge-fanout-step` | `26px` | 다중 엣지 미세 분산 간격 (포트 중첩 방지) |
| `--edge-fanout-max` | `104px` | 다중 엣지 미세 분산 최대 절대값 |
| `--edge-routing-mode` | `orthogonal-arc` | 직교 경로 + arc 코너 방식 |
| `--edge-corner-radius` | `24px` (initial) | 직교 코너 arc 반지름 |
| `--edge-lane-gap` | `80px` | 역순/혼잡 배치 시 상하 우회 lane 간격 |

### 6.7 Top Bar Tokens
| Token | Value | Usage |
|---|---|---|
| `--topbar-pad-y` | `12px` | Top bar 상하 패딩 |
| `--topbar-pad-x` | `36px` | Top bar 좌우 패딩 |
| `--topbar-home-cluster-padding` | `2px` | 아이콘+Home 클러스터 패딩 |
| `--topbar-home-cluster-gap` | `2px` | 아이콘과 Home 텍스트 간격 |
| `--topbar-home-cluster-align` | `center` | 아이콘+Home 세로 정렬 |
| `--topbar-title` | `Visual Thinking Machine` | 상단 중앙 타이틀 텍스트 |
| `--topbar-home-label` | `Home` | 좌측 홈 라벨 |
| `--topbar-home-icon` | `custom inline svg` | 좌측 홈 아이콘 소스 |
| `--topbar-home-icon-size` | `24px` | 홈 아이콘 width/height |
| `--topbar-home-icon-aspect` | `1 / 1` | 홈 아이콘 비율 |
| `--topbar-icon-frame-size` | `24px` | 홈 아이콘 정사각 프레임 크기 |
| `--topbar-side-slot-width` | `92px` (initial) | 좌/우 고정 슬롯 폭(중앙 정렬 균형) |
| `--topbar-safe-zone-h` | `56px` | Top bar + 여유를 포함한 상단 보호 높이 |
| `--topbar-text-color` | `#838383` | Home/Title 텍스트 색상 |
| `--topbar-font-family` | `"Instrument Sans"` | Home/Title 폰트 |
| `--topbar-font-size` | `16px` | Home/Title 폰트 크기 |
| `--topbar-font-weight` | `500` | Home/Title 폰트 굵기 |
| `--topbar-line-height` | `100%` (`16px`) | Home/Title 줄높이 |
| `--topbar-letter-spacing` | `-0.352px` | Home/Title 자간 |

## 7. Component Style Template
| Component | Structure | States | Variant | Notes |
|---|---|---|---|---|
| Input Panel |  | default/disabled/loading |  |  |
| Suggestion Card |  | default/active/hover | category-based |  |
| Chat Dialog |  | open/loading/error |  |  |
| Node Card | `summary + body + (optional image) + chips` | default/highlighted | text-only / image | this section is detailed below |
| Canvas Stage Background | `single-surface fill + central stage gradient` | fixed-stage (initial) | 4 stage color presets | right-edge glow excluded |
| Canvas Pan Interaction | `empty-space drag` | idle/panning/dragging-node | modifier/no-modifier | NodeMap interaction spec |
| Node Connector Edge | `edge + connected-side endpoint ports` | default/highlighted/overlapped | input/chat/cross | logical flow with fixed source/target semantics |
| Top Bar | `left home action + centered title + right fixed slot` | default | desktop overlay | top padding `12px 36px` |
| Admin Shortcut + Status Overlay | `shortcut hint + admin status badge` | hint-visible/admin-off/admin-on | first-entry / dismissed | prototype status visibility control |
| Right Agent Drawer (Tip/Chat) | `glow rail + filled field + content panel` | closed/open-tip/open-chat | with-context / no-context | drawer boundary includes rail and right field |

### 7.8 Top Bar (Mockup V1 Spec)
#### A. Home Cluster Layout
- `display: flex`
- `padding: 2px`
- `align-items: center`
- `gap: 2px`

#### B. Home Icon Shape/Size
- 아이콘은 아래 path를 사용하는 custom inline SVG로 고정한다.
- `width: 24px`
- `height: 24px`
- `aspect-ratio: 1 / 1`
- 아이콘은 `24x24` 정사각 프레임 안에서 `center` 정렬한다.
- 아이콘 프레임 기준:
  - `display: inline-flex`
  - `align-items: center`
  - `justify-content: center`
  - `flex-shrink: 0`

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M5 19.0002V10.3082C5 10.0522 5.05733 9.8099 5.172 9.58123C5.28667 9.35257 5.44467 9.16423 5.646 9.01623L11.031 4.93823C11.313 4.7229 11.635 4.61523 11.997 4.61523C12.359 4.61523 12.683 4.7229 12.969 4.93823L18.354 9.01523C18.556 9.16323 18.714 9.3519 18.828 9.58123C18.9427 9.8099 19 10.0522 19 10.3082V19.0002C19 19.2682 18.9003 19.5019 18.701 19.7012C18.5017 19.9006 18.268 20.0002 18 20.0002H14.616C14.3867 20.0002 14.1947 19.9229 14.04 19.7682C13.8853 19.6129 13.808 19.4209 13.808 19.1922V14.4232C13.808 14.1946 13.7307 14.0029 13.576 13.8482C13.4207 13.6929 13.2287 13.6152 13 13.6152H11C10.7713 13.6152 10.5797 13.6929 10.425 13.8482C10.2697 14.0029 10.192 14.1946 10.192 14.4232V19.1932C10.192 19.4219 10.1147 19.6136 9.96 19.7682C9.80533 19.9229 9.61367 20.0002 9.385 20.0002H6C5.732 20.0002 5.49833 19.9006 5.299 19.7012C5.09967 19.5019 5 19.2682 5 19.0002Z" fill="#838383"/>
</svg>
```

#### C. Typography (Home + Visual Thinking Machine)
- `color: #838383`
- `font-family: "Instrument Sans"`
- `font-size: 16px`
- `font-style: normal`
- `font-weight: 500`
- `line-height: 100%` (`16px`)
- `letter-spacing: -0.352px`

#### D. Optical Centering Strategy
- Top bar는 `left slot / center title / right slot` 3영역으로 구성한다.
- 좌우 슬롯은 `--topbar-side-slot-width` 고정 폭을 사용해 시각적 균형을 유지한다.
- 좌측 슬롯에는 Home 클러스터를 배치하고, 우측 슬롯은 비어 있더라도 동일 폭을 유지한다.
- 중앙 타이틀은 좌측 콘텐츠 폭 변화와 무관하게 viewport 중심 정렬을 유지해야 한다.
- 1차 구현은 `fixed slot width`를 사용하고, 동적 측정(`ResizeObserver`) 방식은 범위에서 제외한다.

### 7.1 Node Card (Mockup V1 Spec)
#### A. Container
- `display: flex`
- `width: 232px`
- `padding: 16px 16px 12px 16px`
- `flex-direction: column`
- `align-items: flex-start`
- `gap: 12px`
- border: `none`
- background: `#FFF`
- border-radius: `30px`
- typography:
  - title-level text uses `--font-family-heading` (`Inter` priority)
  - body/supporting text uses `--font-family-node-body` (`Instrument Sans` priority)

#### B. Content Structure
1. Title line:
   - format: `Title(summary) - <summary text>`
   - example: `Title(summary) - Lorem Ipsum is simply dummy text`
   - purpose: 핵심 의미를 한 줄에서 요약
2. Body preview:
   - example: `These keywords are grouped into a sense of speed, energy explosion, ...`
   - 줄 수: 최대 3줄(overflow 시 말줄임)
3. Optional image block:
   - shown only when `imageUrl` exists in node data
   - style: full width, `height: 136px`, `border-radius: 30px`, `object-fit: cover`
4. Metadata chip row:
   - chips displayed left-to-right
   - default order: `Category` then `Phase`
   - example: `When` + `Problem`

#### C. Chip Rules
- chip shape: pill (`--radius-chip`)
- chip text language: English only
- category chip color: semantic by category
- phase chip color:
  - `Problem`: red family
  - `Solution`: pink/purple family

#### D. Interaction / State
- `default`: base style
- `highlighted`: used when node is linked to active suggestion
- `hover`/`active` specifics: TBD (if needed for interactive nodes)

#### E. Language Policy
- Node card user-visible text is English-only.
- Title/body generated from AI must be rendered in English.

#### F. Data Binding (Image Variant)
- title source: `data.label`
- body source: `data.content`
- category chip source: `data.category`
- phase chip source: `data.phase`
- image source: `data.image_url` or `data.imageUrl` (optional)

### 7.2 Chip Component (5W1H + Phase) - Mockup V1
#### A. Base Style (shared)
- `display: inline-flex`
- `padding: 6px 8px`
- `justify-content: center`
- `align-items: center`
- `gap: 10px`
- `border-radius: 99px`
- border: `none`
- text: short single-word label (`When`, `Where`, `How`, `What`, `Why`, `Who`, `Problem`, `Solution`)

#### B. Variant Colors
| Chip | Background | Text |
|---|---|---|
| `When` | `var(--chip-when-bg, #9DBCFF)` | `var(--chip-text, #111111)` |
| `Where` | `var(--chip-where-bg)` | `var(--chip-text, #111111)` |
| `How` | `var(--chip-how-bg)` | `var(--chip-text, #111111)` |
| `What` | `var(--chip-what-bg)` | `var(--chip-text, #111111)` |
| `Why` | `var(--chip-why-bg)` | `var(--chip-text, #111111)` |
| `Who` | `var(--chip-who-bg)` | `var(--chip-text, #111111)` |
| `Problem` | `var(--chip-problem-bg)` | `var(--chip-text, #111111)` |
| `Solution` | `var(--chip-solution-bg)` | `var(--chip-text, #111111)` |

#### C. Note on Provided Style Snippet
- 제공된 스니펫(`background: var(--Chips-When, #9DBCFF);`)은 색상값 기준으로 `When` chip에 매칭된다.
- 문구상 `Where` 스타일로 전달되었으므로, 토큰 네이밍은 UI-005에서 최종 확정한다.

### 7.3 Canvas Background (Single-Surface Stage Gradient)
#### A. Goal
- 기존 `Problem/Solution` 2분할 배경을 제거하고 단면(single-surface) 캔버스를 사용한다.
- 기본 배경(`--canvas-bg-base`) 위에 중앙 radial gradient를 중첩해 단계별 분위기만 교체 가능하게 설계한다.

#### B. Visual Rules
1. Base fill:
   - color: `--canvas-bg-base` (`#A6FFD3`)
2. Central gradient:
   - type: radial gradient
   - position: `50% 80%`
   - size: `60% x 78%`
   - stage color: 아래 단계 토큰 중 1개 선택
     - research-diverge: `--canvas-stage-research-diverge` (`#4DD6F8`)
     - research-converge: `--canvas-stage-research-converge` (`#FFFF86`)
     - ideation-diverge: `--canvas-stage-ideation-diverge` (`#FF969F`)
     - ideation-converge: `--canvas-stage-ideation-converge` (`#D5A6FF`)
3. Exclusion:
   - 우측 edge glow(세로형 yellow strip)는 현재 범위에서 적용하지 않는다.

#### C. Stage Policy (Initial)
- 현재 구현 범위는 프론트 스타일 고정값이다.
- 초기 기본 stage는 `research-diverge`를 사용한다.
- 단계 전환 로직은 이후 작업으로 분리한다(`Follow-up To-do` 참조).

#### D. Implementation Targets
- `components/NodeMap.jsx`:
  - 기존 배경 분할 레이어 제거
  - 단일 배경 레이어 클래스 적용
- `styles/globals.css`:
  - canvas 배경 토큰 및 stage별 gradient 스타일 정의
- `components/ThinkingMachine.jsx`:
  - 필요 시 stage 전달 prop/data attribute 정의 (초기에는 고정값 허용)

### 7.4 Canvas Pan Interaction (Miro/Figma-style)
#### A. Goal
- 사용자가 빈 배경 영역을 drag할 때 캔버스(viewport)가 이동해야 한다.
- 노드를 drag할 때는 노드 이동이 우선되어야 하며 pan이 개입하면 안 된다.

#### B. Behavior Rules
1. Empty-space drag:
   - action: viewport pan
   - cursor: `grab`(idle) -> `grabbing`(panning)
2. Node drag:
   - action: node move only
   - pan disabled while node is actively dragged
3. Wheel/trackpad:
   - 기존 zoom/scroll 동작 유지
4. Touch:
   - single-finger drag: pan
   - pinch: zoom

#### C. Key Policy (Resolved)
- 확정 정책: modifier 없는 빈 영역 drag pan
- `Space + drag` 제한 모드는 현재 범위에서 적용하지 않음

#### D. Implementation Targets
- file: `components/NodeMap.jsx`
- primary config:
  - ReactFlow pan 설정 활성화
  - 노드 drag와 pan 충돌 방지 설정
- QA baseline:
  - 노드/엣지가 많은 상태에서도 프레임 드랍 없이 drag pan 동작

### 7.5 Admin Shortcut and Prototype Status Overlay
#### A. Goal
- 프로토타입/디버그 상태 정보는 일반 화면에서 숨기고 관리자 모드에서만 노출한다.
- 사용자가 최초 진입 시 단축키를 인지할 수 있도록 안내 UI를 제공한다.

#### B. Shortcut Policy
1. Toggle key:
   - `Ctrl/Cmd + Shift + A`
2. Default state:
   - `admin mode = off`
3. Persistence:
   - admin mode: `localStorage`
   - shortcut hint dismissed state: `sessionStorage`

#### C. UI Rules
1. Initial entry shortcut hint:
   - 위치: 상단 중앙
   - 내용: `Press Ctrl/Cmd + Shift + A to toggle Admin Mode.`
   - 액션: `Dismiss`
2. Admin status overlay (admin mode on):
   - 위치: 상단 우측
   - 표시 항목:
     - `Admin Mode` badge
     - `Autonomous Agent Active`
     - runtime counts (`Nodes`, `Suggestions`)
3. Admin mode off:
   - 프로토타입 상태 배지는 렌더링하지 않는다.

#### D. Implementation Targets
- `components/ThinkingMachine.jsx`:
  - keyboard listener, admin mode/hint state 관리
  - overlay UI 렌더 조건 제어
- `styles/globals.css`:
  - 필요 시 오버레이 스타일 토큰 확장

### 7.6 Right Agent Drawer (Tip/Chat)
#### A. Boundary Definition (Resolved)
- Drawer는 다음 3개를 하나의 단위로 연다/닫는다.
  1. `Glow rail`: Tip/Chat 버튼이 배치되는 세로 영역
  2. `Filled right field`: rail 우측의 채워진 배경 영역
  3. `Content panel`: field 내부의 실제 Tip/Chat 콘텐츠 패널
- 즉, rail만 독립적으로 열고 닫지 않으며, rail + right field + content가 동시 전환된다.

#### B. Modes and States
1. `closed`:
   - rail 축약 상태만 노출(또는 최소 인터랙션 핸들)
   - right field/content는 비노출
2. `open-tip`:
   - rail + right field + tip content panel 노출
3. `open-chat`:
   - rail + right field + chat content panel 노출

#### C. Interaction Rules
1. Rail toggle:
   - `Tip` 버튼 클릭 시 `open-tip`
   - `Chat` 버튼 클릭 시 `open-chat`
2. Same-button toggle:
   - 현재 활성 모드 버튼 재클릭 시 `closed`
3. Cross-mode switch:
   - open 상태에서 다른 버튼 클릭 시 닫지 않고 mode만 즉시 전환
4. Close actions:
   - panel `X` 버튼으로 `closed`
   - `Esc`로 `closed`

#### C.1 Visual Update (Mockup Alignment 2026-02-28)
1. Rail and field:
  - rail은 카드형 박스보다 단순한 세로 레이어로 표현한다.
  - right field는 `base fill + radial gradient overlay` 조합으로 표현한다.
  - right field의 좌측 상/하단 코너는 `30px` 라운드(`--agent-field-left-corner-radius`)를 적용한다.
  - 좌측 레몬 강조가 부족할 경우 `lemon strip` 레이어를 추가해 강한 밝기 띠를 만든다.
  - 좌측 경계는 `overlay-first` 정책으로 처리한다: `base linear fade + radial alpha + canvas-color edge overlay`.
   - `mask-image`는 사용하지 않는다(유지보수/디버깅 단순성 우선).
   - radial 값은 `radial-gradient(100.27% 97.75% at 97.75% 50%, #E0FFF4 0%, #AEF1DA 22.12%, #BBD8E6 80.17%, #FFFFEA 100%)`를 기준으로 한다.
   - 배경이 회색으로 눌려 보이는 현상 방지를 위해 radial blur는 기본 `0px`로 유지한다.
   - 경계 seam 제거를 위해 `base/radial` 말단 alpha는 모두 `0`으로 종료한다.
2. Tip/Chat buttons:
   - 버튼은 동일한 원형 크기(`--agent-toggle-size`)로 통일한다.
   - 기본 스타일:
     - background: `--agent-toggle-bg`
     - text: `--agent-toggle-text`
     - soft shadow only (강한 border/ring 없음)
   - 버튼 라벨은 `Tip`, `Chat` 텍스트만 사용(아이콘 없음).
3. Tip status dot:
   - `Tip` 버튼 우상단에 작은 보라색 점을 배치한다.
   - 초기 정책: 고정 노출(Phase 2에서 상태 연동 여부 재검토).
4. Selection emphasis:
   - mockup 기준으로 Tip/Chat 간 시각적 차이는 최소화한다.
   - active mode는 과한 색상 변화 대신 미세 shadow/opacity 차이로만 표현한다.
5. Constraint:
   - 위 visual 리파인은 drawer 경계 규칙(`rail + field + content` 동시 open/close)을 변경하지 않는다.
   - content panel 구조(헤더/본문/입력 또는 동등 placeholder)는 제거하지 않는다.

#### C.3 Edge Blend Strategy (Overlay-first, No Mask)
1. Goal:
   - Drawer 좌측 경계가 solid cut처럼 보이지 않도록 시각적으로 부드럽게 연결한다.
2. Layer order (back to front):
   - `base linear fade`: field 기본 채움 자체를 좌측에서 투명->불투명으로 전환
   - `radial gradient`: 중심 색상 분위기 부여(좌측 영향은 alpha로 제한)
   - `lemon strip`: 좌측 강조용 고채도 레이어 (`--agent-field-lemon-strip`)
   - `neutral alpha edge overlay`: 색 보정이 아닌 투명 페이드 전용 오버레이로 경계 마감을 정리
   - `content safe inset`: glass 패널/카드가 좌측 경계에 닿지 않도록 `left 40px`, `right 28px` 내부 여백 유지
3. Non-goals:
   - `mask-image`/`-webkit-mask-image` 도입
   - content panel/glass 스타일 변경
4. Guardrails:
   - rail의 좌측 경계 강조(strip)는 `low-alpha + narrow-width`로 약화해 경계가 다시 도드라지지 않게 유지
   - field의 full-height/open-close/off-canvas motion 규칙은 그대로 유지
5. Alpha termination policy:
   - `base fade`의 좌측 tail은 `alpha 0`으로 시작해야 한다.
   - `radial gradient`의 말단(outer edge)은 `alpha 0`으로 끝나야 한다.
   - `edge overlay`는 중립색 기반이며 마지막 stop이 반드시 `alpha 0`이어야 한다.
   - 레몬 강조 적용 단계에서는 strip를 투명 시작형으로 두고(`0 -> peak -> 0`), `edge overlay`는 완충용 alpha(`0.18 -> 0.08 -> 0`)로 윤곽 feather를 유지한다.

#### C.2 Structure Lock Policy (Regression Guard)
1. Allowed in visual refinement:
   - rail/field 색상, gradient, 버튼 shape/spacing, 점 인디케이터 스타일
2. Not allowed in visual refinement:
   - content panel 삭제
   - `X`/`Esc` 닫기 동작 제거
   - legacy fallback 채팅 경로 제거(Phase 2 이전)
3. Lock target:
   - `rail + field + content` 동시 open/close 동작은 시각 변경과 무관하게 항상 유지한다.
4. Review rule:
   - visual patch PR/commit에는 `preserved:`(content/close/fallback) 항목을 반드시 명시한다.

#### D. Context Shelf (Top-right Cards)
1. Purpose:
   - 우측 상단 작은 카드 영역은 AI 응답 참고용 context shelf다.
2. Attachment source:
   - 사용자가 canvas 노드를 drag하여 shelf에 첨부한다.
3. AI context:
   - shelf 카드의 title/body/chips 메타와 현재 대화 맥락을 함께 프롬프트 컨텍스트로 전달한다.
4. Initial rollout:
   - 1차: shelf UI/상태 구조 확정
   - 2차: 실제 drag attach 및 프롬프트 결합 로직 연결

#### E. Layout Rules
- Desktop:
  - 우측 고정 drawer
  - rail은 캔버스와 right field 경계선에 인접
  - rail 버튼은 좌측 lemon strip 밴드 위에 배치되어 field 채움과 시각적으로 분리되지 않아야 한다.
  - rail/right field는 viewport 높이를 꽉 채운다(`top: 0`, `bottom: 0`)
  - drawer shell은 `overflow: visible`, field body만 `overflow: hidden`을 사용한다(닫힘→열림 경로 버튼 클리핑 방지).
  - right field 내부 content stack(context shelf + glass panel)은 `--agent-content-safe-inset-top`만큼 아래에서 시작한다.
  - 상단 보호영역(`--topbar-safe-zone-h`)은 Top Bar와 Drawer 콘텐츠 겹침 방지 목적이며, rail 버튼 세로 중앙 정렬에는 영향을 주지 않는다.
  - drawer는 `field fixed width + off-canvas translate`로 열고 닫는다(중간 폭 리플로우로 인한 줄바꿈 변경 방지)
  - content panel은 right field 내부에서 상/중/하(헤더/메시지/입력)로 구성
- Mobile:
  - 세부 규칙은 별도 확정(Open question)

#### F. Implementation Targets
- `components/ThinkingMachine.jsx`:
  - drawer open/mode state 및 keyboard close(`Esc`) 관리
- `components/RightAgentDrawer.jsx`:
  - field 배경 합성(`base linear fade + radial + edge overlay`)과 경계 시각 품질 제어
- `components/SuggestionPanel.jsx`:
  - 필요 시 rail/context shelf와의 상호작용 이벤트 연결
- `components/ChatDialog.jsx`:
  - 기존 dialog 패턴을 drawer body 구조로 이관하거나 분리
- `styles/globals.css`:
  - rail glow, right field fill, drawer transition 스타일 정의

#### G. Phased Execution Plan (Approved Sequence)
1. Phase 1 - Drawer Shell and Mode Toggle
   - Scope:
     - `rail + field + content`를 단일 drawer 컨테이너로 열고 닫기
     - `Tip`/`Chat` mode 전환 및 same-button close
     - `X`, `Esc` 닫기 동작
   - Non-goals:
     - API 채팅 호출 연결
     - context shelf 드래그 첨부
   - Exit criteria:
     - `T-017`, `T-018` 통과
     - 기존 SuggestionPanel/노드 캔버스 동작 회귀 없음
1.1 Phase 1.1 - Visual Refinement to Mockup
   - Scope:
     - Tip/Chat 버튼을 동일한 원형 화이트 버튼으로 정렬
     - Tip 버튼 보라색 상태 점 적용
     - rail/field 배경을 단순 gradient 스타일로 리파인
     - content panel 글라스모피즘 스타일 유지
     - rail/field viewport full-height(`top:0`, `bottom:0`) 적용
   - Non-goals:
     - 채팅 API 동작 변경
     - context shelf drag attach 구현
   - Exit criteria:
     - 버튼/배경이 목업 시각 규칙(C.1)과 일치
     - content panel이 리파인 후에도 유지된다(`T-021`)
     - rail/field가 상하 여백 없이 full-height로 렌더링된다(`T-022`)
     - `T-017`, `T-018`, `T-020` 재검증 통과
1.2 Phase 1.2 - Left Edge Blend Stabilization (Overlay-first)
   - Scope:
     - field 좌측 경계를 `overlay-first` 방식으로 재구성(`base linear fade + radial alpha + canvas edge overlay`)
     - `mask`/`blur` 없이 경계 품질 확보
   - Non-goals:
     - content panel glass 토큰/구조 수정
     - drawer 인터랙션 동작 변경
   - Exit criteria:
     - 좌측 경계가 solid cut 없이 자연스럽게 보인다
     - content panel 시각/구조 회귀 없음
     - `T-020`, `T-021`, `T-022` + 경계 QA 항목 통과
1.3 Phase 1.3 - Edge-safe Inset and Transparent Tail Tuning
   - Scope:
     - content 래퍼 좌우 안전 여백을 확대해 glass 효과가 경계에 직접 닿지 않도록 조정
     - edge overlay 폭 확대 및 gradient tail의 `alpha 0` 끝점을 명시적으로 강화
   - Non-goals:
     - drawer 폭/모션 방식 변경
     - content panel 구성 요소 변경
   - Exit criteria:
     - 좌측 경계가 여전히 끊겨 보이지 않는다
     - `T-023`, `T-024` 통과
1.4 Phase 1.4 - Alpha-tail Zero and Neutral Overlay Enforcement
   - Scope:
     - `base/radial` 말단 alpha를 `0`으로 강제 종료
     - edge overlay를 `neutral alpha-fade only`로 고정(색 보정 목적 사용 금지)
     - rail 경계 strip를 추가 약화(`opacity peak 0.10`, `width 4px`)
     - content safe inset을 `left 40px/right 28px`로 확대
   - Non-goals:
     - drawer 구조 변경
     - mask/blur 기반 기법 도입
   - Exit criteria:
     - 좌측 경계 미세 절단감이 시각적으로 사라진다
     - `T-023`, `T-024` + alpha 정책 QA 항목 통과
2. Phase 2 - Chat Feature Migration (No Backend Change)
   - Scope:
     - 기존 `ChatDialog`의 메시지/요청/로딩/에러/변환 흐름을 Drawer Chat body로 이관 또는 재사용
     - `/api/chat`, `/api/chat-to-nodes` 경로 및 payload 계약은 유지
   - Backward-compatibility rule:
     - migration 완료 전까지 기존 `ChatDialog` fallback 경로를 유지한다.
   - Exit criteria:
     - 기존 채팅 기능 parity 확보(메시지 생성, 변환, 오류 표시)
     - `T-005`, `T-006`, `T-016`, `T-018` 통과
3. Phase 3 - Context Shelf Attachment and Prompt Context Merge
   - Scope:
     - 노드 드래그 첨부 UI 구현(상단 shelf)
     - 첨부 카드 메타(title/body/chips)를 채팅 프롬프트 context block에 병합
   - Risk control:
     - 첨부 context는 토큰 budget을 넘지 않도록 요약/컷오프 규칙 적용
     - 첨부 실패 시 채팅 기본 경로는 계속 동작해야 함
   - Exit criteria:
     - 첨부/제거 상태가 UI와 요청 payload에 일치
     - `T-019` + 채팅 회귀(`T-005`, `T-006`) 통과

#### H. Data Contract Notes (Phase 2/3)
1. Phase 2:
   - 기존 chat 계약 유지:
     - `/api/chat`: `suggestion + messages + history`
     - `/api/chat-to-nodes`: `messages + existingNodes`
   - Drawer 도입으로 endpoint/payload key를 변경하지 않는다.
2. Phase 3:
   - `attachedContextNodes`(initial key name) 필드를 optional 확장으로 추가한다.
   - 각 item 최소 필드:
     - `nodeId`, `title`, `contentPreview`, `category`, `phase`
   - 서버/agent에서 context 미지원이더라도 기본 채팅 경로는 fallback으로 유지한다.
3. Size guardrail:
   - context shelf 입력은 최대 `--agent-context-max-items` 이내로 제한
   - per-item content는 preview 길이 제한(세부 수치 TBD)

### 7.7 Node Connector Edge (Mockup V2)
#### A. Scope and Rollout
- 이번 범위(1차): 프론트엔드 안전 적용
  - 연결선/포트 시각 스타일
  - 포트 위치(상단 52px), 선 굵기(2px), 카드 겹침 회피 라우팅
  - source/target 의미를 유지한 방향 고정
- 다음 범위(2차): 정합 강화 로직
  - 원인→결과 자동 정렬 및 재배치 정책은 To-do로만 유지

#### B. Visual Rules (Resolved)
1. Edge line:
   - color: `--edge-line-color` (`#FFFFFF`)
   - width: `--edge-line-width` (`2px`)
   - routing: `orthogonal + arc corner` (수평/수직 세그먼트 + 둥근 코너)
2. Endpoint ports:
   - 각 edge의 양 끝점은 표시하되, 노드 기준으로는 연결이 존재하는 side에만 포트를 표시
   - outer: white ring circle
   - inner: 해당 노드 `category`의 chip color
   - z-layer: node layer에서 렌더링하여 카드 위로 노출
3. Port position:
   - 카드 측면 기준 `top: 52px` 지점
   - source는 우측 포트, target은 좌측 포트
4. Data semantics:
   - 방향 정규화 규칙:
     - `Problem`/`Solution` 쌍은 항상 `Problem -> Solution`
     - 그 외 케이스는 좌->우 시각 흐름을 우선
   - 위 규칙은 프론트 렌더 단계에서 적용한다.

#### C. Overlap Risk Mitigation
1. Multi-edge overlap (same side, same node):
   - `52px` 기준점을 유지하면서 미세 분산(fanout) 적용
   - offset is derived from slot order and total degree per side
   - offset sequence example: `0, -26, +26, -52, +52`
   - fanout 범위는 `--edge-fanout-max` 이내
   - slot order는 상대 노드의 Y 위치 기준으로 자동 정렬(위 연결은 위 포트, 아래 연결은 아래 포트)
2. Card overlap (line crossing card body):
   - 카드 측면 포트에서 즉시 수평 이탈(`--edge-clearance-x`) 후 경로 진행
   - source clear point -> orthogonal lane -> target clear point -> target 포트 순으로 경로 구성
   - 각 꺾임점은 `arc`로 라운딩 처리(`--edge-corner-radius`)
   - source/target의 Y 범위가 벌어진 경우, 외곽 우회보다 두 카드 사이 corridor 경로를 우선 선택
   - 목적: 선이 카드 본문/라운드 코너 영역을 가로지르지 않도록 보장
3. Reverse placement (right-to-left layouts):
   - 노드가 역순으로 배치된 경우 상/하 우회 lane(`--edge-lane-gap`)을 통해 ㄹ자 경로를 우선 적용
   - 코너는 동일하게 arc 라운딩 처리

#### D. Logical Flow Policy
- 현재 정책: `Problem -> Solution` 우선 + 좌->우 시각 흐름 정규화
- 원인/결과 자동 재정렬은 2차 범위에서 별도 도입

#### E. Implementation Targets
- `components/NodeMap.jsx`:
  - custom `nodeTypes`, `edgeTypes` 연결
  - edge routing 관련 설정
- `components/ThinkingMachine.jsx`:
  - edge 데이터에 `sourceHandle`/`targetHandle` 명시
  - edge 메타(category, fanout index) 전달
- `styles/globals.css`:
  - connector/port 토큰 스타일 정의
- `components/nodes/ThinkingNode.jsx`:
  - 연결된 좌/우 side만 포트 렌더링
- `components/edges/ConnectorEdge.jsx`:
  - custom orthogonal path + arc corner + fanout + clearance routing

## 8. Motion and Interaction
- Page transition:
- Panel transition:
- Hover/active behavior:
- Loading behavior:
- Reduced motion policy:
- Canvas interaction:
  - empty-space drag pan enabled
  - node drag precedence over pan
  - cursor affordance (`grab`/`grabbing`)
  - single-surface stage gradient background (base + central radial)
  - shortcut hint appears on first entry (`Ctrl/Cmd + Shift + A`)
  - prototype status overlay is visible only in admin mode
  - right agent drawer opens/closes as one unit (`rail + field + content`)
- Edge interaction:
  - direction normalized (`Problem -> Solution`, else left-to-right`)
  - endpoint ports shown only on connected sides (per node)
  - fanout and clearance routing for overlap prevention
  - orthogonal + arc corner path for readability and overlap avoidance

### 8.1 Top Bar Interaction
- 좌측 `Home`는 custom inline SVG 아이콘 + `Home` 텍스트 조합으로 구성한다.
- 홈 아이콘은 `24x24` 정사각 프레임 안에 배치되어야 하며 glyph가 프레임 중앙에 정렬되어야 한다.
- Top bar는 좌우 동일 폭 고정 슬롯(`--topbar-side-slot-width`)을 사용해 중앙 타이틀 균형을 유지한다.
- 중앙 타이틀은 `Visual Thinking Machine` 고정 문자열을 사용한다.
- Top bar는 캔버스 상단 오버레이로 렌더링하고, 홈 링크 외 영역은 pointer-events를 차단한다.

## 9. Responsive Rules
| Breakpoint | Rule |
|---|---|
| Mobile |  |
| Tablet |  |
| Desktop |  |

## 10. Accessibility Checklist
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation for major actions
- [ ] Focus ring visibility
- [ ] Screen-reader label completeness
- [ ] Motion alternatives for reduced-motion users

## 11. Implementation Mapping
| Spec Area | File/Directory |
|---|---|
| Screen composition | `components/*`, `pages/index.jsx` |
| Global style | `styles/globals.css` |
| Visual graph layer | `components/NodeMap.jsx` |
| Interaction panels | `components/InputPanel.jsx`, `components/SuggestionPanel.jsx`, `components/ChatDialog.jsx` |
| Web font loading (`Instrument Sans`) | `styles/globals.css` |
| Heading font exception (`Inter` priority) | `components/ThinkingMachine.jsx`, `components/SuggestionPanel.jsx`, `components/ChatDialog.jsx`, `styles/globals.css` |
| Canvas single-surface stage background | `components/NodeMap.jsx`, `styles/globals.css` |
| Canvas pan behavior | `components/NodeMap.jsx` |
| Top bar UI | `components/TopBar.jsx`, `components/ThinkingMachine.jsx` |
| Admin shortcut / prototype status overlay | `components/ThinkingMachine.jsx` |
| Right agent drawer / context shelf | `components/ThinkingMachine.jsx`, `components/SuggestionPanel.jsx`, `components/ChatDialog.jsx`, `styles/globals.css` |
| Connector edge style/routing | `components/NodeMap.jsx`, `components/ThinkingMachine.jsx`, `styles/globals.css`, `components/nodes/ThinkingNode.jsx`, `components/edges/ConnectorEdge.jsx` |

## 12. Open Questions
| ID | Question | Owner | Due Date | Status |
|---|---|---|---|---|
| UI-001 | Node card outer radius exact value(및 코너 형태)는? |  |  | Resolved (`30px`, 2026-02-28) |
| UI-002 | Title/body typography exact token 값은? |  |  | Open |
| UI-003 | `Solution` chip color token은 무엇으로 확정할지? |  |  | Resolved (`#E8A0E6`, 2026-02-28) |
| UI-004 | Node hover/active state가 목업 범위에 포함되는지? |  |  | Open |
| UI-005 | 전달된 `Where` 스타일의 토큰 이름이 `--Chips-When`인 이유(오타/의도) 확인 필요 |  |  | Open |
| UI-006 | Canvas pan을 기본 drag로 둘지, `Space+drag`로 제한할지? |  |  | Resolved (기본 drag pan, 2026-02-28) |
| UI-007 | `Instrument Sans` 적용 범위를 전체 UI로 확장할지 Node/Card 우선으로 둘지? |  |  | Resolved (전체 UI + 제목급 Inter 예외, 2026-02-28) |
| UI-008 | 노드 연결선 포트 표시 범위를 시작점만/양 끝점 모두 중 무엇으로 할지? |  |  | Resolved (edge 양 끝점 기준 + 노드에서는 연결된 side만 표시, 2026-02-28) |
| UI-009 | 노드 연결선 두께를 몇 px로 확정할지? |  |  | Resolved (`2px`, 2026-02-28) |
| UI-020 | Top bar의 홈 아이콘 소스를 무엇으로 고정할지? |  |  | Resolved (`custom inline svg (provided path)`, 2026-02-28) |
| UI-010 | 노드 좌우 이동 후 방향 처리를 source/target 스왑할지 여부 |  |  | Resolved (Problem->Solution 우선 정규화 + 좌->우 정렬, 2026-02-28) |
| UI-011 | 직교 경로 코너 처리 방식을 `arc`/`quadratic` 중 무엇으로 할지 |  |  | Resolved (`arc`, 2026-02-28) |
| UI-012 | Canvas stage 전환 트리거를 어떤 상태값/이벤트로 연결할지? |  |  | Open |
| UI-013 | Canvas 우측 edge glow를 포함할지? |  |  | Resolved (미포함, 2026-02-28) |
| UI-014 | 관리자 단축키를 어떤 키 조합으로 고정할지? |  |  | Resolved (`Ctrl/Cmd + Shift + A`, 2026-02-28) |
| UI-015 | Agent Drawer의 닫기 정책에 outside click까지 포함할지? |  |  | Open |
| UI-016 | Mobile에서 Agent Drawer를 right panel로 유지할지 bottom sheet로 전환할지? |  |  | Open |
| UI-017 | Context shelf 최대 카드 수/정렬 규칙(최신순, 수동정렬)을 어떻게 확정할지? |  |  | Open |
| UI-018 | full-height 규칙에서 iOS safe-area inset을 0으로 고정할지, 환경별 보정값을 둘지? |  |  | Open |
| UI-019 | Drawer 좌측 경계 블렌딩 방식을 `mask`로 할지 `overlay-first`로 할지? |  |  | Resolved (`overlay-first`, 2026-02-28) |
| UI-021 | Top Bar 중앙 정렬 균형을 동적 측정으로 할지 고정 슬롯으로 할지? |  |  | Resolved (`fixed side slots`, 2026-02-28) |
| UI-022 | Drawer 콘텐츠의 Top Bar 충돌 회피 방식은 full-height 축소 vs 내부 safe zone 중 무엇으로 할지? |  |  | Resolved (`internal safe zone`, 2026-02-28) |
