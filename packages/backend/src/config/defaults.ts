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
      user: "",
      pass: "",
    },
    defaults: {
      from: '"VectorSEO Report" <noreply@example.com>',
    },
  },
};
