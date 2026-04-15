# documents — RAG Document Intelligence

A full-stack monorepo with **Next.js** (frontend) + **Express** (backend API) implementing a local-first **Retrieval-Augmented Generation (RAG)** system. Upload documents, then chat with them using semantic search and grounded LLM generation with source citations.

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Frontend    | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend     | Express 5, TypeScript, Node 20                  |
| AI Provider | Gemini (`gemini-2.5-flash` with lite fallback chain + `gemini-embedding-001`) or any OpenAI-compatible endpoint |
| Vector Store | Local JSON file (default) or Qdrant (managed / self-hosted) |
| Document Parsing | `pdf-parse` (PDF), native UTF-8 (text/markdown) |
| Testing     | Vitest                                          |
| Package Mgr | pnpm (workspaces)                               |
| Containers  | Docker & Docker Compose                         |

## Project Structure

```
├── client/                  # Next.js frontend (port 3000)
│   └── src/
│       ├── app/             # App Router pages (/, /documents, /chat)
│       │   └── api/         # Route handlers (e.g. rag/chat/stream SSE proxy to Express)
│       ├── components/ui/   # ChatInterface, DocumentList, DocumentUploader, CitationCard, …
│       ├── hooks/           # Shared React hooks (useSessionStorage)
│       ├── lib/             # API client (api.ts), documentStatus constants, utils
│       └── types/           # Shared TypeScript types
├── server/                  # Express backend (port 4000)
│   └── src/
│       ├── config/          # App config (AI provider, RAG settings)
│       ├── controllers/     # documentsController, ragController, adminController
│       ├── lib/             # TTL cache, errorUtils, validateParams, ragContainer (DI)
│       ├── middleware/      # adminAuth, rateLimit, upload, error (global handler)
│       ├── providers/       # IEmbeddingProvider / ILLMProvider + Gemini & OpenAI impls
│       ├── routes/          # documents, rag, admin (+ index.ts aggregator)
│       ├── services/        # documentProcessingService, embeddingService, ragService
│       ├── tests/           # Vitest unit tests (incl. vectorstoreContract)
│       ├── types/           # Server-side TypeScript types
│       ├── vectorstore/     # IVectorStore interface + Local & Qdrant impls + factory
│       └── index.ts         # Entry point
├── docker/
│   ├── client.Dockerfile
│   └── server.Dockerfile
├── docker-compose.yml
├── pnpm-workspace.yaml
└── .env.example
```

## How It Works

1. **Ingest** — Upload a PDF, `.txt`, or `.md` file via the `/documents` page (admin password required)
2. **Chunk** — The document is split into overlapping chunks using a recursive character splitter (`chunkSize: 1000`, `overlap: 200`)
3. **Embed** — Each chunk is embedded via the configured AI provider and stored in a local JSON vector store
4. **Chat** — On the `/chat` page, your query is embedded, the top-K most similar chunks are retrieved, and a grounded response is generated with numbered source citations

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- A Gemini API key (or an OpenAI-compatible endpoint)

### 1. Clone & Install

```bash
git clone https://github.com/arielbvergara/documents.git
cd documents
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example server/.env.local
```

Edit `server/.env.local` with your credentials. At minimum you need `ADMIN_PASSWORD` and `GEMINI_API_KEY` (or `OPENAI_API_KEY` with `AI_PROVIDER=openai`).

### 3. Run Development

```bash
# Run both client and server concurrently
pnpm dev

# Or run individually
pnpm dev:client    # http://localhost:3000
pnpm dev:server    # http://localhost:4000
```

### 4. Run with Docker

```bash
docker compose up --build
```

## Environment Variables

```bash
# Application
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:3000

# Client → Server (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:4000/api   # Browser-exposed API base
BACKEND_URL=http://localhost:4000/api           # Server-side only; used by Next.js Route Handlers to reach Express directly (bypasses /api rewrite — required for SSE streaming)

# Admin (protects document upload and delete)
ADMIN_PASSWORD=your_admin_password

# AI Provider — "gemini" (default) or "openai"
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key

# OpenAI / OpenAI-compatible (required when AI_PROVIDER=openai)
# OPENAI_API_KEY=
# OPENAI_BASE_URL=        # optional: e.g. http://localhost:11434/v1 for Ollama
# OPENAI_MODEL=gpt-4o
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# RAG Configuration
RAG_DATA_DIR=./data          # where vectors.json, chunks.json, documents.json are stored
RAG_TOP_K=5                  # number of chunks retrieved per query
RAG_CHUNK_SIZE=1000          # target characters per chunk
RAG_CHUNK_OVERLAP=200        # overlap between adjacent chunks
RAG_MAX_DOCS=50              # maximum documents in the knowledge base

# Vector Store — "local" (default, JSON file) or "qdrant"
VECTOR_STORE_TYPE=local
# Required when VECTOR_STORE_TYPE=qdrant:
#   QDRANT_URL=http://localhost:6333          # or https://<cluster>.cloud.qdrant.io:6333
#   QDRANT_API_KEY=your_qdrant_api_key        # any non-empty value for local Docker
#   QDRANT_COLLECTION=documents_chunks        # optional override
```

