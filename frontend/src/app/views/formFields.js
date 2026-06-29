import {
    buildRecordUrl, COLOR_CLASS, COLOR_FALLBACK, formatCurrency, locale, localizedValue,
    resolveTags,
} from '../utils';
import { faMagnifyingGlass, faXmark, icon } from '../components/icon.js';

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

function tagIdentity(tag) {
    return String(tag?.uuid ?? tag?.value ?? localizedValue(tag?.name, 'en'));
}

function mergeTagOptions(availableTags, selectedTags) {
    const tags = new Map();
    [...(availableTags ?? []), ...(selectedTags ?? [])].forEach((tag) => {
        if (tag && typeof tag === 'object') tags.set(tagIdentity(tag), tag);
    });
    return Array.from(tags.values());
}

function renderSelectedTag(tag, lang) {
    const classes = COLOR_CLASS[tag.color] ?? COLOR_FALLBACK;
    const name = localizedValue(tag.name, lang);
    return `<button type="button" class="form-tag-chip ${classes}"
        aria-label="${escapeAttr(`${lang === 'es' ? 'Quitar' : 'Remove'} ${name}`)}"
        data-tag-remove="${escapeAttr(tagIdentity(tag))}" disabled>
        <span>${escape(name)}</span>
        <span class="form-tag-chip-remove" aria-hidden="true">
            ${icon(faXmark, 'form-tag-chip-remove-icon')}
        </span>
    </button>`;
}

