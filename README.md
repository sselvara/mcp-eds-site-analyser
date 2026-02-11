# EDS Site Analyser (MCP Server)

MCP server built with [Mastra](https://mastra.ai) that analyses all URLs of a website from a given URL and groups pages by templates.

## Tools

1. **`discover_site_urls`** – Discover internal URLs of a site starting from a given URL (same-origin crawl, optional limit).
2. **`analyse_site_and_group_by_templates`** – Full workflow: crawl the site, fetch each page, compute a DOM-structure template signature, and group pages by identical template.

## Setup

```bash
cd eds-site-analyser
npm install
npm run build
```

**URL discovery** uses a headless browser (Playwright) so JS-rendered sites (e.g. SPAs) are fully crawled: each page is loaded in Chromium, links are extracted from the DOM after a short wait. Sitemaps are fetched first to seed the crawl. If Playwright fails (e.g. no browser), discovery falls back to sitemap + plain fetch. Install Chromium once if needed: `npx playwright install chromium`.

## Run as MCP server (stdio)

```bash
node dist/stdio.js
```

Or from project root after build:

```bash
npm run dev
```

## Use in Cursor / MCP clients

Add to your MCP config. For 403 or inaccessible pages, add the **google-search** server (see `mcp-config.example.json`):

```json
{
  "mcpServers": {
    "eds-site-analyser": {
      "command": "node",
      "args": ["/path/to/mastra/mcp-servers/eds-site-analyser/dist/stdio.js"]
    },
    "google-search": {
      "command": "npx",
      "args": ["https://github.com/ACSGenUI/mcp-google-search#release"]
    }
  }
}
```

When step 1 or 2 report HTTP 403 or failed URLs, the LLM can use the **google-search** tool to try to get page content for those URLs.

### Google-search configured inside this server (optional)

You can configure the google-search MCP server **inside** eds-site-analyser so that 403s and failed fetches are handled automatically (no separate client config). Set environment variables when starting the server:

| Variable | Description | Default |
|----------|-------------|---------|
| `EDS_GOOGLE_SEARCH_ENABLED` | Set to `1` or `true` to enable | (disabled) |
| `EDS_GOOGLE_SEARCH_COMMAND` | Command to run (e.g. `npx`) | `npx` |
| `EDS_GOOGLE_SEARCH_ARGS` | JSON array of arguments | `["https://github.com/ACSGenUI/mcp-google-search#release"]` |
| `EDS_GOOGLE_SEARCH_TOOL_NAME` | Tool name on the MCP server | `search` |
| `EDS_GOOGLE_SEARCH_QUERY_ARG` | Argument name for the search query | `query` |
| `EDS_GOOGLE_SEARCH_TIMEOUT_MS` | Timeout in ms for the subprocess | `15000` |

Example (in-process google-search for 403 fallback):

```bash
EDS_GOOGLE_SEARCH_ENABLED=1 node dist/stdio.js
```

Or in your MCP client config, pass env when spawning the server, e.g.:

```json
{
  "mcpServers": {
    "eds-site-analyser": {
      "command": "node",
      "args": ["/path/to/eds-site-analyser/dist/stdio.js"],
      "env": {
        "EDS_GOOGLE_SEARCH_ENABLED": "1"
      }
    }
  }
}
```

When enabled, `discover_site_urls` and `analyse_site_and_group_by_templates` will call the configured google-search MCP server for any URL that returns HTTP 403 or fails to fetch; if the search returns HTML-like content, it is used for link discovery and template grouping.

Or with `npx` for eds-site-analyser only (if published):

```json
{
  "mcpServers": {
    "eds-site-analyser": {
      "command": "npx",
      "args": ["-y", "eds-site-analyser"]
    }
  }
}
```

## Template grouping

Templates are derived from a **DOM skeleton** of each page (tag names and key ids/classes, no text). Pages with the same skeleton are grouped into one template. You can tune `maxDepth` (default 4) to make grouping coarser (smaller depth) or finer (larger depth).
