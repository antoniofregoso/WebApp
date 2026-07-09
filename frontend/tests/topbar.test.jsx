import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';

import { Topbar } from '../src/app/components/topbar.jsx';

function mount(vnode) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(vnode, host);
    return host;
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('Topbar user menu', () => {
    it('shows the user name above the theme selection when known', () => {
        const host = mount(<Topbar lang="en" theme="light" pageTitle="" user={{ name: 'Ana Admin', email: 'ana@example.com' }} />);
        const nameRow = host.querySelector('.topbar-user-name-row');
        expect(nameRow.textContent).toBe('Ana Admin');
        expect(nameRow.nextElementSibling.querySelector('.topbar-menu-label').textContent).toBe('Theme');
    });

    it('omits the name row when the user has no name yet', () => {
        const host = mount(<Topbar lang="en" theme="light" pageTitle="" user={{ email: 'ana@example.com' }} />);
        expect(host.querySelector('.topbar-user-name-row')).toBeNull();
    });

    it('omits the name row when no user is provided', () => {
        const host = mount(<Topbar lang="en" theme="light" pageTitle="" />);
        expect(host.querySelector('.topbar-user-name-row')).toBeNull();
    });
});
