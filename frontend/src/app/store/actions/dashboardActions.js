import { appSignal } from '../appStore';

export const dashboardActions = {

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
