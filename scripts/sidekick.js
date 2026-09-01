/**
 * Sidekick plugins loader.
 *
 * Sustainable place to wire AEM Sidekick / da.live custom plugin events.
 * Currently hosts the DA Experimentation Rail toggle: clicking the
 * "Experimentation" plugin in the sidekick (event: custom:experimentation)
 * loads/toggles the da.live experimentation UI micro-frontend.
 */

let expMod;
const DA_EXP = 'https://da.live/nx/public/plugins/exp/exp.js';

async function toggleExp() {
  const exists = document.querySelector('#aem-sidekick-exp');
  // First open: let the module's side effects mount the panel.
  if (!exists) {
    expMod = await import(DA_EXP);
    return;
  }
  // Subsequent clicks: toggle the cached module.
  if (!expMod) expMod = await import(DA_EXP);
  expMod.default();
}

(async function sidekick() {
  const sk = document.querySelector('aem-sidekick');
  if (!sk) return;
  sk.addEventListener('custom:experimentation', toggleExp);
}());
