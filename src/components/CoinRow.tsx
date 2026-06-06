import { Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { MarketCoin } from "@/lib/crypto.functions";
import { fmtUsd, fmtPct } from "@/lib/format";
import { Sparkline } from "./Sparkline";

export function CoinRow({ coin, showVolume = false }: { coin: MarketCoin; showVolume?: boolean }) {
  const up = (coin.price_change_percentage_24h ?? 0) >= 0;
  return (
    <Link
      to="/coin/$id"
      params={{ id: coin.id }}
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-3 transition-colors hover:bg-card"
    >
      <div className="w-6 text-center text-xs font-mono-num text-muted-foreground">
        {coin.market_cap_rank}
      </div>
      <img src={coin.image} alt={coin.name} className="h-9 w-9 rounded-full" loading="lazy" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{coin.name}</span>
          <span className="text-[10px] uppercase text-muted-foreground">{coin.symbol}</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono-num">
          {fmtUsd(coin.current_price)}
        </div>
      </div>
      <div className="hidden xs:block h-10 w-20 shrink-0 sm:block">
        {coin.sparkline_in_7d?.price && (
          <Sparkline data={coin.sparkline_in_7d.price} positive={up} />
        )}
      </div>
      <div className="text-right">
        <div
          className={`inline-flex items-center gap-1 text-xs font-semibold font-mono-num ${up ? "text-bull" : "text-bear"}`}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {fmtPct(coin.price_change_percentage_24h ?? 0)}
        </div>
        {showVolume && (
          <div className="mt-0.5 text-[10px] text-muted-foreground font-mono-num">
            Vol {fmtUsd(coin.total_volume, { compact: true })}
          </div>
        )}
      </div>
    </Link>
  );
}
