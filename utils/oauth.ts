import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";

// Lets openAuthSessionAsync's own listener catch the redirect and resolve the
// promise below, instead of the OS just handing it to whatever screen is
// mounted (which would otherwise show "unmatched route" on some platforms).
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = "google" | "apple";

/** Thrown when the person backs out of a sign-in flow; never shown as an error. */
export class OAuthCancelledError extends Error {
  constructor() {
    super("Sign-in was cancelled.");
    this.name = "OAuthCancelledError";
  }
}

function callbackRedirectUrl(): string {
  return Linking.createURL("auth/callback");
}

/** Pulls query/fragment params out of the URL the browser redirected back to. */
function parseCallbackParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  // The redirect can carry params after "?" (PKCE code) or after "#" (implicit
  // tokens/errors) depending on the flow, so scan both.
  const searchPart = url.split("?")[1]?.split("#")[0];
  const hashPart = url.split("#")[1];
  for (const part of [searchPart, hashPart]) {
    if (!part) continue;
    for (const pair of part.split("&")) {
      const [key, value] = pair.split("=");
      if (!key) continue;
      params[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
    }
  }
  return params;
}

/** Opens Google's sign-in in the system browser and exchanges the result for a session. */
export async function signInWithGoogle(): Promise<void> {
  const redirectTo = callbackRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Couldn't start Google sign-in. Try again.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new OAuthCancelledError();
  }
  if (result.type !== "success" || !result.url) {
    throw new Error("Google sign-in didn't complete. Try again.");
  }

  const params = parseCallbackParams(result.url);
  if (params.error) {
    if (params.error === "access_denied") throw new OAuthCancelledError();
    throw new Error(params.error_description || "Google sign-in failed. Try again.");
  }
  if (!params.code) {
    throw new Error("Google sign-in didn't complete. Try again.");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
  if (exchangeError) throw exchangeError;
}

export type EnabledProviders = { google: boolean; apple: boolean };

/**
 * Which social providers are switched on in Supabase. Offering a disabled one
 * sent people to a browser page showing a raw "provider is not enabled" error,
 * so the login screen only shows what works. Reads the public auth settings;
 * if that fails (offline), assumes both are on and lets sign-in report errors.
 */
export async function getEnabledProviders(): Promise<EnabledProviders> {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "" },
    });
    if (!response.ok) throw new Error(`auth settings returned ${response.status}`);
    const settings = await response.json();
    return {
      google: settings?.external?.google === true,
      apple: settings?.external?.apple === true,
    };
  } catch (error) {
    console.error("Error reading enabled sign-in providers:", error);
    return { google: true, apple: true };
  }
}

/** True only where the native Apple button can actually be shown. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Native "Sign in with Apple" sheet, exchanging the identity token directly (no browser round-trip needed). */
export async function signInWithApple(): Promise<void> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error: any) {
    // The system sheet's own "Cancel" surfaces as this error code.
    if (error?.code === "ERR_REQUEST_CANCELED") throw new OAuthCancelledError();
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error("Apple didn't return a sign-in token. Try again.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;
}
