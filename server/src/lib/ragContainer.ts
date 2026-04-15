import { getRagService } from "../services/ragService";
import { EmbeddingService } from "../services/embeddingService";
import { createVectorStore } from "../vectorstore/factory";
import { createProviders } from "../providers/factory";

type RagServiceInstance = ReturnType<typeof getRagService>;

let instance: RagServiceInstance | null = null;

export function getRagContainer(): RagServiceInstance {
  if (!instance) {
    const { embedding, llm } = createProviders();
    const vectorStore = createVectorStore(embedding);
    const embeddingService = new EmbeddingService(embedding);
    instance = getRagService(embeddingService, vectorStore, llm);
  }
  return instance;
}
