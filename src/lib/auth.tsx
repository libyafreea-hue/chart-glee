import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const isNativeAndroid = () =>
  typeof Capacitor !== "undefined" &&
  Capacitor.isNativePlatform?.() &&
  Capacitor.getPlatform?.() === "android";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Initialize the native Google Auth plugin on Android
    if (isNativeAndroid()) {
      import("@codetrix-studio/capacitor-google-auth")
        .then(({ GoogleAuth }) => {
          try {
            GoogleAuth.initialize({
              clientId:
                "92917135869-np2emnpamvdr4c9t8i2i8415fd56fpml.apps.googleusercontent.com",
              scopes: ["profile", "email"],
              grantOfflineAccess: true,
            });
          } catch (e) {
            console.warn("GoogleAuth.initialize failed", e);
          }
        })
        .catch((e) => console.warn("GoogleAuth import failed", e));
    }

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogleNative = async () => {
    const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
    const result = await GoogleAuth.signIn();
    const idToken = result.authentication?.idToken;
    if (!idToken) throw new Error("No ID token returned from Google");

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) throw error;
  };

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    signInWithGoogle: async () => {
      if (isNativeAndroid()) {
        await signInWithGoogleNative();
        return;
      }
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window === "undefined" ? undefined : window.location.origin,
      });
      if (res.error) throw res.error;
    },
    signOut: async () => {
      if (isNativeAndroid()) {
        try {
          const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
          await GoogleAuth.signOut();
        } catch {
          /* ignore */
        }
      }
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
