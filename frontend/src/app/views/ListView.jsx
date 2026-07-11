import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { FieldControl } from '../components/fields/index.js';
import { faBoxArchive, faGripVertical, faTrash } from '../components/icon.js';
import { NUMERIC_TYPES, buildRecordUrl, localizedValue } from '../utils/index.js';
import { rememberRecordBreadcrumb } from '../utils/routing.js';
import { makeSortable } from '../utils/sortable.js';
import { CreateModal, Icon, ViewHeader } from './ViewPrimitives.jsx';

export function getListColumns(schema = []) {
    return schema.map((field, index) => ({ field, index }))
        .filter(({ field }) => field.list !== undefined && field.list !== false)
        .sort((a, b) => {
            const left = Number(typeof a.field.list === 'object' ? a.field.list.column : a.field.list);
            const right = Number(typeof b.field.list === 'object' ? b.field.list.column : b.field.list);
            return (Number.isFinite(left) ? left : Number.MAX_SAFE_INTEGER)
                - (Number.isFinite(right) ? right : Number.MAX_SAFE_INTEGER) || a.index - b.index;
        }).map(({ field }) => field);
}

function sortValue(field, value) {
    if (value == null || value === '') return '';
    if (field.type === 'many2one') return localizedValue(value?.name, 'en') ?? '';
    if (['monetary', 'decimal', 'integer', 'percentage'].includes(field.type)) return Number(value);
    if (field.type === 'boolean') return value ? 1 : 0;
    return String(localizedValue(value, 'en'));
}

function Cell({ field, record, data, lang }) {
    const value = record[field.name];
    if (field.name === 'name' && value) {
        const href = buildRecordUrl(data?.model?.name, record.uuid);
        const label = localizedValue(value, lang);
        return <a href={href} onClick={() => rememberRecordBreadcrumb(href, label)}
            class="font-medium text-[var(--dash-accent)] hover:underline">{label}</a>;
    }
    return <FieldControl field={field} value={value} onChange={() => {}} lang={lang} readOnly
        context={{ ...(data?.model ?? {}), tags: data?.model?.tags ?? [], view: 'list' }} />;
}

function SortIcon({ direction }) {
    return <svg viewBox="0 0 8 10" class="h-2.5 w-2 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M4 0.5L7 4H1L4 0.5Z" opacity={direction === 'asc' ? 1 : 0.35} />
        <path d="M4 9.5L1 6H7L4 9.5Z" opacity={direction === 'desc' ? 1 : 0.35} />
    </svg>;
}

export function ListView({ data = {}, lang = 'en' }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState(() => new Set());
    const [sort, setSort] = useState({ field: '', direction: '' });
    const tbodyRef = useRef(null);
    const columns = useMemo(() => getListColumns(data?.model?.schema ?? []), [data?.model?.schema]);
    const records = useMemo(() => {
        const items = [...(data.records ?? [])];
        const field = columns.find((item) => item.name === sort.field);
        if (!field || !sort.direction) return items;
        return items.sort((a, b) => {
            const left = sortValue(field, a[field.name]);
            const right = sortValue(field, b[field.name]);
            const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
            return sort.direction === 'asc' ? result : -result;
        });
    }, [data.records, columns, sort]);
    useEffect(() => {
        if (!tbodyRef.current) return undefined;
        return makeSortable(tbodyRef.current, {
            handle: '.js-list-drag-handle',
            sortableOptions: { forceFallback: true, ghostClass: 'list-drag-ghost', chosenClass: 'list-drag-chosen', dragClass: 'list-drag-item' },
        });
    }, [records.length]);
    const toggle = (uuid) => setSelected((current) => {
        const next = new Set(current);
        if (next.has(uuid)) next.delete(uuid); else next.add(uuid);
        return next;
    });
    const allSelected = records.length > 0 && records.every((record) => selected.has(String(record.uuid)));
    const setAll = (checked) => setSelected(checked ? new Set(records.map((record) => String(record.uuid))) : new Set());
    const action = (definition, label) => <button type="button" class="topbar-action-btn" aria-label={label} data-tooltip={label}>
        <Icon definition={definition} class="topbar-action-icon" />
    </button>;
    return <main id="dashboard-content" class="dash-content" role="main" aria-label="List">
        <ViewHeader title={data?.model?.label?.[lang] ?? ''} count={data?.pagination?.total ?? records.length} lang={lang}
            actions={selected.size > 0 && <>{action(faTrash, lang === 'es' ? 'Borrar' : 'Delete')}{action(faBoxArchive, lang === 'es' ? 'Archivar' : 'Archive')}</>}
            onCreate={() => setModalOpen(true)} />
        <div class="w-full overflow-hidden rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
            {columns.length > 0 && records.length > 0 ? <div class="overflow-x-auto"><table class="w-full border-collapse text-sm">
                <thead><tr class="border-b border-[var(--dash-border)] bg-[var(--dash-surface-hover)]">
                    <th class="w-10" aria-hidden="true" />
                    <th class="w-10 px-2 text-center align-middle"><input type="checkbox" checked={allSelected}
                        class="js-list-select-all h-4 w-4" aria-label={lang === 'es' ? 'Seleccionar todas las filas' : 'Select all rows'}
                        onChange={(event) => setAll(event.currentTarget.checked)} /></th>
                    {columns.map((field) => {
                        const align = NUMERIC_TYPES.has(field.type) ? 'text-right' : 'text-left';
                        const direction = sort.field === field.name ? sort.direction : '';
                        return <th class={`${align} whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--dash-text-muted)]`} key={field.name}>
                            <span class="inline-flex items-center gap-0.5">{field.label?.[lang] ?? field.name}
                                {field.list?.order === true && <button type="button" class="js-list-sort ml-1 inline-flex" aria-label={`Sort by ${field.label?.[lang] ?? field.name}`}
                                    onClick={() => setSort({ field: field.name, direction: direction === 'asc' ? 'desc' : 'asc' })}><SortIcon direction={direction} /></button>}
                            </span>
                        </th>;
                    })}
                </tr></thead>
                <tbody ref={tbodyRef} data-list-rows>{records.map((record) => {
                    const uuid = String(record.uuid ?? '');
                    return <tr data-uuid={uuid} class={`border-b border-[var(--dash-border-soft)] last:border-0 hover:bg-[var(--dash-surface-hover)] ${selected.has(uuid) ? 'list-row--selected' : ''}`} key={uuid}>
                        <td class="w-10 px-2 text-center"><button type="button" class="js-list-drag-handle inline-flex cursor-grab" aria-label="Reorder row"><Icon definition={faGripVertical} class="h-3.5 w-3.5" /></button></td>
                        <td class="w-10 px-2 text-center"><input type="checkbox" checked={selected.has(uuid)} class="js-list-row-select h-4 w-4"
                            aria-label={lang === 'es' ? 'Seleccionar fila' : 'Select row'} onChange={() => toggle(uuid)} /></td>
                        {columns.map((field) => <td class={`${NUMERIC_TYPES.has(field.type) ? 'text-right' : 'text-left'} whitespace-nowrap px-4 py-2.5 text-[var(--dash-text)]`} key={field.name}>
                            <Cell field={field} record={record} data={data} lang={lang} />
                        </td>)}
                    </tr>;
                })}</tbody>
            </table></div> : <div class="px-5 py-10 text-center text-sm text-[var(--dash-text-muted)]">{lang === 'es' ? 'Sin registros' : 'No records'}</div>}
        </div>
        <CreateModal data={data} lang={lang} open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>;
}
