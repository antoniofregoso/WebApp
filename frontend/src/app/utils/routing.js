function encodePathSegment(segment) {
    try {
        return encodeURIComponent(decodeURIComponent(String(segment)));
    } catch {
        return encodeURIComponent(String(segment));
    }
}

function getDashboardBaseSegments() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const [root, area, subarea, model, id] = segments;

    if (root !== 'dashboard') return ['dashboard'];
    const base = ['dashboard'];
    if (area) base.push(area);

    const isSubareaRoute = subarea && (model === undefined || id !== undefined);
    if (isSubareaRoute) base.push(subarea);

    return base;
}

export function buildRecordUrl(model, id) {
    const base = getDashboardBaseSegments().map(encodePathSegment).join('/');
    return `/${base}/${encodePathSegment(model)}/${encodePathSegment(id)}`;
}
