import {
    icon,
    faSun,
    faMoon,
    faDesktop,
    faCircleUser,
    faBell,
    faEnvelope,
    faListCheck,
    faMagnifyingGlass,
    faChevronLeft,
    faChevronRight,
    faTableColumns,
    faList,
    faRectangleList,
    faCalendarDays,
} from './icon.js';
import { contextActions, dashboardActions } from '../store/actions/index.js';
import { clearAuthSession } from '../store/authStore.js';
import { t } from '../../i18n/translations.js';
import { normalizePagination } from '../utils';

let _topbarCleanup = null;

/**
 * Render the top navigation bar HTML.
 * @param {string} lang    — current language ('en' | 'es')
 * @param {string} theme   — current theme ('light' | 'dark' | 'system')
 * @param {string} pageTitle — title of the current area
 * @param {object|null} breadcrumb — optional area/subarea breadcrumb data
 * @param {boolean} showTools — whether to show the floating tools dock
 * @returns {string}       — HTML string
 */
export function renderTopbar(lang, theme, pageTitle, breadcrumb = null, showTools = true, pagination = {}) {
    const { page, totalPages } = normalizePagination(pagination);
    const pageStatus = lang === 'es' ? `Página ${page} de ${totalPages}` : `Page ${page} of ${totalPages}`;
    const themes = [
        { key: 'light', icon: faSun, labelEn: 'Light', labelEs: 'Claro' },
        { key: 'dark', icon: faMoon, labelEn: 'Dark', labelEs: 'Oscuro' },
        { key: 'system', icon: faDesktop, labelEn: 'System', labelEs: 'Sistema' },
    ];

    const themeButtons = themes.map((th) => {
        const label = lang === 'es' ? th.labelEs : th.labelEn;
        return `
        <button
            class="topbar-theme-btn ${theme === th.key ? 'topbar-theme-btn--active' : ''}"
            data-theme="${th.key}"
            aria-label="${label}"
            aria-pressed="${theme === th.key}"
            title="${label}"
        >
            <span class="topbar-theme-icon" aria-hidden="true">
                ${icon(th.icon)}
            </span>
        </button>
        `;
    }).join('');
    const titleMarkup = breadcrumb?.subareaLabel ? `
        <nav class="flex min-w-0 items-center gap-2 text-[1.0625rem] font-semibold text-[var(--dash-text)]" aria-label="Breadcrumb">
            <a
                class="min-w-0 truncate text-[var(--dash-text-muted)] no-underline transition-colors hover:text-[var(--dash-accent)]"
                href="${breadcrumb.areaUrl}"
            >${breadcrumb.areaLabel}</a>
            <span class="shrink-0 text-[var(--dash-text-muted)]" aria-hidden="true">/</span>
            <span class="min-w-0 truncate text-[var(--dash-text)]" aria-current="page">${breadcrumb.subareaLabel}</span>
        </nav>
    ` : `<h1 class="topbar-page-title">${pageTitle}</h1>`;

    return `
    <div id="dashboard-topbar-shell" class="topbar-shell">
    <header id="dashboard-topbar" class="topbar" role="banner">

        <!-- ── Page title ─────────────────────────────────────── -->
        <div class="topbar-title">
            ${titleMarkup}
        </div>

        <!-- ── Controls ───────────────────────────────────────── -->
        <div class="topbar-controls" role="toolbar" aria-label="Toolbar controls">

            <button class="topbar-action-btn" aria-label="${t('topbar.tasks', lang)}" data-tooltip="${t('topbar.tasks', lang)}">
                ${icon(faListCheck, 'topbar-action-icon')}
            </button>
            <button class="topbar-action-btn" aria-label="${t('topbar.messages', lang)}" data-tooltip="${t('topbar.messages', lang)}">
                ${icon(faEnvelope, 'topbar-action-icon')}
                <span class="topbar-action-badge" aria-hidden="true">22</span>
            </button>
            <button class="topbar-action-btn" aria-label="${t('topbar.notifications', lang)}" data-tooltip="${t('topbar.notifications', lang)}">
                ${icon(faBell, 'topbar-action-icon')}
                <span class="topbar-action-badge" aria-hidden="true">12</span>
            </button>

            <div class="topbar-user-menu-wrap">
                <button
                    class="topbar-user-btn"
                    aria-label="User profile"
                    aria-expanded="false"
                    aria-controls="topbar-user-menu"
                    id="topbar-user"
                >
                    ${icon(faCircleUser, 'topbar-user-icon')}
                </button>

                <div class="topbar-user-menu" id="topbar-user-menu" role="menu" aria-labelledby="topbar-user">
                    <div class="topbar-menu-section">
                        <span class="topbar-menu-label">${t('topbar.theme', lang)}</span>
                        <div class="topbar-theme-group" role="group" aria-label="${t('topbar.theme', lang)}">
                            ${themeButtons}
                        </div>
                    </div>

                    <div class="topbar-menu-section">
                        <span class="topbar-menu-label">${t('topbar.lang', lang)}</span>
                        <div class="topbar-lang-group" role="group" aria-label="${t('topbar.lang', lang)}">
                            <button
                                class="topbar-lang-btn ${lang === 'en' ? 'topbar-lang-btn--active' : ''}"
                                data-lang="en"
                                aria-label="English"
                                aria-pressed="${lang === 'en'}"
                            >EN</button>
                            <button
                                class="topbar-lang-btn ${lang === 'es' ? 'topbar-lang-btn--active' : ''}"
                                data-lang="es"
                                aria-label="Español"
                                aria-pressed="${lang === 'es'}"
                            >ES</button>
                        </div>
                    </div>

                    <div class="topbar-menu-links">
                        <a class="topbar-menu-link" href="/dashboard/account" role="menuitem">${t('topbar.account', lang)}</a>
                        <a class="topbar-menu-link" href="/dashboard/settings" role="menuitem">${t('topbar.settings', lang)}</a>
                        <button class="topbar-menu-link topbar-menu-link--logout" type="button"
                            role="menuitem" data-logout>${t('topbar.logout', lang)}</button>
                    </div>
                </div>
            </div>

        </div>
    </header>
    ${showTools ? `
    <div class="topbar-tools-dock">
        <div class="topbar-floating-tools" aria-label="${t('topbar.tools', lang)}">
            <div class="topbar-view-group" role="group" aria-label="${t('topbar.view_type', lang)}">
                <button class="topbar-tool-btn" data-view="kanban" aria-label="${t('topbar.view.kanban', lang)}" data-tooltip="${t('topbar.view.kanban', lang)}">
                    ${icon(faTableColumns, 'topbar-tool-icon')}
                </button>
                <button class="topbar-tool-btn" data-view="list" aria-label="${t('topbar.view.list', lang)}" data-tooltip="${t('topbar.view.list', lang)}">
                    ${icon(faList, 'topbar-tool-icon')}
                </button>
                <button class="topbar-tool-btn" data-view="form" aria-label="${t('topbar.view.form', lang)}" data-tooltip="${t('topbar.view.form', lang)}">
                    ${icon(faRectangleList, 'topbar-tool-icon')}
                </button>
                <button class="topbar-tool-btn" data-view="calendar" aria-label="${t('topbar.view.calendar', lang)}" data-tooltip="${t('topbar.view.calendar', lang)}">
                    ${icon(faCalendarDays, 'topbar-tool-icon')}
                </button>
            </div>

            <form class="topbar-search" role="search" aria-label="${t('topbar.search', lang)}">
                <input
                    class="topbar-search-input"
                    type="search"
                    placeholder="${t('topbar.search_placeholder', lang)}"
                    aria-label="${t('topbar.search', lang)}"
                />
                <button class="topbar-search-btn" type="button" aria-label="${t('topbar.search', lang)}" data-tooltip="${t('topbar.search', lang)}">
                    ${icon(faMagnifyingGlass, 'topbar-tool-icon')}
                </button>
            </form>

            <div class="topbar-pagination" aria-label="${t('topbar.pagination', lang)}">
                <button class="topbar-tool-btn" data-page-previous
                    aria-label="${t('topbar.page_prev', lang)}" data-tooltip="${t('topbar.page_prev', lang)}"
                    ${page <= 1 ? 'disabled' : ''}>
                    ${icon(faChevronLeft, 'topbar-tool-icon')}
                </button>
                <span class="topbar-page-indicator" aria-label="${pageStatus}">${page} / ${totalPages}</span>
                <button class="topbar-tool-btn" data-page-next
                    aria-label="${t('topbar.page_next', lang)}" data-tooltip="${t('topbar.page_next', lang)}"
                    ${page >= totalPages ? 'disabled' : ''}>
                    ${icon(faChevronRight, 'topbar-tool-icon')}
                </button>
            </div>
        </div>
    </div>
    ` : ''}
    </div>
    `;
}

