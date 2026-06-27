import { afterEach, describe, expect, it } from 'vitest';

import { initForm, renderForm } from '../src/app/views/renderForm.js';

const data = {
    model: {
        name: 'sale.order',
        label: { en: 'Orders', es: 'Órdenes' },
        schema: [{ name: 'name', type: 'string', label: { en: 'Name', es: 'Nombre' } }],
    },
    records: [{ uuid: 'record-1', name: 'SO-001' }],
};

afterEach(() => {
    document.body.innerHTML = '';
});

describe('form actions', () => {
    it('renders localized save, archive, and delete controls', () => {
        const html = renderForm(data, 'es');

        expect(html).toContain('aria-label="Guardar"');
        expect(html).toContain('data-form-save\n            disabled');
        expect(html).toContain('aria-label="Archivar"');
        expect(html).toContain('data-form-archive');
        expect(html).toContain('aria-label="Borrar"');
        expect(html).toContain('data-form-delete');
    });

    it('only enables save while the form is in edit mode', () => {
        document.body.innerHTML = renderForm(data, 'en');
        const cleanup = initForm('en');
        const root = document.querySelector('[data-form-root]');
        const editButton = root.querySelector('[data-form-edit]');
        const saveButton = root.querySelector('[data-form-save]');

        expect(saveButton.disabled).toBe(true);

        editButton.click();
        expect(root.dataset.formMode).toBe('edit');
        expect(saveButton.disabled).toBe(false);

        saveButton.click();
        expect(root.dataset.formMode).toBe('readonly');
        expect(saveButton.disabled).toBe(true);

        cleanup();
    });
});
