import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { icon, faFileLines, faFloppyDisk, faPaperPlane, faXmark } from '../components/icon.js';

const i18n = {
    notes: {
        placeholder: { es: 'Escribe una nota...',           en: 'Write a note...' },
        save:        { es: 'Guardar nota',                  en: 'Save note' },
        cancel:      { es: 'Cancelar',                      en: 'Cancel' },
    },
    messages: {
        placeholder: { es: 'Escribe un mensaje...',         en: 'Write a message...' },
        subject:     { es: 'Asunto',                        en: 'Subject' },
        subjectPlaceholder: { es: '¿De qué trata el mensaje?', en: 'What is this message about?' },
        subjectRequired: { es: 'Escribe un asunto para continuar.', en: 'Add a subject to continue.' },
        save:        { es: 'Enviar mensaje',                 en: 'Send message' },
        cancel:      { es: 'Cancelar',                      en: 'Cancel' },
    },
    whatsapp: {
        placeholder: { es: 'Escribe un mensaje...',         en: 'Write a message...' },
        save:        { es: 'Enviar',                        en: 'Send' },
        cancel:      { es: 'Cancelar',                      en: 'Cancel' },
    },
};

function t(tab, key, lang) {
    return i18n[tab][key][lang] ?? i18n[tab][key].en;
}

function cancelSaveButtons(tab, lang, saveIcon) {
    return `
    <div class="flex justify-end gap-1">
        <button type="button" data-composer-cancel
            class="topbar-action-btn"
            aria-label="${t(tab, 'cancel', lang)}"
            data-tooltip="${t(tab, 'cancel', lang)}">
            ${icon(faXmark, 'topbar-action-icon')}
        </button>
        <button type="button" data-composer-save
            class="topbar-action-btn"
            aria-label="${t(tab, 'save', lang)}"
            data-tooltip="${t(tab, 'save', lang)}">
            ${icon(saveIcon, 'topbar-action-icon')}
        </button>
    </div>`;
}

const TEXT_COLORS = [
    false,
    '#18181b',
    '#dc2626',
    '#ea580c',
    '#ca8a04',
    '#16a34a',
    '#2563eb',
    '#9333ea',
];

const BACKGROUND_COLORS = [
    false,
    '#fee2e2',
    '#ffedd5',
    '#fef3c7',
    '#dcfce7',
    '#dbeafe',
    '#f3e8ff',
    '#f4f4f5',
];

export const RICH_TEXT_TOOLBAR = [
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: TEXT_COLORS }, { background: BACKGROUND_COLORS }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote'],
    ['link', 'image'],
];

function quillOptions(placeholder = '') {
    return {
        theme: 'snow',
        placeholder,
        modules: { toolbar: RICH_TEXT_TOOLBAR },
    };
}

// ── Notes & Messages: Quill rich-text composer ────────────────────────────────

export function renderQuillComposer(tab, lang) {
    const subject = tab === 'messages' ? `
        <label class="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[var(--dash-text-muted)]">
            <span>${t(tab, 'subject', lang)}</span>
            <input type="text" maxlength="160" data-message-subject
                class="box-border w-full min-w-0 rounded-lg border border-[var(--dash-border)]
                       bg-[var(--dash-surface)] px-3 py-2 text-sm font-normal text-[var(--dash-text)]
                       outline-none transition-colors placeholder:text-[var(--dash-text-soft)]
                       focus:border-[var(--dash-accent)] focus:ring-2 focus:ring-[var(--dash-accent-soft)]"
                placeholder="${t(tab, 'subjectPlaceholder', lang)}"
                aria-required="true" aria-invalid="false" />
            <span class="hidden font-normal text-[var(--dash-danger)]" data-message-subject-error>
                ${t(tab, 'subjectRequired', lang)}
            </span>
        </label>` : '';
    return `
    <div data-quill-composer class="hidden border-b border-[var(--dash-border)] p-4 flex flex-col gap-3">
        ${subject}
        <div data-quill-el class="bg-[var(--dash-surface)] rounded-lg"></div>
        ${cancelSaveButtons(tab, lang, faFloppyDisk)}
    </div>`;
}

