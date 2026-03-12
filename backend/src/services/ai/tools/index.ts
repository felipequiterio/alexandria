import { ATLAS_TOOLS } from "./schemas";
import {
  executeSearchLibrary,
  executeSearchDocument,
  executeFullTextSearch,
  executeReadSection,
  executeReadPages,
  executeGetDocumentInfo,
  executeRecallConversations,
  executeCheckFamiliarity,
} from "./executors";

export { ATLAS_TOOLS } from "./schemas";

const executorMap: Record<string, (args: any) => Promise<string>> = {
  search_library: executeSearchLibrary,
  search_document: executeSearchDocument,
  full_text_search: executeFullTextSearch,
  read_section: executeReadSection,
  read_pages: executeReadPages,
  get_document_info: executeGetDocumentInfo,
  recall_conversations: executeRecallConversations,
  check_familiarity: executeCheckFamiliarity,
};

export async function executeToolCall(name: string, args: Record<string, any>): Promise<string> {
  const executor = executorMap[name];
  if (!executor) {
    return `Unknown tool: ${name}`;
  }
  try {
    return await executor(args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Tool error (${name}): ${msg}`;
  }
}
