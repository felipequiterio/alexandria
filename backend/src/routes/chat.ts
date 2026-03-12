import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import {
  createConversation,
  createLibraryConversation,
  listConversations,
  listLibraryConversations,
  getConversation,
  deleteConversation,
  sendMessage,
} from "../services/chat.service";

export const chatRouter = new Hono();

// Create conversation for a document
chatRouter.post("/documents/:docId/conversations", async (c) => {
  const docId = c.req.param("docId");
  const body = await c.req.json().catch(() => ({}));
  const conversation = await createConversation(docId, body.title);
  return c.json({ conversation }, 201);
});

// List conversations for a document
chatRouter.get("/documents/:docId/conversations", async (c) => {
  const docId = c.req.param("docId");
  const conversations = await listConversations(docId);
  return c.json({ conversations });
});

// Create library-wide conversation (no document)
chatRouter.post("/conversations", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const conversation = await createLibraryConversation(body.title);
  return c.json({ conversation }, 201);
});

// List library-wide conversations
chatRouter.get("/conversations", async (c) => {
  const conversations = await listLibraryConversations();
  return c.json({ conversations });
});

// Get conversation with messages
chatRouter.get("/conversations/:id", async (c) => {
  const id = c.req.param("id");
  const conversation = await getConversation(id);
  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }
  return c.json({ conversation: conversation, messages: conversation.messages });
});

// Delete conversation
chatRouter.delete("/conversations/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteConversation(id);
  if (!deleted) {
    return c.json({ error: "Conversation not found" }, 404);
  }
  return c.json({ message: "Conversation deleted" });
});

// Send message and stream response with structured events
chatRouter.post("/conversations/:id/messages", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const { content, selectedText, selectionLocation } = body;
  if (!content) {
    return c.json({ error: "Message content is required" }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      const generator = sendMessage({
        conversationId: id,
        content,
        selectedText,
        selectionLocation,
      });

      for await (const event of generator) {
        switch (event.type) {
          case "text_delta":
            await stream.writeSSE({
              event: "delta",
              data: JSON.stringify({ content: event.content }),
            });
            break;
          case "sources":
            await stream.writeSSE({
              event: "sources",
              data: JSON.stringify({ passages: event.passages }),
            });
            break;
          case "tool_call_start":
            await stream.writeSSE({
              event: "tool_start",
              data: JSON.stringify({ toolName: event.toolName, args: event.args }),
            });
            break;
          case "tool_call_end":
            await stream.writeSSE({
              event: "tool_end",
              data: JSON.stringify({ toolName: event.toolName, resultPreview: event.result }),
            });
            break;
          case "status":
            await stream.writeSSE({
              event: "status",
              data: JSON.stringify({ message: event.message }),
            });
            break;
          case "done":
            await stream.writeSSE({
              event: "done",
              data: JSON.stringify({ status: "complete", usage: event.usage }),
            });
            break;
          case "error":
            await stream.writeSSE({
              event: "error",
              data: JSON.stringify({ error: event.message }),
            });
            break;
        }
      }
    } catch (err: any) {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({ error: err.message }),
      });
    }
  });
});
