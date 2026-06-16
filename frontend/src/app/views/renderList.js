/* ════════════════════════════════════════════════════════════════════════════
 * List view — renders a model's records as a table inside a card.
 *  · Columns follow the model schema order; each cell is formatted per field
 *    type (many2one, monetary, date, percentage, pills, boolean, …).
 *  · Themed with the dashboard design tokens (--dash-*) so it tracks
 *    light / dark mode, styled with Tailwind utilities.
 *
 * Expected shape (see data/demo.json):
 *   data = { model: { label, status, schema }, records: [...] }
 * ══════════════════════════════════════════════════════════════════════════ */

import { COLOR_CLASS, COLOR_FALLBACK, NUMERIC_TYPES, locale, makeSortable } from '../utils';
import { icon, faGripVertical } from '../components/icon.js';



function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render the list view markup.
 * @param {object} data — the model document ({ model, records })
 * @param {string} lang — 'es' | 'en'
 */
export function renderList(data = {}, lang = 'en') {
    const schema = data?.model?.schema ?? [];
    const records = data?.records ?? [];
    const statusLabels = data?.model?.status ?? [];
    const modelName = data?.model?.name ?? '';
    const title = data?.model?.label?.[lang] ?? '';

    // The id is not shown as a column — it travels as `data-id` on each row.
    const columns = schema.filter((field) => field.name !== 'id');
    const hasData = columns.length > 0 && records.length > 0;

    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="List">
        <div class="w-full overflow-hidden rounded-xl border border-[var(--dash-border)]
                    bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
            <div class="flex items-center justify-between gap-4 border-b border-[var(--dash-border)] px-5 py-3.5">
                <h2 class="text-sm font-semibold text-[var(--dash-text)]">${escape(title)}</h2>
                <span class="text-xs text-[var(--dash-text-muted)]">${records.length}</span>
            </div>
            ${hasData ? `
            <div class="overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr class="border-b border-[var(--dash-border)] bg-[var(--dash-surface-hover)]">
                            <th class="w-10" aria-hidden="true"></th>
                            ${getHeaders(columns, lang)}
                        </tr>
                    </thead>
                    <tbody data-list-rows>
                        ${getRows(records, columns, statusLabels, modelName, lang)}
                    </tbody>
                </table>
            </div>` : `
            <div class="px-5 py-10 text-center text-sm text-[var(--dash-text-muted)]">
                ${lang === 'es' ? 'Sin registros' : 'No records'}
            </div>`}
        </div>
    </main>
    `;
}

// ── Header row ────────────────────────────────────────────────────────────────

function getHeaders(columns, lang) {
    return columns.map((field) => {
        const align = NUMERIC_TYPES.has(field.type) ? 'text-right' : 'text-left';
        const label = field.label?.[lang] ?? field.name;
        return `<th class="${align} whitespace-nowrap px-4 py-2.5 text-xs font-semibold
                    uppercase tracking-wide text-[var(--dash-text-muted)]">${escape(label)}</th>`;
    }).join('');
}

// ── Body rows ─────────────────────────────────────────────────────────────────

function getRows(records, columns, statusLabels, modelName, lang) {
    return records.map((record) => {
        const cells = columns.map((field) => {
            const align = NUMERIC_TYPES.has(field.type) ? 'text-right' : 'text-left';
            return `<td class="${align} whitespace-nowrap px-4 py-2.5 text-[var(--dash-text)]">
                ${formatCell(field, record[field.name], statusLabels, modelName, record.id, lang)}
            </td>`;
        }).join('');
        return `<tr data-id="${escape(record.id)}"
                    class="border-b border-[var(--dash-border-soft)] last:border-0
                    transition-colors hover:bg-[var(--dash-surface-hover)]">${dragHandleCell()}${cells}</tr>`;
    }).join('');
}

/** Leading cell with the drag handle used by SortableJS to reorder rows. */
function dragHandleCell() {
    return `<td class="w-10 px-2 text-center align-middle">
        <button type="button" class="js-list-drag-handle inline-flex cursor-grab items-center
                    justify-center text-[var(--dash-text-soft)] hover:text-[var(--dash-text)]
                    active:cursor-grabbing" aria-label="Reorder row">
            ${icon(faGripVertical, 'h-3.5 w-3.5')}
        </button>
    </td>`;
}

// ── Cell formatting per field type ──────────────────────────────────────────────

