import { icon, faFloppyDisk, faXmark } from '../components/icon.js';
import {
    createEmptyRecord,
    escape,
    escapeAttr,
    getField,
    label,
    renderFieldControl,
    renderFormLayout,
    renderTextArea,
    setFormInputsEnabled,
} from './formFields.js';

export function renderCreateModal(data = {}, lang = 'en') {
    const schema = data?.model?.schema ?? [];
    const modelTitle = data?.model?.label?.[lang] ?? data?.model?.name ?? '';
    const record = createEmptyRecord(schema);
    const nameField = getField(schema, 'name') ?? {
        name: 'name',
        type: 'string',
        label: { es: 'Nombre', en: 'Name' },
    };
    const descriptionField = getField(schema, 'description');
    const title = lang === 'es' ? `Crear ${modelTitle}` : `Create ${modelTitle}`;
    const closeLabel = lang === 'es' ? 'Cerrar' : 'Close';
    const saveLabel = lang === 'es' ? 'Guardar' : 'Save';

    return `<div class="form-modal" data-form-modal hidden>
        <div class="form-modal-backdrop" data-form-modal-close></div>
        <section class="form-modal-panel" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
            <header class="form-modal-header">
                <h3 class="text-base font-semibold text-[var(--dash-text)]">${escape(title)}</h3>
                <button type="button" class="topbar-action-btn" aria-label="${escapeAttr(closeLabel)}"
                    data-tooltip="${escapeAttr(closeLabel)}" data-form-modal-close>
                    ${icon(faXmark, 'topbar-action-icon')}
                </button>
            </header>
            <div class="form-modal-body" data-form-mode="edit">
                <div class="border-b border-[var(--dash-border)] px-5 py-4">
                    ${renderFieldControl(nameField, '', data, lang, 'form-control--title')}
                    ${descriptionField ? `<div class="mt-4">
                        <label class="text-xs font-medium text-[var(--dash-text-muted)]">${label(descriptionField, lang)}</label>
                        <div class="mt-1">${renderTextArea(descriptionField, '', 'form-control--textarea')}</div>
                    </div>` : ''}
                </div>
                ${renderFormLayout(schema, record, data, lang)}
            </div>
            <footer class="form-modal-footer">
                <button type="button" class="topbar-action-btn topbar-action-btn--active"
                    aria-label="${escapeAttr(saveLabel)}" data-tooltip="${escapeAttr(saveLabel)}" data-form-modal-close>
                    ${icon(faFloppyDisk, 'topbar-action-icon')}
                </button>
            </footer>
        </section>
    </div>`;
}

export function initCreateModal(root = document, lang = 'en') {
    const createButton = root.querySelector('[data-create-open]');
    const modal = root.querySelector('[data-form-modal]');
    if (!createButton || !modal) return () => {};

    const open = () => {
        modal.hidden = false;
        setFormInputsEnabled(modal, true, lang);
        modal.querySelector('[data-form-input]')?.focus();
    };
    const close = () => {
        modal.hidden = true;
        setFormInputsEnabled(modal, false, lang);
    };
    const closeOnEscape = (event) => {
        if (event.key === 'Escape' && !modal.hidden) close();
    };

    createButton.addEventListener('click', open);
    modal.querySelectorAll('[data-form-modal-close]').forEach((button) => button.addEventListener('click', close));
    document.addEventListener('keydown', closeOnEscape);

    return () => {
        createButton.removeEventListener('click', open);
        modal.querySelectorAll('[data-form-modal-close]').forEach((button) => button.removeEventListener('click', close));
        document.removeEventListener('keydown', closeOnEscape);
    };
}
