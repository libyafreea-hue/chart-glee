import { Capacitor } from "@capacitor/core";

const BANNER_IDS = [
  "ca-app-pub-4980157773430355/8689745472",
  "ca-app-pub-4980157773430355/6892649316",
  "ca-app-pub-4980157773430355/1696961713",
  "ca-app-pub-4980157773430355/9380010617",
];

// Native ads aren't supported by @capacitor-community/admob; we use these as
// extra inline banners inside feeds (news list, market list, watchlist).
const NATIVE_LIKE_BANNER_IDS = [
  "ca-app-pub-4980157773430355/4489434563",
  "ca-app-pub-4980157773430355/1863271228",
  "ca-app-pub-4980157773430355/8066928944",
];

const INTERSTITIAL_IDS = [
  "ca-app-pub-4980157773430355/2124337129",
  "ca-app-pub-4980157773430355/3221796377",
  "ca-app-pub-4980157773430355/3165956058",
  "ca-app-pub-4980157773430355/6670086797",
];

const NAV_PER_INTERSTITIAL = 4;

let initPromise: Promise<boolean> | null = null;
let currentBannerId: string | null = null;
let navCount = 0;
let interstitialIndex = 0;
let bannerIndex = 0;
let nativeBannerIndex = 0;

function isNative() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export async function initAds(): Promise<boolean> {
  if (!isNative()) return false;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.initialize({ initializeForTesting: false });
      return true;
    } catch (e) {
      console.warn("AdMob init failed", e);
      return false;
    }
  })();
  return initPromise;
}

/** Show a rotating bottom banner. Safe to call from any screen. */
export async function showBanner(kind: "screen" | "inline" = "screen") {
  if (!(await initAds())) return;
  try {
    const { AdMob, BannerAdPosition, BannerAdSize } = await import(
      "@capacitor-community/admob"
    );
    const adId =
      kind === "inline"
        ? NATIVE_LIKE_BANNER_IDS[nativeBannerIndex++ % NATIVE_LIKE_BANNER_IDS.length]
        : BANNER_IDS[bannerIndex++ % BANNER_IDS.length];
    if (currentBannerId === adId) return;
    await AdMob.removeBanner().catch(() => {});
    await AdMob.showBanner({
      adId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 72, // lift above bottom nav
    });
    currentBannerId = adId;
  } catch (e) {
    console.warn("showBanner failed", e);
  }
}

export async function hideBanner() {
  if (!isNative()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.removeBanner();
    currentBannerId = null;
  } catch {
    /* noop */
  }
}

/** Call on every route change. Fires interstitial every 4 navigations. */
export async function trackNavigationForInterstitial() {
  if (!isNative()) return;
  navCount += 1;
  if (navCount < NAV_PER_INTERSTITIAL) return;
  navCount = 0;
  await showInterstitial();
}

async function showInterstitial() {
  if (!(await initAds())) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    const adId = INTERSTITIAL_IDS[interstitialIndex++ % INTERSTITIAL_IDS.length];
    await AdMob.prepareInterstitial({ adId });
    await AdMob.showInterstitial();
  } catch (e) {
    console.warn("showInterstitial failed", e);
  }
}
