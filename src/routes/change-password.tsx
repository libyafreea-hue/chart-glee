import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/change-password")({
  head: () => ({
    meta: [
      { title: "Change password — Crypto Gem Hunter" },
      { name: "description", content: "Change your account password." },
    ],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    try {
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password changed");
      setPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Change password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user?.email ?? ""}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-sm font-medium">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
