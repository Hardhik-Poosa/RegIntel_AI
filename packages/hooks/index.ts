import { useState, useEffect, useCallback } from 'react';
import { controlsAPI, frameworksAPI, copilotAPI, evidenceAPI } from '@regintel/api';
import { Control, Framework, Evidence, CopilotMessage } from '@regintel/types';

export function useControls() {
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await controlsAPI.getAll();
      setControls(res.data);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load controls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  return { controls, loading, error, refresh: fetchControls };
}

export function useFrameworks() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFrameworks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await frameworksAPI.getAll();
      setFrameworks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  return { frameworks, loading, refresh: fetchFrameworks };
}

export function useCopilot() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      content: 'Hello! I am your RegintelAI Copilot. How can I assist with your compliance framework today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [sending, setSending] = useState<boolean>(false);

  const sendMessage = async (userText: string) => {
    if (!userText.trim()) return;
    const userMsg: CopilotMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await copilotAPI.chat(userText);
      const assistantMsg: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: res.data.response ?? res.data.content ?? 'Response generated.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: 'Sorry, I encountered an error answering your query. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  return { messages, sending, sendMessage };
}
