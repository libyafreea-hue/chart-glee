import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getMarkets } from "@/lib/crypto.functions";

export default defineTool({
  name: "get_coin",
  title: "Get coin details",
  description:
    "Look up current price and stats for one or more coins by CoinGecko id (e.g. 'bitcoin', 'ethereum').",
  inputSchema: {
    ids: z
      .array(z.string().min(1))
      .min(1)
      .max(50)
      .describe("CoinGecko coin ids, e.g. ['bitcoin','solana']."),
    vs: z.string().default("usd").describe("Fiat currency code."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ ids, vs }) => {
    const data = await getMarkets({
      data: { vs, perPage: ids.length, page: 1, ids: ids.join(",") },
    });
    const rows = data.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      price: c.current_price,
      change_1h_pct: c.price_change_percentage_1h_in_currency,
      change_24h_pct: c.price_change_percentage_24h,
      change_7d_pct: c.price_change_percentage_7d_in_currency,
      market_cap: c.market_cap,
      market_cap_rank: c.market_cap_rank,
      volume_24h: c.total_volume,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { coins: rows },
    };
  },
});
