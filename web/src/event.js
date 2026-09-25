// Runs on /event/<id> only when the link did NOT open the app: universal links
// and App Links hand the URL to an installed app before this page loads. So by
// the time this runs the app is usually missing, and the job is to get the
// person to their store; the "Open in Locs" button covers the cases where the
// app is installed but the OS showed the page anyway (in-app browsers, links
// pasted into the address bar).
(function () {
  var config = window.LOCS;
  var match = location.pathname.match(/^\/event\/([^/?#]+)/);
  var eventId = match ? decodeURIComponent(match[1]) : null;

  var ua = navigator.userAgent;
  var isAndroid = /android/i.test(ua);
  // iPadOS reports itself as a Mac; touch support tells them apart.
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  var playUrl = "https://play.google.com/store/apps/details?id=" + config.androidPackage;
  var appStoreUrl = config.appStoreId ? "https://apps.apple.com/app/id" + config.appStoreId : null;
  var schemeUrl = eventId ? config.appScheme + "://event/" + encodeURIComponent(eventId) : null;
  // Chrome on Android opens the app from an intent: URL when installed and
  // follows browser_fallback_url to the Play Store when not, in one step.
  var intentUrl = eventId
    ? "intent://event/" + encodeURIComponent(eventId) +
      "#Intent;scheme=" + config.appScheme +
      ";package=" + config.androidPackage +
      ";S.browser_fallback_url=" + encodeURIComponent(playUrl) + ";end"
    : null;

  var open = document.getElementById("open-app");
  var play = document.getElementById("play-store");
  var appStore = document.getElementById("app-store");
  var note = document.getElementById("note");

  play.href = playUrl;
  if (appStoreUrl) {
    appStore.href = appStoreUrl;
  } else {
    appStore.setAttribute("aria-disabled", "true");
    appStore.querySelector("span").textContent = "App Store: coming soon";
  }

  if (!eventId) {
    open.hidden = true;
    note.textContent = "This link is missing its event. Ask whoever shared it to send it again.";
    return;
  }

  open.href = isAndroid ? intentUrl : schemeUrl;

  if (isAndroid) {
    appStore.hidden = true;
    note.textContent = "Taking you to Google Play…";
    // Without a tap Chrome may refuse to leave for an intent, so this is a
    // best effort; the buttons stay for when it's blocked.
    setTimeout(function () { location.href = intentUrl; }, 400);
  } else if (isIOS) {
    play.hidden = true;
    if (appStoreUrl) {
      note.textContent = "Taking you to the App Store…";
      setTimeout(function () { location.href = appStoreUrl; }, 1200);
    } else {
      note.textContent = "Locs is coming to the App Store soon.";
    }
  } else {
    open.hidden = true;
    note.textContent = "Open this link on your phone to join the event in the app.";
  }
})();
