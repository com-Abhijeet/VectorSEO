import { generateOllamaTextCompletion } from "../providers/ollama";
import { generateChatCompletion } from "./aiProviders";
import { createChatPrompt, createTitlePrompt } from "./prompt";
import { readMemory, writeMemory } from "../memory";

export const handleSendMessage = async (history: any) => {
  // 1. Read the current memory from disk
  const currentMemory = readMemory();

  // 2. Create the prompt with the current memory and history
  const prompt = createChatPrompt(history, currentMemory);

  // 3. Get the AI's response and return it directly
  const aiResponse = await generateChatCompletion(prompt);
  console.log(aiResponse);
  return aiResponse;
};

export const handleGenerateTitle = async (
  firstMessage: string
): Promise<string> => {
  const prompt = createTitlePrompt(firstMessage);
  const response = await generateOllamaTextCompletion(prompt);

  // Case 1: The AI returned an object by mistake
  if (typeof response === "object" && response !== null) {
    const keys = Object.keys(response);
    const values = Object.values(response);

    // Check if the first key is a sensible title
    if (keys.length > 0 && typeof keys[0] === "string" && keys[0].length > 1) {
      return keys[0].trim().replace(/"/g, "");
    }

    // Fallback: Check if the first value is a string
    if (values.length > 0 && typeof values[0] === "string") {
      return values[0].trim().replace(/"/g, "");
    }

    // If we can't find anything, return a default
    return "Untitled Chat";
  }

  // Case 2: The AI returned a string as expected
  if (typeof response === "string") {
    return response.trim().replace(/"/g, "");
  }

  // Final fallback for any other unexpected type
  return "Untitled Chat";
};