function renderPillsControl(field, value, data, lang) {
    const selectedTags = resolveTags(value, data?.model?.tags);
    const availableTags = mergeTagOptions(data?.model?.tags, selectedTags);
    const searchLabel = lang === 'es' ? 'Buscar etiquetas…' : 'Search tags…';
    const emptyLabel = lang === 'es' ? 'No hay etiquetas que coincidan' : 'No matching tags';
    const countLabel = lang === 'es'
        ? `${selectedTags.length} de ${availableTags.length} seleccionadas`
        : `${selectedTags.length} of ${availableTags.length} selected`;
    return `<div class="form-switchable-control" data-form-switchable-readonly="${field?.form?.readonly === true}">
        <div class="form-value-display">${renderPills(selectedTags, lang)}</div>
        <div class="form-tag-picker form-edit-control" data-tag-picker
            data-tag-picker-readonly="${field?.form?.readonly === true}">
            <input type="hidden" name="${escapeAttr(field.name)}"
                value="${escapeAttr(JSON.stringify(selectedTags.map(tagIdentity)))}"
                data-form-input data-tag-picker-value
                data-form-readonly="${field?.form?.readonly === true}" disabled />
            <div class="form-tag-picker-control" data-tag-picker-control>
                <div class="form-tag-picker-selections" data-tag-picker-selections>
                    ${selectedTags.map((tag) => renderSelectedTag(tag, lang)).join('')}
                </div>
                <div class="form-tag-picker-search-row">
                    ${icon(faMagnifyingGlass, 'form-tag-picker-search-icon')}
                    <input type="search" class="form-tag-picker-search"
                        aria-label="${escapeAttr(searchLabel)}" aria-expanded="false"
                        aria-haspopup="listbox" autocomplete="off"
                        placeholder="${escapeAttr(searchLabel)}" data-tag-picker-search disabled />
                </div>
            </div>
            <div class="form-tag-picker-menu" data-tag-picker-menu hidden>
                <div class="form-tag-picker-menu-header">
                    <span>${lang === 'es' ? 'Etiquetas disponibles' : 'Available tags'}</span>
                    <span data-tag-picker-count>${escape(countLabel)}</span>
                </div>
                <div class="form-tag-picker-options" role="listbox" aria-multiselectable="true"
                    aria-label="${lang === 'es' ? 'Etiquetas disponibles' : 'Available tags'}">
                    ${availableTags.map((tag) => {
        const id = tagIdentity(tag);
        const selected = selectedTags.some((item) => tagIdentity(item) === id);
        const tagName = localizedValue(tag.name, lang);
        return `<button type="button" class="form-tag-picker-option"
                            role="option" aria-selected="${selected}"
                            data-tag-option data-tag-id="${escapeAttr(id)}"
                            data-tag-value="${escapeAttr(JSON.stringify(tag))}">
                            <span class="form-tag-color form-tag-color--${escapeAttr(tag.color ?? 'zinc')}"></span>
                            <span class="form-tag-picker-option-name">${escape(tagName)}</span>
                            <span class="form-tag-picker-option-check" aria-hidden="true"></span>
                        </button>`;
    }).join('')}
                    <p class="form-tag-picker-empty" data-tag-picker-empty hidden>${escape(emptyLabel)}</p>
                </div>
            </div>
            <span class="sr-only" aria-live="polite" data-tag-picker-live>${escape(countLabel)}</span>
        </div>
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
            return renderPillsControl(field, value, data, lang);
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

function createTagChip(tag, lang) {
    const button = document.createElement('button');
    const name = localizedValue(tag.name, lang);
    button.type = 'button';
    button.disabled = true;
    button.dataset.tagRemove = tagIdentity(tag);
    button.className = `form-tag-chip ${COLOR_CLASS[tag.color] ?? COLOR_FALLBACK}`;
    button.setAttribute('aria-label', `${lang === 'es' ? 'Quitar' : 'Remove'} ${name}`);

    const text = document.createElement('span');
    text.textContent = name;
    button.append(text);

    const remove = document.createElement('span');
    remove.className = 'form-tag-chip-remove';
    remove.setAttribute('aria-hidden', 'true');
    remove.innerHTML = icon(faXmark, 'form-tag-chip-remove-icon');
    button.append(remove);
    return button;
}

function createReadonlyTag(tag, lang) {
    const pill = document.createElement('span');
    pill.className = `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_CLASS[tag.color] ?? COLOR_FALLBACK}`;
    pill.textContent = localizedValue(tag.name, lang);
    return pill;
}

export function initTagPickers(container, lang = 'en') {
    if (!container) return { setEnabled() {}, cleanup() {} };
    const cleanups = [];
    const controllers = Array.from(container.querySelectorAll('[data-tag-picker]')).map((picker) => {
        const hiddenInput = picker.querySelector('[data-tag-picker-value]');
        const search = picker.querySelector('[data-tag-picker-search]');
        const control = picker.querySelector('[data-tag-picker-control]');
        const selections = picker.querySelector('[data-tag-picker-selections]');
        const menu = picker.querySelector('[data-tag-picker-menu]');
        const count = picker.querySelector('[data-tag-picker-count]');
        const live = picker.querySelector('[data-tag-picker-live]');
        const empty = picker.querySelector('[data-tag-picker-empty]');
        const readonlyDisplay = picker.closest('.form-switchable-control')?.querySelector('.form-value-display');
        const options = Array.from(picker.querySelectorAll('[data-tag-option]'));
        const available = new Map(options.map((option) => {
            try {
                return [option.dataset.tagId, JSON.parse(option.dataset.tagValue)];
            } catch {
                return [option.dataset.tagId, null];
            }
        }).filter(([, tag]) => tag));
        let selectedValues;
        try {
            selectedValues = JSON.parse(hiddenInput?.value || '[]');
        } catch {
            selectedValues = [];
        }
        let selected = selectedValues.map((item) => {
            const id = typeof item === 'object' && item !== null ? tagIdentity(item) : String(item);
            return available.get(id) ?? (typeof item === 'object' ? item : null);
        }).filter(Boolean);
        let enabled = false;
        let activeIndex = -1;

        const selectedIds = () => new Set(selected.map(tagIdentity));
        const visibleOptions = () => options.filter((option) => !option.hidden);
        const countLabel = () => lang === 'es'
            ? `${selected.length} de ${options.length} seleccionadas`
            : `${selected.length} of ${options.length} selected`;

        const setActiveOption = (index) => {
            const visible = visibleOptions();
            options.forEach((option) => option.classList.remove('form-tag-picker-option--active'));
            if (visible.length === 0) {
                activeIndex = -1;
                return;
            }
            activeIndex = (index + visible.length) % visible.length;
            visible[activeIndex].classList.add('form-tag-picker-option--active');
            visible[activeIndex].scrollIntoView?.({ block: 'nearest' });
        };

        const filterOptions = () => {
            const query = search.value.trim().toLocaleLowerCase();
            options.forEach((option) => {
                option.hidden = !option.textContent.toLocaleLowerCase().includes(query);
            });
            empty.hidden = visibleOptions().length > 0;
            setActiveOption(0);
        };

        const render = () => {
            const ids = selectedIds();
            hiddenInput.value = JSON.stringify(selected.map(tagIdentity));
            selections.replaceChildren(...selected.map((tag) => createTagChip(tag, lang)));
            selections.querySelectorAll('[data-tag-remove]').forEach((button) => {
                button.disabled = !enabled;
            });
            options.forEach((option) => {
                option.setAttribute('aria-selected', String(ids.has(option.dataset.tagId)));
            });
            if (readonlyDisplay) {
                readonlyDisplay.replaceChildren();
                if (selected.length === 0) {
                    const dash = document.createElement('span');
                    dash.className = 'text-[var(--dash-text-soft)]';
                    dash.textContent = '—';
                    readonlyDisplay.append(dash);
                } else {
                    const list = document.createElement('div');
                    list.className = 'flex flex-wrap gap-1';
                    list.append(...selected.map((tag) => createReadonlyTag(tag, lang)));
                    readonlyDisplay.append(list);
                }
            }
            const label = countLabel();
            count.textContent = label;
            live.textContent = label;
        };

        const open = () => {
            if (!enabled) return;
            menu.hidden = false;
            search.setAttribute('aria-expanded', 'true');
            picker.classList.add('form-tag-picker--open');
            filterOptions();
        };

        const close = () => {
            menu.hidden = true;
            search.setAttribute('aria-expanded', 'false');
            picker.classList.remove('form-tag-picker--open');
            options.forEach((option) => option.classList.remove('form-tag-picker-option--active'));
            activeIndex = -1;
        };

        const toggle = (id) => {
            const index = selected.findIndex((tag) => tagIdentity(tag) === id);
            if (index >= 0) selected.splice(index, 1);
            else if (available.has(id)) selected.push(available.get(id));
            search.value = '';
            render();
            filterOptions();
            search.focus();
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const onControlClick = (event) => {
            if (event.target.closest('[data-tag-remove]')) return;
            open();
            search.focus();
        };
        const onSelectionsClick = (event) => {
            const remove = event.target.closest('[data-tag-remove]');
            if (remove && enabled) toggle(remove.dataset.tagRemove);
        };
        const onOptionClick = (event) => toggle(event.currentTarget.dataset.tagId);
        const onSearchInput = () => {
            open();
            filterOptions();
        };
        const onSearchKeydown = (event) => {
            const visible = visibleOptions();
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const wasClosed = menu.hidden;
                open();
                if (wasClosed) {
                    setActiveOption(event.key === 'ArrowDown' ? 0 : visibleOptions().length - 1);
                } else {
                    setActiveOption(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
                }
            } else if (event.key === 'Enter' && !menu.hidden && visible[activeIndex]) {
                event.preventDefault();
                toggle(visible[activeIndex].dataset.tagId);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                close();
            } else if (event.key === 'Backspace' && search.value === '' && selected.length > 0) {
                toggle(tagIdentity(selected[selected.length - 1]));
            } else if (event.key === 'Tab') {
                close();
            }
        };
        const onDocumentPointer = (event) => {
            if (!picker.contains(event.target)) close();
        };

        control.addEventListener('click', onControlClick);
        selections.addEventListener('click', onSelectionsClick);
        search.addEventListener('input', onSearchInput);
        search.addEventListener('keydown', onSearchKeydown);
        options.forEach((option) => option.addEventListener('click', onOptionClick));
        document.addEventListener('pointerdown', onDocumentPointer);
        cleanups.push(() => {
            control.removeEventListener('click', onControlClick);
            selections.removeEventListener('click', onSelectionsClick);
            search.removeEventListener('input', onSearchInput);
            search.removeEventListener('keydown', onSearchKeydown);
            options.forEach((option) => option.removeEventListener('click', onOptionClick));
            document.removeEventListener('pointerdown', onDocumentPointer);
        });

        render();
        return {
            setEnabled(nextEnabled) {
                enabled = nextEnabled && picker.dataset.tagPickerReadonly !== 'true';
                search.disabled = !enabled;
                selections.querySelectorAll('[data-tag-remove]').forEach((button) => {
                    button.disabled = !enabled;
                });
                if (!enabled) close();
            },
        };
    });

    return {
        setEnabled(enabled) {
            controllers.forEach((controller) => controller.setEnabled(enabled));
        },
        cleanup() {
            cleanups.forEach((cleanup) => cleanup());
        },
    };
}
