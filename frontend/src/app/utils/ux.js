
/**
 * Get the area page title in the current language.
 * @param {string} area
 * @param {string} lang
 * @param {Array} items
 * @returns {string}
 */
export function getAreaTitle(area, lang, items) {
    const item = items.find((m) => m.key === area);
    if (!item) return area;
    return lang === 'es' ? item.labelEs : item.labelEn;
}



// Color name → Tailwind badge classes (shared by status badges and pills).
export const COLOR_CLASS = {
    zinc:   'bg-zinc-100 text-zinc-600',
    red:    'bg-red-100 text-red-700',
    blue:   'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green:  'bg-emerald-100 text-emerald-700',
    orange: 'bg-orange-100 text-orange-700',
};
export const COLOR_FALLBACK = 'bg-zinc-100 text-zinc-700';

// Field types whose values read better right-aligned.
export const NUMERIC_TYPES = new Set(['integer', 'decimal', 'monetary', 'percentage']);

export function locale(lang) {
    return lang === 'es' ? 'es-MX' : 'en-US';
}

/** Resolve a translated value while remaining compatible with plain strings. */
export function localizedValue(value, lang = 'en') {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value[lang] ?? value.en ?? value.es ?? '';
    }
    return value ?? '';
}
