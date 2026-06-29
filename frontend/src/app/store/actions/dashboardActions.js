import { appSignal } from '../appStore';

const INSIGHT_COLLECTIONS = new Set(['kpis', 'gauges', 'graphics']);

function updateInsightCollection(collection, id, patch) {
    if (!INSIGHT_COLLECTIONS.has(collection)) {
        throw new Error(`Unknown insight collection: ${collection}`);
    }
    if (!id) throw new Error('An insight id is required');

    const state = appSignal.value;
    const insights = state.insights ?? {};
    const items = Array.isArray(insights[collection]) ? insights[collection] : [];
    let found = false;
    const nextItems = items.map((item) => {
        if (item.id !== id) return item;
        found = true;
        const changes = typeof patch === 'function' ? patch(item) : patch;
        return { ...item, ...changes, id };
    });

    if (!found) throw new Error(`Insight not found: ${collection}.${id}`);

    appSignal.value = {
        ...state,
        insights: { ...insights, [collection]: nextItems },
    };
}

export const dashboardActions = {

    setInsights(insights) {
        appSignal.value = { ...appSignal.value, insights };
    },

    setInsightPeriod(period) {
        appSignal.value = {
            ...appSignal.value,
            insights: { ...appSignal.value.insights, period },
        };
    },

    updateInsight(collection, id, patch) {
        updateInsightCollection(collection, id, patch);
    },

    updateKpi(id, patch) {
        updateInsightCollection('kpis', id, patch);
    },

    updateGauge(id, patch) {
        updateInsightCollection('gauges', id, patch);
    },

    updateGraphic(id, patch) {
        updateInsightCollection('graphics', id, patch);
    },

    setView(view) {
        appSignal.value = {
            ...appSignal.value,
            dashboard: {
                ...appSignal.value.dashboard,
                view,
                page: 1,
            }
        };
    },

    setPage(page) {
        const dashboard = appSignal.value.dashboard ?? {};
        const perPage = Math.max(1, Number(dashboard.per_page) || 20);
        const total = Math.max(0, Number(dashboard.total) || 0);
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const nextPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
        if (nextPage === dashboard.page) return;
        appSignal.value = {
            ...appSignal.value,
            dashboard: { ...dashboard, page: nextPage },
        };
    },

    previousPage() {
        dashboardActions.setPage((appSignal.value.dashboard?.page ?? 1) - 1);
    },

    nextPage() {
        dashboardActions.setPage((appSignal.value.dashboard?.page ?? 1) + 1);
    },

    setTotal(total) {
        const dashboard = appSignal.value.dashboard ?? {};
        const safeTotal = Math.max(0, Number(total) || 0);
        const perPage = Math.max(1, Number(dashboard.per_page) || 20);
        const totalPages = Math.max(1, Math.ceil(safeTotal / perPage));
        const page = Math.min(Math.max(1, Number(dashboard.page) || 1), totalPages);
        if (dashboard.total === safeTotal && dashboard.page === page) return;
        appSignal.value = {
            ...appSignal.value,
            dashboard: { ...dashboard, total: safeTotal, page },
        };
    },

}
