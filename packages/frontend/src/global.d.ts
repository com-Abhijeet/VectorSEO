// src/vite-env.d.ts

/// <reference types="vite/client" />

interface UserMemory {
  preferences: string[];
}

interface Config {
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

interface Window {
  electronAPI: {
    runAudit: (options: {
      url: string;
      limit: number;
      provider: string;
      send: boolean;
    }) => void;
    openPdf: (path: string) => void;
    onAuditProgress: (
      callback: (update: { message: string; percent: number }) => void
    ) => void;
    onAuditComplete: (
      callback: (result: {
        pdfPath: string;
        emailSentTo?: string;
        emailError?: string;
      }) => void
    ) => void;
    onAuditError: (callback: (error: string) => void) => void;
    getConfig: () => Promise<Config>;
    saveConfig: (
      config: Config
    ) => Promise<{ success: boolean; error?: string }>;
    chatSendMessage: (history: any[]) => Promise<any>;
    chatGenerateTitle: (firstMessage: string) => Promise<string>;
    getMemory: () => Promise<UserMemory>;
    addPreference: (preference: string) => Promise<UserMemory>;
    removePreference: (preference: string) => Promise<UserMemory>;
    getAppVersion: () => Promise<string>;
    onUpdaterStatus: (callback: (status: IpcStatusUpdate) => void) => void;
    checkUpdates: () => void;
    installUpdate: () => void;
    removeUpdaterListeners: () => void;
    openExternalLink: (url: string) => void;
    // Add a function to remove listeners for cleanup
    removeAllListeners: () => void;
  };
}
