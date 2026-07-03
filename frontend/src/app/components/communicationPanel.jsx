import { h, render } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

import {
    faEnvelope, faFileLines, faFloppyDisk, faNoteSticky, faPaperPlane, faPlus,
    faWhatsapp, faXmark,
} from './icon.js';
import { RICH_TEXT_TOOLBAR } from '../views/noteEditor.js';
import { loadQuill } from '../utils/loadQuill.js';

const COPY = {
    notes: {
        label: { es: 'Notas', en: 'Notes' },
        add: { es: 'Agregar nota', en: 'Add note' },
        empty: { es: 'Aún no hay notas.', en: 'No notes yet.' },
        placeholder: { es: 'Escribe una nota...', en: 'Write a note...' },
        save: { es: 'Guardar nota', en: 'Save note' },
    },
    whatsapp: {
        label: { es: 'WhatsApp', en: 'WhatsApp' },
        add: { es: 'Nueva conversación', en: 'New conversation' },
        empty: { es: 'Sin conversaciones de WhatsApp.', en: 'No WhatsApp conversations.' },
        placeholder: { es: 'Escribe un mensaje...', en: 'Write a message...' },
        save: { es: 'Enviar', en: 'Send' },
    },
    messages: {
        label: { es: 'Mensajes', en: 'Messages' },
        add: { es: 'Nuevo mensaje', en: 'New message' },
        empty: { es: 'Sin mensajes.', en: 'No messages.' },
        placeholder: { es: 'Escribe un mensaje...', en: 'Write a message...' },
        save: { es: 'Enviar mensaje', en: 'Send message' },
        subject: { es: 'Asunto', en: 'Subject' },
        subjectPlaceholder: { es: '¿De qué trata el mensaje?', en: 'What is this message about?' },
        subjectRequired: { es: 'Escribe un asunto para continuar.', en: 'Add a subject to continue.' },
    },
    documents: {
        label: { es: 'Documentos', en: 'Documents' },
        add: { es: 'Subir documento', en: 'Upload document' },
        empty: { es: 'Sin documentos adjuntos.', en: 'No documents attached.' },
    },
};

const TAB_ORDER = ['notes', 'whatsapp', 'messages', 'documents'];
const TAB_ICONS = { notes: faNoteSticky, whatsapp: faWhatsapp, messages: faEnvelope, documents: faFileLines };
const SAFE_TAGS = new Set(['a', 'blockquote', 'br', 'em', 'h1', 'h2', 'h3', 'img', 'li', 'ol', 'p', 's', 'span', 'strong', 'u', 'ul']);
const DROP_CONTENT_TAGS = new Set(['iframe', 'object', 'script', 'style', 'svg', 'template']);

function copy(tab, key, lang) {
    return COPY[tab][key]?.[lang] ?? COPY[tab][key]?.en ?? '';
}

function Icon({ definition, class: className = '' }) {
    const [width, height, , , paths] = definition.icon;
    const pathList = Array.isArray(paths) ? paths : [paths];
    return (
        <svg class={className} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
            {pathList.map((path, index) => <path d={path} key={index} />)}
        </svg>
    );
}

function safeUrl(value, image = false) {
    const url = String(value ?? '').trim();
    if (/^https?:/i.test(url)) return url;
    if (image && /^data:image\/(?:gif|jpe?g|png|webp);base64,/i.test(url)) return url;
    return '';
}

function nodeToVnode(node, key) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;

    const tag = node.tagName.toLowerCase();
    if (DROP_CONTENT_TAGS.has(tag)) return null;
    const children = Array.from(node.childNodes, (child, index) => nodeToVnode(child, `${key}-${index}`));
    if (!SAFE_TAGS.has(tag)) return children;

    const props = { key };
    const quillClasses = Array.from(node.classList ?? []).filter((name) => /^ql-[a-z0-9-]+$/i.test(name));
    if (quillClasses.length) props.class = quillClasses.join(' ');
    if (tag === 'li' && /^(?:bullet|checked|unchecked|ordered)$/.test(node.dataset.list ?? '')) {
        props['data-list'] = node.dataset.list;
    }
    if (tag === 'a') {
        const href = safeUrl(node.getAttribute('href'));
        if (href) props.href = href;
        props.rel = 'noopener noreferrer';
        if (node.getAttribute('target') === '_blank') props.target = '_blank';
    }
    if (tag === 'img') {
        const src = safeUrl(node.getAttribute('src'), true);
        if (!src) return null;
        props.src = src;
        props.alt = node.getAttribute('alt') ?? '';
    }
    return h(tag, props, children);
}

