/* ════════════════════════════════════════════════════════════════════════════
 * Kanban view — records grouped into columns by their `status` (selection).
 *  · Columns come from model.status; cards are the records in each status.
 *  · Cards are drag-sortable within and across columns (SortableJS, shared
 *    group), using the same grip handle + data-id pattern as the list view.
 *  · Themed with the dashboard design tokens (--dash-*) and Tailwind utilities.
 *
 * Expected shape (see data/demo.json):
 *   data = { model: { label, status, schema }, records: [...] }
 * ══════════════════════════════════════════════════════════════════════════ */

import {
    COLOR_CLASS, COLOR_FALLBACK, buildRecordUrl, locale, makeSortable, formatCurrency, formatDate,
} from '../utils';
import { icon, faGripVertical } from '../components/icon.js';
import { renderViewHeader } from '../components';
import { initCreateModal, renderCreateModal } from './renderCreateModal.js';

// Records currently on the board — kept so drag moves can mutate their status.
let _records = [];

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** First letters of up to two words, for the avatar placeholder. */
function initials(name) {
    return String(name ?? '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('') || '?';
}

/** Round avatar — image when available, initials placeholder otherwise. */
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

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render the kanban board markup.
 * @param {object} data — the model document ({ model, records })
 * @param {string} lang — 'es' | 'en'
 */
export function renderKanban(data = {}, lang = 'en') {
    const statuses = data?.model?.status ?? [];
    const records = data?.records ?? [];
    const schema = data?.model?.schema ?? [];
    const modelName = data?.model?.name ?? '';
    const currency = schema.find((f) => f.type === 'monetary')?.currency ?? 'MXN';
    const title = data?.model?.label?.[lang] ?? '';

    _records = records;

    const columns = statuses.map((status) => {
        const cards = records.filter((r) => r.status === status.value);
        return renderColumn(status, cards, currency, modelName, lang);
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

// ── Column ──────────────────────────────────────────────────────────────────────

function renderColumn(status, cards, currency, modelName, lang) {
    const cls = COLOR_CLASS[status.color] ?? COLOR_FALLBACK;
    const title = escape(status[lang] ?? status.value);

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
            ${cards.map((record) => renderCard(record, currency, modelName, lang)).join('')}
        </div>
    </section>`;
}

// ── Card ──────────────────────────────────────────────────────────────────────

function renderCard(record, currency, modelName, lang) {
    const customerName = escape(record.customer?.name ?? '');
    const customerHref = record.customer?.model && record.customer?.id != null
        ? buildRecordUrl(record.customer.model, record.customer.id)
        : '';
    const recordName = escape(record.name ?? '');
    const recordHref = buildRecordUrl(modelName, record.id);
    const amount = record.amount_total != null
        ? escape(formatCurrency(Number(record.amount_total), locale(lang), currency))
        : '';
    const date = record.date_order ? escape(formatDate(record.date_order, locale(lang))) : '';
    const pct = Math.max(0, Math.min(100, Number(record.percentage_delivered) || 0));

    return `
    <article data-id="${escape(record.id)}"
             class="group rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)]
                    p-3 shadow-sm transition-shadow hover:shadow-md">
        <div class="flex items-start justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
                ${avatar(record.avatar, record.name)}
                <div class="flex min-w-0 flex-col gap-0.5">
                    <a href="${recordHref}" class="truncate text-sm font-semibold text-[var(--dash-accent)] hover:underline">
                        ${recordName}
                    </a>
                    ${customerHref
                        ? `<a href="${customerHref}" class="truncate text-xs font-medium text-[var(--dash-accent)] hover:underline">${customerName}</a>`
                        : `<span class="truncate text-xs font-medium text-[var(--dash-text)]">${customerName}</span>`}
                </div>
            </div>
            <button type="button" class="js-kanban-drag-handle inline-flex shrink-0 cursor-grab
                        items-center justify-center text-[var(--dash-text-soft)]
                        hover:text-[var(--dash-text)] active:cursor-grabbing" aria-label="Reorder card">
                ${icon(faGripVertical, 'h-3.5 w-3.5')}
            </button>
        </div>

        <div class="mt-2 flex items-center justify-between text-xs">
            <span class="text-[var(--dash-text-muted)]">${date}</span>
            <span class="font-semibold text-[var(--dash-text)]">${amount}</span>
        </div>

        <div class="mt-2 flex items-center gap-2">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--dash-border)]">
                <div class="h-full rounded-full bg-[var(--dash-accent)]" style="width:${pct}%"></div>
            </div>
            <span class="tabular-nums text-[10px] text-[var(--dash-text-muted)]">${pct}%</span>
        </div>

        ${renderTags(record.tags)}
    </article>`;
}

function renderTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return '';
    return `<div class="mt-2 flex flex-wrap gap-1">${tags.map((tag) => {
        const cls = COLOR_CLASS[tag.color] ?? COLOR_FALLBACK;
        return `<span class="inline-flex items-center rounded-full px-2 py-0.5
                    text-[10px] font-medium ${cls}">${escape(tag.name)}</span>`;
    }).join('')}</div>`;
}

// ── View wiring ─────────────────────────────────────────────────────────────────

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
            sortableOptions: { group: 'kanban' },
            onReorder: (_ids, evt) => {
                // Card dropped in a different column → its status becomes that column's.
                if (evt.from !== evt.to) {
                    const cardId = evt.item?.dataset.id;
                    const toStatus = evt.to?.dataset.status;
                    const record = _records.find((r) => String(r.id) === cardId);
                    if (record) record.status = toStatus;
                }
                refreshColumnCounts();
                // Persisting the new status/order to the backend is decided later.
            },
        }));
    });

    return () => cleanups.forEach((fn) => fn());
}

/** Recompute each column's card count from the DOM after a move. */
function refreshColumnCounts() {
    document.querySelectorAll('[data-kanban-cards]').forEach((col) => {
        const countEl = col.closest('section')?.querySelector('[data-kanban-count]');
        if (countEl) countEl.textContent = String(col.children.length);
    });
}
