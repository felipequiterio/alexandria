import { stream } from "@mariozechner/pi-ai";
import { getChatModel } from "./provider";
import { ATLAS_TOOLS, executeToolCall } from "./tools";
import type {
  Context,
  Message as PiMessage,
  AssistantMessage,
  ToolCall,
  ToolResultMessage,
  Tool,
} from "@mariozechner/pi-ai";

const MAX_STEPS = 8;

export type AgentEvent =
  | { type: "text_delta"; content: string }
  | { type: "tool_call_start"; toolName: string; args: Record<string, any> }
  | { type: "tool_call_end"; toolName: string; result: string }
  | { type: "status"; message: string }
  | { type: "done"; fullText: string; usage: { prompt: number; completion: number }; model: string }
  | { type: "error"; message: string };

export interface AgentOptions {
  systemPrompt: string;
  messages: PiMessage[];
  tools?: Tool[];
  maxTokens?: number;
}

export async function* runAgentLoop(options: AgentOptions): AsyncGenerator<AgentEvent> {
  const { systemPrompt, maxTokens = 4096 } = options;
  const tools = options.tools ?? ATLAS_TOOLS;
  const contextMessages: PiMessage[] = [...options.messages];

  let step = 0;
  let fullText = "";
  let totalUsage = { prompt: 0, completion: 0 };
  let modelUsed = "";

  console.log(`[Atlas Agent] Starting ReAct loop with ${tools.length} tools, ${contextMessages.length} messages`);

  while (step < MAX_STEPS) {
    step++;
    console.log(`[Atlas Agent] Step ${step}/${MAX_STEPS}`);

    const context: Context = {
      systemPrompt,
      messages: contextMessages,
      tools,
    };

    const model = getChatModel();
    const eventStream = stream(model, context, { maxTokens });

    let assistantMessage: AssistantMessage | null = null;
    const pendingToolCalls: ToolCall[] = [];
    const eventTypes: string[] = [];

    for await (const event of eventStream) {
      eventTypes.push(event.type);

      switch (event.type) {
        case "text_delta":
          fullText += event.delta;
          yield { type: "text_delta", content: event.delta };
          break;

        case "toolcall_start":
          break;

        case "toolcall_end":
          pendingToolCalls.push(event.toolCall);
          console.log(`[Atlas Agent] Tool call: ${event.toolCall.name}(${JSON.stringify(event.toolCall.arguments).slice(0, 200)})`);
          yield {
            type: "tool_call_start",
            toolName: event.toolCall.name,
            args: event.toolCall.arguments,
          };
          break;

        case "done":
          assistantMessage = event.message;
          modelUsed = event.message.model;
          totalUsage.prompt += event.message.usage.input;
          totalUsage.completion += event.message.usage.output;
          console.log(`[Atlas Agent] Step ${step} done. stopReason: ${event.message.stopReason}, toolCalls: ${pendingToolCalls.length}, textLength: ${fullText.length}`);
          break;

        case "error":
          console.error(`[Atlas Agent] Stream error:`, event.error.errorMessage);
          yield { type: "error", message: event.error.errorMessage || "Stream error" };
          return;
      }
    }

    const uniqueEvents = [...new Set(eventTypes)];
    console.log(`[Atlas Agent] Events received: ${uniqueEvents.join(", ")}`);

    if (!assistantMessage) {
      console.error("[Atlas Agent] No assistant message received");
      yield { type: "error", message: "No response from model" };
      return;
    }

    // If the model stopped normally (no tool use), we're done
    if (assistantMessage.stopReason === "stop" || assistantMessage.stopReason === "length") {
      console.log(`[Atlas Agent] Completed in ${step} step(s). Total usage: ${JSON.stringify(totalUsage)}`);
      yield {
        type: "done",
        fullText,
        usage: totalUsage,
        model: modelUsed,
      };
      return;
    }

    // Handle tool calls
    if (assistantMessage.stopReason === "toolUse" && pendingToolCalls.length > 0) {
      // Add the assistant message to context
      contextMessages.push(assistantMessage);

      yield { type: "status", message: `Using ${pendingToolCalls.length} tool(s)...` };

      // Execute tool calls and add results
      for (const toolCall of pendingToolCalls) {
        console.log(`[Atlas Agent] Executing tool: ${toolCall.name}`);
        const result = await executeToolCall(toolCall.name, toolCall.arguments);
        console.log(`[Atlas Agent] Tool result (${toolCall.name}): ${result.slice(0, 150)}...`);

        yield {
          type: "tool_call_end",
          toolName: toolCall.name,
          result: result.slice(0, 200) + (result.length > 200 ? "..." : ""),
        };

        const toolResult: ToolResultMessage = {
          role: "toolResult",
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          content: [{ type: "text", text: result }],
          isError: false,
          timestamp: Date.now(),
        };
        contextMessages.push(toolResult);
      }

      // Continue the loop — stream again with updated context
      continue;
    }

    // Unexpected stop reason
    console.log(`[Atlas Agent] Unexpected stop reason: ${assistantMessage.stopReason}`);
    yield {
      type: "done",
      fullText,
      usage: totalUsage,
      model: modelUsed,
    };
    return;
  }

  // Max steps exceeded
  console.log(`[Atlas Agent] Max steps (${MAX_STEPS}) exceeded`);
  yield { type: "status", message: "Reached maximum reasoning steps." };
  yield {
    type: "done",
    fullText: fullText || "I've reached the maximum number of reasoning steps. Please try rephrasing your question.",
    usage: totalUsage,
    model: modelUsed,
  };
}
