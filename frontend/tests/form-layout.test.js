import { afterEach, describe, expect, it } from 'vitest';

import { getFormLayout } from '../src/app/views/formFields.js';
import { initForm, renderForm } from '../src/app/views/renderForm.js';

const schema = [
    { name: 'avatar', type: 'image', label: { en: 'Image' }, form: { header: 'image' } },
    { name: 'name', type: 'string', label: { en: 'Order' }, form: { header: 'Title', required: true } },
    { name: 'customer', type: 'many2one', label: { en: 'Customer' }, form: { header: 'subtitle' } },
    { name: 'second', type: 'string', label: { en: 'Second' }, form: { leftColumn: 1 } },
    { name: 'first', type: 'string', label: { en: 'First' }, form: { leftColumn: 0, readonly: true } },
    { name: 'tags', type: 'many2many_pills', label: { en: 'Tags' }, form: { leftColumn: 2 } },
    { name: 'right', type: 'string', label: { en: 'Right' }, form: { rightColumn: 0 } },
    { name: 'progress', type: 'percentage', label: { en: 'Progress' }, form: { rightColumn: 1 } },
    {
        name: 'description',
        type: 'html',
        label: { en: 'Description' },
        form: { tab: 0, placeholder: { en: '<p>Describe the order</p>' }, help: { en: 'Internal notes' } },
    },
    { name: 'ignored', type: 'string', label: { en: 'Ignored' } },
];

const data = {
    model: { name: 'sale.order', label: { en: 'Orders' }, schema },
    records: [{
        uuid: 'record-1',
        avatar: '/avatar.jpg',
        name: 'SO-001',
        customer: { uuid: 'customer-1', name: 'ACME', model: 'res.partner' },
        first: 'A',
        second: 'B',
        right: 'C',
        progress: 42,
        tags: [{ name: { en: 'VIP', es: 'VIP' }, color: 'purple' }],
        description: '',
        ignored: 'Do not render',
    }],
};

afterEach(() => {
    document.body.innerHTML = '';
});

describe('schema-driven form layout', () => {
    it('places and orders fields in the four supported areas', () => {
        const layout = getFormLayout(schema);

        expect(layout.header.image.name).toBe('avatar');
        expect(layout.header.title.name).toBe('name');
        expect(layout.header.subtitle.name).toBe('customer');
        expect(layout.leftColumn.map(({ field }) => field.name)).toEqual(['first', 'second', 'tags']);
        expect(layout.rightColumn.map(({ field }) => field.name)).toEqual(['right', 'progress']);
        expect(layout.tabs[0].fields.map(({ field }) => field.name)).toEqual(['description']);
    });

    it('does not render an image when the schema does not configure an image header', () => {
        const withoutImage = {
            ...data,
            model: { ...data.model, schema: schema.filter((field) => field.name !== 'avatar') },
        };

        expect(renderForm(withoutImage, 'en')).not.toContain('data-form-header="image"');
    });

    it('renders localized field options and omits unconfigured fields', () => {
        const html = renderForm(data, 'en');

        expect(html).toContain('data-form-header="image"');
        expect(html).toContain('res.partner/customer-1');
        expect(html).toContain('>ACME</a>');
        expect(html).toContain('placeholder="Describe the order"');
        expect(html).toContain('required aria-required="true"');
        expect(html).toContain('Internal notes');
        expect(html).toContain('style="width:42%"');
        expect(html).toContain('type="range"');
        expect(html).toContain('bg-purple-100 text-purple-700');
        expect(html).toContain('>VIP</span>');
        expect(html).not.toContain('Do not render');
    });

    it('keeps readonly controls disabled while other controls enter edit mode', () => {
        document.body.innerHTML = renderForm(data, 'en');
        const cleanup = initForm('en');
        const recordForm = document.querySelector('[data-form-record]');

        document.querySelector('[data-form-edit]').click();

        expect(recordForm.querySelector('[name="first"]').disabled).toBe(true);
        expect(recordForm.querySelector('[name="second"]').disabled).toBe(false);
        expect(recordForm.querySelector('[name="progress"]').disabled).toBe(false);
        expect(recordForm.querySelector('[name="tags"]').disabled).toBe(false);
        expect(recordForm.querySelector('[name="customer"]').disabled).toBe(false);
        expect(recordForm.querySelector('[data-form-header="subtitle"] a').textContent).toBe('ACME');
        expect(recordForm.querySelector('[data-form-field="description"] > .form-field-label')).toBeNull();
        expect(document.querySelector('[data-form-rich-text] .ql-toolbar')).not.toBeNull();
        expect(document.querySelector('[data-form-rich-text-editor].ql-container')).not.toBeNull();

        const slider = recordForm.querySelector('[data-form-percentage-input]');
        slider.value = '73';
        slider.dispatchEvent(new Event('input'));
        expect(recordForm.querySelector('[data-form-percentage-output]').textContent).toBe('73%');
        expect(slider.style.getPropertyValue('--form-percentage')).toBe('73%');
        cleanup();
    });
});
