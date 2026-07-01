import { afterEach, describe, expect, it, vi } from 'vitest';

import { initTopbar, renderTopbar } from '../src/app/components/topbar.js';
import { dashboard } from '../src/app/pages/dashboard.js';
import {
    clearAuthSession,
    getAccessToken,
    isAuthenticated,
    setAuthSession,
} from '../src/app/store/authStore.js';

afterEach(() => {
    clearAuthSession();
    document.body.innerHTML = '';
});

describe('authenticated navigation', () => {
    it('redirects unauthenticated dashboard visits to login', () => {
        document.body.innerHTML = '<div id="app"></div>';
        const router = {
            goTo: vi.fn(),
            trigger404: vi.fn(),
        };

        dashboard({ params: {}, pathname: '/dashboard' }, router);

        expect(router.goTo).toHaveBeenCalledWith('login');
        expect(document.getElementById('dashboard-topbar')).toBeNull();
    });

    it('clears the in-memory session and redirects when logging out', () => {
        setAuthSession({ email: 'user@example.com', token: 'access-token' });
        const router = { goTo: vi.fn() };
        document.body.innerHTML = renderTopbar('es', 'light', 'Dashboard');
        initTopbar(router);

        document.querySelector('[data-logout]').click();

        expect(isAuthenticated.value).toBe(false);
        expect(getAccessToken()).toBeNull();
        expect(router.goTo).toHaveBeenCalledWith('login');
    });
});
