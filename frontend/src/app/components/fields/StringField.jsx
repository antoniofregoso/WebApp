import { fieldLabel, isFieldReadOnly, localizedConfig, plainText } from './fieldHelpers.js';

export function StringField({ field, value, onChange, lang = 'en', readOnly = false }) {
    if (isFieldReadOnly(field, readOnly)) {
        return <span class="text-[var(--dash-text)]">{value ? String(value) : '—'}</span>;
    }
    return (
        <input type="text" name={field.name} class="form-control form-control--edit" value={value ?? ''}
            aria-label={fieldLabel(field, lang)} placeholder={plainText(localizedConfig(field, 'placeholder', lang))}
            required={field?.form?.required === true}
            onInput={(event) => onChange(field.name, event.currentTarget.value)} />
    );
}