/**
 * Bind topbar event listeners (call after injecting HTML into DOM).
 */
export function initTopbar(router) {
    _topbarCleanup?.();

    const userMenuWrap = document.querySelector('.topbar-user-menu-wrap');
    const userBtn = document.getElementById('topbar-user');
    const userMenu = document.getElementById('topbar-user-menu');
    const logoutButton = document.querySelector('[data-logout]');

    function setUserMenuOpen(open) {
        userBtn?.setAttribute('aria-expanded', `${open}`);
        userMenu?.classList.toggle('topbar-user-menu--open', open);
    }

    userBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = userMenu?.classList.contains('topbar-user-menu--open');
        setUserMenuOpen(!isOpen);
    });

    const closeOnOutsideClick = (event) => {
        if (!userMenuWrap?.contains(event.target)) {
            setUserMenuOpen(false);
        }
    };

    const closeOnEscape = (event) => {
        if (event.key === 'Escape') {
            setUserMenuOpen(false);
        }
    };

    const logout = () => {
        clearAuthSession();
        setUserMenuOpen(false);
        router?.goTo('login');
    };

    document.addEventListener('click', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    logoutButton?.addEventListener('click', logout);

    _topbarCleanup = () => {
        document.removeEventListener('click', closeOnOutsideClick);
        document.removeEventListener('keydown', closeOnEscape);
        logoutButton?.removeEventListener('click', logout);
    };

    // Theme buttons
    document.querySelectorAll('.topbar-theme-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            contextActions.setTheme(btn.dataset.theme);
        });
    });

    // Language buttons
    document.querySelectorAll('.topbar-lang-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            contextActions.setLang(btn.dataset.lang);
        });
    });

    document.querySelector('.topbar-search')?.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    document.querySelector('[data-page-previous]')?.addEventListener('click', () => {
        dashboardActions.previousPage();
    });
    document.querySelector('[data-page-next]')?.addEventListener('click', () => {
        dashboardActions.nextPage();
    });
}
