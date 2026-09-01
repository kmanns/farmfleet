---
name: extending-experience-workspace
description: |
  Use this when extending Adobe da.live / Experience Workspace (EW) authoring —
  adding blocks, category/value pickers, or custom tools to the right-hand
  library/extensions panel. Covers the two extension mechanisms (the library
  config sheet: Blocks/Placeholders/Templates/Icons; and DA App SDK
  plugins/apps), how EW reads config from da.live NOT the repo, the
  preview/publish requirement for previews to load, and the exact library-plugin
  registration format. Also covers da.live source/config/preview admin APIs. Does
  NOT cover authoring EDS block JS/CSS itself (that's normal block development)
  or Universal Editor component-models.json (EW uses the DA library, not UE
  panels, in its canvas/inline editor).
allowed-tools: bash, read_file, write_file, edit_file
---

# Extending Experience Workspace (da.live)

Adobe **Experience Workspace (EW)** is da.live's authoring surface (canvas + inline
content editor) for Edge Delivery Services (EDS) sites whose content source is
`content.da.live`. This skill captures how to extend it: what shows up in the
right-hand library/extensions panel, and how.

## The single most important mental model

**EW reads its authoring configuration from da.live CONTENT + da.live CONFIG — not from
your Git repo.** This trips people up constantly:

- Your repo's `component-definition.json` / `component-models.json` (Universal Editor
  models) are **not** what the EW canvas library uses. UE `select` dropdowns do **not**
  render in the EW inline editor — EW edits the block's key/value table directly.
- What EW's library shows comes from the **`library` sheet in the da.live site config**
  (`https://da.live/config#/<org>/<site>`), which points at **content docs/sheets**
  (blocks, placeholders, plugins) that must be **previewed/published**.

So "extend EW" almost always means: write content docs/sheets and/or a tool file, then
register them in the da.live config `library` sheet, then preview/publish.

## Two extension mechanisms

### A. Library config sheet (declarative — Blocks, Placeholders, Templates, Icons)

The da.live config is a **multi-sheet** doc with a `library` tab. Each row = one library
panel entry. Columns: `title | path | format | ref | icon | experience`.

Reference: https://docs.da.live/administrators/guides/setup-library

- **Blocks** — `path` → a `blocks` sheet (`name`,`path` columns) that lists block example
  docs. Each block doc lives at `.da/library/blocks/<name>` and contains one instance of
  the block (a heading becomes the block/variant name). **Variants = multiple headed
  instances in one doc** → they appear as sub-items. An optional `library-metadata` table
  with a `Description` adds an info tooltip.
- **Placeholders** — `path` → a placeholders sheet (`key`,`value`). Inserts a **`{{key}}`
  token** into the doc (NOT the value). `experience` column = `{{<content>}}`. Great for a
  fixed value list; the block must resolve the token at runtime if it needs the raw value.
- **Templates / Icons** — analogous sheets (see the doc).

### B. DA App SDK — plugins and fullscreen apps (interactive micro-frontends)

Reference: https://docs.da.live/developers/guides/developing-apps-and-plugins

A plugin/app is a tiny micro-frontend in your **repo** under `/tools/`:
- `/tools/<name>.html` — imports the SDK: `<script src="https://da.live/nx/utils/sdk.js" type="module">`
- `/tools/<name>/<name>.js` — `import DA_SDK from 'https://da.live/nx/utils/sdk.js'`, then
  `const { context, token, actions } = await DA_SDK;`

Plugin-only SDK actions (for library plugins):
- `actions.sendText(str)` — insert text into the current document/cell (**insert the real
  value/slug here** — this is how you beat the Placeholders `{{token}}` limitation).
- `actions.sendHTML(html)` — insert HTML.
- `actions.closeLibrary()` — close the palette after inserting.

`context` carries the authenticated authoring context; `token` is an IMS token you can use
to call Commerce/other APIs live (e.g. fetch categories from Catalog Service on demand).

**Registering a library plugin** (appears in the right-hand library/extensions panel):
add a row to the config `library` sheet:

| column   | value                                                              |
|----------|--------------------------------------------------------------------|
| title    | Category Picker                                                    |
| path     | `https://<branch>--<site>--<org>.aem.page/tools/<name>.html` (the **.html** codebase URL) |
| format   | `dialog`                                                           |
| ref      | branch name (blank for main)                                      |
| icon     | optional `.png` URL                                               |

Notes learned the hard way:
- The **library-plugin `path` is the `.html` codebase URL** with `format: dialog`.
  The `https://da.live/app/<org>/<site>/tools/<name>` URL is for **fullscreen apps** (the
  `apps` sheet) or direct access — NOT the library-plugin row.
- **Fullscreen apps** register in an `apps` sheet (`title,description,image,path,ref`) with
  `path` = `https://da.live/app/<org>/<site>/tools/<name>`; view at
  `https://da.live/app/<org>/<site>/tools/<name>?ref=<branch>` (`ref=local` for localhost:3000).
- First run shows a **trust/consent dialog** ("about to access an app named…"). Expected.
- The plugin surfaced for us as a **"Category Picker" extension in the inline content
  editor's right-hand menu, beneath Placeholders** — i.e. library plugins land in the
  extensions area alongside Blocks/Placeholders.

