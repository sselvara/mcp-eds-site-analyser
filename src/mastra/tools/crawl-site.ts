import * as cheerio from "cheerio";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { discoverUrlsWithHeadless } from "./headless-discover.js";
import { tryGetContentViaGoogleSearch } from "./google-search-fallback.js";

const DEFAULT_MAX_URLS = 500;
const FETCH_TIMEOUT_MS = 20000;

/** File extensions to skip when discovering links (crawl only HTML pages, not assets/documents). */
const IGNORED_EXTENSIONS = [
  "css",
  "js",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "eps",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
  "gz",
  "tgz",
  "tar",
  "bz2",
  "dmg",
  "exe",
  "iso",
  "mp4",
  "xml",
];

/** Common path suffixes to try when we have no sitemap and only the start URL. */
const FALLBACK_SEED_PATHS = [
  "/about",
  "/about-us",
  "/contact",
  "/contact-us",
  "/our-business",
  "/investors",
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap-index.xml",
];

/** Browser-like headers to reduce 403 and get HTML instead of JSON from some hosts. */
const FETCH_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

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

/** Normalize a full URL to origin + pathname (no trailing slash, no hash/query). */
function normalizeUrlString(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || u.origin + "/";
  } catch {
    return url;
  }
}

/** True if pathname has an extension in IGNORED_EXTENSIONS (e.g. .pdf, .css). */
function hasIgnoredExtension(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  const ext = segment.includes(".") ? segment.split(".").pop()?.toLowerCase() : undefined;
  return ext ? IGNORED_EXTENSIONS.includes(ext) : false;
}

/** True if pathname matches filter: empty filter => true; otherwise prefix match or RegExp. */
function pathnameMatchesFilter(pathname: string, filter: string | undefined): boolean {
  if (!filter || filter.length === 0) return true;
  if (pathname.startsWith(filter)) return true;
  try {
    return new RegExp(filter).test(pathname);
  } catch {
    return false;
  }
}

