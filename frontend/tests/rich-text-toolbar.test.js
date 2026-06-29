import { afterEach, describe, expect, it } from 'vitest';

import { initForm, renderForm } from '../src/app/views/renderForm.js';
import { RICH_TEXT_TOOLBAR } from '../src/app/views/noteEditor.js';

const data = {
  model: {
    name: 'sale.order',
    label: { en: 'Orders' },
    schema: [
      { name: 'name', type: 'string', form: { header: 'title' } },
      { name: 'description', type: 'html', form: { tab: 0 } },
    ],
  },
  records: [{ uuid: 'record-1', name: 'SO-001', description: '<p>Details</p>' }],
};

afterEach(() => {
  document.body.innerHTML = '';
});

function expectFamiliarToolbar(toolbar) {
  expect(toolbar.querySelector('.ql-link')).not.toBeNull();
  expect(toolbar.querySelector('.ql-image')).not.toBeNull();
  expect(toolbar.querySelector('.ql-color')).not.toBeNull();
  expect(toolbar.querySelector('.ql-background')).not.toBeNull();
  expect(toolbar.querySelector('.ql-code-block')).toBeNull();
  expect(toolbar.querySelector('.ql-clean')).toBeNull();
}

describe('rich text toolbar', () => {
  it('defines the simplified shared toolbar', () => {
    expect(RICH_TEXT_TOOLBAR[1].map((control) => Object.keys(control)[0])).toEqual([
      'color',
      'background',
    ]);
    expect(RICH_TEXT_TOOLBAR.flat()).toContain('link');
    expect(RICH_TEXT_TOOLBAR.flat()).toContain('image');
    expect(RICH_TEXT_TOOLBAR.flat()).not.toContain('code-block');
    expect(RICH_TEXT_TOOLBAR.flat()).not.toContain('clean');
  });

  it('uses link, image and color controls in HTML form fields', () => {
    document.body.innerHTML = renderForm(data, 'en');
    const cleanup = initForm('en');
    document.querySelector('[data-form-edit]').click();

    const toolbar = document.querySelector('[data-form-rich-text] .ql-toolbar');
    expectFamiliarToolbar(toolbar);
    cleanup();
  });

  it('uses the same controls in activity composers', () => {
    document.body.innerHTML = renderForm(data, 'en');
    const cleanup = initForm('en');
    document.querySelector('[data-form-tab-add="notes"]').click();

    const toolbar = document.querySelector('[data-form-tab-panel="notes"] .ql-toolbar');
    expectFamiliarToolbar(toolbar);
    cleanup();
  });
});
