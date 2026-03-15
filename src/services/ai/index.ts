import { AmazonAIService, AmazonChatService } from "./amazon";
import { AIService, ChatService, ChatCallbacks } from "./types";

export * from "./types";

export function getAIService(): AIService {
  return new AmazonAIService();
}

export function createChatService(callbacks: ChatCallbacks): ChatService {
  return new AmazonChatService(callbacks);
}
