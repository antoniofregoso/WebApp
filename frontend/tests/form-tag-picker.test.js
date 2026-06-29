import { afterEach, describe, expect, it } from 'vitest';

import { initForm, renderForm } from '../src/app/views/renderForm.js';

const tags = [
  { uuid: 'tag-vip', name: { en: 'VIP', es: 'VIP' }, color: 'purple' },
  { uuid: 'tag-wholesale', name: { en: 'Wholesale', es: 'Mayoreo' }, color: 'blue' },
  { uuid: 'tag-export', name: { en: 'Export', es: 'Exportación' }, color: 'orange' },
];

const data = {
  model: {
    name: 'sale.order',
    label: { en: 'Orders', es: 'Órdenes' },
    tags,
    schema: [
      { name: 'name', type: 'string', form: { header: 'title' } },
      {
        name: 'tags',
        type: 'many2many_pills',
        label: { en: 'Tags', es: 'Etiquetas' },
        form: { leftColumn: 0 },
      },
    ],
  },
  records: [{ uuid: 'record-1', name: 'SO-001', tags: ['tag-vip'] }],
};

afterEach(() => {
  document.body.innerHTML = '';
});

function setup(lang = 'en') {
  document.body.innerHTML = renderForm(data, lang);
  const cleanup = initForm(lang);
  document.querySelector('[data-form-edit]').click();
  return {
    cleanup,
    picker: document.querySelector('[data-tag-picker]'),
    search: document.querySelector('[data-tag-picker-search]'),
    hidden: document.querySelector('[data-tag-picker-value]'),
  };
}

describe('form tag picker', () => {
  it('opens a searchable catalog and adds or removes tags', () => {
    const { cleanup, picker, search, hidden } = setup('es');
    search.click();

    expect(picker.querySelector('[data-tag-picker-menu]').hidden).toBe(false);
    expect(search.getAttribute('aria-expanded')).toBe('true');

    picker.querySelector('[data-tag-id="tag-wholesale"]').click();
    expect(JSON.parse(hidden.value)).toEqual(['tag-vip', 'tag-wholesale']);
    expect(picker.querySelector('[data-tag-remove="tag-wholesale"]').textContent).toContain(
      'Mayoreo'
    );
    expect(
      picker.querySelector('[data-tag-id="tag-wholesale"]').getAttribute('aria-selected')
    ).toBe('true');

    picker.querySelector('[data-tag-remove="tag-vip"]').click();
    expect(JSON.parse(hidden.value)).toEqual(['tag-wholesale']);
    cleanup();
  });

  it('filters options and supports keyboard selection and removal', () => {
    const { cleanup, picker, search, hidden } = setup();
    search.click();
    search.value = 'Export';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    expect(picker.querySelector('[data-tag-id="tag-wholesale"]').hidden).toBe(true);
    expect(picker.querySelector('[data-tag-id="tag-export"]').hidden).toBe(false);

    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(JSON.parse(hidden.value)).toContain('tag-export');

    search.value = '';
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(JSON.parse(hidden.value)).not.toContain('tag-export');
    cleanup();
  });

  it('updates the readonly pills when the form is saved', () => {
    const { cleanup, picker } = setup();
    picker.querySelector('[data-tag-picker-search]').click();
    picker.querySelector('[data-tag-id="tag-export"]').click();
    document.querySelector('[data-form-save]').click();

    const display = document.querySelector('[data-form-field="tags"] .form-value-display');
    expect(display.textContent).toContain('VIP');
    expect(display.textContent).toContain('Export');
    expect(document.querySelector('[data-form-root]').dataset.formMode).toBe('readonly');
    cleanup();
  });
});
