// Builds the locsapp.net static site into web/dist, for Cloudflare Pages.
//
//   npm run web:build             (reads EXPO_PUBLIC_SUPABASE_* from .env)
//   npm run web:deploy            (build, then wrangler pages deploy)
//
// The legal pages and docs/*.md are generated from constants/legal.ts, the same
// source the in-app screens render, so the three copies can't drift apart.

import ts from "typescript";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(webDir, "..");
const srcDir = join(webDir, "src");
const outDir = join(webDir, "dist");

const config = JSON.parse(readFileSync(join(webDir, "site.config.json"), "utf8"));
// legal.ts is plain data behind type annotations; transpile it with the
// project's TypeScript and import the result.
const legalSource = readFileSync(join(appDir, "constants", "legal.ts"), "utf8");
const legalJs = ts.transpileModule(legalSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const legal = await import(`data:text/javascript;base64,${Buffer.from(legalJs).toString("base64")}`);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY must be set (the confirmation page calls Supabase).");
  process.exit(1);
}

const warnings = [];

const escape = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Store badges as inline SVG marks, so the site loads nothing from elsewhere.
const APPLE_MARK = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.97-3.46-1.07-1.57-2.74-1.78-3.33-1.8-1.42-.14-2.77.83-3.49.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.59-.75 2.99-.75 1.4 0 1.79.75 3.01.72 1.24-.02 2.03-1.13 2.79-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.45-3.71zM14.08 5.84c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.77-.97 2.82 1.03.08 2.07-.52 2.71-1.28z"/></svg>`;
const PLAY_MARK = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.2c-.2.2-.3.6-.3 1v17.6c0 .4.1.8.3 1l.1.1 9.9-9.9v-.2L3.7 2.1l-.1.1zm13.3 13.2-3.3-3.3v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2h-.1zm-.1 0L13.5 12 3.6 21.9c.4.4 1 .4 1.7.1l11.5-6.6M16.8 8.6 5.3 2c-.7-.4-1.3-.3-1.7.1l9.9 9.9 3.3-3.4z"/></svg>`;

const playUrl = `https://play.google.com/store/apps/details?id=${config.androidPackage}`;
const appStoreUrl = config.appStoreId ? `https://apps.apple.com/app/id${config.appStoreId}` : null;

function storeButtons() {
  const apple = appStoreUrl
    ? `<a class="button" href="${appStoreUrl}">${APPLE_MARK}<span>Download on the App Store</span></a>`
    : `<a class="button" aria-disabled="true">${APPLE_MARK}<span>App Store: coming soon</span></a>`;
  return `${apple}\n      <a class="button" href="${playUrl}">${PLAY_MARK}<span>Get it on Google Play</span></a>`;
}

