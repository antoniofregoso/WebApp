import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from 'preact';

import { safeRichTextNodes } from '../src/app/components/communicationPanel.jsx';
import { mountForm } from './helpers/mountView.jsx';

const styles = readFileSync('src/style.css', 'utf8');

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
  it('discards executable markup from rich text', () => {
    const host = document.createElement('div');
    render(safeRichTextNodes(
      '<p>Contenido seguro</p><script>window.compromised=true</script>'
      + '<img src="javascript:alert(1)" onerror="window.compromised=true">'
      + '<a href="javascript:alert(1)" onclick="window.compromised=true">enlace</a>'
    ), host);

    expect(host.textContent).toContain('Contenido seguro');
    expect(host.querySelector('script')).toBeNull();
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('a').hasAttribute('href')).toBe(false);
    expect(host.querySelector('[onerror], [onclick]')).toBeNull();
  });

  it('requires and displays a subject when composing a message', async () => {
    const { cleanup } = mountForm(data, 'es');
    document.querySelector('[data-form-tab="messages"]').click();
    document.querySelector('[data-form-tab-add="messages"]').click();

    const panel = document.querySelector('[data-form-tab-panel="messages"]');
    await vi.waitFor(() => expect(panel.querySelector('.ql-editor')).not.toBeNull());

    const subject = panel.querySelector('[data-message-subject]');
    const error = panel.querySelector('[data-message-subject-error]');
    const editor = panel.querySelector('.ql-editor');
    const save = panel.querySelector('[data-composer-save]');

    expect(subject.placeholder).toBe('¿De qué trata el mensaje?');
    expect(document.activeElement).toBe(subject);

    editor.innerHTML = '<p>Detalle del mensaje</p>';
    save.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(subject.getAttribute('aria-invalid')).toBe('true');
    expect(error.classList.contains('hidden')).toBe(false);

    subject.value = 'Seguimiento de la propuesta';
    subject.dispatchEvent(new Event('input', { bubbles: true }));
    save.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(panel.querySelector('[data-activity-list]').textContent).toContain(
      'Seguimiento de la propuesta'
    );
    expect(panel.querySelector('[data-activity-list]').textContent).toContain(
      'Detalle del mensaje'
    );
    cleanup();
  });

  it('keeps the WhatsApp action tooltip inside the right edge', async () => {
    const { cleanup } = mountForm(data, 'en');
    const whatsappTab = document.querySelector('[data-form-tab-panel="whatsapp"]');
    const addButton = whatsappTab.querySelector('[data-form-tab-add="whatsapp"]');

    expect(addButton.dataset.tooltip).toBe('New conversation');
    expect(addButton.dataset.tooltipAlign).toBe('end');
    expect(styles).toContain('.topbar-action-btn[data-tooltip][data-tooltip-align="end"]::after');
    expect(styles).toMatch(/data-tooltip-align="end"[^}]+right:\s*0;[^}]+left:\s*auto;/s);

    document.querySelector('[data-form-tab="whatsapp"]').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(whatsappTab.hidden).toBe(false);
    cleanup();
  });
});
