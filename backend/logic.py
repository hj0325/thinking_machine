import os
import random
import uuid
from typing import List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel
from .models import Node, Edge, NodeData, Category, Phase, UserNode, CrossConnectionResult, ChatMessage

# Load .env.local first (takes precedence), then .env
load_dotenv(dotenv_path=".env.local")
load_dotenv()

# --- Layout Configuration ---
PROBLEM_X_RANGE = (0, 400)
SOLUTION_X_RANGE = (600, 1000)

CATEGORY_Y_MAP = {
    "Why":   0,
    "Who":   150,
    "What":  300,
    "How":   450,
    "When":  600,
    "Where": 750
}

# ---- Pydantic model for AI structured output ----
class AIAnalysisResult(BaseModel):
    # 인풋에서 추출한 6하원칙 노드 목록 (1~4개)
    user_nodes: List[UserNode]

    # AI가 생성하는 제안 노드 1개 (가장 핵심 user_node 기반)
    suggestion_label: str
    suggestion_content: str
    suggestion_category: Category
    suggestion_phase: Phase

    # user_nodes 중 제안 노드와 연결될 노드의 인덱스 (0-based)
    suggestion_connects_to_index: int

    # 제안 노드 연결 레이블
    connection_label: str

    # 기존 노드와의 cross-connection
    cross_connections: List[CrossConnectionResult]


