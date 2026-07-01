import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PasswordInput } from "@/components/PasswordInput";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Crypto Gem Hunter" },
      { name: "description", content: "Sign in to sync your watchlist across devices." },
    ],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup" | "forgot";

function LoginPage() {
  const { user, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/watchlist" });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email");
      return;
    }
    if (mode !== "forgot" && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setBusy(true);
      if (mode === "signin") {
        await signInWithEmail(email.trim(), password);
      } else if (mode === "signup") {
        await signUpWithEmail(email.trim(), password);
        toast.success("Account created");
      } else {
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (error) throw error;
        toast.success("Password reset email sent. Check your inbox.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password";

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow text-2xl font-bold">
          ◆
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "Enter your email and we'll send you a reset link."
            : "Sync your watchlist and portfolio across devices."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        {mode !== "forgot" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <PasswordInput
              id="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

          </div>
        )}

        <button
          type="submit"
          disabled={busy || loading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
        </button>
      </form>

      <div className="space-y-2 text-center text-xs">
        {mode === "signin" && (
          <button
            onClick={() => setMode("signup")}
            className="block w-full text-muted-foreground hover:text-foreground"
          >
            No account? Create one
          </button>
        )}
        {mode === "signup" && (
          <button
            onClick={() => setMode("signin")}
            className="block w-full text-muted-foreground hover:text-foreground"
          >
            Already have an account? Sign in
          </button>
        )}
        {mode === "forgot" && (
          <button
            onClick={() => setMode("signin")}
            className="block w-full text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </button>
        )}
      </div>

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
