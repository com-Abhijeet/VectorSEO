// packages/frontend/src/pages/MemoryPage.tsx

import React, { useState, useEffect } from "react";
import { BookUser } from "lucide-react";
import { type UserMemory } from "../types"; // Assuming your types are in src/types.ts

export const MemoryPage = () => {
  const [memory, setMemory] = useState<UserMemory | null>(null);

  useEffect(() => {
    window.electronAPI.getMemory().then(setMemory);
  }, []);

  return (
    <div className="settings-page">
      {" "}
      {/* Reusing settings page styles for consistency */}
      <header className="settings-page__header">
        <BookUser size={28} />
        <h1>AI Personalization Memory</h1>
      </header>
      <div className="settings-card">
        <div className="settings-card__header">
          <h3 className="settings-card__title">Current Preferences</h3>
        </div>
        <div className="settings-card__body settings-card__body--single-col">
          {memory ? (
            <ul className="memory-list">
              {memory.preferences.map((pref, index) => (
                <li key={index} className="memory-list__item">
                  {pref}
                </li>
              ))}
            </ul>
          ) : (
            <p>Loading memory...</p>
          )}
        </div>
      </div>
    </div>
  );
};
