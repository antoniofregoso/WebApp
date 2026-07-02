import { fieldLabel, isFieldReadOnly, localizedConfig, plainText } from './fieldHelpers.js';

export function TextField({ field, value, onChange, lang = 'en', readOnly = false }) {
    if (isFieldReadOnly(field, readOnly)) {
        return <p class="whitespace-pre-wrap text-[var(--dash-text)]">{value ? String(value) : '—'}</p>;
    }
    return (
        <textarea class="form-control form-control--edit form-control--textarea" value={value ?? ''}
            aria-label={fieldLabel(field, lang)} placeholder={plainText(localizedConfig(field, 'placeholder', lang))}
            required={field?.form?.required === true}
            onInput={(event) => onChange(field.name, event.currentTarget.value)} />
    );
}
