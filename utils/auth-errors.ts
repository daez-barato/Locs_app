// Turns Supabase auth failures into messages that say what went wrong and what
// to do about it. The screen used to show one generic line for every failure.

type AuthErrorLike = { code?: string; message?: string; status?: number; name?: string } | null | undefined;

// Mirrors the users table's username_format / username_not_reserved checks, so
// the common mistakes are caught before the request.
const USERNAME_FORMAT = /^[a-zA-Z0-9_-]{3,20}$/;
const RESERVED = new Set(["admin", "api", "root", "null", "undefined", "settings", "support"]);

/** A hint for an invalid username, or null when it passes the local checks. */
export function usernameProblem(username: string): string | null {
  if (username.length < 3) return "Usernames need at least 3 characters.";
  if (username.length > 20) return "Usernames can be at most 20 characters.";
  if (!USERNAME_FORMAT.test(username)) {
    return "Usernames can only use letters, numbers, _ and -. No spaces.";
  }
  if (RESERVED.has(username.toLowerCase())) return `"${username}" is reserved. Try another username.`;
  return null;
}

// auth-js raises AuthRetryableFetchError both for a failed fetch (status 0)
// and for any 5xx, whose body it drops. Only status 0 means we never reached
// the server.
function isNetworkError(error: AuthErrorLike): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.status === 0 ||
    message.includes("network request failed") ||
    message.includes("failed to fetch")
  );
}

function isServerError(error: AuthErrorLike): boolean {
  return (error?.status ?? 0) >= 500;
}

export function friendlyLoginError(error: AuthErrorLike): string {
  if (isNetworkError(error)) return "Can't reach the server. Check your internet connection and try again.";
  switch (error?.code) {
    case "invalid_credentials":
      return "Wrong email or password. Check both for typos; passwords are case-sensitive.";
    case "email_not_confirmed":
      return "Your email isn't confirmed yet. Open the link we emailed you, then log in.";
    case "user_banned":
      return "This account has been suspended.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
  }
  if (isServerError(error)) return "Something went wrong on our side. Try again in a moment.";
  return "Couldn't log in. Check your email and password and try again.";
}

export function friendlySignupError(error: AuthErrorLike): string {
  if (isNetworkError(error)) return "Can't reach the server. Check your internet connection and try again.";
  switch (error?.code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "weak_password":
      return "That password is too weak. Use at least 6 characters, mixing letters and numbers.";
    case "email_address_invalid":
      return "That email address can't be used. Check it for typos.";
    case "signup_disabled":
      return "Sign-ups are closed right now.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many sign-up attempts. Wait a few minutes and try again.";
  }
  // A taken username fails the profile insert, which surfaces as a bare 500
  // (auth-js drops the body). The local checks already passed, so that is the
  // usual cause, but it can't be told apart from an outage.
  if (isServerError(error) || error?.message?.toLowerCase().includes("database error saving new user")) {
    return "That username may already be taken (names aren't case-sensitive). Try another one, or try again in a moment.";
  }
  return "Couldn't create the account. Check your details and try again.";
}
