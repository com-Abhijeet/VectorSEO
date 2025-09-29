// packages/backend/src/core/chat/chat_handler.ts

import { generateOllamaTextCompletion } from "../providers/ollama";
import { generateChatCompletion } from "./aiProviders"; // <-- Import your new function
import { createChatPrompt, createTitlePrompt } from "./prompt";
import { readMemory, writeMemory } from "../memory";

export const handleSendMessage = async (history: any[]) => {
  let currentMemory = readMemory();
  const prompt = createChatPrompt(history, currentMemory);
  const aiResponse = await generateChatCompletion(prompt);

  if (aiResponse.memoryOperation && aiResponse.memoryOperation.preference) {
    const { action, preference } = aiResponse.memoryOperation;
    console.log(`Performing memory operation: ${action} -> "${preference}"`);

    if (action === "add" && !currentMemory.preferences.includes(preference)) {
      currentMemory.preferences.push(preference);
    } else if (action === "remove") {
      const keyword = preference.toLowerCase();

      // ✅ CORRECTED LOGIC:
      // Keep a preference 'p' if the long 'keyword' from the AI
      // does NOT include the text of 'p'.
      currentMemory.preferences = currentMemory.preferences.filter(
        (p) => !keyword.includes(p.toLowerCase())
      );
    }

    writeMemory(currentMemory);
  }

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

    // ✅ NEW: Check if the first key is a sensible title
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
