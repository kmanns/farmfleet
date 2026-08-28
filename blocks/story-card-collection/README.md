# Story Card Collection Block

## Overview

A curated collection of "story" cards (image + label + link) - the "story card
carousel" analog. Instead of hundreds of SKUs, an author curates a handful of
themed collection cards (e.g. the Lego-style themed-collection example). Every
card is authored content, so there is no data integration to stand up - a good
low-risk block.

## Integration

Each card is one row: an image in the first cell, a heading + link in the second.
The first `<a>` in the content cell becomes the card link; its text (or the cell
text) becomes the label. The decorator handles both the da.live table DOM and the
Universal Editor container/child DOM identically.

### Block Configuration

No `readBlockConfig()` keys - content is authored as rows/children, not a
key/value table.

## Authoring in da.live

Each row is one card:

| Story Card Collection | |
|---|---|
| ![](riding-mowers.jpg) | ### Riding Mowers<br>/lawn-and-garden/riding-mowers |
| ![](livestock.jpg) | ### Livestock Supplies<br>/farm-and-livestock/ |

Add as many rows as you have collections.

## Authoring in Universal Editor

Grouped under **Blaine's Demo Blocks**. `story-card-collection` is a container;
authors add `story-card` children, each with an image reference, a label, and a
link (`component-models.json` + the `story-card-collection` filter restrict
`story-card` to inside the container).

## Files

- `story-card-collection.js` - decorator
- `story-card-collection.css` - responsive card grid with label overlay
- `_story-card-collection.json` - container + child model (da.live + UE)
