function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeAttribute(value) {
    return escape(value).replace(/"/g, '&quot;');
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

function getNodeTitle(node, lang) {
    if (lang === 'en') return node.title_en ?? node.title ?? node.id;
    return node.title ?? node.title_en ?? node.id;
}

function formatValue(value, lang) {
    return new Intl.NumberFormat(locale(lang), {
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

export function renderInsightGraphics(graphics = [], lang = 'en', layout = {}) {
    if (!Array.isArray(graphics) || graphics.length === 0) return '';

    const cols = Math.max(1, parseInt(layout?.graphics) || 1);

    return `
    <section class="insight-section" aria-labelledby="insight-graphics-title">
        <h3 id="insight-graphics-title" class="sr-only">Graphics</h3>
        <div class="insight-graphic-grid" style="--graphic-cols:${cols}" data-graphic-cols="${cols}">
            ${graphics.map((graphic, index) => `
            <article class="insight-graphic-card">
                <div class="insight-graphic-head">
                    <h4 class="insight-graphic-title">${escape(getLocalized(graphic.title, lang))}</h4>
                    <button
                        class="insight-graphic-expand"
                        type="button"
                        aria-label="${lang === 'es' ? 'Expandir a pantalla completa' : 'Expand to fullscreen'}"
                        data-label-expand="${lang === 'es' ? 'Expandir a pantalla completa' : 'Expand to fullscreen'}"
                        data-label-compress="${lang === 'es' ? 'Salir de pantalla completa' : 'Exit fullscreen'}"
                    >
                        <svg class="icon-expand" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <svg class="icon-compress" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M6 1v5H1M10 1v5h5M6 15v-5H1M10 15v-5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div
                    class="insight-graphic-chart"
                    data-insight-graphic="${index}"
                    data-insight-graphic-type="${escape(graphic.type ?? '')}"
                >${graphic.type === 'sankey' ? renderFallbackSankey(graphic, lang) : ''}</div>
            </article>`).join('')}
        </div>
    </section>`;
}

function getSankeyData(graphic, lang) {
    const data = graphic?.data ?? {};
    const nodes = (data.nodes ?? []).map((node) => ({
        ...node,
        title: getNodeTitle(node, lang),
    }));
    const edges = (data.edges ?? []).map((edge) => ({
        ...edge,
        type: edge.type ?? graphic.type ?? 'flow',
    }));

    return {
        nodes,
        edges,
        options: data.options ?? {},
    };
}

function getFallbackLayers(data) {
    const orderedLayers = data.options?.order;
    const nodeIds = new Set(data.nodes.map((node) => node.id));

    if (Array.isArray(orderedLayers) && orderedLayers.length > 0) {
        const layers = orderedLayers
            .map((layer) => layer.flat().filter((id) => nodeIds.has(id)))
            .filter((layer) => layer.length > 0);
        const orderedIds = new Set(layers.flat());
        const missingIds = data.nodes
            .map((node) => node.id)
            .filter((id) => !orderedIds.has(id));

        if (missingIds.length > 0) layers.push(missingIds);
        return layers;
    }

    const sourceIds = new Set(data.edges.map((edge) => edge.source));
    const targetIds = new Set(data.edges.map((edge) => edge.target));
    const sources = data.nodes.map((node) => node.id).filter((id) => !targetIds.has(id));
    const targets = data.nodes.map((node) => node.id).filter((id) => !sourceIds.has(id));
    const middle = data.nodes
        .map((node) => node.id)
        .filter((id) => !sources.includes(id) && !targets.includes(id));

    return [sources, middle, targets].filter((layer) => layer.length > 0);
}

function truncateText(text, maxChars) {
    if (!text || text.length <= maxChars) return text;
    return text.slice(0, Math.max(2, maxChars - 1)) + '…';
}

function renderFallbackSankey(graphic, lang) {
    const data = getSankeyData(graphic, lang);
    const width = 1180;
    const height = graphic.height ?? 460;
    const nodeWidth = 16;
    const nodeHeight = 34;
    const layers = getFallbackLayers(data);
    const maxValue = Math.max(...data.edges.map((edge) => Number(edge.value) || 0), 1);
    const positions = new Map();
    const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));

    const layerXPositions = layers.map((_, i) =>
        layers.length === 1
            ? (width / 2) - (nodeWidth / 2)
            : 24 + ((width - 64) * i / (layers.length - 1))
    );

    const nodeLayerIndex = new Map();
    layers.forEach((layer, i) => layer.forEach((id) => nodeLayerIndex.set(id, i)));

    layers.forEach((layer, layerIndex) => {
        const x = layerXPositions[layerIndex];
        const gap = Math.max(18, (height - 60 - (layer.length * nodeHeight)) / Math.max(layer.length - 1, 1));

        layer.forEach((id, index) => {
            const totalHeight = (layer.length * nodeHeight) + ((layer.length - 1) * gap);
            const y = Math.max(24, ((height - totalHeight) / 2) + (index * (nodeHeight + gap)));
            positions.set(id, { x, y });
        });
    });

    const CHAR_WIDTH = 7;
    const LABEL_PADDING = 8;

    const layerMaxChars = layerXPositions.map((x, i) => {
        const isLeft = x < width / 2;
        let availableWidth;
        if (isLeft) {
            const nextX = i + 1 < layerXPositions.length ? layerXPositions[i + 1] : width - 4;
            availableWidth = nextX - (x + nodeWidth + LABEL_PADDING) - 4;
        } else {
            const prevX = i - 1 >= 0 ? layerXPositions[i - 1] + nodeWidth : 4;
            availableWidth = (x - LABEL_PADDING) - prevX - 4;
        }
        return Math.max(6, Math.floor(availableWidth / CHAR_WIDTH));
    });

    const edges = data.edges.map((edge, index) => {
        const source = positions.get(edge.source);
        const target = positions.get(edge.target);
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!source || !target) return '';

        const strokeWidth = Math.max(3, Math.min(28, ((Number(edge.value) || 0) / maxValue) * 28));
        const y1 = source.y + (nodeHeight / 2);
        const y2 = target.y + (nodeHeight / 2);
        const x1 = source.x + nodeWidth;
        const x2 = target.x;
        const curve = Math.max(80, (x2 - x1) * 0.45);

        return `
            <path
                class="insight-sankey-edge"
                tabindex="0"
                d="M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}"
                fill="none"
                stroke="var(--dash-accent)"
                stroke-width="${strokeWidth.toFixed(2)}"
                stroke-linecap="round"
                opacity="${0.16 + (index % 4) * 0.08}"
                data-source="${escapeAttribute(edge.source)}"
                data-target="${escapeAttribute(edge.target)}"
                data-source-title="${escapeAttribute(sourceNode?.title ?? edge.source)}"
                data-target-title="${escapeAttribute(targetNode?.title ?? edge.target)}"
                data-value="${escapeAttribute(formatValue(edge.value, lang))}"
            />`;
    }).join('');

    const nodes = data.nodes.map((node, index) => {
        const position = positions.get(node.id);
        if (!position) return '';
        const labelX = position.x < width / 2 ? position.x + nodeWidth + 8 : position.x - 8;
        const anchor = position.x < width / 2 ? 'start' : 'end';
        const fullTitle = nodeMap.get(node.id)?.title ?? node.id;
        const layerIdx = nodeLayerIndex.get(node.id) ?? 0;
        const displayTitle = truncateText(fullTitle, layerMaxChars[layerIdx]);

        return `
            <g
                class="insight-sankey-node"
                tabindex="0"
                data-node="${escapeAttribute(node.id)}"
                data-node-title="${escapeAttribute(fullTitle)}"
            >
                <rect
                    x="${position.x}"
                    y="${position.y}"
                    width="${nodeWidth}"
                    height="${nodeHeight}"
                    rx="4"
                    fill="${node.color ?? `hsl(${(index * 41) % 360} 65% 54%)`}"
                    stroke="var(--dash-border)"
                />
                <text
                    x="${labelX}"
                    y="${position.y + 21}"
                    text-anchor="${anchor}"
                    fill="var(--dash-text)"
                    font-size="12"
                    font-weight="650"
                >${escape(displayTitle)}</text>
            </g>`;
    }).join('');

    return `
        <svg class="insight-sankey-fallback" viewBox="0 0 ${width} ${height}" role="img">
            <g>${edges}</g>
            <g>${nodes}</g>
        </svg>`;
}

function renderSankey(el, graphic, lang) {
    el.innerHTML = renderFallbackSankey(graphic, lang);
    bindInteractiveSankey(el, lang);
    return null;
}

function getOrCreateTooltip() {
    let tooltip = document.querySelector('[data-insight-sankey-tooltip]');
    if (tooltip) return tooltip;

    tooltip = document.createElement('div');
    tooltip.className = 'insight-sankey-tooltip';
    tooltip.dataset.insightSankeyTooltip = '';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);
    return tooltip;
}

function moveTooltip(tooltip, event) {
    const offset = 14;
    const rect = event.currentTarget?.getBoundingClientRect?.();
    const clientX = Number.isFinite(event.clientX) ? event.clientX : (rect?.right ?? offset);
    const clientY = Number.isFinite(event.clientY) ? event.clientY : (rect?.top ?? offset);
    const x = Math.min(clientX + offset, window.innerWidth - tooltip.offsetWidth - offset);
    const y = Math.min(clientY + offset, window.innerHeight - tooltip.offsetHeight - offset);
    tooltip.style.left = `${Math.max(offset, x)}px`;
    tooltip.style.top = `${Math.max(offset, y)}px`;
}

function nodeTotals(svg, nodeId, lang) {
    let incoming = 0;
    let outgoing = 0;

    svg.querySelectorAll('.insight-sankey-edge').forEach((edge) => {
        const value = Number(String(edge.dataset.value ?? '').replace(/[^\d.-]/g, '')) || 0;
        if (edge.dataset.target === nodeId) incoming += value;
        if (edge.dataset.source === nodeId) outgoing += value;
    });

    return {
        incoming: formatValue(incoming, lang),
        outgoing: formatValue(outgoing, lang),
    };
}

function showTooltip(content, event) {
    const tooltip = getOrCreateTooltip();
    tooltip.innerHTML = content;
    tooltip.classList.add('insight-sankey-tooltip--visible');
    moveTooltip(tooltip, event);
}

function hideTooltip() {
    document
        .querySelector('[data-insight-sankey-tooltip]')
        ?.classList.remove('insight-sankey-tooltip--visible');
}

function setActiveNode(svg, nodeId) {
    svg.classList.add('insight-sankey-fallback--active');
    svg.querySelectorAll('.insight-sankey-node').forEach((node) => {
        node.classList.toggle('insight-sankey-node--active', node.dataset.node === nodeId);
    });
    svg.querySelectorAll('.insight-sankey-edge').forEach((edge) => {
        edge.classList.toggle(
            'insight-sankey-edge--active',
            edge.dataset.source === nodeId || edge.dataset.target === nodeId,
        );
    });
}

function setActiveEdge(svg, edge) {
    const sourceId = edge.dataset.source;
    const targetId = edge.dataset.target;
    svg.classList.add('insight-sankey-fallback--active');
    svg.querySelectorAll('.insight-sankey-edge').forEach((item) => {
        item.classList.toggle('insight-sankey-edge--active', item === edge);
    });
    svg.querySelectorAll('.insight-sankey-node').forEach((node) => {
        node.classList.toggle(
            'insight-sankey-node--active',
            node.dataset.node === sourceId || node.dataset.node === targetId,
        );
    });
}

function clearActive(svg) {
    svg.classList.remove('insight-sankey-fallback--active');
    svg.querySelectorAll('.insight-sankey-node--active, .insight-sankey-edge--active').forEach((el) => {
        el.classList.remove('insight-sankey-node--active', 'insight-sankey-edge--active');
    });
    hideTooltip();
}

function bindInteractiveSankey(el, lang) {
    const svg = el.querySelector('.insight-sankey-fallback');
    if (!svg || svg.dataset.interactive === 'true') return;
    svg.dataset.interactive = 'true';

    svg.querySelectorAll('.insight-sankey-edge').forEach((edge) => {
        const show = (event) => {
            setActiveEdge(svg, edge);
            showTooltip(`
                <strong>${escape(edge.dataset.sourceTitle ?? '')} &rarr; ${escape(edge.dataset.targetTitle ?? '')}</strong>
                <span>${escape(edge.dataset.value ?? '')}</span>
            `, event);
        };

        edge.addEventListener('mouseenter', show);
        edge.addEventListener('mousemove', (event) => moveTooltip(getOrCreateTooltip(), event));
        edge.addEventListener('mouseleave', () => clearActive(svg));
        edge.addEventListener('focus', show);
        edge.addEventListener('blur', () => clearActive(svg));
    });

    svg.querySelectorAll('.insight-sankey-node').forEach((node) => {
        const show = (event) => {
            const totals = nodeTotals(svg, node.dataset.node, lang);
            setActiveNode(svg, node.dataset.node);
            showTooltip(`
                <strong>${escape(node.dataset.nodeTitle ?? '')}</strong>
                <span>${lang === 'es' ? 'Entrada' : 'In'}: ${escape(totals.incoming)}</span>
                <span>${lang === 'es' ? 'Salida' : 'Out'}: ${escape(totals.outgoing)}</span>
            `, event);
        };

        node.addEventListener('mouseenter', show);
        node.addEventListener('mousemove', (event) => moveTooltip(getOrCreateTooltip(), event));
        node.addEventListener('mouseleave', () => clearActive(svg));
        node.addEventListener('focus', show);
        node.addEventListener('blur', () => clearActive(svg));
    });
}

function bindExpandButtons() {
    document.querySelectorAll('.insight-graphic-expand').forEach((btn) => {
        if (btn.dataset.expandBound) return;
        btn.dataset.expandBound = 'true';

        const card = btn.closest('.insight-graphic-card');
        if (!card || !document.fullscreenEnabled) {
            btn.hidden = true;
            return;
        }

        btn.addEventListener('click', () => {
            if (document.fullscreenElement === card) {
                document.exitFullscreen();
            } else {
                card.requestFullscreen();
            }
        });

        card.addEventListener('fullscreenchange', () => {
            const isFullscreen = document.fullscreenElement === card;
            btn.setAttribute('aria-label', isFullscreen
                ? (btn.dataset.labelCompress ?? 'Exit fullscreen')
                : (btn.dataset.labelExpand ?? 'Expand to fullscreen')
            );

            const tooltip = document.querySelector('[data-insight-sankey-tooltip]');
            if (tooltip) {
                if (isFullscreen) {
                    card.appendChild(tooltip);
                } else {
                    document.body.appendChild(tooltip);
                }
            }
        });
    });
}

export function initInsightGraphics(graphics = [], lang = 'en') {
    const instances = [];

    bindExpandButtons();

    document.querySelectorAll('[data-insight-graphic]').forEach((el) => {
        const index = Number(el.dataset.insightGraphic);
        const graphic = graphics[index];
        if (!graphic) return;

        try {
            if (graphic.type === 'sankey') {
                const instance = renderSankey(el, graphic, lang);
                if (instance) instances.push(instance);
            } else {
                el.innerHTML = `<div class="insight-empty">${escape(graphic.type ?? 'Unsupported chart')}</div>`;
            }
        } catch (error) {
            console.error('[insights] Failed to render graphic:', error);
            if (graphic.type === 'sankey') {
                el.innerHTML = renderFallbackSankey(graphic, lang);
            } else {
                el.innerHTML = `<div class="insight-empty">${escape(graphic.type ?? 'Chart')} error</div>`;
            }
        }
    });

    return () => {
        instances.forEach((instance) => {
            instance.destroy?.();
            instance.graph?.clear?.();
        });
    };
}
