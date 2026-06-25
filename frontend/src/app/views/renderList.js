/* ════════════════════════════════════════════════════════════════════════════
 * List view — renders a model's records as a table inside a card.
 *  · Columns follow the model schema `list` order; each cell is formatted per field
 *    type (many2one, monetary, date, percentage, pills, boolean, …).
 *  · Themed with the dashboard design tokens (--dash-*) so it tracks
 *    light / dark mode, styled with Tailwind utilities.
 *
 * Expected shape (see data/demo.json):
 *   data = { model: { label, status, schema }, records: [...] }
 * ══════════════════════════════════════════════════════════════════════════ */

import {
    COLOR_CLASS, COLOR_FALLBACK, NUMERIC_TYPES, locale, makeSortable, buildRecordUrl,
} from '../utils';
import { icon, faGripVertical, faTrash, faBoxArchive } from '../components/icon.js';
import { renderViewHeader } from '../components';
import { initCreateModal, renderCreateModal } from './renderCreateModal.js';



function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getListColumns(schema) {
    return schema
        .map((field, index) => ({ field, index }))
        .filter(({ field }) => field.list !== undefined && field.list !== false)
        .sort((a, b) => {
            const colA = typeof a.field.list === 'object' ? a.field.list.column : Number(a.field.list);
            const colB = typeof b.field.list === 'object' ? b.field.list.column : Number(b.field.list);
            const safeA = Number.isFinite(colA) ? colA : Number.MAX_SAFE_INTEGER;
            const safeB = Number.isFinite(colB) ? colB : Number.MAX_SAFE_INTEGER;
            return safeA - safeB || a.index - b.index;
        })
        .map(({ field }) => field);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render the list view markup.
 * @param {object} data — the model document ({ model, records })
 * @param {string} lang — 'es' | 'en'
 */
function renderSelectionActions(lang) {
    const deleteLabel = lang === 'es' ? 'Borrar' : 'Delete';
    const archiveLabel = lang === 'es' ? 'Archivar' : 'Archive';
    return `
        <button type="button" hidden
            class="js-list-action topbar-action-btn"
            data-list-delete
            aria-label="${deleteLabel}"
            data-tooltip="${deleteLabel}">
            ${icon(faTrash, 'topbar-action-icon')}
        </button>
        <button type="button" hidden
            class="js-list-action topbar-action-btn"
            data-list-archive
            aria-label="${archiveLabel}"
            data-tooltip="${archiveLabel}">
            ${icon(faBoxArchive, 'topbar-action-icon')}
        </button>`;
}

export function renderList(data = {}, lang = 'en') {
    const schema = data?.model?.schema ?? [];
    const records = data?.records ?? [];
    const statusLabels = data?.model?.status ?? [];
    const modelName = data?.model?.name ?? '';
    const title = data?.model?.label?.[lang] ?? '';

    const columns = getListColumns(schema);
    const hasData = columns.length > 0 && records.length > 0;

    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="List">
        ${renderViewHeader({ title, count: records.length, lang, actions: renderSelectionActions(lang) })}
        <div class="w-full overflow-hidden rounded-xl border border-[var(--dash-border)]
                    bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
            ${hasData ? `
            <div class="overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr class="border-b border-[var(--dash-border)] bg-[var(--dash-surface-hover)]">
                            <th class="w-10" aria-hidden="true"></th>
                            ${selectionHeaderCell(lang)}
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
        ${renderCreateModal(data, lang)}
    </main>
    `;
}

// ── Header row ────────────────────────────────────────────────────────────────

function sortIcon() {
    return `<svg viewBox="0 0 8 10" class="h-2.5 w-2 shrink-0" fill="currentColor" aria-hidden="true">
        <path class="js-sort-up" d="M4 0.5L7 4H1L4 0.5Z" opacity="0.35"/>
        <path class="js-sort-down" d="M4 9.5L1 6H7L4 9.5Z" opacity="0.35"/>
    </svg>`;
}

function getHeaders(columns, lang) {
    return columns.map((field) => {
        const align = NUMERIC_TYPES.has(field.type) ? 'text-right' : 'text-left';
        const label = field.label?.[lang] ?? field.name;
        const canOrder = field.list?.order === true;
        const sortBtn = canOrder
            ? `<button type="button" data-sort-field="${escape(field.name)}" data-sort-dir=""
                    class="js-list-sort ml-1 inline-flex items-center
                           text-[var(--dash-text-soft)] hover:text-[var(--dash-text)]"
                    aria-label="Sort by ${escape(label)}">${sortIcon()}</button>`
            : '';
        return `<th class="${align} whitespace-nowrap px-4 py-2.5 text-xs font-semibold
                    uppercase tracking-wide text-[var(--dash-text-muted)]">
            <span class="inline-flex items-center gap-0.5">${escape(label)}${sortBtn}</span>
        </th>`;
    }).join('');
}

// ── Body rows ─────────────────────────────────────────────────────────────────

function getSortValue(field, value) {
    if (value == null || value === '') return '';
    switch (field.type) {
        case 'many2one': return value?.name ?? '';
        case 'date':
        case 'datetime': return value;
        case 'monetary':
        case 'decimal':
        case 'integer':
        case 'percentage': return Number(value);
        case 'boolean': return value ? 1 : 0;
        default: return String(value);
    }
}

function getRows(records, columns, statusLabels, modelName, lang) {
    return records.map((record) => {
        const cells = columns.map((field) => {
            const align = NUMERIC_TYPES.has(field.type) ? 'text-right' : 'text-left';
            const sortAttr = field.list?.order === true
                ? ` data-sort-value="${escape(String(getSortValue(field, record[field.name])))}"` : '';
            return `<td class="${align} whitespace-nowrap px-4 py-2.5 text-[var(--dash-text)]"${sortAttr}>
                ${formatCell(field, record[field.name], statusLabels, modelName, record.uuid, lang)}
            </td>`;
        }).join('');
        return `<tr data-uuid="${escape(record.uuid ?? '')}"
                    class="border-b border-[var(--dash-border-soft)] last:border-0
                    transition-colors hover:bg-[var(--dash-surface-hover)]">${dragHandleCell()}${selectionCell(record.uuid, lang)}${cells}</tr>`;
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

/** Header checkbox that toggles every visible row selection. */
function selectionHeaderCell(lang) {
    const label = lang === 'es' ? 'Seleccionar todas las filas' : 'Select all rows';
    return `<th class="w-10 px-2 text-center align-middle">
        <input type="checkbox"
            class="js-list-select-all h-4 w-4 rounded border-[var(--dash-border)]
                bg-[var(--dash-surface)] accent-[var(--dash-text-muted)]
                focus:ring-2 focus:ring-[var(--dash-border)] focus:ring-offset-0"
            aria-label="${escape(label)}" />
    </th>`;
}

/** Row checkbox shown after the drag handle. */
function selectionCell(uuid, lang) {
    const label = lang === 'es' ? 'Seleccionar fila' : 'Select row';
    return `<td class="w-10 px-2 text-center align-middle">
        <input type="checkbox"
            class="js-list-row-select h-4 w-4 rounded border-[var(--dash-border)]
                bg-[var(--dash-surface)] accent-[var(--dash-text-muted)]
                focus:ring-2 focus:ring-[var(--dash-border)] focus:ring-offset-0"
            aria-label="${escape(label)}"
            value="${escape(uuid)}" />
    </td>`;
}

// ── Cell formatting per field type ──────────────────────────────────────────────

function formatCell(field, value, statusLabels, modelName, recordUuidValue, lang) {
    if (value === null || value === undefined || value === '') {
        // image still renders a placeholder; everything else shows a muted dash.
        if (field.type !== 'image') {
            return `<span class="text-[var(--dash-text-soft)]">—</span>`;
        }
    }

    if (field.name === 'name') {
        return recordNameCell(value, modelName, recordUuidValue);
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
 * many2one link → "{current path}/{model}/{uuid}".
 * The href is built as a safe, encoded string (segments URL-encoded, then
 * HTML-escaped). How the link actually resolves/navigates is intentionally
 * left for later — for now it's just a well-formed, escaped string.
 */
function manyToOneCell(value) {
    const name = escape(value?.name ?? '');
    if (!value || value.uuid == null || !value.model) return name;
    const href = buildRecordUrl(value.model, value.uuid);
    return `<a href="${href}" class="text-[var(--dash-accent)] hover:underline">${name}</a>`;
}

function recordNameCell(value, model, uuid) {
    const name = escape(value);
    if (!model || uuid == null) return name;
    const href = buildRecordUrl(model, uuid);
    return `<a href="${href}" class="font-medium text-[var(--dash-accent)] hover:underline">${name}</a>`;
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
export function initList(lang = 'en') {
    const tbody = document.querySelector('[data-list-rows]');
    const destroyCreateModal = initCreateModal(document, lang);
    if (!tbody) return destroyCreateModal;
    const selectAll = document.querySelector('.js-list-select-all');
    const rowCheckboxes = Array.from(tbody.querySelectorAll('.js-list-row-select'));
    const actionButtons = Array.from(document.querySelectorAll('.js-list-action'));

    const syncRowSelection = (checkbox) => {
        checkbox.closest('tr')?.classList.toggle('list-row--selected', checkbox.checked);
    };

    const syncSelectAll = () => {
        const selectedCount = rowCheckboxes.filter((checkbox) => checkbox.checked).length;
        if (selectAll) {
            selectAll.checked = selectedCount > 0 && selectedCount === rowCheckboxes.length;
            selectAll.indeterminate = selectedCount > 0 && selectedCount < rowCheckboxes.length;
        }
        actionButtons.forEach((btn) => { btn.hidden = selectedCount === 0; });
    };

    const onSelectAllChange = () => {
        rowCheckboxes.forEach((checkbox) => {
            checkbox.checked = selectAll.checked;
            syncRowSelection(checkbox);
        });
        syncSelectAll();
    };

    const onRowSelectChange = (event) => {
        syncRowSelection(event.currentTarget);
        syncSelectAll();
    };

    rowCheckboxes.forEach(syncRowSelection);
    selectAll?.addEventListener('change', onSelectAllChange);
    rowCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', onRowSelectChange));

    // ── Column sort ────────────────────────────────────────────────────────────
    const sortButtons = Array.from(document.querySelectorAll('.js-list-sort'));

    const updateSortIcons = (activeBtn, dir) => {
        sortButtons.forEach((btn) => {
            const up = btn.querySelector('.js-sort-up');
            const down = btn.querySelector('.js-sort-down');
            if (btn === activeBtn) {
                up?.setAttribute('opacity', dir === 'asc' ? '1' : '0.35');
                down?.setAttribute('opacity', dir === 'desc' ? '1' : '0.35');
            } else {
                up?.setAttribute('opacity', '0.35');
                down?.setAttribute('opacity', '0.35');
            }
        });
    };

    const onSortClick = (event) => {
        const btn = event.currentTarget;
        const th = btn.closest('th');
        const colIndex = th.cellIndex;
        const prevDir = btn.dataset.sortDir || '';
        const newDir = prevDir === 'asc' ? 'desc' : 'asc';

        sortButtons.forEach((b) => { b.dataset.sortDir = ''; });
        btn.dataset.sortDir = newDir;
        updateSortIcons(btn, newDir);

        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a, b) => {
            const aRaw = a.cells[colIndex]?.dataset.sortValue ?? '';
            const bRaw = b.cells[colIndex]?.dataset.sortValue ?? '';
            const aNum = Number(aRaw);
            const bNum = Number(bRaw);
            if (aRaw !== '' && bRaw !== '' && !Number.isNaN(aNum) && !Number.isNaN(bNum)) {
                return newDir === 'asc' ? aNum - bNum : bNum - aNum;
            }
            const cmp = String(aRaw).localeCompare(String(bRaw));
            return newDir === 'asc' ? cmp : -cmp;
        });
        rows.forEach((row) => tbody.appendChild(row));
    };

    sortButtons.forEach((btn) => btn.addEventListener('click', onSortClick));

    const destroySortable = makeSortable(tbody, {
        handle: '.js-list-drag-handle',
        onReorder: (uuids) => {
            // New row order, by record uuid. Persisting it is decided later.
            console.debug('list reordered:', uuids);
        },
    });

    return () => {
        selectAll?.removeEventListener('change', onSelectAllChange);
        rowCheckboxes.forEach((checkbox) => checkbox.removeEventListener('change', onRowSelectChange));
        sortButtons.forEach((btn) => btn.removeEventListener('click', onSortClick));
        destroySortable();
        destroyCreateModal();
    };
}
