/**
 * A link opened while signed out must survive the trip through the login
 * screen, and be opened only once afterwards.
 */
import { rememberEventLink, takePendingEventId } from "@/utils/pending-link";

describe("pending event link", () => {
  it("remembers an https event link", () => {
    rememberEventLink("https://locsapp.net/event/abc-123");
    expect(takePendingEventId()).toBe("abc-123");
  });

  it("remembers an app-scheme event link", () => {
    rememberEventLink("locs.com://event/abc-123");
    expect(takePendingEventId()).toBe("abc-123");
  });

  it("hands the event out only once", () => {
    rememberEventLink("https://locsapp.net/event/abc-123");
    takePendingEventId();
    expect(takePendingEventId()).toBeNull();
  });

  it("ignores links that aren't events", () => {
    rememberEventLink("https://locsapp.net/auth/confirm?token_hash=x");
    rememberEventLink(null);
    expect(takePendingEventId()).toBeNull();
  });
});
