import { useRef } from 'preact/hooks';

import { icon, faXmark } from '../icon.js';
import { fieldLabel, isFieldReadOnly } from './fieldHelpers.js';

function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function ImageField({ field, value, onChange, lang = 'en', readOnly = false, context = {} }) {
    const inputRef = useRef(null);

    if (isFieldReadOnly(field, readOnly)) {
        if (context.view === 'list') {
            return value
                ? <img src={value} alt={fieldLabel(field, lang)} class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[var(--dash-border)]" />
                : <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--dash-surface-hover)] text-[10px] text-[var(--dash-text-soft)] ring-1 ring-[var(--dash-border)]">—</span>;
        }
        return value
            ? <img src={value} alt={fieldLabel(field, lang)} class="h-20 w-20 rounded-xl object-cover ring-1 ring-[var(--dash-border)]" />
            : <span class="form-image-placeholder">{fieldLabel(field, lang)}</span>;
    }

    const onFileChange = async (event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file) return;
        onChange(field.name, await readAsDataUrl(file));
    };

    return (
        <div class="flex items-center gap-3">
            <button type="button" class="block" onClick={() => inputRef.current?.click()} aria-label={fieldLabel(field, lang)}>
                {value
                    ? <img src={value} alt="" class="h-20 w-20 rounded-xl object-cover ring-1 ring-[var(--dash-border)]" />
                    : <span class="form-image-placeholder">{lang === 'es' ? 'Subir imagen' : 'Upload image'}</span>}
            </button>
            {value && (
                <button type="button" class="topbar-action-btn" aria-label={lang === 'es' ? 'Quitar imagen' : 'Remove image'}
                    onClick={() => onChange(field.name, '')}
                    dangerouslySetInnerHTML={{ __html: icon(faXmark, 'topbar-action-icon') }} />
            )}
            <input ref={inputRef} type="file" name={field.name} accept="image/*" class="hidden" onChange={onFileChange} />
        </div>
    );
}
