import ApexCharts from 'apexcharts';
import { initInsightGraphics, renderInsightGraphics } from '../components/insightGraphics.js';

const PERIOD_LABELS = {
    today: { en: 'Today', es: 'Hoy' },
    monthly: { en: 'Last 30 days', es: 'Últimos 30 días' },
    weekly: { en: 'Last 7 days', es: 'Últimos 7 días' },
    yearly: { en: 'Yearly', es: 'Anual' },
    annual: { en: 'Annual', es: 'Anual' },
};

const PERIOD_OPTIONS = ['today', 'weekly', 'monthly'];

let _gauges = [];
let _graphics = [];
let _lang = 'en';
let _gaugeCharts = [];
let _graphicsCleanup = null;

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function locale(lang) {
    return lang === 'es' ? 'es-MX' : 'en-US';
}

function getLocalized(value, lang) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value[lang] ?? value.en ?? value.es ?? '';
    }
    return value ?? '';
}

function getPeriodLabel(period, lang) {
    const label = PERIOD_LABELS[period]?.[lang];
    return label ?? period ?? '';
}

function renderPeriodSelect(period, lang) {
    const selected = PERIOD_OPTIONS.includes(period) ? period : 'monthly';

    return `
    <label class="insight-period-control">
        <span class="sr-only">${lang === 'es' ? 'Periodo' : 'Period'}</span>
        <select class="insight-period-select" data-insight-period>
            ${PERIOD_OPTIONS.map((option) => `
            <option value="${option}" ${option === selected ? 'selected' : ''}>
                ${escape(getPeriodLabel(option, lang))}
            </option>`).join('')}
        </select>
    </label>`;
}

function formatKpiValue(kpi, lang) {
    const value = Number(kpi.value);
    if (!Number.isFinite(value)) return escape(kpi.value ?? '');

    if (kpi.unit === 'MXN') {
        return escape(new Intl.NumberFormat(locale(lang), {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 2,
        }).format(value));
    }

    if (kpi.unit === '%') {
        return `${escape(new Intl.NumberFormat(locale(lang), {
            maximumFractionDigits: 2,
        }).format(value))}%`;
    }

    return `${escape(new Intl.NumberFormat(locale(lang), {
        maximumFractionDigits: 2,
    }).format(value))}${kpi.unit ? ` ${escape(kpi.unit)}` : ''}`;
}

function formatNumber(value, lang) {
    return new Intl.NumberFormat(locale(lang), {
        maximumFractionDigits: 2,
    }).format(value);
}

function formatGaugeValue(gauge, lang) {
    const value = Number(gauge.value);
    if (!Number.isFinite(value)) return String(gauge.value ?? '');

    if (gauge.unit === '%') {
        return `${formatNumber(value, lang)}%`;
    }

    return `${formatNumber(value, lang)}${gauge.unit ? ` ${gauge.unit}` : ''}`;
}

function renderTrend(trend, lang) {
    if (!trend) return '';

    const normalized = String(trend).toLowerCase();
    const isDown = normalized === 'down';
    const label = lang === 'es'
        ? (isDown ? 'Baja' : 'Sube')
        : (isDown ? 'Down' : 'Up');

    return `
    <span class="insight-kpi-trend insight-kpi-trend--${isDown ? 'down' : 'up'}">
        <span aria-hidden="true">${isDown ? '↓' : '↑'}</span>
        ${escape(label)}
    </span>`;
}

function renderKpis(kpis = [], period, lang) {
    if (!Array.isArray(kpis) || kpis.length === 0) {
        return `
        <div class="insight-empty">
            ${lang === 'es' ? 'Sin KPIs' : 'No KPIs'}
        </div>`;
    }

    return `
    <section class="insight-section" aria-labelledby="insight-kpis-title">
        <h3 id="insight-kpis-title" class="sr-only">KPIs</h3>
        <div class="insight-kpi-grid">
            ${kpis.map((kpi) => `
            <article class="insight-kpi-card">
                <div class="insight-kpi-head">
                    <h4 class="insight-kpi-name">${escape(getLocalized(kpi.name, lang))}</h4>
                    ${renderTrend(kpi.trend, lang)}
                </div>
                <p class="insight-kpi-value">${formatKpiValue(kpi, lang)}</p>
            </article>`).join('')}
        </div>
    </section>`;
}

