// packages/backend/src/config/index.ts

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { defaultConfig, Config } from "./defaults";

// Define the cross-platform path for the user's config file
const configDir = path.join(os.homedir(), ".config", "vectorseo");
const configPath = path.join(configDir, "config.json");

/**
 * Loads the user's configuration, creates a default one if it doesn't exist,
 * and merges it with the application's default settings.
 */
function loadConfig(): Config {
  // 1. Ensure the ~/.config/vectorseo directory exists.
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // 2. If config.json doesn't exist, create it from our defaults.
  // This happens on the user's first run of the app.
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`Created default configuration file at: ${configPath}`);
    return defaultConfig;
  }

  // 3. If the file exists, read it and merge it with the defaults.
  try {
    const userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Deep merge the user's settings on top of the defaults
    const mergedConfig = {
      ...defaultConfig,
      ...userConfig,
      ollama: { ...defaultConfig.ollama, ...userConfig.ollama },
      email: {
        ...defaultConfig.email,
        ...userConfig.email,
        smtp: { ...defaultConfig.email.smtp, ...userConfig.email?.smtp },
        auth: { ...defaultConfig.email.auth, ...userConfig.email?.auth },
        defaults: {
          ...defaultConfig.email.defaults,
          ...userConfig.email?.defaults,
        },
      },
    };

    return mergedConfig;
  } catch (error) {
    console.error(
      `Error parsing config file at ${configPath}. Please check for JSON syntax errors. Using default settings.`,
      error
    );
    // If the user's file is broken, fall back to the safe defaults.
    return defaultConfig;
  }
}

// Export a single, ready-to-use config object for the entire app
const config = loadConfig();

export { loadConfig, Config };
