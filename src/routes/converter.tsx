import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { getMarkets } from "@/lib/crypto.functions";
import { fmtNum } from "@/lib/format";
import { Skeleton } from "@/components/Skel";

export const Route = createFileRoute("/converter")({
  head: () => ({
    meta: [{ title: "Converter — Crypto Gem Hunter" }, { name: "description", content: "Convert between cryptocurrencies and USD." }],
  }),
  component: ConverterPage,
});

function ConverterPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["markets", "convert"],
    queryFn: () => getMarkets({ data: { vs: "usd", perPage: 100, page: 1 } }),
    staleTime: 60_000,
  });

  const options = useMemo(() => {
    const usd = { id: "usd", symbol: "usd", name: "US Dollar", price: 1, image: "" };
    return [usd, ...(data?.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, price: c.current_price, image: c.image })) ?? [])];
  }, [data]);

  const [fromId, setFromId] = useState("bitcoin");
  const [toId, setToId] = useState("usd");
  const [amount, setAmount] = useState("1");

  const from = options.find((o) => o.id === fromId);
  const to = options.find((o) => o.id === toId);

  const fromUsd = (from?.price ?? 0) * (Number(amount) || 0);
  const result = to && to.price ? fromUsd / to.price : 0;

  if (isLoading) return <Skeleton className="h-72" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Converter</h1>
        <p className="text-sm text-muted-foreground">Live cross-rates between any two assets</p>
      </div>

      <div className="glass space-y-3 rounded-2xl p-4 shadow-card">
        <ConvField label="From" options={options} valueId={fromId} onChangeId={setFromId} amount={amount} onAmountChange={setAmount} />
        <div className="flex justify-center">
          <button
            onClick={() => { const f = fromId; setFromId(toId); setToId(f); }}
            className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-primary"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>
        <ConvField label="To" options={options} valueId={toId} onChangeId={setToId} amount={result ? result.toFixed(6) : "0"} readOnly />
      </div>

      {from && to && from.price > 0 && to.price > 0 && (
        <p className="text-center text-xs text-muted-foreground font-mono-num">
          1 {from.symbol.toUpperCase()} = {fmtNum(from.price / to.price)} {to.symbol.toUpperCase()}
        </p>
      )}
    </div>
  );
}

function ConvField({
  label, options, valueId, onChangeId, amount, onAmountChange, readOnly,
}: {
  label: string;
  options: { id: string; symbol: string; name: string; price: number; image: string }[];
  valueId: string;
  onChangeId: (id: string) => void;
  amount: string;
  onAmountChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-3">
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => onAmountChange?.(e.target.value)}
          readOnly={readOnly}
          className="min-w-0 flex-1 bg-transparent text-2xl font-bold font-mono-num outline-none"
        />
        <select
          value={valueId}
          onChange={(e) => onChangeId(e.target.value)}
          className="max-w-[140px] rounded-lg border border-border bg-card px-2 py-1.5 text-sm font-semibold outline-none"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.symbol.toUpperCase()} · {o.name.length > 12 ? `${o.name.slice(0, 12)}…` : o.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
