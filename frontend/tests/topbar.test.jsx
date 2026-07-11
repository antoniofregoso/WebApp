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
    it('renders an ordered dynamic breadcrumb trail with smaller nested links', () => {
        const breadcrumb = [
            { label: 'Configuration', url: '/dashboard/configuration' },
            { label: 'Companies', url: '/dashboard/configuration/system.company' },
            { label: 'My Company', url: '/dashboard/configuration/system.company/company-1' },
        ];
        const host = mount(<Topbar lang="en" theme="light" pageTitle="" breadcrumb={breadcrumb} />);
        const nav = host.querySelector('[aria-label="Breadcrumb"]');
        expect([...nav.querySelectorAll('a')].map((item) => item.textContent)).toEqual(['Configuration', 'Companies']);
        expect(nav.querySelector('[aria-current="page"]').textContent).toBe('My Company');
        expect(nav.textContent).toContain('Configuration/Companies/My Company');
    });

    it('renders a breadcrumb root with # as plain text', () => {
        const host = mount(<Topbar lang="en" theme="light" pageTitle="" breadcrumb={[
            { label: 'Configuration', url: '#' },
            { label: 'App', url: '/dashboard/configuration/system.app' },
        ]} />);
        const nav = host.querySelector('[aria-label="Breadcrumb"]');
        expect(nav.querySelectorAll('a')).toHaveLength(0);
        expect(nav.querySelector('[aria-current="page"]').textContent).toBe('App');
        expect(nav.firstElementChild.textContent).toBe('Configuration');
    });

    it('keeps a fifth breadcrumb level visible instead of shrinking it away', () => {
        const breadcrumb = ['Configuration', 'App', 'My App', 'Company', 'Currency'].map((label, index) => ({
            label,
            url: index === 0 ? '#' : `/level/${index}`,
        }));
        const host = mount(<Topbar lang="en" theme="light" pageTitle="" breadcrumb={breadcrumb} />);
        const nav = host.querySelector('[aria-label="Breadcrumb"]');
        expect(nav.querySelectorAll('a, [aria-current="page"]')).toHaveLength(4);
        expect(nav.querySelector('[aria-current="page"]').textContent).toBe('Currency');
        expect(nav.className).toContain('overflow-x-auto');
    });

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

    it('disables configured view buttons', () => {
        const host = mount(<Topbar lang="en" theme="light" pageTitle="Messages" showTools
            currentView="list" disabledViews={['kanban']} />);
        expect(host.querySelector('[data-view="kanban"]').disabled).toBe(true);
        expect(host.querySelector('[data-view="list"]').disabled).toBe(false);
    });
});
