import React, { useState, useEffect, useRef } from "react";
import { useChatHistory, type Message } from "../hooks/useChatHistory";
import { v4 as uuidv4 } from "uuid";
import { ChatMessage } from "../components/ChatMessage";
import { Send, PlusCircle, Trash2, Bot } from "lucide-react";

export const ChatPage = () => {
  const {
    chats,
    activeChatId,
    setActiveChatId,
    createNewChat,
    addMessage,
    updateChatTitle,
    deleteChat,
  } = useChatHistory();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // For auto-scroll

  const activeChat = activeChatId ? chats[activeChatId] : null;

  // ✅ FIX 1: AUTO-SCROLLING
  // This effect runs whenever the messages in the active chat change.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    setInput("");

    let currentChatId = activeChatId;
    let isFirstMessageInChat = false;

    if (!currentChatId) {
      currentChatId = createNewChat();
      isFirstMessageInChat = true;
    } else {
      isFirstMessageInChat =
        (chats[currentChatId]?.messages?.length || 0) === 0;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: currentInput,
    };

    addMessage(currentChatId, userMessage);
    setIsLoading(true);

    const historyForAI = [
      ...(chats[currentChatId]?.messages || []),
      userMessage,
    ].map((msg) => ({
      role: msg.role,
      content: msg.role === "user" ? msg.content : msg.response?.message || "",
    }));

    if (isFirstMessageInChat) {
      const title = await window.electronAPI.chatGenerateTitle(currentInput);
      updateChatTitle(currentChatId, title);
    }

    try {
      let aiResponse = await window.electronAPI.chatSendMessage(historyForAI);
      if (typeof aiResponse === "string") {
        try {
          aiResponse = JSON.parse(aiResponse);
        } catch (e) {
          aiResponse = {
            message: "The AI returned a malformed response.",
            context: [],
            summary: "Error",
          };
        }
      }
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "",
        response: aiResponse,
      };
      addMessage(currentChatId, assistantMessage);
    } catch (error) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "",
        response: {
          message: `An error occurred: ${error}`,
          context: [],
          summary: "Error",
        },
      };
      addMessage(currentChatId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedChats = Object.values(chats).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <button
          className="chat-sidebar__new-chat-btn"
          onClick={() => createNewChat()}
        >
          <PlusCircle size={16} />
          New Chat
        </button>
        <ul className="chat-sidebar__list">
          {sortedChats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`chat-sidebar__list-item ${
                chat.id === activeChatId
                  ? "chat-sidebar__list-item--active"
                  : ""
              }`}
            >
              <span className="chat-sidebar__list-item-title">
                {typeof chat.title === "string" ? chat.title : "Untitled Chat"}
              </span>
              <button
                className="chat-sidebar__delete-btn"
                onClick={(e) => handleDeleteChat(e, chat.id)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="chat-main">
        <div className="chat-messages">
          {activeChat?.messages?.length || 0 > 0 ? (
            activeChat?.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          ) : (
            <div className="chat-welcome">
              <h1>SEO Brain</h1>
              <p>Ask me anything about SEO or web development.</p>
            </div>
          )}
          {isLoading && (
            <div className="chat-message chat-message--assistant">
              <div className="chat-message__avatar">
                <Bot size={20} />
              </div>
              <div className="chat-message__content">
                <div className="typing-indicator">
                  <div className="typing-indicator__dot"></div>
                  <div className="typing-indicator__dot"></div>
                  <div className="typing-indicator__dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Vector about SEO or web development..."
            disabled={isLoading}
            className="chat-input-form__input"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="chat-input-form__btn"
          >
            <Send size={18} />
          </button>
        </form>
      </main>
    </div>
  );
};
