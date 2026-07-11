import { useLayoutEffect, useRef } from 'preact/hooks';

import { RICH_TEXT_TOOLBAR } from '../../views/noteEditor.js';
import { loadQuill } from '../../utils/loadQuill.js';
import { localizedValue, nextLocalizedValue } from '../../utils/ux.js';
import { safeRichTextNodes } from '../communicationPanel.jsx';
import { isFieldReadOnly, localizedConfig, plainText } from './fieldHelpers.js';

function nextHtmlValue(value, lang, html) {
    return nextLocalizedValue(value, lang, html);
}

function cleanupQuillNode(node, parent) {
    const toolbar = node?.previousElementSibling;
    if (toolbar?.classList?.contains('ql-toolbar')) {
        toolbar.remove();
    }
    parent?.querySelectorAll(':scope > .ql-toolbar').forEach((item) => item.remove());
    if (node) {
        node.innerHTML = '';
        node.classList.remove('ql-container', 'ql-snow', 'ql-disabled');
    }
}

export function HtmlField({ field, value, onChange, lang = 'en', readOnly = false }) {
    const disabled = isFieldReadOnly(field, readOnly);
    const placeholder = plainText(localizedConfig(field, 'placeholder', lang));
    const displayValue = localizedValue(value, lang);
    const editorRef = useRef(null);
    const quillRef = useRef(null);

    useLayoutEffect(() => {
        if (disabled || !editorRef.current) return undefined;
        const editorNode = editorRef.current;
        const editorParent = editorNode.parentElement;
        let cancelled = false;
        let quill;
        let onTextChange;

        loadQuill().then((Quill) => {
            if (cancelled || !editorNode.isConnected) return;
            quill = new Quill(editorNode, {
                theme: 'snow',
                placeholder,
                modules: { toolbar: RICH_TEXT_TOOLBAR },
            });
            quill.root.innerHTML = displayValue ?? '';
            quillRef.current = quill;
            onTextChange = () => {
                const html = quill.root.innerHTML;
                onChange(field.name, nextHtmlValue(value, lang, html === '<p><br></p>' ? '' : html));
            };
            quill.on('text-change', onTextChange);
        });

        return () => {
            cancelled = true;
            quill?.off('text-change', onTextChange);
            cleanupQuillNode(editorNode, editorParent);
            quillRef.current = null;
        };
        // Quill owns the editor's content after mount; re-created only when leaving readonly mode.
    }, [disabled]);

    if (disabled) {
        return (
            <div key="html-readonly" class="form-rich-text-display">
                {displayValue ? safeRichTextNodes(displayValue) : <p class="form-rich-text-placeholder">{placeholder}</p>}
            </div>
        );
    }
    return (
        <div key="html-editor" class="form-rich-text-editor-shell">
            <div class="bg-[var(--dash-surface)] rounded-lg" ref={editorRef} />
        </div>
    );
}
