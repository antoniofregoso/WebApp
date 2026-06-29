import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import { initForm, renderForm } from '../src/app/views/renderForm.js';

const styles = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

const data = {
  model: {
    name: 'sale.order',
    label: { en: 'Orders', es: 'Órdenes' },
    schema: [{ name: 'name', type: 'string', form: { header: 'title' } }],
  },
  records: [{ uuid: 'record-1', name: 'SO-001' }],
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('communication panel', () => {
  it('requires and displays a subject when composing a message', () => {
    document.body.innerHTML = renderForm(data, 'es');
    const cleanup = initForm('es');
    document.querySelector('[data-form-tab="messages"]').click();
    document.querySelector('[data-form-tab-add="messages"]').click();

    const panel = document.querySelector('[data-form-tab-panel="messages"]');
    const subject = panel.querySelector('[data-message-subject]');
    const error = panel.querySelector('[data-message-subject-error]');
    const editor = panel.querySelector('.ql-editor');
    const save = panel.querySelector('[data-composer-save]');

    expect(subject.placeholder).toBe('¿De qué trata el mensaje?');
    expect(document.activeElement).toBe(subject);

    editor.innerHTML = '<p>Detalle del mensaje</p>';
    save.click();
    expect(subject.getAttribute('aria-invalid')).toBe('true');
    expect(error.classList.contains('hidden')).toBe(false);

    subject.value = 'Seguimiento de la propuesta';
    subject.dispatchEvent(new Event('input', { bubbles: true }));
    save.click();

    expect(panel.querySelector('[data-activity-list]').textContent).toContain(
      'Seguimiento de la propuesta'
    );
    expect(panel.querySelector('[data-activity-list]').textContent).toContain(
      'Detalle del mensaje'
    );
    cleanup();
  });

  it('keeps the WhatsApp action tooltip inside the right edge', () => {
    document.body.innerHTML = renderForm(data, 'en');
    const cleanup = initForm('en');
    const whatsappTab = document.querySelector('[data-form-tab-panel="whatsapp"]');
    const addButton = whatsappTab.querySelector('[data-form-tab-add="whatsapp"]');

    expect(addButton.dataset.tooltip).toBe('New conversation');
    expect(addButton.dataset.tooltipAlign).toBe('end');
    expect(styles).toContain('.topbar-action-btn[data-tooltip][data-tooltip-align="end"]::after');
    expect(styles).toMatch(/data-tooltip-align="end"[^}]+right:\s*0;[^}]+left:\s*auto;/s);

    document.querySelector('[data-form-tab="whatsapp"]').click();
    expect(whatsappTab.hidden).toBe(false);
    cleanup();
  });
});
