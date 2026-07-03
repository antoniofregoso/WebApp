import { useLayoutEffect, useRef } from 'preact/hooks';

import { RICH_TEXT_TOOLBAR } from '../../views/noteEditor.js';
import { loadQuill } from '../../utils/loadQuill.js';
import { safeRichTextNodes } from '../communicationPanel.jsx';
import { isFieldReadOnly, localizedConfig, plainText } from './fieldHelpers.js';

export function HtmlField({ field, value, onChange, lang = 'en', readOnly = false }) {
    const disabled = isFieldReadOnly(field, readOnly);
    const placeholder = plainText(localizedConfig(field, 'placeholder', lang));
    const editorRef = useRef(null);
    const quillRef = useRef(null);

    useLayoutEffect(() => {
        if (disabled || !editorRef.current) return undefined;
        let cancelled = false;
        let quill;
        let onTextChange;

        loadQuill().then((Quill) => {
            if (cancelled || !editorRef.current) return;
            quill = new Quill(editorRef.current, {
                theme: 'snow',
                placeholder,
                modules: { toolbar: RICH_TEXT_TOOLBAR },
            });
            quill.root.innerHTML = value ?? '';
            quillRef.current = quill;
            onTextChange = () => {
                const html = quill.root.innerHTML;
                onChange(field.name, html === '<p><br></p>' ? '' : html);
            };
            quill.on('text-change', onTextChange);
        });

        return () => {
            cancelled = true;
            quill?.off('text-change', onTextChange);
            quillRef.current = null;
        };
        // Quill owns the editor's content after mount; re-created only when leaving readonly mode.
    }, [disabled]);

    if (disabled) {
        return (
            <div class="form-rich-text-display ql-editor">
                {value ? safeRichTextNodes(value) : <p class="form-rich-text-placeholder">{placeholder}</p>}
            </div>
        );
    }
    return <div class="bg-[var(--dash-surface)] rounded-lg" ref={editorRef} />;
}
