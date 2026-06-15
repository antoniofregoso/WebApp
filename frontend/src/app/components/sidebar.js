import { icon, faChartLine, faUsers, faFolder, faGear, faBars, faCloud, faChevronLeft, faChevronRight } from './icon.js';
import { contextActions } from '../store/actions/index.js';
import { appSignal } from '../store/appStore.js';
import { t } from '../../i18n/translations.js';
import data from '../data/sidebar.json' assert { type: 'json' };


    const iconMap = {faChartLine, faUsers, faFolder, faCloud, faGear};

    const MENU_ITEMS_JSON = data;

export const MENU_ITEMS = MENU_ITEMS_JSON.map(item => ({
    ...item,
    icon: iconMap[item.icon] 
}))

function getLabel(item, lang) {
    return lang === 'es' ? item.labelEs : item.labelEn;
}

function renderSubmenuCard(item, lang) {
    if (!item.items?.length) return '';

    const label = getLabel(item, lang);
    const links = item.items.map((subitem) => {
        const subLabel = getLabel(subitem, lang);
        return `
            <a class="sidebar-submenu-link" href="${subitem.url}" data-submenu-link>
                <span class="sidebar-submenu-link-label">${subLabel}</span>
            </a>
        `;
    }).join('');

    return `
        <div class="sidebar-submenu-card" id="sidebar-submenu-${item.key}" role="menu" aria-label="${label}">
            <div class="sidebar-submenu-title">${label}</div>
            <div class="sidebar-submenu-list">
                ${links}
            </div>
        </div>
    `;
}

/**
 * Render the sidebar HTML string.
 */
export function renderSidebar(lang, expanded, activeArea) {
    const appName = t('sidebar.app_name', lang);
    const menuItems = MENU_ITEMS.map((item) => {
        const label = getLabel(item, lang);
        const isActive = item.key === activeArea;
        const hasSubmenu = Boolean(item.items?.length);
        const linkContent = `
            <span class="sidebar-icon" aria-hidden="true">
                ${icon(item.icon, 'sidebar-svg-icon')}
            </span>
            <span class="sidebar-label ${expanded ? '' : 'sidebar-label--hidden'}">
                ${label}
            </span>
            ${hasSubmenu ? `
                <span class="sidebar-submenu-chevron ${expanded ? '' : 'sidebar-submenu-chevron--hidden'}" aria-hidden="true">
                    ${icon(faChevronRight, 'sidebar-submenu-chevron-icon')}
                </span>
            ` : ''}
        `;

        return `
        <li class="sidebar-item ${isActive ? 'sidebar-item--active' : ''}" data-tooltip="${label}">
            ${hasSubmenu ? `
                <button
                    type="button"
                    class="sidebar-link sidebar-link--submenu"
                    data-area="${item.key}"
                    data-submenu-trigger="${item.key}"
                    aria-label="${label}"
                    aria-expanded="false"
                    aria-controls="sidebar-submenu-${item.key}"
                >
                    ${linkContent}
                </button>
                ${renderSubmenuCard(item, lang)}
            ` : `
                <a
                    href="${item.url}"
                    class="sidebar-link"
                    data-area="${item.key}"
                    aria-label="${label}"
                    aria-current="${isActive ? 'page' : 'false'}"
                >
                    ${linkContent}
                </a>
            `}
        </li>
        `;
    }).join('');

    return `
    <aside id="dashboard-sidebar" class="sidebar ${expanded ? 'sidebar--expanded' : 'sidebar--collapsed'}" aria-label="Sidebar navigation">

        <!-- ── Header: logo + app name + toggle ───────────────── -->
        <div class="sidebar-header">
            <a href="/dashboard" class="sidebar-logo" aria-label="${appName}">
                <img
                    src="/logo.png"
                    alt="App logo"
                    class="sidebar-logo-img"
                    style="width: 24px; height: 24px; border-radius: 4px;"
                />
                <span class="sidebar-app-name">
                    ${appName}
                </span>
            </a>
            <button
                id="sidebar-toggle"
                class="sidebar-toggle-btn"
                aria-label="${expanded ? 'Collapse sidebar' : 'Expand sidebar'}"
                aria-expanded="${expanded}"
                aria-controls="dashboard-sidebar"
                title="${expanded ? 'Collapse' : 'Expand'}"
            >
                ${expanded
            ? icon(faChevronLeft, 'sidebar-toggle-icon')
            : icon(faBars, 'sidebar-toggle-icon')
        }
            </button>
        </div>

        <!-- ── Navigation ─────────────────────────────────────── -->
        <nav class="sidebar-nav" aria-label="Main navigation">
            <ul class="sidebar-menu" role="list">
                ${menuItems}
            </ul>
        </nav>
        <a href="/dashboard" class="sidebar-collapsed-logo" aria-label="${appName}" title="${appName}">
            <img
                src="/logo.png"
                alt="App logo"
                class="sidebar-logo-img"
                style="width: 24px; height: 24px; border-radius: 4px;"
            />
        </a>
    </aside>
    `;
}

