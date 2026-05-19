import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { useLocalStorage } from "./storage";

const KEY = "cgh:watchlist";

/**
 * Returns the user's watchlist (array of coin ids).
 * - Signed in: synced with the `watchlist` table.
 * - Anonymous: stored in localStorage.
 */
export function useWatchlist() {
  const { user, loading } = useAuth();
  const [local, setLocal, hydrated] = useLocalStorage<string[]>(KEY, []);
  const [remote, setRemote] = useState<string[]>([]);
  const [remoteReady, setRemoteReady] = useState(false);

  // Load + subscribe to remote watchlist when signed in
  useEffect(() => {
    if (!user) {
      setRemote([]);
      setRemoteReady(false);
      return;
    }
    let active = true;
    setRemoteReady(false);
    supabase
      .from("watchlist")
      .select("coin_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) return;
        setRemote((data ?? []).map((r) => r.coin_id));
        setRemoteReady(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  // One-time migration: push local items into remote on first sign-in
  useEffect(() => {
    if (!user || !remoteReady || local.length === 0) return;
    const missing = local.filter((id) => !remote.includes(id));
    if (missing.length === 0) {
      setLocal([]);
      return;
    }
    supabase
      .from("watchlist")
      .insert(missing.map((coin_id) => ({ user_id: user.id, coin_id })))
      .then(() => {
        setRemote((r) => Array.from(new Set([...r, ...missing])));
        setLocal([]);
      });
  }, [user, remoteReady, local, remote, setLocal]);

  const list = user ? remote : local;
  const ready = user ? remoteReady : hydrated;

  const add = useCallback(
    async (coinId: string) => {
      if (user) {
        setRemote((r) => (r.includes(coinId) ? r : [...r, coinId]));
        await supabase.from("watchlist").insert({ user_id: user.id, coin_id: coinId });
      } else {
        setLocal((prev) => (prev.includes(coinId) ? prev : [...prev, coinId]));
      }
    },
    [user, setLocal],
  );

  const remove = useCallback(
    async (coinId: string) => {
      if (user) {
        setRemote((r) => r.filter((x) => x !== coinId));
        await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("coin_id", coinId);
      } else {
        setLocal((prev) => prev.filter((x) => x !== coinId));
      }
    },
    [user, setLocal],
  );

  const toggle = useCallback(
    async (coinId: string) => {
      if (list.includes(coinId)) await remove(coinId);
      else await add(coinId);
    },
    [list, add, remove],
  );

  return { list, ready: ready && !loading, has: (id: string) => list.includes(id), add, remove, toggle };
}
