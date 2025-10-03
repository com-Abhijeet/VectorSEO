// packages/frontend/src/components/ChatMessage.tsx

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type Message } from "../hooks/useChatHistory";
import { Bot, User, Copy, Check } from "lucide-react";

export const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";
  const [isCopied, setIsCopied] = useState(false);

  // Handler for the new copy button
  const handleCopy = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__avatar">
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div className="chat-message__content">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <>
            {/* 1. Render the main message with Markdown */}
            <ReactMarkdown>{message.response?.message || ""}</ReactMarkdown>

            {/* 2. Check for and render the separate code object */}
            {message.response?.code?.snippet && (
              <div className="code-block">
                <button
                  className="code-block__copy-btn"
                  onClick={() => handleCopy(message.response!.code!.snippet)}
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? "Copied!" : "Copy"}
                </button>
                <SyntaxHighlighter
                  style={okaidia as any}
                  language={message.response.code.language}
                  PreTag="div"
                >
                  {String(message.response.code.snippet).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
