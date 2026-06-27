import { describe, expect, it } from 'vitest';

import { renderValue } from '../src/app/utils/renderValues.js';
import { renderFieldControl } from '../src/app/views/formFields.js';
import { renderKanban } from '../src/app/views/renderKanban.js';
import { renderList } from '../src/app/views/renderList.js';

const tags = [{
    uuid: 'tag-1',
    name: { en: 'Recurrent', es: 'Recurrente' },
    color: 'green',
}];

const data = {
    model: {
        name: 'sale.order',
        label: { en: 'Orders', es: 'Órdenes' },
        status: [{ value: 'draft', en: 'Draft', es: 'Borrador', color: 'zinc' }],
        schema: [
            { name: 'name', type: 'string', list: { column: 0 }, kanban: { header: 'title' } },
            { name: 'tags', type: 'many2many_pills', list: { column: 1 }, kanban: { footer: 0 } },
        ],
    },
    records: [{ uuid: 'record-1', name: 'SO-001', tags, status: 'draft' }],
};

describe('localized tag names', () => {
    it.each([
        ['list', renderList],
        ['kanban', renderKanban],
    ])('renders the active language in the %s view', (_view, render) => {
        expect(render(data, 'en')).toContain('Recurrent');
        expect(render(data, 'en')).not.toContain('Recurrente');
        expect(render(data, 'es')).toContain('Recurrente');
    });

    it('renders the active language in form fields', () => {
        const field = data.model.schema[1];
        expect(renderFieldControl(field, tags, data, 'en')).toContain('value="Recurrent"');
        expect(renderFieldControl(field, tags, data, 'es')).toContain('value="Recurrente"');
    });

    it('renders localized pills through the shared value renderer', () => {
        expect(renderValue(tags, 'many2many_pills', 'en-US')).toContain('Recurrent');
        expect(renderValue(tags, 'many2many_pills', 'es-MX')).toContain('Recurrente');
    });
});