export function safeRichTextNodes(html) {
    const documentNode = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
    return Array.from(documentNode.body.childNodes, (node, index) => nodeToVnode(node, `rich-${index}`));
}

function ComposerButtons({ tab, lang, onCancel, onSave, saveIcon = faFloppyDisk }) {
    const cancel = lang === 'es' ? 'Cancelar' : 'Cancel';
    return (
        <div class="flex justify-end gap-1">
            <button type="button" data-composer-cancel class="topbar-action-btn" aria-label={cancel} data-tooltip={cancel} onClick={onCancel}>
                <Icon definition={faXmark} class="topbar-action-icon" />
            </button>
            <button type="button" data-composer-save class="topbar-action-btn" aria-label={copy(tab, 'save', lang)} data-tooltip={copy(tab, 'save', lang)} onClick={onSave}>
                <Icon definition={saveIcon} class="topbar-action-icon" />
            </button>
        </div>
    );
}

function RichComposer({ tab, lang, onClose, onSave }) {
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const subjectRef = useRef(null);
    const [subject, setSubject] = useState('');
    const [subjectInvalid, setSubjectInvalid] = useState(false);

    useLayoutEffect(() => {
        let cancelled = false;

        loadQuill().then((Quill) => {
            if (cancelled || !editorRef.current) return;
            quillRef.current = new Quill(editorRef.current, {
                theme: 'snow',
                placeholder: copy(tab, 'placeholder', lang),
                modules: { toolbar: RICH_TEXT_TOOLBAR },
            });
            if (tab === 'messages') subjectRef.current?.focus();
            else quillRef.current.focus();
        });

        return () => {
            cancelled = true;
            quillRef.current = null;
        };
    }, [lang, tab]);

    const save = () => {
        const value = (subjectRef.current?.value ?? subject).trim();
        if (tab === 'messages' && !value) {
            setSubjectInvalid(true);
            subjectRef.current?.focus();
            return;
        }
        const html = quillRef.current?.root?.innerHTML ?? '';
        if (!html || html === '<p><br></p>') return;
        onSave(tab === 'messages' ? { subject: value, html } : html);
        onClose();
    };

    return (
        <div data-quill-composer class="border-b border-[var(--dash-border)] p-4 flex flex-col gap-3">
            {tab === 'messages' && (
                <label class="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-[var(--dash-text-muted)]">
                    <span>{copy(tab, 'subject', lang)}</span>
                    <input ref={subjectRef} type="text" maxLength="160" data-message-subject
                        class="box-border w-full min-w-0 rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 text-sm font-normal text-[var(--dash-text)] outline-none transition-colors placeholder:text-[var(--dash-text-soft)] focus:border-[var(--dash-accent)] focus:ring-2 focus:ring-[var(--dash-accent-soft)]"
                        placeholder={copy(tab, 'subjectPlaceholder', lang)} aria-required="true"
                        aria-invalid={String(subjectInvalid)} value={subject}
                        onInput={(event) => { setSubject(event.currentTarget.value); setSubjectInvalid(false); }} />
                    <span class={subjectInvalid ? 'font-normal text-[var(--dash-danger)]' : 'hidden font-normal text-[var(--dash-danger)]'} data-message-subject-error>
                        {copy(tab, 'subjectRequired', lang)}
                    </span>
                </label>
            )}
            <div ref={editorRef} data-quill-el class="bg-[var(--dash-surface)] rounded-lg" />
            <ComposerButtons tab={tab} lang={lang} onCancel={onClose} onSave={save} />
        </div>
    );
}

