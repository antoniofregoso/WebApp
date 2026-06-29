import { afterEach, describe, expect, it } from 'vitest';

import { initForm, renderForm } from '../src/app/views/renderForm.js';

const data = {
  model: {
    name: 'sale.order',
    label: { en: 'Orders', es: 'Órdenes' },
    schema: [
      { name: 'name', type: 'string', form: { header: 'title' } },
      {
        name: 'end_date',
        type: 'date',
        label: { en: 'Closing date', es: 'Fecha de cierre' },
        form: {
          leftColumn: 0,
          help: { en: 'Expected closing date', es: 'Fecha probable de cierre' },
        },
      },
      {
        name: 'amount',
        type: 'monetary',
        label: { en: 'Amount', es: 'Importe' },
        form: {
          leftColumn: 1,
          help: { en: 'Taxes included', es: 'Impuestos incluidos' },
        },
      },
    ],
  },
  records: [{ uuid: 'record-1', name: 'SO-001', end_date: '2026-07-01', amount: 100 }],
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('form contextual help', () => {
  it('opens by click, keeps one help open, and closes outside', () => {
    document.body.innerHTML = renderForm(data, 'es');
    const cleanup = initForm('es');
    const record = document.querySelector('[data-form-record]');
    const helpers = record.querySelectorAll('[data-form-help]');
    const firstTrigger = helpers[0].querySelector('[data-form-help-trigger]');
    const firstPopover = helpers[0].querySelector('[data-form-help-popover]');
    const secondTrigger = helpers[1].querySelector('[data-form-help-trigger]');

    expect(firstPopover.hidden).toBe(true);
    expect(firstTrigger.getAttribute('aria-label')).toContain('Fecha probable de cierre');

    firstTrigger.click();
    expect(firstPopover.hidden).toBe(false);
    expect(firstTrigger.getAttribute('aria-expanded')).toBe('true');

    secondTrigger.click();
    expect(firstPopover.hidden).toBe(true);
    expect(secondTrigger.getAttribute('aria-expanded')).toBe('true');

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(secondTrigger.getAttribute('aria-expanded')).toBe('false');
    cleanup();
  });

  it('closes with Escape and restores focus to the help button', () => {
    document.body.innerHTML = renderForm(data, 'en');
    const cleanup = initForm('en');
    const trigger = document.querySelector('[data-form-record] [data-form-help-trigger]');

    trigger.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    cleanup();
  });
});
