import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { FieldControl } from '../components/fields/index.js';
import { faGripVertical, faUser } from '../components/icon.js';
import { COLOR_CLASS, COLOR_FALLBACK, buildRecordUrl } from '../utils/index.js';
import { makeSortable } from '../utils/sortable.js';
import { CreateModal, Icon, ViewHeader } from './ViewPrimitives.jsx';

function buildLayout(schema = []) {
    const layout = { image: null, title: null, subtitle: null, leftColumn: [], rightColumn: [], footer: [] };
    schema.forEach((field, index) => {
        const config = field.kanban;
        if (!config) return;
        const header = String(config.header ?? '').toLowerCase();
        if (Object.hasOwn(layout, header) && !Array.isArray(layout[header])) layout[header] = field;
        else for (const area of ['leftColumn', 'rightColumn', 'footer']) {
            const position = Number(config[area]);
            if (Number.isFinite(position)) layout[area].push({ field, position, index });
        }
    });
    for (const area of ['leftColumn', 'rightColumn', 'footer']) {
        layout[area].sort((a, b) => a.position - b.position || a.index - b.index);
    }
    return layout;
}

function Avatar({ src, name }) {
    return src
        ? <img src={src} alt={name} class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[var(--dash-border)]" />
        : <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--dash-surface-hover)] text-[var(--dash-text-muted)] ring-1 ring-[var(--dash-border)]"><Icon definition={faUser} class="h-3.5 w-3.5" /></span>;
}

function Value({ field, value, lang, context }) {
    if (value == null || value === '') return null;
    return <FieldControl field={field} value={value} onChange={() => {}} lang={lang} readOnly context={context} />;
}

function Card({ record, layout, modelName, lang, context }) {
    const title = layout.title ? record[layout.title.name] : '';
    const titleText = title?.name ?? title ?? '';
    const href = buildRecordUrl(modelName, record.uuid);
    const column = (item) => {
        const value = record[item.field.name];
        if (value == null || value === '') return null;
        return <div class="flex items-baseline justify-between gap-1 text-xs" key={item.field.name}>
            <span class="text-[var(--dash-text-muted)]">{item.field.label?.[lang] ?? item.field.name}</span>
            <span class="font-medium text-[var(--dash-text)]"><Value field={item.field} value={value} lang={lang} context={context} /></span>
        </div>;
    };
    return (
        <article data-uuid={record.uuid ?? ''} class="group rounded-lg border border-[var(--dash-border)] bg-[var(--dash-bg)] p-3 shadow-sm transition-shadow hover:shadow-md">
            <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2">
                    <Avatar src={layout.image ? record[layout.image.name] : ''} name={titleText} />
                    <div class="flex min-w-0 flex-col gap-0.5">
                        {titleText && <a href={href} class="truncate text-sm font-semibold text-[var(--dash-accent)] hover:underline">{titleText}</a>}
                        {layout.subtitle && <span class="truncate text-xs text-[var(--dash-text-muted)]"><Value field={layout.subtitle}
                            value={record[layout.subtitle.name]} lang={lang} context={context} /></span>}
                    </div>
                </div>
                <button type="button" class="js-kanban-drag-handle inline-flex shrink-0 cursor-grab items-center justify-center text-[var(--dash-text-soft)] hover:text-[var(--dash-text)]" aria-label="Reorder card">
                    <Icon definition={faGripVertical} class="h-3.5 w-3.5" />
                </button>
            </div>
            {(layout.leftColumn.length > 0 || layout.rightColumn.length > 0) && <div class="mt-2 flex gap-2">
                <div class="flex flex-1 flex-col gap-1">{layout.leftColumn.map(column)}</div>
                <div class="flex flex-1 flex-col items-end gap-1">{layout.rightColumn.map(column)}</div>
            </div>}
            {layout.footer.length > 0 && <div class="mt-2 flex flex-col gap-1">{layout.footer.map(({ field }) => {
                const value = record[field.name];
                return value == null || value === '' ? null : <div class="text-xs text-[var(--dash-text-muted)]" key={field.name}>
                    {field.type !== 'percentage' && <span>{field.label?.[lang] ?? field.name}: </span>}
                    <Value field={field} value={value} lang={lang} context={context} />
                </div>;
            })}</div>}
        </article>
    );
}

function Cards({ records, groupValue, layout, modelName, lang, context, groupBy, onMove }) {
    const ref = useRef(null);
    useEffect(() => makeSortable(ref.current, {
        handle: '.js-kanban-drag-handle',
        sortableOptions: { group: 'kanban', forceFallback: true, ghostClass: 'kanban-drag-ghost', chosenClass: 'kanban-drag-chosen', dragClass: 'kanban-drag-item' },
        onReorder: (_ids, event) => onMove(event.item?.dataset.uuid, event.to?.dataset.groupValue),
    }), [onMove]);
    return <div ref={ref} data-kanban-cards data-group-value={groupValue}
        class={groupBy ? 'flex min-h-24 flex-col gap-2 p-2' : 'grid w-full grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3'}>
        {records.map((record) => <Card record={record} layout={layout} modelName={modelName} lang={lang} context={context} key={record.uuid} />)}
    </div>;
}

export function KanbanView({ data = {}, lang = 'en' }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [records, setRecords] = useState(data.records ?? []);
    useEffect(() => setRecords(data.records ?? []), [data.records]);
    const schema = data?.model?.schema ?? [];
    const layout = useMemo(() => buildLayout(schema), [schema]);
    const configured = data?.model?.groupBy;
    const groupBy = typeof configured === 'string' && configured.trim() ? configured.trim() : null;
    const groups = groupBy && Array.isArray(data?.model?.[groupBy]) ? data.model[groupBy] : [];
    const context = { ...(data?.model ?? {}), tags: data?.model?.tags ?? [] };
    const onMove = (uuid, groupValue) => {
        if (!groupBy || groupValue == null) return;
        setRecords((current) => current.map((record) => String(record.uuid) === String(uuid) ? { ...record, [groupBy]: groupValue } : record));
    };
    return <main id="dashboard-content" class="dash-content" role="main" aria-label="Kanban Board">
        <ViewHeader title={data?.model?.label?.[lang] ?? ''} count={data?.pagination?.total ?? records.length}
            lang={lang} onCreate={() => setModalOpen(true)} />
        <div class="flex items-start gap-4 overflow-x-auto pb-2">
            {groupBy ? groups.map((group) => {
                const cards = records.filter((record) => String(record[groupBy]) === String(group.value));
                return <section class="flex min-w-64 flex-1 flex-col rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]" key={group.value}>
                    <header class="flex items-center justify-between gap-2 border-b border-[var(--dash-border)] px-3 py-2.5">
                        <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_CLASS[group.color] ?? COLOR_FALLBACK}`}>{group[lang] ?? group.value}</span>
                        <span data-kanban-count class="text-xs text-[var(--dash-text-muted)]">{cards.length}</span>
                    </header>
                    <Cards records={cards} groupValue={group.value} layout={layout} modelName={data?.model?.name ?? ''}
                        lang={lang} context={context} groupBy={groupBy} onMove={onMove} />
                </section>;
            }) : <Cards records={records} layout={layout} modelName={data?.model?.name ?? ''} lang={lang}
                context={context} groupBy={null} onMove={onMove} />}
        </div>
        <CreateModal data={data} lang={lang} open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>;
}
