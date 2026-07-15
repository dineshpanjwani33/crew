import { create } from 'zustand';

import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isAwaitingResponse: boolean;
  addUserMessage: (content: string) => void;
  startAssistantMessage: () => string;
  appendToMessage: (id: string, token: string) => void;
  completeMessage: (id: string) => void;
  setAwaitingResponse: (value: boolean) => void;
}

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isAwaitingResponse: false,

  addUserMessage: (content) => {
    const message: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content,
      status: 'complete',
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  startAssistantMessage: () => {
    const message: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      status: 'streaming',
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));

    return message.id;
  },

  appendToMessage: (id, token) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id
          ? { ...message, content: message.content + token }
          : message,
      ),
    }));
  },

  completeMessage: (id) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, status: 'complete' } : message,
      ),
    }));
  },

  setAwaitingResponse: (value) => {
    set({ isAwaitingResponse: value });
  },
}));
