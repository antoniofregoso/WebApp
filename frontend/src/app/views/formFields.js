import { formatCurrency, locale } from '../utils';

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
    return escape(field?.label?.[lang] ?? field?.name ?? '');
}

export function getField(schema, name) {
    return schema.find((field) => field.name === name);
}

export function getFormLayout(schema) {
    const headerFields = new Set(['avatar', 'name', 'description']);
    const columns = new Map();

    schema.forEach((field, index) => {
        if (headerFields.has(field.name) || !field.form) return;
        const column = Number(field.form.column);
        const row = Number(field.form.row);
        if (!Number.isFinite(column) || !Number.isFinite(row)) return;
        if (!columns.has(column)) columns.set(column, []);
        columns.get(column).push({ field, row, index });
    });

    return Array.from(columns.entries())
        .sort(([columnA], [columnB]) => columnA - columnB)
        .map(([, items]) => items.sort((a, b) => a.row - b.row || a.index - b.index));
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

function renderInput(field, value, extraClass = '') {
    return `<input type="text" name="${escapeAttr(field.name)}" value="${escapeAttr(value ?? '')}"
        class="${inputClasses(extraClass)}" data-form-input disabled />`;
}

export function renderTextArea(field, value, extraClass = '') {
    return `<textarea name="${escapeAttr(field.name)}" class="${inputClasses(extraClass)}"
        data-form-input disabled>${escape(value ?? '')}</textarea>`;
}

export function renderFieldControl(field, value, data, lang, extraClass = '') {
    switch (field.type) {
        case 'many2one':
            return renderInput(field, value?.name ?? value ?? '', extraClass);
        case 'date':
            return `<input type="date" name="${escapeAttr(field.name)}"
                value="${escapeAttr(toDateInputValue(value))}" class="${inputClasses(`form-control--date ${extraClass}`)}"
                data-form-input disabled />`;
        case 'datetime':
            return `<input type="datetime-local" name="${escapeAttr(field.name)}"
                value="${escapeAttr(toDateTimeInputValue(value))}" class="${inputClasses(`form-control--date ${extraClass}`)}"
                data-form-input disabled />`;
        case 'integer':
            return `<input type="number" step="1" name="${escapeAttr(field.name)}"
                value="${escapeAttr(value ?? '')}" class="${inputClasses(extraClass)}" data-form-input disabled />`;
        case 'decimal':
            return `<input type="number" step="0.01" name="${escapeAttr(field.name)}"
                value="${escapeAttr(value ?? '')}" class="${inputClasses(extraClass)}" data-form-input disabled />`;
        case 'monetary': {
            const rawValue = value ?? '';
            const formattedValue = rawValue === '' ? '' : formatCurrency(Number(rawValue), locale(lang), field.currency ?? 'MXN');
            return `<input type="text" name="${escapeAttr(field.name)}" value="${escapeAttr(formattedValue)}"
                data-raw-value="${escapeAttr(rawValue)}" data-form-type="monetary"
                data-currency="${escapeAttr(field.currency ?? 'MXN')}" class="${inputClasses(extraClass)}"
                data-form-input disabled />`;
        }
        case 'percentage':
            return `<input type="number" min="0" max="100" step="1" name="${escapeAttr(field.name)}"
                value="${escapeAttr(value ?? '')}" class="${inputClasses(extraClass)}" data-form-input disabled />`;
        case 'boolean':
            return `<input type="checkbox" name="${escapeAttr(field.name)}" value="true"
                ${value ? 'checked' : ''} class="form-checkbox" data-form-input disabled />`;
        case 'selection': {
            const options = data?.model?.status ?? [];
            return `<select name="${escapeAttr(field.name)}" class="${inputClasses(extraClass)}" data-form-input disabled>
                ${options.map((option) => `<option value="${escapeAttr(option.value)}" ${option.value === value ? 'selected' : ''}>
                    ${escape(option?.[lang] ?? option.value)}
                </option>`).join('')}
            </select>`;
        }
        case 'many2many_pills':
            return renderInput(field, Array.isArray(value) ? value.map((item) => item.name).join(', ') : value ?? '', extraClass);
        default:
            return renderInput(field, value ?? '', extraClass);
    }
}

function renderField(field, record, data, lang) {
    if (field.type === 'boolean') {
        return `<div class="rounded-lg border border-[var(--dash-border-soft)] bg-[var(--dash-bg)] px-3 py-2.5">
            <label class="flex min-h-6 items-center gap-2 text-sm text-[var(--dash-text)]">
                ${renderFieldControl(field, record[field.name], data, lang)}
                <span class="text-xs font-medium text-[var(--dash-text-muted)]">${label(field, lang)}</span>
            </label>
        </div>`;
    }
    return `<div class="rounded-lg border border-[var(--dash-border-soft)] bg-[var(--dash-bg)] px-3 py-2.5">
        <dt class="text-xs font-medium text-[var(--dash-text-muted)]">${label(field, lang)}</dt>
        <dd class="mt-1 min-h-6 text-sm text-[var(--dash-text)]">
            ${renderFieldControl(field, record[field.name], data, lang)}
        </dd>
    </div>`;
}

export function renderFormLayout(schema, record, data, lang) {
    const columns = getFormLayout(schema);
    if (columns.length === 0) return '';
    const columnClass = columns.length === 1 ? '' : ' sm:grid-cols-2';
    return `<dl class="grid gap-3 p-5${columnClass}">
        ${columns.map((items) => `<div class="grid content-start gap-3">
            ${items.map(({ field }) => renderField(field, record, data, lang)).join('')}
        </div>`).join('')}
    </dl>`;
}

export function setFormInputsEnabled(container, enabled, lang = 'en') {
    container.querySelectorAll('[data-form-input]').forEach((input) => {
        if (input.dataset.formType === 'monetary') {
            if (enabled) {
                input.value = input.dataset.rawValue ?? '';
            } else {
                input.dataset.rawValue = input.value;
                input.value = input.value === ''
                    ? ''
                    : formatCurrency(Number(input.value), locale(lang), input.dataset.currency ?? 'MXN');
            }
        }
        input.disabled = !enabled;
    });
}
