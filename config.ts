import dotenv from "dotenv";
dotenv.config();
export interface Config {
  activeProvider: "ollama" | "google" | "openai";
  ollama: {
    baseUrl: string;
    model: string;
  };
  // NEW: Email Configuration Section
  email: {
    enabled: boolean; // A master switch to turn emailing on/off
    smtp: {
      host: string;
      port: number;
      secure: boolean; // true for 465, false for other ports
    };
    auth: {
      user: string; // Your email address (e.g., from Gmail, Outlook)
      pass: string; // Your email password or App Password
    };
    defaults: {
      from: string; // "Your Name <your-email@example.com>"
    };
  };
}

// Default configuration to use Ollama out-of-the-box
export const config: Config = {
  activeProvider: "ollama",
  ollama: {
    baseUrl: "http://localhost:11434",
    model: "llama3:8b",
  },
  // NEW: Add your email details here
  email: {
    enabled: true,
    smtp: {
      host: "smtp.gmail.com", // Example for Gmail
      port: 465,
      secure: true,
    },
    auth: {
      // IMPORTANT: Use environment variables in a real application for security
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || "",
    },
    defaults: {
      from: '"Abhijeet Shinde" <shindeabhijeet552@gmail.com>',
    },
  },
};
