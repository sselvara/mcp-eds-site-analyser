/**
 * Lazy MCP client for the configured google-search server. Used when a page
 * returns 403 (or fails) so we can try to get content via search (e.g. cached page).
 */

import { MCPClient } from "@mastra/mcp";
import { getGoogleSearchConfig } from "./google-search-config.js";

const SERVER_NAME = "google-search";

let clientInstance: MCPClient | null = null;

function getClient(): MCPClient | null {
  const config = getGoogleSearchConfig();
  if (!config) return null;
  if (clientInstance) return clientInstance;
  try {
    clientInstance = new MCPClient({
      id: "eds-site-analyser-google-search",
      servers: {
        [SERVER_NAME]: {
          command: config.command,
          args: config.args,
          timeout: config.timeoutMs,
        },
      },
      timeout: config.timeoutMs,
    });
    return clientInstance;
  } catch {
    clientInstance = null;
    return null;
  }
}

function extractTextFromToolResult(result: unknown): string | null {
  if (result == null) return null;
  if (typeof result === "string") return result;
  if (Array.isArray(result)) {
    const first = result[0];
    if (typeof first === "object" && first !== null && "text" in first && typeof (first as { text: unknown }).text === "string") {
      return (first as { text: string }).text;
    }
  }
  if (typeof result === "object" && result !== null) {
    const o = result as Record<string, unknown>;
    if (typeof o.content === "string") return o.content;
    if (typeof o.text === "string") return o.text;
    if (Array.isArray(o.content)) {
      const part = o.content.find((p: unknown) => typeof p === "object" && p !== null && "text" in (p as object));
      if (part && typeof (part as { text: unknown }).text === "string") return (part as { text: string }).text;
    }
  }
  return null;
}

/**
 * Try to get content for a URL using the configured google-search MCP server.
 * Returns text content if the search tool returns something usable; otherwise null.
 */
export async function tryGetContentViaGoogleSearch(url: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const config = getGoogleSearchConfig();
  if (!config) return null;

  const namespacedToolName = `${SERVER_NAME}_${config.toolName}`;

  try {
    const tools = await client.listTools();
    const tool = tools[namespacedToolName];
    if (!tool || typeof tool.execute !== "function") return null;

    const args: Record<string, string> = { [config.queryArg]: url };
    const result = await tool.execute(args, undefined as never);
    return extractTextFromToolResult(result);
  } catch {
    return null;
  }
}

/**
 * Whether the google-search fallback is configured (enabled via env).
 */
export function isGoogleSearchFallbackConfigured(): boolean {
  return getGoogleSearchConfig() !== null;
}
