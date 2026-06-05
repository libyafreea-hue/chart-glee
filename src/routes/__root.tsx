import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Home, LineChart, Newspaper, Star, Wallet, ArrowLeftRight, User } from "lucide-react";

import appCss from "../styles.css?url";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { installCapacitorFetchProxy } from "@/lib/capacitor-fetch";

if (typeof window !== "undefined") {
  installCapacitorFetchProxy();
}

function BottomNav() {
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/markets", label: "Markets", icon: LineChart },
    { to: "/news", label: "News", icon: Newspaper },
    { to: "/watchlist", label: "Watch", icon: Star },
    { to: "/portfolio", label: "Wallet", icon: Wallet },
  ] as const;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/60">
      <ul className="mx-auto flex max-w-screen-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to} className="flex-1">
              <Link
                to={it.to}
                className="group flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: it.to === "/" }}
              >
                <Icon className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                <span className="font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow grid place-items-center text-primary-foreground font-bold">
            ◆
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">Crypto Gem Hunter</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Live markets</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/converter"
            className="rounded-full border border-border/60 bg-card/60 p-2 text-muted-foreground hover:text-foreground"
            aria-label="Converter"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

function AuthButton() {
  const { user } = useAuth();
  if (user) {
    const avatar = user.user_metadata?.avatar_url as string | undefined;
    return (
      <Link
        to="/watchlist"
        className="rounded-full border border-border/60 bg-card/60 p-0.5"
        aria-label="Account"
      >
        {avatar ? (
          <img src={avatar} alt="" className="h-7 w-7 rounded-full" />
        ) : (
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
            <User className="h-3.5 w-3.5" />
          </div>
        )}
      </Link>
    );
  }
  return (
    <Link
      to="/login"
      className="rounded-full border border-border/60 bg-card/60 p-2 text-muted-foreground hover:text-foreground"
      aria-label="Sign in"
    >
      <User className="h-4 w-4" />
    </Link>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0a1a" },
      { title: "Crypto Gem Hunter — Live crypto prices, charts & news" },
      { name: "description", content: "Track crypto prices, charts, Fear & Greed index, market movers and news in one minimal app." },
      { property: "og:title", content: "Crypto Gem Hunter — Live crypto prices, charts & news" },
      { property: "og:description", content: "Track crypto prices, charts, Fear & Greed index, market movers and news in one minimal app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Crypto Gem Hunter — Live crypto prices, charts & news" },
      { name: "twitter:description", content: "Track crypto prices, charts, Fear & Greed index, market movers and news in one minimal app." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/252c186b-085d-468c-b3ad-d2e26bc4c66f/id-preview-e67ac8e5--1fdb99f6-a493-4c18-8da0-2e24474b8a97.lovable.app-1779200879314.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/252c186b-085d-468c-b3ad-d2e26bc4c66f/id-preview-e67ac8e5--1fdb99f6-a493-4c18-8da0-2e24474b8a97.lovable.app-1779200879314.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen pb-24">
          <TopBar />
          <main className="mx-auto max-w-screen-md px-4 py-4">
            <Outlet />
          </main>
          <BottomNav />
          <Toaster theme="dark" position="top-center" richColors />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
