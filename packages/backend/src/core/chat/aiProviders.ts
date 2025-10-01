import { loadConfig } from "../../config";
import { generateGoogleCompletion } from "../providers/google";
import { generateOllamaCompletion } from "../providers/ollama";
import { generateOpenAICompletion } from "../providers/openai";

/**
 * A single function to generate an AI chat completion.
 * It reads the active provider from the config and calls the appropriate service.
 * @param prompt The prompt to send to the AI.
 * @returns The parsed JSON response from the selected AI.
 */
export const generateChatCompletion = async (prompt: string): Promise<any> => {
  // Load the latest config each time to ensure settings are up-to-date
  const config = loadConfig();

  console.log(`Routing chat completion to: ${config.activeProvider}`);

  try {
    switch (config.activeProvider) {
      case "openai":
        return await generateOpenAICompletion(prompt);

      case "google":
        return await generateGoogleCompletion(prompt);

      case "ollama":
        return await generateOllamaCompletion(prompt);

      default:
        console.warn(
          `Unknown provider "${config.activeProvider}", defaulting to Ollama.`
        );
        return await generateOllamaCompletion(prompt);
    }
  } catch (error) {
    console.error(`Error with ${config.activeProvider} provider:`, error);
    // Re-throw the error to be handled by the caller (e.g., the chat handler)
    throw error;
  }
};
