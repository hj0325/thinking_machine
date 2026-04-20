# 02. Requirements

## Follow-up To-do
- [x] [added: 2026-02-28] [P0] [status: completed 2026-02-28] FR-011에 영어 전용 적용 대상 필드를 명시한다 (buttons, placeholders, alerts, assistant replies, suggestion labels).
- [x] [added: 2026-02-28] [P0] [status: completed 2026-02-28] 한국어 하드코딩 문자열 제거 요구사항을 추가한다 (`components/ChatDialog.jsx`, `components/SuggestionPanel.jsx`, `lib/thinkingAgent.js`).
- [x] [added: 2026-02-28] [P0] [status: completed 2026-02-28] API 오류 메시지 카탈로그를 영어 기준으로 정의한다 (400/405/500 케이스별).
- [x] [added: 2026-02-28] [P1] [status: completed 2026-02-28] AI 프롬프트/보정 프롬프트의 출력 언어 정책을 영어로 통일한다 (JS/Python 모두).
- [ ] [added: 2026-02-28] [P1] [status: execution-needed] Python backend를 유지할 경우 JS 스펙과 동등 요구사항 동기화 규칙을 정의한다.

## 1. Document Meta
- Version: `v1.0-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`

## 2. Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | 사용자가 텍스트를 제출하면 서버 분석 API를 호출한다. | P0 | `text`가 비어있지 않으면 `/api/analyze` POST 호출 |
| FR-002 | 분석 결과로 사용자 노드(1~4개)와 엣지를 그래프에 추가한다. | P0 | 응답 `nodes`, `edges`를 ReactFlow 형식으로 반영 |
| FR-003 | AI 제안 노드를 별도 Suggestion 카드로 분리해 우측 패널에 표시한다. | P0 | `is_ai_generated=true` 노드는 그래프에 직접 추가하지 않고 카드화 |
| FR-004 | 제안과 연결된 메인 노드를 강조 표시한다. | P1 | `e-suggest-*`의 source 노드가 `node-highlighted` 클래스로 강조 |
| FR-005 | 제안 카드를 클릭하면 채팅 다이얼로그를 열고, 카드별 대화 상태를 관리한다. | P0 | 같은 카드 재클릭 시 토글, dismiss 시 열린 채팅 닫힘 |
| FR-006 | 채팅 다이얼로그 오픈 시 AI가 첫 설명 메시지를 자동 생성한다. | P1 | 카드 오픈 후 최초 호출에서 assistant 메시지 생성 |
| FR-007 | 사용자가 채팅 내용을 노드로 변환할 수 있다. | P0 | `/api/chat-to-nodes` 호출 후 반환 노드/엣지가 그래프에 병합 |
| FR-008 | API 실패 시 사용자에게 오류 메시지를 제공한다. | P0 | analyze/chat/chat-to-nodes 실패 시 alert 또는 대화 내 오류 메시지 노출 |
| FR-009 | API는 POST 메서드만 허용한다. | P0 | 비-POST 요청은 `405 Method Not Allowed` 반환 |
| FR-010 | OpenAI API 키 누락 시 서버가 명확한 오류를 반환한다. | P0 | `500` + `OpenAI API Key is missing on server.` |
| FR-011 | 웹사이트 사용자 노출 텍스트는 영어로만 제공한다. | P0 | UI 라벨/버튼/placeholder/오류/API 오류 메시지/AI 대화 응답/fallback 문구가 영어로 출력 |
| FR-012 | 한국어 하드코딩 UI 문자열을 운영 경로에서 제거한다. | P0 | 운영 경로(`components/*`, `pages/api/*`, `lib/thinkingAgent.js`, `backend/*`)에서 사용자 노출 고정 한글 문구가 제거됨(단, 사용자 입력 원문은 예외) |

### 2.1 FR-011 Scope Decision (2026-02-28)
1. 포함 범위:
   - buttons, placeholders, alerts
   - assistant replies
   - suggestion labels/copy
   - API error payload message strings
   - model fallback 문구
2. 제외 범위:
   - 사용자 입력 원문(한국어 입력 포함)은 원문 유지 허용
   - 코드 주석, 내부 개발 로그, 테스트 코드
3. 런타임 범위:
   - Next API + JS agent + Optional Python backend 모두 포함

## 3. API Input/Output Requirements

### 3.1 Analyze API
- Endpoint: `POST /api/analyze`
- Required input:
  - `text: string (non-empty)`
  - `history: array` (optional, default `[]`)
- Output:
  - `nodes: array`
  - `edges: array`

### 3.2 Chat API
- Endpoint: `POST /api/chat`
- Required input:
  - `suggestion_title`, `suggestion_content`, `suggestion_category`, `suggestion_phase`
  - `messages: array`
  - `user_message: string`
- Output:
  - `reply: string`

### 3.3 Chat-to-Nodes API
- Endpoint: `POST /api/chat-to-nodes`
- Required input:
  - suggestion metadata
  - `messages: array`
  - `existing_nodes: array`
- Output:
  - `nodes: array`
  - `edges: array`

### 3.4 API Error Message Catalog (English)
| Case | Status | Canonical Message |
|---|---|---|
| Invalid method | `405` | `Method Not Allowed` |
| Missing API key | `500` | `OpenAI API Key is missing on server.` |
| Missing required text | `400` | `Missing required field: text` |
| Invalid AI response schema | `500` | `Invalid AI response format: <details>` |
| Unknown server error | `500` | `Internal Server Error` (or existing error string passthrough in English) |

## 4. Data and Domain Rules
1. 카테고리 enum은 `Who/What/When/Where/Why/How`로 제한한다.
2. Phase enum은 `Problem/Solution`으로 제한한다.
3. 엣지 ID prefix 규칙:
   - `e-input-*`: 입력으로 생성된 사용자 노드 간 연결
   - `e-suggest-*`: 사용자 노드 -> 제안 노드 연결
   - `e-chat-*`: 채팅 변환 노드 간 연결
   - `e-cross-*`: 기존 노드와 교차 연결
4. 기존 노드가 있을 때 cross-connection이 비어 있으면 fallback 연결을 생성한다.

## 5. Non-Functional Requirements

| Category | Requirement | Initial Target |
|---|---|---|
| Performance | Analyze API 응답 시간 | p95 < 5s (모델 응답 포함) |
| Performance | Chat API 응답 시간 | p95 < 4s |
| Reliability | 서버 에러율 | 1% 미만 |
| Robustness | 모델 응답 파싱 실패 대응 | 스키마 보정 시도 후 실패 시 명확한 에러 반환 |
| Security | 비밀정보 보호 | API key는 서버 env에서만 사용 |
| Observability | 장애 추적 가능성 | 서버 에러 로그와 API 경로별 실패 확인 가능 |
| UX Consistency | 언어 일관성 | 사용자 노출 텍스트 영어 100% |

## 6. Constraints
- 외부 모델 응답 품질/지연에 의존한다.
- 현재는 영속 저장소가 없고 세션 메모리 상태 중심이다.
- 프론트는 Next API 경로를 직접 사용하므로 API 계약 변경 시 UI 동시 수정이 필요하다.

## 7. Open Questions
| ID | Question | Owner | Due Date | Status |
|---|---|---|---|---|
| RQ-001 | Python backend를 운영 경로로 유지할지 | TBD | TBD | Open |
| RQ-002 | NFR 목표치를 운영 현실에 맞게 상향/하향할지 | TBD | TBD | Open |
| RQ-003 | 영어 전용 정책 적용 범위에 내부 운영 로그 문구까지 포함할지 | TBD | TBD | Open |
