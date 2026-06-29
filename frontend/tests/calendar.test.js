import { beforeAll, describe, expect, it, vi } from 'vitest';

let renderCalendar;
let toCalendarEvents;

beforeAll(async () => {
    const values = new Map();
    vi.stubGlobal('localStorage', {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear(),
    });
    ({ renderCalendar, toCalendarEvents } = await import('../src/app/views/renderCalendar.js'));
});

const schema = [
    { name: 'subject', type: 'many2one', calendar: { title: true } },
    { name: 'begins_at', type: 'datetime', calendar: { startDate: true } },
    { name: 'finishes_at', type: 'datetime', calendar: { endDate: true } },
];

function calendarData(records) {
    return {
        model: { name: 'appointment', label: { en: 'Appointments' }, schema },
        records,
    };
}

describe('schema-driven calendar', () => {
    it('maps start, end and title from the fields configured in the schema', () => {
        const [event] = toCalendarEvents(calendarData([{
            uuid: 'event-1',
            subject: { uuid: 'contact-1', name: 'Ada Lovelace' },
            begins_at: '2026-06-29T10:15:00',
            finishes_at: '2026-06-29T12:00:00',
            start_date: '1999-01-01T00:00:00',
            name: 'This field is not the title',
        }]));

        expect(event.title).toBe('Ada Lovelace');
        expect(event.startsAt).toEqual(new Date('2026-06-29T10:15:00'));
        expect(event.endsAt).toEqual(new Date('2026-06-29T12:00:00'));
    });

    it('uses a 30 minute duration when no valid end date is provided', () => {
        const [event] = toCalendarEvents(calendarData([{
            uuid: 'event-1',
            subject: 'Planning',
            begins_at: '2026-06-29T10:15:00',
        }]));

        expect(event.endsAt.getTime() - event.startsAt.getTime()).toBe(30 * 60_000);
    });

    it('renders the start time before the configured title', () => {
        const today = new Date();
        const localDate = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0'),
        ].join('-');
        const html = renderCalendar(calendarData([{
            uuid: 'event-1',
            subject: 'Planning',
            begins_at: `${localDate}T10:15:00`,
        }]));

        const timePosition = html.indexOf('<span class="cal-event-time">');
        const titlePosition = html.indexOf('<span class="cal-event-title">Planning</span>');
        expect(timePosition).toBeGreaterThan(-1);
        expect(titlePosition).toBeGreaterThan(timePosition);
    });

    it('does not render records without a valid configured start date', () => {
        const data = calendarData([
            { uuid: 'missing', subject: 'Missing date' },
            { uuid: 'invalid', subject: 'Invalid date', begins_at: 'not-a-date' },
        ]);

        expect(toCalendarEvents(data)).toEqual([]);
        expect(renderCalendar(data)).not.toContain('data-event-id=');
    });
});
