import {
    icon, faBoxArchive, faChevronLeft, faChevronRight, faEnvelope, faFileLines,
    faFloppyDisk, faNoteSticky, faPen, faPlus, faTrash, faUser, faWhatsapp,
} from '../components/icon.js';
import { renderViewHeader } from '../components';
import { buildRecordUrl } from '../utils';
import {
    getField, label, renderFieldControl, renderFormLayout, renderTextArea, setFormInputsEnabled,
} from './formFields.js';
import { initCreateModal, renderCreateModal } from './renderCreateModal.js';
import {
    appendItem, initDocumentEditor, initQuillEditor, initTextEditor,
    renderDocumentPicker, renderItemList, renderQuillComposer, renderTextComposer,
} from './noteEditor.js';

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function findRelatedRecord(records, model, uuid) {
    for (const record of records) {
        const related = Object.values(record).find((value) => (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value.model === model &&
            String(value.uuid) === String(uuid)
        ));
        if (related) return related;
    }
    return null;
}

function getRecord(data, routeUuid, recordModel) {
    const records = data?.records ?? [];
    if (routeUuid == null) return records[0] ?? {};
    const modelName = data?.model?.name;
    if (!recordModel || recordModel === modelName) {
        return records.find((record) => String(record.uuid) === String(routeUuid)) ?? { uuid: routeUuid };
    }
    return findRelatedRecord(records, recordModel, routeUuid) ?? {
        uuid: routeUuid,
        name: `${recordModel} ${routeUuid}`,
        model: recordModel,
    };
}

function inferSchema(record, lang) {
    return Object.keys(record)
        .filter((name) => name !== 'avatar')
        .map((name) => ({
            name,
            type: 'string',
            label: {
                es: name === 'model' ? 'Modelo' : name === 'name' ? 'Nombre' : name,
                en: name === 'model' ? 'Model' : name === 'name' ? 'Name' : name,
            },
        }));
}

function shouldShowWhatsapp(data, options) {
    if (data?.model?.showWhatsapp === false) return false;
    if (data?.model?.features?.whatsapp === false) return false;
    if (typeof options.showWhatsapp === 'boolean') return options.showWhatsapp;
    if (data?.model?.showWhatsapp === true) return true;
    if (data?.model?.features?.whatsapp === true) return true;
    return false;
}

