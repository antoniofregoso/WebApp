import Quill from 'quill';
import 'quill/dist/quill.snow.css';

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
