# 04. Test and Rollout

## Follow-up To-do
- [ ] [added: 2026-02-28] [P0] [status: execution-needed] 영어 전용 회귀 테스트를 추가한다 (UI 스냅샷/DOM 텍스트에 한글 미포함 검증).
- [ ] [added: 2026-02-28] [P0] [status: execution-needed] `/api/chat` 및 `/api/chat-to-nodes` 응답 텍스트 언어 검증 테스트를 추가한다.
- [ ] [added: 2026-02-28] [P1] [status: execution-needed] 배포 전 스모크 테스트에 \"입력->분석->제안->채팅->변환\" 영어 출력 체크를 포함한다.
- [ ] [added: 2026-02-28] [P1] [status: execution-needed] 모델 응답 스키마 보정 경로에서 영어 fallback 유지 여부를 검증한다.
- [ ] [added: 2026-02-28] [P2] [status: execution-needed] Python backend 테스트를 유지할 경우 동일한 영어 정책 검증 케이스를 추가한다.

## 1. Document Meta
- Version: `v1.0-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`

## 2. Quality Objectives
1. 핵심 사용자 플로우(입력 분석 -> 제안 -> 채팅 -> 노드 변환)가 릴리즈마다 회귀 없이 동작해야 한다.
2. 모델 출력 변동(형식 불일치) 상황에서도 시스템이 명시적 실패 또는 보정 동작을 수행해야 한다.
3. 장애 시 롤백 기준과 절차가 문서화되어 즉시 실행 가능해야 한다.

## 2.1 Decision Baseline (2026-02-28)
1. 완료 기준 환경: Production.
2. 완료 판정 검증 방식: Manual QA.
3. 릴리즈 목표일: 고정일 없음(rolling).
4. 미달 정책: 기능 동결 없이 단계적 적용.
5. Python backend도 영어 정책 검증 범위에 포함.

## 3. Test Strategy

### 3.1 Unit Tests
- Agent 유틸 함수:
  - `normalizeCategory`, `normalizePhase`
  - `normalizeAnalysisResult`, `normalizeChatNodeResult`
  - `safeJsonParse`, `stripCodeFences`
- 노드/엣지 생성 규칙:
  - phase/category별 포지션 계산
  - cross-connection fallback 생성

### 3.2 Integration Tests
- Next API:
  - `POST /api/analyze` 정상/입력오류/키누락/모델포맷오류
  - `POST /api/chat` 정상/오류
  - `POST /api/chat-to-nodes` 정상/오류
- Optional Python API:
  - `/analyze`, `/chat`, `/chat-to-nodes` 기본 경로 응답

### 3.3 End-to-End Tests
1. 텍스트 입력 후 사용자 노드와 제안 카드 생성 확인
2. 제안 카드 클릭 시 초기 AI 설명 메시지 자동 생성 확인
3. 대화 후 노드 변환 버튼으로 그래프 병합 확인
4. API 오류 시 사용자 피드백(alert/메시지) 확인

### 3.4 Manual QA Checklist
- [ ] 첫 입력 제출 시 로딩 상태와 제출 버튼 disable 정상
- [ ] 제안 카드 dismiss 시 해당 카드 제거 및 활성 채팅 닫힘
- [ ] highlighted 노드가 시각적으로 강조됨
- [ ] 채팅 변환 후 `e-chat-*`, `e-cross-*` 엣지 스타일 반영
- [ ] 비-POST 호출 시 405 반환 확인
- [ ] 사용자 노출 텍스트(UI/오류/AI 응답)가 영어 전용인지 확인

