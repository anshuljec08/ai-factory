# Phase 1 - Architecture Deviations

> Known deviations from the target architecture documented in `docs/design-principles.md`, `docs/scalability.md`, `docs/ui-integration.md`, and `docs/tool-management.md`. Each deviation is intentional for Phase 1 and has a planned resolution.

---

## Active Deviations

### 1. Inline Tool Config (vs. Centralized Tool Registry)

| | |
|---|---|
| **Target** | `tool-management.md`: Agents reference tools by simple ID; Tool Manager holds all config |
| **Current** | Agents embed full MCP config inline in `tools[].config` |
| **Reason** | Centralized Tool Registry service does not exist yet |
| **Resolution** | **Phase 2, Week 4** — persist tools in agent-registry backend, agents reference by ID array `tools: ["id1", "id2"]` |
| **Code markers** | `ChatService.js:loadTools()`, `McpClient.js:loadAllTools()` |

---

### 2. Client-Side Agentic Loop (vs. Execution Engine)

| | |
|---|---|
| **Target** | `ui-integration.md`: Custom UI5 calls `POST /execute` on Execution Engine |
| **Current** | ChatService runs the agentic loop in-browser (LLM calls + tool calls) |
| **Reason** | Execution Engine service is Phase 2 |
| **Resolution** | **Phase 2, Week 1** — Dual Execution Engine (Node.js port 3003 + Python port 3004). ChatService calls `POST /execute/stream` via SSE. Feature flag for gradual migration. |
| **Code markers** | `ChatService.js:_sendToLLM()` |

---

### 3. Plain String System Prompt (vs. Structured Prompt Object)

| | |
|---|---|
| **Target** | `design-principles.md`: systemPrompt is structured object with `background[]`, `steps[]`, `outputInstructions[]`, `constraints[]` |
| **Current** | systemPrompt is a plain string passed directly to LLM |
| **Reason** | Agent Designer UI (which assembles structured prompts) is Week 3 |
| **Resolution** | **Phase 2, Week 4** — Agent Designer supports structured prompt object `{ background[], steps[], constraints[], outputFormat[] }`. Execution Engine flattens to string before sending to LLM. Backward compatible (plain string still works). |
| **Code markers** | `ChatService.js:_sendToLLM()` (system prompt handling) |

---

### 4. No Context Providers

| | |
|---|---|
| **Target** | `design-principles.md`: Dynamic context injection (shift info, alerts, user profile) appended to system prompt at runtime |
| **Current** | Not implemented — system prompt sent as-is |
| **Reason** | Context Provider services (shift-service, alert-service) not built yet |
| **Resolution** | **Phase 2, Week 3** — `contextProviders[]` array in agent schema. Execution Engine fetches context at runtime (HTTP endpoints, RAG queries) and injects into system prompt before LLM call. |
| **Code markers** | `AgentManager.js:loadAgentsConfig()` |

---

### 5. No Hooks System

| | |
|---|---|
| **Target** | `design-principles.md`: Lifecycle hooks (preExecution, postToolCall, onError, postExecution) for logging, metrics, retry |
| **Current** | Not implemented — no lifecycle interception |
| **Reason** | Hooks require the Execution Engine to have a lifecycle to hook into |
| **Resolution** | **Phase 2, Week 4** — Lifecycle events in Execution Engine: `preExecution`, `postToolCall`, `onError`, `postExecution`. Hook definitions in agent config: `hooks: [{ event, action }]`. Built-in hooks: logging, metrics, retry on error. |
| **Code markers** | `AgentManager.js:loadAgentsConfig()` |

---

## Resolved Deviations

_(Move entries here as they get resolved)_

---

## How to Find Deviations in Code

Search for `// DEVIATION:` in the `webapp/` directory. Each marker points back to this file.
