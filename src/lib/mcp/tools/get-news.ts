import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getNews } from "@/lib/news.functions";

export default defineTool({
  name: "get_crypto_news",
  title: "Get crypto news",
  description:
    "Fetch the latest crypto news headlines aggregated from CoinDesk, Cointelegraph, Decrypt, and Bitcoin Magazine.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(60)
      .default(15)
      .describe("Max number of headlines to return."),
    query: z
      .string()
      .optional()
      .describe("Optional case-insensitive substring to filter titles/descriptions."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ limit, query }) => {
    const all = await getNews();
    const q = query?.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (n) =>
            n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q),
        )
      : all;
    const items = filtered.slice(0, limit).map((n) => ({
      title: n.title,
      source: n.source,
      link: n.link,
      published_at: new Date(n.pubDate).toISOString(),
      description: n.description,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items },
    };
  },
});
