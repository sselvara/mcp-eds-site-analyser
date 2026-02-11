import type { MCPServerResources } from "@mastra/mcp";
import type { Resource } from "@modelcontextprotocol/sdk/types.js";
import { getTemplate, TEMPLATE_MAPPING } from "../tools/eds-frameworks.js";

const RESOURCE_URI_PREFIX = "template://eds-site-analyser/";

const TEMPLATE_RESOURCES: Resource[] = TEMPLATE_MAPPING.map((t) => {
  const uri = RESOURCE_URI_PREFIX + t.name;
  const isCsv = t.file.endsWith(".csv");
  return {
    uri,
    name: t.name,
    description: `Artifact template for EDS site analysis. Fill placeholders with real data from steps 1–4 to produce the final document. Output: ${t.file.replace("-template", "")}.`,
    mimeType: isCsv ? "text/csv" : "text/markdown",
  };
});

function templateNameFromUri(uri: string): string | null {
  if (!uri.startsWith(RESOURCE_URI_PREFIX)) return null;
  const name = uri.slice(RESOURCE_URI_PREFIX.length);
  return TEMPLATE_MAPPING.some((t) => t.name === name) ? name : null;
}

export const templateResources: MCPServerResources = {
  listResources: async () => [...TEMPLATE_RESOURCES],

  getResourceContent: async ({ uri }) => {
    const name = templateNameFromUri(uri);
    if (!name) {
      return { text: `Unknown resource: ${uri}. Available: ${TEMPLATE_MAPPING.map((t) => RESOURCE_URI_PREFIX + t.name).join(", ")}` };
    }
    const content = getTemplate(name);
    return { text: content };
  },
};