function renderGauges(gauges = [], lang) {
    if (!Array.isArray(gauges) || gauges.length === 0) return '';

    return `
    <section class="insight-section" aria-labelledby="insight-gauges-title">
        <h3 id="insight-gauges-title" class="sr-only">Gauges</h3>
        <div class="insight-gauge-grid">
            ${gauges.map((gauge, index) => `
            <article class="insight-gauge-card">
                <div class="insight-gauge-head">
                    <h4 class="insight-gauge-name">${escape(getLocalized(gauge.name, lang))}</h4>
                    <span class="insight-gauge-value">${escape(formatGaugeValue(gauge, lang))}</span>
                </div>
                <div class="insight-gauge-visual" data-insight-gauge-visual="${index}">
                    <div class="insight-gauge-needle" aria-hidden="true"></div>
                    <div class="insight-gauge-chart" data-insight-gauge="${index}"></div>
                </div>
            </article>`).join('')}
        </div>
    </section>`;
}

export function renderInsights(data = {}, lang = 'en') {
    const period = data?.period ?? '';
    _gauges = Array.isArray(data?.gauges) ? data.gauges : [];
    _graphics = Array.isArray(data?.graphics) ? data.graphics : [];
    _lang = lang;

    return `
    <main id="dashboard-content" class="dash-content" role="main" aria-label="Insights">
        <div class="insight-layout">
            <header class="insight-header">
                ${renderPeriodSelect(period, lang)}
            </header>
            ${renderKpis(data?.kpis, period, lang)}
            ${renderGauges(_gauges, lang)}
            ${renderInsightGraphics(_graphics, lang, data?.layout)}
        </div>
    </main>
    `;
}

function getCssVar(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
}

function gaugePercent(gauge) {
    const value = Number(gauge.value) || 0;
    const max = Number(gauge.max) || 100;
    return Math.max(0, Math.min(100, (value / max) * 100));
}

function thresholdPercent(gauge, key, fallback) {
    const max = Number(gauge.max) || 100;
    const value = Number(gauge.thresholds?.[key] ?? fallback);
    return Math.max(0, Math.min(100, (value / max) * 100));
}

function gaugeSegments(gauge) {
    const yellowStart = thresholdPercent(gauge, 'yellow', 60);
    const greenStart = thresholdPercent(gauge, 'green', 80);
    const red = Math.max(0, yellowStart);
    const yellow = Math.max(0, greenStart - yellowStart);
    const green = Math.max(0, 100 - greenStart);

    return [red, yellow, green];
}

function applyGaugeVisual(el, gauge) {
    const percent = gaugePercent(gauge);
    el.style.setProperty('--gauge-needle-rotation', `${-120 + (percent * 2.4)}deg`);
}

function buildGaugeOptions(gauge) {
    return {
        chart: {
            type: 'donut',
            height: 220,
            sparkline: { enabled: true },
            toolbar: { show: false },
            animations: { enabled: true },
        },
        series: gaugeSegments(gauge),
        colors: [
            getCssVar('--dash-danger', '#ef4444'),
            getCssVar('--dash-warning', '#f59e0b'),
            getCssVar('--dash-success', '#10b981'),
        ],
        plotOptions: {
            pie: {
                startAngle: -120,
                endAngle: 120,
                expandOnClick: false,
                donut: {
                    size: '76%',
                    background: 'transparent',
                    labels: { show: false },
                },
            },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        stroke: {
            width: 0,
        },
        tooltip: { enabled: false },
        states: {
            hover: { filter: { type: 'none' } },
            active: { filter: { type: 'none' } },
        },
        labels: ['Red', 'Yellow', 'Green'],
    };
}

export function initInsights(lang = 'en') {
    _lang = lang;
    _gaugeCharts.forEach((chart) => chart.destroy());
    _gaugeCharts = [];
    _graphicsCleanup?.();
    _graphicsCleanup = null;
    _graphicsCleanup = initInsightGraphics(_graphics, lang);

    document.querySelectorAll('[data-insight-gauge]').forEach((el) => {
        const index = Number(el.dataset.insightGauge);
        const gauge = _gauges[index];
        if (!gauge) return;

        try {
            const visual = el.closest('[data-insight-gauge-visual]');
            if (visual) applyGaugeVisual(visual, gauge);

            const chart = new ApexCharts(el, buildGaugeOptions(gauge));
            chart.render()?.catch?.((error) => {
                console.error('[insights] Failed to render gauge:', error);
            });
            _gaugeCharts.push(chart);
        } catch (error) {
            console.error('[insights] Failed to render gauge:', error);
        }
    });

    return () => {
        _gaugeCharts.forEach((chart) => chart.destroy());
        _gaugeCharts = [];
        _graphicsCleanup?.();
        _graphicsCleanup = null;
    };
}
