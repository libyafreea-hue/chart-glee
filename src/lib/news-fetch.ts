// Client-side RSS fetcher. The server function approach was unreliable on the
// published worker, and on the Android APK there is no server to call. We use
// the public r.jina.ai mirror which both serves RSS XML and sets CORS headers.

const FEEDS = [
  { source: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { source: "Decrypt", url: "https://decrypt.co/feed" },
  { source: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed" },
];

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  pubDate: number;
  description: string;
  image?: string;
};

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function pickImage(xml: string): string | undefined {
  return (
    xml.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] ||
    xml.match(/<img[^>]+src="([^"]+)"/i)?.[1]
  );
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of blocks) {
    const end = block.indexOf("</item>");
    const seg = end >= 0 ? block.slice(0, end) : block;
    const title = seg.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] ?? "";
    const rawLink =
      seg.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1] ??
      seg.match(/<link[^>]+href="([^"]+)"/i)?.[1] ??
      "";
    const link = rawLink.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const pub = seg.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "";
    const desc =
      seg.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ?? "";
    if (!title || !link) continue;
    if (!/^https?:\/\//i.test(link)) continue;
    items.push({
      title: stripHtml(title),
      link: link.trim(),
      source,
      pubDate: pub ? new Date(pub).getTime() : Date.now(),
      description: stripHtml(desc).slice(0, 220),
      image: pickImage(seg),
    });
  }
  return items;
}

async function fetchFeed(url: string): Promise<string> {
  // Try direct first (works on Capacitor native — no CORS); fall back to a
  // public CORS proxy for the browser.
  try {
    const r = await fetch(url, { headers: { accept: "application/rss+xml, application/xml" } });
    if (r.ok) {
      const text = await r.text();
      if (text.includes("<item")) return text;
    }
  } catch {
    /* fall through to proxy */
  }
  const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
  if (!r.ok) throw new Error(`proxy ${r.status}`);
  return r.text();
}

export async function getNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => parseFeed(await fetchFeed(f.url), f.source)),
  );
  const all: NewsItem[] = [];
  for (const r of results) if (r.status === "fulfilled") all.push(...r.value);
  all.sort((a, b) => b.pubDate - a.pubDate);
  return all.slice(0, 60);
}