### 3.5 Manual QA Checklist (Canvas Pan + Font Policy)
- [ ] 빈 캔버스 영역에서 마우스 드래그 시 viewport가 이동한다.
- [ ] 노드 위에서 드래그 시작 시 pan이 아니라 node drag가 동작한다.
- [ ] pan 동작에 `Space` 키 입력이 필요하지 않다(기본 drag pan).
- [ ] 드래그 전 커서가 `grab`, 드래그 중 `grabbing`으로 보인다.
- [ ] 트랙패드/휠 zoom 동작이 기존과 동일하게 동작한다.
- [ ] 모바일/터치에서 single-finger drag는 pan, pinch는 zoom으로 동작한다.
- [ ] 전체 UI 기본 텍스트가 `Instrument Sans`로 렌더링된다.
- [ ] 제목급 텍스트(`h1~h6`, Node Card title, Suggestion/Chat title)가 `Inter` 우선으로 렌더링된다.
- [ ] Node Card body/보조 텍스트는 `Instrument Sans` 우선으로 렌더링된다.
- [ ] 웹 폰트 로드 실패 시 폴백 폰트(`Inter`, `system-ui`)로 UI가 깨지지 않는다.

#### 3.5.1 Suggested Execution Steps
1. Desktop Chrome에서 앱 로드 후, 빈 배경 drag pan / node drag를 연속으로 수행한다.
2. 같은 화면에서 트랙패드 pinch 또는 휠로 zoom 동작을 확인한다.
3. DevTools Elements에서 대표 텍스트의 `font-family` computed value를 확인한다.
4. Network throttling/blocked fonts 조건에서 폴백 렌더링을 확인한다.
5. 모바일 에뮬레이션에서 single-finger pan, pinch zoom을 확인한다.

### 3.6 Manual QA Checklist (Node Connector Edge)
- [ ] 연결선이 `2px` 흰색 선으로 렌더링된다.
- [ ] 연결선 경로가 `orthogonal + arc corner` 형태로 렌더링된다.
- [ ] 연결선 시작점/종료점 모두에 endpoint 포트가 렌더링된다.
- [ ] endpoint 포트는 white ring + 내부 category color 조합으로 렌더링된다.
- [ ] 포트 기준점이 카드 상단 기준 `52px` 위치에 고정된다.
- [ ] 다중 연결 시 포트/선이 동일 위치에 완전히 겹치지 않고 fanout 오프셋으로 분산된다.
- [ ] fanout 슬롯이 상대 노드 Y 위치 순으로 정렬되어 선 교차가 최소화된다.
- [ ] `Problem`/`Solution` 연결은 항상 `Problem -> Solution` 방향으로 렌더링된다.
- [ ] 그 외 연결은 노드 좌->우 방향으로 정규화되어 렌더링된다.
- [ ] 선이 카드 본문을 가로지르지 않고 card boundary 바깥 clearance 경로를 따른다.
- [ ] 역순 배치(right-to-left)에서도 ㄹ자 우회 경로 + arc 코너로 카드와 겹치지 않는다.
- [ ] 상/하로 벌어진 카드 연결 시, 외곽 상단 우회보다 카드 사이 corridor 경로가 우선 선택된다.
- [ ] `e-input-*`, `e-chat-*`, `e-cross-*` 타입에서 모두 동일한 기본 connector 규칙이 유지된다.

#### 3.6.1 Suggested Execution Steps
1. 최소 3개의 노드를 만들고 순차 연결(`e-input`) 시 양 끝 포트/2px 선을 확인한다.
2. 같은 노드에서 2개 이상 연결이 나가도록 만들어 fanout 분산을 확인한다.
3. 연결된 노드를 좌우로 교차 배치해도 source/target 방향 의미가 유지되는지 확인한다.
4. 카드 근접 배치 상태에서 선이 카드 내부를 가로지르지 않는지 확인한다.

### 3.7 Manual QA Checklist (Top Bar)
- [ ] 상단에 Top bar가 `12px 36px` 패딩으로 고정 렌더링된다.
- [ ] 좌측 Home 아이콘은 제공된 custom SVG path 모양으로 렌더링된다.
- [ ] Home 아이콘이 `24x24` 정사각 프레임 내부에서 중앙 정렬된다.
- [ ] Top bar가 좌/우 동일 폭 슬롯 구조를 사용해 중앙 타이틀 균형이 유지된다.
- [ ] 중앙 텍스트 `Visual Thinking Machine`이 고정 노출된다.
- [ ] Home 클릭 시 `/` 경로로 이동한다.

