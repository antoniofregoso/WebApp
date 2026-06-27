/* ════════════════════════════════════════════════════════════════════════════
 * Kanban view — records grouped into columns by their `status` (selection).
 *  · Columns come from model.status; cards are the records in each status.
 *  · Cards are drag-sortable within and across columns (SortableJS, shared
 *    group), using the same grip handle + data-uuid pattern as the list view.
 *  · Card layout is driven by the `kanban` key on each schema field:
 *      header: "image" | "title" | "subtitle"
 *      leftColumn: <index>
 *      rightColumn: <index>
 *      footer: <index>
 *  · Themed with the dashboard design tokens (--dash-*) and Tailwind utilities.
 *
 * Expected shape (see data/demo.json):
 *   data = { model: { label, status, schema }, records: [...] }
 * ══════════════════════════════════════════════════════════════════════════ */

import {
    COLOR_CLASS, COLOR_FALLBACK, buildRecordUrl, locale, localizedValue, makeSortable, formatCurrency, formatDate,
} from '../utils';
import { icon, faGripVertical } from '../components/icon.js';
import { renderViewHeader } from '../components';
import { initCreateModal, renderCreateModal } from './renderCreateModal.js';

let _records = [];

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function initials(name) {
    return String(name ?? '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('') || '?';
}

function avatar(src, name) {
    if (src) {
        return `<img src="${escape(src)}" alt="${escape(name ?? '')}"
                    class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[var(--dash-border)]" />`;
    }
    return `<span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                 bg-[var(--dash-surface-hover)] text-[10px] font-semibold
                 text-[var(--dash-text-muted)] ring-1 ring-[var(--dash-border)]">
        ${initials(name)}
    </span>`;
}

// ── Layout builder ────────────────────────────────────────────────────────────

/**
 * Parse the schema `kanban` key on each field into a layout descriptor.
 * Returns:
 *   {
 *     image: fieldDef | null,
 *     title: fieldDef | null,
 *     subtitle: fieldDef | null,
 *     leftColumn:  [{ fieldDef, idx }]  — sorted by idx asc
 *     rightColumn: [{ fieldDef, idx }]  — sorted by idx asc
 *     footer:      [{ fieldDef, idx }]  — sorted by idx asc
 *   }
 */
function buildKanbanLayout(schema) {
    const layout = {
        image: null,
        title: null,
        subtitle: null,
        leftColumn: [],
        rightColumn: [],
        footer: [],
    };

    for (const fieldDef of schema) {
        const k = fieldDef.kanban;
        if (!k) continue;

        if ('header' in k) {
            const slot = String(k.header).toLowerCase();
            if (slot === 'image') layout.image = fieldDef;
            else if (slot === 'title') layout.title = fieldDef;
            else if (slot === 'subtitle') layout.subtitle = fieldDef;
        } else if ('leftColumn' in k) {
            layout.leftColumn.push({ fieldDef, idx: Number(k.leftColumn) });
        } else if ('rightColumn' in k) {
            layout.rightColumn.push({ fieldDef, idx: Number(k.rightColumn) });
        } else if ('footer' in k) {
            layout.footer.push({ fieldDef, idx: Number(k.footer) });
        }
    }

    layout.leftColumn.sort((a, b) => a.idx - b.idx);
    layout.rightColumn.sort((a, b) => a.idx - b.idx);
    layout.footer.sort((a, b) => a.idx - b.idx);

    return layout;
}

// ── Generic field value renderer ──────────────────────────────────────────────

function renderFieldValue(record, fieldDef, ctx) {
    const { currency, lang, loc } = ctx;
    const raw = record[fieldDef.name];
    if (raw == null || raw === '') return '';

    switch (fieldDef.type) {
        case 'date':
        case 'datetime':
            return escape(formatDate(raw, loc));
        case 'monetary':
            return escape(formatCurrency(Number(raw), loc, currency));
        case 'percentage': {
            const pct = Math.max(0, Math.min(100, Number(raw) || 0));
            return `${pct}%`;
        }
        case 'integer':
        case 'decimal':
            return escape(String(raw));
        case 'boolean':
            return raw ? '✓' : '';
        case 'many2one': {
            const name = escape(raw?.name ?? '');
            const href = raw?.model && raw?.uuid != null ? buildRecordUrl(raw.model, raw.uuid) : '';
            return href
                ? `<a href="${href}" class="text-[var(--dash-accent)] hover:underline">${name}</a>`
                : name;
        }
        case 'many2many_pills':
            return renderTags(raw, lang);
        default:
            return escape(String(raw));
    }
}

function renderTags(tags, lang) {
    if (!Array.isArray(tags) || tags.length === 0) return '';
    return tags.map((tag) => {
        const cls = COLOR_CLASS[tag.color] ?? COLOR_FALLBACK;
        return `<span class="inline-flex items-center rounded-full px-2 py-0.5
                    text-[10px] font-medium ${cls}">${escape(localizedValue(tag.name, lang))}</span>`;
    }).join('');
}

// ── Card section renderers ────────────────────────────────────────────────────

function renderCardHeader(record, layout, ctx) {
    const { modelName } = ctx;
    const recordHref = buildRecordUrl(modelName, record.uuid);
    const titleName = layout.title ? escape(String(record[layout.title.name] ?? '')) : '';

    const imageHtml = layout.image
        ? avatar(record[layout.image.name], titleName)
        : avatar(null, titleName);

    const titleHtml = titleName
        ? `<a href="${recordHref}" class="truncate text-sm font-semibold text-[var(--dash-accent)] hover:underline">${titleName}</a>`
        : '';

    let subtitleHtml = '';
    if (layout.subtitle) {
        const fieldDef = layout.subtitle;
        const raw = record[fieldDef.name];
        if (raw != null && raw !== '') {
            if (fieldDef.type === 'many2one') {
                const name = escape(raw?.name ?? '');
                const href = raw?.model && raw?.uuid != null ? buildRecordUrl(raw.model, raw.uuid) : '';
                subtitleHtml = href
                    ? `<a href="${href}" class="truncate text-xs font-medium text-[var(--dash-accent)] hover:underline">${name}</a>`
                    : `<span class="truncate text-xs font-medium text-[var(--dash-text)]">${name}</span>`;
            } else {
                const valueHtml = renderFieldValue(record, fieldDef, ctx);
                if (valueHtml) {
                    subtitleHtml = `<span class="truncate text-xs text-[var(--dash-text-muted)]">${valueHtml}</span>`;
                }
            }
        }
    }

    return `
        <div class="flex items-start justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
                ${imageHtml}
                <div class="flex min-w-0 flex-col gap-0.5">
                    ${titleHtml}
                    ${subtitleHtml}
                </div>
            </div>
            <button type="button" class="js-kanban-drag-handle inline-flex shrink-0 cursor-grab
                        items-center justify-center text-[var(--dash-text-soft)]
                        hover:text-[var(--dash-text)] active:cursor-grabbing" aria-label="Reorder card">
                ${icon(faGripVertical, 'h-3.5 w-3.5')}
            </button>
        </div>`;
}

function renderColumnField(record, fieldDef, ctx) {
    const { lang } = ctx;
    const raw = record[fieldDef.name];
    if (raw == null || raw === '') return '';

    const valueHtml = renderFieldValue(record, fieldDef, ctx);
    if (!valueHtml) return '';

    const label = escape(fieldDef.label?.[lang] ?? fieldDef.name);
    return `
        <div class="flex items-baseline justify-between gap-1 text-xs">
            <span class="text-[var(--dash-text-muted)]">${label}</span>
            <span class="font-medium text-[var(--dash-text)]">${valueHtml}</span>
        </div>`;
}

function renderFooterField(record, fieldDef, ctx) {
    const { lang } = ctx;
    const raw = record[fieldDef.name];
    if (raw == null || raw === '') return '';

    if (fieldDef.type === 'percentage') {
        const pct = Math.max(0, Math.min(100, Number(raw) || 0));
        return `
        <div class="flex items-center gap-2">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--dash-border)]">
                <div class="h-full rounded-full bg-[var(--dash-accent)]" style="width:${pct}%"></div>
            </div>
            <span class="tabular-nums text-[10px] text-[var(--dash-text-muted)]">${pct}%</span>
        </div>`;
    }

    if (fieldDef.type === 'many2many_pills') {
        const tagsHtml = renderTags(raw, lang);
        return tagsHtml ? `<div class="flex flex-wrap gap-1">${tagsHtml}</div>` : '';
    }

    const valueHtml = renderFieldValue(record, fieldDef, ctx);
    if (!valueHtml) return '';

    const label = escape(fieldDef.label?.[lang] ?? fieldDef.name);
    return `<span class="text-xs text-[var(--dash-text-muted)]">${label}:
        <span class="font-medium text-[var(--dash-text)]">${valueHtml}</span></span>`;
}

// ── Card ──────────────────────────────────────────────────────────────────────

function renderCard(record, layout, ctx) {
    const headerHtml = renderCardHeader(record, layout, ctx);

    const leftFields = layout.leftColumn
        .map(({ fieldDef }) => renderColumnField(record, fieldDef, ctx))
        .filter(Boolean);
    const rightFields = layout.rightColumn
        .map(({ fieldDef }) => renderColumnField(record, fieldDef, ctx))
        .filter(Boolean);

    let bodyHtml = '';
    if (leftFields.length > 0 || rightFields.length > 0) {
        bodyHtml = `
        <div class="mt-2 flex gap-2">
            <div class="flex flex-1 flex-col gap-1">${leftFields.join('')}</div>
            <div class="flex flex-1 flex-col gap-1 items-end">${rightFields.join('')}</div>
        </div>`;
    }

    const footerParts = layout.footer
        .map(({ fieldDef }) => renderFooterField(record, fieldDef, ctx))
        .filter(Boolean);

    const footerHtml = footerParts.length > 0
        ? `<div class="mt-2 flex flex-col gap-1">${footerParts.join('')}</div>`
        : '';

    return `
    <article data-uuid="${escape(record.uuid ?? '')}" data-status="${escape(record.status ?? '')}"
             class="group rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)]
                    p-3 shadow-sm transition-shadow hover:shadow-md">
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
    </article>`;
}

// ── Column ────────────────────────────────────────────────────────────────────

function renderColumn(status, cards, layout, ctx) {
    const cls = COLOR_CLASS[status.color] ?? COLOR_FALLBACK;
    const title = escape(status[ctx.lang] ?? status.value);

    return `
    <section class="flex min-w-64 flex-1 flex-col rounded-xl border border-[var(--dash-border)]
                    bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
        <header class="flex items-center justify-between gap-2 border-b border-[var(--dash-border)] px-3 py-2.5">
            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}">
                ${title}
            </span>
            <span data-kanban-count class="text-xs text-[var(--dash-text-muted)]">${cards.length}</span>
        </header>
        <div data-kanban-cards data-status="${escape(status.value)}"
             class="flex min-h-24 flex-col gap-2 p-2">
            ${cards.map((record) => renderCard(record, layout, ctx)).join('')}
        </div>
    </section>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render the kanban board markup.
 * @param {object} data — the model document ({ model, records })
 * @param {string} lang — 'es' | 'en'
 */
export function renderKanban(data = {}, lang = 'en') {
    const statuses = data?.model?.status ?? [];
    const records  = data?.records ?? [];
    const schema   = data?.model?.schema ?? [];
    const modelName = data?.model?.name ?? '';
    const currency  = schema.find((f) => f.type === 'monetary')?.currency ?? 'MXN';
    const title     = data?.model?.label?.[lang] ?? '';

    _records = records;

    const layout = buildKanbanLayout(schema);
    const ctx = { currency, modelName, lang, loc: locale(lang) };

    const columns = statuses.map((status) => {
        const cards = records.filter((r) => r.status === status.value);
        return renderColumn(status, cards, layout, ctx);
    }).join('');

    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="Kanban Board">
        ${renderViewHeader({ title, count: records.length, lang })}
        <div class="flex items-start gap-4 overflow-x-auto pb-2">
            ${columns}
        </div>
        ${renderCreateModal(data, lang)}
    </main>
    `;
}

// ── View wiring ───────────────────────────────────────────────────────────────

/**
 * Wire up card drag-and-drop across columns after the markup is in the DOM.
 * All columns share one Sortable group so cards can move between them.
 * @returns {() => void} cleanup function (destroys all Sortable instances).
 */
export function initKanban(lang = 'en') {
    const columns = document.querySelectorAll('[data-kanban-cards]');
    const cleanups = [];
    cleanups.push(initCreateModal(document, lang));

    columns.forEach((col) => {
        cleanups.push(makeSortable(col, {
            handle: '.js-kanban-drag-handle',
            sortableOptions: {
                group:         'kanban',
                forceFallback: true,
                ghostClass:    'kanban-drag-ghost',
                chosenClass:   'kanban-drag-chosen',
                dragClass:     'kanban-drag-item',
            },
            onReorder: (_ids, evt) => {
                if (evt.from !== evt.to) {
                    const cardUuid = evt.item?.dataset.uuid;
                    const toStatus = evt.to?.dataset.status;
                    const record = _records.find((r) => String(r.uuid) === cardUuid);
                    if (record) record.status = toStatus;
                    if (evt.item && toStatus != null) evt.item.dataset.status = toStatus;
                }
                refreshColumnCounts();
            },
        }));
    });

    return () => cleanups.forEach((fn) => fn());
}

function refreshColumnCounts() {
    document.querySelectorAll('[data-kanban-cards]').forEach((col) => {
        const countEl = col.closest('section')?.querySelector('[data-kanban-count]');
        if (countEl) countEl.textContent = String(col.children.length);
    });
}
