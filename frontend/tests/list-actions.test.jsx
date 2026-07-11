import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';

const api = vi.hoisted(() => ({ update: vi.fn(), remove: vi.fn() }));
vi.mock('../src/app/api/systemModel.js', () => ({
    updateSystemModelRecord: api.update,
    deleteSystemModelRecord: api.remove,
}));

import { ListView } from '../src/app/views/ListView.jsx';

const data = {
    model: {
        name: 'system.company', label: { en: 'Companies' },
        schema: [{ name: 'name', type: 'string', label: { en: 'Name' }, list: { column: 1 } }],
    },
    records: [{ uuid: 'company-1', name: 'My Company', active: true }],
};

function mount() {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(<ListView data={data} lang="en" />, host);
    return host;
}

async function selectRow(host) {
    host.querySelector('.js-list-row-select').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
    api.update.mockResolvedValue({ active: false });
    api.remove.mockResolvedValue(true);
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
});

afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
});

describe('List actions', () => {
    it('archives selected records', async () => {
        const host = mount();
        await selectRow(host);
        host.querySelector('[aria-label="Archive"]').click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(api.update).toHaveBeenCalledWith({
            model: 'system.company', recordUuid: 'company-1', values: { active: false },
        });
    });

    it('deletes selected records and removes their rows immediately', async () => {
        const host = mount();
        await selectRow(host);
        host.querySelector('[aria-label="Delete"]').click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(host.querySelector('[data-uuid="company-1"]')).toBeNull();
        expect(api.remove).toHaveBeenCalledWith({ model: 'system.company', recordUuid: 'company-1' });
    });
});
