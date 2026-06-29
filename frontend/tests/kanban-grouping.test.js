import { beforeAll, describe, expect, it, vi } from 'vitest';

let renderKanban;

beforeAll(async () => {
    const values = new Map();
    vi.stubGlobal('localStorage', {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear(),
    });
    ({ renderKanban } = await import('../src/app/views/renderKanban.js'));
});

const schema = [
    { name: 'name', type: 'string', kanban: { header: 'title' } },
    { name: 'phase', type: 'selection' },
];

const records = [
    { uuid: 'one', name: 'First card', phase: 'todo' },
    { uuid: 'two', name: 'Second card', phase: 'done' },
];

function model(overrides = {}) {
    return {
        name: 'task',
        label: { en: 'Tasks' },
        schema,
        phase: [
            { value: 'todo', en: 'To do', color: 'zinc' },
            { value: 'done', en: 'Done', color: 'green' },
        ],
        ...overrides,
    };
}

describe('configurable Kanban grouping', () => {
    it('groups records by the field named in model.groupBy', () => {
        document.body.innerHTML = renderKanban({ model: model({ groupBy: 'phase' }), records });

        const columns = document.querySelectorAll('[data-group-value]');
        expect(columns).toHaveLength(2);
        expect(columns[0].closest('section').textContent).toContain('To do');
        expect(columns[0].textContent).toContain('First card');
        expect(columns[0].textContent).not.toContain('Second card');
        expect(columns[1].closest('section').textContent).toContain('Done');
        expect(columns[1].textContent).toContain('Second card');
    });

    it('renders every card without groups when groupBy is omitted', () => {
        document.body.innerHTML = renderKanban({ model: model(), records });

        expect(document.querySelectorAll('[data-group-value]')).toHaveLength(0);
        expect(document.querySelectorAll('[data-kanban-cards] > article')).toHaveLength(2);
        expect(document.querySelectorAll('[data-icon="user"]')).toHaveLength(2);
        expect(document.body.textContent).not.toContain('To do');
        expect(document.body.textContent).not.toContain('Done');
    });
});
