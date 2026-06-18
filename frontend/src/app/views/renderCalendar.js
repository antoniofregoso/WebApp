import { icon, faChevronLeft, faChevronRight } from '../components/icon.js';
import { t } from '../../i18n/translations.js';
import { buildRecordUrl } from '../utils';
import { renderViewHeader } from '../components';
import { initCreateModal, renderCreateModal } from './renderCreateModal.js';

/* ════════════════════════════════════════════════════════════════════════════
 * Calendar view.
 *  · Uses records as events anchored on `start_date` and `end_date`.
 *  · Opens on today by default.
 *  · Today is marked with a red circle on its day number.
 *  · A green "now" line tracks the current time (week / day views) and moves
 *    with the minutes.
 *  · Switch between month / week / day and navigate back / forward.
 * ══════════════════════════════════════════════════════════════════════════ */

const HOUR_HEIGHT = 48;          // px per hour row in week / day grids
const MIN_EVENT_MINUTES = 30;

const STATUS_PALETTE = {
    zinc: { bg: '#f4f4f5', border: '#71717a', text: '#3f3f46' },
    red: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },
    blue: { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8' },
    purple: { bg: '#f3e8ff', border: '#9333ea', text: '#6b21a8' },
    green: { bg: '#d1fae5', border: '#059669', text: '#047857' },
    orange: { bg: '#ffedd5', border: '#ea580c', text: '#c2410c' },
};
const STATUS_FALLBACK = STATUS_PALETTE.zinc;

// ── Local view state (lives for the lifetime of the calendar view) ────────────
const state = {
    view: 'month',   // 'month' | 'week' | 'day'
    cursor: null,    // reference Date being displayed
    lang: 'en',
    events: [],
};

let _nowTimer = null;
let _clickHandler = null;
let _changeHandler = null;

function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
    return escape(value)
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function locale(lang) {
    return lang === 'es' ? 'es-ES' : 'en-US';
}

function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

/** Monday-first weekday index (0 = Mon … 6 = Sun). */
function mondayIndex(d) {
    return (d.getDay() + 6) % 7;
}

/** Monday that starts the week containing `d`. */
function startOfWeek(d) {
    const s = startOfDay(d);
    s.setDate(s.getDate() - mondayIndex(s));
    return s;
}

function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function endOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

