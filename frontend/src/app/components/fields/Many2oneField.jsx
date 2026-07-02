import { buildRecordUrl } from '../../utils/routing.js';
import { fieldLabel, isFieldReadOnly, localizedConfig, plainText } from './fieldHelpers.js';

export function Many2oneField({ field, value, onChange, lang = 'en', readOnly = false }) {
    const name = value?.name ?? value ?? '';

    if (isFieldReadOnly(field, readOnly)) {
        if (!name) return <span class="text-[var(--dash-text-soft)]">—</span>;
        const href = value?.model && value?.uuid != null ? buildRecordUrl(value.model, value.uuid) : '';
        return href
            ? (
                <a href={href} class="font-medium text-[var(--dash-accent)] hover:underline
                    focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-[var(--dash-accent)]">{name}</a>
            )
            : <span class="text-[var(--dash-text)]">{name}</span>;
    }

    return (
        <input type="text" class="form-control form-control--edit" value={name}
            aria-label={fieldLabel(field, lang)} placeholder={plainText(localizedConfig(field, 'placeholder', lang))}
            onInput={(event) => onChange(field.name, { ...(typeof value === 'object' && value !== null ? value : {}), name: event.currentTarget.value })} />
    );
}
