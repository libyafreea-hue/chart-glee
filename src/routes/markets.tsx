import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getMarkets } from "@/lib/crypto.functions";
import { CoinRow } from "@/components/CoinRow";
import { Skeleton } from "@/components/Skel";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets — Crypto Gem Hunter" },
      { name: "description", content: "Live prices, market cap and 24h movers for the top 100 cryptocurrencies." },
    ],
  }),
  component: Markets,
});

type Sort = "rank" | "gain24" | "loss24" | "vol";

function Markets() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("rank");
  const { data, isLoading } = useQuery({
    queryKey: ["markets", "100"],
    queryFn: () => getMarkets({ data: { vs: "usd", perPage: 100, page: 1 } }),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data;
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(t) || c.symbol.toLowerCase().includes(t));
    }
    const sorted = [...list];
    if (sort === "gain24") sorted.sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
    else if (sort === "loss24") sorted.sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0));
    else if (sort === "vol") sorted.sort((a, b) => b.total_volume - a.total_volume);
    else sorted.sort((a, b) => (a.market_cap_rank ?? 999) - (b.market_cap_rank ?? 999));
    return sorted;
  }, [data, q, sort]);

  const tabs: { key: Sort; label: string }[] = [
    { key: "rank", label: "Top" },
    { key: "gain24", label: "Gainers" },
    { key: "loss24", label: "Losers" },
    { key: "vol", label: "Volume" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="text-sm text-muted-foreground">Top 100 by market cap</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search coin or symbol…"
          className="w-full rounded-xl border border-border bg-card/60 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSort(t.key)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              sort === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card/40 text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => <CoinRow key={c.id} coin={c} showVolume={sort === "vol"} />)}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No coins match "{q}"</p>
          )}
        </div>
      )}
    </div>
  );
}
