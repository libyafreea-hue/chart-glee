import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Flame, Activity, Bitcoin, Fuel, Globe, ArrowRight } from "lucide-react";
import {
  getFearGreed,
  getGlobal,
  getTrending,
  getMarkets,
  getEthGas,
} from "@/lib/crypto.functions";
import { fmtPct, fmtUsd } from "@/lib/format";
import { CoinRow } from "@/components/CoinRow";
import { Skeleton } from "@/components/Skel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crypto Gem Hunter — Live crypto dashboard" },
      { name: "description", content: "Fear & Greed, trending coins, global market cap, BTC dominance and ETH gas — at a glance." },
    ],
  }),
  component: Home,
});

const HALVING_DATE = new Date("2028-04-20T00:00:00Z").getTime();

function fngColor(v: number) {
  if (v <= 24) return "var(--bear)";
  if (v <= 49) return "var(--warning)";
  if (v <= 74) return "var(--bull)";
  return "var(--primary)";
}

function FearGreedGauge() {
  const { data, isLoading } = useQuery({
    queryKey: ["fng"],
    queryFn: () => getFearGreed(),
    staleTime: 5 * 60_000,
  });
  if (isLoading || !data) return <Skeleton className="h-44" />;
  const latest = data[0];
  const v = latest.value;
  const angle = (v / 100) * 180 - 90;
  const color = fngColor(v);
  return (
    <div className="glass rounded-2xl p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold">Fear &amp; Greed Index</h3>
          <p className="text-[11px] text-muted-foreground">Market sentiment, last 24h</p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Now</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-4">
        <svg viewBox="0 0 200 110" className="w-full">
          <defs>
            <linearGradient id="fngArc" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--bear)" />
              <stop offset="35%" stopColor="var(--warning)" />
              <stop offset="70%" stopColor="var(--bull)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="url(#fngArc)" strokeWidth="14" strokeLinecap="round" />
          <g transform={`translate(100 100) rotate(${angle})`}>
            <line x1="0" y1="0" x2="0" y2="-78" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <circle r="6" fill={color} />
          </g>
        </svg>
        <div className="text-right">
          <div className="font-mono-num text-4xl font-bold" style={{ color }}>{v}</div>
          <div className="text-xs font-medium" style={{ color }}>{latest.classification}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] text-muted-foreground">
        {data.slice(0, 4).map((d, i) => (
          <div key={d.timestamp} className="rounded-lg bg-card/60 py-2">
            <div className="font-mono-num text-sm font-semibold" style={{ color: fngColor(d.value) }}>
              {d.value}
            </div>
            <div>{i === 0 ? "Now" : `${i}d`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GlobalStats() {
  const { data: g } = useQuery({ queryKey: ["global"], queryFn: () => getGlobal(), staleTime: 60_000 });
  const { data: gas } = useQuery({ queryKey: ["gas"], queryFn: () => getEthGas(), staleTime: 60_000 });

  const [halvingDays, setHalvingDays] = useState<number | null>(null);
  useEffect(() => {
    setHalvingDays(Math.max(0, Math.ceil((HALVING_DATE - Date.now()) / 86_400_000)));
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat
        icon={<Globe className="h-4 w-4" />}
        label="Market cap"
        value={g ? fmtUsd(g.total_market_cap.usd, { compact: true }) : "—"}
        sub={g ? fmtPct(g.market_cap_change_percentage_24h_usd) : ""}
        subPositive={(g?.market_cap_change_percentage_24h_usd ?? 0) >= 0}
      />
      <Stat
        icon={<Activity className="h-4 w-4" />}
        label="24h volume"
        value={g ? fmtUsd(g.total_volume.usd, { compact: true }) : "—"}
        sub={g ? `${g.active_cryptocurrencies.toLocaleString()} coins` : ""}
      />
      <Stat
        icon={<Bitcoin className="h-4 w-4" />}
        label="BTC dominance"
        value={g ? `${g.market_cap_percentage.btc?.toFixed(1)}%` : "—"}
        sub={g ? `ETH ${g.market_cap_percentage.eth?.toFixed(1)}%` : ""}
      />
      <Stat
        icon={<Fuel className="h-4 w-4" />}
        label="ETH gas"
        value={gas && gas.normal ? `${gas.normal} gwei` : "—"}
        sub={gas && gas.fast ? `Fast ${gas.fast} • Slow ${gas.slow}` : ""}
      />
      <div className="col-span-2 glass rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Next Bitcoin halving</div>
            <div className="mt-1 font-mono-num text-2xl font-bold">{halvingDays} days</div>
          </div>
          <div className="rounded-xl bg-gradient-primary p-3 text-primary-foreground shadow-glow">
            <Bitcoin className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon, label, value, sub, subPositive,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; subPositive?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-2 font-mono-num text-lg font-bold">{value}</div>
      {sub && (
        <div className={`text-xs font-mono-num ${subPositive === undefined ? "text-muted-foreground" : subPositive ? "text-bull" : "text-bear"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

function TrendingStrip() {
  const { data, isLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => getTrending(),
    staleTime: 5 * 60_000,
  });
  return (
    <section>
      <SectionHead icon={<Flame className="h-4 w-4 text-warning" />} title="Trending" sub="Top searched on CoinGecko" />
      {isLoading || !data ? (
        <div className="mt-3 flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-32 shrink-0" />)}
        </div>
      ) : (
        <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.slice(0, 10).map((c) => (
            <Link
              key={c.id}
              to="/coin/$id"
              params={{ id: c.id }}
              className="glass min-w-[140px] shrink-0 rounded-2xl p-3 shadow-card"
            >
              <div className="flex items-center gap-2">
                <img src={c.small} alt={c.name} className="h-7 w-7 rounded-full" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{c.symbol}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Rank #{c.market_cap_rank ?? "—"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function MoversTabs() {
  const { data, isLoading } = useQuery({
    queryKey: ["markets", "top"],
    queryFn: () => getMarkets({ data: { vs: "usd", perPage: 100, page: 1 } }),
    staleTime: 60_000,
  });
  if (isLoading || !data) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }
  const gainers = [...data].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)).slice(0, 5);
  const losers = [...data].sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0)).slice(0, 5);

  return (
    <div className="mt-3 grid grid-cols-1 gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-bull">Top gainers · 24h</h4>
        </div>
        <div className="space-y-2">
          {gainers.map((c) => <CoinRow key={c.id} coin={c} />)}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-bear">Top losers · 24h</h4>
        </div>
        <div className="space-y-2">
          {losers.map((c) => <CoinRow key={c.id} coin={c} />)}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ icon, title, sub, href }: { icon: React.ReactNode; title: string; sub?: string; href?: "/markets" | "/news" }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-bold">{title}</h3>
        </div>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      {href && (
        <Link to={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          See all <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function Home() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 shadow-card">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
        <p className="text-[11px] uppercase tracking-widest text-primary/80">Crypto Gem Hunter</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">
          Hunt the next gem.<br />
          <span className="bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
            Track the whole market.
          </span>
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Live prices, charts, Fear &amp; Greed, news and your personal watchlist — all in one place.
        </p>
      </section>

      <FearGreedGauge />
      <GlobalStats />

      <TrendingStrip />

      <section>
        <SectionHead icon={<Activity className="h-4 w-4 text-primary" />} title="Market movers" sub="Biggest 24h swings" href="/markets" />
        <MoversTabs />
      </section>
    </div>
  );
}
