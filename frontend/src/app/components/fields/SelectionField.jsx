import { COLOR_CLASS, COLOR_FALLBACK } from '../../utils/ux.js';
import { fieldLabel, isFieldReadOnly } from './fieldHelpers.js';

function getOptions(field, context) {
    return field.selection_values ?? context?.status ?? [];
}

export function SelectionField({ field, value, onChange, lang = 'en', readOnly = false, context = {} }) {
    const options = getOptions(field, context);
    const option = options.find((item) => item.value === value);
    if (isFieldReadOnly(field, readOnly)) {
        if (field.type === 'status_badge') {
            return value
                ? <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_CLASS[option?.color] ?? COLOR_FALLBACK}`}>{option?.[lang] ?? value}</span>
                : <span class="text-[var(--dash-text-soft)]">—</span>;
        }
        return <span class="text-[var(--dash-text)]">{value ? (option?.[lang] ?? value) : '—'}</span>;
    }
    return (
        <select name={field.name} class="form-control form-control--edit" value={value ?? ''}
            aria-label={fieldLabel(field, lang)} required={field?.form?.required === true}
            onChange={(event) => onChange(field.name, event.currentTarget.value)}>
            <option value="" />
            {options.map((item) => <option value={item.value} key={item.value}>{item[lang] ?? item.en ?? item.value}</option>)}
        </select>
    );
}
