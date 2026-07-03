import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'preact';

import { CalendarView, FormView, KanbanView, ListView, toCalendarEvents } from '../src/app/views/index.js';

const schema = [
    { name: 'name', type: 'string', label: { en: 'Name' }, kanban: { header: 'title' }, list: { column: 0, order: true }, form: { header: 'title' }, calendar: { title: true } },
    { name: 'status', type: 'selection', label: { en: 'Status' }, list: { column: 1 } },
    { name: 'starts_at', type: 'datetime', label: { en: 'Start' }, calendar: { startDate: true }, form: { leftColumn: 0 } },
];
const today = new Date();
const localDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const data = {
    model: {
        name: 'task', label: { en: 'Tasks' }, schema, groupBy: 'status',
        status: [{ value: 'todo', en: 'To do', color: 'zinc' }, { value: 'done', en: 'Done', color: 'green' }],
    },
    records: [
        { uuid: '2', name: 'Second', status: 'done', starts_at: `${localDay}T10:00:00` },
        { uuid: '1', name: 'First', status: 'todo', starts_at: `${localDay}T09:00:00` },
    ],
};

function mount(vnode) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(vnode, host);
    return host;
}

afterEach(() => {
    if (document.body.firstElementChild) render(null, document.body.firstElementChild);
    document.body.innerHTML = '';
});

describe('Preact schema views', () => {
    it('groups Kanban cards declaratively', () => {
        const host = mount(<KanbanView data={data} lang="en" />);
        expect(host.querySelectorAll('[data-group-value]')).toHaveLength(2);
        expect(host.querySelector('[data-group-value="todo"]').textContent).toContain('First');
    });

    it('sorts List rows through component state', async () => {
        const host = mount(<ListView data={data} lang="en" />);
        host.querySelector('.js-list-sort').click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(host.querySelector('[data-list-rows] tr').textContent).toContain('First');
    });

    it('switches Form fields from readonly to editable', async () => {
        const host = mount(<FormView data={data} lang="en" />);
        expect(host.querySelector('[data-form-root]').dataset.formMode).toBe('readonly');
        host.querySelector('[data-form-edit]').click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(host.querySelector('[data-form-root]').dataset.formMode).toBe('edit');
        expect(host.querySelector('input[name="name"]').value).toBe('Second');
    });

    it('renders Calendar events from schema metadata', () => {
        const host = mount(<CalendarView data={data} lang="en" />);
        expect(host.querySelectorAll('[data-event-id]')).toHaveLength(2);
        expect(host.querySelector('[data-event-id="1"]').textContent).toContain('First');
    });

    it('uses a 30 minute calendar fallback and omits invalid starts', () => {
        const [event] = toCalendarEvents({ ...data, records: [
            { uuid: 'valid', name: 'Valid', starts_at: `${localDay}T12:00:00` },
            { uuid: 'invalid', name: 'Invalid', starts_at: 'not-a-date' },
        ] });
        expect(event.endsAt.getTime() - event.startsAt.getTime()).toBe(30 * 60_000);
    });

    it('renders localized form actions and record navigation', () => {
        const host = mount(<FormView data={data} lang="es" options={{ recordModel: 'task', recordUuid: '1' }} />);
        expect(host.querySelector('[data-form-save]').getAttribute('aria-label')).toBe('Guardar');
        expect(host.querySelector('[data-form-nav="previous"]').getAttribute('href')).toContain('/task/2');
        expect(host.querySelector('[data-form-nav="next"]').disabled).toBe(true);
    });
});
