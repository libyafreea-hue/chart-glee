import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Crypto Gem Hunter" },
      {
        name: "description",
        content:
          "How Crypto Gem Hunter collects, uses and protects your data.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="prose prose-invert mx-auto max-w-2xl space-y-4 py-4 text-sm leading-relaxed text-foreground">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground">Last updated: May 19, 2026</p>

      <p>
        Crypto Gem Hunter ("the app", "we") respects your privacy. This policy
        explains what data we collect, why, and how it is protected.
      </p>

      <h2 className="text-lg font-semibold">1. Data we collect</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Account data</strong> — when you sign in with Google we
          receive your email, display name and avatar URL.
        </li>
        <li>
          <strong>App data</strong> — the coins you add to your watchlist and
          the holdings you record in your portfolio.
        </li>
        <li>
          <strong>Technical data</strong> — anonymous diagnostics needed to
          deliver the service (e.g. error logs).
        </li>
      </ul>
      <p>We do <strong>not</strong> collect location, contacts, SMS, photos or device files.</p>

      <h2 className="text-lg font-semibold">2. How we use it</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>To create and secure your account.</li>
        <li>To sync your watchlist and portfolio between devices.</li>
        <li>To display live prices, charts and news (data is fetched from public APIs such as CoinGecko and public RSS feeds).</li>
      </ul>

      <h2 className="text-lg font-semibold">3. Sharing</h2>
      <p>
        We do not sell your data. Personal data is stored on our managed
        backend (Lovable Cloud) and is only accessed by you. We do not share it
        with advertisers.
      </p>

      <h2 className="text-lg font-semibold">4. Data retention &amp; deletion</h2>
      <p>
        Your data is kept while your account is active. You can request
        deletion at any time by emailing{" "}
        <a className="underline" href="mailto:aymann.cryptogemhunter@gmail.com">
          aymann.cryptogemhunter@gmail.com
        </a>
        . We will permanently delete your profile, watchlist and portfolio
        within 30 days.
      </p>

      <h2 className="text-lg font-semibold">5. Security</h2>
      <p>
        Data is transmitted over HTTPS and stored with row-level security so
        only you can read your records.
      </p>

      <h2 className="text-lg font-semibold">6. Children</h2>
      <p>The app is not directed to children under 13.</p>

      <h2 className="text-lg font-semibold">7. Changes</h2>
      <p>
        We may update this policy. The "Last updated" date above reflects the
        most recent change.
      </p>

      <h2 className="text-lg font-semibold">8. Contact</h2>
      <p>
        Questions? Email{" "}
        <a className="underline" href="mailto:aymann.cryptogemhunter@gmail.com">
          aymann.cryptogemhunter@gmail.com
        </a>
        .
      </p>
    </article>
  );
}
