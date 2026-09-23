# Locs_app

The Locs mobile app — Expo (SDK 57) with Expo Router, talking directly to
Supabase. The schema and business logic live in the sibling
[`locs_server`](../locs_server) directory.

## Running it

```bash
npm install
npx expo start        # then scan the QR code
```

`.env` points at the hosted Supabase project and is gitignored:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...      # publishable/anon key, safe on the client
```

To run against the local stack instead, start it in `locs_server` and point the
URL at `http://127.0.0.1:54321`. Note a phone can't reach `127.0.0.1` on your
machine, so local Supabase is for simulators and tests, not device testing.

```bash
npm test          # jest
npm run typecheck # tsc --noEmit
npm run gen:types # regenerate types from the database
```

## How data flows

There is no REST API. Screens call service functions, which call Postgres RPCs
through `supabase.rpc(...)`.

```
screen  →  services/ | api/  →  supabase.rpc()  →  Postgres function
```

`services/` and `api/` are the same layer with different histories: `api/` held
the old axios client for a retired Express server and was rewritten in place.
New code should go in `services/`.

**The service layer's job is translation.** The RPCs return database-shaped rows
(`event_id`, `template_title`, `template_image_url`, a flat creator) and the
screens want view-shaped objects (`id`, `title`, `thumbnail_url`, a nested
`creator`). Every mismatch between those two shapes has, at some point, shipped
as a runtime crash. Keep the mapping in the service layer and out of components.

Two things the service layer must always do:

- **Map row fields explicitly.** Passing an RPC row straight into `Event()` left
  every card with `id: undefined`, which routed taps to `/event/undefined` and
  gave every row the same React key.
- **Sign thumbnails.** `event-thumbnail` is a private bucket, so rows carry an
  object path that renders as a broken image. Use `signThumbnails()` for lists
  (one request per page) and `createSignedUrl` for a single record.

## Types

`types/database.types.ts` is generated from the live schema and passed to
`createClient<Database>`, so `supabase.rpc()` checks argument names and return
shapes at compile time.

```bash
npm run gen:types    # after any schema change in locs_server
```

This catches the mistakes that used to reach devices: a wrong parameter name
(`user_id` where the function declares `username`), a misread column
(`row.id` when the RPC returns `event_id`), a renamed field.

**Three RPCs return `jsonb` and cannot be generated:**
`get_event_information_db`, `get_event_bets_db`, `get_template_by_id`. Postgres
has no schema to introspect for a jsonb return, so the generator emits `Json`.
Their shapes are declared by hand in `types/rpc.ts` — the one place a payload is
asserted rather than derived. If you change that SQL, update that file too.

`types/rpc.ts` also re-exports row types for the table-returning RPCs
(`CreatedEventRow`, `SearchEventRow`, …). Mapping functions should take those
rather than `any`, otherwise field typos compile happily and fail on device.

## Tests

```bash
npm test
```

| File | Covers |
|---|---|
| `__tests__/event-mapping.test.ts` | the event payload → screen translation, bet id resolution |
| `__tests__/template-profile-mapping.test.ts` | template nesting, profile row mapping, RPC parameter names |
| `__tests__/image-upload.test.ts` | upload size limits, content types, failure paths |
| `__tests__/thumbnails.test.ts` | batched signing, de-duplication, failure fallback |

These cover the service layer, not components — that's deliberate, because every
bug worth regression-testing so far has been a shape or contract mismatch rather
than a rendering problem. Database behaviour is covered separately by the pgTAP
suites in `locs_server`.

Jest note: mock factories are hoisted above imports, so a factory must not close
over anything declared below it. Build the mock inline and wire behaviour in
`beforeEach`.

## Project structure

```
app/              expo-router routes (file-based)
  (auth)/         login & register
  (tabs)/         feed, explore, parleys, profile
  event/[eventId] event detail, betting, lock/decide/delete
  studio/[studio] event & template editor
components/       shared UI (cards, modals)
services/         data layer — RPC calls + shape translation
api/              older data layer, same role (see above)
providers/        auth and coin context
hooks/            context accessors
lib/supabase.ts   the typed client
types/            generated schema, hand-written jsonb contracts, view models
utils/            uploads, thumbnail signing, secure storage
```

## Auth

Supabase Auth. A `handle_new_user` trigger creates the `public.users` profile row
when an auth user is created, so username lives in `raw_user_meta_data` at signup.

Session tokens are stored through `utils/large-secure-store.ts`, which chunks
values across `expo-secure-store` keys — Supabase sessions exceed SecureStore's
~2 KB per-value limit. It falls back to `localStorage` on web and a no-op during
server prerender, because `expo-secure-store` has no implementation in either and
Expo Router prerenders routes in a plain Node process even for a native `expo
start`.

A restored session resolves in two steps — claims first, profile second. Route
rendering is gated on `isInitializing` (true only until the first resolution) so
the login screen can't flash over a valid session, while later transitions don't
blank the screen.

## Building

Builds run on EAS. Bundle id is `com.daez.locsapp` on both platforms, and
`appVersionSource: "remote"` means EAS owns the version/build numbers — you don't
bump them by hand.

| Profile | Output | For |
|---|---|---|
| `development` | APK with dev client | debugging against a dev server |
| `preview` | **APK** / iOS simulator build | sideloading and sharing a test build |
| `production` | **AAB** / iOS archive | Play Store and App Store |

```bash
npx eas-cli build --platform android --profile preview     # installable APK
npx eas-cli build --platform android --profile production  # AAB for Play
npx eas-cli build --platform ios --profile production      # needs an Apple account
```

The first Android production build will offer to generate a keystore — let EAS
manage it. Losing that keystore means you can never update the listing, so if you
ever generate one yourself, back it up.

### Before changing native config

`app.json` changes only take effect through a new build, and some mistakes only
appear at build time. Check them locally first — this generates the native
projects the build would produce, without building:

```bash
npx expo prebuild --platform android --no-install --clean
npx expo prebuild --platform ios --no-install --clean
rm -rf android ios      # generated; not committed
```

That check is what caught iOS rejecting `#772497ff`: 8-digit hex with alpha is
valid on Android and invalid on iOS, and it silently left the iOS project on a
placeholder bundle id.

Also note that libraries merge their own permissions into the Android manifest,
so deleting one from `android.permissions` is not enough — it has to go in
`android.blockedPermissions` to be stripped at merge time.

## Submitting to the stores

```bash
npx eas-cli submit --platform android --profile production
npx eas-cli submit --platform ios --profile production
```

Still needed, none of which can be done from the repo:

- **Apple Developer Program** ($99/yr) and **Google Play Console** ($25 once)
- **Store listing assets**: screenshots per device size, description, category,
  content rating questionnaire
- **A privacy policy URL** — both stores require one, and this app collects
  account data (email, username, uploaded images)
- **Play data safety form**, declaring what the app collects and why

Known gap: shared event links use the app's custom scheme, so they only open for
people who already have the app installed. Universal Links (iOS) and App Links
(Android) need a domain you control serving `apple-app-site-association` and
`assetlinks.json`. `app.json` currently points an intent filter at
`Locs_app.com`, which does not resolve.
