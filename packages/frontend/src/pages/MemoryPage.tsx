import React, { useState, useEffect } from "react";
import { BookUser, Plus, Trash2 } from "lucide-react";
import { type UserMemory } from "../types";

export const MemoryPage = () => {
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [newPreference, setNewPreference] = useState("");

  useEffect(() => {
    window.electronAPI.getMemory().then(setMemory);
  }, []);

  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreference.trim()) return;
    const updatedMemory = await window.electronAPI.addPreference(newPreference);
    setMemory(updatedMemory);
    setNewPreference(""); // Clear the input field
  };

  const handleRemovePreference = async (preference: string) => {
    const updatedMemory = await window.electronAPI.removePreference(preference);
    setMemory(updatedMemory);
  };

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <BookUser size={28} />
        <h1>AI Personalization Memory</h1>
      </header>

      <div className="settings-card">
        <div className="settings-card__header">
          <h3 className="settings-card__title">Add New Preference</h3>
        </div>
        <form onSubmit={handleAddPreference} className="memory-form">
          <input
            type="text"
            className="form-input"
            value={newPreference}
            onChange={(e) => setNewPreference(e.target.value)}
            placeholder="e.g., Always provide code in TypeScript"
          />
          <button type="submit" className="button button--primary">
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      <div className="settings-card">
        <div className="settings-card__header">
          <h3 className="settings-card__title">Current Preferences</h3>
        </div>
        <div className="settings-card__body settings-card__body--single-col">
          {memory ? (
            <ul className="memory-list">
              {memory.preferences.map((pref, index) => (
                <li key={index} className="memory-list__item">
                  <span>{pref}</span>
                  <button
                    onClick={() => handleRemovePreference(pref)}
                    className="memory-list__delete-btn"
                  >
                    <Trash2 size={14} />
                  </button>
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
