// In the Capacitor APK the app is served from a `https://localhost` (Android)
// scheme — there is no Cloudflare worker behind it, so any relative request
// (`/_serverFn/...`, `/api/...`) 404s and pages that depend on server functions
// crash with things like "r.map is not a function".
//
// Patch global fetch on the device so root-relative URLs that need a real
// backend are sent to the published worker instead.

const PROD_ORIGIN = "https://chart-glee.lovable.app";

function shouldProxy(url: string): boolean {
  // Only rewrite root-relative URLs that map to backend endpoints.
  return url.startsWith("/_serverFn") || url.startsWith("/api/");
}

export function installCapacitorFetchProxy() {
  if (typeof window === "undefined") return;
  // Lazy-require so this stays a no-op outside the native shell.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Capacitor = (window as any).Capacitor;
  const isNative =
    Capacitor &&
    typeof Capacitor.isNativePlatform === "function" &&
    Capacitor.isNativePlatform();
  if (!isNative) return;

  const original = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === "string" && input.startsWith("/") && shouldProxy(input)) {
        return original(PROD_ORIGIN + input, init);
      }
      if (input instanceof URL && input.pathname && shouldProxy(input.pathname) && input.origin === window.location.origin) {
        return original(PROD_ORIGIN + input.pathname + input.search, init);
      }
      if (input instanceof Request) {
        const u = new URL(input.url);
        if (u.origin === window.location.origin && shouldProxy(u.pathname)) {
          const newReq = new Request(PROD_ORIGIN + u.pathname + u.search, input);
          return original(newReq, init);
        }
      }
    } catch {
      /* fall through */
    }
    return original(input as any, init);
  }) as typeof window.fetch;
}
