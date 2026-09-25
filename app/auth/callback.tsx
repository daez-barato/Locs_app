import { Redirect } from "expo-router";

/**
 * Safety net for the OAuth redirect (locs.com://auth/callback). In practice
 * WebBrowser.openAuthSessionAsync (utils/oauth.ts) intercepts this URL before
 * the router ever sees it, but if a deep link slips through anyway this keeps
 * it from showing "unmatched route" — the root layout's guards send it
 * straight to the right place.
 */
export default function AuthCallback() {
    return <Redirect href="/" />;
}
