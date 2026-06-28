import {
    buildRecordUrl, COLOR_CLASS, COLOR_FALLBACK, formatCurrency, locale, localizedValue,
} from '../utils';

export function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function escapeAttr(value) {
    return escape(value)
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function label(field, lang) {
    return escape(field?.label?.[lang] ?? field?.label?.en ?? field?.name ?? '');
}

export function getField(schema, name) {
    return schema.find((field) => field.name === name);
}

function indexedField(field, index, value) {
    const position = Number(value);
    return Number.isFinite(position) ? { field, position, index } : null;
}

function sortFields(fields) {
    return fields.sort((a, b) => a.position - b.position || a.index - b.index);
}

/**
 * Builds the four form areas exclusively from each field's `form` metadata.
 * A field can belong to one area; placement priority is header, left, right, tab.
 */
export function getFormLayout(schema = []) {
    const layout = {
        header: { image: null, title: null, subtitle: null },
        leftColumn: [],
        rightColumn: [],
        tabs: [],
    };
    const tabGroups = new Map();

    schema.forEach((field, index) => {
        const config = field?.form;
        if (!config) return;

        const headerSlot = String(config.header ?? '').toLowerCase();
        if (Object.hasOwn(layout.header, headerSlot)) {
            layout.header[headerSlot] ??= field;
            return;
        }

        const left = indexedField(field, index, config.leftColumn);
        if (left) {
            layout.leftColumn.push(left);
            return;
        }

        const right = indexedField(field, index, config.rightColumn);
        if (right) {
            layout.rightColumn.push(right);
            return;
        }

        const tab = indexedField(field, index, config.tab);
        if (!tab) return;
        if (!tabGroups.has(tab.position)) tabGroups.set(tab.position, []);
        tabGroups.get(tab.position).push(tab);
    });

    sortFields(layout.leftColumn);
    sortFields(layout.rightColumn);
    layout.tabs = Array.from(tabGroups.entries())
        .sort(([positionA], [positionB]) => positionA - positionB)
        .map(([position, fields]) => ({ position, fields: sortFields(fields) }));
    return layout;
}

export function createEmptyRecord(schema) {
    return schema.reduce((record, field) => {
        record[field.name] = field.type === 'boolean' ? false : field.type === 'many2many_pills' ? [] : '';
        return record;
    }, { uuid: '', name: '' });
}

function toDateInputValue(value) {
    if (!value) return '';
    return String(value).slice(0, 10);
}

function toDateTimeInputValue(value) {
    if (!value) return '';
    return String(value).replace(' ', 'T').slice(0, 16);
}

function inputClasses(extra = '') {
    return `form-control ${extra}`.trim();
}

function localizedConfig(field, key, lang) {
    const value = field?.form?.[key];
    if (value == null) return '';
    if (typeof value !== 'object') return String(value);
    return String(value[lang] ?? value.en ?? Object.values(value)[0] ?? '');
}

function plainText(value) {
    return String(value).replace(/<[^>]*>/g, '').trim();
}

function helpId(field) {
    return `form-help-${String(field.name).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function controlAttributes(field, lang) {
    const placeholder = plainText(localizedConfig(field, 'placeholder', lang));
    const help = localizedConfig(field, 'help', lang);
    const accessibleLabel = field?.label?.[lang] ?? field?.label?.en ?? field?.name ?? '';
    return [
        accessibleLabel ? `aria-label="${escapeAttr(accessibleLabel)}"` : '',
        placeholder ? `placeholder="${escapeAttr(placeholder)}"` : '',
        field?.form?.required ? 'required aria-required="true"' : '',
        field?.form?.readonly ? 'data-form-readonly="true" aria-readonly="true"' : '',
        help ? `aria-describedby="${helpId(field)}"` : '',
    ].filter(Boolean).join(' ');
}

function renderInput(field, value, extraClass = '', lang = 'en') {
    return `<input type="text" name="${escapeAttr(field.name)}" value="${escapeAttr(value ?? '')}"
        class="${inputClasses(extraClass)}" ${controlAttributes(field, lang)} data-form-input disabled />`;
}

export function renderTextArea(field, value, extraClass = '', lang = 'en') {
    return `<textarea name="${escapeAttr(field.name)}" class="${inputClasses(extraClass)}"
        ${controlAttributes(field, lang)} data-form-input disabled>${escape(value ?? '')}</textarea>`;
}

function renderPercentageControl(field, value, lang, extraClass) {
    const numericValue = Number(value);
    const percentage = Number.isFinite(numericValue) ? Math.max(0, Math.min(100, numericValue)) : 0;
    return `<div class="form-switchable-control" data-form-switchable-readonly="${field?.form?.readonly === true}">
        <div class="form-value-display flex items-center gap-2" aria-label="${escapeAttr(`${percentage}%`)}">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--dash-border)]">
                <div class="h-full rounded-full bg-[var(--dash-accent)]" style="width:${percentage}%"></div>
            </div>
            <span class="tabular-nums text-[var(--dash-text-muted)]">${percentage}%</span>
        </div>
        <div class="form-percentage-editor form-edit-control">
            <input type="range" min="0" max="100" step="1" name="${escapeAttr(field.name)}"
                value="${percentage}" class="form-percentage-slider ${extraClass}"
                style="--form-percentage:${percentage}%" ${controlAttributes(field, lang)}
                data-form-percentage-input data-form-input disabled />
            <output class="form-percentage-output" data-form-percentage-output>${percentage}%</output>
        </div>
    </div>`;
}

function renderPills(tags, lang) {
    if (!Array.isArray(tags) || tags.length === 0) {
        return '<span class="text-[var(--dash-text-soft)]">—</span>';
    }
    return `<div class="flex flex-wrap gap-1">${tags.map((tag) => {
        const classes = COLOR_CLASS[tag.color] ?? COLOR_FALLBACK;
        return `<span class="inline-flex items-center rounded-full px-2 py-0.5
            text-xs font-medium ${classes}">${escape(localizedValue(tag.name, lang))}</span>`;
    }).join('')}</div>`;
}

function renderPillsControl(field, value, lang, extraClass) {
    const editableValue = Array.isArray(value)
        ? value.map((item) => localizedValue(item.name, lang)).join(', ')
        : value ?? '';
    return `<div class="form-switchable-control" data-form-switchable-readonly="${field?.form?.readonly === true}">
        <div class="form-value-display">${renderPills(value, lang)}</div>
        ${renderInput(field, editableValue, `form-edit-control ${extraClass}`, lang)}
    </div>`;
}

function renderRichTextControl(field, value, lang) {
    const placeholder = plainText(localizedConfig(field, 'placeholder', lang));
    const initialHtml = String(value ?? '');
    const content = initialHtml || `<p class="form-rich-text-placeholder">${escape(placeholder)}</p>`;
    return `<div class="form-rich-text" data-form-rich-text
        data-form-rich-text-readonly="${field?.form?.readonly === true}"
        data-form-rich-text-placeholder="${escapeAttr(placeholder)}">
        <input type="hidden" name="${escapeAttr(field.name)}" value="${escapeAttr(initialHtml)}" data-form-input disabled />
        <div class="form-rich-text-display ql-editor">${content}</div>
        <div class="form-rich-text-editor-shell"><div data-form-rich-text-editor></div></div>
    </div>`;
}

function renderMany2oneControl(field, value, lang, extraClass) {
    const name = value?.name ?? value ?? '';
    const href = value?.model && value?.uuid != null
        ? buildRecordUrl(value.model, value.uuid)
        : '';
    const display = href
        ? `<a href="${escapeAttr(href)}" class="font-medium text-[var(--dash-accent)] hover:underline
            focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-[var(--dash-accent)]">${escape(name)}</a>`
        : `<span class="text-[var(--dash-text)]">${name ? escape(name) : '—'}</span>`;
    return `<div class="form-switchable-control" data-form-switchable-readonly="${field?.form?.readonly === true}">
        <div class="form-value-display">${display}</div>
        ${renderInput(field, name, `form-edit-control ${extraClass}`, lang)}
    </div>`;
}

