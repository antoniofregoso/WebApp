import { FieldControl } from './FieldControl.jsx';
import { FieldHelp } from './FieldHelp.jsx';
import { fieldLabel, localizedConfig } from './fieldHelpers.js';

/** Full field unit (label + required mark + help + control) built around a single `FieldControl`. */
export function FormField({ field, value, onChange, lang = 'en', readOnly = false, context = {}, class: className = '' }) {
    const help = localizedConfig(field, 'help', lang);
    const required = field?.form?.required === true;
    const control = <FieldControl field={field} value={value} onChange={onChange} lang={lang} readOnly={readOnly} context={context} />;

    if (field.type === 'boolean') {
        return (
            <div class={`form-field ${className}`.trim()} data-form-field={field.name}>
                <div class="form-field-label-row">
                    <label class="form-boolean-label">
                        {control}
                        <span>{fieldLabel(field, lang)} {required && <span class="form-required-mark" aria-hidden="true">*</span>}</span>
                    </label>
                    <FieldHelp help={help} lang={lang} />
                </div>
            </div>
        );
    }

    return (
        <div class={`form-field ${className}`.trim()} data-form-field={field.name}>
            <div class="form-field-label-row">
                <label class="form-field-label">{fieldLabel(field, lang)} {required && <span class="form-required-mark" aria-hidden="true">*</span>}</label>
                <FieldHelp help={help} lang={lang} />
            </div>
            <div class="form-field-control">{control}</div>
        </div>
    );
}