## API Endpoints

All endpoints are prefixed with `/api`.

### Health

| Method | Path      | Description  |
| ------ | --------- | ------------ |
| `GET`  | `/health` | Health check |

### Admin

| Method | Path          | Auth | Description                          |
| ------ | ------------- | ---- | ------------------------------------ |
| `POST` | `/admin/auth` | —    | Authenticate with `ADMIN_PASSWORD`. Returns a 24-hour Bearer token. |

### Documents

| Method   | Path                              | Auth  | Description                                      |
| -------- | --------------------------------- | ----- | ------------------------------------------------ |
| `POST`   | `/documents`                      | Admin | Upload a document (PDF / text / markdown, max 10 MB). Triggers chunking + embedding. |
| `GET`    | `/documents`                      | —     | List all documents with status, chunk count, and upload date. |
| `GET`    | `/documents/:id/status`           | —     | Poll processing status for a single document (queued / parsing / chunking / embedding / ready / error). |
| `GET`    | `/documents/:id/chunks/:chunkId`  | —     | Fetch a specific chunk's text and metadata (used by citation cards). |
| `DELETE` | `/documents/:id`                  | Admin | Delete a document and all its vectors/chunks.    |

### RAG Chat

| Method | Path               | Description                                              |
| ------ | ------------------ | -------------------------------------------------------- |
| `POST` | `/rag/chat`        | Single-turn chat. Body: `{ sessionId, message, documentIds? }`. Returns full response + citations. |
| `POST` | `/rag/chat/stream` | Streaming chat via SSE. Same body. Events: `citations` → `delta` (repeated) → `done`. |

## Rate Limits

| Limiter         | Limit           | Applied to                        |
| --------------- | --------------- | --------------------------------- |
| `readLimiter`   | 60 req / min    | `GET /documents`                  |
| `writeLimiter`  | 10 req / min    | `DELETE /documents/:id`           |
| `uploadLimiter` | 5 req / min     | `POST /documents`                 |
| `ragLimiter`    | 20 req / min    | `POST /rag/chat`, `/rag/chat/stream` |
| `authLimiter`   | 5 req / 15 min  | `POST /admin/auth`                |

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Run client + server in dev mode    |
| `pnpm dev:client`   | Run Next.js dev server             |
| `pnpm dev:server`   | Run Express dev server             |
| `pnpm build`        | Build both client and server       |
| `pnpm build:client` | Build Next.js                      |
| `pnpm build:server` | Build Express                      |
| `pnpm start`        | Start production builds            |
| `pnpm lint`         | Lint both projects                 |
| `pnpm type-check`   | TypeScript check both projects     |
| `pnpm test`         | Run server unit tests              |

## Swapping AI Providers

The system uses provider interfaces (`IEmbeddingProvider`, `ILLMProvider`) so the backend can be swapped without touching business logic:

- **Gemini** (default) — set `AI_PROVIDER=gemini` and `GEMINI_API_KEY`. The generation provider automatically falls back through `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2-flash` → `gemini-2-flash-lite` on retryable errors (503 / 429 / 5xx).
- **OpenAI** — set `AI_PROVIDER=openai` and `OPENAI_API_KEY`
- **Ollama / local models** — set `AI_PROVIDER=openai`, `OPENAI_BASE_URL=http://localhost:11434/v1`, and the model names you have pulled

## Swapping Vector Stores

The vector store is abstracted behind `IVectorStore` and selected by `createVectorStore(embedding)` in `server/src/vectorstore/factory.ts`:

- **Local** (default) — set `VECTOR_STORE_TYPE=local` (or omit). Persists to `vectorstore.json` in `RAG_DATA_DIR`. Good for development and small corpora; no external dependencies.
- **Qdrant** — set `VECTOR_STORE_TYPE=qdrant` plus `QDRANT_URL` and `QDRANT_API_KEY`. The collection is created lazily on first write with `size = embedding.getDimensions()` and `Cosine` distance; a payload index is added on `documentId` so per-document filters and deletes stay fast as the corpus grows. Works with Qdrant Cloud or a self-hosted instance (see `docker-compose.yml` for a local service).

Every `IVectorStore` implementation is verified against the shared contract in `server/src/tests/vectorstoreContract.ts`, so a new backend (Pinecone, Weaviate, pgvector, etc.) only needs to implement the interface and wire a factory branch.

## License

MIT