### 3.8 Manual QA Checklist (Admin Shortcut + Prototype Status)
- [ ] 최초 진입 시 상단 중앙에 단축키 안내(`Ctrl/Cmd + Shift + A`) UI가 노출된다.
- [ ] `Dismiss` 클릭 시 단축키 안내 UI가 사라지고 같은 세션 재진입 시 재노출되지 않는다.
- [ ] `Ctrl/Cmd + Shift + A` 입력 시 관리자 모드가 토글된다.
- [ ] 관리자 모드 ON 상태에서만 `Autonomous Agent Active` 배지와 프로토타입 상태가 노출된다.
- [ ] 관리자 모드 OFF 상태에서는 프로토타입 상태 UI가 완전히 숨겨진다.
- [ ] 관리자 모드 상태가 새로고침 후에도 유지된다(localStorage).

### 3.9 Manual QA Checklist (Right Agent Drawer Tip/Chat)
- [ ] `Tip`/`Chat` rail 버튼과 우측 filled field+content가 하나의 drawer 단위로 동시에 열리고 닫힌다.
- [ ] 같은 모드 버튼을 다시 누르면 drawer가 닫힌다.
- [ ] open 상태에서 `Tip`과 `Chat` 간 전환 시 drawer는 닫히지 않고 mode만 바뀐다.
- [ ] `X` 버튼 및 `Esc` 입력으로 drawer가 닫힌다.
- [ ] drawer가 닫힌 상태에서 우측 filled field와 content panel은 표시되지 않는다.
- [ ] context shelf 카드(첨부 노드 카드)는 상단 영역에 유지되고, 삭제/변경 시 상태가 즉시 반영된다.
- [ ] Tip/Chat 버튼이 동일한 원형 white 스타일(아이콘 없음)로 렌더링된다.
- [ ] Tip 버튼 우상단의 보라색 점이 지정 크기/색상으로 렌더링된다.
- [ ] right field가 `base fill + radial gradient`(우측 기준 radial, blur 없음)로 렌더링된다.
- [ ] right field 좌측 상/하단 코너가 `30px` 라운드로 렌더링된다.
- [ ] right field 좌측 경계가 feather linear 처리되어 잘린 선 없이 부드럽게 보인다.
- [ ] 좌측 경계 처리가 `overlay-first`(`base linear fade + canvas-color edge overlay`) 규칙을 따른다.
- [ ] 좌측 `edge overlay`가 충분한 폭(`64px`)으로 적용되어 경계가 시각적으로 끊기지 않는다.
- [ ] 좌측 `lemon strip` 레이어가 적용되어 레몬색 강조가 명확히 보인다.
- [ ] Tip/Chat 버튼 중심이 lemon strip 대역 안에 위치해 버튼과 drawer 색 채움이 분리되어 보이지 않는다.
- [ ] `edge overlay` linear gradient 끝점이 완전 투명(`alpha 0`)으로 처리된다.
- [ ] `edge overlay` 완충 alpha(`0.18/0.08` 레벨)가 적용되어 윤곽 feather가 유지된다.
- [ ] `lemon strip`가 투명 시작형(`0 -> peak -> 0`)으로 렌더링되어 좌측 경계가 선명한 실선처럼 보이지 않는다.
- [ ] `base fade` 시작점(alpha)과 `radial` 말단(alpha)이 모두 `0`으로 종료된다.
- [ ] edge overlay가 색 보정용이 아니라 neutral alpha-fade 용도로만 사용된다.
- [ ] 경계 블렌딩 구현에 `mask-image`/`-webkit-mask-image`가 사용되지 않는다.
- [ ] rail의 경계 강조(strip)가 저강도(`alpha <= 0.10`, 폭 축소)로 완화되어 경계가 다시 선처럼 보이지 않는다.
- [ ] content 영역이 좌우 안전 여백(`left 40px`, `right 28px`)을 유지해 glass blur가 경계까지 닿지 않는다.
- [ ] drawer open 상태에서도 context shelf/glass content가 Top Bar 영역과 겹치지 않는다(`top safe zone` 적용).
- [ ] visual 리파인 이후에도 content panel(글라스모피즘)이 제거되지 않고 렌더링된다.
- [ ] rail/right field가 상하 margin 없이 viewport full-height(`top:0`, `bottom:0`)를 유지한다.
- [ ] drawer가 닫힌 상태에서 `Chat` 버튼으로 열 때 Tip/Chat 원형 버튼 본체의 좌측이 클리핑되지 않는다.