function parseCalendarDate(value) {
    if (!value) return null;
    const normalized = String(value)
        .trim()
        .replace(' ', 'T')
        .replace(/^(\d{4}-\d{2}-\d{2}):(\d{2}:\d{2}(?::\d{2})?)$/, '$1T$2');
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

function eventOverlapsDay(event, day) {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    return event.startsAt < dayEnd && event.endsAt > dayStart;
}

function getEventSlice(event, day) {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const startsAt = new Date(Math.max(event.startsAt.getTime(), dayStart.getTime()));
    const endsAt = new Date(Math.min(event.endsAt.getTime(), dayEnd.getTime()));
    return { startsAt, endsAt };
}

function styleForStatus(color) {
    const palette = STATUS_PALETTE[color] ?? STATUS_FALLBACK;
    return `--cal-event-bg:${palette.bg};--cal-event-border:${palette.border};--cal-event-text:${palette.text};`;
}

function fmt(d, opts, lang) {
    return d.toLocaleDateString(locale(lang), opts);
}

/** Monday-first short weekday names, capitalized. */
function weekdayNames(lang) {
    const ref = startOfWeek(new Date(2024, 0, 1)); // a Monday
    return Array.from({ length: 7 }, (_, i) => {
        const name = fmt(addDays(ref, i), { weekday: 'short' }, lang);
        return name.charAt(0).toUpperCase() + name.slice(1);
    });
}

function toCalendarEvents(data = {}, lang = 'en') {
    const modelName = data?.model?.name ?? '';
    const statuses = data?.model?.status ?? [];
    return (data?.records ?? [])
        .map((record) => {
            const startsAt = parseCalendarDate(record.start_date);
            if (!startsAt || Number.isNaN(startsAt.getTime())) return null;
            const parsedEnd = parseCalendarDate(record.end_date);
            const endsAt = parsedEnd && parsedEnd > startsAt
                ? parsedEnd
                : new Date(startsAt.getTime() + MIN_EVENT_MINUTES * 60_000);
            const status = statuses.find((option) => option.value === record.status);

            return {
                id: record.id,
                title: record.name ?? String(record.id ?? ''),
                customer: record.customer?.name ?? '',
                startsAt,
                endsAt,
                status: record.status,
                statusLabel: status?.[lang] ?? record.status ?? '',
                color: status?.color,
                href: modelName && record.id != null ? buildRecordUrl(modelName, record.id) : '',
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.startsAt - b.startsAt);
}

function eventsForDay(day) {
    return state.events.filter((event) => eventOverlapsDay(event, day));
}

function formatEventTime(date, lang) {
    return date.toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' });
}

function formatEventRange(event, lang) {
    return `${formatEventTime(event.startsAt, lang)}-${formatEventTime(event.endsAt, lang)}`;
}

// ── Title for the toolbar, per view ───────────────────────────────────────────
function buildTitle(lang) {
    const { view, cursor } = state;
    if (view === 'month') {
        const s = fmt(cursor, { month: 'long', year: 'numeric' }, lang);
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    if (view === 'day') {
        const s = fmt(cursor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, lang);
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    // week — show the range
    const start = startOfWeek(cursor);
    const end = addDays(start, 6);
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    const left = fmt(start, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' }, lang);
    const right = fmt(end, { day: 'numeric', month: 'short', year: 'numeric' }, lang);
    return `${left} – ${right}`;
}

// ── Markup builders ───────────────────────────────────────────────────────────
function monthOptions(lang, selected) {
    return Array.from({ length: 12 }, (_, m) => {
        const name = new Date(2024, m, 1).toLocaleDateString(locale(lang), { month: 'long' });
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        return `<option value="${m}" ${m === selected ? 'selected' : ''}>${label}</option>`;
    }).join('');
}

function yearOptions(selected) {
    const base = new Date().getFullYear();
    const min = Math.min(base - 10, selected);
    const max = Math.max(base + 10, selected);
    let opts = '';
    for (let y = min; y <= max; y++) {
        opts += `<option value="${y}" ${y === selected ? 'selected' : ''}>${y}</option>`;
    }
    return opts;
}

function buildToolbar(lang) {
    const segBtn = (v) => `
        <button class="cal-seg-btn ${state.view === v ? 'cal-seg-btn--active' : ''}"
                data-cal-view="${v}" aria-pressed="${state.view === v}">
            ${t(`calendar.${v}`, lang)}
        </button>`;

    return `
    <div class="cal-toolbar">
        <div class="cal-toolbar-left">
            <button class="cal-today-btn" data-cal-nav="today">${t('calendar.today', lang)}</button>
            <div class="cal-nav-group">
                <button class="cal-nav-btn" data-cal-nav="prev" aria-label="${t('calendar.prev', lang)}">
                    ${icon(faChevronLeft, 'cal-nav-icon')}
                </button>
                <button class="cal-nav-btn" data-cal-nav="next" aria-label="${t('calendar.next', lang)}">
                    ${icon(faChevronRight, 'cal-nav-icon')}
                </button>
            </div>
            <h2 class="cal-title">${buildTitle(lang)}</h2>
        </div>
        <div class="cal-toolbar-right">
            <div class="cal-period">
                <select class="cal-select" data-cal-month aria-label="${t('calendar.month', lang)}">
                    ${monthOptions(lang, state.cursor.getMonth())}
                </select>
                <select class="cal-select" data-cal-year aria-label="${t('calendar.year', lang)}">
                    ${yearOptions(state.cursor.getFullYear())}
                </select>
            </div>
            <span class="cal-sep" aria-hidden="true"></span>
            <div class="cal-seg" role="group" aria-label="${t('topbar.view_type', lang)}">
                ${segBtn('month')}${segBtn('week')}${segBtn('day')}
            </div>
        </div>
    </div>`;
}

function renderMonthEvents(day, lang) {
    const events = eventsForDay(day);
    if (events.length === 0) return '';

    const visible = events.slice(0, 3).map((event) => {
        const slice = getEventSlice(event, day);
        return `
        <a href="${event.href}" class="cal-month-event" style="${styleForStatus(event.color)}"
           title="${escapeAttr(`${event.title} ${formatEventRange(event, lang)}`)}">
            <span class="cal-event-time">${escape(formatEventTime(slice.startsAt, lang))}</span>
            <span class="cal-event-title">${escape(event.title)}</span>
        </a>`;
    }).join('');
    const hidden = events.length - 3;

    return `
    <div class="cal-month-events">
        ${visible}
        ${hidden > 0 ? `<span class="cal-month-more">+${hidden}</span>` : ''}
    </div>`;
}

function renderTimedEvents(day, lang) {
    return eventsForDay(day).map((event) => {
        const slice = getEventSlice(event, day);
        const minutes = slice.startsAt.getHours() * 60 + slice.startsAt.getMinutes();
        const durationMinutes = Math.max(
            MIN_EVENT_MINUTES,
            Math.round((slice.endsAt - slice.startsAt) / 60_000),
        );
        const top = (minutes / 60) * HOUR_HEIGHT;
        const height = (durationMinutes / 60) * HOUR_HEIGHT;
        return `
        <a href="${event.href}" class="cal-time-event" style="top:${top}px;height:${height}px;${styleForStatus(event.color)}">
            <span class="cal-time-event-hour">${escape(formatEventTime(slice.startsAt, lang))}</span>
            <span class="cal-time-event-title">${escape(event.title)}</span>
            ${event.customer ? `<span class="cal-time-event-subtitle">${escape(event.customer)}</span>` : ''}
            ${event.statusLabel ? `<span class="cal-time-event-status">${escape(event.statusLabel)}</span>` : ''}
        </a>`;
    }).join('');
}

function buildMonth(lang) {
    const today = new Date();
    const { cursor } = state;
    const monthFirst = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(monthFirst);

    const head = weekdayNames(lang)
        .map((w) => `<div class="cal-month-dow">${w}</div>`)
        .join('');

    let cells = '';
    for (let i = 0; i < 42; i++) {
        const day = addDays(gridStart, i);
        const outside = day.getMonth() !== cursor.getMonth();
        const isToday = isSameDay(day, today);
        cells += `
        <div class="cal-month-cell ${outside ? 'cal-month-cell--muted' : ''}"
             data-cal-day="${day.getFullYear()}-${day.getMonth()}-${day.getDate()}">
            <span class="cal-daynum ${isToday ? 'cal-daynum--today' : ''}">${day.getDate()}</span>
            ${renderMonthEvents(day, lang)}
        </div>`;
    }

    return `
    <div class="cal-month">
        <div class="cal-month-head">${head}</div>
        <div class="cal-month-grid">${cells}</div>
    </div>`;
}

/** Hour gutter + day columns shared by week and day views. */
function buildTimeGrid(days, lang) {
    const today = new Date();

    // Hour labels (gutter) + horizontal hour lines per day column.
    let gutter = '';
    let hourLines = '';
    for (let h = 0; h < 24; h++) {
        const label = h === 0
            ? ''
            : new Date(2024, 0, 1, h).toLocaleTimeString(locale(lang), { hour: 'numeric' });
        gutter += `<div class="cal-hour-label" style="height:${HOUR_HEIGHT}px">${label}</div>`;
        hourLines += `<div class="cal-hour-line" style="height:${HOUR_HEIGHT}px"></div>`;
    }

    const colHead = days.map((d) => {
        const isToday = isSameDay(d, today);
        const dow = fmt(d, { weekday: 'short' }, lang);
        return `
        <div class="cal-col-head ${isToday ? 'cal-col-head--today' : ''}">
            <span class="cal-col-dow">${dow.charAt(0).toUpperCase() + dow.slice(1)}</span>
            <span class="cal-daynum ${isToday ? 'cal-daynum--today' : ''}">${d.getDate()}</span>
        </div>`;
    }).join('');

    const cols = days.map((d) => {
        const isToday = isSameDay(d, today);
        const nowLine = isToday
            ? `<div class="cal-nowline" data-cal-nowline><span class="cal-nowdot"></span></div>`
            : '';
        return `
        <div class="cal-day-col ${isToday ? 'cal-day-col--today' : ''}">
            ${hourLines}
            ${nowLine}
            ${renderTimedEvents(d, lang)}
        </div>`;
    }).join('');

    return `
    <div class="cal-time" style="--cal-cols:${days.length}">
        <div class="cal-time-head">
            <div class="cal-corner"></div>
            ${colHead}
        </div>
        <div class="cal-time-body">
            <div class="cal-gutter">${gutter}</div>
            <div class="cal-cols">${cols}</div>
        </div>
    </div>`;
}

function buildWeek(lang) {
    const start = startOfWeek(state.cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return buildTimeGrid(days, lang);
}

function buildDay(lang) {
    return buildTimeGrid([startOfDay(state.cursor)], lang);
}

function buildBody(lang) {
    if (state.view === 'week') return buildWeek(lang);
    if (state.view === 'day') return buildDay(lang);
    return buildMonth(lang);
}

function buildInner(lang) {
    return buildToolbar(lang) + buildBody(lang);
}

// ── Now-line positioning (moves with the minutes) ─────────────────────────────
function positionNowLine() {
    const now = new Date();
    const top = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;
    document.querySelectorAll('[data-cal-nowline]').forEach((el) => {
        el.style.top = `${top}px`;
    });
}

function afterRender() {
    positionNowLine();
    // Bring the current time into view on the scrollable content area.
    if (state.view !== 'month') {
        const nowEl = document.querySelector('[data-cal-nowline]');
        if (nowEl) nowEl.scrollIntoView({ block: 'center' });
    }
}

// ── Re-render the calendar interior in place (keeps the delegated listener) ────
function rerender() {
    const root = document.getElementById('cal-root');
    if (!root) return;
    root.innerHTML = buildInner(state.lang);
    afterRender();
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigate(dir) {
    const step = dir === 'today' ? 0 : (dir === 'prev' ? -1 : 1);
    if (dir === 'today') {
        state.cursor = startOfDay(new Date());
    } else if (state.view === 'month') {
        state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() + step, 1);
    } else if (state.view === 'week') {
        state.cursor = addDays(state.cursor, step * 7);
    } else {
        state.cursor = addDays(state.cursor, step);
    }
    rerender();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render the calendar shell. Called by the dashboard each time the calendar
 * view is opened — resets to today + month view.
 */
export function renderCalendar(data = {}, lang = 'en') {
    const title = data?.model?.label?.[lang] ?? '';
    state.lang = lang;
    state.events = toCalendarEvents(data, lang);
    state.view = 'month';
    state.cursor = startOfDay(new Date());

    return `
    <main id="dashboard-content" class="dash-content dash-content--calendar" role="main" aria-label="Calendar">
        ${renderViewHeader({ title, count: state.events.length, lang, className: 'cal-page-header' })}
        <div id="cal-root" class="cal">
            ${buildInner(lang)}
        </div>
        ${renderCreateModal(data, lang)}
    </main>`;
}

/**
 * Bind calendar interactions and start the now-line timer.
 * @returns {() => void} cleanup function (stop timer + remove listeners)
 */
export function initCalendar(lang = 'en') {
    state.lang = lang;
    const root = document.getElementById('cal-root');
    const destroyCreateModal = initCreateModal(document, lang);
    if (!root) return destroyCreateModal;

    _clickHandler = (event) => {
        const nav = event.target.closest('[data-cal-nav]');
        if (nav) { navigate(nav.dataset.calNav); return; }

        const viewBtn = event.target.closest('[data-cal-view]');
        if (viewBtn) {
            state.view = viewBtn.dataset.calView;
            rerender();
            return;
        }

        const dayCell = event.target.closest('[data-cal-day]');
        if (dayCell) {
            if (event.target.closest('a')) return;
            const [y, m, d] = dayCell.dataset.calDay.split('-').map(Number);
            state.cursor = new Date(y, m, d);
            state.view = 'day';
            rerender();
        }
    };
    root.addEventListener('click', _clickHandler);

    // Month / year dropdowns — jump straight to a period.
    _changeHandler = (event) => {
        if (!event.target.closest('[data-cal-month], [data-cal-year]')) return;
        const month = Number(document.querySelector('[data-cal-month]').value);
        const year = Number(document.querySelector('[data-cal-year]').value);
        const lastDay = new Date(year, month + 1, 0).getDate();
        const day = Math.min(state.cursor.getDate(), lastDay);
        state.cursor = new Date(year, month, day);
        rerender();
    };
    root.addEventListener('change', _changeHandler);

    // Update the now-line every minute so it tracks the current time.
    _nowTimer = setInterval(positionNowLine, 60_000);
    afterRender();

    return () => {
        if (_nowTimer) { clearInterval(_nowTimer); _nowTimer = null; }
        if (root) {
            if (_clickHandler) root.removeEventListener('click', _clickHandler);
            if (_changeHandler) root.removeEventListener('change', _changeHandler);
        }
        destroyCreateModal();
        _clickHandler = null;
        _changeHandler = null;
    };
}
