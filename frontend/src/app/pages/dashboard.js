import { effect } from '@preact/signals';
import { appSignal } from '../store';
import { contextActions, dashboardActions } from '../store/actions';
import { renderSidebar, initSidebar, updateSidebarExpansion, MENU_ITEMS } from '../components';
import { renderTopbar, initTopbar } from '../components';
import { t } from '../../i18n';
import { renderCalendar, renderForm, renderInsights, renderKanban, renderList, initCalendar, initInsights, initList, initKanban } from '../views';
import { applyTheme, getAreaTitle } from '../utils';

import demoData from '../data/demo.json';
import demoInsights from '../data/insights.json';

// ── Track last rendered values to avoid redundant re-renders ──────────────────
let _lastLang = null;
let _lastTheme = null;
let _lastExpanded = null;
let _lastArea = null;
let _lastView = null;
let _effectCleanup = null;
let _currentSubarea = null;

// ── View renderers (dock view-switch buttons) ─────────────────────────────────
const VIEW_RENDERERS = {
    kanban: renderKanban,
    list: renderList,
    form: renderForm,
    calendar: renderCalendar,
};
const DEFAULT_VIEW = 'kanban';

// Views that need event wiring after their HTML is injected.
const VIEW_INITIALIZERS = {
    calendar: initCalendar,
    insights: initInsights,
    list: initList,
    kanban: initKanban,
};
let _viewCleanup = null;

function getView(state) {
    return state.dashboard?.view ?? DEFAULT_VIEW;
}

/** Render the content markup for the currently selected view. */
function renderView(view, area, lang) {
    const renderFn = VIEW_RENDERERS[view] ?? VIEW_RENDERERS[DEFAULT_VIEW];
    // TEMP: feed demo data to the data-driven views for testing.
    if (renderFn === renderList || renderFn === renderKanban || renderFn === renderCalendar) {
        return renderFn(demoData, lang);
    }
    return renderFn(area, lang);
}

/**
 * Insights is the default content on the dashboard home (no area) and on any
 * insights subarea — regardless of the selected dock view.
 */
function isInsightsContext(area, subarea) {
    return !area || subarea === 'insights';
}

/** Pick the content markup for the current page (insights or the dock view). */
function renderContent(area, subarea, view, lang) {
    if (isInsightsContext(area, subarea)) {
        return renderInsights(demoInsights, lang);
    }
    return renderView(view, area, lang);
}

/**
 * Wire up the active view after its markup is in the DOM. Cleans up the
 * previously active view first (e.g. stops the calendar now-line timer).
 */
function initActiveView(view, lang) {
    if (_viewCleanup) { _viewCleanup(); _viewCleanup = null; }
    const initFn = VIEW_INITIALIZERS[view];
    if (initFn) _viewCleanup = initFn(lang) || null;
}

/**
 * Bind the dock view-switch buttons and reflect the active view.
 * Call after the topbar is (re)injected into the DOM.
 */
function initViewButtons(currentView) {
    document.querySelectorAll('.topbar-view-group .topbar-tool-btn[data-view]').forEach((btn) => {
        const view = btn.dataset.view;
        btn.classList.toggle('topbar-tool-btn--active', view === currentView);
        btn.addEventListener('click', () => {
            dashboardActions.setView(view);
        });
    });
}

function getLabel(item, lang) {
    return lang === 'es' ? item.labelEs : item.labelEn;
}

function getTopbarBreadcrumb(area, subarea, lang) {
    if (!subarea) return null;

    const areaItem = MENU_ITEMS.find((item) => item.key === area);
    const subareaItem = areaItem?.items?.find((item) => item.key === subarea);

    return {
        areaLabel: areaItem ? getLabel(areaItem, lang) : area,
        areaUrl: `/dashboard/${area}`,
        subareaLabel: subareaItem ? getLabel(subareaItem, lang) : subarea,
    };
}

function shouldShowTopbarTools(area, subarea) {
    return Boolean(area) && subarea !== 'insights';
}


/**
 * Full dashboard render (sidebar + topbar + content).
 * Called on first load and whenever signal values change.
 */
function renderDashboard(lang, theme, expanded, area, subarea, view) {
    const pageTitle = area ? getAreaTitle(area, lang, MENU_ITEMS) : '';
    const breadcrumb = getTopbarBreadcrumb(area, subarea, lang);
    const showTopbarTools = shouldShowTopbarTools(area, subarea);
    const appEl = document.getElementById('app');

    appEl.innerHTML = `
    <div class="dash-layout">
        ${renderSidebar(lang, expanded, area)}
        <div class="dash-main">
            ${renderTopbar(lang, theme, pageTitle, breadcrumb, showTopbarTools)}
            ${renderContent(area, subarea, view, lang)}
        </div>
    </div>
    `;

    applyTheme(theme);

    // Listen for system theme changes when 'system' is selected
    if (theme === 'system') {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        mql.addEventListener('change', () => applyTheme('system'));
    }
}

/**
 * Patch only the components that changed (avoids full re-render flicker).
 */
