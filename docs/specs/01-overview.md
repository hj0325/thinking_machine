# 01. Overview

## Follow-up To-do
- [x] [added: 2026-02-28] [P0] [status: completed 2026-02-28] 영어 전용 정책 범위를 확정한다 (UI, 오류 메시지, AI 응답, fallback 문구 포함 여부).
- [x] [added: 2026-02-28] [P0] [status: completed 2026-02-28] 현재 한/영 혼합 상태를 영어 전용 상태로 전환하는 릴리즈 목표일을 확정한다(고정 목표일 없음, 단계적 전환).
- [ ] [added: 2026-02-28] [P1] [status: decision-needed] 런타임 표준 경로를 확정한다 (Next API 단일화 vs Python backend 병행).
- [x] [added: 2026-02-28] [P1] [status: completed 2026-02-28] README 및 운영 문서를 현재 `pages` 구조 기준으로 업데이트한다.

## 1. Document Meta
- Version: `v1.0-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`

## 2. Product Summary
Visual Thinking Machine은 사용자의 자유 입력 문장을 받아 6하원칙(Who/What/When/Where/Why/How) 기반 노드 그래프로 구조화하고, AI 제안을 카드/채팅 형태로 확장한 뒤 다시 노드로 환원하는 인터랙티브 사고 보조 도구다.

## 3. Current Product Context
- Frontend: Next.js Pages Router + ReactFlow 시각화 UI
- Server API: `pages/api/analyze`, `pages/api/chat`, `pages/api/chat-to-nodes`
- AI Core: `lib/thinkingAgent.js` (OpenAI 호출 + Zod 기반 정규화/검증)
- Optional Backend: `backend/*` (FastAPI 기반 병행 구현, 현재 프론트 기본 경로는 Next API)

## 4. Problem Statement
1. 사용자의 아이디어는 문장 단위로 흩어져 있어 구조적 사고로 전환하기 어렵다.
2. 1회 분석 결과만으로는 아이디어를 확장/검증하기 어렵다.

## 5. Goals
1. 한 번의 입력으로 최소 1개~최대 4개의 구조화 노드를 생성한다.
2. 생성 결과와 연결된 AI 제안 카드를 별도 패널로 제시한다.
3. 제안 기반 대화를 통해 추가 아이디어를 노드/엣지로 다시 그래프에 병합한다.
4. 모델 출력 변동에도 클라이언트가 동작하도록 JSON 정규화/검증/보정 경로를 유지한다.
5. 웹사이트의 사용자 노출 텍스트(UI/오류/AI 대화 포함)는 영어로만 제공한다.

## 6. Non-Goals
1. 사용자 인증/권한 관리 시스템 제공
2. 실시간 다중 협업 편집
3. 장기 저장소(DB) 기반 영속화
4. 다국어 로컬라이제이션 지원(한국어 포함)

## 7. Scope
### 7.1 In Scope
- 입력 분석 -> 노드/엣지 생성
- 제안 카드 표시/닫기/선택
- 제안 채팅 및 채팅->노드 변환
- 오류 메시지 표출(알럿 및 카드 내 오류 안내)

### 7.2 Out of Scope
- 계정/프로젝트 단위 데이터 저장
- 운영 대시보드/관리자 화면
- 모델 A/B 실험 프레임워크

## 8. Primary User Journey
1. 사용자가 입력 패널에 아이디어를 입력하고 제출한다.
2. `/api/analyze` 호출 결과로 그래프 노드/엣지가 생성된다.
3. 제안 카드가 우측 패널에 쌓이고, 관련 노드가 강조된다.
4. 사용자가 제안 카드를 클릭해 채팅을 진행한다.
5. 대화가 충분하면 `대화를 노드로 만들기`를 눌러 그래프에 병합한다.

## 9. Dependencies
- `OPENAI_API_KEY` (server env)
- NPM dependencies: `next`, `reactflow`, `openai`, `zod`, `axios`, `framer-motion`

## 10. Risks and Known Gaps
- Python backend와 JS agent의 중복 구현으로 유지보수 비용 증가 가능성
- 테스트 자동화 범위가 제한적(Next API 경로에 대한 테스트 부재)
- README/운영 문서와 실제 구조 간 불일치 가능성

## 11. Related Specs
- `./02-requirements.md`
- `./03-architecture.md`
- `./04-test-rollout.md`
- `./05-change-log.md`
- `./06-frontend-style.md`
- `./SPEC_TEMPLATE.md`
- `../OPERATIONS.md`

## 12. English-Only Policy Decisions (2026-02-28)
1. 범위: 사용자 노출 전부(UI/오류/API 응답/AI 응답/fallback)를 영어 전용으로 적용한다.
2. 사용자 한국어 원문 입력은 원문 유지 표시를 허용한다(번역 강제 제외).
3. 내부 영역(코드 주석/개발 로그/테스트 코드)은 영어 전용 강제 범위에서 제외한다.
4. Optional Python backend(`backend/*`)도 동일 영어 정책 범위에 포함한다.
5. 완료 기준 환경: Production.
6. 완료 판정 검증: Manual QA 기준.
7. 릴리즈 목표일: 고정 날짜를 두지 않는다.
8. 미달 처리: 기능 동결 없이 단계적으로 적용한다.
