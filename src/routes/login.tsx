import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Crypto Gem Hunter" },
      { name: "description", content: "Sign in with Google to sync your watchlist across devices." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/watchlist" });
  }, [user, navigate]);

  const onGoogle = async () => {
    try {
      setBusy(true);
      await signInWithGoogle();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow text-2xl font-bold">
          ◆
        </div>
        <h1 className="text-2xl font-bold">Welcome</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to sync your watchlist and follow your coins across devices.
        </p>
      </div>

      <button
        onClick={onGoogle}
        disabled={busy || loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-card/80 disabled:opacity-60"
      >
        <GoogleLogo />
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.74-6-6.2s2.7-6.2 6-6.2c1.88 0 3.13.8 3.85 1.5l2.62-2.55C16.9 3.16 14.7 2.2 12 2.2 6.86 2.2 2.7 6.36 2.7 11.5S6.86 20.8 12 20.8c6.93 0 9.2-4.86 9.2-7.4 0-.5-.05-.88-.13-1.2H12z" />
    </svg>
  );
}
