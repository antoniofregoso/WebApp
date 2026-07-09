function encodePathSegment(segment) {
    try {
        return encodeURIComponent(decodeURIComponent(String(segment)));
    } catch {
        return encodeURIComponent(String(segment));
    }
}

function getDashboardBaseSegments() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const [root, area] = segments;

    if (root !== 'dashboard') return ['dashboard'];
    const base = ['dashboard'];
    if (area) base.push(area);

    return base;
}

export function buildRecordUrl(model, uuid) {
    const base = getDashboardBaseSegments().map(encodePathSegment).join('/');
    return `/${base}/${encodePathSegment(model)}/${encodePathSegment(uuid)}`;
}
