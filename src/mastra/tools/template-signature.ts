import * as cheerio from "cheerio";

/**
 * Build a simplified DOM skeleton (tag names + key ids/classes) for template comparison.
 * We only go a few levels deep to keep signatures stable and comparable.
 */
function buildSkeleton($: cheerio.CheerioAPI, root: cheerio.Cheerio<cheerio.Element>, depth: number, maxDepth: number): string {
  if (depth > maxDepth) return "";
  const parts: string[] = [];
  root.children().each((_, el) => {
    const name = (el as cheerio.Element).tagName?.toLowerCase() ?? "";
    if (!name) return;
    const id = $(el).attr("id");
    const cls = $(el).attr("class");
    const idPart = id ? `#${id.split(/\s+/)[0]}` : "";
    const classPart = cls ? "." + cls.split(/\s+/).slice(0, 3).join(".") : "";
    const key = name + idPart + classPart;
    const child = buildSkeleton($, $(el).children(), depth + 1, maxDepth);
    parts.push(child ? `${key}(${child})` : key);
  });
  return parts.join("+");
}

/**
 * Extract a template signature from HTML: body skeleton (tag tree, no text).
 */
export function getTemplateSignature(html: string, maxDepth: number = 4): string {
  const $ = cheerio.load(html);
  const body = $("body");
  if (!body.length) return "";
  return buildSkeleton($, body, 0, maxDepth);
}
