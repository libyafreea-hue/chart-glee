// Client-side fetchers. We intentionally do NOT use createServerFn here:
// CoinGecko rate-limits the shared Cloudflare Worker IP pool aggressively (429),
// while browser IPs work fine. Keeping the call signature `fn({ data })` so
// existing callers and react-query keys remain unchanged.

const CG = "https://api.coingecko.com/api/v3";

async function cg<T>(path: string): Promise<T> {
  const res = await fetch(`${CG}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${path}`);
  return (await res.json()) as T;
}

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
};

type MarketsInput = { vs?: string; perPage?: number; page?: number; ids?: string };

export async function getMarkets(opts?: { data?: MarketsInput }) {
  const d = opts?.data ?? {};
  const params = new URLSearchParams({
    vs_currency: d.vs ?? "usd",
    order: "market_cap_desc",
    per_page: String(d.perPage ?? 100),
    page: String(d.page ?? 1),
    sparkline: "true",
    price_change_percentage: "1h,24h,7d",
  });
  if (d.ids) params.set("ids", d.ids);
  return cg<MarketCoin[]>(`/coins/markets?${params.toString()}`);
}

export async function getGlobal() {
  const data = await cg<{
    data: {
      total_market_cap: { usd: number };
      total_volume: { usd: number };
      market_cap_percentage: Record<string, number>;
      market_cap_change_percentage_24h_usd: number;
      active_cryptocurrencies: number;
    };
  }>(`/global`);
  return data.data;
}

export async function getFearGreed() {
  const res = await fetch("https://api.alternative.me/fng/?limit=30");
  if (!res.ok) throw new Error("F&G fetch failed");
  const json = (await res.json()) as {
    data: { value: string; value_classification: string; timestamp: string }[];
  };
  return json.data.map((d) => ({
    value: Number(d.value),
    classification: d.value_classification,
    timestamp: Number(d.timestamp) * 1000,
  }));
}

export async function getCoin(opts: { data: { id: string } }) {
  const c = await cg<{
    id: string;
    symbol: string;
    name: string;
    image: { large: string };
    market_cap_rank: number;
    market_data: {
      current_price: { usd: number };
      market_cap: { usd: number };
      total_volume: { usd: number };
      high_24h: { usd: number };
      low_24h: { usd: number };
      ath: { usd: number };
      atl: { usd: number };
      price_change_percentage_1h_in_currency: { usd: number };
      price_change_percentage_24h: number;
      price_change_percentage_7d: number;
      price_change_percentage_30d: number;
      circulating_supply: number;
      total_supply: number | null;
      max_supply: number | null;
    };
    description: { en: string };
    links: { homepage: string[]; twitter_screen_name: string | null };
  }>(
    `/coins/${encodeURIComponent(opts.data.id)}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
  );
  return {
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    image: c.image.large,
    rank: c.market_cap_rank,
    price: c.market_data.current_price.usd,
    marketCap: c.market_data.market_cap.usd,
    volume: c.market_data.total_volume.usd,
    high24: c.market_data.high_24h.usd,
    low24: c.market_data.low_24h.usd,
    ath: c.market_data.ath.usd,
    atl: c.market_data.atl.usd,
    change1h: c.market_data.price_change_percentage_1h_in_currency?.usd ?? 0,
    change24h: c.market_data.price_change_percentage_24h ?? 0,
    change7d: c.market_data.price_change_percentage_7d ?? 0,
    change30d: c.market_data.price_change_percentage_30d ?? 0,
    circulating: c.market_data.circulating_supply,
    total: c.market_data.total_supply,
    max: c.market_data.max_supply,
    description: c.description.en?.split(". ").slice(0, 3).join(". ") ?? "",
    homepage: c.links.homepage?.[0] ?? "",
    twitter: c.links.twitter_screen_name ?? "",
  };
}

export async function getCoinChart(opts: { data: { id: string; days: 1 | 7 | 30 | 90 | 365 } }) {
  const r = await cg<{ prices: [number, number][] }>(
    `/coins/${encodeURIComponent(opts.data.id)}/market_chart?vs_currency=usd&days=${opts.data.days}`,
  );
  const points = r.prices;
  // Downsample to at most ~120 points for smooth rendering on mobile.
  const MAX = 120;
  const step = Math.max(1, Math.ceil(points.length / MAX));
  const sampled = step === 1 ? points : points.filter((_, i) => i % step === 0 || i === points.length - 1);
  return sampled.map(([t, p]) => ({ t, p }));
}


export async function getTrending() {
  const r = await cg<{
    coins: { item: { id: string; name: string; symbol: string; small: string; market_cap_rank: number; price_btc: number } }[];
  }>(`/search/trending`);
  return r.coins.map((c) => c.item);
}

export async function getEthGas() {
  try {
    const r = await fetch("https://ethgas.watch/api/gas");
    if (!r.ok) throw new Error();
    const j = (await r.json()) as {
      slow: { gwei: number };
      normal: { gwei: number };
      fast: { gwei: number };
    };
    return { slow: j.slow.gwei, normal: j.normal.gwei, fast: j.fast.gwei };
  } catch {
    return { slow: 0, normal: 0, fast: 0 };
  }
}

export async function searchCoins(opts: { data: { q: string } }) {
  const r = await cg<{
    coins: { id: string; name: string; symbol: string; thumb: string; market_cap_rank: number | null }[];
  }>(`/search?query=${encodeURIComponent(opts.data.q)}`);
  return r.coins.slice(0, 15);
}
