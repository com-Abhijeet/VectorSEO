import axios from "axios";
import { loadConfig } from "../../config";
import { sanitizeAndParseJson } from "../../utils/jsonUtils";
const config = loadConfig();

/**
 * Extracts the first valid JSON object from a string that might contain other text.
 * @param text The raw string response from the AI.
 * @returns The cleaned JSON string, or null if no JSON is found.
 */
const extractJsonFromString = (text: string): string | null => {
  // This regex finds the first occurrence of a string starting with '{' and ending with '}'
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

export const generateOllamaCompletion = async (
  prompt: string
): Promise<any> => {
  try {
    const response = await axios.post(
      `${config.ollama.baseUrl}/api/generate`,
      {
        model: config.ollama.model,
        prompt: prompt,
        stream: false,
        format: "json",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000, //  Abort request after 20 seconds
      }
    );

    const rawResponse = response.data?.response;

    if (typeof rawResponse === "object" && rawResponse !== null) {
      return rawResponse; 
    }

    if (typeof rawResponse === "string") {
      const jsonString = extractJsonFromString(rawResponse);
      if (jsonString) {
        try {
          return JSON.parse(jsonString);
        } catch (e) {
          console.error(
            "Failed to parse the extracted JSON string:",
            jsonString
          );
          throw new Error(
            "AI returned a malformed JSON object that could not be parsed."
          );
        }
      }
    }

    console.error(
      "Invalid or empty response structure from Ollama:",
      response.data
    );
    throw new Error(
      "Could not find any valid JSON in the response from Ollama."
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === "ECONNREFUSED") {
      throw new Error(
        `Could not connect to Ollama server at ${config.ollama.baseUrl}.`
      );
    }
    throw error;
  }
};

/**
 * Generates a simple text completion from Ollama.
 * @param prompt The prompt to send to the AI.
 * @returns The raw text response.
 */
export const generateOllamaTextCompletion = async (
  prompt: string
): Promise<string> => {
  try {
    const response = await axios.post(
      `${config.ollama.baseUrl}/api/generate`,
      {
        model: config.ollama.model,
        prompt: prompt,
        stream: false,
        // NOTICE: 'format: "json"',
      },
      { headers: { "Content-Type": "application/json" } }
    );
    // return sanitizeAndParseJson(response.data?.response);
    return response.data?.response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === "ECONNREFUSED") {
      throw new Error(
        `Could not connect to Ollama server at ${config.ollama.baseUrl}.`
      );
    }
    throw error;
  }
};