export function renderFieldControl(field, value, data, lang, extraClass = '') {
    const attributes = controlAttributes(field, lang);
    switch (field.type) {
        case 'many2one':
            return renderMany2oneControl(field, value, lang, extraClass);
        case 'text':
            return renderTextArea(field, value, `form-control--textarea ${extraClass}`, lang);
        case 'html':
            return renderRichTextControl(field, value, lang);
        case 'date':
            return `<input type="date" name="${escapeAttr(field.name)}"
                value="${escapeAttr(toDateInputValue(value))}" class="${inputClasses(`form-control--date ${extraClass}`)}"
                ${attributes} data-form-input disabled />`;
        case 'datetime':
            return `<input type="datetime-local" name="${escapeAttr(field.name)}"
                value="${escapeAttr(toDateTimeInputValue(value))}" class="${inputClasses(`form-control--date ${extraClass}`)}"
                ${attributes} data-form-input disabled />`;
        case 'integer':
            return `<input type="number" step="1" name="${escapeAttr(field.name)}"
                value="${escapeAttr(value ?? '')}" class="${inputClasses(extraClass)}" ${attributes} data-form-input disabled />`;
        case 'decimal':
            return `<input type="number" step="0.01" name="${escapeAttr(field.name)}"
                value="${escapeAttr(value ?? '')}" class="${inputClasses(extraClass)}" ${attributes} data-form-input disabled />`;
        case 'monetary': {
            const rawValue = value ?? '';
            const formattedValue = rawValue === '' ? '' : formatCurrency(Number(rawValue), locale(lang), field.currency ?? 'MXN');
            return `<input type="text" name="${escapeAttr(field.name)}" value="${escapeAttr(formattedValue)}"
                data-raw-value="${escapeAttr(rawValue)}" data-form-type="monetary"
                data-currency="${escapeAttr(field.currency ?? 'MXN')}" class="${inputClasses(extraClass)}"
                ${attributes} data-form-input disabled />`;
        }
        case 'percentage':
            return renderPercentageControl(field, value, lang, extraClass);
        case 'boolean':
            return `<input type="checkbox" name="${escapeAttr(field.name)}" value="true"
                ${value ? 'checked' : ''} class="form-checkbox" ${attributes} data-form-input disabled />`;
        case 'selection': {
            const options = data?.model?.status ?? [];
            return `<select name="${escapeAttr(field.name)}" class="${inputClasses(extraClass)}" ${attributes} data-form-input disabled>
                ${options.map((option) => `<option value="${escapeAttr(option.value)}" ${option.value === value ? 'selected' : ''}>
                    ${escape(option?.[lang] ?? option.value)}
                </option>`).join('')}
            </select>`;
        }
        case 'many2many_pills':
            return renderPillsControl(field, value, lang, extraClass);
        default:
            return renderInput(field, value ?? '', extraClass, lang);
    }
}

