import { renderCreateButton } from './createButton.js';

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function renderViewHeader({ title = '', count = null, lang = 'en', className = '', actions = '' } = {}) {
    const countMarkup = count === null || count === undefined
        ? ''
        : `<span class="text-xs text-[var(--dash-text-muted)]">${escape(count)}</span>`;

    return `<header class="mb-5 flex items-center justify-between gap-4 ${className}">
        <div class="flex items-baseline gap-3">
            <h2 class="text-base font-semibold text-[var(--dash-text)]">${escape(title)}</h2>
            ${countMarkup}
        </div>
        <div class="flex items-center gap-2">
            ${actions}
            ${renderCreateButton(lang)}
        </div>
    </header>`;
}
