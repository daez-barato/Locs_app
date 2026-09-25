// An event link opened while signed out lands on the login screen, since the
// event route is protected. Remember which event it was, so it can be opened
// once the person has signed in instead of being lost.
let pendingEventId: string | null = null;

/** Records the event a URL points at (https://locsapp.net/event/<id> or locs.com://event/<id>). */
export function rememberEventLink(url: string | null | undefined): void {
  if (!url) return;
  // In the app scheme "event" is the URL's host (locs.com://event/<id>); on
  // the website it is the first path segment.
  const match = url.match(/^[a-z][\w.+-]*:\/\/(?:[^/]*\/)?event\/([^/?#]+)/i);
  if (match) pendingEventId = decodeURIComponent(match[1]);
}

/** Returns the remembered event once, clearing it. */
export function takePendingEventId(): string | null {
  const id = pendingEventId;
  pendingEventId = null;
  return id;
}
