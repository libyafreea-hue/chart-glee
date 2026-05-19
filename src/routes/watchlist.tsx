import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, Cloud, LogOut } from "lucide-react";
import { getMarkets } from "@/lib/crypto.functions";
import { CoinRow } from "@/components/CoinRow";
import { Skeleton } from "@/components/Skel";
import { useWatchlist } from "@/lib/watchlist";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [{ title: "Watchlist — Crypto Gem Hunter" }, { name: "description", content: "Your saved coins." }],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { user, signOut } = useAuth();
  const { list, ready } = useWatchlist();
  const ids = list.join(",");
  const { data, isLoading } = useQuery({
    queryKey: ["watchlist", ids],
    queryFn: () => getMarkets({ data: { vs: "usd", perPage: 100, page: 1, ids } }),
    enabled: ready && list.length > 0,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-sm text-muted-foreground">{list.length} coins tracked</p>
        </div>
        {user ? (
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Cloud className="h-3 w-3" /> Sync
          </Link>
        )}
      </div>

      {!ready ? null : list.length === 0 ? (
        <EmptyState />
      ) : isLoading || !data ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <div className="space-y-2">
          {data.map((c) => <CoinRow key={c.id} coin={c} />)}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass rounded-3xl p-8 text-center shadow-card">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
        <Star className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold">Build your watchlist</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
        Tap the star on any coin page to track its price here.
      </p>
      <Link to="/markets" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
        Browse markets
      </Link>
    </div>
  );
}
