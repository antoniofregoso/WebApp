import {
    icon, faEnvelope, faFileLines, faFloppyDisk, faPen,
} from '../components/icon.js';
import { renderViewHeader } from '../components';
import {
    getField, label, renderFieldControl, renderFormLayout, renderTextArea, setFormInputsEnabled,
} from './formFields.js';
import { initCreateModal, renderCreateModal } from './renderCreateModal.js';

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function findRelatedRecord(records, model, id) {
    for (const record of records) {
        const related = Object.values(record).find((value) => (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value.model === model &&
            String(value.id) === String(id)
        ));
        if (related) return related;
    }
    return null;
}

function getRecord(data, recordId, recordModel) {
    const records = data?.records ?? [];
    if (recordId == null) return records[0] ?? {};
    const modelName = data?.model?.name;
    if (!recordModel || recordModel === modelName) {
        return records.find((record) => String(record.id) === String(recordId)) ?? { id: recordId };
    }
    return findRelatedRecord(records, recordModel, recordId) ?? {
        id: recordId,
        name: `${recordModel} ${recordId}`,
        model: recordModel,
    };
}

function inferSchema(record, lang) {
    return Object.keys(record)
        .filter((name) => name !== 'avatar')
        .map((name) => ({
            name,
            type: name === 'id' ? 'integer' : 'string',
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
                 bg-[var(--dash-surface-hover)] text-lg font-semibold text-[var(--dash-text-muted)]
                 ring-1 ring-[var(--dash-border)]">
        ${escape(initials(name))}
    </span>`;
}

function renderActivityPanel(showWhatsapp, lang) {
    const activeTab = 'messages';
    const tabs = [
        showWhatsapp ? {
            key: 'whatsapp',
            label: 'WhatsApp',
            icon: '<span class="text-[10px] font-bold leading-none">WA</span>',
        } : null,
        {
            key: 'messages',
            label: lang === 'es' ? 'Mensajes' : 'Messages',
            icon: icon(faEnvelope, 'topbar-action-icon'),
        },
        {
            key: 'documents',
            label: lang === 'es' ? 'Documentos' : 'Documents',
            icon: icon(faFileLines, 'topbar-action-icon'),
        },
    ].filter(Boolean);

    return `<aside class="rounded-xl border border-[var(--dash-border)]
                    bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
        <div class="grid border-b border-[var(--dash-border)] px-3 py-2"
             style="grid-template-columns: repeat(${tabs.length}, minmax(0, 1fr));">
            ${tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return `<div class="form-activity-tab ${isActive ? 'form-activity-tab--active' : ''}">
                    <button type="button"
                        class="topbar-action-btn"
                        aria-label="${escape(tab.label)}"
                        aria-pressed="${isActive}"
                        data-tooltip="${escape(tab.label)}"
                        data-form-tab="${tab.key}">
                        ${tab.icon}
                    </button>
                </div>`;
            }).join('')}
        </div>
        <div class="min-h-48 px-4 py-5 text-sm text-[var(--dash-text-muted)]">
            ${lang === 'es' ? 'Sin actividad reciente' : 'No recent activity'}
        </div>
    </aside>`;
}

function renderFormActions(lang) {
    const editLabel = lang === 'es' ? 'Editar' : 'Edit';
    const saveLabel = lang === 'es' ? 'Guardar' : 'Save';

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
            data-form-save>
            ${icon(faFloppyDisk, 'topbar-action-icon')}
        </button>
    </div>`;
}

/**
 * Render a dynamic record form.
 * @param {object} data - model document ({ model, records })
 * @param {string} lang - 'es' | 'en'
 * @param {object} options - { recordModel, recordId, showWhatsapp }
 */
export function renderForm(data = {}, lang = 'en', options = {}) {
    const record = getRecord(data, options.recordId, options.recordModel);
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
    const showAvatar = Boolean(record.avatar);
    const showWhatsapp = shouldShowWhatsapp(data, options);

    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="Form" data-form-root data-form-mode="readonly">
        <input type="hidden" data-id="${escape(record.id ?? '')}" value="${escape(record.id ?? '')}" />
        ${renderViewHeader({ title: modelTitle, lang })}
        <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <section data-form-record class="rounded-xl border border-[var(--dash-border)]
                            bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
                <div class="flex gap-4 border-b border-[var(--dash-border)] px-5 py-4">
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
        editButton.classList.add('topbar-action-btn--active');
        editButton.setAttribute('aria-pressed', 'true');
        recordForm.querySelector('[data-form-input]')?.focus();
    };

    const enterReadonlyMode = () => {
        root.dataset.formMode = 'readonly';
        setFormInputsEnabled(recordForm, false, lang);
        editButton.classList.remove('topbar-action-btn--active');
        editButton.setAttribute('aria-pressed', 'false');
    };

    editButton.addEventListener('click', enterEditMode);
    saveButton.addEventListener('click', enterReadonlyMode);

    return () => {
        editButton.removeEventListener('click', enterEditMode);
        saveButton.removeEventListener('click', enterReadonlyMode);
        cleanupCreateModal();
    };
}
