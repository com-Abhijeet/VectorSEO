// packages/frontend/src/hooks/useChatHistory.ts

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { type AIResponse } from "../types";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AIResponse;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export const useChatHistory = () => {
  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    const savedChats = localStorage.getItem("vector-seo-chats");
    const lastActiveId = localStorage.getItem("vector-seo-active-chat-id");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (lastActiveId && parsedChats[lastActiveId]) {
        setActiveChatId(lastActiveId);
      }
    }
  }, []);

  const createNewChat = () => {
    const newId = uuidv4();
    const newChat: Chat = {
      id: newId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };

    setChats((prevChats) => {
      const updatedChats = { ...prevChats, [newId]: newChat };
      localStorage.setItem("vector-seo-chats", JSON.stringify(updatedChats));
      return updatedChats;
    });

    setActiveChatId(newId);
    localStorage.setItem("vector-seo-active-chat-id", newId);
    return newId;
  };

  const addMessage = (chatId: string, message: Message) => {
    setChats((prevChats) => {
      const chat = prevChats[chatId];
      if (!chat) return prevChats;

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, message],
      };

      const updatedChats = {
        ...prevChats,
        [chatId]: updatedChat,
      };

      localStorage.setItem("vector-seo-chats", JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  const updateChatTitle = (chatId: string, title: string) => {
    setChats((prevChats) => {
      const chat = prevChats[chatId];
      if (!chat || typeof title !== "string") return prevChats;

      const updatedChat = { ...chat, title: title };
      const updatedChats = { ...prevChats, [chatId]: updatedChat };

      localStorage.setItem("vector-seo-chats", JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  const deleteChat = (chatId: string) => {
    setChats((prevChats) => {
      const updatedChats = { ...prevChats };
      delete updatedChats[chatId];

      if (activeChatId === chatId) {
        const remainingChats = Object.values(updatedChats).sort(
          (a, b) => b.createdAt - a.createdAt
        );
        const newActiveId =
          remainingChats.length > 0 ? remainingChats[0].id : null;
        setActiveChatId(newActiveId);
        localStorage.setItem("vector-seo-active-chat-id", newActiveId || "");
      }

      localStorage.setItem("vector-seo-chats", JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  return {
    chats,
    activeChatId,
    setActiveChatId,
    createNewChat,
    addMessage,
    updateChatTitle,
    deleteChat,
  };
};
