import { beforeEach, describe, expect, it } from 'vitest';

import { renderForm } from '../src/app/views/renderForm.js';

const data = {
    model: {
        name: 'sale.order',
        label: { en: 'Orders', es: 'Órdenes' },
        schema: [{ name: 'name', type: 'string', label: { en: 'Name', es: 'Nombre' } }],
    },
    records: [
        { uuid: 'record-1', name: 'SO-001' },
        { uuid: 'record-2', name: 'SO-002' },
        { uuid: 'record-3', name: 'SO-003' },
    ],
};

describe('form record navigation', () => {
    beforeEach(() => {
        window.history.replaceState({}, '', '/dashboard/sales/orders');
    });

    it('disables back on the first record and links to the second', () => {
        const html = renderForm(data, 'en', { recordModel: 'sale.order', recordUuid: 'record-1' });

        expect(html).toMatch(/data-form-nav="previous" disabled/);
        expect(html).toContain('href="/dashboard/sales/orders/sale.order/record-2"');
        expect(html).toContain('aria-label="Record 1 of 3"');
        expect(html).toContain('<span class="form-record-counter-current">1</span>');
    });

    it('enables both directions on a middle record', () => {
        const html = renderForm(data, 'es', { recordModel: 'sale.order', recordUuid: 'record-2' });

        expect(html).toContain('href="/dashboard/sales/orders/sale.order/record-1"');
        expect(html).toContain('href="/dashboard/sales/orders/sale.order/record-3"');
        expect(html).toContain('aria-label="Registro 2 de 3"');
    });

    it('disables forward on the final record', () => {
        const html = renderForm(data, 'en', { recordModel: 'sale.order', recordUuid: 'record-3' });

        expect(html).toMatch(/data-form-nav="next" disabled/);
        expect(html).toContain('aria-label="Record 3 of 3"');
    });

    it.each([undefined, '/images/avatar/1.jpg'])(
        'keeps the constant-height header class when avatar is %s',
        (avatar) => {
            const recordData = {
                ...data,
                records: [{ ...data.records[0], avatar }],
            };

            expect(renderForm(recordData, 'en')).toContain('class="form-record-header ');
        },
    );
});
