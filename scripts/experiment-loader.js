/**
 * Experiment loader for the AEM Experimentation plugin (v2).
 *
 * Lazily loads the vendored plugin from ../plugins/experimentation only when a
 * page actually declares an experiment/campaign/audience (via metadata or a
 * section-metadata cell), so production pages that aren't testing pay nothing.
 * The simulation UI is preview-only. Wrapper copied from the plugin README.
 */

/**
 * Checks if experimentation is enabled on this page.
 * @returns {boolean}
 */
const isExperimentationEnabled = () => document.head.querySelector('[name^="experiment"],[name^="campaign-"],[name^="audience-"],[property^="campaign:"],[property^="audience:"]')
  || [...document.querySelectorAll('.section-metadata div')].some((d) => d.textContent.match(/Experiment|Campaign|Audience/i));

/**
 * Loads the experimentation module (eager).
 * @param {Document} document
 * @param {Object} config
 * @returns {Promise<void>}
 */
export async function runExperimentation(document, config) {
  if (!isExperimentationEnabled()) {
    // Keep a UI-less postMessage listener so a Sidekick-injected panel still
    // gets a config response even on non-experiment pages.
    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'hlx:experimentation-get-config') {
        event.source.postMessage({
          type: 'hlx:experimentation-config',
          config: { experiments: [], audiences: [], campaigns: [] },
          source: 'no-experiments',
        }, '*');
      }
    });
    return null;
  }

  try {
    const { loadEager } = await import('../plugins/experimentation/src/index.js');
    return loadEager(document, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (eager):', error);
    return null;
  }
}

/**
 * Loads the experimentation simulation UI (lazy, preview-only).
 * @param {Document} document
 * @param {Object} config
 * @returns {Promise<void>}
 */
export async function runExperimentationLazy(document, config) {
  const { host, hostname, origin } = window.location;
  const isPreview = hostname === 'localhost'
    || hostname.endsWith('.page')
    || (typeof config.isProd === 'function' && !config.isProd())
    || (config.prodHost && ![host, hostname, origin].includes(config.prodHost));
  if (!isPreview) {
    return null;
  }

  try {
    const { loadLazy } = await import('../plugins/experimentation/src/index.js');
    return loadLazy(document, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (lazy):', error);
    return null;
  }
}
