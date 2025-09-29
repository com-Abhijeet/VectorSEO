// packages/backend/src/config/defaults.ts

export interface Config {
  activeProvider: "ollama" | "google" | "openai";
  ollama: {
    baseUrl: string;
    model: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  google: {
    apiKey: string;
    model: string;
  };
  email: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
    };
    auth: {
      user: string;
      pass: string;
    };
    defaults: {
      from: string;
    };
  };
}

// These are the fallback settings for the application.
export const defaultConfig: Config = {
  activeProvider: "ollama",
  ollama: {
    baseUrl: "http://localhost:11434",
    model: "llama3:8b",
  },
  openai: {
    apiKey: "",
    model: "gpt-4o",
  },
  google: {
    apiKey: "",
    model: "gemini-1.5-flash",
  },
  email: {
    enabled: false, // Default to disabled for safety
    smtp: {
      host: "smtp.example.com",
      port: 587,
      secure: false,
    },
    auth: {
      // These should be loaded from .env in the main process, not here.
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || "",
    },
    defaults: {
      from: '"VectorSEO Report" <noreply@example.com>',
    },
  },
};
