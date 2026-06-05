import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Wallet } from "lucide-react";
import { getMarkets, searchCoins } from "@/lib/crypto.functions";
import { fmtUsd, fmtPct } from "@/lib/format";
import { useLocalStorage, type Holding } from "@/lib/storage";
import { Skeleton } from "@/components/Skel";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [{ title: "Portfolio — Crypto Gem Hunter" }, { name: "description", content: "Track your crypto holdings and P&L." }],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [holdings, setHoldings, hydrated] = useLocalStorage<Holding[]>("cgh:portfolio", []);
  const [adding, setAdding] = useState(false);

  const ids = holdings.map((h) => h.id).join(",");
  const { data: prices } = useQuery({
    queryKey: ["portfolio", ids],
    queryFn: () => getMarkets({ data: { vs: "usd", perPage: 100, page: 1, ids } }),
    enabled: hydrated && holdings.length > 0,
    staleTime: 30_000,
  });

  const enriched = useMemo(() => {
    return holdings.map((h) => {
      const p = prices?.find((x) => x.id === h.id);
      const price = p?.current_price ?? 0;
      const value = price * h.amount;
      const change = p?.price_change_percentage_24h ?? 0;
      return { ...h, price, value, change, image: p?.image ?? h.image };
    });
  }, [holdings, prices]);

  const total = enriched.reduce((sum, h) => sum + h.value, 0);
  const total24hAgo = enriched.reduce((sum, h) => sum + h.value / (1 + h.change / 100), 0);
  const totalChange = total - total24hAgo;
  const totalChangePct = total24hAgo > 0 ? (totalChange / total24hAgo) * 100 : 0;
  const positive = totalChange >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground">{holdings.length} holdings</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {hydrated && holdings.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 shadow-card">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Total balance</p>
          <p className="mt-1 font-mono-num text-3xl font-bold">{fmtUsd(total, { compact: total > 99_999 })}</p>
          <p className={`mt-1 font-mono-num text-sm font-semibold ${positive ? "text-bull" : "text-bear"}`}>
            {positive ? "+" : ""}{fmtUsd(totalChange)} ({fmtPct(totalChangePct)}) · 24h
          </p>
        </div>
      )}

      {!hydrated ? null : holdings.length === 0 ? (
        <EmptyPortfolio onAdd={() => setAdding(true)} />
      ) : !prices ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {enriched
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-3">
                <Link to="/coin/$id" params={{ id: h.id }} className="flex flex-1 items-center gap-3">
                  <img src={h.image} alt={h.name} className="h-9 w-9 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{h.name}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">{h.symbol}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono-num">
                      {h.amount} × {fmtUsd(h.price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-num text-sm font-bold">{fmtUsd(h.value)}</div>
                    <div className={`font-mono-num text-[11px] ${h.change >= 0 ? "text-bull" : "text-bear"}`}>
                      {fmtPct(h.change)}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setHoldings((prev) => prev.filter((x) => x.id !== h.id));
                    toast.success(`Removed ${h.name}`);
                  }}
                  aria-label="Remove"
                  className="rounded-full p-1.5 text-muted-foreground hover:text-bear"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
        </div>
      )}

      {adding && (
        <AddHoldingModal
          onClose={() => setAdding(false)}
          onAdd={(h) => {
            setHoldings((prev) => {
              const existing = prev.find((x) => x.id === h.id);
              if (existing) {
                return prev.map((x) => (x.id === h.id ? { ...x, amount: x.amount + h.amount } : x));
              }
              return [...prev, h];
            });
            toast.success(`Added ${h.amount} ${h.symbol.toUpperCase()}`);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function EmptyPortfolio({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="glass rounded-3xl p-8 text-center shadow-card">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Wallet className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold">Track your portfolio</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
        Add your holdings to see total value and 24h P&amp;L.
      </p>
      <button onClick={onAdd} className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
        Add holding
      </button>
    </div>
  );
}

function AddHoldingModal({
  onClose,
  onAdd,
}: { onClose: () => void; onAdd: (h: Holding) => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Holding | null>(null);
  const [amount, setAmount] = useState("");

  const search = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchCoins({ data: { q } }),
    enabled: q.length >= 2,
    staleTime: 60_000,
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />
        <h3 className="text-lg font-bold">Add holding</h3>

        {!picked ? (
          <>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search coin (e.g. bitcoin)"
              className="mt-3 w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {search.data?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPicked({ id: c.id, symbol: c.symbol, name: c.name, image: c.thumb, amount: 0 })}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-card"
                >
                  <img src={c.thumb} alt="" className="h-7 w-7 rounded-full" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">{c.symbol}</div>
                  </div>
                  {c.market_cap_rank && <span className="text-xs text-muted-foreground">#{c.market_cap_rank}</span>}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
              <img src={picked.image} alt="" className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{picked.name}</div>
                <div className="text-[10px] uppercase text-muted-foreground">{picked.symbol}</div>
              </div>
              <button onClick={() => setPicked(null)} className="text-xs text-muted-foreground underline">change</button>
            </div>
            <label className="mt-3 block text-xs font-semibold text-muted-foreground">Amount</label>
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-lg font-mono-num outline-none focus:border-primary"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold">Cancel</button>
              <button
                disabled={!amount || Number(amount) <= 0}
                onClick={() => onAdd({ ...picked, amount: Number(amount) })}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
