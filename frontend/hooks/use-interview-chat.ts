import { useState, useCallback } from 'react';

export interface ChatMessage {
  text: string;
  isAI: boolean;
  timestamp?: number;
}

export function useInterviewChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      text: "Hi! I'm your AI Interview Coach. Ask me anything about preparing for your next interview, or start a mock session.",
      isAI: true,
      timestamp: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const initializeSession = useCallback(async () => {
    try {
      setError(null);
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
      setError(errorMessage);
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const userMessage: ChatMessage = {
        text: message,
        isAI: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/interview/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            sessionId,
            conversationHistory: messages,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();

        const aiMessage: ChatMessage = {
          text: data.response || data.message || 'I could not process your message. Please try again.',
          isAI: true,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
        setError(errorMessage);

        const errorChatMessage: ChatMessage = {
          text: `Sorry, there was an error: ${errorMessage}`,
          isAI: true,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorChatMessage]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, messages]
  );

  const resetChat = useCallback(() => {
    setMessages([
      {
        text: "Hi! I'm your AI Interview Coach. Ask me anything about preparing for your next interview, or start a mock session.",
        isAI: true,
        timestamp: Date.now(),
      },
    ]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sessionId,
    sendMessage,
    resetChat,
    initializeSession,
  };
}