export function updateSidebarExpansion(expanded) {
    const sidebar = document.getElementById('dashboard-sidebar');
    const toggle = document.getElementById('sidebar-toggle');

    closeSidebarSubmenu();

    sidebar?.classList.toggle('sidebar--expanded', expanded);
    sidebar?.classList.toggle('sidebar--collapsed', !expanded);

    document.querySelectorAll('.sidebar-label').forEach((label) => {
        label.classList.toggle('sidebar-label--hidden', !expanded);
    });

    document.querySelectorAll('.sidebar-submenu-chevron').forEach((chevron) => {
        chevron.classList.toggle('sidebar-submenu-chevron--hidden', !expanded);
    });

    if (toggle) {
        toggle.setAttribute('aria-expanded', `${expanded}`);
        toggle.setAttribute('aria-label', expanded ? 'Collapse sidebar' : 'Expand sidebar');
        toggle.setAttribute('title', expanded ? 'Collapse' : 'Expand');
        toggle.innerHTML = expanded
            ? icon(faChevronLeft, 'sidebar-toggle-icon')
            : icon(faBars, 'sidebar-toggle-icon');
    }
}

// ── Floating tooltip (position:fixed — never clipped by sidebar overflow) ─────
let _tooltipEl = null;
let _submenuCleanup = null;
let _activeSubmenuTrigger = null;

function getTooltipEl() {
    if (!_tooltipEl) {
        _tooltipEl = document.createElement('div');
        _tooltipEl.id = 'sidebar-floating-tooltip';
        _tooltipEl.className = 'sidebar-floating-tooltip';
        document.body.appendChild(_tooltipEl);
    }
    return _tooltipEl;
}

function showTooltip(e) {
    const sidebar = document.getElementById('dashboard-sidebar');
    if (!sidebar?.classList.contains('sidebar--collapsed')) return;

    const li = e.currentTarget.closest('.sidebar-item');
    const label = li?.dataset.tooltip;
    if (!label) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const tip = getTooltipEl();

    tip.textContent = label;
    tip.style.top = `${rect.top + rect.height / 2}px`;
    tip.style.left = `${rect.right + 12}px`;
    tip.classList.add('sidebar-floating-tooltip--visible');
}

function hideTooltip() {
    _tooltipEl?.classList.remove('sidebar-floating-tooltip--visible');
}

function closeSidebarSubmenu() {
    document.querySelectorAll('.sidebar-submenu-card--open').forEach((card) => {
        card.classList.remove('sidebar-submenu-card--open');
    });
    document.querySelectorAll('[data-submenu-trigger][aria-expanded="true"]').forEach((trigger) => {
        trigger.setAttribute('aria-expanded', 'false');
    });
    _activeSubmenuTrigger = null;
}

function positionSubmenuCard(trigger, card) {
    const rect = trigger.getBoundingClientRect();
    const cardWidth = card.offsetWidth || 236;
    const cardHeight = card.offsetHeight || 180;
    const gap = 12;
    const viewportPadding = 12;

    const left = Math.min(
        rect.right + gap,
        window.innerWidth - cardWidth - viewportPadding
    );
    const top = Math.min(
        Math.max(rect.top - 8, viewportPadding),
        window.innerHeight - cardHeight - viewportPadding
    );

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
}

function openSidebarSubmenu(trigger) {
    const key = trigger.dataset.submenuTrigger;
    const card = document.getElementById(`sidebar-submenu-${key}`);
    if (!card) return;

    hideTooltip();
    closeSidebarSubmenu();

    trigger.setAttribute('aria-expanded', 'true');
    card.classList.add('sidebar-submenu-card--open');
    positionSubmenuCard(trigger, card);
    _activeSubmenuTrigger = trigger;
}

function toggleSidebarSubmenu(trigger) {
    if (_activeSubmenuTrigger === trigger) {
        closeSidebarSubmenu();
        return;
    }

    openSidebarSubmenu(trigger);
}

/**
 * Bind sidebar event listeners (call after renderSidebar is injected into DOM).
 */
export function initSidebar() {
    _submenuCleanup?.();

    // Toggle expand / collapse
    document.getElementById('sidebar-toggle')
        ?.addEventListener('click', () => contextActions.toggleSidebar());

    document.querySelectorAll('[data-submenu-trigger]').forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleSidebarSubmenu(trigger);
        });
    });

    document.querySelectorAll('[data-submenu-link]').forEach((link) => {
        link.addEventListener('click', closeSidebarSubmenu);
    });

    // Menu item tooltip
    document.querySelectorAll('.sidebar-link').forEach((link) => {
        link.addEventListener('mouseenter', showTooltip);
        link.addEventListener('mouseleave', hideTooltip);
    });

    const closeOnOutsideClick = (event) => {
        if (!event.target.closest('.sidebar-submenu-card') && !event.target.closest('[data-submenu-trigger]')) {
            closeSidebarSubmenu();
        }
    };

    const closeOnEscape = (event) => {
        if (event.key === 'Escape') {
            closeSidebarSubmenu();
        }
    };

    const repositionOnResize = () => {
        if (!_activeSubmenuTrigger) return;
        const key = _activeSubmenuTrigger.dataset.submenuTrigger;
        const card = document.getElementById(`sidebar-submenu-${key}`);
        if (card) {
            positionSubmenuCard(_activeSubmenuTrigger, card);
        }
    };

    document.addEventListener('click', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', repositionOnResize);
    window.addEventListener('scroll', repositionOnResize, true);

    _submenuCleanup = () => {
        document.removeEventListener('click', closeOnOutsideClick);
        document.removeEventListener('keydown', closeOnEscape);
        window.removeEventListener('resize', repositionOnResize);
        window.removeEventListener('scroll', repositionOnResize, true);
    };
}
