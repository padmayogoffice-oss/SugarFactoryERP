# Automatic Marathi transliteration

Every human-readable text field in the ERP now has a Marathi (Devanagari) companion
that fills itself while you type. The English value is never changed.

## How it works

* **One central rule, no per-page code.** All registry modules (88 submodules across 14
  modules) are generated from `Backend/src/registry`. `registry/transliteration.js`
  decides which fields are eligible; the backend model, validation and API, and the
  frontend form all follow from that single decision.
* **Storage.** For an eligible field `name` the Marathi text is stored beside it as
  `nameMr` (e.g. `name` / `nameMr`, `district` / `districtMr`). Existing fields and
  records are untouched; the new fields are optional, so **no migration is required**
  (MongoDB). Records created earlier simply have no Marathi value until edited or
  back-filled (see below).
* **Eligible fields:** STRING/TEXT fields holding names, places, addresses, contacts,
  remarks. **Never eligible:** numbers, dates, selects/enums, references, e-mail, phone,
  and text fields that hold identifiers - anything ending in `No`/`Code`/`Number`/`Id`/
  `Url`/`Key`/`Ref`/`Time`, plus `code`, `gstin`, `pan`, `ifsc`, `pincode`, `website`,
  `endpoint`, `apiKey`, `prefix`, `suffix`, `period`, `hsnCode`, template `subject`/`body`,
  and similar. See the lists in `registry/transliteration.js`. To override one field, add
  `translit: true` or `translit: false` to its `f(...)` definition.
* **Extra safety in the converter.** Even inside an eligible field, e-mail addresses,
  URLs, GSTIN/PAN/IFSC patterns, all-caps alphanumeric codes (e.g. `MH12AB1234`), times
  and `{{placeholders}}` are left as typed, digits stay as digits (`Snehal123` ->
  `स्नेहल123`), and text that is already Devanagari passes through.
* **UI.** `Frontend/src/components/ui/BilingualInput.jsx` shows English and
  "`<Label> (Marathi)`" side by side (stacked below the `sm` breakpoint). Conversion
  starts 350 ms after you stop typing. Editing the Marathi box by hand stops
  auto-updates for that field; the small **Auto** link regenerates it. Clearing the
  English box clears the Marathi box. The Marathi box is never "required".
* **Search.** The list search also matches the Marathi values.

## Provider, limits and setup

* **Primary provider: Google Input Tools** (`inputtools.google.com`, ML-based, **no API
  key, no cost, no account**). Requests go through your backend
  (`POST /api/transliterate`, login required, rate limited), never straight from the
  browser, and each distinct word is cached.
* **Limits.** It is an unofficial endpoint without a support/SLA commitment; Google could
  change or limit it. Your server needs outbound HTTPS access to it. Text is sent to
  Google word by word, so do not enable this for fields that contain confidential text
  you do not want to leave your network - or set `TRANSLITERATION_PROVIDER=offline`.
* **Fallback: offline rule engine** (`services/offlineMarathi.js`). Used automatically if
  Google is unreachable (`TRANSLITERATION_PROVIDER=auto`, the default). It is
  rule-based, so its output is *approximate* (it cannot know word-specific vowel
  lengths or retroflex letters; type `aa`, `ee`, `oo` for long vowels). The form shows
  "Approximate (offline mode) - please review" when it is used.
* Environment variables (all optional): see `Backend/.env.example`.
* No new npm packages. Requires Node.js 18+ (built-in `fetch`; the project already uses
  Node 20+ features via Express 5 / Mongoose 9).

## Back-filling existing records (optional)

```
cd Backend
npm run backfill:marathi -- --dry-run        # see what would change
npm run backfill:marathi                     # fill empty Marathi values
npm run backfill:marathi -- --only=farmer,department
```

Only empty `...Mr` values are set; English fields and existing Marathi values are never
modified. Opening an old record in the edit form also fills its empty Marathi values
automatically (they are saved when you press Save).

## Tests

```
cd Backend && npm test
```