function TextComposer({ lang, onClose, onSave }) {
    const [text, setText] = useState('');
    const inputRef = useRef(null);
    useEffect(() => inputRef.current?.focus(), []);
    const save = () => {
        const value = text.trim();
        if (!value) return;
        onSave(value);
        onClose();
    };
    return (
        <div data-text-composer class="border-b border-[var(--dash-border)] p-4 flex flex-col gap-3">
            <textarea ref={inputRef} data-text-input rows="3" value={text} onInput={(event) => setText(event.currentTarget.value)}
                placeholder={copy('whatsapp', 'placeholder', lang)}
                class="w-full resize-none rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2 text-sm text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]" />
            <ComposerButtons tab="whatsapp" lang={lang} onCancel={onClose} onSave={save} saveIcon={faPaperPlane} />
        </div>
    );
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ActivityItem({ tab, item }) {
    if (tab === 'documents') return (
        <div class="flex items-center gap-3">
            <span class="shrink-0 text-[var(--dash-text-muted)]"><Icon definition={faFileLines} class="topbar-action-icon" /></span>
            <span class="min-w-0 flex-1 truncate font-medium">{item.name}</span>
            <span class="shrink-0 text-xs text-[var(--dash-text-muted)]">{formatSize(item.size)}</span>
        </div>
    );
    if (tab === 'messages') return (
        <article class="min-w-0">
            <h4 class="truncate text-sm font-semibold text-[var(--dash-text)]">{item.subject}</h4>
            <div class="ql-editor mt-1 p-0 text-sm text-[var(--dash-text-muted)]">{safeRichTextNodes(item.html)}</div>
        </article>
    );
    if (tab === 'notes') return <div class="ql-editor p-0">{safeRichTextNodes(item)}</div>;
    return item;
}

function TabPanel({ tab, lang, items, onAdd, hidden }) {
    const [composing, setComposing] = useState(false);
    const inputRef = useRef(null);
    const addItems = (newItems) => onAdd(tab, newItems);
    const open = () => tab === 'documents' ? inputRef.current?.click() : setComposing(true);
    return (
        <div data-form-tab-panel={tab} hidden={hidden}>
            <div class="flex items-center justify-between border-b border-[var(--dash-border)] px-4 py-2">
                <span class="text-xs font-medium text-[var(--dash-text-muted)]">{copy(tab, 'label', lang)}</span>
                <button type="button" class="topbar-action-btn" aria-label={copy(tab, 'add', lang)} data-tooltip={copy(tab, 'add', lang)}
                    data-tooltip-align="end" data-form-tab-add={tab} onClick={open}>
                    <Icon definition={faPlus} class="topbar-action-icon" />
                </button>
            </div>
            {tab === 'documents' && <input ref={inputRef} type="file" multiple data-doc-input class="hidden"
                onChange={(event) => { addItems(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ''; }} />}
            {composing && (tab === 'notes' || tab === 'messages') &&
                <RichComposer tab={tab} lang={lang} onClose={() => setComposing(false)} onSave={(item) => addItems([item])} />}
            {composing && tab === 'whatsapp' &&
                <TextComposer lang={lang} onClose={() => setComposing(false)} onSave={(item) => addItems([item])} />}
            {items.length === 0 ? (
                <div data-note-empty class="min-h-48 px-4 py-5 text-sm text-[var(--dash-text-muted)]">{copy(tab, 'empty', lang)}</div>
            ) : (
                <ul data-activity-list class="divide-y divide-[var(--dash-border)]">
                    {items.map((item, index) => <li class="px-4 py-3 text-sm text-[var(--dash-text)]" key={index}><ActivityItem tab={tab} item={item} /></li>)}
                </ul>
            )}
        </div>
    );
}

export function CommunicationPanel({ lang = 'en' }) {
    const [activeTab, setActiveTab] = useState('notes');
    const [items, setItems] = useState(() => Object.fromEntries(TAB_ORDER.map((tab) => [tab, []])));
    const addItems = (tab, additions) => setItems((current) => ({ ...current, [tab]: [...additions, ...current[tab]] }));
    return (
        <aside class="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]" data-form-activity>
            <div class="grid border-b border-[var(--dash-border)] px-3 py-2" style={{ gridTemplateColumns: `repeat(${TAB_ORDER.length}, minmax(0, 1fr))` }}>
                {TAB_ORDER.map((tab) => (
                    <div class={`form-activity-tab ${activeTab === tab ? 'form-activity-tab--active' : ''}`} key={tab}>
                        <button type="button" class="topbar-action-btn" aria-label={copy(tab, 'label', lang)} aria-pressed={String(activeTab === tab)}
                            data-tooltip={copy(tab, 'label', lang)} data-form-tab={tab} onClick={() => setActiveTab(tab)}>
                            <Icon definition={TAB_ICONS[tab]} class="topbar-action-icon" />
                        </button>
                    </div>
                ))}
            </div>
            {TAB_ORDER.map((tab) => (
                <TabPanel tab={tab} lang={lang} items={items[tab]} onAdd={addItems} hidden={activeTab !== tab} key={tab} />
            ))}
        </aside>
    );
}

export function mountCommunicationPanel(container, lang) {
    if (!container) return () => {};
    render(<CommunicationPanel lang={lang} />, container);
    return () => render(null, container);
}
