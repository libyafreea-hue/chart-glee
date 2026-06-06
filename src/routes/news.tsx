import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper } from "lucide-react";
import { getNews } from "@/lib/news.client";
import { timeAgo } from "@/lib/format";
import { Skeleton } from "@/components/Skel";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Crypto news — Crypto Gem Hunter" },
      { name: "description", content: "Latest crypto news from CoinDesk, Cointelegraph, Decrypt and Bitcoin Magazine." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => getNews(),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">News</h1>
        <p className="text-sm text-muted-foreground">Aggregated from top crypto outlets</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.map((n) => (
            <a
              key={`${n.source}-${n.link}`}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              className="group flex gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-3 transition-colors hover:bg-card"
            >
              {n.image ? (
                <img src={n.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
              ) : (
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Newspaper className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary">
                  <span>{n.source}</span>
                  <span className="text-muted-foreground">· {timeAgo(n.pubDate)}</span>
                </div>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
                  {n.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          ))}
          {data?.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No news right now.</p>
          )}
        </div>
      )}
    </div>
  );
}