## 4. Test Matrix

| ID | Layer | Scenario | Expected | Priority | Status |
|---|---|---|---|---|---|
| T-001 | API | analyze with valid text | 200 + nodes/edges | P0 | Planned |
| T-002 | API | analyze with empty text | 400 + error | P0 | Planned |
| T-003 | API | missing OPENAI_API_KEY | 500 + key error message | P0 | Planned |
| T-004 | UI+API | suggestion card 생성 | 카드 목록 증가 | P0 | Planned |
| T-005 | UI+API | chat turn | assistant reply 렌더 | P0 | Planned |
| T-006 | UI+API | chat-to-nodes | 그래프 노드/엣지 추가 | P0 | Planned |
| T-007 | Agent | malformed JSON from model | 보정 시도 또는 명시적 에러 | P1 | Planned |
| T-008 | Agent | cross-connection empty with history | fallback edge 생성 | P1 | Planned |
| T-009 | UI+API | language consistency | 사용자 노출 텍스트 영어 100% | P0 | Planned |
| T-010 | UI | connector endpoint ports | 연결된 side에만 포트 렌더링 + category color 반영 | P0 | Planned |
| T-011 | UI | connector anchor position | 좌/우 포트 기준점 `top 52px` 유지 | P0 | Planned |
| T-012 | UI | connector direction normalization | Problem->Solution 우선 + left-to-right 정규화 | P0 | Planned |
| T-013 | UI | connector overlap mitigation | fanout + clearance 경로로 카드/선 겹침 완화 | P1 | Planned |
| T-014 | UI | connector corner style | orthogonal 경로 코너가 arc 반지름으로 일관 렌더링 | P1 | Planned |
| T-015 | UI | admin shortcut hint | 최초 진입 단축키 안내 표시 + 세션 dismiss 동작 | P1 | Planned |
| T-016 | UI | admin mode status overlay | 단축키 토글 + prototype status 관리자 모드 한정 노출 | P1 | Planned |
| T-017 | UI | right agent drawer boundary | rail + filled field + content가 하나의 열림/닫힘 단위로 동작 | P0 | Planned |
| T-018 | UI | tip/chat mode switch | open 상태에서 Tip/Chat 전환 시 drawer 유지 + body만 전환 | P1 | Planned |
| T-019 | UI | context shelf behavior | 상단 첨부 카드 상태 표시/삭제 및 렌더 동기화 | P1 | Planned |
| T-020 | UI | drawer visual alignment | Tip/Chat 원형 버튼 + tip dot + field gradient가 목업과 일치 | P1 | Planned |
| T-021 | UI | drawer content persistence | visual 리파인 후에도 content panel(글라스모피즘) 유지 | P0 | Planned |
| T-022 | UI | drawer full-height layout | rail/right field가 상하 여백 없이 viewport를 채움 | P0 | Planned |
| T-023 | UI | drawer left-edge blend quality | overlay-first 경계 블렌딩 + 무마스크 + 경계선 부각 완화 | P1 | Planned |
| T-024 | UI | drawer edge-safe inset | content safe inset과 transparent tail 적용으로 경계 절단감 제거 | P1 | Planned |
| T-025 | UI | drawer alpha-tail policy | base/radial alpha 0 종료 + neutral alpha overlay-only 정책 준수 | P1 | Planned |
| T-026 | UI | top bar composition | Home 아이콘(24px frame) + 중앙 타이틀 + 좌우 고정 슬롯 균형 유지 | P1 | Planned |
| T-027 | UI | drawer top safe-zone | drawer 콘텐츠가 Top Bar 영역과 겹치지 않고 rail full-height 규칙을 유지 | P1 | Planned |
| T-028 | UI | drawer lemon emphasis | 좌측 lemon strip + 약화된 edge overlay 조합으로 좌측 밝은 레몬 강조 유지 | P1 | Planned |
| T-029 | UI | drawer left corner radius | right field 좌측 상/하단 코너가 30px 라운드로 유지되며 feather와 충돌하지 않음 | P1 | Planned |
| T-030 | UI | drawer open-path clipping guard | closed→Chat open 경로에서도 Tip/Chat 버튼 본체 원형이 손실되지 않음 | P0 | Planned |
| T-031 | UI | rail and lemon-strip alignment | Tip/Chat 버튼 중심선이 lemon strip 대역과 정렬되어 field 채움과 이질감이 없음 | P1 | Planned |

