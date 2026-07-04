import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getMarkets } from "@/lib/crypto.functions";

export default defineTool({
  name: "get_top_coins",
  title: "Get top cryptocurrencies",
  description:
    "Return the top cryptocurrencies by market cap with price, 24h change, market cap and volume.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(250)
      .default(20)
      .describe("How many coins to return (1-250)."),
    vs: z.string().default("usd").describe("Fiat currency code, e.g. usd, eur."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ limit, vs }) => {
    const data = await getMarkets({ data: { vs, perPage: limit, page: 1 } });
    const rows = data.map((c) => ({
      rank: c.market_cap_rank,
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      price: c.current_price,
      change_24h_pct: c.price_change_percentage_24h,
      market_cap: c.market_cap,
      volume_24h: c.total_volume,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { coins: rows },
    };
  },
});
