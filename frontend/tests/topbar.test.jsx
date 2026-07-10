import { afterEach, describe, expect, it } from 'vitest';
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

    it('shows dynamic pending count badges only when counts are positive', () => {
        const host = mount(
            <Topbar
                lang="en"
                theme="light"
                pageTitle=""
                pendingCounts={{ messages: 4, notifications: 0 }}
            />,
        );

        expect(host.querySelector('.topbar-action-badge').textContent).toBe('4');
        expect(host.querySelector('[aria-label="Messages (4)"]')).not.toBeNull();
        expect(host.querySelector('[aria-label="Notifications"] .topbar-action-badge')).toBeNull();
    });

    it('caps large pending count badges', () => {
        const host = mount(
            <Topbar
                lang="en"
                theme="light"
                pageTitle=""
                pendingCounts={{ messages: 105, notifications: 12 }}
            />,
        );
        const badges = [...host.querySelectorAll('.topbar-action-badge')].map((badge) => badge.textContent);

        expect(badges).toEqual(['99+', '12']);
    });
});
