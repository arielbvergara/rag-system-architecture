---
inclusion: always
---

## Project Overview

This is a **Next.js + Express TypeScript monorepo** implementing a local-first **Retrieval-Augmented Generation (RAG)** system. Users upload documents and chat with them using semantic search and grounded LLM generation with source citations. The frontend runs on Next.js (App Router) with React + Tailwind CSS; the backend is Express 5 on port 4000. There is no traditional database — vectors, chunks, and document metadata are persisted as JSON files in `RAG_DATA_DIR`.

**Tech Stack:** Next.js 16 · React 19 · Express 5 · TypeScript · Tailwind CSS 4 · Vitest · Gemini AI (swappable to any OpenAI-compatible endpoint)

### Frontend Pages (`client/src/app/`)

- **Home** (`/`) — Landing page with RAG feature overview and navigation
- **Documents** (`/documents`) — Admin-gated document upload, knowledge base listing, delete
- **Chat** (`/chat`) — Streaming chat with document filter, message history, and citation cards
- **Route handler** (`api/rag/chat/stream/route.ts`) — Next.js BFF proxy that forwards SSE streams from Express (uses `BACKEND_URL` server-side to bypass the `/api` rewrite)

### Frontend Utilities

- **`client/src/hooks/useSessionStorage.ts`** — SSR-safe hook for persisting state to `sessionStorage`; reuse it instead of writing ad-hoc `window.sessionStorage` code
- **`client/src/lib/documentStatus.ts`** — Shared constants for document processing status: `STATUS_STYLES` (CSS class maps), `STATUS_LABELS`, `STEP_LABELS`, `PROCESSING_STEPS`; import from here rather than duplicating status strings

### Backend Services (`server/src/services/`)

- **`documentProcessingService`** — Parse PDF/text/markdown, recursive character chunking (`chunkSize: 1000`, `overlap: 200`)
- **`embeddingService`** — Batches chunks (20 per call), wraps `IEmbeddingProvider`
- **`ragService`** — Ingest pipeline (parse → chunk → embed → upsert), chat (embed query → vector search → grounded prompt → generate), streaming via SSE, in-memory session history

### Server Utilities (`server/src/lib/`)

- **`cache.ts`** — In-memory TTL cache
- **`errorUtils.ts`** — `getErrorMessage()` helper for safe error-to-string conversion; reuse instead of inline `err instanceof Error ? err.message : String(err)`
- **`validateParams.ts`** — `validateChatParams()` for request-body validation on RAG chat endpoints
- **`ragContainer.ts`** — Dependency-injection container wiring providers, vector store, and services together

### Provider Abstraction (`server/src/providers/`)

- **`interfaces.ts`** — `IEmbeddingProvider`, `ILLMProvider`
- **`gemini.ts`** — `gemini-embedding-001` (768 dims) + generation chain `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2-flash` → `gemini-2-flash-lite` (retries on 503/429/5xx)
- **`openai.ts`** — OpenAI SDK with optional `baseURL` override (supports Ollama / local models)
- **`factory.ts`** — `createProviders()` selects implementation from `AI_PROVIDER` env var

### Vector Store (`server/src/vectorstore/`)

- **`interfaces.ts`** — `IVectorStore`: `upsert`, `search`, `deleteByDocumentId`, `count`
- **`localFileStore.ts`** — Cosine similarity over `vectorstore.json` in `RAG_DATA_DIR`; designed to be swapped for Qdrant/Pinecone/pgvector

### Cross-Cutting Concerns

- Per-endpoint rate limiting: read 60/min · write 10/min · upload 5/min · rag 20/min · auth 5/15min
- Token-based admin auth with 24-hour sessions (`server/src/middleware/adminAuth.ts`)
- Document upload validation: single file, max 10 MB, PDF / text / markdown only (`field: document`)
- Global error handling via `server/src/middleware/error.ts` — routes throw; the middleware formats the response

---

## Clarification and Planning Phase
Before proceeding with any implementation, follow this strict sequence to ensure all work is based on a complete understanding rather than assumptions:

* **Ambiguity Analysis:** Carefully analyze the request for ambiguities, missing information, or multiple implementation paths.
* **Sequential Questioning:** Ask specific clarifying questions one at a time. Get a definitive answer for each before moving to the next question until no ambiguity remains.
* **Security Analysis Enforcement:** Any request involving security analysis must be assessed against MITRE ATT&CK techniques and OWASP Top 10 risks. Incorporate recognized threat models, vulnerability classifications, and secure design principles. Reference: https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/
* **Implementation Planning:** Create a detailed plan for the changes. This plan will undergo a short discussion for any necessary refinements or agreement.
* **Task Breakdown:** Once the plan is agreed upon, break the work down into a list of atomic tasks.
* **Final Authorization:** Present the task list for review and obtain an explicit "go ahead" before starting any implementation work.

---

## Branch Management
Maintain a structured branching workflow to ensure the integrity of the default branch:

* **Feature Branches:** Always work within a feature branch. No commits are permitted directly to the default branch.
* **Naming Convention:** Create new branches using the format: `issue-<ticket-id>-<short-description>`.
* **Issue Linkage:** Extract the issue number from the branch name to use in the `refs:` section of commit messages.

---

## Implementation and Quality Control
During the implementation phase, maintain high standards for code integrity, documentation, and clean code principles:

* **Build Integrity:** Ensure the application builds successfully without any fixable errors or warnings before moving toward the commit stage.
* **Regression Prevention:** When making changes to shared code, ensure that other code references or dependencies are not negatively affected to avoid regression bugs.
* **Clean Code Standards:** Do not introduce magic numbers, magic strings, or inline styles. Define meaningful named constants, enums, or configuration values instead. Centralize reusable values and use self-describing names that express intent.
* **Testing Requirements:** Always generate or update existing unit tests. Include the relevant tests in the corresponding commit.
* **Test Naming Convention:** All generated tests must follow the naming pattern: `{MethodName}_Should{doSomething}_When{Condition}`.
* **Documentation Synchronization:** Update any documentation affected by code changes (such as DB schemas or internal instructions) to ensure it remains accurate and up to date.
* **Pre-Commit Verification:** When implementation is complete, notify the user to allow for testing before any work is committed.

---

## Commit Requirements
Adhere to these standards to ensure a clean and traceable version history:

* **Authorization to Commit:** Do not perform any commits unless explicit permission has been granted to commit the work.
* **Atomic Commits:** Break the work into small, atomic chunks so that each commit implements or fixes exactly one thing.
* **Documentation and Test Inclusion:** Always include related documentation changes and unit tests within the same commit as the code changes they describe.
* **Commit Specifications:** Always use the [Conventional Commit specifications](https://www.conventionalcommits.org/en/v1.0.0/#specification).
* **Message Formatting:** Use the imperative mode for the commit summary and include a detailed description of the changes.
* **Issue Tracking:** Include a reference (e.g., `refs: WT-1234`) at the end of the commit, utilizing the issue number extracted from the branch name.

---

## MCP Server Protocols
You must utilize specific documentation servers when the task involves the following technologies:

* **Microsoft Stack:** For any work involving C#, ASP.NET Core, Microsoft.Extensions, NuGet, Entity Framework, Blazor, or the dotnet runtime, use the `microsoft.docs.mcp` server to retrieve the latest official information.
* **External & UI Components:** For tasks involving external components (e.g., Mermaid, Redis, React) or UI components without a specified toolkit, use the `ask_question` tool from DeepWiki’s MCP or `query_docs` from the Context7 MCP to find correct implementation patterns before writing code.