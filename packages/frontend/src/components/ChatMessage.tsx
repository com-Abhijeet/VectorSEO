// packages/frontend/src/components/ChatMessage.tsx
import React, { useState } from "react"; // 1. Import useState
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type Message } from "../hooks/useChatHistory";
// 2. Import new icons
import { Bot, User, Copy, Check } from "lucide-react";

export const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__avatar">
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div className="chat-message__content">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              code({ node, className, children, ...props }) {
                // 3. Add state and handler for the copy button
                const [isCopied, setIsCopied] = useState(false);
                const handleCopy = () => {
                  navigator.clipboard.writeText(String(children));
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
                };
                const { ref, ...refProps } = props;

                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  // 4. Wrap SyntaxHighlighter in a div for positioning the button
                  <div className="code-block">
                    <button
                      className="code-block__copy-btn"
                      onClick={handleCopy}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                    <SyntaxHighlighter
                      style={okaidia as any}
                      language={match[1]}
                      PreTag="div"
                      {...refProps}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.response?.message || ""}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};