function patchDashboard(lang, theme, expanded, area, view, prevLang, prevTheme, prevExpanded, prevArea, prevView) {
    const areaChanged = area !== prevArea;
    const langChanged = lang !== prevLang;
    const themeChanged = theme !== prevTheme;
    const expandedChanged = expanded !== prevExpanded;
    const viewChanged = view !== prevView;

    if (expandedChanged && !langChanged && !areaChanged) {
        updateSidebarExpansion(expanded);
    }

    // Patch sidebar (active area or lang change)
    if (areaChanged || langChanged) {
        const sidebarEl = document.getElementById('dashboard-sidebar');
        if (sidebarEl) {
            sidebarEl.outerHTML = renderSidebar(lang, expanded, area);
            // Re-bind sidebar events after DOM replacement
            initSidebar(_router);
        }
    }

    // Patch topbar (theme, lang change)
    if (themeChanged || langChanged || areaChanged) {
        const topbarEl = document.getElementById('dashboard-topbar-shell');
        const pageTitle = area ? getAreaTitle(area, lang, MENU_ITEMS) : '';
        const breadcrumb = getTopbarBreadcrumb(area, _currentSubarea, lang);
        const showTopbarTools = shouldShowTopbarTools(area, _currentSubarea);
        if (topbarEl) {
            topbarEl.outerHTML = renderTopbar(lang, theme, pageTitle, breadcrumb, showTopbarTools);
            initTopbar();
            // Re-bind the dock view-switch buttons after topbar replacement
            initViewButtons(view);
        }
    }

    // Patch content (area, lang or view change)
    if (areaChanged || langChanged || viewChanged) {
        const contentEl = document.getElementById('dashboard-content');
        if (contentEl) {
            contentEl.outerHTML = renderContent(area, _currentSubarea, view, lang);
            initActiveView(isInsightsContext(area, _currentSubarea) ? 'insights' : view, lang);
        }
        // Reflect the active view on the dock buttons (when topbar was not re-rendered)
        if (viewChanged) {
            document.querySelectorAll('.topbar-view-group .topbar-tool-btn[data-view]').forEach((btn) => {
                btn.classList.toggle('topbar-tool-btn--active', btn.dataset.view === view);
            });
        }
    }

    // Apply theme to <html>
    if (themeChanged) {
        applyTheme(theme);
        if (isInsightsContext(area, _currentSubarea)) {
            initActiveView('insights', lang);
        }
    }
}

// Store router reference for sidebar navigation
let _router = null;

/**
 * Dashboard page callback — called by CJ Router.
 * @param {object} req    — router request object
 * @param {object} router — CJ Router instance
 */
export function dashboard(req, router) {
    _router = router;
    const areaFromUrl = req.params?.area;
    const prevSubarea = _currentSubarea;
    _currentSubarea = req.params?.subarea ?? null;
    if (!MENU_ITEMS.some(item => item.key === areaFromUrl)) {
        if (areaFromUrl!=undefined) {return router.trigger404(req.pathname);}
    }
    const areaChanged = areaFromUrl !== appSignal.value.context.active_area;
    const subareaChanged = _currentSubarea !== prevSubarea;
    if (areaFromUrl && areaChanged) {
        contextActions.setActiveArea(areaFromUrl);
    }
    if (!areaFromUrl && appSignal.value.context.active_area) {
        contextActions.setActiveArea(null);
    }
    // Reset to the default view whenever the page (area or subarea) changes
    if (areaChanged || subareaChanged) {
        dashboardActions.setView(DEFAULT_VIEW);
    }

    const state = appSignal.value;
    const lang = state.context.lang;
    const theme = state.context.theme;
    const expanded = state.context.sidebar_expanded;
    const area = state.context.active_area;
    const view = getView(state);

    // ── Initial full render ───────────────────────────────────────────────────
    renderDashboard(lang, theme, expanded, area, _currentSubarea, view);
    initSidebar();
    initTopbar();
    initViewButtons(view);
    initActiveView(isInsightsContext(area, _currentSubarea) ? 'insights' : view, lang);

    // Track rendered values
    _lastLang = lang;
    _lastTheme = theme;
    _lastExpanded = expanded;
    _lastArea = area;
    _lastView = view;

    // ── Cleanup previous effect if navigating back to this page ──────────────
    if (_effectCleanup) {
        _effectCleanup();
        _effectCleanup = null;
    }

    // ── Reactive effect: re-patch on any signal change ────────────────────────
    _effectCleanup = effect(() => {
        const s = appSignal.value;
        const newLang = s.context.lang;
        const newTheme = s.context.theme;
        const newExpanded = s.context.sidebar_expanded;
        const newArea = s.context.active_area;
        const newView = getView(s);

        const changed =
            newLang !== _lastLang ||
            newTheme !== _lastTheme ||
            newExpanded !== _lastExpanded ||
            newArea !== _lastArea ||
            newView !== _lastView;

        if (!changed) return;

        patchDashboard(
            newLang, newTheme, newExpanded, newArea, newView,
            _lastLang, _lastTheme, _lastExpanded, _lastArea, _lastView
        );

        _lastLang = newLang;
        _lastTheme = newTheme;
        _lastExpanded = newExpanded;
        _lastArea = newArea;
        _lastView = newView;
    });
}
