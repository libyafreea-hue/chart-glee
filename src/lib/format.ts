export function fmtUsd(n: number, opts: { compact?: boolean; digits?: number } = {}) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const { compact, digits } = opts;
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  const d = digits ?? (n >= 1 ? 2 : n >= 0.01 ? 4 : 8);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
}

export function fmtNum(n: number, compact = false) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtPct(n: number, withSign = true) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const s = `${n.toFixed(2)}%`;
  if (!withSign) return s;
  return n > 0 ? `+${s}` : s;
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
