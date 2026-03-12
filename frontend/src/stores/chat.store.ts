import { create } from "zustand";
import type { Message, AgentActivityItem } from "@alexandria/shared";
import {
  createConversation as apiCreateConversation,
  createLibraryConversation as apiCreateLibraryConversation,
  getConversation as apiGetConversation,
  streamChatMessage,
} from "@/lib/api";

export type ChatScope = "passage" | "document" | "library";

interface ChatState {
  isOpen: boolean;
  conversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  selectedText: string | null;
  selectionLocation: { page: number; start: number; end: number } | null;
  scope: ChatScope;
  agentActivity: AgentActivityItem[];

  toggle: () => void;
  open: () => void;
  close: () => void;
  setSelection: (text: string | null, location?: { page: number; start: number; end: number } | null) => void;
  setScope: (scope: ChatScope) => void;
  createConversation: (documentId: string) => Promise<void>;
  createLibraryConversation: () => Promise<void>;
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
  scope: "document",
  agentActivity: [],

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  setSelection: (text, location) =>
    set({ selectedText: text, selectionLocation: location ?? null }),

  setScope: (scope) => set({ scope }),

  createConversation: async (documentId: string) => {
    const conv = await apiCreateConversation(documentId);
    set({ conversationId: conv.id, messages: [], scope: "document" });
  },

  createLibraryConversation: async () => {
    const conv = await apiCreateLibraryConversation();
    set({ conversationId: conv.id, messages: [], scope: "library" });
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
      agentActivity: [],
    }));

    try {
      const stream = streamChatMessage(conversationId, content, {
        selectedText: selectedText || undefined,
        selectionLocation: selectionLocation || undefined,
      });

      let fullContent = "";
      for await (const event of stream) {
        switch (event.type) {
          case "delta":
            fullContent += event.content;
            set({ streamingContent: fullContent });
            break;
          case "tool_start":
            set((s) => ({
              agentActivity: [
                ...s.agentActivity,
                { toolName: event.toolName, args: event.args, status: "running" as const },
              ],
            }));
            break;
          case "tool_end":
            set((s) => ({
              agentActivity: s.agentActivity.map((a) =>
                a.toolName === event.toolName && a.status === "running"
                  ? { ...a, resultPreview: event.resultPreview, status: "completed" as const }
                  : a
              ),
            }));
            break;
          case "error":
            fullContent += `\n\n[Error: ${event.error}]`;
            set({ streamingContent: fullContent });
            break;
          // done and status events don't need UI updates beyond what we already have
        }
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
      agentActivity: [],
    }),
}));
