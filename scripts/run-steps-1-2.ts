#!/usr/bin/env npx tsx
/**
 * Run EDS Site Analysis steps 1 and 2 (discover_site_urls, analyse_site_and_group_by_templates)
 * and write JSON output for use by step 3–5.
 * Usage: npx tsx scripts/run-steps-1-2.ts <url>
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { discoverSiteUrlsTool } from "../src/mastra/tools/crawl-site.js";
import { analyseSiteAndGroupByTemplatesTool } from "../src/mastra/tools/analyse-and-group-templates.js";

const url = process.argv[2] || "https://www.spring-savings.co.uk";

async function main() {
  console.log("Step 1: discover_site_urls...");
  const step1 = await discoverSiteUrlsTool.execute!({
    url,
    maxUrls: 100,
  } as Parameters<typeof discoverSiteUrlsTool.execute>[0]);
  console.log(`  Found ${step1.total} URLs`);

  console.log("Step 2: analyse_site_and_group_by_templates...");
  const step2 = await analyseSiteAndGroupByTemplatesTool.execute!({
    url,
    maxUrls: 80,
    maxDepth: 4,
  } as Parameters<typeof analyseSiteAndGroupByTemplatesTool.execute>[0]);
  console.log(`  Grouped into ${step2.templates.length} templates, ${step2.totalPages} pages`);

  const outDir = join(process.cwd(), "reports", "spring-savings-co-uk");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "step1-step2-output.json");
  writeFileSync(
    outPath,
    JSON.stringify({ step1, step2 }, null, 2),
    "utf8"
  );
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
