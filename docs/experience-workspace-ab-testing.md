# Does Experience Workspace support A/B experimentation?

**Short answer: Yes — experimentation is fully available, but it does not live "inside"
Experience Workspace (EW) as a bespoke EW feature the way it felt built-in to the
Universal Editor. In the da.live / Edge Delivery world, A/B testing comes from the
same two mechanisms every EDS site uses, and EW is simply the authoring surface you
use to create the variant content and (optionally) push to Adobe Target.**

There are **three** distinct paths, from most-native to most-enterprise:

---

## 1. AEM Experimentation plugin (the native EDS A/B path) — recommended default

This is the Edge Delivery Services experimentation capability
(`https://www.aem.live/docs/experimentation`). It is **document/metadata driven**, so
it works identically whether you author in da.live docs, the EW canvas, or Universal
Editor — the experiment lives in content + page metadata, not in the editor UI.

How it works:
- **Control** = your existing page.
- **Challenger(s)** = copies of the page placed under an `/experiments/<experiment-id>/`
  folder, edited to test different hero blocks, layouts, CTAs, etc.
- On the **control page** you add metadata rows:
  - `Experiment` = the experiment ID (e.g. `OPT-0134`)
  - `Experiment Variants` = URLs of the challenger pages (plus split %)
- The plugin (client-side, added in `scripts.js`) reads that metadata, splits traffic,
  and reports which variant wins. It also supports **audiences** (device, geo, custom)
  for personalization, not just A/B.

Why it fits EW: EW is just where you author the control + challenger docs and set the
metadata. **No special EW integration is required** — this is the same plugin the EDS
boilerplate ships. (Note: this repo already reserves `/plugins/experimentation/` and
`/experiments/` in `robots`/`config.json`, so the wiring convention is anticipated,
even though the plugin isn't currently added to `scripts.js`.)

Granularity: **full-page variants** are the easy path; **block/section-level** and
audience-based variants are also supported via metadata.

## 2. Send to Adobe Target (the enterprise experimentation/personalization path)

da.live has a first-class **"Send to Adobe Target"** feature
(`https://docs.da.live/administrators/guides/prepare-menu/send-to-adobe-target`). It lets
authors push **fragments or full pages** straight from DA to **Adobe Target** for
personalization *and* experimentation, then deliver those offers on the EDS site (or
even 3rd-party surfaces).

Setup (one-time, admin):
- Adobe Target account + an Adobe Developer Console project with the **Adobe Target API**.
- Store `tenant` / `clientId` / `clientSecret` in a hidden **`/.da/adobe-target` sheet**
  (do **not** preview/publish it).
- Enable the **"Send to Adobe Target"** row in the DA site/org config **`prepare`** menu.

This is the closest analog to enterprise-grade A/B/n + audience targeting, and it is the
path to choose when the team already runs on Adobe Target and wants full stats,
audiences, and MVT rather than the lightweight plugin.

## 3. EW "Optimization opportunities" (adjacent, not a test runner)

EW's own pitch mentions *"Optimization opportunities surfaced from site insights and
external signals."* This is EW surfacing **suggestions/insights** (an intelligence
feature), not an experiment engine. It complements — but does not replace — options 1
and 2. Treat it as "EW tells you what to test," while 1/2 are "how you run the test."

---

## How this compares to Universal Editor

| | Universal Editor | Experience Workspace / da.live |
|---|---|---|
| A/B experiments | Yes — via the same EDS experimentation plugin (metadata/`/experiments/` folder) | **Yes — identical mechanism**; EW authors the control + challenger docs |
| Where the experiment "lives" | Page metadata + challenger pages | Page metadata + challenger pages (same) |
| Adobe Target integration | Via project setup | **Yes — native "Send to Adobe Target"** from the DA Prepare menu |
| Editor-specific A/B UI | Some UE tooling/extensions surfaced it in-panel | EW relies on the content-driven plugin + Target; not a bespoke in-canvas test builder (today) |

**Bottom line:** nothing about experimentation was *lost* moving from Universal Editor
to Experience Workspace. The A/B capability was never really a "Universal Editor feature"
— it's an **Edge Delivery Services** capability (the experimentation plugin) that both
editors feed. EW additionally gives you a **native Adobe Target** on-ramp and AI-surfaced
optimization suggestions. The main practical difference is that EW (today, in early
access) does not ship a dedicated in-canvas "create experiment" wizard — you set it up
the EDS-native way (metadata + `/experiments/` challengers) or push to Target.

## Recommended approach for a demo

- **Fastest to show:** the native experimentation plugin — duplicate a page into
  `/experiments/<id>/`, change a block (e.g. swap the `product-recommendations-rules`
  layout or rules), add `Experiment` + `Experiment Variants` metadata to the control,
  and show traffic splitting. Authored entirely in EW.
- **Enterprise story:** wire up **Send to Adobe Target** and push a fragment/page for a
  Target-run activity.

## Sources
- EDS Experimentation: https://www.aem.live/docs/experimentation
- Send to Adobe Target (da.live): https://docs.da.live/administrators/guides/prepare-menu/send-to-adobe-target
- Experience Workspace: https://docs.da.live/about/early-access/experience-workspace
