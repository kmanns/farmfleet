import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Story Card Collection.
 *
 * A curated collection of "story" cards (image + label + link) - the
 * "story card carousel" analog: instead of hundreds of SKUs, a handful of
 * themed collection cards.
 *
 * Authoring surfaces (both supported by the same DOM handling below):
 *  - da.live: each table ROW is one card. Cell 1 = image (picture),
 *    cell 2 = heading + link (the first <a> in the cell becomes the card
 *    link; its text / a heading becomes the label).
 *  - Universal Editor: `story-card-collection` is a container; each
 *    `story-card` child renders as one row with the same two-cell shape,
 *    so this decorator handles it identically.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'story-card-collection__list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'story-card';
    moveInstrumentation(row, li);

    const cells = [...row.children];
    const imageCell = cells[0];
    const contentCell = cells[1];

    // Resolve the card link: prefer an explicit <a> in the content cell.
    const link = contentCell?.querySelector('a');
    const href = link?.getAttribute('href') || '';
    const label = (link?.textContent || contentCell?.textContent || '').trim();

    const anchor = document.createElement('a');
    anchor.className = 'story-card__link';
    if (href) anchor.href = href;
    anchor.setAttribute('aria-label', label);

    // Media
    const media = document.createElement('div');
    media.className = 'story-card__media';
    const img = imageCell?.querySelector('img');
    if (img) {
      media.append(
        createOptimizedPicture(img.src, img.alt || label, false, [{ width: '750' }]),
      );
    } else {
      media.classList.add('story-card__media--placeholder');
    }

    // Label overlay
    const cap = document.createElement('span');
    cap.className = 'story-card__label';
    cap.textContent = label;

    anchor.append(media, cap);
    li.append(anchor);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