## Recipe: add a searchable value picker that inserts the real value

This is the pattern that solves "authors shouldn't have to memorize slugs, and Placeholders
only inserts a `{{token}}`":

1. Build `/tools/<name>.html` + `/tools/<name>/<name>.js` (+ `.css`) using the DA App SDK.
2. In the JS: optionally fetch a **live** list (e.g. Commerce Catalog Service categories)
   with a graceful **fallback** to a known list so the UI always renders; render a search
   box + list; on click call `actions.sendText(realValue)` then `actions.closeLibrary()`.
3. Commit/push so the code bus serves it at `https://<branch>--<site>--<org>.aem.page/tools/<name>.html`.
4. Register a `library` row (format `dialog`, `.html` path, `ref` = branch).
5. Hard-refresh EW; the extension appears in the right-hand panel.

Keep it isolated under `/tools/` so it can't affect production blocks. It's a great
"art of the possible" POC even without being production-hardened.

## da.live admin APIs (how to script all of the above)

All require an **IMS bearer token**. In an authenticated da.live browser tab it lives in
localStorage under a key like
`adobeid_ims_access_token/...`; the token is the parsed object's **`tokenValue`**.
Cross-origin `fetch` from the da.live page to `admin.da.live` is CORS-allowed with an
`Authorization: Bearer` header; `admin.hlx.page` is **CORS-blocked from the browser** — call
it server-side (curl) with the token instead.

- **Read/write source content** (docs & sheets):
  `GET/POST https://admin.da.live/source/<org>/<site>/<path>` — POST body is
  `multipart/form-data` with a `data` field (Blob). HTML for docs; JSON for sheets
  (`{ total, limit, offset, data:[...], ":type":"sheet" }`).
- **List content:** `GET https://admin.da.live/list/<org>/<site>`.
- **Read/write config:** `GET https://admin.da.live/config/<org>/<site>` returns the
  multi-sheet config; write it back as `multipart/form-data` with a **`config`** field
  (JSON string). Preserve the existing sheet structure; append your `library` row.
- **Preview / publish** (required so library previews and pages load):
  `POST https://admin.hlx.page/preview/<org>/<site>/<ref>/<path>` and
  `.../live/<org>/<site>/<ref>/<path>`. Sheets use the `.json` path. **Code files
  (js/css/html tools) are NOT previewed via this API** (returns 415/400) — they sync
  automatically from the Git code bus on push/merge.

Enablement flag: EW requires `ew.enabled = true` in the config `flags` sheet
(`https://da.live/config#/<org>/<site>`). Other flags: `ew.canvasDefaultView`
(`layout`|`content`|`split`), `ew.canvasDefaultPanel` (`outline`|`files`|a library item
name like `blocks`), `ew.disableChat`.

## Gotchas we hit (save yourself the time)

- **Previews blank / "none previewed":** the block/plugin docs and sheets exist but were
  never previewed+published. Preview+publish every block doc, the blocks sheet, and the
  placeholders sheet. Facets/previews only appear once published.
- **Placeholders inserts `{{Label}}` not the value.** Either make the block resolve tokens
  at runtime (fetch the placeholders sheet, map `{{key}}`→value) or use a DA App SDK plugin
  that `sendText`s the real value. Keep placeholder `key` human-readable and `value` = the
  machine value (slug).
- **EW canvas can be flaky in automation** ("Could not reach the content store" / doesn't
  hydrate headless). Verify config/content via the admin APIs and the direct app URL; do
  final visual confirmation in a real logged-in browser.
- **Code bus vs content store are separate.** Repo files (blocks, tools) reach the site via
  Git → code bus on push/merge; da.live docs/sheets/config are separate content and need
  the admin APIs + preview/publish. A branch preview serves branch code; da.live content
  is not branch-aware the same way (it lives on the deployment you publish to).
- **isomorphic-git pushes** in some sandboxes only auth via `GIT_USERNAME`/`GIT_PASSWORD`
  env vars (URL-embedded PAT gets 401); retry if flaky.

## Quick reference: files & where they live

| Artifact | Location | Registered in |
|---|---|---|
| Block example doc | da.live content `.da/library/blocks/<name>` | blocks sheet `.da/library/blocks.json` |
| Blocks sheet | da.live content | config `library` row "Blocks" |
| Placeholders sheet | da.live content `placeholders.json` (`key`,`value`) | config `library` row "Placeholders" (`experience: {{<content>}}`) |
| Library plugin | repo `/tools/<name>.html` + `/tools/<name>/<name>.js` | config `library` row (`path`=.html URL, `format: dialog`) |
| Fullscreen app | repo `/tools/<name>.html` (App SDK) | `apps` sheet (`path`=`da.live/app/...`) |

## Sources
- Developing apps & plugins: https://docs.da.live/developers/guides/developing-apps-and-plugins
- Setup library: https://docs.da.live/administrators/guides/setup-library
- Experience Workspace: https://docs.da.live/about/early-access/experience-workspace
- Config API: https://docs.da.live/developers/api/config
