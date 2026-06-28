import { effect } from '@preact/signals';
import { appSignal } from '../store';
import { contextActions, dashboardActions } from '../store/actions';
import { renderSidebar, initSidebar, updateSidebarExpansion, MENU_ITEMS } from '../components';
import { renderTopbar, initTopbar } from '../components';
import { t } from '../../i18n';
import { renderCalendar, renderForm, renderInsights, renderKanban, renderList, initCalendar, initForm, initInsights, initList, initKanban } from '../views';
import { applyTheme, getAreaTitle, normalizePagination, paginateData } from '../utils';

import demoData from '../data/demo.json';
import demoInsights from '../data/insights.json';

// ── Track last rendered values to avoid redundant re-renders ──────────────────
let _lastLang = null;
let _lastTheme = null;
let _lastExpanded = null;
let _lastArea = null;
let _lastView = null;
let _lastPage = null;
let _lastPerPage = null;
let _lastTotal = null;
let _lastRecordRoute = false;
let _lastRecordModel = null;
let _lastRecordUuid = null;
let _effectCleanup = null;
let _currentSubarea = null;
let _currentRecordModel = null;
let _currentRecordUuid = null;

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
    form: initForm,
};
let _viewCleanup = null;

function getView(state) {
    return state.dashboard?.view ?? DEFAULT_VIEW;
}

function getEffectiveView(view) {
    return _currentRecordModel && _currentRecordUuid != null ? 'form' : view;
}

function hasRecordRoute() {
    return _currentRecordModel && _currentRecordUuid != null;
}

function getPagination(state = appSignal.value) {
    return normalizePagination(state.dashboard, demoData.records.length);
}

