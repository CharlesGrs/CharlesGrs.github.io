// SVG Diagrams for Apple Liquid Glass blog post
(function() {
    function createSvg(w, h) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        return svg;
    }

    function createRect(x, y, w, h, r, fill, stroke, strokeWidth) {
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
        if (r) rect.setAttribute('rx', r);
        rect.setAttribute('fill', fill || 'none');
        if (stroke) rect.setAttribute('stroke', stroke);
        if (strokeWidth) rect.setAttribute('stroke-width', strokeWidth);
        return rect;
    }

    function createCircle(cx, cy, r, fill) {
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', fill || '#e8b923');
        return circle;
    }

    function createText(x, y, text, className) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.setAttribute('x', x);
        el.setAttribute('y', y);
        el.setAttribute('text-anchor', 'middle');
        el.setAttribute('dominant-baseline', 'middle');
        if (className) el.setAttribute('class', className);
        el.textContent = text;
        return el;
    }

    function createArrow(x1, y1, x2, y2, color) {
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color || '#2dd4bf');
        line.setAttribute('stroke-width', '2');

        var angle = Math.atan2(y2 - y1, x2 - x1);
        var headLen = 7;
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M' + x2 + ',' + y2 +
            ' L' + (x2 - headLen * Math.cos(angle - Math.PI/6)) + ',' + (y2 - headLen * Math.sin(angle - Math.PI/6)) +
            ' L' + (x2 - headLen * Math.cos(angle + Math.PI/6)) + ',' + (y2 - headLen * Math.sin(angle + Math.PI/6)) + ' Z');
        path.setAttribute('fill', color || '#2dd4bf');

        g.appendChild(line);
        g.appendChild(path);
        return g;
    }

    window.blogSvgDiagrams = window.blogSvgDiagrams || {};

    // Bilinear Blur Optimization Diagram - Clean version
    window.blogSvgDiagrams['blur-pipeline'] = function(container, w, h) {
        var svg = createSvg(w, h);

        var centerY = h / 2;
        var texelSize = 24;
        var texelGap = 2;
        var totalWidth = 9 * texelSize + 8 * texelGap;

        // === LEFT: 9 samples ===
        var leftStart = 60;

        for (var i = 0; i < 9; i++) {
            var tx = leftStart + i * (texelSize + texelGap);
            var ty = centerY - texelSize / 2;

            var texel = createRect(tx, ty, texelSize, texelSize, 2, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.2)', 1);
            svg.appendChild(texel);

            var sample = createCircle(tx + texelSize/2, ty + texelSize/2, 4, '#e8b923');
            svg.appendChild(sample);
        }

        var label1 = createText(leftStart + totalWidth/2, centerY + 32, '9 fetches', 'diagram-label-small');
        svg.appendChild(label1);

        // === Arrow ===
        var arrowStart = leftStart + totalWidth + 25;
        var arrowEnd = arrowStart + 60;
        var arrow = createArrow(arrowStart, centerY, arrowEnd, centerY, '#2dd4bf');
        svg.appendChild(arrow);

        // === RIGHT: 5 samples ===
        var rightStart = arrowEnd + 25;

        for (var i = 0; i < 9; i++) {
            var tx = rightStart + i * (texelSize + texelGap);
            var ty = centerY - texelSize / 2;

            var texel = createRect(tx, ty, texelSize, texelSize, 2, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.2)', 1);
            svg.appendChild(texel);
        }

        // 5 sample points at optimized positions
        var samplePositions = [0.77, 2.38, 4, 5.62, 7.23];
        samplePositions.forEach(function(pos) {
            var sx = rightStart + pos * (texelSize + texelGap) + texelSize/2;
            var sample = createCircle(sx, centerY, 5, '#e8b923');
            svg.appendChild(sample);
        });

        var label2 = createText(rightStart + totalWidth/2, centerY + 32, '5 fetches', 'diagram-label-small');
        svg.appendChild(label2);

        container.appendChild(svg);
    };
})();
