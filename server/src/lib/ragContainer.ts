import { getRagService } from "../services/ragService";
import { EmbeddingService } from "../services/embeddingService";
import { LocalFileVectorStore } from "../vectorstore/localFileStore";
import { createProviders } from "../providers/factory";
import { config } from "../config";

type RagServiceInstance = ReturnType<typeof getRagService>;

let instance: RagServiceInstance | null = null;

export function getRagContainer(): RagServiceInstance {
  if (!instance) {
    const { embedding, llm } = createProviders();
    const vectorStore = new LocalFileVectorStore(config.rag.dataDir);
    const embeddingService = new EmbeddingService(embedding);
    instance = getRagService(embeddingService, vectorStore, llm);
  }
  return instance;
}
