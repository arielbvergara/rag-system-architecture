import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local"), override: true });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  admin: {
    password: process.env.ADMIN_PASSWORD || "",
  },
  ai: {
    provider: (process.env.AI_PROVIDER || "gemini") as "gemini" | "openai",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    openaiBaseUrl: process.env.OPENAI_BASE_URL || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
    openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  },
  rag: {
    dataDir: process.env.RAG_DATA_DIR || path.resolve(__dirname, "../../../data"),
    topK: parseInt(process.env.RAG_TOP_K || "5", 10),
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || "1000", 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || "200", 10),
    maxDocs: parseInt(process.env.RAG_MAX_DOCS || "50", 10),
  },
  vectorStore: {
    type: (process.env.VECTOR_STORE_TYPE || "local") as "local" | "qdrant",
    qdrant: {
      url: process.env.QDRANT_URL || "",
      apiKey: process.env.QDRANT_API_KEY || "",
      collection: process.env.QDRANT_COLLECTION || "documents_chunks",
    },
  },
} as const;

if (config.env === "production") {
  const required: string[] = [];
  if (config.ai.provider === "gemini") required.push("GEMINI_API_KEY");
  if (config.ai.provider === "openai") required.push("OPENAI_API_KEY");
  if (config.vectorStore.type === "qdrant") {
    required.push("QDRANT_URL", "QDRANT_API_KEY");
  }

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
