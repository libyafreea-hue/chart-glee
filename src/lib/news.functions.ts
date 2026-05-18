import { createServerFn } from "@tanstack/react-start";

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
  const enclosure = xml.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1];
  if (enclosure) return enclosure;
  const media = xml.match(/<media:content[^>]+url="([^"]+)"/i)?.[1];
  if (media) return media;
  const mediaThumb = xml.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1];
  if (mediaThumb) return mediaThumb;
  const imgTag = xml.match(/<img[^>]+src="([^"]+)"/i)?.[1];
  return imgTag;
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of itemBlocks) {
    const end = block.indexOf("</item>");
    const seg = end >= 0 ? block.slice(0, end) : block;
    const title = seg.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] ?? "";
    const link =
      seg.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ??
      seg.match(/<link[^>]+href="([^"]+)"/i)?.[1] ??
      "";
    const pub = seg.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "";
    const desc =
      seg.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ?? "";
    const image = pickImage(seg);
    if (!title || !link) continue;
    items.push({
      title: stripHtml(title),
      link: link.trim(),
      source,
      pubDate: pub ? new Date(pub).getTime() : Date.now(),
      description: stripHtml(desc).slice(0, 220),
      image,
    });
  }
  return items;
}

export const getNews = createServerFn({ method: "GET" }).handler(async () => {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const r = await fetch(f.url, {
        headers: {
          "user-agent": "Mozilla/5.0 CryptoGemHunter/1.0",
          accept: "application/rss+xml, application/xml, text/xml",
        },
      });
      if (!r.ok) throw new Error(`${f.source} ${r.status}`);
      const xml = await r.text();
      return parseFeed(xml, f.source);
    }),
  );
  const all: NewsItem[] = [];
  for (const r of results) if (r.status === "fulfilled") all.push(...r.value);
  all.sort((a, b) => b.pubDate - a.pubDate);
  return all.slice(0, 60);
});