## 5. Go / No-Go Criteria
- P0 결함 0건
- `T-001`~`T-006` 자동화 또는 동등 수동 검증 통과
- API key 누락/모델 형식오류 시 사용자 가시 오류 확인
- 3.4 Manual QA checklist 완료

## 6. Release Plan

### 6.1 Pre-Release
1. 환경 변수 확인 (`OPENAI_API_KEY`)
2. 정적 점검 (`npm run lint`)
3. 핵심 API 스모크 호출
4. 릴리즈 승인

### 6.2 Deployment
1. 배포 실행
2. 애플리케이션 헬스 확인
3. 스모크 시나리오 실행
4. 릴리즈 노트 공유

### 6.3 Post-Release (first 30m)
- 에러율/응답시간 모니터링
- 실제 사용자 입력 1건 분석 시나리오 확인
- 제안 채팅 및 변환 시나리오 확인

### 6.4 Phased Rollout Gates (Right Agent Drawer)
1. Phase 1 gate:
   - pass: `T-017`, `T-018`
   - must-keep: 기존 SuggestionPanel 클릭 흐름이 깨지지 않을 것
1.1 Phase 1.1 gate:
   - pass: `T-020`, `T-021`, `T-022`
   - must-keep: content panel/close action/legacy fallback 회귀 0건
2. Phase 2 gate:
   - pass: `T-005`, `T-006`, `T-016`, `T-018`
   - must-keep: legacy `ChatDialog` fallback 경로 유지
3. Phase 3 gate:
   - pass: `T-019` + `T-005`, `T-006` 회귀 없음
   - must-keep: context shelf 첨부 실패 시에도 기본 채팅 성공

## 7. Rollback Plan

### 7.1 Triggers
- 분석/채팅 API 지속 실패
- 사용자 핵심 경로 차단
- 5xx 급증 또는 모델 오류 폭증

### 7.2 Actions
1. 직전 안정 릴리즈로 즉시 롤백
2. 필요 시 기능 플래그 OFF(도입 시)
3. 장애 원인 기록 후 핫픽스 브랜치 생성
4. 재배포 전 회귀 테스트 재실행

## 8. Operations and Monitoring

### 8.1 Metrics
- API별 성공률/실패율
- API별 p95 latency
- 모델 호출 실패 비율

### 8.2 Logs
- endpoint, error message, stack trace
- invalid schema issue summary

### 8.3 Alerts
- 5xx 비율 임계치 초과
- p95 응답시간 임계치 초과

## 9. Known Test Gaps (Current)
1. Next API 경로 자동화 테스트가 아직 없다.
2. E2E 시나리오 자동화 도구가 정해지지 않았다.
3. Python backend 테스트는 단일 샘플 스크립트 수준이다.
