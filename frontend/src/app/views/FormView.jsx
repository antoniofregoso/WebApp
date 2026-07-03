import { useLayoutEffect, useMemo, useState } from 'preact/hooks';

import { CommunicationPanel } from '../components/communicationPanel.jsx';
import { FieldControl } from '../components/fields/index.js';
import { faBoxArchive, faChevronLeft, faChevronRight, faFloppyDisk, faPen, faTrash } from '../components/icon.js';
import { buildRecordUrl } from '../utils/index.js';
import { getFormLayout } from './formLayout.js';
import { CreateModal, Icon, SchemaFormLayout, ViewHeader } from './ViewPrimitives.jsx';

function findRelatedRecord(records, model, uuid) {
    for (const record of records) {
        const related = Object.values(record).find((value) => value && typeof value === 'object' && !Array.isArray(value)
            && value.model === model && String(value.uuid) === String(uuid));
        if (related) return related;
    }
    return null;
}

function getRecord(data, routeUuid, recordModel) {
    const records = data?.records ?? [];
    if (routeUuid == null) return records[0] ?? {};
    if (!recordModel || recordModel === data?.model?.name) return records.find((record) => String(record.uuid) === String(routeUuid)) ?? { uuid: routeUuid };
    return findRelatedRecord(records, recordModel, routeUuid) ?? { uuid: routeUuid, name: `${recordModel} ${routeUuid}`, model: recordModel };
}

function inferSchema(record) {
    return Object.keys(record).filter((name) => name !== 'avatar').map((name, index) => ({
        name, type: 'string', label: { es: name === 'name' ? 'Nombre' : name, en: name === 'name' ? 'Name' : name },
        form: index === 0 ? { header: 'title' } : { leftColumn: index - 1 },
    }));
}

function getNavigableRecords(data, recordModel) {
    if (!recordModel || recordModel === data?.model?.name) return data?.records ?? [];
    const records = new Map();
    for (const record of data?.records ?? []) for (const value of Object.values(record)) {
        if (value && typeof value === 'object' && !Array.isArray(value) && value.model === recordModel && value.uuid != null) records.set(String(value.uuid), value);
    }
    return [...records.values()];
}

function Action({ definition, label, ...props }) {
    return <button type="button" class="topbar-action-btn" aria-label={label} data-tooltip={label} {...props}>
        <Icon definition={definition} class="topbar-action-icon" />
    </button>;
}

function RecordNavigation({ data, record, recordModel, lang }) {
    const records = getNavigableRecords(data, recordModel);
    const index = records.findIndex((item) => String(item.uuid) === String(record.uuid));
    const model = recordModel || data?.model?.name;
    const targets = [index > 0 ? records[index - 1] : null, index >= 0 && index < records.length - 1 ? records[index + 1] : null];
    const labels = lang === 'es' ? ['Registro anterior', 'Registro siguiente'] : ['Previous record', 'Next record'];
    return <footer class="form-record-footer"><nav class="form-record-navigation" aria-label={lang === 'es' ? 'Navegación de registros' : 'Record navigation'}>
        {targets.map((target, direction) => target && model
            ? <a href={buildRecordUrl(model, target.uuid)} class="topbar-action-btn form-record-nav-btn" aria-label={labels[direction]}
                data-form-nav={direction ? 'next' : 'previous'} key={direction}><Icon definition={direction ? faChevronRight : faChevronLeft} class="topbar-action-icon" /></a>
            : <button type="button" class="topbar-action-btn form-record-nav-btn" aria-label={labels[direction]} disabled
                data-form-nav={direction ? 'next' : 'previous'} key={direction}><Icon definition={direction ? faChevronRight : faChevronLeft} class="topbar-action-icon" /></button>)}
        <span class="form-record-counter" aria-label={`${lang === 'es' ? 'Registro' : 'Record'} ${index + 1} ${lang === 'es' ? 'de' : 'of'} ${records.length}`}>
            <span class="form-record-counter-current">{index + 1}</span><span aria-hidden="true">/</span><span>{records.length}</span>
        </span>
    </nav></footer>;
}

export function FormView({ data = {}, lang = 'en', options = {} }) {
    const sourceRecord = useMemo(() => getRecord(data, options.recordUuid, options.recordModel), [data, options.recordUuid, options.recordModel]);
    const [record, setRecord] = useState(sourceRecord);
    const [editing, setEditing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    useLayoutEffect(() => { setRecord(sourceRecord); setEditing(false); }, [sourceRecord]);
    const isMainModel = !options.recordModel || options.recordModel === data?.model?.name;
    const schema = isMainModel ? (data?.model?.schema ?? []) : inferSchema(record);
    const layout = getFormLayout(schema);
    const context = { tags: data?.model?.tags ?? [] };
    const title = isMainModel ? (data?.model?.label?.[lang] ?? data?.model?.name ?? '') : (options.recordModel ?? record.model ?? '');
    const setValue = (name, value) => setRecord((current) => ({ ...current, [name]: value }));
    const labels = lang === 'es'
        ? { edit: 'Editar', save: 'Guardar', archive: 'Archivar', delete: 'Borrar' }
        : { edit: 'Edit', save: 'Save', archive: 'Archive', delete: 'Delete' };
    return <main id="dashboard-content" class="dash-content" role="main" aria-label="Form" data-form-root data-form-mode={editing ? 'edit' : 'readonly'}>
        <input type="hidden" data-uuid={record.uuid ?? ''} value={record.uuid ?? ''} />
        <ViewHeader title={title} lang={lang} onCreate={() => setModalOpen(true)} />
        <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <section data-form-record class="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
                {!editing && schema.map((field) => <input type="hidden" name={field.name} value={typeof record[field.name] === 'object' ? '' : (record[field.name] ?? '')} key={`value-${field.name}`} />)}
                <div class="form-record-header flex gap-4 border-b border-[var(--dash-border)] px-5 py-4">
                    {layout.header.image && <div class="shrink-0" data-form-header="image"><FieldControl field={layout.header.image}
                        value={record[layout.header.image.name]} onChange={setValue} lang={lang} readOnly={!editing} context={context} /></div>}
                    <div class="form-record-header-main min-w-0 flex-1"><div class="form-record-title-row flex items-start justify-between gap-4">
                        <div class="min-w-0 flex-1" data-form-header="title">
                            {layout.header.title && <FieldControl field={layout.header.title} value={record[layout.header.title.name]}
                                onChange={setValue} lang={lang} readOnly={!editing} context={context} />}
                            {layout.header.subtitle && <div class="mt-1" data-form-header="subtitle"><FieldControl field={layout.header.subtitle}
                                value={record[layout.header.subtitle.name]} onChange={setValue} lang={lang} readOnly={!editing} context={context} /></div>}
                        </div>
                        <div class="form-record-actions flex items-center gap-2">
                            <Action definition={faPen} label={labels.edit} data-form-edit aria-pressed={String(editing)} onClick={() => setEditing(true)} />
                            <Action definition={faFloppyDisk} label={labels.save} data-form-save disabled={!editing} onClick={() => setEditing(false)} />
                            <Action definition={faBoxArchive} label={labels.archive} data-form-archive />
                            <Action definition={faTrash} label={labels.delete} data-form-delete />
                        </div>
                    </div></div>
                </div>
                <SchemaFormLayout schema={schema} record={record} setValue={setValue} lang={lang} context={context} readOnly={!editing} />
                <RecordNavigation data={data} record={record} recordModel={options.recordModel} lang={lang} />
            </section>
            <CommunicationPanel lang={lang} />
        </div>
        <CreateModal data={data} lang={lang} open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>;
}