function formatCell(field, value, statusLabels, modelName, recordId, lang) {
    if (value === null || value === undefined || value === '') {
        // image still renders a placeholder; everything else shows a muted dash.
        if (field.type !== 'image') {
            return `<span class="text-[var(--dash-text-soft)]">—</span>`;
        }
    }

    if (field.name === 'name') {
        return recordNameCell(value, modelName, recordId);
    }

    switch (field.type) {
        case 'many2one':
            return manyToOneCell(value);

        case 'date':
            return escape(new Date(value).toLocaleDateString(locale(lang), {
                year: 'numeric', month: 'short', day: 'numeric',
            }));

        case 'datetime':
            return escape(new Date(value).toLocaleString(locale(lang), {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            }));

        case 'monetary':
            return escape(new Intl.NumberFormat(locale(lang), {
                style: 'currency', currency: field.currency ?? 'MXN',
            }).format(Number(value)));

        case 'decimal':
            return escape(Number(value).toLocaleString(locale(lang), {
                minimumFractionDigits: 2, maximumFractionDigits: 2,
            }));

        case 'percentage':
            return percentageCell(Number(value));

        case 'boolean':
            return booleanCell(Boolean(value));

        case 'image':
            return avatarCell(value);

        case 'many2many_pills':
            return pillsCell(value);

        case 'selection':
            return statusCell(value, statusLabels, lang);

        default:
            return escape(value);
    }
}

/**
 * many2one link → "/model/{model}/{id}".
 * The href is built as a safe, encoded string (segments URL-encoded, then
 * HTML-escaped). How the link actually resolves/navigates is intentionally
 * left for later — for now it's just a well-formed, escaped string.
 */
function manyToOneCell(value) {
    const name = escape(value?.name ?? '');
    if (!value || value.id == null || !value.model) return name;
    const href = buildRecordUrl(value.model, value.id);
    return `<a href="${href}" class="text-[var(--dash-accent)] hover:underline">${name}</a>`;
}

function recordNameCell(value, model, id) {
    const name = escape(value);
    if (!model || id == null) return name;
    const href = buildRecordUrl(model, id);
    return `<a href="${href}" class="font-medium text-[var(--dash-accent)] hover:underline">${name}</a>`;
}

/** /model/{model}/{id}, each dynamic segment encoded and escaped. */
function buildRecordUrl(model, id) {
    const path = `/model/${encodeURIComponent(model)}/${encodeURIComponent(id)}`;
    return escape(path);
}

/** Small progress bar + percentage label. */
function percentageCell(pct) {
    const clamped = Math.max(0, Math.min(100, pct));
    return `
    <div class="flex items-center justify-end gap-2">
        <div class="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--dash-border)]">
            <div class="h-full rounded-full bg-[var(--dash-accent)]" style="width:${clamped}%"></div>
        </div>
        <span class="tabular-nums text-[var(--dash-text-muted)]">${clamped}%</span>
    </div>`;
}

/** Green check for true, muted dash for false. */
function booleanCell(on) {
    if (!on) return `<span class="text-[var(--dash-text-soft)]">—</span>`;
    return `
    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full
                 bg-emerald-100 text-emerald-700">
        <svg viewBox="0 0 16 16" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 8.5l3.5 3.5L13 4.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </span>`;
}

/** Round avatar — image when present, initials placeholder otherwise. */
function avatarCell(src) {
    if (src) {
        return `<img src="${escape(src)}" alt=""
                    class="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--dash-border)]" />`;
    }
    return `
    <span class="inline-flex h-8 w-8 items-center justify-center rounded-full
                 bg-[var(--dash-surface-hover)] text-[var(--dash-text-soft)]
                 ring-1 ring-[var(--dash-border)]">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z"/>
        </svg>
    </span>`;
}

/** A row of colored pills from a many2many list of { name, color }. */
function pillsCell(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
        return `<span class="text-[var(--dash-text-soft)]">—</span>`;
    }
    return `<div class="flex flex-wrap gap-1">${tags.map((tag) => {
        const cls = COLOR_CLASS[tag.color] ?? COLOR_FALLBACK;
        return `<span class="inline-flex items-center rounded-full px-2 py-0.5
                    text-xs font-medium ${cls}">${escape(tag.name)}</span>`;
    }).join('')}</div>`;
}

/**
 * Status badge — fully driven by model.status. Matches the record code against
 * each entry's `value` to resolve the localized label and color; nothing about
 * the statuses is hard-coded here.
 */
function statusCell(code, statusOptions, lang) {
    const option = statusOptions.find((opt) => opt.value === code);
    const label = option?.[lang] ?? code;
    const cls = COLOR_CLASS[option?.color] ?? COLOR_FALLBACK;
    return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5
                text-xs font-medium ${cls}">${escape(label)}</span>`;
}

// ── View wiring ─────────────────────────────────────────────────────────────────

/**
 * Wire up row drag-and-drop reordering after the list markup is in the DOM.
 * @returns {() => void} cleanup function (destroys the Sortable instance).
 */
export function initList() {
    const tbody = document.querySelector('[data-list-rows]');
    if (!tbody) return () => {};

    return makeSortable(tbody, {
        handle: '.js-list-drag-handle',
        onReorder: (ids) => {
            // New row order, by record id. Persisting it is decided later.
            console.debug('list reordered:', ids);
        },
    });
}
