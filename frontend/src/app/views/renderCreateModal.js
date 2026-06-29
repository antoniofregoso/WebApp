import { icon, faFloppyDisk, faXmark } from '../components/icon.js';
import { initFormRichTextEditors } from './noteEditor.js';
import {
    createEmptyRecord,
    escape,
    escapeAttr,
    getFormLayout,
    initHelpTooltips,
    initPercentageSliders,
    initTagPickers,
    label,
    renderFieldControl,
    renderFormLayout,
    setFormInputsEnabled,
} from './formFields.js';

export function renderCreateModal(data = {}, lang = 'en') {
    const schema = data?.model?.schema ?? [];
    const modelTitle = data?.model?.label?.[lang] ?? data?.model?.name ?? '';
    const record = createEmptyRecord(schema);
    const { header } = getFormLayout(schema);
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
                <div class="flex gap-4 border-b border-[var(--dash-border)] px-5 py-4">
                    ${header.image ? `<div class="form-image-placeholder" data-form-header="image">
                        <span>${label(header.image, lang)}</span>
                    </div>` : ''}
                    <div class="min-w-0 flex-1">
                        ${header.title ? renderFieldControl(header.title, '', data, lang, 'form-control--title') : ''}
                        ${header.subtitle ? `<div class="mt-1">
                            ${renderFieldControl(header.subtitle, '', data, lang, 'form-control--subtitle')}
                        </div>` : ''}
                    </div>
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
    const richTextEditors = initFormRichTextEditors(modal);
    const cleanupPercentageSliders = initPercentageSliders(modal);
    const tagPickers = initTagPickers(modal, lang);
    const cleanupHelpTooltips = initHelpTooltips(modal);

    const open = () => {
        modal.hidden = false;
        setFormInputsEnabled(modal, true, lang);
        richTextEditors.setEnabled(true);
        tagPickers.setEnabled(true);
        modal.querySelector('[data-form-input]')?.focus();
    };
    const close = () => {
        richTextEditors.setEnabled(false);
        tagPickers.setEnabled(false);
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
        cleanupPercentageSliders();
        tagPickers.cleanup();
        cleanupHelpTooltips();
        richTextEditors.cleanup();
    };
}