function page({ title, description, body, scripts = [], path, extraHead = "" }) {
  const fullTitle = title === "Locs" ? "Locs" : `${title} · Locs`;
  const url = `${config.siteUrl}${path}`;
  // Safari's Smart App Banner, once there is an App Store listing to point at.
  const appBanner = config.appStoreId
    ? `\n  <meta name="apple-itunes-app" content="app-id=${config.appStoreId}">`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escape(fullTitle)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="theme-color" content="#1c131f">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta property="og:site_name" content="Locs">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${config.siteUrl}/icon.jpg">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">${appBanner}${extraHead}
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header"><a href="/"><img src="/icon.jpg" alt="" width="36" height="36">Locs</a></header>
  <main class="page">
${body}
  </main>
  <footer class="site-footer">
    <a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/delete-account">Delete account</a><a href="mailto:${legal.LEGAL_CONTACT_EMAIL}">Contact</a>
    <div>&copy; ${new Date().getFullYear()} Locs</div>
  </footer>
${scripts.map((src) => `  <script src="${src}"></script>`).join("\n")}
</body>
</html>
`;
}

// Values the browser scripts need, in one small file the pages load first.
const siteJs = `window.LOCS = ${JSON.stringify({
  appScheme: config.appScheme,
  androidPackage: config.androidPackage,
  appStoreId: config.appStoreId || null,
  supabaseUrl,
  supabaseKey,
})};\n`;

const pages = {
  "index.html": page({
    title: "Locs",
    path: "/",
    description: "Create prediction events, stake virtual coins with friends, and see who calls it right.",
    body: `    <section class="hero">
      <img class="app-icon" src="/icon.jpg" alt="Locs app icon" width="120" height="120">
      <h1>Call it before it happens.</h1>
      <p>Create prediction events, stake virtual coins with friends, and see who calls it right.</p>
      <div class="actions">
      ${storeButtons()}
      </div>
      <p class="note">For adults 18+. Coins are virtual and have no real-money value.</p>
    </section>
    <section class="features">
      <div class="feature"><h2>Make an event</h2><p>Ask anything, add the options, and share the link.</p></div>
      <div class="feature"><h2>Stake your coins</h2><p>Back the outcome you believe in. Run low and free coins top you up every 6 hours.</p></div>
      <div class="feature"><h2>Collect the pot</h2><p>When the event is decided, winners split what was staked.</p></div>
    </section>`,
  }),

  // Served for every /event/<id> by the rewrite in _redirects.
  "open-event.html": page({
    title: "You're invited to an event on Locs",
    path: "/event",
    description: "Open this event in the Locs app to see the predictions and place your stake.",
    extraHead: `\n  <meta name="robots" content="noindex">`,
    scripts: ["/site.js", "/event.js"],
    body: `    <section class="hero">
      <img class="app-icon" src="/icon.jpg" alt="Locs app icon" width="120" height="120">
      <h1>You're invited to an event</h1>
      <p>Predictions, stakes and the pot live in the Locs app.</p>
      <div class="actions">
        <a class="button primary" id="open-app" href="#">Open in Locs</a>
        <a class="button" id="app-store" href="#">${APPLE_MARK}<span>Download on the App Store</span></a>
        <a class="button" id="play-store" href="${playUrl}">${PLAY_MARK}<span>Get it on Google Play</span></a>
      </div>
      <p class="note" id="note"></p>
      <p class="note">After installing, open the link again to go straight to the event.</p>
    </section>`,
  }),

  "auth/confirm.html": page({
    title: "Confirm your email",
    path: "/auth/confirm",
    description: "Confirm your Locs account.",
    extraHead: `\n  <meta name="robots" content="noindex">\n  <meta name="referrer" content="no-referrer">`,
    scripts: ["/site.js", "/confirm.js"],
    body: `    <section class="hero">
      <img class="app-icon" src="/icon.jpg" alt="Locs app icon" width="120" height="120">
      <h1 id="title">Confirming your email…</h1>
      <div class="spinner" id="spinner" role="status" aria-label="Confirming"></div>
      <p class="status" id="status" aria-live="polite"></p>
    </section>`,
  }),

  // Google Play asks for a page explaining deletion that works without the app.
  "delete-account.html": page({
    title: "Delete your account",
    path: "/delete-account",
    description: "How to delete your Locs account and data.",
    body: `    <article class="legal">
      <h1>Delete your Locs account</h1>
      <p class="effective">Deleting your account is permanent.</p>
      <h2>In the app</h2>
      <p>Open your profile, tap the settings icon, then <strong>Delete account</strong> and confirm.</p>
      <h2>Without the app</h2>
      <p>Email <a href="mailto:${legal.LEGAL_CONTACT_EMAIL}?subject=Delete%20my%20Locs%20account">${legal.LEGAL_CONTACT_EMAIL}</a> from the address on your account and ask us to delete it. We'll confirm once it's done.</p>
      <h2>What is deleted</h2>
      <p>Your profile, username, events and questions, bets, coin balance and avatars. Coins other people staked on your still-open events are refunded to them. Uploaded event images may remain in backups for a short time before they are purged. See the <a href="/privacy">Privacy Policy</a> for details.</p>
    </article>`,
  }),

  "404.html": page({
    title: "Page not found",
    path: "/404",
    description: "This page doesn't exist.",
    body: `    <section class="hero">
      <h1>Page not found</h1>
      <p><a href="/">Go to the Locs home page</a></p>
    </section>`,
  }),
};

function legalPage(doc, path) {
  const sections = doc.sections
    .map(
      (s) =>
        `      <h2>${escape(s.heading)}</h2>\n` +
        s.paragraphs.map((p) => `      <p>${escape(p)}</p>`).join("\n")
    )
    .join("\n");
  return page({
    title: doc.title,
    path,
    description: `The Locs ${doc.title}.`,
    body: `    <article class="legal">
      <h1>${escape(doc.title)}</h1>
      <p class="effective">Effective ${escape(legal.LEGAL_EFFECTIVE_DATE)}. Questions: <a href="mailto:${legal.LEGAL_CONTACT_EMAIL}">${legal.LEGAL_CONTACT_EMAIL}</a></p>
${sections}
    </article>`,
  });
}

pages["terms.html"] = legalPage(legal.TERMS_OF_SERVICE, "/terms");
pages["privacy.html"] = legalPage(legal.PRIVACY_POLICY, "/privacy");

// ---------------------------------------------------------------- link files

// iOS fetches this to decide which paths open the app. It needs the Apple
// Team ID, which exists only once the Apple Developer account is set up.
const appleAppSiteAssociation = config.appleTeamId
  ? {
      applinks: {
        details: [
          {
            appIDs: [`${config.appleTeamId}.${config.iosBundleId}`],
            components: [{ "/": "/event/*" }, { "/": "/auth/confirm", "?": { token_hash: "?*" } }],
          },
        ],
      },
    }
  : null;
if (!appleAppSiteAssociation) {
  warnings.push("appleTeamId is empty in web/site.config.json: iOS universal links are off until it is set.");
}

// Android checks this before letting the app claim https links (autoVerify).
// Every certificate the app can be signed with must be listed: the EAS upload
// key, and Google's app signing key once the app is on Play.
const assetLinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: config.androidPackage,
      sha256_cert_fingerprints: config.androidSha256Fingerprints,
    },
  },
];
if (config.androidSha256Fingerprints.length < 2) {
  warnings.push("Only one Android fingerprint in web/site.config.json: add the Play Console app signing key's SHA-256 before release.");
}
if (!config.appStoreId) {
  warnings.push("appStoreId is empty in web/site.config.json: iPhone visitors see 'coming soon' instead of the App Store.");
}

// Cloudflare Pages: every /event/<id> gets the event page, keeping the URL.
const redirects = `/event/*  /open-event  200
/event    /  302
`;

// The association files must be served as JSON, and must not be redirected.
const headers = `/.well-known/apple-app-site-association
  Content-Type: application/json
/.well-known/assetlinks.json
  Content-Type: application/json
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/auth/*
  Referrer-Policy: no-referrer
  Cache-Control: no-store
`;

// ---------------------------------------------------------------- write

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "auth"), { recursive: true });
mkdirSync(join(outDir, ".well-known"), { recursive: true });

cpSync(srcDir, outDir, { recursive: true });
writeFileSync(join(outDir, "site.js"), siteJs);
for (const [file, html] of Object.entries(pages)) writeFileSync(join(outDir, file), html);
if (appleAppSiteAssociation) {
  writeFileSync(join(outDir, ".well-known", "apple-app-site-association"), JSON.stringify(appleAppSiteAssociation, null, 2) + "\n");
}
writeFileSync(join(outDir, ".well-known", "assetlinks.json"), JSON.stringify(assetLinks, null, 2) + "\n");
writeFileSync(join(outDir, "_redirects"), redirects);
writeFileSync(join(outDir, "_headers"), headers);

// The Markdown copies kept in docs/ for anyone reading the repository.
function markdown(doc) {
  const body = doc.sections
    .map((s) => `## ${s.heading}\n\n${s.paragraphs.join("\n\n")}`)
    .join("\n\n");
  return `<!-- Generated from constants/legal.ts by \`npm run web:build\`; edit that file instead. -->\n\n# ${doc.title}\n\n_Effective ${legal.LEGAL_EFFECTIVE_DATE}. Contact: ${legal.LEGAL_CONTACT_EMAIL}. Published at ${config.siteUrl}/${doc === legal.TERMS_OF_SERVICE ? "terms" : "privacy"}._\n\n${body}\n`;
}
writeFileSync(join(appDir, "docs", "TERMS_OF_SERVICE.md"), markdown(legal.TERMS_OF_SERVICE));
writeFileSync(join(appDir, "docs", "PRIVACY_POLICY.md"), markdown(legal.PRIVACY_POLICY));

console.log(`Built ${Object.keys(pages).length} pages into web/dist`);
for (const w of warnings) console.warn(`warning: ${w}`);
