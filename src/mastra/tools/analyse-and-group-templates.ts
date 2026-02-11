import * as cheerio from "cheerio";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { tryGetContentViaGoogleSearch } from "./google-search-fallback.js";
import { getTemplateSignature } from "./template-signature.js";

const DEFAULT_MAX_URLS = 80;

function normalizeUrl(base: string, href: string): string | null {
  try {
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
      return null;
    }
    const u = new URL(href, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin + u.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || u.origin + "/";
  } catch {
    return null;
  }
}

function sameOrigin(baseUrl: string, url: string): boolean {
  try {
    return new URL(baseUrl).origin === new URL(url).origin;
  } catch {
    return false;
  }
}

function normalizeUrlString(u: string): string {
  try {
    const url = new URL(u);
    return url.origin + url.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || url.origin + "/";
  } catch {
    return u;
  }
}

export const analyseSiteAndGroupByTemplatesTool = createTool({
  id: "analyse_site_and_group_by_templates",
  description:
    "Group pages by DOM template signature (step 2). Pass the URLs from discover_site_urls (step 1) so the same list is used without re-crawling.",
  inputSchema: z.object({
    url: z.string().url().describe("Starting URL of the site (used as base when urls not provided)"),
    urls: z
      .array(z.string().url())
      .optional()
      .describe("URLs from discover_site_urls (step 1). When provided, no crawl is done; these URLs are used for template grouping."),
    maxUrls: z.number().int().min(1).max(300).optional().default(DEFAULT_MAX_URLS).describe("Max pages when crawling (ignored if urls is provided)"),
    maxDepth: z.number().int().min(1).max(6).optional().default(4).describe("DOM skeleton depth for template signature"),
  }),
  outputSchema: z.object({
    baseUrl: z.string(),
    totalPages: z.number(),
    templates: z.array(
      z.object({
        templateId: z.string(),
        signaturePreview: z.string(),
        pageCount: z.number(),
        urls: z.array(z.string()),
      })
    ),
    errors: z.array(z.string()).optional(),
  }),
  execute: async ({ url, urls: providedUrls, maxUrls, maxDepth }) => {
    const base = new URL(url);
    const baseOrigin = base.origin;
    const errors: string[] = [];

    let urls: string[];
    if (providedUrls && providedUrls.length > 0) {
      urls = providedUrls
        .filter((u) => {
          try {
            return new URL(u).origin === baseOrigin;
          } catch {
            return false;
          }
        })
        .map((u) => normalizeUrlString(u));
      const seen = new Set(urls);
      urls = Array.from(seen);
    } else {
      const seen = new Set<string>([base.origin + base.pathname.replace(/\/$/, "") || base.origin + "/"]);
      const queue: string[] = [base.href];

      while (queue.length > 0 && seen.size < (maxUrls ?? DEFAULT_MAX_URLS)) {
        const current = queue.shift()!;
        try {
          const res = await fetch(current, {
            headers: { "User-Agent": "eds-site-analyser/1.0" },
            redirect: "follow",
          });
          if (!res.ok) {
            const fallback = await tryGetContentViaGoogleSearch(current);
            const html = fallback && fallback.trim().replace(/^[^<]*/, "").includes("<") ? fallback : null;
            if (html) {
              const $ = cheerio.load(html);
              $("a[href]").each((_, el) => {
                const href = $(el).attr("href");
                if (!href) return;
                const normalized = normalizeUrl(current, href);
                if (normalized && sameOrigin(baseOrigin, normalized) && !seen.has(normalized)) {
                  seen.add(normalized);
                  queue.push(normalized);
                }
              });
            } else {
              errors.push(`${current}: HTTP ${res.status}`);
            }
            continue;
          }
          const html = await res.text();
          const $ = cheerio.load(html);
          $("a[href]").each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;
            const normalized = normalizeUrl(current, href);
            if (normalized && sameOrigin(baseOrigin, normalized) && !seen.has(normalized)) {
              seen.add(normalized);
              queue.push(normalized);
            }
          });
        } catch (e) {
          const fallback = await tryGetContentViaGoogleSearch(current);
          const html = fallback && fallback.trim().replace(/^[^<]*/, "").includes("<") ? fallback : null;
          if (html) {
            const $ = cheerio.load(html);
            $("a[href]").each((_, el) => {
              const href = $(el).attr("href");
              if (!href) return;
              const normalized = normalizeUrl(current, href);
              if (normalized && sameOrigin(baseOrigin, normalized) && !seen.has(normalized)) {
                seen.add(normalized);
                queue.push(normalized);
              }
            });
          } else {
            errors.push(`${current}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      }
      urls = Array.from(seen);
    }
    const signatureToUrls = new Map<string, string[]>();

    for (const pageUrl of urls) {
      let html: string | null = null;
      try {
        const res = await fetch(pageUrl, {
          headers: { "User-Agent": "eds-site-analyser/1.0" },
          redirect: "follow",
        });
        if (res.ok) {
          html = await res.text();
        } else {
          const fallback = await tryGetContentViaGoogleSearch(pageUrl);
          html = fallback && fallback.trim().replace(/^[^<]*/, "").includes("<") ? fallback : null;
          if (!html) errors.push(`${pageUrl}: HTTP ${res.status}`);
        }
      } catch (e) {
        const fallback = await tryGetContentViaGoogleSearch(pageUrl);
        html = fallback && fallback.trim().replace(/^[^<]*/, "").includes("<") ? fallback : null;
        if (!html) errors.push(`${pageUrl}: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (html) {
        const sig = getTemplateSignature(html, maxDepth) || "(empty)";
        const list = signatureToUrls.get(sig) ?? [];
        list.push(pageUrl);
        signatureToUrls.set(sig, list);
      }
    }

    const templates = Array.from(signatureToUrls.entries()).map(([signature, urlsList], i) => ({
      templateId: `template_${i + 1}`,
      signaturePreview: signature.slice(0, 120) + (signature.length > 120 ? "…" : ""),
      signature,
      pageCount: urlsList.length,
      urls: urlsList,
    }));

    return {
      baseUrl: baseOrigin,
      totalPages: urls.length,
      templates: templates.map(({ signature: _s, ...t }) => t),
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