function initials(name) {
    return String(name ?? '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('') || '?';
}

function avatar(record) {
    const src = record.avatar;
    const name = record.name ?? '';
    if (src) {
        return `<img src="${escape(src)}" alt="${escape(name)}"
                    class="h-20 w-20 rounded-xl object-cover ring-1 ring-[var(--dash-border)]" />`;
    }
    return `<span class="inline-flex h-20 w-20 items-center justify-center rounded-xl
                 bg-[var(--dash-surface-hover)] text-[var(--dash-text-muted)]
                 ring-1 ring-[var(--dash-border)]">
        ${icon(faUser, 'h-10 w-10')}
    </span>`;
}

const ACTIVITY_TABS = {
    notes: {
        icon: (l) => icon(faNoteSticky, 'topbar-action-icon'),
        label: { es: 'Notas', en: 'Notes' },
        addLabel: { es: 'Agregar nota', en: 'Add note' },
        empty: { es: 'Aún no hay notas.', en: 'No notes yet.' },
    },
    whatsapp: {
        icon: (l) => icon(faWhatsapp, 'topbar-action-icon'),
        label: { es: 'WhatsApp', en: 'WhatsApp' },
        addLabel: { es: 'Nueva conversación', en: 'New conversation' },
        empty: { es: 'Sin conversaciones de WhatsApp.', en: 'No WhatsApp conversations.' },
    },
    messages: {
        icon: (l) => icon(faEnvelope, 'topbar-action-icon'),
        label: { es: 'Mensajes', en: 'Messages' },
        addLabel: { es: 'Nuevo mensaje', en: 'New message' },
        empty: { es: 'Sin mensajes.', en: 'No messages.' },
    },
    documents: {
        icon: (l) => icon(faFileLines, 'topbar-action-icon'),
        label: { es: 'Documentos', en: 'Documents' },
        addLabel: { es: 'Subir documento', en: 'Upload document' },
        empty: { es: 'Sin documentos adjuntos.', en: 'No documents attached.' },
    },
};

const TAB_ORDER = ['notes', 'whatsapp', 'messages', 'documents'];

const COMPOSERS = {
    notes:     (lang) => renderQuillComposer('notes', lang),
    messages:  (lang) => renderQuillComposer('messages', lang),
    whatsapp:  (lang) => renderTextComposer('whatsapp', lang),
    documents: ()     => renderDocumentPicker(),
};

function renderTabPanel(key, lang, isActive) {
    const def = ACTIVITY_TABS[key];
    const addLabel = def.addLabel[lang] ?? def.addLabel.en;
    const empty = def.empty[lang] ?? def.empty.en;
    const composer = COMPOSERS[key]?.(lang) ?? '';
    return `
    <div data-form-tab-panel="${key}"${isActive ? '' : ' hidden'}>
        <div class="flex items-center justify-between border-b border-[var(--dash-border)] px-4 py-2">
            <span class="text-xs font-medium text-[var(--dash-text-muted)]">${escape(def.label[lang] ?? def.label.en)}</span>
            <button type="button"
                class="topbar-action-btn"
                aria-label="${escape(addLabel)}"
                data-tooltip="${escape(addLabel)}"
                data-form-tab-add="${key}">
                ${icon(faPlus, 'topbar-action-icon')}
            </button>
        </div>
        ${composer}
        <div data-note-empty class="min-h-48 px-4 py-5 text-sm text-[var(--dash-text-muted)]">
            ${escape(empty)}
        </div>
        ${composer ? renderItemList() : ''}
    </div>`;
}

function renderActivityPanel(showWhatsapp, lang) {
    const activeTab = 'notes';

    return `<aside class="rounded-xl border border-[var(--dash-border)]
                    bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]"
                data-form-activity>
        <div class="grid border-b border-[var(--dash-border)] px-3 py-2"
             style="grid-template-columns: repeat(${TAB_ORDER.length}, minmax(0, 1fr));">
            ${TAB_ORDER.map((key) => {
                const def = ACTIVITY_TABS[key];
                const tabLabel = def.label[lang] ?? def.label.en;
                const isActive = key === activeTab;
                return `<div class="form-activity-tab ${isActive ? 'form-activity-tab--active' : ''}">
                    <button type="button"
                        class="topbar-action-btn"
                        aria-label="${escape(tabLabel)}"
                        aria-pressed="${isActive}"
                        data-tooltip="${escape(tabLabel)}"
                        data-form-tab="${key}">
                        ${ACTIVITY_TABS[key].icon(lang)}
                    </button>
                </div>`;
            }).join('')}
        </div>
        ${TAB_ORDER.map((key) => renderTabPanel(key, lang, key === activeTab)).join('')}
    </aside>`;
}

function renderFormActions(lang) {
    const editLabel = lang === 'es' ? 'Editar' : 'Edit';
    const saveLabel = lang === 'es' ? 'Guardar' : 'Save';
    const archiveLabel = lang === 'es' ? 'Archivar' : 'Archive';
    const deleteLabel = lang === 'es' ? 'Borrar' : 'Delete';

    return `<div class="flex items-center gap-2">
        <button type="button"
            class="topbar-action-btn"
            aria-label="${editLabel}"
            data-tooltip="${editLabel}"
            data-form-edit>
            ${icon(faPen, 'topbar-action-icon')}
        </button>
        <button type="button"
            class="topbar-action-btn"
            aria-label="${saveLabel}"
            data-tooltip="${saveLabel}"
            data-form-save
            disabled>
            ${icon(faFloppyDisk, 'topbar-action-icon')}
        </button>
        <button type="button"
            class="topbar-action-btn"
            aria-label="${archiveLabel}"
            data-tooltip="${archiveLabel}"
            data-form-archive>
            ${icon(faBoxArchive, 'topbar-action-icon')}
        </button>
        <button type="button"
            class="topbar-action-btn"
            aria-label="${deleteLabel}"
            data-tooltip="${deleteLabel}"
            data-form-delete>
            ${icon(faTrash, 'topbar-action-icon')}
        </button>
    </div>`;
}

function getNavigableRecords(data, recordModel) {
    const records = data?.records ?? [];
    const modelName = data?.model?.name;
    if (!recordModel || recordModel === modelName) return records;

    const relatedRecords = new Map();
    records.forEach((record) => {
        Object.values(record).forEach((value) => {
            if (value && typeof value === 'object' && !Array.isArray(value)
                && value.model === recordModel && value.uuid != null) {
                relatedRecords.set(String(value.uuid), value);
            }
        });
    });
    return Array.from(relatedRecords.values());
}

function renderRecordNavigation(data, record, recordModel, lang) {
    const records = getNavigableRecords(data, recordModel);
    const modelName = recordModel || data?.model?.name;
    const currentIndex = records.findIndex((item) => String(item.uuid) === String(record.uuid));
    const position = currentIndex >= 0 ? currentIndex + 1 : 0;
    const previousRecord = currentIndex > 0 ? records[currentIndex - 1] : null;
    const nextRecord = currentIndex >= 0 && currentIndex < records.length - 1
        ? records[currentIndex + 1]
        : null;
    const previousLabel = lang === 'es' ? 'Registro anterior' : 'Previous record';
    const nextLabel = lang === 'es' ? 'Registro siguiente' : 'Next record';
    const positionLabel = lang === 'es'
        ? `Registro ${position} de ${records.length}`
        : `Record ${position} of ${records.length}`;

    const navigationButton = (targetRecord, label, direction, iconDef) => targetRecord && modelName
        ? `<a href="${buildRecordUrl(modelName, targetRecord.uuid)}"
                class="topbar-action-btn form-record-nav-btn"
                aria-label="${label}" data-tooltip="${label}" data-form-nav="${direction}">
                ${icon(iconDef, 'topbar-action-icon')}
            </a>`
        : `<button type="button" class="topbar-action-btn form-record-nav-btn"
                aria-label="${label}" data-form-nav="${direction}" disabled>
                ${icon(iconDef, 'topbar-action-icon')}
            </button>`;

    return `<footer class="form-record-footer">
        <nav class="form-record-navigation" aria-label="${lang === 'es' ? 'Navegación de registros' : 'Record navigation'}">
            ${navigationButton(previousRecord, previousLabel, 'previous', faChevronLeft)}
            ${navigationButton(nextRecord, nextLabel, 'next', faChevronRight)}
            <span class="form-record-counter" aria-label="${positionLabel}">
                <span class="form-record-counter-current">${position}</span>
                <span aria-hidden="true">/</span>
                <span>${records.length}</span>
            </span>
        </nav>
    </footer>`;
}

/**
 * Render a dynamic record form.
 * @param {object} data - model document ({ model, records })
 * @param {string} lang - 'es' | 'en'
 * @param {object} options - { recordModel, recordUuid, showWhatsapp }
 */
export function renderForm(data = {}, lang = 'en', options = {}) {
    const record = getRecord(data, options.recordUuid, options.recordModel);
    const isMainModel = !options.recordModel || options.recordModel === data?.model?.name;
    const schema = isMainModel ? (data?.model?.schema ?? []) : inferSchema(record, lang);
    const modelTitle = isMainModel
        ? (data?.model?.label?.[lang] ?? data?.model?.name ?? '')
        : (options.recordModel ?? record.model ?? '');
    const nameField = getField(schema, 'name') ?? {
        name: 'name',
        type: 'string',
        label: { es: 'Nombre', en: 'Name' },
    };
    const descriptionField = getField(schema, 'description');
    const showAvatar = true;
    const showWhatsapp = shouldShowWhatsapp(data, options);

    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="Form" data-form-root data-form-mode="readonly">
        <input type="hidden" data-uuid="${escape(record.uuid ?? '')}" value="${escape(record.uuid ?? '')}" />
        ${renderViewHeader({ title: modelTitle, lang })}
        <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <section data-form-record class="rounded-xl border border-[var(--dash-border)]
                            bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
                <div class="form-record-header flex gap-4 border-b border-[var(--dash-border)] px-5 py-4">
                    ${showAvatar ? `<div class="shrink-0">${avatar(record)}</div>` : ''}
                    <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-4">
                            <div class="min-w-0">
                                ${renderFieldControl(nameField, record.name ?? '', data, lang, 'form-control--title')}
                            </div>
                            ${renderFormActions(lang)}
                        </div>
                        ${descriptionField ? `<div class="mt-4">
                            <label class="text-xs font-medium text-[var(--dash-text-muted)]">
                                ${label(descriptionField, lang)}
                            </label>
                            <div class="mt-1">${renderTextArea(descriptionField, record.description, 'form-control--textarea')}</div>
                        </div>` : ''}
                    </div>
                </div>

                ${renderFormLayout(schema, record, data, lang)}
                ${renderRecordNavigation(data, record, options.recordModel, lang)}
            </section>

            ${renderActivityPanel(showWhatsapp, lang)}
        </div>
        ${renderCreateModal(data, lang)}
    </main>
    `;
}

export function initForm(lang = 'en') {
    const root = document.querySelector('[data-form-root]');
    const editButton = root?.querySelector('[data-form-edit]');
    const saveButton = root?.querySelector('[data-form-save]');
    const recordForm = root?.querySelector('[data-form-record]');
    const cleanupCreateModal = initCreateModal(root, lang);
    if (!root || !editButton || !saveButton || !recordForm) return cleanupCreateModal;

    const enterEditMode = () => {
        root.dataset.formMode = 'edit';
        setFormInputsEnabled(recordForm, true, lang);
        saveButton.disabled = false;
        editButton.classList.add('topbar-action-btn--active');
        editButton.setAttribute('aria-pressed', 'true');
        recordForm.querySelector('[data-form-input]')?.focus();
    };

    const enterReadonlyMode = () => {
        root.dataset.formMode = 'readonly';
        setFormInputsEnabled(recordForm, false, lang);
        saveButton.disabled = true;
        editButton.classList.remove('topbar-action-btn--active');
        editButton.setAttribute('aria-pressed', 'false');
    };

    editButton.addEventListener('click', enterEditMode);
    saveButton.addEventListener('click', enterReadonlyMode);

    const activityAside = root.querySelector('[data-form-activity]');
    activityAside?.querySelectorAll('[data-form-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.formTab;
            activityAside.querySelectorAll('[data-form-tab]').forEach((b) => {
                const active = b.dataset.formTab === key;
                b.setAttribute('aria-pressed', String(active));
                b.closest('.form-activity-tab')?.classList.toggle('form-activity-tab--active', active);
            });
            activityAside.querySelectorAll('[data-form-tab-panel]').forEach((panel) => {
                panel.hidden = panel.dataset.formTabPanel !== key;
            });
        });
    });

    const panel = (key) => activityAside?.querySelector(`[data-form-tab-panel="${key}"]`);

    const cleanupNotes     = initQuillEditor(panel('notes'), lang, 'notes',
        (html) => appendItem(panel('notes'), html));
    const cleanupMessages  = initQuillEditor(panel('messages'), lang, 'messages',
        (html) => appendItem(panel('messages'), html));
    const cleanupWhatsapp  = initTextEditor(panel('whatsapp'), lang, 'whatsapp',
        (text) => appendItem(panel('whatsapp'), text));
    const cleanupDocuments = initDocumentEditor(panel('documents'));

    return () => {
        editButton.removeEventListener('click', enterEditMode);
        saveButton.removeEventListener('click', enterReadonlyMode);
        cleanupNotes?.();
        cleanupMessages?.();
        cleanupWhatsapp?.();
        cleanupDocuments?.();
        cleanupCreateModal();
    };
}
