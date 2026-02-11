import type { MCPServerPrompts } from "@mastra/mcp";
import type { Prompt, PromptMessage } from "@modelcontextprotocol/sdk/types.js";
import { getEdsSiteAnalysisPromptText } from "../tools/eds-frameworks.js";

const PROMPT_NAME = "eds-site-analysis";

const EDS_SITE_ANALYSIS_PROMPT_META: Prompt = {
  name: PROMPT_NAME,
  description: "Run the 5-step EDS site analysis flow. Input: one site URL or JSON array of URLs.",
  arguments: [
    {
      name: "urlOrUrls",
      description:
        "A single site URL (e.g. https://example.com) or a JSON array of URLs (e.g. [\"https://example.com\", \"https://example.com/about\"])",
      required: true,
    },
  ],
};

function buildMessages(urlOrUrls?: string): PromptMessage[] {
  const fullText = getEdsSiteAnalysisPromptText(urlOrUrls);
  return [
    {
      role: "user",
      content: {
        type: "text",
        text: fullText,
      },
    },
  ];
}

export const edsSiteAnalysisPrompts: MCPServerPrompts = {
  listPrompts: async () => [EDS_SITE_ANALYSIS_PROMPT_META],

  getPromptMessages: async ({ name, args }) => {
    if (name !== PROMPT_NAME) {
      throw new Error(`Unknown prompt: ${name}. Available: ${PROMPT_NAME}.`);
    }
    const typedArgs = args as { urlOrUrls?: string } | undefined;
    const urlOrUrls = typedArgs?.urlOrUrls ?? "";
    return buildMessages(urlOrUrls);
  },
};
