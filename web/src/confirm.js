// Runs on /auth/confirm when the confirmation email was opened somewhere the
// app isn't installed, typically a computer. On a phone with Locs installed the
// link opens the app instead (app/auth/confirm.tsx), which also signs the
// person in. Here the address is confirmed and the person is told to log in on
// their phone.
(function () {
  var config = window.LOCS;
  var params = new URLSearchParams(location.search);
  var tokenHash = params.get("token_hash");
  var type = params.get("type") || "email";

  var spinner = document.getElementById("spinner");
  var status = document.getElementById("status");
  var title = document.getElementById("title");

  function show(kind, heading, message) {
    spinner.hidden = true;
    title.textContent = heading;
    status.textContent = message;
    status.className = "status " + kind;
  }

  if (!tokenHash) {
    show("error", "Link incomplete", "This confirmation link is missing its code. Open the most recent email from Locs and use the button in it.");
    return;
  }

  // The publishable key is the same one shipped inside the app; verifying a
  // token hash needs nothing more.
  fetch(config.supabaseUrl + "/auth/v1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: config.supabaseKey },
    body: JSON.stringify({ type: type, token_hash: tokenHash }),
  })
    .then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (response.ok) {
          show("ok", "Email confirmed", "You're all set. Open Locs on your phone and log in.");
          return;
        }
        var code = body.error_code || body.code;
        if (code === "otp_expired") {
          show("error", "Link expired", "This link has expired or was already used. If you can't log in, request a new confirmation email from the Locs login screen.");
        } else {
          show("error", "Couldn't confirm", "Something went wrong confirming your email. Try the link again, or request a new one from the Locs login screen.");
        }
      });
    })
    .catch(function () {
      show("error", "No connection", "We couldn't reach our servers. Check your connection and reload this page.");
    });
})();
