import axios from "axios";
import { loadConfig } from "../../config";
const config = loadConfig();

const extractJsonFromString = (text: string): string | null => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

export const generateGoogleCompletion = async (
  prompt: string
): Promise<any> => {
  const apiKey = config.google.apiKey;
  if (!apiKey) {
    throw new Error("Google API key is not configured in settings.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.google.model}:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        // Request JSON output directly from the API
        generationConfig: {
          response_mime_type: "application/json",
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (content) {
      const jsonString = extractJsonFromString(content);
      if (jsonString) {
        try {
          return JSON.parse(jsonString);
        } catch (e) {
          console.error(
            "Failed to parse JSON response from Google:",
            jsonString
          );
          throw new Error("AI returned malformed JSON.");
        }
      }
    }

    throw new Error("Invalid or empty response structure from Google.");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error calling Google API:", error.response?.data);
      throw new Error(
        `Failed to get a response from Google API: ${error.message}`
      );
    }
    throw error;
  }
};