function renderField(field, record, data, lang, variant = '') {
    const requiredMark = field.form?.required
        ? '<span class="form-required-mark" aria-hidden="true">*</span>'
        : '';
    const help = localizedConfig(field, 'help', lang);
    const helpText = help
        ? `<p id="${helpId(field)}" class="form-field-help">${escape(help)}</p>`
        : '';
    const classes = ['form-field', variant === 'tab' ? 'form-field--tab' : ''].filter(Boolean).join(' ');
    const hideRepeatedTabLabel = variant === 'tab-primary' && field.type === 'html';

    if (field.type === 'boolean') {
        return `<div class="${classes}" data-form-field="${escapeAttr(field.name)}">
            <label class="form-boolean-label">
                ${renderFieldControl(field, record[field.name], data, lang)}
                <span>${label(field, lang)} ${requiredMark}</span>
            </label>
            ${helpText}
        </div>`;
    }
    return `<div class="${classes}" data-form-field="${escapeAttr(field.name)}">
        ${hideRepeatedTabLabel ? '' : `<label class="form-field-label">
            ${label(field, lang)} ${requiredMark}
        </label>`}
        <div class="form-field-control">
            ${renderFieldControl(field, record[field.name], data, lang)}
        </div>
        ${helpText}
    </div>`;
}