export function initQuillEditor(panel, lang, tab, onSave) {
    const addBtn    = panel.querySelector('[data-form-tab-add]');
    const composer  = panel.querySelector('[data-quill-composer]');
    const quillEl   = panel.querySelector('[data-quill-el]');
    const cancelBtn = panel.querySelector('[data-composer-cancel]');
    const saveBtn   = panel.querySelector('[data-composer-save]');
    const subjectInput = panel.querySelector('[data-message-subject]');
    const subjectError = panel.querySelector('[data-message-subject-error]');

    if (!addBtn || !composer || !quillEl) return () => {};

    let quill = null;

    const openEditor = () => {
        composer.classList.remove('hidden');
        if (!quill) {
            quill = new Quill(quillEl, quillOptions(t(tab, 'placeholder', lang)));
        }
        if (subjectInput) subjectInput.focus();
        else quill.focus();
    };

    const closeEditor = () => {
        composer.classList.add('hidden');
        quill?.setContents([]);
        if (subjectInput) {
            subjectInput.value = '';
            subjectInput.setAttribute('aria-invalid', 'false');
        }
        subjectError?.classList.add('hidden');
    };

    const save = () => {
        const html = quillEl.querySelector('.ql-editor')?.innerHTML ?? '';
        const subject = subjectInput?.value.trim() ?? '';
        if (subjectInput && !subject) {
            subjectInput.setAttribute('aria-invalid', 'true');
            subjectError?.classList.remove('hidden');
            subjectInput.focus();
            return;
        }
        if (!html || html === '<p><br></p>') return;
        onSave(subjectInput ? { subject, html } : html);
        closeEditor();
    };

    const clearSubjectError = () => {
        if (!subjectInput?.value.trim()) return;
        subjectInput.setAttribute('aria-invalid', 'false');
        subjectError?.classList.add('hidden');
    };

    addBtn.addEventListener('click', openEditor);
    cancelBtn?.addEventListener('click', closeEditor);
    saveBtn?.addEventListener('click', save);
    subjectInput?.addEventListener('input', clearSubjectError);

    return () => {
        subjectInput?.removeEventListener('input', clearSubjectError);
        quill = null;
    };
}

/** Quill instances used by schema fields with type `html`. */
export function initFormRichTextEditors(container) {
    if (!container) return { setEnabled() {}, cleanup() {} };

    const editors = Array.from(container.querySelectorAll('[data-form-rich-text]')).map((wrapper) => {
        const editorElement = wrapper.querySelector('[data-form-rich-text-editor]');
        const display = wrapper.querySelector('.form-rich-text-display');
        const input = wrapper.querySelector('input[type="hidden"]');
        const placeholder = wrapper.dataset.formRichTextPlaceholder ?? '';
        const readonly = wrapper.dataset.formRichTextReadonly === 'true';
        let quill = null;
        let onTextChange = null;

        const ensureEditor = () => {
            if (quill || !editorElement) return quill;
            quill = new Quill(editorElement, quillOptions(placeholder));
            if (input?.value) quill.clipboard.dangerouslyPasteHTML(input.value);
            onTextChange = () => {
                if (input) input.value = editorElement.querySelector('.ql-editor')?.innerHTML ?? '';
            };
            quill.on('text-change', onTextChange);
            return quill;
        };

        return {
            setEnabled(enabled) {
                if (enabled && !readonly) {
                    ensureEditor()?.enable(true);
                    return;
                }
                if (!quill) return;
                quill.enable(false);
                const html = editorElement.querySelector('.ql-editor')?.innerHTML ?? '';
                if (input) input.value = html;
                if (display) display.innerHTML = html;
            },
            cleanup() {
                if (quill && onTextChange) quill.off('text-change', onTextChange);
                quill = null;
            },
        };
    });

    return {
        setEnabled(enabled) {
            editors.forEach((editor) => editor.setEnabled(enabled));
        },
        cleanup() {
            editors.forEach((editor) => editor.cleanup());
        },
    };
}

