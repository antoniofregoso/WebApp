import { icon, faChartLine, faUsers, faFolder, faGear, faBars, faCloud, faChevronLeft } from './icon.js';
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

/**
 * Render the sidebar HTML string.
 */
export function renderSidebar(lang, expanded, activeArea) {
    const appName = t('sidebar.app_name', lang);
    const menuItems = MENU_ITEMS.map((item) => {
        const label = lang === 'es' ? item.labelEs : item.labelEn;
        const isActive = item.key === activeArea;
        return `
        <li class="sidebar-item ${isActive ? 'sidebar-item--active' : ''}" data-tooltip="${label}">
            <a
                href="${item.url}"
                class="sidebar-link"
                data-area="${item.key}"
                aria-label="${label}"
                aria-current="${isActive ? 'page' : 'false'}"
            >
                <span class="sidebar-icon" aria-hidden="true">
                    ${icon(item.icon, 'sidebar-svg-icon')}
                </span>
                <span class="sidebar-label ${expanded ? '' : 'sidebar-label--hidden'}">
                    ${label}
                </span>
            </a>
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

    sidebar?.classList.toggle('sidebar--expanded', expanded);
    sidebar?.classList.toggle('sidebar--collapsed', !expanded);

    document.querySelectorAll('.sidebar-label').forEach((label) => {
        label.classList.toggle('sidebar-label--hidden', !expanded);
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

/**
 * Bind sidebar event listeners (call after renderSidebar is injected into DOM).
 */
export function initSidebar() {
    // Toggle expand / collapse
    document.getElementById('sidebar-toggle')
        ?.addEventListener('click', () => contextActions.toggleSidebar());

    // Menu item tooltip
    document.querySelectorAll('.sidebar-link').forEach((link) => {
        link.addEventListener('mouseenter', showTooltip);
        link.addEventListener('mouseleave', hideTooltip);
    });
}
