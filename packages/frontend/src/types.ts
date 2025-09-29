export interface AIResponse {
  context: string[];
  message: string;
  code?: {
    language: string;
    snippet: string;
  };
  summary: string;
}

export interface UserMemory {
  preferences: string[];
}
