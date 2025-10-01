
/**
 * Finds the first potential JSON object within a string and attempts to parse it.
 * @param text The raw string response from the AI.
 * @returns The parsed JavaScript object.
 */
export const sanitizeAndParseJson = (text: string): any => {
  // Find the first '{' and the last '}' to get the JSON block.
  console.log(`parsing ${text}`);
  const startIndex = text.indexOf("{");
  const endIndex = text.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error(
      "No valid JSON object boundaries found in AI response:",
      text
    );
    throw new Error("No JSON object found in the AI response.");
  }

  const jsonString = text.substring(startIndex, endIndex + 1);

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse extracted JSON string:", jsonString);
    throw new Error(
      "AI returned a malformed JSON object that could not be parsed."
    );
  }
};
