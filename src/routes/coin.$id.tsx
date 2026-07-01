import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Star, TrendingUp, TrendingDown, ExternalLink, Twitter } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { getCoin, getCoinChart } from "@/lib/crypto.functions";
import { fmtUsd, fmtPct, fmtNum } from "@/lib/format";
import { Skeleton } from "@/components/Skel";
import { useWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/coin/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Crypto Gem Hunter` },
      { name: "description", content: `Live price, chart and stats for ${params.id}.` },
    ],
  }),
  component: CoinPage,
});

const RANGES = [
  { label: "24h", days: 1 as const },
  { label: "7d", days: 7 as const },
  { label: "30d", days: 30 as const },
  { label: "90d", days: 90 as const },
  { label: "1y", days: 365 as const },
];

function CoinPage() {
  const { id } = Route.useParams();
  const [days, setDays] = useState<1 | 7 | 30 | 90 | 365>(7);
  const { has, toggle } = useWatchlist();
  const isWatched = has(id);

  const coin = useQuery({ queryKey: ["coin", id], queryFn: () => getCoin({ data: { id } }), staleTime: 30_000 });
  const chart = useQuery({
    queryKey: ["chart", id, days],
    queryFn: () => getCoinChart({ data: { id, days } }),
    staleTime: 30_000,
  });

  const c = coin.data;
  const up = (c?.change24h ?? 0) >= 0;

  return (
    <div className="space-y-5">
      <Link to="/markets" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-3 w-3" /> Markets
      </Link>

      {!c ? (
        <Skeleton className="h-20" />
      ) : (
        <div className="flex items-center gap-3">
          <img src={c.image} alt={c.name} className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{c.name}</h1>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                {c.symbol}
              </span>
              <span className="text-[10px] text-muted-foreground">#{c.rank}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono-num text-2xl font-bold">{fmtUsd(c.price)}</span>
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold font-mono-num ${up ? "text-bull" : "text-bear"}`}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {fmtPct(c.change24h)}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              toggle(id);
              toast.success(isWatched ? "Removed from watchlist" : "Added to watchlist");
            }}
            aria-label="Toggle watchlist"
            className={`rounded-full border p-2 transition-colors ${
              isWatched ? "border-warning bg-warning/10 text-warning" : "border-border text-muted-foreground"
            }`}
          >
            <Star className={`h-5 w-5 ${isWatched ? "fill-current" : ""}`} />
          </button>
        </div>
      )}

      {/* Chart */}
      <div className="glass rounded-2xl p-4 shadow-card">
        <div className="mb-2 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setDays(r.days)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                days === r.days ? "bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="h-56 w-full">
          {chart.isLoading || !chart.data ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart.data}>
                <defs>
                  <linearGradient id="chartA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={up ? "var(--bull)" : "var(--bear)"} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={up ? "var(--bull)" : "var(--bear)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="t"
                  tickFormatter={(t) => {
                    const d = new Date(t);
                    return days === 1 ? `${d.getHours()}:00` : `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v) => fmtUsd(Number(v), { compact: true })}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                  labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
                  formatter={(v: number) => [fmtUsd(v), "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="p"
                  stroke={up ? "var(--bull)" : "var(--bear)"}
                  strokeWidth={2}
                  fill="url(#chartA)"
                  isAnimationActive={false}
                  dot={false}
                  activeDot={{ r: 3 }}
                />

              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stats */}
      {c && (
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Market cap" value={fmtUsd(c.marketCap, { compact: true })} />
          <StatBox label="24h volume" value={fmtUsd(c.volume, { compact: true })} />
          <StatBox label="24h high" value={fmtUsd(c.high24)} />
          <StatBox label="24h low" value={fmtUsd(c.low24)} />
          <StatBox label="All-time high" value={fmtUsd(c.ath)} />
          <StatBox label="All-time low" value={fmtUsd(c.atl)} />
          <StatBox label="Circulating" value={`${fmtNum(c.circulating, true)} ${c.symbol.toUpperCase()}`} />
          <StatBox label="Max supply" value={c.max ? fmtNum(c.max, true) : "∞"} />
          <StatBox label="1h" value={fmtPct(c.change1h)} positive={c.change1h >= 0} />
          <StatBox label="7d" value={fmtPct(c.change7d)} positive={c.change7d >= 0} />
        </div>
      )}

      {c?.description && (
        <div className="glass rounded-2xl p-4 shadow-card">
          <h3 className="mb-2 text-sm font-semibold">About {c.name}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.homepage && (
              <a href={c.homepage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-3 py-1 text-xs">
                <ExternalLink className="h-3 w-3" /> Website
              </a>
            )}
            {c.twitter && (
              <a href={`https://twitter.com/${c.twitter}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-3 py-1 text-xs">
                <Twitter className="h-3 w-3" /> @{c.twitter}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono-num text-sm font-semibold ${positive === undefined ? "" : positive ? "text-bull" : "text-bear"}`}>
        {value}
      </div>
    </div>
  );
}
