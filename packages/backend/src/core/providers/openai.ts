import axios from "axios";
import { loadConfig } from "../../config";
const config = loadConfig();

// This helper function is useful for all providers
const extractJsonFromString = (text: string): string | null => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

export const generateOpenAICompletion = async (
  prompt: string
): Promise<any> => {
  const apiKey = config.openai.apiKey;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured in settings.");
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: config.openai.model,
        messages: [{ role: "user", content: prompt }],
        // Request JSON output directly from the API
        response_format: { type: "json_object" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content) {
      try {
        // The content itself is a JSON string that needs to be parsed
        return JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse JSON response from OpenAI:", content);
        throw new Error("AI returned malformed JSON.");
      }
    }

    throw new Error("Invalid or empty response structure from OpenAI.");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error calling OpenAI:", error.response?.data);
      throw new Error(
        `Failed to get a response from OpenAI API: ${error.message}`
      );
    }
    throw error;
  }
};
