# Thinking Machine

Thinking Machine is a conversational reasoning workspace built on Next.js Pages Router.
It combines a node-based canvas with a personal AI workspace so that conversation can evolve into structured thought.

Instead of treating the canvas as a generic diagram tool, the product is moving toward a hybrid model:

- conversation drives structure
- the canvas stores evolving reasoning
- the right panel acts as a personal agent workspace
- users decide what stays private, what becomes a candidate, and what gets shared

## Vision

Thinking Machine is designed for people who need to think through messy topics, not just collect notes.
The long-term goal is to support a workflow where:

- a user explores a topic with a personal AI partner
- the system turns that conversation into reasoning nodes
- nodes represent problems, goals, evidence, assumptions, risks, options, and decisions
- the graph gradually becomes a shared thinking surface rather than a loose brainstorm board

In short:

- chat for exploration
- graph for structure
- visibility states for collaboration

## Current Product Shape

The current app already includes the core product direction:

- login gate at `/`
- project dashboard at `/projects`
- project workspace at `/projects/[id]`
- Thinking Machine canvas mounted per project
- bottom-centered composer for conversation-first input
- right-side personal agent workspace
- reasoning-based node system instead of 5W1H
- local collaboration simulation with activity, visibility, and role metadata

## Core Concepts

### Reasoning Nodes

The canvas uses reasoning-oriented node types:

- `Problem`
- `Goal`
- `Insight`
- `Evidence`
- `Assumption`
- `Constraint`
- `Idea`
- `Option`
- `Risk`
- `Conflict`
- `Decision`
- `OpenQuestion`

Each node can also carry metadata such as:

- `sourceType`
- `visibility`
- `confidence`
- `ownerId`
- `editedBy`

### Visibility Flow

The app separates private and shared thinking with a staged flow:

- `private`
- `candidate`
- `shared`
- `reviewed`
- `agreed`

This is currently local-state driven and intentionally lightweight.

### Two Canvas Modes

The workspace can be viewed in two collaboration layers:

- `Personal`
  shows private and candidate work
- `Team`
  shows shared, reviewed, and agreed nodes

### Reasoning Modes

The top-right controls are not cosmetic filters.
They define the current reasoning mode as a 2x2 matrix:

- Focus: `Research` or `Design`
- Breadth: `Diverge` or `Converge`

These modes influence:

- AI prompting
- suggested node types
- composer behavior
- candidate suggestion direction

## Main User Flow

1. Log in from the root page.
2. Open or create a project from `/projects`.
3. Enter the project workspace.
4. Use the bottom composer to add a thought or extend a selected node.
5. Let the AI turn that input into reasoning nodes and edges.
6. Review suggestions in the right-side workspace.
7. Promote visibility only when a thought is ready to move toward the shared graph.

## Screenshots

The current workspace is organized around three primary surfaces:

- top navigation for project context and reasoning mode
- center canvas for reasoning nodes and relations
- right-side workspace for suggestions, activity, and private agent interactions

Suggested screenshot set for documentation:

1. Login screen
   show the auth entry flow at `/`
2. Projects dashboard
   show project creation and project list state
3. Project workspace
   show the canvas, bottom composer, and right-side workspace together
4. Reasoning graph close-up
   show node types, relation labels, and visibility-driven structure
5. Personal vs Team modes
   show the difference between private/candidate thinking and shared/reviewed/agreed thinking

If you want, the next step can be adding exported PNG assets under a repo folder such as `docs/screenshots/` and embedding them directly in this README.

## How To Use In 60 Seconds

1. Open the app and log in from `/`.
2. Create a new project from `/projects`.
3. Enter the workspace and type one clear thought into the bottom composer.
4. Let the AI turn that input into reasoning nodes on the canvas.
5. Click a node to continue the thought from that specific context.
6. Use the right-side workspace to review suggestions and candidate structure.
7. Keep early thinking `private`, move stronger ideas to `candidate`, and only promote to `shared` when ready.
8. Switch between `Personal` and `Team` to inspect private exploration versus shared reasoning.
9. Use `Research / Design` and `Diverge / Converge` to steer how the AI structures the next step.

In one sentence:

- start with a thought, grow it into a graph, then decide what becomes shared team reasoning

## Routes

### `/`

Auth entry screen.

- localStorage-based mock login
- redirects logged-in users to `/projects`

### `/projects`

Project dashboard.

- loads project list from localStorage
- creates new projects
- opens existing projects

### `/projects/[id]`

Project workspace.

- loads the selected project context
- mounts `ThinkingMachine`
- passes `projectId` into the workspace

## Architecture Overview

### Frontend

- Next.js 16
- React 19
- Pages Router
- React Flow
- Framer Motion
- Tailwind CSS 4

### AI Layer

- OpenAI SDK
- Zod-based schema validation
- `lib/thinkingAgent.js`

The AI layer is responsible for:

- node extraction
- reasoning-type classification
- conflict detection
- decision suggestion
- missing-structure suggestion
- conversation-to-node conversion

### Local Collaboration Model

There is no backend sync yet.
Collaboration behavior is currently simulated with local state and localStorage:

- projects
- activity log
- visibility changes
- last updated timestamps

## Important Files

```text
pages/
  index.jsx
  projects.jsx
  projects/[id].jsx
  api/
    analyze.js
    chat.js
    chat-to-nodes.js

components/thinkingMachine/
  ThinkingMachine.jsx
  TopBar.jsx
  NodeMap.jsx
  InputPanel.jsx
  RightAgentDrawer.jsx
  LeftCanvasTools.jsx
  edges/
  nodes/
  hooks/

lib/
  thinkingAgent.js
  thinkingMachine/
    nodeMeta.js
    graphMerge.js
    connectorEdges.js
    reactflowTransforms.js

styles/
  globals.css
```

## Environment

Create `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
```

## Run

```bash
npm install
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```

## Current State

This repository is no longer just a visual idea-mapping prototype.
It is now a project-based reasoning workspace with:

- authentication entry flow
- project dashboard
- project workspace routing
- personal vs team canvas modes
- reasoning mode system
- AI-assisted node generation
- candidate/share workflow
- local activity log
- premium graph-canvas UI refinements

## Known Limitations

- auth is localStorage-based mock auth
- collaboration is simulated locally, not multi-user synced
- GitHub/project persistence is not yet backed by a real database
- some AI classifications still rely on heuristics after model output
- activity is filtered to team-relevant local actions only

## Near-Term Direction

The next meaningful product improvements are likely to be:

- stronger automatic orchestration of reasoning modes
- richer relation semantics and layout intelligence
- better AI suggestion diversity
- real project persistence and multi-user collaboration
- more precise node classification from conversation context

## Repository Note

This codebase currently reflects an active product transition from:

- a 5W1H idea-mapping prototype

to:

- a conversational reasoning and collaborative structure-building system

That transition is already visible in the architecture, node model, and workspace flow.
