import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// The structure of memory file
export interface UserMemory {
  preferences: string[];
}

// Define the path for the user's memory file
const memoryDir = path.join(os.homedir(), ".config", "vectorseo");
const memoryPath = path.join(memoryDir, "memory.json");

const defaultMemory: UserMemory = {
  preferences: [
    "Always provide code examples considering all edge cases and null cases to production grade.",
    "Keep explanations concise and to the point. Be sure to always use proper explainotary terms",
  ],
};

/**
 * Reads the user's memory file from disk.
 * Creates a default one if it doesn't exist.
 */
export const readMemory = (): UserMemory => {
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, JSON.stringify(defaultMemory, null, 2));
    return defaultMemory;
  }
  try {
    const memoryData = JSON.parse(fs.readFileSync(memoryPath, "utf-8"));
    return memoryData;
  } catch (error) {
    console.error("Error reading memory file, returning defaults.", error);
    return defaultMemory; // Fallback on error
  }
};

/**
 * Writes the updated memory object to the disk.
 * @param memory The new memory object to save.
 */
export const writeMemory = (memory: UserMemory): void => {
  try {
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  } catch (error) {
    console.error("Error writing to memory file.", error);
  }
};

/**
 * Adds a new preference to the memory file.
 * @param preference The new preference string to add.
 * @returns The updated memory object.
 */
export const addPreference = (preference: string): UserMemory => {
  const currentMemory = readMemory();
  // Avoid adding duplicates
  if (!currentMemory.preferences.includes(preference)) {
    currentMemory.preferences.push(preference);
    writeMemory(currentMemory);
  }
  return currentMemory;
};

/**
 * Removes a specific preference from the memory file.
 * @param preference The exact preference string to remove.
 * @returns The updated memory object.
 */
export const removePreference = (preference: string): UserMemory => {
  let currentMemory = readMemory();
  currentMemory.preferences = currentMemory.preferences.filter(
    (p) => p !== preference
  );
  writeMemory(currentMemory);
  return currentMemory;
};