/** Render the content markup for the currently selected view. */
function renderView(view, area, lang, pagination) {
    const renderFn = VIEW_RENDERERS[view] ?? VIEW_RENDERERS[DEFAULT_VIEW];
    const paginatedData = paginateData(demoData, pagination);
    // TEMP: feed demo data to the data-driven views for testing.
    if (renderFn === renderList || renderFn === renderKanban || renderFn === renderCalendar) {
        return renderFn(paginatedData, lang);
    }
    if (renderFn === renderForm) {
        const commercialAreas = new Set(['crm', 'sales', 'sale', 'ventas']);
        return renderFn(hasRecordRoute() ? demoData : paginatedData, lang, {
            recordModel: _currentRecordModel,
            recordUuid: _currentRecordUuid,
            showWhatsapp: commercialAreas.has(area),
        });
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
function renderContent(area, subarea, view, lang, pagination = getPagination()) {
    if (isInsightsContext(area, subarea)) {
        return renderInsights(demoInsights, lang);
    }
    return renderView(view, area, lang, pagination);
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
function navigateToUrl(url) {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

function initViewButtons(currentView) {
    document.querySelectorAll('.topbar-view-group .topbar-tool-btn[data-view]').forEach((btn) => {
        const view = btn.dataset.view;
        btn.classList.toggle('topbar-tool-btn--active', view === currentView);
        btn.addEventListener('click', () => {
            if (hasRecordRoute()) {
                const area = appSignal.value.context.active_area;
                dashboardActions.setView(view);
                navigateToUrl(`/dashboard/${area}`);
            } else {
                dashboardActions.setView(view);
            }
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
    const pagination = getPagination();
    const appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.innerHTML = `
    <div class="dash-layout">
        ${renderSidebar(lang, expanded, area)}
        <div class="dash-main">
            ${renderTopbar(lang, theme, pageTitle, breadcrumb, showTopbarTools, pagination)}
            ${renderContent(area, subarea, view, lang, pagination)}
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
    const pagination = getPagination();
    const paginationChanged = pagination.page !== _lastPage
        || pagination.perPage !== _lastPerPage
        || pagination.total !== _lastTotal;
    const recordRouteChanged =
        hasRecordRoute() !== _lastRecordRoute ||
        _currentRecordModel !== _lastRecordModel ||
        _currentRecordUuid !== _lastRecordUuid;

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
    if (themeChanged || langChanged || areaChanged || recordRouteChanged || paginationChanged) {
        const topbarEl = document.getElementById('dashboard-topbar-shell');
        const pageTitle = area ? getAreaTitle(area, lang, MENU_ITEMS) : '';
        const breadcrumb = getTopbarBreadcrumb(area, _currentSubarea, lang);
        const showTopbarTools = shouldShowTopbarTools(area, _currentSubarea);
        if (topbarEl) {
            topbarEl.outerHTML = renderTopbar(
                lang,
                theme,
                pageTitle,
                breadcrumb,
                showTopbarTools,
                pagination,
            );
            initTopbar();
            // Re-bind the dock view-switch buttons after topbar replacement
            initViewButtons(view);
        }
    }

    // Patch content (area, lang, view, or selected record change)
    if (areaChanged || langChanged || viewChanged || recordRouteChanged || paginationChanged) {
        const contentEl = document.getElementById('dashboard-content');
        if (contentEl) {
            contentEl.outerHTML = renderContent(area, _currentSubarea, view, lang, pagination);
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
    const hadRecordRoute = _currentRecordModel && _currentRecordUuid != null;
    _currentSubarea = req.params?.subarea ?? null;
    _currentRecordModel = req.params?.model ?? null;
    _currentRecordUuid = req.params?.uuid ?? null;
    const isRecordRoute = hasRecordRoute();
    if (!MENU_ITEMS.some(item => item.key === areaFromUrl)) {
        if (areaFromUrl!=undefined) {return router.trigger404(req.pathname);}
    }
    const areaChanged = areaFromUrl !== appSignal.value.context.active_area;
    const subareaChanged = _currentSubarea !== prevSubarea;
    dashboardActions.setTotal(demoData.records.length);
    if (areaFromUrl && areaChanged) {
        contextActions.setActiveArea(areaFromUrl);
    }
    if (!areaFromUrl && appSignal.value.context.active_area) {
        contextActions.setActiveArea(null);
    }
    // Open record URLs directly in form view; otherwise reset when leaving a page.
    if (isRecordRoute) {
        dashboardActions.setView('form');
    } else if (areaChanged || subareaChanged) {
        dashboardActions.setView(DEFAULT_VIEW);
    } else if (hadRecordRoute && getView(appSignal.value) === 'form') {
        // Leaving a record route via browser back — reset to default view.
        // If the user clicked a view button, the signal is already set to the target
        // view (not 'form'), so this branch is skipped and their choice is respected.
        dashboardActions.setView(DEFAULT_VIEW);
    }

    const state = appSignal.value;
    const lang = state.context.lang;
    const theme = state.context.theme;
    const expanded = state.context.sidebar_expanded;
    const area = state.context.active_area;
    const view = getEffectiveView(getView(state));

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
    const pagination = getPagination(state);
    _lastPage = pagination.page;
    _lastPerPage = pagination.perPage;
    _lastTotal = pagination.total;
    _lastRecordRoute = isRecordRoute;
    _lastRecordModel = _currentRecordModel;
    _lastRecordUuid = _currentRecordUuid;

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
        const newView = getEffectiveView(getView(s));
        const newPagination = getPagination(s);

        const changed =
            newLang !== _lastLang ||
            newTheme !== _lastTheme ||
            newExpanded !== _lastExpanded ||
            newArea !== _lastArea ||
            newView !== _lastView ||
            newPagination.page !== _lastPage ||
            newPagination.perPage !== _lastPerPage ||
            newPagination.total !== _lastTotal ||
            hasRecordRoute() !== _lastRecordRoute ||
            _currentRecordModel !== _lastRecordModel ||
            _currentRecordUuid !== _lastRecordUuid;

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
        _lastPage = newPagination.page;
        _lastPerPage = newPagination.perPage;
        _lastTotal = newPagination.total;
        _lastRecordRoute = hasRecordRoute();
        _lastRecordModel = _currentRecordModel;
        _lastRecordUuid = _currentRecordUuid;
    });
}