class ThinkingAgent:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def calculate_position(self, phase: Phase, category: Category, slot_index: int = 0) -> Dict[str, float]:
        """
        같은 (phase, category) 조합의 노드들은 열(column) 단위로 배치.
        slot_index=0 → 중앙, 1 → 오른쪽, 2 → 왼쪽, 3 → 더 오른쪽 ...
        """
        x_range = PROBLEM_X_RANGE if phase == "Problem" else SOLUTION_X_RANGE
        base_x = (x_range[0] + x_range[1]) / 2
        base_y = CATEGORY_Y_MAP.get(category, 300)

        NODE_STRIDE_X = 230  # 노드 너비(200) + 간격(30)
        NODE_STRIDE_Y = 160  # 노드 높이(120) + 간격(40)

        # 0 → 0, 1 → +1, 2 → -1, 3 → +2, 4 → -2, ...
        if slot_index == 0:
            col_offset = 0
        elif slot_index % 2 == 1:
            col_offset = (slot_index + 1) // 2
        else:
            col_offset = -(slot_index // 2)

        row = slot_index // 4  # 4개마다 아래 줄로

        return {
            "x": base_x + col_offset * NODE_STRIDE_X,
            "y": base_y + row * NODE_STRIDE_Y
        }

    def build_history_context(self, history: List[Dict[str, Any]]) -> str:
        if not history:
            return "No existing nodes."
        lines = []
        for node in history:
            node_id = node.get("id", "unknown")
            data = node.get("data", {})
            title = data.get("title", "")
            category = data.get("category", "")
            phase = data.get("phase", "")
            if not isinstance(title, str):
                title = "(unknown)"
            lines.append(f"- ID: {node_id} | [{phase}/{category}] {title}")
        return "\n".join(lines)

    def process_idea(self, user_input: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        history_context = self.build_history_context(history)

        system_prompt = f"""
You are an autonomous agent that structures and expands a user's idea.
Given a single user input sentence, decompose it using 5W1H (Who/What/When/Where/Why/How),
extract related nodes, and respond in JSON.

---

## STEP 1. Decompose Input -> Create user_nodes

Extract only 5W1H elements that are clearly present in the user input.
- Minimum 1 and maximum 4 nodes
- Include only explicit or strongly implied elements; do not force weak assumptions
- Each node must contain: label (short action-oriented title), content (one-sentence detail), category, and phase

**Category selection criteria (strict):**
| Category | Selection Rule |
|----------|----------------|
| Who      | Main subject, target user, stakeholder, or actor |
| What     | Concrete output, feature, service, or product |
| When     | Time, timing, sequence, or frequency |
| Where    | Place, channel, space, or environment |
| Why      | Purpose, reason, motivation, or problem framing |
| How      | Method, process, means, or strategy |

**Phase selection criteria:**
- Problem: understanding the current issue, need, or context
- Solution: proposing execution, implementation, or resolution

## STEP 2. AI Suggestion Node (1 item)

Create one sharp suggestion or question that expands the idea across user_nodes.
- suggestion_connects_to_index: index of the main user_nodes item the suggestion should connect to

## STEP 3. Connect to Existing Nodes (cross_connections)

Use existing nodes and connect semantically related new user_nodes.
- existing_node_id: ID from existing history
- new_node_index: index in user_nodes to connect
- connection_label: short relation phrase
- If existing nodes are present, include at least one cross connection when meaningfully related.
- Maximum 3 cross connections.
- Respond in English only for all user-visible text fields (label, content, suggestion_label, suggestion_content, connection_label).

## Existing nodes
{history_context}
"""

        completion = self.client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input},
            ],
            response_format=AIAnalysisResult,
        )

        result = completion.choices[0].message.parsed

        # ── 1. Build slot_counts from history (기존 노드들이 각 슬롯을 몇 개 차지하는지) ──
        slot_counts: Dict[str, int] = {}
        for h_node in history:
            h_data = h_node.get("data", {})
            h_phase = h_data.get("phase", "")
            h_cat = h_data.get("category", "")
            if h_phase and h_cat:
                key = f"{h_phase}_{h_cat}"
                slot_counts[key] = slot_counts.get(key, 0) + 1

        # ── 2. Create user nodes ──
        created_nodes = []
        created_node_ids = []

        for i, un in enumerate(result.user_nodes):
            node_id = str(uuid.uuid4())
            key = f"{un.phase}_{un.category}"
            slot_idx = slot_counts.get(key, 0)
            pos = self.calculate_position(un.phase, un.category, slot_index=slot_idx)
            slot_counts[key] = slot_idx + 1  # 다음 노드를 위해 슬롯 증가

            node = Node(
                id=node_id,
                type="default",
                data=NodeData(
                    label=un.label,
                    content=un.content,
                    category=un.category,
                    phase=un.phase,
                    is_ai_generated=False
                ),
                position=pos
            )
            created_nodes.append(node)
            created_node_ids.append(node_id)

        # ── 3. Create suggestion node ──
        suggestion_id = str(uuid.uuid4())
        # 제안 노드는 해당 category/phase의 다음 슬롯에 배치
        s_key = f"{result.suggestion_phase}_{result.suggestion_category}"
        s_slot = slot_counts.get(s_key, 0)
        suggest_pos = self.calculate_position(
            result.suggestion_phase,
            result.suggestion_category,
            slot_index=s_slot
        )
        suggestion_node = Node(
            id=suggestion_id,
            type="default",
            data=NodeData(
                label=result.suggestion_label,
                content=result.suggestion_content,
                category=result.suggestion_category,
                phase=result.suggestion_phase,
                is_ai_generated=True
            ),
            position=suggest_pos
        )

        all_nodes = created_nodes + [suggestion_node]
        edges = []

        # ── 3. Connect user nodes sequentially (같은 인풋 내 노드들 연결) ──
        for i in range(len(created_node_ids) - 1):
            edges.append(Edge(
                id=f"e-input-{created_node_ids[i]}-{created_node_ids[i+1]}",
                source=created_node_ids[i],
                target=created_node_ids[i + 1],
                label="Related"
            ))

        # ── 4. Connect main user node → suggestion ──
        idx = result.suggestion_connects_to_index
        if idx >= len(created_node_ids):
            idx = 0
        main_node_id = created_node_ids[idx]
        edges.append(Edge(
            id=f"e-suggest-{main_node_id}-{suggestion_id}",
            source=main_node_id,
            target=suggestion_id,
            label=result.connection_label
        ))

        # ── 5. Cross-connections to existing nodes ──
        existing_ids = {node.get("id") for node in history}
        cross_connected_new_ids = set()

        for cross in result.cross_connections:
            if cross.existing_node_id not in existing_ids:
                continue
            new_idx = cross.new_node_index
            if new_idx >= len(created_node_ids):
                new_idx = 0
            target_id = created_node_ids[new_idx]
            edges.append(Edge(
                id=f"e-cross-{cross.existing_node_id}-{target_id}",
                source=cross.existing_node_id,
                target=target_id,
                label=cross.connection_label
            ))
            cross_connected_new_ids.add(target_id)

        # ── 6. Fallback: 기존 노드가 있지만 cross_connections가 없으면
        #       첫 번째 새 노드를 가장 가까운 기존 노드와 강제 연결 ──
        if history and created_node_ids and not cross_connected_new_ids:
            first_new_id = created_node_ids[0]
            first_new_cat = result.user_nodes[0].category if result.user_nodes else None

            # 같은 카테고리 기존 노드 우선, 없으면 가장 마지막 기존 노드
            best_existing = None
            for h_node in reversed(history):
                h_cat = h_node.get("data", {}).get("category", "")
                if h_cat == first_new_cat:
                    best_existing = h_node.get("id")
                    break
            if best_existing is None:
                best_existing = history[-1].get("id")

            if best_existing and best_existing in existing_ids:
                edge_id = f"e-cross-{best_existing}-{first_new_id}"
                # 중복 엣지 방지
                existing_edge_ids = {e.id for e in edges}
                if edge_id not in existing_edge_ids:
                    edges.append(Edge(
                        id=edge_id,
                        source=best_existing,
                        target=first_new_id,
                        label="Related"
                    ))

        return {
            "nodes": all_nodes,
            "edges": edges
        }

    # ─────────────────────────────────────────────
    # 2. AI 채팅: suggestion 카드 클릭 후 대화
    # ─────────────────────────────────────────────
    def chat_with_suggestion(
        self,
        suggestion_title: str,
        suggestion_content: str,
        suggestion_category: str,
        suggestion_phase: str,
        messages: List[ChatMessage],
        user_message: str,
    ) -> str:
        system_prompt = f"""You are an AI conversation partner that helps users explore and improve ideas.

Use the suggestion card below as the conversation anchor.
- If this is the first message (messages is empty), explain the suggestion clearly in 2-3 sentences and end with an open question.
- In follow-up turns, refine, expand, and validate the idea based on the user's replies.
- Keep responses concise.
- Respond in English only.

[Suggestion Card]
Category: {suggestion_category} / {suggestion_phase}
Title: {suggestion_title}
Content: {suggestion_content}
"""
        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        chat_history.append({"role": "user", "content": user_message})

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                *chat_history,
            ],
        )
        return response.choices[0].message.content

    # ─────────────────────────────────────────────
    # 3. 대화 내용 → ReactFlow 노드+엣지 변환
    # ─────────────────────────────────────────────
    def chat_to_nodes(
        self,
        suggestion_title: str,
        suggestion_content: str,
        suggestion_category: str,
        suggestion_phase: str,
        messages: List[ChatMessage],
        existing_nodes: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        history_context = self.build_history_context(existing_nodes)

        conversation_text = "\n".join(
            f"[{m.role.upper()}] {m.content}" for m in messages
        )

        system_prompt = f"""
You are an agent that structures a conversation into 5W1H idea nodes.

Analyze the conversation below and extract 1 to 4 core idea nodes.
Each node must include:
- label (short action-oriented title)
- content (one sentence)
- category (Who/What/When/Where/Why/How)
- phase (Problem/Solution)
- Respond in English only for all user-visible text fields (label, content, connection_label).

[Original Suggestion Card]
{suggestion_category}/{suggestion_phase}: {suggestion_title} - {suggestion_content}

[Conversation]
{conversation_text}

## Existing nodes (for cross_connections)
{history_context}
"""

        class ChatNodeResult(BaseModel):
            user_nodes: List[UserNode]
            cross_connections: List[CrossConnectionResult]

        completion = self.client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Convert this conversation into nodes."},
            ],
            response_format=ChatNodeResult,
        )
        result = completion.choices[0].message.parsed

        # 슬롯 카운트 (기존 노드 기반)
        slot_counts: Dict[str, int] = {}
        for h_node in existing_nodes:
            h_data = h_node.get("data", {})
            h_phase = h_data.get("phase", "")
            h_cat = h_data.get("category", "")
            if h_phase and h_cat:
                key = f"{h_phase}_{h_cat}"
                slot_counts[key] = slot_counts.get(key, 0) + 1

        created_nodes = []
        created_node_ids = []
        for un in result.user_nodes:
            node_id = str(uuid.uuid4())
            key = f"{un.phase}_{un.category}"
            slot_idx = slot_counts.get(key, 0)
            pos = self.calculate_position(un.phase, un.category, slot_index=slot_idx)
            slot_counts[key] = slot_idx + 1

            node = Node(
                id=node_id,
                type="default",
                data=NodeData(
                    label=un.label,
                    content=un.content,
                    category=un.category,
                    phase=un.phase,
                    is_ai_generated=False
                ),
                position=pos
            )
            created_nodes.append(node)
            created_node_ids.append(node_id)

        edges = []
        # 같은 대화에서 나온 노드들 순차 연결
        for i in range(len(created_node_ids) - 1):
            edges.append(Edge(
                id=f"e-chat-{created_node_ids[i]}-{created_node_ids[i+1]}",
                source=created_node_ids[i],
                target=created_node_ids[i + 1],
                label="Continues"
            ))

        # cross-connections to existing nodes
        existing_ids = {n.get("id") for n in existing_nodes}
        cross_connected = set()
        for cross in result.cross_connections:
            if cross.existing_node_id not in existing_ids:
                continue
            new_idx = cross.new_node_index
            if new_idx >= len(created_node_ids):
                new_idx = 0
            target_id = created_node_ids[new_idx]
            edges.append(Edge(
                id=f"e-cross-{cross.existing_node_id}-{target_id}",
                source=cross.existing_node_id,
                target=target_id,
                label=cross.connection_label
            ))
            cross_connected.add(target_id)

        # fallback: 기존 노드가 있는데 아무 연결도 없으면 마지막 기존 노드에 연결
        if existing_nodes and created_node_ids and not cross_connected:
            first_id = created_node_ids[0]
            anchor = existing_nodes[-1].get("id")
            if anchor and anchor in existing_ids:
                edges.append(Edge(
                    id=f"e-cross-{anchor}-{first_id}",
                    source=anchor,
                    target=first_id,
                    label="Evolved from conversation"
                ))

        return {"nodes": created_nodes, "edges": edges}
