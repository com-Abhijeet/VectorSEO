// packages/frontend/src/Settings.tsx

import React, { useState, useEffect } from "react";
import {
  CircleCheck,
  CircleX,
  Cpu,
  Database,
  Mail,
  Power,
  Save,
} from "lucide-react";

export function Settings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [status, setStatus] = useState<{
    message: string;
    type: "success" | "error" | "saving";
  } | null>(null);

  useEffect(() => {
    window.electronAPI.getConfig().then((loadedConfig: Config) => {
      setConfig(loadedConfig);
    });
  }, []);

  // UPDATED: This handler is now safer and won't crash if a nested object is missing.
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    const keys = name.split(".");

    if (config) {
      let newConfig = { ...config };
      let currentLevel: any = newConfig;

      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          // Set the final value, converting to number if applicable
          currentLevel[key] =
            !isCheckbox && !isNaN(Number(val)) && val !== ""
              ? Number(val)
              : val;
        } else {
          // If a level doesn't exist, create it before proceeding
          if (!currentLevel[key]) {
            currentLevel[key] = {};
          }
          currentLevel[key] = { ...currentLevel[key] };
          currentLevel = currentLevel[key];
        }
      });
      setConfig(newConfig);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setStatus({ message: "Saving...", type: "saving" });
    const result = await window.electronAPI.saveConfig(config);

    if (result.success) {
      setStatus({ message: "Settings Saved Successfully!", type: "success" });
    } else {
      setStatus({ message: `Error: ${result.error}`, type: "error" });
    }

    // Clear the message after 3 seconds
    setTimeout(() => setStatus(null), 3000);
  };

  if (!config) {
    return <div className="settings-page__loader">Loading settings...</div>;
  }
  // UPDATED: All inputs now use optional chaining for safe access

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <Cpu size={28} />
        <h1>Application Settings</h1>
      </header>

      <form className="settings-page__form" onSubmit={handleSave}>
        {/* --- CARD 1: Active Provider --- */}
        <div className="settings-card">
          <div className="settings-card__header">
            <Power size={20} />
            <h3 className="settings-card__title">AI Provider</h3>
          </div>
          <div className="settings-card__body">
            <div className="form-group">
              <label htmlFor="activeProvider">Active Provider</label>
              <select
                id="activeProvider"
                name="activeProvider"
                className="form-select"
                value={config?.activeProvider ?? "ollama"}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    activeProvider: e.target.value as Config["activeProvider"],
                  })
                }
              >
                <option value="ollama">Ollama (Local)</option>
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
              </select>
              <p className="form-hint">
                Choose the AI service to perform the analysis.
              </p>
            </div>
          </div>
        </div>

        {/* --- CARD 2: Ollama Settings (Conditional) --- */}
        {config.activeProvider === "ollama" && (
          <div className="settings-card">
            <div className="settings-card__header">
              <Database size={20} />
              <h3 className="settings-card__title">Ollama Configuration</h3>
            </div>
            <div className="settings-card__body">
              <div className="form-group">
                <label htmlFor="ollamaModel">Ollama Model Name</label>
                <input
                  type="text"
                  id="ollamaModel"
                  name="ollama.model"
                  className="form-input"
                  value={config?.ollama?.model ?? ""}
                  onChange={handleInputChange}
                />
                <p className="form-hint">
                  e.g., `llama3:8b` or `mistral`. Must be installed.
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="ollamaBaseUrl">Ollama Base URL</label>
                <input
                  type="text"
                  id="ollamaBaseUrl"
                  name="ollama.baseUrl"
                  className="form-input"
                  value={config?.ollama?.baseUrl ?? ""}
                  onChange={handleInputChange}
                />
                <p className="form-hint">
                  The local URL where Ollama is running.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- CARD 3: OpenAI Settings (Conditional) --- */}
        {config.activeProvider === "openai" && (
          <div className="settings-card">
            <div className="settings-card__header">
              {/* You can add an OpenAI SVG logo to your /public folder */}
              <h3 className="settings-card__title">OpenAI Configuration</h3>
            </div>
            <div className="settings-card__body">
              <div className="form-group">
                <label htmlFor="openaiApiKey">API Key</label>
                <input
                  type="password"
                  id="openaiApiKey"
                  name="openai.apiKey"
                  className="form-input"
                  value={config?.openai?.apiKey ?? ""}
                  onChange={handleInputChange}
                />
                <p className="form-hint">
                  Your secret API key from the OpenAI platform.
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="openaiModel">Model Name</label>
                <input
                  type="text"
                  id="openaiModel"
                  name="openai.model"
                  className="form-input"
                  value={config?.openai?.model ?? ""}
                  onChange={handleInputChange}
                />
                <p className="form-hint">e.g., `gpt-4o` or `gpt-3.5-turbo`</p>
              </div>
            </div>
          </div>
        )}

        {/* --- CARD 4: Google Gemini Settings (Conditional) --- */}
        {config.activeProvider === "google" && (
          <div className="settings-card">
            <div className="settings-card__header">
              {/* You can add a Google SVG logo to your /public folder */}
              <h3 className="settings-card__title">
                Google Gemini Configuration
              </h3>
            </div>
            <div className="settings-card__body">
              <div className="form-group">
                <label htmlFor="googleApiKey">API Key</label>
                <input
                  type="password"
                  id="googleApiKey"
                  name="google.apiKey"
                  className="form-input"
                  value={config?.google?.apiKey ?? ""}
                  onChange={handleInputChange}
                />
                <p className="form-hint">Your API key from Google AI Studio.</p>
              </div>
              <div className="form-group">
                <label htmlFor="googleModel">Model Name</label>
                <input
                  type="text"
                  id="googleModel"
                  name="google.model"
                  className="form-input"
                  value={config?.google?.model ?? ""}
                  onChange={handleInputChange}
                />
                <p className="form-hint">e.g., `gemini-1.5-flash`</p>
              </div>
            </div>
          </div>
        )}

        <div className="settings-card">
          <div className="settings-card__header">
            <Mail size={20} />
            <h3 className="settings-card__title">Email Configuration</h3>
          </div>
          <div className="settings-card__body">
            <div className="form-group--checkbox">
              <input
                type="checkbox"
                id="emailEnabled"
                name="email.enabled"
                checked={config?.email?.enabled ?? false}
                onChange={handleInputChange}
              />
              <label htmlFor="emailEnabled">Enable Email Notifications</label>
            </div>
            {/* --- NEW FIELD --- */}
            <div className="form-group--checkbox">
              <input
                type="checkbox"
                id="smtpSecure"
                name="email.smtp.secure"
                checked={config?.email?.smtp?.secure ?? false}
                onChange={handleInputChange}
              />
              <label htmlFor="smtpSecure">
                Use SSL/TLS (Secure Connection)
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="smtpHost">SMTP Host</label>
              <input
                type="text"
                id="smtpHost"
                name="email.smtp.host"
                className="form-input"
                value={config?.email?.smtp?.host ?? ""}
                onChange={handleInputChange}
              />
              <p className="form-hint">e.g., `smtp.gmail.com`</p>
            </div>
            <div className="form-group">
              <label htmlFor="smtpPort">SMTP Port</label>
              <input
                type="number"
                id="smtpPort"
                name="email.smtp.port"
                className="form-input"
                value={config?.email?.smtp?.port ?? ""}
                onChange={handleInputChange}
              />
              <p className="form-hint">e.g., `587` (TLS) or `465` (SSL).</p>
            </div>
            <div className="form-group">
              <label htmlFor="authUser">Auth User</label>
              <input
                type="text"
                id="authUser"
                name="email.auth.user"
                className="form-input"
                value={config?.email?.auth?.user ?? ""}
                onChange={handleInputChange}
              />
              <p className="form-hint">Your email account username.</p>
            </div>
            <div className="form-group">
              <label htmlFor="authPass">Auth Password</label>
              <input
                type="password"
                id="authPass"
                name="email.auth.pass"
                className="form-input"
                value={config?.email?.auth?.pass ?? ""}
                onChange={handleInputChange}
                placeholder="Loaded from .env, edit there"
              />
              <p className="form-hint">
                Loaded from your `.env` file for security.
              </p>
            </div>
            {/* --- NEW FIELD --- */}
            <div className="form-group">
              <label htmlFor="fromAddress">"From" Address</label>
              <input
                type="text"
                id="fromAddress"
                name="email.defaults.from"
                className="form-input"
                value={config?.email?.defaults?.from ?? ""}
                onChange={handleInputChange}
              />
              <p className="form-hint">
                e.g., `Your Name &lt;you@example.com&gt;`
              </p>
            </div>
          </div>
        </div>

        <footer className="settings-page__footer">
          {/* 3. Render the status message in the UI */}
          {status && (
            <div className={`status-message status-message--${status.type}`}>
              {status.type === "success" && <CircleCheck size={16} />}
              {status.type === "error" && <CircleX size={16} />}
              {status.message}
            </div>
          )}
          <button
            type="submit"
            className="settings-form__button"
            disabled={status?.type === "saving"}
          >
            <Save size={16} />
            {status?.type === "saving" ? "Saving..." : "Save Settings"}
          </button>
        </footer>
      </form>
    </div>
  );
}
