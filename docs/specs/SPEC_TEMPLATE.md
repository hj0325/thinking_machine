# Product / Feature Spec Template

## Follow-up To-do
- [ ] [added: YYYY-MM-DD] 문서 오너/리뷰어 지정
- [ ] [added: YYYY-MM-DD] 오픈 질문 담당자 지정
- [ ] [added: YYYY-MM-DD] 배포/롤백 기준 확정
- [ ] [added: YYYY-MM-DD] 관련 문서 링크 검증

## 1. Document Meta
- Title:
- Feature / Project:
- Version: `v0.1`
- Status: `Draft` | `In Review` | `Approved`
- Author:
- Reviewers:
- Created Date:
- Last Updated:
- Related Docs:
- Related Tickets:

## 2. Background
### 2.1 Current State
<!-- 현재 동작, 시스템 구조, 운영 상의 맥락 -->

### 2.2 Problem Statement
<!-- 해결하려는 핵심 문제를 1~3개로 명확히 -->
- Problem 1:
- Problem 2:
- Problem 3:

### 2.3 Why Now
<!-- 지금 이 작업이 필요한 이유(사용자 영향, 비용, 일정) -->

## 3. Goals and Non-Goals
### 3.1 Goals
- G1:
- G2:
- G3:

### 3.2 Non-Goals
- NG1:
- NG2:

## 4. Scope
### 4.1 In Scope
- 

### 4.2 Out of Scope
- 

## 5. Users and Scenarios
### 5.1 Target Users
- Primary:
- Secondary:

### 5.2 Key User Scenarios
1. Scenario A:
2. Scenario B:
3. Scenario C:

### 5.3 User Journey (Optional)
<!-- 입력 -> 처리 -> 결과 흐름을 단계별로 기술 -->

## 6. Functional Requirements
| ID | Requirement | Priority (P0/P1/P2) | Input | Output | Acceptance Criteria |
|---|---|---|---|---|---|
| FR-001 |  | P0 |  |  |  |
| FR-002 |  | P1 |  |  |  |
| FR-003 |  | P2 |  |  |  |

## 7. Non-Functional Requirements
| Category | Requirement | Target |
|---|---|---|
| Performance | 응답 시간 | 예: p95 < 2s |
| Reliability | 에러율 | 예: < 1% |
| Availability | 가용성 | 예: 99.9% |
| Security | 인증/비밀정보 처리 |  |
| Observability | 로그/메트릭/트레이스 |  |
| Cost | 호출 비용 상한 |  |

## 8. System Design Overview
### 8.1 Architecture Summary
<!-- 구성요소와 역할 -->
- Frontend:
- API Layer:
- AI Agent / Domain Logic:
- Optional External Backend:

### 8.2 Component Responsibilities
| Component | Responsibility | Owner |
|---|---|---|
| `pages/index.jsx` |  |  |
| `components/*` |  |  |
| `pages/api/*` |  |  |
| `lib/thinkingAgent.js` |  |  |
| `backend/*` (optional) |  |  |

### 8.3 Sequence Flow
1. User action:
2. API request:
3. AI processing:
4. Response transform:
5. UI render/update:

## 9. Data Contract
### 9.1 Request Schemas
#### Endpoint: `POST /api/analyze`
```json
{
  "text": "string",
  "history": []
}
```

#### Endpoint: `POST /api/chat`
```json
{
  "suggestion_title": "string",
  "suggestion_content": "string",
  "suggestion_category": "Who|What|When|Where|Why|How",
  "suggestion_phase": "Problem|Solution",
  "messages": [],
  "user_message": "string"
}
```

#### Endpoint: `POST /api/chat-to-nodes`
```json
{
  "suggestion_title": "string",
  "suggestion_content": "string",
  "suggestion_category": "Who|What|When|Where|Why|How",
  "suggestion_phase": "Problem|Solution",
  "messages": [],
  "existing_nodes": []
}
```

### 9.2 Response Schemas
<!-- 성공 응답 JSON 예시 -->

### 9.3 Validation Rules
<!-- 필드 유효성, enum, 길이 제한, null 허용 정책 -->

### 9.4 Error Format
```json
{
  "error": "string"
}
```

## 10. Edge Cases and Failure Handling
- Missing environment variable (e.g., API key):
- Model output schema mismatch:
- Timeout / retry policy:
- Partial failure fallback:
- User-facing error message policy:

## 11. Security and Privacy
- Secrets handling:
- PII handling:
- Data retention policy:
- Access control:

## 12. Rollout Plan
### 12.1 Milestones
1. Design Complete:
2. Implementation Complete:
3. QA Complete:
4. Release:

### 12.2 Launch Strategy
- Internal only / phased rollout / full rollout:
- Feature flag:
- Rollback trigger and method:

## 13. Observability
- Metrics:
- Logs:
- Alerts:
- Dashboards:

## 14. Test Plan
### 14.1 Unit Tests
- 

### 14.2 Integration Tests
- 

### 14.3 End-to-End Tests
- 

### 14.4 Manual QA Checklist
- [ ] 
- [ ] 
- [ ] 

## 15. Risks and Mitigations
| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
|  |  |  |  |  |

## 16. Open Questions
| ID | Question | Owner | Due Date | Status |
|---|---|---|---|---|
| Q-001 |  |  |  | Open |
| Q-002 |  |  |  | Open |

## 17. Decision Log
| Date | Decision | Rationale | Owner |
|---|---|---|---|
|  |  |  |  |

## 18. Appendix
### 18.1 Glossary
- 

### 18.2 References
- 
