/**
 * Headless-browser URL discovery (Firecrawl-style): load each page with a real
 * browser so JS-rendered links are discovered. Uses Playwright.
 */

import { chromium } from "playwright";

const DEFAULT_WAIT_AFTER_LOAD_MS = 3000;
const DEFAULT_NAVIGATION_TIMEOUT_MS = 30000;

function normalizeUrlString(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || u.origin + "/";
  } catch {
    return url;
  }
}

/**
 * Discover same-origin URLs by loading each page in a headless browser and
 * extracting all links from the rendered DOM (including JS-rendered links).
 * Optionally seed with initialUrls (e.g. from sitemap). Returns { urls, errors }.
 */
export async function discoverUrlsWithHeadless(
  startUrl: string,
  limit: number,
  options: {
    waitAfterLoadMs?: number;
    navigationTimeoutMs?: number;
    /** Same-origin URLs to add to the crawl queue (e.g. from sitemap). */
    initialUrls?: string[];
  } = {}
): Promise<{ urls: string[]; errors: string[] }> {
  const origin = new URL(startUrl).origin;
  const waitAfterLoadMs = options.waitAfterLoadMs ?? DEFAULT_WAIT_AFTER_LOAD_MS;
  const navigationTimeoutMs = options.navigationTimeoutMs ?? DEFAULT_NAVIGATION_TIMEOUT_MS;

  const seen = new Set<string>([normalizeUrlString(startUrl)]);
  const queue: string[] = [startUrl];
  if (options.initialUrls?.length) {
    for (const u of options.initialUrls) {
      try {
        if (new URL(u).origin !== origin) continue;
        const norm = normalizeUrlString(u);
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          queue.push(norm);
        }
      } catch {
        // skip invalid
      }
    }
  }
  const errors: string[] = [];

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ignoreHTTPSErrors: true,
    });

    while (queue.length > 0 && seen.size < limit) {
      const current = queue.shift()!;
      const normalizedCurrent = normalizeUrlString(current);
      seen.add(normalizedCurrent);

      let page: Awaited<ReturnType<typeof context.newPage>> | null = null;
      try {
        page = await context.newPage();
        page.setDefaultNavigationTimeout(navigationTimeoutMs);

        await page.goto(current, {
          waitUntil: "domcontentloaded",
          timeout: navigationTimeoutMs,
        });
        await page.waitForTimeout(waitAfterLoadMs);

        const hrefs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
            .map((a) => a.href)
            .filter((href) => href && !href.startsWith("javascript:") && !href.startsWith("mailto:") && !href.startsWith("#"));
        });

        for (const href of hrefs) {
          try {
            const u = new URL(href);
            if (u.protocol !== "http:" && u.protocol !== "https:") continue;
            if (u.origin !== origin) continue;
            const norm = u.origin + u.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || u.origin + "/";
            if (!seen.has(norm)) {
              seen.add(norm);
              queue.push(norm);
            }
          } catch {
            // skip invalid URLs
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${current}: ${msg}`);
      } finally {
        if (page) await page.close().catch(() => {});
      }
    }

    await context.close();
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  const urls = Array.from(seen).slice(0, limit);
  return { urls, errors };
}