function renderColumn(items, side, record, data, lang) {
    if (items.length === 0) return '';
    return `<div class="form-layout-column" data-form-column="${side}">
        ${items.map(({ field }) => renderField(field, record, data, lang)).join('')}
    </div>`;
}

function renderTabs(tabs, record, data, lang) {
    if (tabs.length === 0) return '';
    return `<section class="form-record-tabs" data-record-tabs>
        <div class="form-record-tablist" role="tablist" aria-label="${lang === 'es' ? 'Secciones del formulario' : 'Form sections'}">
            ${tabs.map((tab, index) => {
                const tabLabel = label(tab.fields[0]?.field, lang) || `${lang === 'es' ? 'Sección' : 'Section'} ${index + 1}`;
                return `<button type="button" class="form-record-tab ${index === 0 ? 'form-record-tab--active' : ''}"
                    role="tab" aria-selected="${index === 0}" data-record-tab="${tab.position}">${tabLabel}</button>`;
            }).join('')}
        </div>
        ${tabs.map((tab, index) => `<div class="form-record-tab-panel" role="tabpanel"
            data-record-tab-panel="${tab.position}"${index === 0 ? '' : ' hidden'}>
            ${tab.fields.map(({ field }, fieldIndex) => renderField(
                field,
                record,
                data,
                lang,
                fieldIndex === 0 ? 'tab-primary' : 'tab',
            )).join('')}
        </div>`).join('')}
    </section>`;
}

export function renderFormLayout(schema, record, data, lang) {
    const layout = getFormLayout(schema);
    const hasLeft = layout.leftColumn.length > 0;
    const hasRight = layout.rightColumn.length > 0;
    const columns = hasLeft || hasRight
        ? `<div class="form-layout-columns ${hasLeft && hasRight ? 'form-layout-columns--split' : ''}">
            ${renderColumn(layout.leftColumn, 'left', record, data, lang)}
            ${renderColumn(layout.rightColumn, 'right', record, data, lang)}
        </div>`
        : '';
    const tabs = renderTabs(layout.tabs, record, data, lang);
    return columns || tabs ? `<div class="form-record-body">${columns}${tabs}</div>` : '';
}

export function setFormInputsEnabled(container, enabled, lang = 'en') {
    container.querySelectorAll('[data-form-input]').forEach((input) => {
        const isReadonly = input.dataset.formReadonly === 'true';
        if (input.dataset.formType === 'monetary') {
            if (enabled && !isReadonly) {
                input.value = input.dataset.rawValue ?? '';
            } else {
                input.dataset.rawValue = input.value;
                input.value = input.value === ''
                    ? ''
                    : formatCurrency(Number(input.value), locale(lang), input.dataset.currency ?? 'MXN');
            }
        }
        input.disabled = !enabled || isReadonly;
    });
}

export function initPercentageSliders(container) {
    if (!container) return () => {};
    const listeners = Array.from(container.querySelectorAll('[data-form-percentage-input]')).map((input) => {
        const output = input.closest('.form-percentage-editor')?.querySelector('[data-form-percentage-output]');
        const update = () => {
            const percentage = Math.max(0, Math.min(100, Number(input.value) || 0));
            input.style.setProperty('--form-percentage', `${percentage}%`);
            input.setAttribute('aria-valuetext', `${percentage}%`);
            if (output) output.textContent = `${percentage}%`;
        };
        input.addEventListener('input', update);
        update();
        return { input, update };
    });
    return () => listeners.forEach(({ input, update }) => input.removeEventListener('input', update));
}
