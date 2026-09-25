/**
 * Addresses on locsapp.net. Links under /event and /auth/confirm open the app
 * directly when it is installed (iOS universal links, Android App Links, set up
 * in app.json and by the files in web/public/.well-known); otherwise the
 * website shows the page and sends people to their app store.
 */
export const SITE_URL = "https://locsapp.net";

/** What gets shared: works for anyone, with or without the app installed. */
export function eventUrl(eventId: string): string {
  return `${SITE_URL}/event/${encodeURIComponent(eventId)}`;
}

/** Where the sign-up confirmation email points (see locs_server/supabase/templates). */
export const EMAIL_CONFIRM_URL = `${SITE_URL}/auth/confirm`;
