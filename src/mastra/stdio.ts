#!/usr/bin/env node
import { MCPServer } from "@mastra/mcp";
import {
  discoverSiteUrlsTool,
  analyseSiteAndGroupByTemplatesTool,
  listBlocksTool,
  getBlocksMetadataTool,
  edsBlockAnalyserTool,
  selfEvaluationFrameworkTool,
  errorHandlingFrameworkTool,
  requiredArtifactsFrameworkTool,
  securityGuardrailsFrameworkTool,
  getTemplateTool,
} from "./tools/index.js";
import { edsSiteAnalysisPrompts } from "./prompts/eds-site-analysis.js";
import { templateResources } from "./resources/template-resources.js";

const server = new MCPServer({
  id: "eds-site-analyser",
  name: "EDS Site Analyser",
  version: "1.0.0",
  description:
    "Analyse websites (URL discovery, template grouping), EDS block collection, component analysis prompts, documentation frameworks, evaluation framework, and artifact templates exposed as resources for LLM-generated documents.",
  tools: {
    discover_site_urls: discoverSiteUrlsTool,
    analyse_site_and_group_by_templates: analyseSiteAndGroupByTemplatesTool,
    list_blocks: listBlocksTool,
    get_blocks_metadata: getBlocksMetadataTool,
    eds_block_analyser: edsBlockAnalyserTool,
    self_evaluation_framework: selfEvaluationFrameworkTool,
    error_handling_framework: errorHandlingFrameworkTool,
    required_artifacts_framework: requiredArtifactsFrameworkTool,
    security_guardrails_framework: securityGuardrailsFrameworkTool,
    get_template: getTemplateTool,
  },
  prompts: edsSiteAnalysisPrompts,
  resources: templateResources,
});

server.startStdio().catch((error) => {
  console.error("Error running MCP server:", error);
  process.exit(1);
});
