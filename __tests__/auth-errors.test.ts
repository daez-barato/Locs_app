/**
 * The login screen showed one generic line for every failure. These map
 * Supabase's error codes to messages that say what to fix.
 */
import { friendlyLoginError, friendlySignupError, usernameProblem } from "@/utils/auth-errors";

describe("friendlyLoginError", () => {
  it("explains wrong credentials", () => {
    expect(friendlyLoginError({ code: "invalid_credentials" })).toMatch(/wrong email or password/i);
  });
  it("tells unconfirmed users to confirm first", () => {
    expect(friendlyLoginError({ code: "email_not_confirmed" })).toMatch(/confirm/i);
  });
  it("recognises being offline", () => {
    expect(friendlyLoginError({ name: "AuthRetryableFetchError", status: 0 })).toMatch(/connection/i);
    expect(friendlyLoginError({ message: "Network request failed" })).toMatch(/connection/i);
  });
  it("does not blame the connection for a server error", () => {
    // auth-js uses the same error class for 5xx responses.
    const message = friendlyLoginError({ name: "AuthRetryableFetchError", status: 500, message: "{}" });
    expect(message).not.toMatch(/connection/i);
    expect(message).toMatch(/our side/i);
  });
  it("falls back to a generic hint for unknown errors", () => {
    expect(friendlyLoginError({ code: "something_new" })).toMatch(/couldn't log in/i);
    expect(friendlyLoginError(undefined)).toMatch(/couldn't log in/i);
  });
});

describe("friendlySignupError", () => {
  it("points existing users to login", () => {
    expect(friendlySignupError({ code: "user_already_exists" })).toMatch(/already exists/i);
  });
  it("reads the profile-insert failure as a likely taken username", () => {
    expect(friendlySignupError({ message: "Database error saving new user" })).toMatch(/username/i);
    // What auth-js actually delivers when the username_unique_ci insert fails.
    expect(friendlySignupError({ name: "AuthRetryableFetchError", status: 500, message: "{}" })).toMatch(/username/i);
  });
  it("explains weak passwords and rate limits", () => {
    expect(friendlySignupError({ code: "weak_password" })).toMatch(/password/i);
    expect(friendlySignupError({ code: "over_email_send_rate_limit" })).toMatch(/wait/i);
  });
});

describe("usernameProblem", () => {
  it.each(["ab", "a".repeat(21), "has space", "emoji😀", "dot.name"])("rejects %p", (name) => {
    expect(usernameProblem(name)).not.toBeNull();
  });
  it("rejects reserved names regardless of case", () => {
    expect(usernameProblem("Admin")).toMatch(/reserved/);
  });
  it.each(["maya", "jonas_2", "cool-man", "abc"])("accepts %p", (name) => {
    expect(usernameProblem(name)).toBeNull();
  });
});