// ── WhatsApp: plain-text textarea composer ────────────────────────────────────

export function renderTextComposer(tab, lang) {
    return `
    <div data-text-composer class="hidden border-b border-[var(--dash-border)] p-4 flex flex-col gap-3">
        <textarea data-text-input rows="3"
            placeholder="${t(tab, 'placeholder', lang)}"
            class="w-full resize-none rounded-lg border border-[var(--dash-border)]
                   bg-[var(--dash-surface)] px-3 py-2 text-sm text-[var(--dash-text)]
                   placeholder:text-[var(--dash-text-muted)] focus:outline-none
                   focus:ring-1 focus:ring-[var(--dash-accent)]"></textarea>
        ${cancelSaveButtons(tab, lang, faPaperPlane)}
    </div>`;
}

export function initTextEditor(panel, lang, tab, onSave) {
    const addBtn    = panel.querySelector('[data-form-tab-add]');
    const composer  = panel.querySelector('[data-text-composer]');
    const textarea  = panel.querySelector('[data-text-input]');
    const cancelBtn = panel.querySelector('[data-composer-cancel]');
    const saveBtn   = panel.querySelector('[data-composer-save]');

    if (!addBtn || !composer || !textarea) return () => {};

    const openEditor = () => {
        composer.classList.remove('hidden');
        textarea.focus();
    };

    const closeEditor = () => {
        composer.classList.add('hidden');
        textarea.value = '';
    };

    const save = () => {
        const text = textarea.value.trim();
        if (!text) return;
        onSave(text);
        closeEditor();
    };

    addBtn.addEventListener('click', openEditor);
    cancelBtn?.addEventListener('click', closeEditor);
    saveBtn?.addEventListener('click', save);

    return () => {};
}

// ── Documents: native file picker ────────────────────────────────────────────

export function renderDocumentPicker() {
    return `<input type="file" multiple data-doc-input class="hidden" />`;
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileItemHtml(file) {
    return `
    <div class="flex items-center gap-3">
        <span class="shrink-0 text-[var(--dash-text-muted)]">
            ${icon(faFileLines, 'topbar-action-icon')}
        </span>
        <span class="min-w-0 flex-1 truncate font-medium">${file.name}</span>
        <span class="shrink-0 text-xs text-[var(--dash-text-muted)]">${formatSize(file.size)}</span>
    </div>`;
}

export function initDocumentEditor(panel) {
    const addBtn   = panel.querySelector('[data-form-tab-add]');
    const input    = panel.querySelector('[data-doc-input]');
    if (!addBtn || !input) return () => {};

    const openPicker = () => input.click();

    const onFilesSelected = (e) => {
        const files = Array.from(e.target.files ?? []);
        files.forEach((file) => appendItem(panel, fileItemHtml(file)));
        input.value = '';
    };

    addBtn.addEventListener('click', openPicker);
    input.addEventListener('change', onFilesSelected);

    return () => {
        addBtn.removeEventListener('click', openPicker);
        input.removeEventListener('change', onFilesSelected);
    };
}

// ── Shared item list helpers ──────────────────────────────────────────────────

export function renderItemList() {
    return `<ul data-activity-list class="hidden divide-y divide-[var(--dash-border)]"></ul>`;
}

export function appendItem(panel, html) {
    const emptyEl = panel.querySelector('[data-note-empty]');
    const listEl  = panel.querySelector('[data-activity-list]');
    if (emptyEl) emptyEl.hidden = true;
    listEl?.classList.remove('hidden');
    const li = document.createElement('li');
    li.className = 'px-4 py-3 text-sm text-[var(--dash-text)]';
    li.innerHTML = html;
    listEl?.prepend(li);
}
