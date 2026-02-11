import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const BC_DOMAIN = "https://main--aem-block-collection--adobe.aem.live";

/** Embedded blocks metadata (avoids external fetch / STDIO issues). */
export const BLOCKS_METADATA = [
  {
    name: "Accordion",
    description:
      "Implements an accordion UI pattern, allowing users to expand and collapse sections of content, styled with borders, padding, and transitions for visual feedback.",
    js_file: `${BC_DOMAIN}/blocks/accordion/accordion.js`,
    css_file: `${BC_DOMAIN}/blocks/accordion/accordion.css`,
  },
  {
    name: "Cards",
    description:
      "Displays content in a card-like format with images and text, using a grid layout for responsiveness and basic styling for borders and spacing.",
    js_file: `${BC_DOMAIN}/blocks/cards/cards.js`,
    css_file: `${BC_DOMAIN}/blocks/cards/cards.css`,
  },
  {
    name: "Carousel",
    description:
      "Creates a carousel or slider to showcase content, featuring navigation buttons, slide indicators, and CSS for basic layout and appearance.",
    js_file: `${BC_DOMAIN}/blocks/carousel/carousel.js`,
    css_file: `${BC_DOMAIN}/blocks/carousel/carousel.css`,
  },
  {
    name: "Columns",
    description:
      "Arranges content into columns, adapting to different screen sizes with CSS flexbox for layout control.",
    js_file: `${BC_DOMAIN}/blocks/columns/columns.js`,
    css_file: `${BC_DOMAIN}/blocks/columns/columns.css`,
  },
  {
    name: "Embed",
    description:
      "Embeds external content (videos, social posts) into a page, using placeholders and lazy loading for performance.",
    js_file: `${BC_DOMAIN}/blocks/embed/embed.js`,
    css_file: `${BC_DOMAIN}/blocks/embed/embed.css`,
  },
  {
    name: "Footer",
    description:
      "Loads and displays footer content, fetching it as a fragment and applying basic styling for background color and font size.",
    js_file: `${BC_DOMAIN}/blocks/footer/footer.js`,
    css_file: `${BC_DOMAIN}/blocks/footer/footer.css`,
  },
  {
    name: "Form",
    description:
      "Generates forms from JSON definitions, handling submissions and confirmations, with CSS for structuring fields and basic input styling.",
    js_file: `${BC_DOMAIN}/blocks/form/form.js`,
    css_file: `${BC_DOMAIN}/blocks/form/form.css`,
    helper_file: `${BC_DOMAIN}/blocks/form/form-fields.js`,
  },
  {
    name: "Fragment",
    description: "Includes content from another page fragment into the current page.",
    js_file: `${BC_DOMAIN}/blocks/fragment/fragment.js`,
    css_file: `${BC_DOMAIN}/blocks/fragment/fragment.css`,
  },
  {
    name: "Header",
    description:
      "Loads and displays header content, fetching it as a fragment and applying CSS for layout and navigation.",
    js_file: `${BC_DOMAIN}/blocks/header/header.js`,
    css_file: `${BC_DOMAIN}/blocks/header/header.css`,
  },
  {
    name: "Hero",
    description:
      "Presents a hero section with a large image and heading, using CSS for positioning and basic styling.",
    js_file: `${BC_DOMAIN}/blocks/hero/hero.js`,
    css_file: `${BC_DOMAIN}/blocks/hero/hero.css`,
  },
  {
    name: "Modal",
    description:
      "Creates modal dialogs that can be opened via links, styled with CSS for appearance and positioning.",
    js_file: `${BC_DOMAIN}/blocks/modal/modal.js`,
    css_file: `${BC_DOMAIN}/blocks/modal/modal.css`,
  },
  {
    name: "Quote",
    description:
      "Displays a quote with an optional attribution, styled with CSS for quotation marks and alignment.",
    js_file: `${BC_DOMAIN}/blocks/quote/quote.js`,
    css_file: `${BC_DOMAIN}/blocks/quote/quote.css`,
  },
  {
    name: "Search",
    description:
      "Implements a search feature with a search box and results display, using CSS for layout and highlighting search terms.",
    js_file: `${BC_DOMAIN}/blocks/search/search.js`,
    css_file: `${BC_DOMAIN}/blocks/search/search.css`,
  },
  {
    name: "Table",
    description:
      "Renders data in a tabular format, providing options for header display, striping, and borders via CSS classes.",
    js_file: `${BC_DOMAIN}/blocks/table/table.js`,
    css_file: `${BC_DOMAIN}/blocks/table/table.css`,
  },
  {
    name: "Tabs",
    description:
      "Creates a tabbed interface for organizing content into panels, using CSS for layout and basic styling of tabs and panels.",
    js_file: `${BC_DOMAIN}/blocks/tabs/tabs.js`,
    css_file: `${BC_DOMAIN}/blocks/tabs/tabs.css`,
  },
  {
    name: "Video",
    description:
      "Embeds videos from various sources (YouTube, Vimeo, local files), using placeholders and lazy loading for performance, with CSS for basic layout and styling.",
    js_file: `${BC_DOMAIN}/blocks/video/video.js`,
    css_file: `${BC_DOMAIN}/blocks/video/video.css`,
  },
];

const blockOutputSchema = z.object({
  name: z.string(),
  description: z.string(),
  jsFile: z.string(),
  cssFile: z.string(),
  helperFile: z.string().nullable(),
  hasCSS: z.boolean(),
  hasJS: z.boolean(),
  hasHelper: z.boolean(),
  fileCount: z.number(),
});

/** List all AEM blocks with metadata from the block collection. */
export const listBlocksTool = createTool({
  id: "list_blocks",
  description: "List EDS block collection (name, description, JS/CSS/helper URLs). Used in step 4 to map components.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    blocks: z.array(blockOutputSchema),
    total: z.number(),
    mode: z.string(),
    message: z.string(),
    source: z.string(),
    domain: z.string().optional(),
  }),
  execute: async () => {
    const blocks = BLOCKS_METADATA.map((block) => ({
      name: block.name,
      description: block.description,
      jsFile: block.js_file,
      cssFile: block.css_file,
      helperFile: (block as { helper_file?: string }).helper_file ?? null,
      hasCSS: !!block.css_file,
      hasJS: !!block.js_file,
      hasHelper: !!((block as { helper_file?: string }).helper_file),
      fileCount: [
        block.js_file,
        block.css_file,
        (block as { helper_file?: string }).helper_file,
      ].filter(Boolean).length,
    }));

    return {
      blocks,
      total: blocks.length,
      mode: "metadata-only",
      message: "Using embedded blocks metadata for analysis",
      source: "embedded-data",
      domain: BC_DOMAIN,
    };
  },
});

/** Return raw blocks metadata as JSON (for prompts / downstream use). */
export const getBlocksMetadataTool = createTool({
  id: "get_blocks_metadata",
  description: "Same as list_blocks but returns raw metadata (js_file, css_file, helper_file) as JSON.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    metadata: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        js_file: z.string(),
        css_file: z.string(),
        helper_file: z.string().optional(),
      })
    ),
    total: z.number(),
    domain: z.string(),
  }),
  execute: async () => {
    const metadata = BLOCKS_METADATA.map((block) => ({
      name: block.name,
      description: block.description,
      js_file: block.js_file,
      css_file: block.css_file,
      ...((block as { helper_file?: string }).helper_file && {
        helper_file: (block as { helper_file?: string }).helper_file,
      }),
    }));

    return {
      metadata,
      total: metadata.length,
      domain: BC_DOMAIN,
    };
  },
});
