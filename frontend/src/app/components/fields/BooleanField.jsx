import { fieldLabel, isFieldReadOnly } from './fieldHelpers.js';

export function BooleanField({ field, value, onChange, lang = 'en', readOnly = false }) {
    return (
        <input type="checkbox" class="form-checkbox" checked={Boolean(value)}
            disabled={isFieldReadOnly(field, readOnly)} aria-label={fieldLabel(field, lang)}
            onChange={(event) => onChange(field.name, event.currentTarget.checked)} />
    );
}
