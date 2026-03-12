import { create } from "zustand";
import type { Message } from "@alexandria/shared";
import {
  createConversation as apiCreateConversation,
  getConversation as apiGetConversation,
  streamChatMessage,
} from "@/lib/api";

interface ChatState {
  isOpen: boolean;
  conversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  selectedText: string | null;
  selectionLocation: { page: number; start: number; end: number } | null;

  toggle: () => void;
  open: () => void;
  close: () => void;
  setSelection: (text: string | null, location?: { page: number; start: number; end: number } | null) => void;
  createConversation: (documentId: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  conversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  selectedText: null,
  selectionLocation: null,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  setSelection: (text, location) =>
    set({ selectedText: text, selectionLocation: location ?? null }),

  createConversation: async (documentId: string) => {
    const conv = await apiCreateConversation(documentId);
    set({ conversationId: conv.id, messages: [] });
  },

  loadConversation: async (conversationId: string) => {
    const res = await apiGetConversation(conversationId);
    set({ conversationId, messages: res.messages });
  },

  sendMessage: async (content: string) => {
    const { conversationId, selectedText, selectionLocation } = get();
    if (!conversationId) return;

    // Add optimistic user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: "user",
      content,
      selectedText: selectedText || null,
      selectionLocation: selectionLocation || null,
      contextChunkIds: [],
      modelUsed: null,
      tokenUsage: null,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isStreaming: true,
      streamingContent: "",
      selectedText: null,
      selectionLocation: null,
    }));

    try {
      const stream = streamChatMessage(conversationId, content, {
        selectedText: selectedText || undefined,
        selectionLocation: selectionLocation || undefined,
      });

      let fullContent = "";
      for await (const delta of stream) {
        fullContent += delta;
        set({ streamingContent: fullContent });
      }

      // Add the complete assistant message
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: "assistant",
        content: fullContent,
        selectedText: null,
        selectionLocation: null,
        contextChunkIds: [],
        modelUsed: null,
        tokenUsage: null,
        createdAt: new Date().toISOString(),
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isStreaming: false,
        streamingContent: "",
      }));
    } catch (err) {
      console.error("Chat error:", err);
      set({ isStreaming: false, streamingContent: "" });
    }
  },

  reset: () =>
    set({
      conversationId: null,
      messages: [],
      isStreaming: false,
      streamingContent: "",
      selectedText: null,
      selectionLocation: null,
    }),
}));
