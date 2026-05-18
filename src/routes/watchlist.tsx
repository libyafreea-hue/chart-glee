import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { getMarkets } from "@/lib/crypto.functions";
import { CoinRow } from "@/components/CoinRow";
import { Skeleton } from "@/components/Skel";
import { useLocalStorage } from "@/lib/storage";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [{ title: "Watchlist — Crypto Gem Hunter" }, { name: "description", content: "Your saved coins." }],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const [watch, , hydrated] = useLocalStorage<string[]>("cgh:watchlist", []);
  const ids = watch.join(",");
  const { data, isLoading } = useQuery({
    queryKey: ["watchlist", ids],
    queryFn: () => getMarkets({ data: { vs: "usd", perPage: 100, page: 1, ids } }),
    enabled: hydrated && watch.length > 0,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="text-sm text-muted-foreground">{watch.length} coins tracked</p>
      </div>

      {!hydrated ? null : watch.length === 0 ? (
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
