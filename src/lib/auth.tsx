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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
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
    let GoogleAuth: typeof import("@codetrix-studio/capacitor-google-auth").GoogleAuth;
    try {
      ({ GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth"));
    } catch (e) {
      throw new Error("Google plugin not installed in this build");
    }
    let result;
    try {
      result = await GoogleAuth.signIn();
    } catch (e: any) {
      const msg = e?.message || e?.error || JSON.stringify(e);
      throw new Error(`Google sign-in failed: ${msg}`);
    }
    const idToken = result.authentication?.idToken;
    if (!idToken) throw new Error("Google returned no ID token (check SHA-1 in Firebase)");

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) throw new Error(`Supabase rejected token: ${error.message}`);
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
