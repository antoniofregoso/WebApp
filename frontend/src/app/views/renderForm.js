import {
    icon, faBoxArchive, faChevronLeft, faChevronRight, faFloppyDisk, faPen, faTrash, faUser,
} from '../components/icon.js';
import { mountCommunicationPanel } from '../components/communicationPanel.jsx';
import { renderViewHeader } from '../components';
import { buildRecordUrl } from '../utils';
import {
    getFormLayout, initHelpTooltips, initPercentageSliders, initTagPickers, renderFieldControl,
    renderFormLayout, setFormInputsEnabled,
} from './formFields.js';
import { initCreateModal, renderCreateModal } from './renderCreateModal.js';
import { initFormRichTextEditors } from './noteEditor.js';

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

function inferSchema(record) {
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

function avatar(record, imageField, titleField) {
    const src = record[imageField.name];
    const titleValue = titleField ? record[titleField.name] : record.name;
    const name = titleValue?.name ?? titleValue ?? '';
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

function renderFormActions(lang) {
    const editLabel = lang === 'es' ? 'Editar' : 'Edit';
    const saveLabel = lang === 'es' ? 'Guardar' : 'Save';
    const archiveLabel = lang === 'es' ? 'Archivar' : 'Archive';
    const deleteLabel = lang === 'es' ? 'Borrar' : 'Delete';

    return `<div class="form-record-actions flex items-center gap-2">
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
    const schema = isMainModel ? (data?.model?.schema ?? []) : inferSchema(record);
    const modelTitle = isMainModel
        ? (data?.model?.label?.[lang] ?? data?.model?.name ?? '')
        : (options.recordModel ?? record.model ?? '');
    const formLayout = getFormLayout(schema);
    const { image: imageField, title: titleField, subtitle: subtitleField } = formLayout.header;
    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="Form" data-form-root data-form-mode="readonly">
        <input type="hidden" data-uuid="${escape(record.uuid ?? '')}" value="${escape(record.uuid ?? '')}" />
        ${renderViewHeader({ title: modelTitle, lang })}
        <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <section data-form-record class="rounded-xl border border-[var(--dash-border)]
                            bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
                <div class="form-record-header flex gap-4 border-b border-[var(--dash-border)] px-5 py-4">
                    ${imageField ? `<div class="shrink-0" data-form-header="image">${avatar(record, imageField, titleField)}</div>` : ''}
                    <div class="form-record-header-main min-w-0 flex-1">
                        <div class="form-record-title-row flex items-start justify-between gap-4">
                            <div class="min-w-0 flex-1" data-form-header="title">
                                ${titleField ? renderFieldControl(
                                    titleField,
                                    record[titleField.name],
                                    data,
                                    lang,
                                    'form-control--title',
                                ) : ''}
                                ${subtitleField ? `<div class="mt-1" data-form-header="subtitle">
                                    ${renderFieldControl(
                                        subtitleField,
                                        record[subtitleField.name],
                                        data,
                                        lang,
                                        'form-control--subtitle',
                                    )}
                                </div>` : ''}
                            </div>
                            ${renderFormActions(lang)}
                        </div>
                    </div>
                </div>

                ${renderFormLayout(schema, record, data, lang)}
                ${renderRecordNavigation(data, record, options.recordModel, lang)}
            </section>

            <div data-form-activity-root></div>
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
    const richTextEditors = initFormRichTextEditors(recordForm);
    const cleanupPercentageSliders = initPercentageSliders(recordForm);
    const tagPickers = initTagPickers(recordForm, lang);
    const cleanupHelpTooltips = initHelpTooltips(recordForm);
    const cleanupCommunicationPanel = mountCommunicationPanel(root.querySelector('[data-form-activity-root]'), lang);

    const enterEditMode = () => {
        root.dataset.formMode = 'edit';
        setFormInputsEnabled(recordForm, true, lang);
        richTextEditors.setEnabled(true);
        tagPickers.setEnabled(true);
        saveButton.disabled = false;
        editButton.classList.add('topbar-action-btn--active');
        editButton.setAttribute('aria-pressed', 'true');
        recordForm.querySelector('[data-form-input]')?.focus();
    };

    const enterReadonlyMode = () => {
        richTextEditors.setEnabled(false);
        tagPickers.setEnabled(false);
        root.dataset.formMode = 'readonly';
        setFormInputsEnabled(recordForm, false, lang);
        saveButton.disabled = true;
        editButton.classList.remove('topbar-action-btn--active');
        editButton.setAttribute('aria-pressed', 'false');
    };

    editButton.addEventListener('click', enterEditMode);
    saveButton.addEventListener('click', enterReadonlyMode);

    root.querySelectorAll('[data-record-tabs]').forEach((tabs) => {
        tabs.querySelectorAll('[data-record-tab]').forEach((button) => {
            button.addEventListener('click', () => {
                const selectedTab = button.dataset.recordTab;
                tabs.querySelectorAll('[data-record-tab]').forEach((tabButton) => {
                    const active = tabButton.dataset.recordTab === selectedTab;
                    tabButton.classList.toggle('form-record-tab--active', active);
                    tabButton.setAttribute('aria-selected', String(active));
                });
                tabs.querySelectorAll('[data-record-tab-panel]').forEach((panel) => {
                    panel.hidden = panel.dataset.recordTabPanel !== selectedTab;
                });
            });
        });
    });

    return () => {
        editButton.removeEventListener('click', enterEditMode);
        saveButton.removeEventListener('click', enterReadonlyMode);
        cleanupCommunicationPanel();
        cleanupPercentageSliders();
        tagPickers.cleanup();
        cleanupHelpTooltips();
        richTextEditors.cleanup();
        cleanupCreateModal();
    };
}
