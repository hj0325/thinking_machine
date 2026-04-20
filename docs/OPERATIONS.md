# Operations Runbook

## 1. Runtime Standard
- Production runtime path: Next.js Pages Router + Next API Routes
- Entry route: `/` (`pages/index.jsx`)
- API routes:
  - `POST /api/analyze`
  - `POST /api/chat`
  - `POST /api/chat-to-nodes`

## 2. Pre-Deploy Checklist
1. Environment
   - `OPENAI_API_KEY` is configured in target environment.
2. Install/build
   - `npm install`
   - `npm run build`
3. Basic static checks
   - `npm run lint` (if lint binary is available in node_modules)
4. Docs sync
   - Verify README reflects `pages` structure.
   - Add patch entry to `docs/specs/05-change-log.md`.

## 3. Smoke Test (After Deploy)
1. Open `/` and confirm canvas renders.
2. Submit one input and verify:
   - nodes/edges appear
   - suggestion card appears
3. Open suggestion chat and verify first AI reply appears.
4. Convert chat to nodes and verify graph merge.
5. Verify non-POST request to API returns `405`.

## 4. Failure Triage
### 4.1 `500 OpenAI API Key is missing on server.`
- Check environment variable wiring in deployment target.
- Re-deploy after secret injection.

### 4.2 Invalid AI response format / JSON parse errors
- Confirm OpenAI availability and model response stability.
- Check server logs for `ZodError` summary from API handlers.
- Retry with a simpler input to isolate prompt/path issue.

### 4.3 UI regression after patch
- Compare changed files with latest `docs/specs/06-frontend-style.md`.
- Verify `components/ThinkingMachine.jsx` node mapping fields:
  - `data.label`, `data.content`, `data.category`, `data.phase`
  - optional image fields (`image_url`, `imageUrl`, etc.)

## 5. Rollback
1. Roll back to previous stable deployment in hosting platform.
2. Confirm `/` render + analyze/chat/chat-to-nodes happy path.
3. Record rollback reason and impact in `docs/specs/05-change-log.md`.
