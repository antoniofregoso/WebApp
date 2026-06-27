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

// ── Notes & Messages: Quill rich-text composer ────────────────────────────────

export function renderQuillComposer(tab, lang) {
    return `
    <div data-quill-composer class="hidden border-b border-[var(--dash-border)] p-4 flex flex-col gap-3">
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

    if (!addBtn || !composer || !quillEl) return () => {};

    let quill = null;

    const openEditor = () => {
        composer.classList.remove('hidden');
        if (!quill) {
            quill = new Quill(quillEl, {
                theme: 'snow',
                placeholder: t(tab, 'placeholder', lang),
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['blockquote', 'code-block'],
                        ['clean'],
                    ],
                },
            });
        }
        quill.focus();
    };

    const closeEditor = () => {
        composer.classList.add('hidden');
        quill?.setContents([]);
    };

    const save = () => {
        const html = quillEl.querySelector('.ql-editor')?.innerHTML ?? '';
        if (!html || html === '<p><br></p>') return;
        onSave(html);
        closeEditor();
    };

    addBtn.addEventListener('click', openEditor);
    cancelBtn?.addEventListener('click', closeEditor);
    saveBtn?.addEventListener('click', save);

    return () => { quill = null; };
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
