// ============================================
// BLOG SVG DIAGRAM HELPERS
// Shared helper functions for creating SVG diagrams
// ============================================

(function() {
    'use strict';

    function createSvg(w, h) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.setAttribute('width', '100%');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.maxWidth = w + 'px';
        svg.style.height = 'auto';
        return svg;
    }

    function createGroup(transform) {
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        if (transform) g.setAttribute('transform', transform);
        return g;
    }

    function createCircle(cx, cy, r, fill, stroke) {
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', fill || 'none');
        circle.setAttribute('stroke', stroke || 'none');
        return circle;
    }

    function createEllipse(cx, cy, rx, ry, fill, stroke) {
        var ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', cx);
        ellipse.setAttribute('cy', cy);
        ellipse.setAttribute('rx', rx);
        ellipse.setAttribute('ry', ry);
        ellipse.setAttribute('fill', fill || 'none');
        ellipse.setAttribute('stroke', stroke || 'none');
        return ellipse;
    }

    function createRect(x, y, w, h, r, fill, stroke, strokeWidth) {
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
        rect.setAttribute('rx', r || 0);
        rect.setAttribute('fill', fill || 'none');
        rect.setAttribute('stroke', stroke || 'none');
        if (strokeWidth) rect.setAttribute('stroke-width', strokeWidth);
        return rect;
    }

    function createLine(x1, y1, x2, y2, stroke, strokeWidth) {
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', stroke || '#fff');
        line.setAttribute('stroke-width', strokeWidth || 1);
        return line;
    }

    function createPath(d, fill, stroke, strokeWidth) {
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', fill || 'none');
        path.setAttribute('stroke', stroke || 'none');
        if (strokeWidth) path.setAttribute('stroke-width', strokeWidth);
        return path;
    }

    function createText(x, y, text, className) {
        var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('dominant-baseline', 'middle');
        if (className) textEl.setAttribute('class', className);
        textEl.textContent = text;
        return textEl;
    }

    function createArrow(x1, y1, x2, y2, color) {
        var g = createGroup();
        var line = createLine(x1, y1, x2, y2, color, 2);

        var angle = Math.atan2(y2 - y1, x2 - x1);
        var headLen = 8;
        var head = createPath(
            'M' + x2 + ',' + y2 +
            ' L' + (x2 - headLen * Math.cos(angle - Math.PI/6)) + ',' + (y2 - headLen * Math.sin(angle - Math.PI/6)) +
            ' L' + (x2 - headLen * Math.cos(angle + Math.PI/6)) + ',' + (y2 - headLen * Math.sin(angle + Math.PI/6)) + ' Z',
            color, 'none'
        );

        g.appendChild(line);
        g.appendChild(head);
        return g;
    }

    function createDoubleArrow(x1, y1, x2, y2, color) {
        var g = createGroup();
        g.appendChild(createArrow(x1, y1, x2, y2, color));
        g.appendChild(createArrow(x2, y2, x1, y1, color));
        return g;
    }

    function createDefs() {
        return document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    }

    function createLinearGradient(id, x1, y1, x2, y2, stops) {
        var grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', id);
        grad.setAttribute('x1', x1);
        grad.setAttribute('y1', y1);
        grad.setAttribute('x2', x2);
        grad.setAttribute('y2', y2);
        stops.forEach(function(stop) {
            var s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            s.setAttribute('offset', stop.offset);
            s.setAttribute('stop-color', stop.color);
            if (stop.opacity !== undefined) s.setAttribute('stop-opacity', stop.opacity);
            grad.appendChild(s);
        });
        return grad;
    }

    function createRadialGradient(id, cx, cy, r, stops) {
        var grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        grad.setAttribute('id', id);
        grad.setAttribute('cx', cx);
        grad.setAttribute('cy', cy);
        grad.setAttribute('r', r);
        stops.forEach(function(stop) {
            var s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            s.setAttribute('offset', stop.offset);
            s.setAttribute('stop-color', stop.color);
            if (stop.opacity !== undefined) s.setAttribute('stop-opacity', stop.opacity);
            grad.appendChild(s);
        });
        return grad;
    }

    // Expose helpers globally
    window.svgHelpers = {
        createSvg: createSvg,
        createGroup: createGroup,
        createCircle: createCircle,
        createEllipse: createEllipse,
        createRect: createRect,
        createLine: createLine,
        createPath: createPath,
        createText: createText,
        createArrow: createArrow,
        createDoubleArrow: createDoubleArrow,
        createDefs: createDefs,
        createLinearGradient: createLinearGradient,
        createRadialGradient: createRadialGradient
    };

    // Initialize empty diagram registry (posts will register their diagrams)
    window.blogSvgDiagrams = window.blogSvgDiagrams || {};

})();
