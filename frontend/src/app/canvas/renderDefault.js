import { getAreaTitle } from '../utils';
import { t } from '../../i18n/translations.js';

/**
 * Render the main content area HTML.
 * @param {string} area
 * @param {string} lang
 * @param {Array} items
 * @returns {string}
 */
export function renderDefault(area, lang, items) {
    const title = area ? getAreaTitle(area, lang, items) : t('content.home.title', lang);
    const welcome = t('content.welcome', lang);
    const placeholder = t('content.placeholder', lang);

    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="${title}">
        <div class="dash-content-inner">
            <div class="dash-content-hero">
                <p class="dash-content-welcome">${welcome}</p>
                <h2 class="dash-content-title">${title}</h2>
                <p class="dash-content-placeholder">${placeholder}</p>
            </div>
        </div>
    </main>
    `;
}