/** Fetch with timeout. */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = FETCH_TIMEOUT_MS, ...init } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/** Fetch sitemap(s) from origin and return same-origin URLs (normalized). Handles sitemap index and urlset. */
async function discoverUrlsFromSitemaps(
  origin: string,
  limit: number,
  sitemapUrlsFromRobots: string[] = []
): Promise<string[]> {
  const out = new Set<string>();
  const tried = new Set<string>();
  const sitemapQueue: string[] = [...sitemapUrlsFromRobots.filter((u) => u.startsWith("http"))];
  sitemapQueue.push(
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`
  );

  while (sitemapQueue.length > 0 && out.size < limit) {
    const sitemapUrl = sitemapQueue.shift()!;
    if (tried.has(sitemapUrl)) continue;
    tried.add(sitemapUrl);
    let text: string;
    try {
      const res = await fetchWithTimeout(sitemapUrl, {
        headers: FETCH_HEADERS,
        redirect: "follow",
        timeoutMs: FETCH_TIMEOUT_MS,
      });
      if (!res.ok) continue;
      text = await res.text();
    } catch {
      continue;
    }
    const $ = cheerio.load(text, { xmlMode: true });
    const locs: string[] = [];
    $("url loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) locs.push(loc);
    });
    $("sitemap loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc && !tried.has(loc)) sitemapQueue.push(loc);
    });
    for (const loc of locs) {
      try {
        const u = new URL(loc);
        if (u.origin !== origin) continue;
        const norm = normalizeUrlString(loc);
        if (norm) out.add(norm);
      } catch {
        // skip invalid URLs
      }
    }
  }

  return Array.from(out);
}

/** Try robots.txt for all Sitemap: lines and return same-origin sitemap URLs. */
async function getSitemapUrlsFromRobots(origin: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      timeoutMs: FETCH_TIMEOUT_MS,
    });
    if (!res.ok) return out;
    const text = await res.text();
    const re = /Sitemap:\s*(https?:\/\/[^\s#]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const url = match[1].trim();
      try {
        if (new URL(url).origin === origin) out.push(url);
      } catch {
        // skip invalid
      }
    }
  } catch {
    // ignore
  }
  return out;
}

export const discoverSiteUrlsTool = createTool({
  id: "discover_site_urls",
  description: "Discover same-origin URLs starting from a given URL (step 1 of site analysis).",
  inputSchema: z.object({
    url: z.string().url().describe("Starting URL of the site"),
    maxUrls: z.number().int().min(1).max(500).optional().default(DEFAULT_MAX_URLS).describe("Max URLs to collect"),
    pathnameFilter: z
      .string()
      .optional()
      .describe("Only follow links whose pathname matches: prefix string or RegExp (e.g. '/' or '^/en/')"),
  }),
  outputSchema: z.object({
    urls: z.array(z.string()),
    baseUrl: z.string(),
    total: z.number(),
    errors: z.array(z.string()).optional(),
  }),
  execute: async ({ url, maxUrls, pathnameFilter }) => {
    const base = new URL(url);
    const baseOrigin = base.origin;
    const limit = maxUrls ?? DEFAULT_MAX_URLS;

    const sitemapFromRobots = await getSitemapUrlsFromRobots(baseOrigin);
    const sitemapUrls = await discoverUrlsFromSitemaps(baseOrigin, limit, sitemapFromRobots);

    let headlessUrls: string[] = [];
    let headlessErrors: string[] = [];

    try {
      const result = await discoverUrlsWithHeadless(url, limit, {
        initialUrls: sitemapUrls.length > 0 ? sitemapUrls : undefined,
      });
      headlessUrls = result.urls;
      headlessErrors = result.errors;
      // Filter headless URLs by extension and pathname (same rules as fetch-based crawl).
      const filteredHeadless = headlessUrls.filter((n) => {
        try {
          const pathname = new URL(n).pathname;
          return !hasIgnoredExtension(pathname) && pathnameMatchesFilter(pathname, pathnameFilter);
        } catch {
          return false;
        }
      });
      if (filteredHeadless.length > 1) {
        return {
          urls: filteredHeadless,
          baseUrl: baseOrigin,
          total: filteredHeadless.length,
          errors: headlessErrors.length > 0 ? headlessErrors : undefined,
        };
      }
    } catch {
      // Headless failed (e.g. no browser); will use fetch-based discovery below.
    }

    // Fetch-based discovery: when headless isn't used, under-delivered (≤1 URL), or threw.
    const normalizedStart = normalizeUrlString(base.href);
    /** URLs to include in the result: only those we successfully fetched (2xx or fallback HTML). */
    const resultUrls = new Set<string>();
    /** URLs we've already attempted (so we don't re-queue). */
    const tried = new Set<string>();
    /** URLs currently in queue (so we don't push duplicates). */
    const inQueue = new Set<string>();
    const queue: string[] = [normalizedStart];
    inQueue.add(normalizedStart);
    const errors: string[] = [...headlessErrors];

    function maybeQueue(n: string): void {
      if (!n || !sameOrigin(baseOrigin, n) || tried.has(n) || resultUrls.has(n) || inQueue.has(n)) return;
      try {
        const pathname = new URL(n).pathname;
        if (hasIgnoredExtension(pathname)) return;
        if (!pathnameMatchesFilter(pathname, pathnameFilter)) return;
      } catch {
        return;
      }
      inQueue.add(n);
      queue.push(n);
    }

    for (const u of headlessUrls) {
      const n = normalizeUrlString(u);
      if (n && sameOrigin(baseOrigin, n) && !inQueue.has(n) && !tried.has(n)) {
        try {
          const pathname = new URL(n).pathname;
          if (!hasIgnoredExtension(pathname) && pathnameMatchesFilter(pathname, pathnameFilter)) {
            inQueue.add(n);
            queue.push(n);
          }
        } catch {
          // skip invalid
        }
      }
    }
    for (const u of sitemapUrls) {
      const n = normalizeUrlString(u);
      if (n && !inQueue.has(n) && !tried.has(n)) {
        try {
          const pathname = new URL(n).pathname;
          if (!hasIgnoredExtension(pathname) && pathnameMatchesFilter(pathname, pathnameFilter)) {
            inQueue.add(n);
            queue.push(n);
          }
        } catch {
          // skip invalid
        }
      }
    }

    // When we still have only one URL to try, seed with common paths (e.g. if homepage times out).
    if (queue.length <= 1) {
      for (const path of FALLBACK_SEED_PATHS) {
        const n = normalizeUrlString(baseOrigin + (path.startsWith("/") ? path : "/" + path));
        if (n && !inQueue.has(n)) {
          try {
            const pathname = new URL(n).pathname;
            if (!hasIgnoredExtension(pathname) && pathnameMatchesFilter(pathname, pathnameFilter)) {
              inQueue.add(n);
              queue.push(n);
            }
          } catch {
            // skip
          }
        }
      }
    }

    while (queue.length > 0 && resultUrls.size < limit) {
      const current = queue.shift()!;
      const norm = normalizeUrlString(current);
      tried.add(norm);
      inQueue.delete(norm);

      try {
        const res = await fetchWithTimeout(current, {
          headers: FETCH_HEADERS,
          redirect: "follow",
          timeoutMs: FETCH_TIMEOUT_MS,
        });
        const resolvedUrl = typeof res.url === "string" && res.url ? res.url : current;
        const pageBase = resolvedUrl;
        if (!res.ok) {
          const fallback = await tryGetContentViaGoogleSearch(current);
          const html = fallback && fallback.trim().replace(/^[^<]*/, "").includes("<") ? fallback : null;
          if (html) {
            resultUrls.add(norm);
            const $ = cheerio.load(html);
            $("a[href]").each((_, el) => {
              const href = $(el).attr("href");
              if (!href) return;
              const normalized = normalizeUrl(pageBase, href);
              if (normalized) maybeQueue(normalized);
            });
          } else {
            errors.push(`${current}: HTTP ${res.status}`);
          }
          continue;
        }
        resultUrls.add(norm);
        const html = await res.text();
        const $ = cheerio.load(html);
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          const normalized = normalizeUrl(pageBase, href);
          if (normalized) maybeQueue(normalized);
        });
      } catch (e) {
        const fallback = await tryGetContentViaGoogleSearch(current);
        const html = fallback && fallback.trim().replace(/^[^<]*/, "").includes("<") ? fallback : null;
        if (html) {
          resultUrls.add(norm);
          const $ = cheerio.load(html);
          $("a[href]").each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;
            const normalized = normalizeUrl(current, href);
            if (normalized) maybeQueue(normalized);
          });
        } else {
          errors.push(`${current}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    const urls = resultUrls.size > 0 ? Array.from(resultUrls) : [normalizedStart];
    return { urls, baseUrl: baseOrigin, total: urls.length, errors: errors.length > 0 ? errors : undefined };
  },
});
