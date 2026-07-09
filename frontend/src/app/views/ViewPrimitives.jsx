import { useEffect, useState } from 'preact/hooks';

import { FieldControl, FormField } from '../components/fields/index.js';
import { icon, faFloppyDisk, faPlus, faXmark } from '../components/icon.js';
import { createEmptyRecord, getFormLayout } from './formLayout.js';

export function Icon({ definition, class: className = '' }) {
    return <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon(definition, className) }} />;
}

export function ViewHeader({ title = '', count = null, lang = 'en', class: className = '', actions = null, onCreate }) {
    const label = lang === 'es' ? 'Crear' : 'Create';
    return (
        <header class={`mb-5 flex items-center justify-between gap-4 ${className}`.trim()}>
            <div class="flex items-baseline gap-3">
                <h2 class="text-base font-semibold text-[var(--dash-text)]">{title}</h2>
                {count != null && <span class="text-xs text-[var(--dash-text-muted)]">{count}</span>}
            </div>
            <div class="flex items-center gap-2">
                {actions}
                <button type="button" class="topbar-action-btn" aria-label={label} data-tooltip={label}
                    data-create-open onClick={onCreate}>
                    <Icon definition={faPlus} class="topbar-action-icon" />
                </button>
            </div>
        </header>
    );
}

function FormColumns({ layout, record, setValue, lang, context, readOnly }) {
    const renderField = ({ field }) => (
        <FormField key={field.name} field={field} value={record[field.name]} onChange={setValue}
            lang={lang} readOnly={readOnly} context={context} />
    );
    return (
        <>
            {(layout.leftColumn.length > 0 || layout.rightColumn.length > 0) && (
                <div class="form-record-body grid gap-x-8 gap-y-4 px-5 py-5 md:grid-cols-2">
                    <div class="flex min-w-0 flex-col gap-4">{layout.leftColumn.map(renderField)}</div>
                    <div class="flex min-w-0 flex-col gap-4">{layout.rightColumn.map(renderField)}</div>
                </div>
            )}
        </>
    );
}

export function SchemaFormLayout({ schema, record, setValue, lang, context, readOnly }) {
    const layout = getFormLayout(schema);
    const [activeTab, setActiveTab] = useState(layout.tabs[0]?.position ?? null);
    useEffect(() => setActiveTab(layout.tabs[0]?.position ?? null), [schema]);
    return (
        <>
            <FormColumns layout={layout} record={record} setValue={setValue} lang={lang} context={context} readOnly={readOnly} />
            {layout.tabs.length > 0 && (
                <div class="form-record-tabs" data-record-tabs>
                    <div class="form-record-tab-list" role="tablist">
                        {layout.tabs.map((tab) => {
                            const field = tab.fields[0]?.field;
                            const active = activeTab === tab.position;
                            return <button type="button" role="tab" class={`form-record-tab ${active ? 'form-record-tab--active' : ''}`}
                                aria-selected={String(active)} data-record-tab={tab.position} key={tab.position}
                                onClick={() => setActiveTab(tab.position)}>{field?.label?.[lang] ?? field?.name}</button>;
                        })}
                    </div>
                    {layout.tabs.map((tab) => (
                        <div role="tabpanel" class="form-record-tab-panel" hidden={activeTab !== tab.position}
                            data-record-tab-panel={tab.position} key={tab.position}>
                            {tab.fields.map(({ field }) => <FormField key={field.name} field={field}
                                value={record[field.name]} onChange={setValue} lang={lang} readOnly={readOnly} context={context} hideLabel />)}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

export function CreateModal({ data = {}, lang = 'en', open, onClose }) {
    const schema = data?.model?.schema ?? [];
    const context = { ...(data?.model ?? {}), tags: data?.model?.tags ?? [] };
    const [record, setRecord] = useState(() => createEmptyRecord(schema));
    useEffect(() => { if (open) setRecord(createEmptyRecord(schema)); }, [open, schema]);
    useEffect(() => {
        if (!open) return undefined;
        const close = (event) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', close);
        return () => document.removeEventListener('keydown', close);
    }, [open, onClose]);
    if (!open) return null;
    const layout = getFormLayout(schema);
    const title = `${lang === 'es' ? 'Crear' : 'Create'} ${data?.model?.label?.[lang] ?? data?.model?.name ?? ''}`;
    const closeLabel = lang === 'es' ? 'Cerrar' : 'Close';
    const saveLabel = lang === 'es' ? 'Guardar' : 'Save';
    const setValue = (name, value) => setRecord((current) => ({ ...current, [name]: value }));
    return (
        <div class="form-modal" data-form-modal>
            <div class="form-modal-backdrop" onClick={onClose} />
            <section class="form-modal-panel" role="dialog" aria-modal="true" aria-label={title}>
                <header class="form-modal-header">
                    <h3 class="text-base font-semibold text-[var(--dash-text)]">{title}</h3>
                    <button type="button" class="topbar-action-btn" aria-label={closeLabel} onClick={onClose}>
                        <Icon definition={faXmark} class="topbar-action-icon" />
                    </button>
                </header>
                <div class="form-modal-body" data-form-mode="edit">
                    <div class="flex gap-4 border-b border-[var(--dash-border)] px-5 py-4">
                        {layout.header.image && <div data-form-header="image"><FieldControl field={layout.header.image}
                            value={record[layout.header.image.name]} onChange={setValue} lang={lang} context={context} /></div>}
                        <div class="min-w-0 flex-1">
                            {layout.header.title && <FieldControl field={layout.header.title} value={record[layout.header.title.name]}
                                onChange={setValue} lang={lang} context={context} />}
                            {layout.header.subtitle && <div class="mt-1"><FieldControl field={layout.header.subtitle}
                                value={record[layout.header.subtitle.name]} onChange={setValue} lang={lang} context={context} /></div>}
                        </div>
                    </div>
                    <SchemaFormLayout schema={schema} record={record} setValue={setValue} lang={lang} context={context} readOnly={false} />
                </div>
                <footer class="form-modal-footer">
                    <button type="button" class="topbar-action-btn topbar-action-btn--active" aria-label={saveLabel} onClick={onClose}>
                        <Icon definition={faFloppyDisk} class="topbar-action-icon" />
                    </button>
                </footer>
            </section>
        </div>
    );
}
