/**
 * Optional configuration for the google-search MCP server used when this server
 * encounters HTTP 403 (or other failures) and should try to get content via search.
 *
 * Configure via environment variables:
 * - EDS_GOOGLE_SEARCH_ENABLED — set to "1" or "true" to enable
 * - EDS_GOOGLE_SEARCH_COMMAND — command to run (default: npx)
 * - EDS_GOOGLE_SEARCH_ARGS — JSON array of args (default: ["https://github.com/ACSGenUI/mcp-google-search#release"])
 * - EDS_GOOGLE_SEARCH_TOOL_NAME — tool name on the MCP server (default: search); namespaced name will be "google-search_<value>"
 * - EDS_GOOGLE_SEARCH_QUERY_ARG — argument name for the search query (default: query)
 * - EDS_GOOGLE_SEARCH_TIMEOUT_MS — timeout in ms for the subprocess (default: 15000)
 */

export interface GoogleSearchServerConfig {
  command: string;
  args: string[];
  toolName: string;
  queryArg: string;
  timeoutMs: number;
}

const DEFAULT_ARGS = ["https://github.com/ACSGenUI/mcp-google-search#release"];

function parseEnabled(raw: string | undefined): boolean {
  if (raw === undefined || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function parseJsonArray(raw: string | undefined): string[] {
  if (raw === undefined || raw === "") return DEFAULT_ARGS;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : DEFAULT_ARGS;
  } catch {
    return DEFAULT_ARGS;
  }
}

export function getGoogleSearchConfig(): GoogleSearchServerConfig | null {
  const enabled = parseEnabled(process.env.EDS_GOOGLE_SEARCH_ENABLED);
  if (!enabled) return null;

  const command = process.env.EDS_GOOGLE_SEARCH_COMMAND?.trim() || "npx";
  const args = parseJsonArray(process.env.EDS_GOOGLE_SEARCH_ARGS);
  const toolName = process.env.EDS_GOOGLE_SEARCH_TOOL_NAME?.trim() || "search";
  const queryArg = process.env.EDS_GOOGLE_SEARCH_QUERY_ARG?.trim() || "query";
  const timeoutMs = Math.max(5000, parseInt(process.env.EDS_GOOGLE_SEARCH_TIMEOUT_MS || "15000", 10) || 15000);

  return { command, args, toolName, queryArg, timeoutMs };
}
