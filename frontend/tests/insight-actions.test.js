import { beforeEach, describe, expect, it } from 'vitest';
import { appSignal } from '../src/app/store';
import { dashboardActions } from '../src/app/store/actions';
import { patchInsights, renderInsights } from '../src/app/views/renderInsights.js';

const initialInsights = {
    period: 'today',
    kpis: [{ id: 'revenue', value: 10, trend: 'up' }],
    gauges: [{ id: 'efficiency', value: 70, max: 100 }],
    graphics: [{ id: 'sales', type: 'line', data: [1, 2] }],
};

describe('dashboard insight actions', () => {
    beforeEach(() => {
        appSignal.value = {
            ...appSignal.value,
            insights: structuredClone(initialInsights),
        };
    });

    it('updates one KPI by id without replacing unchanged collections', () => {
        const previousInsights = appSignal.value.insights;
        const previousGauges = previousInsights.gauges;

        dashboardActions.updateKpi('revenue', { value: 25 });

        expect(appSignal.value.insights).not.toBe(previousInsights);
        expect(appSignal.value.insights.kpis[0]).toMatchObject({
            id: 'revenue',
            value: 25,
            trend: 'up',
        });
        expect(appSignal.value.insights.gauges).toBe(previousGauges);
    });

    it('supports updater functions and preserves the id', () => {
        dashboardActions.updateGauge('efficiency', (gauge) => ({
            id: 'ignored-id',
            value: gauge.value + 5,
        }));

        expect(appSignal.value.insights.gauges[0]).toMatchObject({
            id: 'efficiency',
            value: 75,
        });
    });

    it('updates the selected period', () => {
        dashboardActions.setInsightPeriod('monthly');
        expect(appSignal.value.insights.period).toBe('monthly');
    });

    it('rejects unknown ids and collections', () => {
        expect(() => dashboardActions.updateKpi('missing', { value: 1 }))
            .toThrow('Insight not found');
        expect(() => dashboardActions.updateInsight('unknown', 'sales', {}))
            .toThrow('Unknown insight collection');
    });
});

describe('differential insight rendering', () => {
    it('patches a KPI without replacing the insights container', () => {
        const previous = structuredClone(initialInsights);
        const next = {
            ...previous,
            kpis: previous.kpis.map((kpi) => ({ ...kpi, value: 42 })),
        };
        document.body.innerHTML = renderInsights(previous, 'en');
        const container = document.getElementById('dashboard-content');

        expect(patchInsights(previous, next, 'en')).toBe(true);
        expect(document.getElementById('dashboard-content')).toBe(container);
        expect(document.querySelector('[data-insight-kpi-id="revenue"] .insight-kpi-value')?.textContent)
            .toBe('42');
    });

    it('requests a full render when ids or collection structure change', () => {
        const previous = structuredClone(initialInsights);
        const next = { ...previous, kpis: [] };
        document.body.innerHTML = renderInsights(previous, 'en');

        expect(patchInsights(previous, next, 'en')).toBe(false);
    });
});
