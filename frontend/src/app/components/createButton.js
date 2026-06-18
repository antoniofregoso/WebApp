import { icon, faPlus } from './icon.js';

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderCreateButton(lang = 'en') {
    const label = lang === 'es' ? 'Crear' : 'Create';
    return `<button type="button"
        class="topbar-action-btn"
        aria-label="${escape(label)}"
        data-tooltip="${escape(label)}"
        data-create-open>
        ${icon(faPlus, 'topbar-action-icon')}
    </button>`;
}
