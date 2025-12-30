// ============================================
// BLOG SVG DIAGRAM GENERATORS
// Animated technical diagrams for blog posts
// ============================================

(function() {
    'use strict';

    // SVG Helper functions
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

    // ============================================
    // DIAGRAM DEFINITIONS
    // ============================================

    var svgDiagrams = {
        // Standard vs Anamorphic Bloom comparison
        'bloom-comparison': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left side: Standard bloom
            var leftGroup = createGroup('translate(80, 100)');

            var standardGlow = createCircle(0, 0, 40, 'url(#standardGlowGrad)', 'none');
            standardGlow.innerHTML = '<animate attributeName="r" values="35;45;35" dur="2s" repeatCount="indefinite"/>';

            var standardCore = createCircle(0, 0, 15, '#fff', 'none');
            leftGroup.appendChild(standardGlow);
            leftGroup.appendChild(standardCore);

            var standardLabel = createText(0, 70, 'Standard Bloom', 'diagram-label');
            leftGroup.appendChild(standardLabel);

            // Right side: Anamorphic bloom
            var rightGroup = createGroup('translate(350, 100)');

            var anamorphicGlow = createEllipse(0, 0, 120, 25, 'url(#anamorphicGlowGrad)', 'none');
            anamorphicGlow.innerHTML = '<animate attributeName="rx" values="100;140;100" dur="2s" repeatCount="indefinite"/>' +
                '<animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>';

            var anamorphicCore = createCircle(0, 0, 12, '#fff', 'none');
            rightGroup.appendChild(anamorphicGlow);
            rightGroup.appendChild(anamorphicCore);

            for (var i = 0; i < 5; i++) {
                var streak = createLine(-150 + i * 20, 0, 150 - i * 20, 0, 'rgba(45, 212, 191, ' + (0.3 - i * 0.05) + ')', 2 - i * 0.3);
                streak.innerHTML = '<animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" begin="' + (i * 0.1) + 's" repeatCount="indefinite"/>';
                rightGroup.appendChild(streak);
            }

            var anamorphicLabel = createText(0, 70, 'Anamorphic Bloom', 'diagram-label');
            rightGroup.appendChild(anamorphicLabel);

            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML =
                '<radialGradient id="standardGlowGrad">' +
                    '<stop offset="0%" stop-color="#2dd4bf" stop-opacity="1"/>' +
                    '<stop offset="100%" stop-color="#2dd4bf" stop-opacity="0"/>' +
                '</radialGradient>' +
                '<radialGradient id="anamorphicGlowGrad" cx="50%" cy="50%" rx="50%" ry="50%">' +
                    '<stop offset="0%" stop-color="#e8b923" stop-opacity="1"/>' +
                    '<stop offset="60%" stop-color="#e8b923" stop-opacity="0.4"/>' +
                    '<stop offset="100%" stop-color="#e8b923" stop-opacity="0"/>' +
                '</radialGradient>';
            svg.appendChild(defs);

            var divider = createLine(215, 30, 215, 170, 'rgba(255,255,255,0.1)', 1);
            var vsText = createText(215, 105, 'VS', 'diagram-label-small');

            svg.appendChild(leftGroup);
            svg.appendChild(rightGroup);
            svg.appendChild(divider);
            svg.appendChild(vsText);

            container.appendChild(svg);
        },

        // Pipeline flow diagram
        'pipeline-flow': function(container, w, h) {
            var svg = createSvg(w, h);
            var stages = ['Scene', 'Threshold', 'Downsample', 'H-Blur', 'V-Blur', 'Upsample', 'Composite'];
            var stageWidth = 85;
            var startX = 30;

            stages.forEach(function(stage, i) {
                var x = startX + i * (stageWidth + 15);
                var y = 80;

                var rect = createRect(x, y, stageWidth, 50, 8, 'rgba(45, 212, 191, 0.1)', 'rgba(45, 212, 191, 0.5)', 1);
                rect.innerHTML = '<animate attributeName="fill" values="rgba(45,212,191,0.1);rgba(45,212,191,0.3);rgba(45,212,191,0.1)" dur="3.5s" begin="' + (i * 0.5) + 's" repeatCount="indefinite"/>';
                svg.appendChild(rect);

                var label = createText(x + stageWidth/2, y + 30, stage, 'diagram-label-small');
                svg.appendChild(label);

                if (i < stages.length - 1) {
                    var arrowX = x + stageWidth + 3;
                    var arrow = createPath('M' + arrowX + ',105 L' + (arrowX + 10) + ',105', 'none', 'rgba(232, 185, 35, 0.6)', 2);
                    arrow.setAttribute('marker-end', 'url(#arrowhead)');
                    svg.appendChild(arrow);
                }
            });

            var resLabels = ['Full', 'Full', '1/2', '1/2', '1/2', 'Full', 'Full'];
            resLabels.forEach(function(res, i) {
                var x = startX + i * (stageWidth + 15) + stageWidth/2;
                var resLabel = createText(x, 155, res + ' res', 'diagram-label-tiny');
                resLabel.setAttribute('fill', 'rgba(255,255,255,0.4)');
                svg.appendChild(resLabel);
            });

            var title = createText(w/2, 35, 'Multi-Pass Bloom Pipeline', 'diagram-title');
            svg.appendChild(title);

            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = '<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">' +
                '<polygon points="0 0, 10 3.5, 0 7" fill="rgba(232, 185, 35, 0.6)"/>' +
            '</marker>';
            svg.appendChild(defs);

            container.appendChild(svg);
        },

        // Threshold response curve
        'threshold-curve': function(container, w, h) {
            var svg = createSvg(w, h);

            var axisColor = 'rgba(255,255,255,0.3)';
            svg.appendChild(createLine(60, 180, 450, 180, axisColor, 1));
            svg.appendChild(createLine(60, 180, 60, 30, axisColor, 1));

            svg.appendChild(createText(250, 210, 'Input Luminance', 'diagram-label-small'));
            var yLabel = createText(25, 105, 'Output', 'diagram-label-small');
            yLabel.setAttribute('transform', 'rotate(-90, 25, 105)');
            svg.appendChild(yLabel);

            var hardPath = 'M60,180 L200,180 L200,40 L450,40';
            var hardLine = createPath(hardPath, 'none', 'rgba(255, 100, 100, 0.5)', 2);
            hardLine.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(hardLine);

            var softPath = 'M60,180 Q150,180 200,140 T280,50 L450,40';
            var softLine = createPath(softPath, 'none', '#2dd4bf', 2.5);
            softLine.setAttribute('stroke-dasharray', '500');
            softLine.setAttribute('stroke-dashoffset', '500');
            softLine.innerHTML = '<animate attributeName="stroke-dashoffset" from="500" to="0" dur="2s" fill="freeze" begin="0.5s"/>';
            svg.appendChild(softLine);

            svg.appendChild(createLine(200, 180, 200, 30, 'rgba(232, 185, 35, 0.3)', 1));
            svg.appendChild(createText(200, 195, 'Threshold', 'diagram-label-tiny'));

            var kneeRect = createRect(150, 30, 100, 150, 4, 'rgba(232, 185, 35, 0.05)', 'rgba(232, 185, 35, 0.2)', 1);
            kneeRect.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(kneeRect);
            svg.appendChild(createText(200, 20, 'Soft Knee Region', 'diagram-label-tiny'));

            svg.appendChild(createLine(320, 165, 350, 165, 'rgba(255, 100, 100, 0.5)', 2));
            svg.appendChild(createText(390, 168, 'Hard cutoff', 'diagram-label-tiny'));
            svg.appendChild(createLine(320, 185, 350, 185, '#2dd4bf', 2.5));
            svg.appendChild(createText(390, 188, 'Soft knee', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        // Asymmetric kernel visualization
        'kernel-asymmetry': function(container, w, h) {
            var svg = createSvg(w, h);

            var leftX = 120;
            var leftY = 125;

            svg.appendChild(createText(leftX, 30, 'Standard Kernel', 'diagram-label'));

            for (var r = 50; r > 0; r -= 10) {
                var opacity = 0.15 + (50 - r) / 50 * 0.6;
                var circle = createCircle(leftX, leftY, r, 'rgba(45, 212, 191, ' + opacity + ')', 'none');
                svg.appendChild(circle);
            }

            var rightX = 420;
            var rightY = 125;

            svg.appendChild(createText(rightX, 30, 'Anamorphic Kernel', 'diagram-label'));

            for (var r2 = 50; r2 > 0; r2 -= 10) {
                var opacity2 = 0.15 + (50 - r2) / 50 * 0.6;
                var ellipse = createEllipse(rightX, rightY, r2 * 2.5, r2 * 0.4, 'rgba(232, 185, 35, ' + opacity2 + ')', 'none');
                svg.appendChild(ellipse);
            }

            svg.appendChild(createDoubleArrow(leftX - 55, leftY, leftX + 55, leftY, '#2dd4bf'));
            svg.appendChild(createDoubleArrow(leftX, leftY - 55, leftX, leftY + 55, '#2dd4bf'));
            svg.appendChild(createText(leftX, leftY + 85, '1:1 ratio', 'diagram-label-tiny'));

            svg.appendChild(createDoubleArrow(rightX - 130, rightY, rightX + 130, rightY, '#e8b923'));
            svg.appendChild(createDoubleArrow(rightX, rightY - 25, rightX, rightY + 25, '#e8b923'));
            svg.appendChild(createText(rightX, rightY + 85, '4:1 ratio', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        // Gaussian weights bar chart
        'gaussian-weights': function(container, w, h) {
            var svg = createSvg(w, h);

            var weights = [1.0, 0.96, 0.88, 0.77, 0.64, 0.51, 0.38, 0.27, 0.18, 0.11, 0.06, 0.03, 0.01];
            var barWidth = 35;
            var maxHeight = 120;
            var startX = 60;
            var baseY = 170;

            weights.forEach(function(wt, i) {
                var x = startX + i * (barWidth + 5);
                var barHeight = wt * maxHeight;
                var y = baseY - barHeight;

                var bar = createRect(x, y, barWidth, barHeight, 3, 'url(#barGrad)', 'rgba(45, 212, 191, 0.5)', 1);
                bar.innerHTML = '<animate attributeName="height" from="0" to="' + barHeight + '" dur="0.5s" begin="' + (i * 0.05) + 's" fill="freeze"/>' +
                    '<animate attributeName="y" from="' + baseY + '" to="' + y + '" dur="0.5s" begin="' + (i * 0.05) + 's" fill="freeze"/>';
                svg.appendChild(bar);

                var tapLabel = createText(x + barWidth/2, baseY + 15, i === 0 ? 'C' : (i > 0 ? '\u00B1' + i : ''), 'diagram-label-tiny');
                svg.appendChild(tapLabel);
            });

            svg.appendChild(createLine(50, baseY, 550, baseY, 'rgba(255,255,255,0.3)', 1));

            svg.appendChild(createText(300, 25, 'Gaussian Weight Distribution (25-tap kernel)', 'diagram-label'));
            svg.appendChild(createText(300, baseY + 35, 'Tap offset from center', 'diagram-label-small'));

            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = '<linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">' +
                '<stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.8"/>' +
                '<stop offset="100%" stop-color="#2dd4bf" stop-opacity="0.3"/>' +
            '</linearGradient>';
            svg.appendChild(defs);

            container.appendChild(svg);
        },

        // 13-tap downsample pattern
        'downsample-pattern': function(container, w, h) {
            var svg = createSvg(w, h);

            var centerX = 200;
            var centerY = 140;
            var gridSize = 40;

            for (var gx = -2; gx <= 2; gx++) {
                for (var gy = -2; gy <= 2; gy++) {
                    var rect = createRect(centerX + gx * gridSize - 18, centerY + gy * gridSize - 18, 36, 36, 2, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.1)', 1);
                    svg.appendChild(rect);
                }
            }

            var samples = [
                {x: -1, y: -1, label: 'a', weight: 0.0625},
                {x: 0, y: -1, label: 'b', weight: 0.0625},
                {x: 1, y: -1, label: 'c', weight: 0.0625},
                {x: -0.5, y: -0.5, label: 'd', weight: 0.125},
                {x: 0.5, y: -0.5, label: 'e', weight: 0.125},
                {x: -1, y: 0, label: 'f', weight: 0.0625},
                {x: 0, y: 0, label: 'g', weight: 0.125},
                {x: 1, y: 0, label: 'h', weight: 0.0625},
                {x: -0.5, y: 0.5, label: 'i', weight: 0.125},
                {x: 0.5, y: 0.5, label: 'j', weight: 0.125},
                {x: -1, y: 1, label: 'k', weight: 0.0625},
                {x: 0, y: 1, label: 'l', weight: 0.0625},
                {x: 1, y: 1, label: 'm', weight: 0.0625}
            ];

            samples.forEach(function(s, i) {
                var px = centerX + s.x * gridSize;
                var py = centerY + s.y * gridSize;
                var radius = 6 + s.weight * 40;
                var color = s.label === 'g' ? '#e8b923' : '#2dd4bf';

                var circle = createCircle(px, py, radius, color, 'none');
                circle.setAttribute('opacity', 0.5 + s.weight * 2);
                circle.innerHTML = '<animate attributeName="r" values="' + radius + ';' + (radius + 3) + ';' + radius + '" dur="2s" begin="' + (i * 0.1) + 's" repeatCount="indefinite"/>';
                svg.appendChild(circle);

                var label = createText(px, py + 4, s.label, 'diagram-label-tiny');
                label.setAttribute('fill', '#fff');
                svg.appendChild(label);
            });

            svg.appendChild(createText(340, 60, 'Weight Legend:', 'diagram-label-small'));
            svg.appendChild(createCircle(340, 90, 12, '#e8b923', 'none'));
            svg.appendChild(createText(360, 95, '0.125 (center)', 'diagram-label-tiny'));
            svg.appendChild(createCircle(340, 120, 10, '#2dd4bf', 'none'));
            svg.appendChild(createText(360, 125, '0.125 (inner)', 'diagram-label-tiny'));
            svg.appendChild(createCircle(340, 150, 6, '#2dd4bf', 'none'));
            svg.appendChild(createText(360, 155, '0.0625 (outer)', 'diagram-label-tiny'));

            svg.appendChild(createText(200, 25, '13-Tap Karis Downsample Pattern', 'diagram-label'));

            container.appendChild(svg);
        },

        // Upsample accumulation
        'upsample-accumulation': function(container, w, h) {
            var svg = createSvg(w, h);

            var mips = [
                {label: 'Mip 4', size: 30, x: 80},
                {label: 'Mip 3', size: 45, x: 180},
                {label: 'Mip 2', size: 65, x: 300},
                {label: 'Mip 1', size: 90, x: 440},
                {label: 'Full', size: 120, x: 600}
            ];

            var centerY = 100;

            mips.forEach(function(mip, i) {
                var rect = createRect(mip.x - mip.size/2, centerY - mip.size/2, mip.size, mip.size, 4,
                    'rgba(45, 212, 191, ' + (0.15 + i * 0.1) + ')',
                    'rgba(45, 212, 191, 0.5)', 1);
                svg.appendChild(rect);

                svg.appendChild(createText(mip.x, centerY + mip.size/2 + 20, mip.label, 'diagram-label-tiny'));

                if (i < mips.length - 1) {
                    var nextMip = mips[i + 1];
                    var arrowStart = mip.x + mip.size/2 + 5;
                    var arrowEnd = nextMip.x - nextMip.size/2 - 15;

                    var arrow = createPath('M' + arrowStart + ',' + centerY + ' L' + arrowEnd + ',' + centerY, 'none', '#e8b923', 2);
                    arrow.setAttribute('marker-end', 'url(#arrowhead2)');
                    arrow.setAttribute('stroke-dasharray', '60');
                    arrow.setAttribute('stroke-dashoffset', '60');
                    arrow.innerHTML = '<animate attributeName="stroke-dashoffset" from="60" to="0" dur="0.5s" begin="' + (i * 0.3 + 0.5) + 's" fill="freeze"/>';
                    svg.appendChild(arrow);

                    var plusX = (arrowStart + arrowEnd) / 2;
                    svg.appendChild(createText(plusX, centerY - 15, '+', 'diagram-label'));
                }
            });

            svg.appendChild(createText(350, 25, 'Progressive Upsample with Additive Blending', 'diagram-label'));

            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = '<marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">' +
                '<polygon points="0 0, 10 3.5, 0 7" fill="#e8b923"/>' +
            '</marker>';
            svg.appendChild(defs);

            container.appendChild(svg);
        },

        // Complete pipeline diagram
        'complete-pipeline': function(container, w, h) {
            var svg = createSvg(w, h);

            var sceneBox = createRect(20, 130, 80, 60, 6, 'rgba(100, 100, 255, 0.2)', 'rgba(100, 100, 255, 0.6)', 2);
            svg.appendChild(sceneBox);
            svg.appendChild(createText(60, 165, 'Scene', 'diagram-label-small'));

            var threshBox = createRect(130, 130, 70, 60, 6, 'rgba(232, 185, 35, 0.2)', 'rgba(232, 185, 35, 0.6)', 2);
            svg.appendChild(threshBox);
            svg.appendChild(createText(165, 165, 'Thresh', 'diagram-label-small'));

            var dsY = 50;
            var dsBoxes = [{x: 230, w: 50}, {x: 290, w: 40}, {x: 340, w: 30}, {x: 380, w: 20}];
            dsBoxes.forEach(function(ds) {
                var box = createRect(ds.x, dsY + 50 - ds.w/2, ds.w, ds.w, 4, 'rgba(45, 212, 191, 0.2)', 'rgba(45, 212, 191, 0.5)', 1);
                svg.appendChild(box);
            });
            svg.appendChild(createText(310, 25, 'Downsample + Blur', 'diagram-label-tiny'));

            var usY = 210;
            dsBoxes.slice().reverse().forEach(function(ds) {
                var box = createRect(ds.x, usY + 50 - ds.w/2, ds.w, ds.w, 4, 'rgba(45, 212, 191, 0.2)', 'rgba(45, 212, 191, 0.5)', 1);
                svg.appendChild(box);
            });
            svg.appendChild(createText(310, 295, 'Upsample + Accumulate', 'diagram-label-tiny'));

            var compBox = createRect(450, 130, 80, 60, 6, 'rgba(255, 100, 255, 0.2)', 'rgba(255, 100, 255, 0.6)', 2);
            svg.appendChild(compBox);
            svg.appendChild(createText(490, 165, 'Composite', 'diagram-label-small'));

            var outBox = createRect(560, 130, 80, 60, 6, 'rgba(100, 255, 100, 0.2)', 'rgba(100, 255, 100, 0.6)', 2);
            svg.appendChild(outBox);
            svg.appendChild(createText(600, 165, 'Output', 'diagram-label-small'));

            svg.appendChild(createArrow(100, 160, 125, 160, '#e8b923'));
            svg.appendChild(createArrow(200, 160, 225, 90, '#e8b923'));
            svg.appendChild(createArrow(400, 90, 400, 230, '#2dd4bf'));
            svg.appendChild(createArrow(225, 250, 445, 175, '#2dd4bf'));
            svg.appendChild(createArrow(530, 160, 555, 160, '#e8b923'));

            var bypass = createPath('M60,190 L60,270 L450,270 L450,195', 'none', 'rgba(255,255,255,0.3)', 1);
            bypass.setAttribute('stroke-dasharray', '4,4');
            bypass.setAttribute('marker-end', 'url(#arrowhead3)');
            svg.appendChild(bypass);
            svg.appendChild(createText(250, 285, 'Original scene bypass', 'diagram-label-tiny'));

            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = '<marker id="arrowhead3" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">' +
                '<polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.3)"/>' +
            '</marker>';
            svg.appendChild(defs);

            container.appendChild(svg);
        },

        // ============================================
        // SCREEN-SPACE ATMOSPHERIC SCATTERING DIAGRAMS
        // ============================================

        'volumetric-overview': function(container, w, h) {
            var svg = createSvg(w, h);

            var leftGroup = createGroup('translate(170, 110)');

            var camera = createRect(-100, -15, 30, 30, 4, 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.5)', 1);
            leftGroup.appendChild(camera);
            leftGroup.appendChild(createText(-85, 5, 'Cam', 'diagram-label-tiny'));

            for (var r = 0; r < 5; r++) {
                var angle = (r - 2) * 0.15;
                var rayEndX = 80;
                var rayEndY = angle * 100;
                var ray = createLine(-65, 0, rayEndX, rayEndY, 'rgba(45, 212, 191, 0.3)', 1);
                leftGroup.appendChild(ray);

                for (var s = 0; s < 6; s++) {
                    var t = (s + 1) / 7;
                    var px = -65 + t * (rayEndX + 65);
                    var py = t * rayEndY;
                    var sampleDot = createCircle(px, py, 3, '#2dd4bf', 'none');
                    sampleDot.innerHTML = '<animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="' + (s * 0.1 + r * 0.05) + 's" repeatCount="indefinite"/>';
                    leftGroup.appendChild(sampleDot);
                }
            }

            var light = createCircle(80, 0, 15, '#e8b923', 'none');
            light.innerHTML = '<animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite"/>';
            leftGroup.appendChild(light);

            svg.appendChild(leftGroup);
            svg.appendChild(createText(170, 30, 'Ray Marching', 'diagram-label'));
            svg.appendChild(createText(170, 195, '~64 samples/pixel', 'diagram-label-tiny'));

            var rightGroup = createGroup('translate(520, 110)');

            var screen = createRect(-80, -60, 160, 120, 6, 'rgba(45, 212, 191, 0.05)', 'rgba(45, 212, 191, 0.3)', 1);
            rightGroup.appendChild(screen);

            var lightScreen = createCircle(20, -10, 12, '#e8b923', 'none');
            lightScreen.innerHTML = '<animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite"/>';
            rightGroup.appendChild(lightScreen);

            for (var a = 0; a < 8; a++) {
                var ang = a * Math.PI / 4;
                var lineLen = 50;
                var gradLine = createLine(20, -10, 20 + Math.cos(ang) * lineLen, -10 + Math.sin(ang) * lineLen, 'rgba(232, 185, 35, 0.3)', 1);
                gradLine.innerHTML = '<animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" begin="' + (a * 0.1) + 's" repeatCount="indefinite"/>';
                rightGroup.appendChild(gradLine);
            }

            svg.appendChild(rightGroup);
            svg.appendChild(createText(520, 30, 'Screen-Space Radial', 'diagram-label'));
            svg.appendChild(createText(520, 195, '1 sample/pixel', 'diagram-label-tiny'));

            svg.appendChild(createLine(350, 40, 350, 180, 'rgba(255,255,255,0.1)', 1));
            svg.appendChild(createText(350, 115, 'VS', 'diagram-label-small'));

            svg.appendChild(createText(170, 210, 'Expensive', 'diagram-label-tiny'));
            svg.appendChild(createText(520, 210, 'Fast', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        'radial-falloff-diagram': function(container, w, h) {
            var svg = createSvg(w, h);
            var centerX = 300;
            var centerY = 125;

            for (var r = 120; r > 0; r -= 20) {
                var opacity = (120 - r) / 120 * 0.4 + 0.05;
                var ring = createCircle(centerX, centerY, r, 'rgba(232, 185, 35, ' + opacity + ')', 'none');
                svg.appendChild(ring);
            }

            var lightCore = createCircle(centerX, centerY, 8, '#fff', 'none');
            lightCore.innerHTML = '<animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite"/>';
            svg.appendChild(lightCore);

            var distances = [{r: 40, label: 'd=1'}, {r: 80, label: 'd=2'}, {r: 120, label: 'd=3'}];
            distances.forEach(function(d) {
                var labelX = centerX + d.r + 10;
                svg.appendChild(createText(labelX, centerY + 4, d.label, 'diagram-label-tiny'));
                svg.appendChild(createLine(centerX + d.r - 5, centerY, centerX + d.r + 5, centerY, 'rgba(255,255,255,0.5)', 1));
            });

            svg.appendChild(createText(centerX, 230, 'I = 1 / (1 + d^falloff)', 'diagram-label-small'));

            var curveX = 500;
            var curveY = 60;
            var curveW = 80;
            var curveH = 120;

            svg.appendChild(createLine(curveX, curveY + curveH, curveX + curveW, curveY + curveH, 'rgba(255,255,255,0.3)', 1));
            svg.appendChild(createLine(curveX, curveY + curveH, curveX, curveY, 'rgba(255,255,255,0.3)', 1));

            var curvePath = 'M' + curveX + ',' + curveY;
            for (var x = 0; x <= curveW; x += 2) {
                var d = x / 20;
                var intensity = 1 / (1 + d * d);
                var y = curveY + curveH - intensity * curveH;
                curvePath += ' L' + (curveX + x) + ',' + y;
            }
            var curve = createPath(curvePath, 'none', '#2dd4bf', 2);
            svg.appendChild(curve);

            svg.appendChild(createText(curveX + curveW/2, curveY + curveH + 20, 'Distance', 'diagram-label-tiny'));
            svg.appendChild(createText(curveX - 15, curveY + curveH/2, 'I', 'diagram-label-tiny'));

            svg.appendChild(createText(centerX, 25, 'Screen-Space Radial Falloff', 'diagram-title'));

            container.appendChild(svg);
        },

        'edge-fade-visualization': function(container, w, h) {
            var svg = createSvg(w, h);
            var screenW = 280;
            var screenH = 180;
            var screenX = (w - screenW) / 2;
            var screenY = 50;

            var outerZone = createRect(screenX - 60, screenY - 40, screenW + 120, screenH + 80, 8, 'rgba(255, 100, 100, 0.1)', 'rgba(255, 100, 100, 0.3)', 1);
            outerZone.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(outerZone);

            var screenRect = createRect(screenX, screenY, screenW, screenH, 4, 'rgba(45, 212, 191, 0.1)', 'rgba(45, 212, 191, 0.5)', 2);
            svg.appendChild(screenRect);

            var safeZone = createRect(screenX + 40, screenY + 30, screenW - 80, screenH - 60, 4, 'rgba(100, 255, 100, 0.1)', 'rgba(100, 255, 100, 0.3)', 1);
            safeZone.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(safeZone);

            var lights = [
                {x: screenX + screenW/2, y: screenY + screenH/2, opacity: 1.0, label: '100%'},
                {x: screenX + 20, y: screenY + screenH/2, opacity: 0.8, label: '80%'},
                {x: screenX - 30, y: screenY + screenH/2, opacity: 0.3, label: '30%'},
                {x: screenX - 50, y: screenY + screenH/2, opacity: 0.0, label: '0%'}
            ];

            lights.forEach(function(l, i) {
                var circle = createCircle(l.x, l.y, 10, 'rgba(232, 185, 35, ' + l.opacity + ')', 'rgba(232, 185, 35, 0.8)', 1);
                if (l.opacity > 0) {
                    circle.innerHTML = '<animate attributeName="r" values="8;12;8" dur="1.5s" begin="' + (i * 0.2) + 's" repeatCount="indefinite"/>';
                }
                svg.appendChild(circle);
                svg.appendChild(createText(l.x, l.y + 25, l.label, 'diagram-label-tiny'));
            });

            svg.appendChild(createText(w/2, 25, 'Edge Fade Zones', 'diagram-title'));
            svg.appendChild(createText(screenX + screenW + 70, screenY + 20, 'Fade Zone', 'diagram-label-tiny'));
            svg.appendChild(createText(screenX + screenW/2, screenY + screenH + 25, 'Screen Bounds', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        'perspective-correction': function(container, w, h) {
            var svg = createSvg(w, h);

            var leftX = 160;
            var leftY = 120;

            svg.appendChild(createText(leftX, 30, 'Without Correction', 'diagram-label'));

            var cam1 = createRect(30, leftY - 10, 25, 20, 3, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', 1);
            svg.appendChild(cam1);

            var light1Near = createCircle(leftX - 40, leftY, 25, 'rgba(232, 185, 35, 0.4)', '#e8b923', 1);
            var light1Far = createCircle(leftX + 60, leftY, 25, 'rgba(232, 185, 35, 0.4)', '#e8b923', 1);
            svg.appendChild(light1Near);
            svg.appendChild(light1Far);
            svg.appendChild(createText(leftX - 40, leftY + 45, 'Near', 'diagram-label-tiny'));
            svg.appendChild(createText(leftX + 60, leftY + 45, 'Far', 'diagram-label-tiny'));
            svg.appendChild(createText(leftX + 10, leftY + 70, 'Same glow size', 'diagram-label-tiny'));

            svg.appendChild(createText(leftX, 200, 'Looks wrong', 'diagram-label-tiny'));

            var rightX = 490;
            var rightY = 120;

            svg.appendChild(createText(rightX, 30, 'With Correction', 'diagram-label'));

            var cam2 = createRect(360, rightY - 10, 25, 20, 3, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', 1);
            svg.appendChild(cam2);

            var light2Near = createCircle(rightX - 40, rightY, 35, 'rgba(45, 212, 191, 0.4)', '#2dd4bf', 1);
            light2Near.innerHTML = '<animate attributeName="r" values="32;38;32" dur="2s" repeatCount="indefinite"/>';
            var light2Far = createCircle(rightX + 60, rightY, 15, 'rgba(45, 212, 191, 0.4)', '#2dd4bf', 1);
            light2Far.innerHTML = '<animate attributeName="r" values="13;17;13" dur="2s" repeatCount="indefinite"/>';
            svg.appendChild(light2Near);
            svg.appendChild(light2Far);
            svg.appendChild(createText(rightX - 40, rightY + 55, 'Near (large)', 'diagram-label-tiny'));
            svg.appendChild(createText(rightX + 60, rightY + 35, 'Far (small)', 'diagram-label-tiny'));

            svg.appendChild(createText(rightX, 200, 'Physically correct', 'diagram-label-tiny'));

            svg.appendChild(createLine(325, 50, 325, 190, 'rgba(255,255,255,0.1)', 1));

            container.appendChild(svg);
        },

        'noise-sampling-diagram': function(container, w, h) {
            var svg = createSvg(w, h);
            var centerX = 300;
            var centerY = 130;

            var eye = createCircle(80, centerY, 12, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.6)', 1);
            svg.appendChild(eye);
            svg.appendChild(createText(80, centerY + 30, 'Camera', 'diagram-label-tiny'));

            var screenX = 160;
            svg.appendChild(createLine(screenX, centerY - 80, screenX, centerY + 80, 'rgba(45, 212, 191, 0.5)', 2));
            svg.appendChild(createText(screenX, centerY + 100, 'Screen', 'diagram-label-tiny'));

            var rays = [
                {screenY: -50, skyX: 480, skyY: 40},
                {screenY: 0, skyX: 500, skyY: centerY},
                {screenY: 50, skyX: 480, skyY: 220}
            ];

            rays.forEach(function(ray, i) {
                var rayLine = createLine(80, centerY, ray.skyX, ray.skyY, 'rgba(232, 185, 35, 0.4)', 1);
                rayLine.setAttribute('stroke-dasharray', '4,4');
                svg.appendChild(rayLine);

                var screenPt = createCircle(screenX, centerY + ray.screenY, 5, '#2dd4bf', 'none');
                screenPt.innerHTML = '<animate attributeName="r" values="4;6;4" dur="1.5s" begin="' + (i * 0.2) + 's" repeatCount="indefinite"/>';
                svg.appendChild(screenPt);

                var noisePt = createCircle(ray.skyX, ray.skyY, 8, '#e8b923', 'none');
                noisePt.innerHTML = '<animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(noisePt);
            });

            var skyboxArc = createPath('M 450,30 Q 530,130 450,230', 'none', 'rgba(232, 185, 35, 0.3)', 2);
            svg.appendChild(skyboxArc);
            svg.appendChild(createText(530, centerY, '3D Noise', 'diagram-label-small'));
            svg.appendChild(createText(530, centerY + 18, 'Domain', 'diagram-label-small'));

            svg.appendChild(createText(300, 25, 'View-Dependent 3D Noise Sampling', 'diagram-title'));

            container.appendChild(svg);
        },

        'fbm-octaves': function(container, w, h) {
            var svg = createSvg(w, h);

            var octaves = [
                {x: 100, freq: 1, amp: 0.5, label: 'Octave 1', color: '#2dd4bf'},
                {x: 280, freq: 2, amp: 0.25, label: 'Octave 2', color: '#e8b923'},
                {x: 460, freq: 4, amp: 0.125, label: 'Octave 3', color: '#ff6b6b'}
            ];

            var waveY = 100;
            var waveW = 120;
            var waveH = 50;

            octaves.forEach(function(oct, i) {
                var wavePath = 'M' + (oct.x - waveW/2) + ',' + waveY;
                for (var x = 0; x <= waveW; x += 2) {
                    var y = waveY + Math.sin(x / waveW * Math.PI * 2 * oct.freq) * waveH * oct.amp;
                    wavePath += ' L' + (oct.x - waveW/2 + x) + ',' + y;
                }
                var wave = createPath(wavePath, 'none', oct.color, 2);
                wave.innerHTML = '<animate attributeName="stroke-dashoffset" from="0" to="20" dur="1s" repeatCount="indefinite"/>';
                wave.setAttribute('stroke-dasharray', '10,5');
                svg.appendChild(wave);

                svg.appendChild(createText(oct.x, 40, oct.label, 'diagram-label'));
                svg.appendChild(createText(oct.x, 165, 'freq: ' + oct.freq + 'x', 'diagram-label-tiny'));
                svg.appendChild(createText(oct.x, 180, 'amp: ' + oct.amp, 'diagram-label-tiny'));

                if (i < octaves.length - 1) {
                    svg.appendChild(createText((oct.x + octaves[i+1].x) / 2, waveY, '+', 'diagram-label'));
                }
            });

            svg.appendChild(createText(580, waveY, '=', 'diagram-label'));
            svg.appendChild(createText(640, waveY, 'FBM', 'diagram-label'));

            container.appendChild(svg);
        },

        'multi-light-blend': function(container, w, h) {
            var svg = createSvg(w, h);

            var lights = [
                {x: 180, y: 110, color: 'rgba(255, 150, 100, 0.4)', label: 'Light 0 (Warm)'},
                {x: 320, y: 90, color: 'rgba(100, 200, 255, 0.4)', label: 'Light 1 (Cool)'},
                {x: 450, y: 120, color: 'rgba(200, 255, 150, 0.4)', label: 'Light 2 (Green)'}
            ];

            lights.forEach(function(light, i) {
                for (var r = 80; r > 0; r -= 15) {
                    var opacity = (80 - r) / 80 * 0.3;
                    var colorParts = light.color.match(/[\d.]+/g);
                    var fillColor = 'rgba(' + colorParts[0] + ',' + colorParts[1] + ',' + colorParts[2] + ',' + opacity + ')';
                    var circle = createCircle(light.x, light.y, r, fillColor, 'none');
                    svg.appendChild(circle);
                }

                var core = createCircle(light.x, light.y, 8, '#fff', 'none');
                core.innerHTML = '<animate attributeName="r" values="6;10;6" dur="2s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(core);
            });

            svg.appendChild(createText(180, 200, 'Light 0', 'diagram-label-tiny'));
            svg.appendChild(createText(320, 200, 'Light 1', 'diagram-label-tiny'));
            svg.appendChild(createText(450, 200, 'Light 2', 'diagram-label-tiny'));

            svg.appendChild(createText(325, 25, 'result = L0 + L1 + L2 (Additive)', 'diagram-label'));

            var overlapText = createText(320, 110, 'Additive', 'diagram-label-tiny');
            overlapText.setAttribute('fill', '#fff');
            svg.appendChild(overlapText);

            container.appendChild(svg);
        },

        // ============================================
        // PROCEDURAL PLANET RENDERING DIAGRAMS
        // ============================================

        'planet-pipeline-overview': function(container, w, h) {
            var svg = createSvg(w, h);
            var stages = [
                {label: 'Billboard', sub: 'Quad'},
                {label: 'Sphere', sub: 'Reconstruct'},
                {label: 'Terrain', sub: 'FBM Noise'},
                {label: 'Materials', sub: 'Dual Blend'},
                {label: 'PBR', sub: 'Cook-Torrance'},
                {label: 'Atmosphere', sub: 'Rayleigh'},
                {label: 'Composite', sub: 'Final'}
            ];
            var stageWidth = 80;
            var startX = 25;
            var y = 85;

            stages.forEach(function(stage, i) {
                var x = startX + i * (stageWidth + 12);
                var rect = createRect(x, y, stageWidth, 55, 6, 'rgba(45, 212, 191, 0.1)', 'rgba(45, 212, 191, 0.5)', 1);
                rect.innerHTML = '<animate attributeName="fill" values="rgba(45,212,191,0.1);rgba(45,212,191,0.25);rgba(45,212,191,0.1)" dur="3s" begin="' + (i * 0.4) + 's" repeatCount="indefinite"/>';
                svg.appendChild(rect);

                svg.appendChild(createText(x + stageWidth/2, y + 22, stage.label, 'diagram-label-small'));
                svg.appendChild(createText(x + stageWidth/2, y + 40, stage.sub, 'diagram-label-tiny'));

                if (i < stages.length - 1) {
                    var arrowX = x + stageWidth + 2;
                    svg.appendChild(createArrow(arrowX, y + 27, arrowX + 8, y + 27, 'rgba(232, 185, 35, 0.6)'));
                }
            });

            svg.appendChild(createText(w/2, 30, 'Planet Rendering Pipeline', 'diagram-title'));
            svg.appendChild(createText(w/2, 170, 'All stages execute per-fragment in a single shader pass', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        'sphere-reconstruction': function(container, w, h) {
            var svg = createSvg(w, h);
            var centerX = 170;
            var centerY = 150;

            // Billboard quad outline
            var quadSize = 120;
            var quad = createRect(centerX - quadSize, centerY - quadSize, quadSize * 2, quadSize * 2, 0, 'none', 'rgba(255, 255, 255, 0.2)', 1);
            quad.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(quad);
            svg.appendChild(createText(centerX, centerY + quadSize + 20, 'Billboard Quad', 'diagram-label-tiny'));

            // Sphere circle
            var sphereRadius = 72;
            var sphere = createCircle(centerX, centerY, sphereRadius, 'rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.6)', 2);
            svg.appendChild(sphere);

            // UV coordinate point
            var uvX = 40;
            var uvY = -30;
            var uvDot = createCircle(centerX + uvX, centerY + uvY, 5, '#e8b923', 'none');
            uvDot.innerHTML = '<animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite"/>';
            svg.appendChild(uvDot);
            svg.appendChild(createText(centerX + uvX + 15, centerY + uvY - 10, 'UV point', 'diagram-label-tiny'));

            // Line from center to UV point
            svg.appendChild(createLine(centerX, centerY, centerX + uvX, centerY + uvY, 'rgba(232, 185, 35, 0.5)', 1));
            svg.appendChild(createText(centerX + uvX/2 - 10, centerY + uvY/2 + 12, 'd', 'diagram-label-tiny'));

            // Z height visualization
            var d = Math.sqrt(uvX * uvX + uvY * uvY);
            var zHeight = Math.sqrt(sphereRadius * sphereRadius - d * d) * 0.6;
            svg.appendChild(createLine(centerX + uvX, centerY + uvY, centerX + uvX, centerY + uvY - zHeight, '#2dd4bf', 2));
            svg.appendChild(createText(centerX + uvX + 12, centerY + uvY - zHeight/2, 'z', 'diagram-label-tiny'));

            // Normal arrow at surface point
            var normalLen = 35;
            var nx = uvX / d;
            var ny = uvY / d;
            var nz = zHeight / (sphereRadius * 0.6);
            var normalMag = Math.sqrt(nx*nx + ny*ny + nz*nz);
            svg.appendChild(createArrow(
                centerX + uvX, centerY + uvY - zHeight,
                centerX + uvX + nx/normalMag * normalLen, centerY + uvY - zHeight - nz/normalMag * normalLen * 0.8,
                '#2dd4bf'
            ));
            svg.appendChild(createText(centerX + uvX + 35, centerY + uvY - zHeight - 25, 'N', 'diagram-label-small'));

            // Formula on right side
            var formulaX = 420;
            svg.appendChild(createText(formulaX, 60, 'Sphere Equation:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 90, 'z = sqrt(r^2 - d^2)', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 120, 'where d = length(UV)', 'diagram-label-tiny'));

            svg.appendChild(createText(formulaX, 170, 'Surface Normal:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 200, 'N = normalize(UV.x, UV.y, z)', 'diagram-label-small'));

            svg.appendChild(createText(formulaX, 250, 'Discard if d > radius', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 25, 'Sphere Reconstruction from Billboard', 'diagram-title'));

            container.appendChild(svg);
        },

        'fbm-terrain-octaves': function(container, w, h) {
            var svg = createSvg(w, h);
            var octaves = [
                {label: 'Octave 1', freq: 1, amp: 0.5, color: '#2dd4bf'},
                {label: 'Octave 2', freq: 2, amp: 0.25, color: '#e8b923'},
                {label: 'Octave 3', freq: 4, amp: 0.125, color: '#ff6b6b'},
                {label: 'Octave 4', freq: 8, amp: 0.0625, color: '#a78bfa'},
                {label: 'Octave 5', freq: 16, amp: 0.03125, color: '#60a5fa'}
            ];

            var waveY = 90;
            var waveW = 100;
            var waveH = 30;
            var spacing = 125;

            octaves.forEach(function(oct, i) {
                var x = 70 + i * spacing;
                var wavePath = 'M' + (x - waveW/2) + ',' + waveY;
                for (var px = 0; px <= waveW; px += 2) {
                    var py = waveY + Math.sin(px / waveW * Math.PI * 2 * Math.min(oct.freq, 4)) * waveH * oct.amp * 2;
                    wavePath += ' L' + (x - waveW/2 + px) + ',' + py;
                }
                var wave = createPath(wavePath, 'none', oct.color, 2);
                svg.appendChild(wave);

                svg.appendChild(createText(x, 140, oct.label, 'diagram-label-tiny'));
                svg.appendChild(createText(x, 155, 'amp: ' + oct.amp, 'diagram-label-tiny'));

                if (i < octaves.length - 1) {
                    svg.appendChild(createText(x + spacing/2, waveY, '+', 'diagram-label'));
                }
            });

            svg.appendChild(createText(w/2, 25, 'FBM: Sum of Noise Octaves with Decreasing Amplitude', 'diagram-title'));

            container.appendChild(svg);
        },

        'normal-perturbation': function(container, w, h) {
            var svg = createSvg(w, h);

            // Height field visualization
            var fieldX = 120;
            var fieldY = 130;
            var fieldW = 200;
            var fieldH = 80;

            // Draw terrain profile
            var terrainPath = 'M' + fieldX + ',' + (fieldY + fieldH/2);
            for (var x = 0; x <= fieldW; x += 4) {
                var height = Math.sin(x * 0.05) * 20 + Math.sin(x * 0.12) * 10 + Math.sin(x * 0.03) * 15;
                terrainPath += ' L' + (fieldX + x) + ',' + (fieldY + fieldH/2 - height);
            }
            var terrain = createPath(terrainPath, 'none', '#2dd4bf', 2);
            svg.appendChild(terrain);

            // Sample points
            var samples = [
                {x: 80, label: 'hX-'},
                {x: 100, label: 'hC', main: true},
                {x: 120, label: 'hX+'}
            ];
            samples.forEach(function(s, i) {
                var px = fieldX + s.x;
                var height = Math.sin(s.x * 0.05) * 20 + Math.sin(s.x * 0.12) * 10 + Math.sin(s.x * 0.03) * 15;
                var py = fieldY + fieldH/2 - height;

                var color = s.main ? '#e8b923' : 'rgba(232, 185, 35, 0.6)';
                var dot = createCircle(px, py, s.main ? 6 : 4, color, 'none');
                if (s.main) {
                    dot.innerHTML = '<animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite"/>';
                }
                svg.appendChild(dot);
                svg.appendChild(createText(px, py - 15, s.label, 'diagram-label-tiny'));

                // Vertical line to show height
                svg.appendChild(createLine(px, py, px, fieldY + fieldH/2 + 20, 'rgba(255,255,255,0.2)', 1));
            });

            // Normal arrow at center
            var centerX = fieldX + 100;
            var centerHeight = Math.sin(100 * 0.05) * 20 + Math.sin(100 * 0.12) * 10 + Math.sin(100 * 0.03) * 15;
            var centerY = fieldY + fieldH/2 - centerHeight;

            // Calculate gradient for normal direction
            var gradX = (Math.sin(120 * 0.05) * 20 + Math.sin(120 * 0.12) * 10) - (Math.sin(80 * 0.05) * 20 + Math.sin(80 * 0.12) * 10);
            var angle = Math.atan2(-gradX, 40);
            var normalLen = 40;

            svg.appendChild(createArrow(centerX, centerY, centerX + Math.sin(angle) * normalLen * 0.3, centerY - Math.cos(angle) * normalLen, '#2dd4bf'));
            svg.appendChild(createText(centerX + 25, centerY - 35, 'N', 'diagram-label'));

            // Formula side
            var formulaX = 480;
            svg.appendChild(createText(formulaX, 70, 'Gradient:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 95, 'dX = (hX+ - hC) / eps', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 115, 'dY = (hY+ - hC) / eps', 'diagram-label-small'));

            svg.appendChild(createText(formulaX, 155, 'Perturbed Normal:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 180, 'N = normalize(', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 200, '  baseN + T*dX + B*dY)', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 25, 'Normal Perturbation from Height Gradient', 'diagram-title'));

            container.appendChild(svg);
        },

        'material-blend-diagram': function(container, w, h) {
            var svg = createSvg(w, h);

            // Planet cross-section
            var planetX = 180;
            var planetY = 100;
            var planetR = 70;

            // Sea level line
            var seaY = planetY + 10;
            svg.appendChild(createLine(planetX - planetR - 20, seaY, planetX + planetR + 20, seaY, 'rgba(255, 255, 255, 0.3)', 1));
            svg.appendChild(createText(planetX + planetR + 40, seaY + 4, 'Sea Level', 'diagram-label-tiny'));

            // Below sea level (Material A)
            var arcA = createPath(
                'M' + (planetX - planetR) + ',' + seaY +
                ' A' + planetR + ',' + planetR + ' 0 0 0 ' + (planetX + planetR) + ',' + seaY,
                'rgba(45, 212, 191, 0.3)', 'rgba(45, 212, 191, 0.6)', 2
            );
            svg.appendChild(arcA);

            // Above sea level (Material B)
            var arcB = createPath(
                'M' + (planetX - planetR) + ',' + seaY +
                ' A' + planetR + ',' + planetR + ' 0 0 1 ' + (planetX + planetR) + ',' + seaY,
                'rgba(232, 185, 35, 0.3)', 'rgba(232, 185, 35, 0.6)', 2
            );
            svg.appendChild(arcB);

            // Labels
            svg.appendChild(createText(planetX, planetY + 45, 'Material A', 'diagram-label-small'));
            svg.appendChild(createText(planetX, planetY + 60, '(Water/Lava)', 'diagram-label-tiny'));
            svg.appendChild(createText(planetX, planetY - 40, 'Material B', 'diagram-label-small'));
            svg.appendChild(createText(planetX, planetY - 25, '(Land/Rock)', 'diagram-label-tiny'));

            // Blend formula
            var formulaX = 420;
            svg.appendChild(createText(formulaX, 60, 'Height-Based Blend:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 90, 'mask = smoothstep(', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 108, '  seaLevel - 0.02,', 'diagram-label-tiny'));
            svg.appendChild(createText(formulaX, 124, '  seaLevel + 0.02,', 'diagram-label-tiny'));
            svg.appendChild(createText(formulaX, 140, '  terrainHeight)', 'diagram-label-tiny'));

            svg.appendChild(createText(formulaX, 170, 'color = mix(A, B, mask)', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 25, 'Dual Material System', 'diagram-title'));

            container.appendChild(svg);
        },

        'cook-torrance-components': function(container, w, h) {
            var svg = createSvg(w, h);

            var components = [
                {x: 120, label: 'D (GGX)', sub: 'Normal Distribution', color: '#2dd4bf', desc: 'Microfacet orientation'},
                {x: 300, label: 'G (Smith)', sub: 'Geometry', color: '#e8b923', desc: 'Self-shadowing'},
                {x: 480, label: 'F (Fresnel)', sub: 'Fresnel-Schlick', color: '#ff6b6b', desc: 'Angle-dependent reflect'}
            ];

            components.forEach(function(comp, i) {
                var y = 100;

                // Component box
                var box = createRect(comp.x - 60, y - 40, 120, 80, 8, 'rgba(255, 255, 255, 0.05)', comp.color, 2);
                box.innerHTML = '<animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(box);

                svg.appendChild(createText(comp.x, y - 10, comp.label, 'diagram-label'));
                svg.appendChild(createText(comp.x, y + 10, comp.sub, 'diagram-label-tiny'));
                svg.appendChild(createText(comp.x, y + 55, comp.desc, 'diagram-label-tiny'));

                if (i < components.length - 1) {
                    svg.appendChild(createText(comp.x + 80, y, '\u00D7', 'diagram-label'));
                }
            });

            // Result
            svg.appendChild(createText(580, 100, '=', 'diagram-label'));
            var resultBox = createRect(600, 60, 80, 80, 8, 'rgba(45, 212, 191, 0.2)', '#2dd4bf', 2);
            svg.appendChild(resultBox);
            svg.appendChild(createText(640, 95, 'Specular', 'diagram-label-small'));
            svg.appendChild(createText(640, 115, 'BRDF', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 25, 'Cook-Torrance BRDF = D \u00D7 G \u00D7 F / (4 \u00B7 NdV \u00B7 NdL)', 'diagram-title'));

            container.appendChild(svg);
        },

        'sss-diagram': function(container, w, h) {
            var svg = createSvg(w, h);

            // Planet surface curve
            var surfaceX = 200;
            var surfaceY = 100;
            var curveR = 150;

            var surfacePath = 'M' + (surfaceX - 100) + ',' + (surfaceY + 30) +
                             ' Q' + surfaceX + ',' + (surfaceY - 20) + ' ' + (surfaceX + 100) + ',' + (surfaceY + 30);
            svg.appendChild(createPath(surfacePath, 'none', 'rgba(45, 212, 191, 0.6)', 2));

            // Light source
            var lightX = surfaceX + 120;
            var lightY = surfaceY - 60;
            var light = createCircle(lightX, lightY, 12, '#e8b923', 'none');
            light.innerHTML = '<animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite"/>';
            svg.appendChild(light);
            svg.appendChild(createText(lightX + 25, lightY, 'Light', 'diagram-label-tiny'));

            // Incoming light ray
            var hitX = surfaceX + 30;
            var hitY = surfaceY - 5;
            svg.appendChild(createArrow(lightX - 10, lightY + 10, hitX + 5, hitY - 5, '#e8b923'));

            // Subsurface scatter paths
            var scatterPaths = [
                {dx: -40, dy: 25, opacity: 0.6},
                {dx: -20, dy: 35, opacity: 0.4},
                {dx: 10, dy: 30, opacity: 0.5},
                {dx: -50, dy: 15, opacity: 0.3}
            ];
            scatterPaths.forEach(function(sp, i) {
                var scatterPath = createPath(
                    'M' + hitX + ',' + hitY + ' Q' + (hitX + sp.dx/2) + ',' + (hitY + sp.dy/2 + 10) + ' ' + (hitX + sp.dx) + ',' + (hitY + sp.dy),
                    'none', 'rgba(45, 212, 191, ' + sp.opacity + ')', 1.5
                );
                scatterPath.innerHTML = '<animate attributeName="stroke-dashoffset" from="30" to="0" dur="1s" begin="' + (i * 0.15) + 's" repeatCount="indefinite"/>';
                scatterPath.setAttribute('stroke-dasharray', '5,3');
                svg.appendChild(scatterPath);

                // Exit point
                var exitDot = createCircle(hitX + sp.dx, hitY + sp.dy, 3, '#2dd4bf', 'none');
                exitDot.innerHTML = '<animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin="' + (i * 0.15 + 0.5) + 's" repeatCount="indefinite"/>';
                svg.appendChild(exitDot);
            });

            // Labels
            svg.appendChild(createText(hitX, hitY - 20, 'Entry', 'diagram-label-tiny'));
            svg.appendChild(createText(surfaceX - 30, surfaceY + 50, 'Internal scatter', 'diagram-label-tiny'));

            // Wrap lighting explanation
            var formulaX = 480;
            svg.appendChild(createText(formulaX, 50, 'Wrap Lighting:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 75, 'wrappedNdL = (NdL + wrap)', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 93, '            / (1 + wrap)', 'diagram-label-small'));

            svg.appendChild(createText(formulaX, 130, 'Backlight:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 155, 'back = pow(max(-NdL, 0), 2)', 'diagram-label-small'));

            svg.appendChild(createText(formulaX, 190, 'SSS = color * (wrap + back)', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 20, 'Subsurface Scattering Approximation', 'diagram-title'));

            container.appendChild(svg);
        },

        'atmos-integration': function(container, w, h) {
            var svg = createSvg(w, h);

            var centerX = 200;
            var centerY = 150;
            var planetR = 60;
            var atmosR = 100;

            // Atmosphere shell
            var atmosCircle = createCircle(centerX, centerY, atmosR, 'rgba(100, 180, 255, 0.1)', 'rgba(100, 180, 255, 0.3)', 1);
            atmosCircle.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(atmosCircle);

            // Planet
            var planet = createCircle(centerX, centerY, planetR, 'rgba(45, 212, 191, 0.3)', 'rgba(45, 212, 191, 0.6)', 2);
            svg.appendChild(planet);

            // Camera position
            var camX = 50;
            var camY = centerY;
            svg.appendChild(createRect(camX - 12, camY - 8, 24, 16, 3, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', 1));
            svg.appendChild(createText(camX, camY + 25, 'Camera', 'diagram-label-tiny'));

            // Ray through atmosphere (hitting planet)
            var ray1EndX = centerX + planetR * 0.7;
            var ray1EndY = centerY - planetR * 0.5;
            svg.appendChild(createLine(camX + 15, camY - 15, ray1EndX, ray1EndY, 'rgba(232, 185, 35, 0.6)', 1.5));

            // Sample points along ray 1
            for (var i = 0; i < 4; i++) {
                var t = 0.4 + i * 0.15;
                var sx = camX + 15 + t * (ray1EndX - camX - 15);
                var sy = camY - 15 + t * (ray1EndY - camY + 15);
                var dot = createCircle(sx, sy, 3, '#e8b923', 'none');
                dot.innerHTML = '<animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="' + (i * 0.2) + 's" repeatCount="indefinite"/>';
                svg.appendChild(dot);
            }

            // Ray through atmosphere only (limb)
            var ray2StartY = centerY + 80;
            var ray2EndX = centerX + atmosR + 30;
            svg.appendChild(createLine(camX + 15, ray2StartY, ray2EndX, ray2StartY, 'rgba(100, 180, 255, 0.6)', 1.5));

            // Sample points along ray 2
            for (var j = 0; j < 6; j++) {
                var t2 = 0.3 + j * 0.1;
                var sx2 = camX + 15 + t2 * (ray2EndX - camX - 15);
                var dot2 = createCircle(sx2, ray2StartY, 3, '#60a5fa', 'none');
                dot2.innerHTML = '<animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="' + (j * 0.15) + 's" repeatCount="indefinite"/>';
                svg.appendChild(dot2);
            }

            // Labels
            svg.appendChild(createText(centerX, centerY, 'Planet', 'diagram-label-tiny'));
            svg.appendChild(createText(centerX + atmosR + 15, centerY - 20, 'Atmosphere', 'diagram-label-tiny'));
            svg.appendChild(createText(ray1EndX + 20, ray1EndY, '4 samples', 'diagram-label-tiny'));
            svg.appendChild(createText(ray2EndX - 30, ray2StartY - 15, '6 samples', 'diagram-label-tiny'));

            // Formula side
            var formulaX = 480;
            svg.appendChild(createText(formulaX, 50, 'Optical Depth:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 80, 'For each sample point:', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 105, 'height = (r - planetR) / thickness', 'diagram-label-tiny'));
            svg.appendChild(createText(formulaX, 125, 'density = exp(-height * falloff)', 'diagram-label-tiny'));
            svg.appendChild(createText(formulaX, 145, '        * (1 - height)', 'diagram-label-tiny'));

            svg.appendChild(createText(formulaX, 180, 'Accumulate:', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 205, 'opticalDepth += density * stepLen', 'diagram-label-tiny'));

            svg.appendChild(createText(formulaX, 245, 'Transmittance:', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 270, 'T = exp(-beta * opticalDepth)', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 20, 'Atmospheric Ray Integration', 'diagram-title'));

            container.appendChild(svg);
        },

        'rayleigh-color-shift': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left side: wavelength visualization
            var wavelengths = [
                {color: '#ff4444', label: 'Red 700nm', scatter: 0.15, y: 60},
                {color: '#44ff44', label: 'Green 550nm', scatter: 0.35, y: 110},
                {color: '#4488ff', label: 'Blue 450nm', scatter: 0.7, y: 160}
            ];

            // Light source
            var lightX = 60;
            svg.appendChild(createCircle(lightX, 110, 20, '#fff', 'none'));
            svg.appendChild(createText(lightX, 180, 'White', 'diagram-label-tiny'));
            svg.appendChild(createText(lightX, 195, 'Light', 'diagram-label-tiny'));

            // Atmosphere box
            var atmosX = 140;
            var atmosW = 180;
            var atmosBox = createRect(atmosX, 40, atmosW, 150, 6, 'rgba(100, 180, 255, 0.1)', 'rgba(100, 180, 255, 0.3)', 1);
            svg.appendChild(atmosBox);
            svg.appendChild(createText(atmosX + atmosW/2, 30, 'Atmosphere', 'diagram-label-small'));

            // Rays through atmosphere with different scatter amounts
            wavelengths.forEach(function(wl, i) {
                // Main ray (gets weaker based on scatter)
                var rayOpacity = 1 - wl.scatter;
                var mainRay = createLine(lightX + 20, wl.y, atmosX + atmosW + 50, wl.y, wl.color, 2);
                mainRay.setAttribute('opacity', rayOpacity);
                svg.appendChild(mainRay);

                // Scattered rays
                var scatterCount = Math.floor(wl.scatter * 6) + 1;
                for (var s = 0; s < scatterCount; s++) {
                    var scatterX = atmosX + 30 + s * (atmosW - 60) / Math.max(scatterCount, 1);
                    var scatterAngle = (s % 2 ? 0.6 : -0.6);
                    var scatterLen = 25 + wl.scatter * 15;
                    var scatterRay = createLine(
                        scatterX, wl.y,
                        scatterX + Math.cos(scatterAngle) * scatterLen,
                        wl.y + Math.sin(scatterAngle) * scatterLen,
                        wl.color, 1
                    );
                    scatterRay.setAttribute('opacity', 0.4);
                    scatterRay.innerHTML = '<animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" begin="' + (s * 0.2 + i * 0.1) + 's" repeatCount="indefinite"/>';
                    svg.appendChild(scatterRay);
                }

                // Label
                svg.appendChild(createText(atmosX + atmosW + 80, wl.y + 4, wl.label, 'diagram-label-tiny'));
            });

            // Right side: result visualization
            var resultX = 500;

            // Thin atmosphere = blue sky
            svg.appendChild(createText(resultX, 55, 'Thin Path:', 'diagram-label-small'));
            for (var b = 0; b < 5; b++) {
                var blueBar = createRect(resultX + 70 + b * 12, 40, 10, 30, 2, 'rgba(68, 136, 255, ' + (0.3 + b * 0.15) + ')', 'none', 0);
                svg.appendChild(blueBar);
            }
            svg.appendChild(createText(resultX + 100, 90, 'Blue sky', 'diagram-label-tiny'));

            // Thick atmosphere = sunset
            svg.appendChild(createText(resultX, 135, 'Long Path:', 'diagram-label-small'));
            var sunsetColors = ['#ff4444', '#ff6644', '#ffaa44', '#ffcc66', '#ffdd88'];
            sunsetColors.forEach(function(col, idx) {
                var sunBar = createRect(resultX + 70 + idx * 12, 120, 10, 30, 2, col, 'none', 0);
                svg.appendChild(sunBar);
            });
            svg.appendChild(createText(resultX + 100, 170, 'Sunset', 'diagram-label-tiny'));

            // Formula
            svg.appendChild(createText(resultX + 60, 205, 'Scatter \u221D 1/\u03BB\u2074', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 15, 'Rayleigh Scattering: Blue Scatters More Than Red', 'diagram-title'));

            container.appendChild(svg);
        },

        'atmos-self-shadow': function(container, w, h) {
            var svg = createSvg(w, h);

            var centerX = 200;
            var centerY = 125;
            var planetR = 55;
            var atmosR = 90;

            // Light source
            var lightX = 420;
            var lightY = 80;
            var light = createCircle(lightX, lightY, 15, '#e8b923', 'none');
            light.innerHTML = '<animate attributeName="r" values="13;17;13" dur="2s" repeatCount="indefinite"/>';
            svg.appendChild(light);
            svg.appendChild(createText(lightX, lightY + 30, 'Light', 'diagram-label-tiny'));

            // Shadow cone (draw first, behind everything)
            var shadowPath = 'M' + (centerX - planetR) + ',' + (centerY - 10) +
                            ' L' + 30 + ',' + 40 +
                            ' L' + 30 + ',' + 210 +
                            ' L' + (centerX - planetR) + ',' + (centerY + 10) + ' Z';
            var shadow = createPath(shadowPath, 'rgba(0, 0, 30, 0.4)', 'none', 0);
            svg.appendChild(shadow);

            // Atmosphere shell
            var atmosCircle = createCircle(centerX, centerY, atmosR, 'rgba(100, 180, 255, 0.15)', 'rgba(100, 180, 255, 0.4)', 1);
            svg.appendChild(atmosCircle);

            // Planet
            var planet = createCircle(centerX, centerY, planetR, 'rgba(45, 212, 191, 0.4)', 'rgba(45, 212, 191, 0.7)', 2);
            svg.appendChild(planet);

            // Light rays toward planet
            for (var r = -2; r <= 2; r++) {
                var rayStartX = lightX - 10;
                var rayStartY = lightY + r * 15;
                var rayEndX = centerX + planetR;
                var rayEndY = centerY + r * 20;

                var ray = createLine(rayStartX, rayStartY, rayEndX, rayEndY, 'rgba(232, 185, 35, 0.3)', 1);
                ray.setAttribute('stroke-dasharray', '4,4');
                svg.appendChild(ray);
            }

            // Sample points showing lit vs shadowed
            var samples = [
                {x: centerX + 70, y: centerY - 30, lit: true, label: '100%'},
                {x: centerX + 50, y: centerY + 40, lit: true, label: '95%'},
                {x: centerX - 70, y: centerY - 20, lit: false, label: '30%'},
                {x: centerX - 85, y: centerY + 25, lit: false, label: '5%'}
            ];

            samples.forEach(function(s, i) {
                var color = s.lit ? '#2dd4bf' : '#ff6b6b';
                var dot = createCircle(s.x, s.y, 6, color, 'none');
                dot.innerHTML = '<animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" begin="' + (i * 0.25) + 's" repeatCount="indefinite"/>';
                svg.appendChild(dot);
                svg.appendChild(createText(s.x, s.y - 15, s.label, 'diagram-label-tiny'));
            });

            // Labels
            svg.appendChild(createText(centerX, centerY, 'Planet', 'diagram-label-tiny'));
            svg.appendChild(createText(70, centerY, 'Shadow', 'diagram-label-small'));
            svg.appendChild(createText(70, centerY + 18, 'Cone', 'diagram-label-small'));

            // Formula side
            var formulaX = 520;
            svg.appendChild(createText(formulaX, 50, 'Shadow Test:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 80, 'perpDist = |UV \u00D7 D|', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 105, 'alongRay = UV \u00B7 D', 'diagram-label-small'));

            svg.appendChild(createText(formulaX, 145, 'In Shadow:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 170, 'alongRay < 0', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 190, 'perpDist < radius', 'diagram-label-small'));

            svg.appendChild(createText(formulaX, 230, 'Soft penumbra via', 'diagram-label-tiny'));
            svg.appendChild(createText(formulaX, 245, 'smoothstep blend', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 15, 'Atmosphere Self-Shadowing', 'diagram-title'));

            container.appendChild(svg);
        },

        // ============================================
        // FROSTED GLASS SDF DIAGRAMS
        // ============================================

        'glass-effect-overview': function(container, w, h) {
            var svg = createSvg(w, h);
            var stages = [
                {label: 'Scene', sub: 'Render'},
                {label: 'Downsample', sub: '1/2 or 1/4'},
                {label: 'H-Blur', sub: 'Gaussian'},
                {label: 'V-Blur', sub: 'Gaussian'},
                {label: 'SDF Mask', sub: 'Rounded Rect'},
                {label: 'Refract', sub: 'Edge Warp'},
                {label: 'Composite', sub: 'Final'}
            ];
            var stageWidth = 80;
            var startX = 30;
            var y = 85;

            stages.forEach(function(stage, i) {
                var x = startX + i * (stageWidth + 12);
                var color = i < 4 ? 'rgba(45, 212, 191, 0.5)' : 'rgba(232, 185, 35, 0.5)';
                var fill = i < 4 ? 'rgba(45, 212, 191, 0.1)' : 'rgba(232, 185, 35, 0.1)';
                var rect = createRect(x, y, stageWidth, 55, 6, fill, color, 1);
                rect.innerHTML = '<animate attributeName="fill-opacity" values="0.1;0.25;0.1" dur="3s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(rect);

                svg.appendChild(createText(x + stageWidth/2, y + 22, stage.label, 'diagram-label-small'));
                svg.appendChild(createText(x + stageWidth/2, y + 40, stage.sub, 'diagram-label-tiny'));

                if (i < stages.length - 1) {
                    var arrowX = x + stageWidth + 2;
                    svg.appendChild(createArrow(arrowX, y + 27, arrowX + 8, y + 27, 'rgba(255, 255, 255, 0.4)'));
                }
            });

            svg.appendChild(createText(w/2, 30, 'Frosted Glass Pipeline', 'diagram-title'));
            svg.appendChild(createText(w/2, 170, 'Blur passes (teal) + SDF compositing (gold)', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        'sdf-distance-field': function(container, w, h) {
            var svg = createSvg(w, h);

            // Draw rounded rectangle outline
            var rectX = 120;
            var rectY = 60;
            var rectW = 200;
            var rectH = 140;
            var radius = 25;

            // Rounded rect path
            var rectPath = 'M' + (rectX + radius) + ',' + rectY +
                ' L' + (rectX + rectW - radius) + ',' + rectY +
                ' Q' + (rectX + rectW) + ',' + rectY + ' ' + (rectX + rectW) + ',' + (rectY + radius) +
                ' L' + (rectX + rectW) + ',' + (rectY + rectH - radius) +
                ' Q' + (rectX + rectW) + ',' + (rectY + rectH) + ' ' + (rectX + rectW - radius) + ',' + (rectY + rectH) +
                ' L' + (rectX + radius) + ',' + (rectY + rectH) +
                ' Q' + rectX + ',' + (rectY + rectH) + ' ' + rectX + ',' + (rectY + rectH - radius) +
                ' L' + rectX + ',' + (rectY + radius) +
                ' Q' + rectX + ',' + rectY + ' ' + (rectX + radius) + ',' + rectY + ' Z';
            svg.appendChild(createPath(rectPath, 'rgba(45, 212, 191, 0.2)', '#2dd4bf', 2));

            // Distance field visualization - concentric outlines
            var distances = [20, 40, 60];
            distances.forEach(function(d, i) {
                var opacity = 0.4 - i * 0.1;
                var outerPath = 'M' + (rectX + radius - d) + ',' + (rectY - d) +
                    ' L' + (rectX + rectW - radius + d) + ',' + (rectY - d) +
                    ' Q' + (rectX + rectW + d) + ',' + (rectY - d) + ' ' + (rectX + rectW + d) + ',' + (rectY + radius - d) +
                    ' L' + (rectX + rectW + d) + ',' + (rectY + rectH - radius + d) +
                    ' Q' + (rectX + rectW + d) + ',' + (rectY + rectH + d) + ' ' + (rectX + rectW - radius + d) + ',' + (rectY + rectH + d) +
                    ' L' + (rectX + radius - d) + ',' + (rectY + rectH + d) +
                    ' Q' + (rectX - d) + ',' + (rectY + rectH + d) + ' ' + (rectX - d) + ',' + (rectY + rectH - radius + d) +
                    ' L' + (rectX - d) + ',' + (rectY + radius - d) +
                    ' Q' + (rectX - d) + ',' + (rectY - d) + ' ' + (rectX + radius - d) + ',' + (rectY - d) + ' Z';
                var path = createPath(outerPath, 'none', 'rgba(232, 185, 35, ' + opacity + ')', 1);
                path.setAttribute('stroke-dasharray', '4,4');
                svg.appendChild(path);
            });

            // Sample points with distance labels
            var points = [
                {x: rectX + rectW/2, y: rectY + rectH/2, d: -70, label: 'd = -70'},
                {x: rectX + rectW + 30, y: rectY + rectH/2, d: 30, label: 'd = +30'},
                {x: rectX + rectW - 10, y: rectY - 25, d: 25, label: 'd = +25'}
            ];
            points.forEach(function(p, i) {
                var color = p.d < 0 ? '#2dd4bf' : '#e8b923';
                var dot = createCircle(p.x, p.y, 5, color, 'none');
                dot.innerHTML = '<animate attributeName="r" values="4;6;4" dur="2s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(dot);
                svg.appendChild(createText(p.x + 15, p.y + 5, p.label, 'diagram-label-tiny'));
            });

            // Legend
            var legendX = 450;
            svg.appendChild(createText(legendX, 80, 'SDF Values:', 'diagram-label'));
            svg.appendChild(createCircle(legendX - 50, 110, 6, '#2dd4bf', 'none'));
            svg.appendChild(createText(legendX, 114, 'd < 0  Inside', 'diagram-label-small'));
            svg.appendChild(createCircle(legendX - 50, 140, 6, '#e8b923', 'none'));
            svg.appendChild(createText(legendX, 144, 'd > 0  Outside', 'diagram-label-small'));
            svg.appendChild(createText(legendX, 180, 'd = 0  On edge', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 25, 'Signed Distance Field: Negative Inside, Positive Outside', 'diagram-title'));

            container.appendChild(svg);
        },

        'sdf-gradient-refraction': function(container, w, h) {
            var svg = createSvg(w, h);

            // Rounded corner detail
            var cornerX = 150;
            var cornerY = 130;
            var cornerR = 50;

            // Arc for corner
            var arcPath = 'M' + cornerX + ',' + (cornerY - cornerR) +
                ' A' + cornerR + ',' + cornerR + ' 0 0 0 ' + (cornerX - cornerR) + ',' + cornerY;
            svg.appendChild(createPath(arcPath, 'none', '#2dd4bf', 2));

            // Extending lines
            svg.appendChild(createLine(cornerX, cornerY - cornerR, cornerX, cornerY - cornerR - 40, 'rgba(45, 212, 191, 0.4)', 1));
            svg.appendChild(createLine(cornerX - cornerR, cornerY, cornerX - cornerR - 40, cornerY, 'rgba(45, 212, 191, 0.4)', 1));

            // Sample point on corner
            var angle = Math.PI * 0.25;
            var sampleX = cornerX - cornerR * Math.sin(angle) * 0.7;
            var sampleY = cornerY - cornerR * Math.cos(angle) * 0.7;

            var sampleDot = createCircle(sampleX, sampleY, 6, '#e8b923', 'none');
            sampleDot.innerHTML = '<animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite"/>';
            svg.appendChild(sampleDot);

            // Gradient samples (finite differences)
            var eps = 20;
            svg.appendChild(createCircle(sampleX + eps, sampleY, 4, 'rgba(232, 185, 35, 0.5)', 'none'));
            svg.appendChild(createCircle(sampleX - eps, sampleY, 4, 'rgba(232, 185, 35, 0.5)', 'none'));
            svg.appendChild(createCircle(sampleX, sampleY + eps, 4, 'rgba(232, 185, 35, 0.5)', 'none'));
            svg.appendChild(createCircle(sampleX, sampleY - eps, 4, 'rgba(232, 185, 35, 0.5)', 'none'));

            // Dashed lines to sample points
            var dashLine1 = createLine(sampleX, sampleY, sampleX + eps, sampleY, 'rgba(255,255,255,0.3)', 1);
            dashLine1.setAttribute('stroke-dasharray', '3,3');
            svg.appendChild(dashLine1);
            var dashLine2 = createLine(sampleX, sampleY, sampleX - eps, sampleY, 'rgba(255,255,255,0.3)', 1);
            dashLine2.setAttribute('stroke-dasharray', '3,3');
            svg.appendChild(dashLine2);

            // Gradient arrow (pointing away from surface)
            var gradLen = 40;
            var gradX = sampleX + gradLen * Math.sin(angle);
            var gradY = sampleY + gradLen * Math.cos(angle);
            svg.appendChild(createArrow(sampleX, sampleY, gradX, gradY, '#ff6b6b'));
            svg.appendChild(createText(gradX + 10, gradY, 'gradient', 'diagram-label-tiny'));

            // Refraction arrow (offset sampling direction)
            var refractX = sampleX - gradLen * 0.7 * Math.sin(angle);
            var refractY = sampleY - gradLen * 0.7 * Math.cos(angle);
            svg.appendChild(createArrow(sampleX, sampleY, refractX, refractY, '#60a5fa'));
            svg.appendChild(createText(refractX - 30, refractY - 5, 'refract', 'diagram-label-tiny'));

            // Formula side
            var formulaX = 420;
            svg.appendChild(createText(formulaX, 50, 'Finite Differences:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 80, 'dx = SDF(p+eps) - SDF(p-eps)', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 100, 'dy = SDF(p+eps) - SDF(p-eps)', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 130, 'gradient = vec2(dx, dy) / 2eps', 'diagram-label-small'));

            svg.appendChild(createText(formulaX, 170, 'Refraction:', 'diagram-label'));
            svg.appendChild(createText(formulaX, 200, 'offset = -gradient * strength', 'diagram-label-small'));
            svg.appendChild(createText(formulaX, 220, 'uv_sample = uv + offset', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 20, 'SDF Gradient = Refraction Direction', 'diagram-title'));

            container.appendChild(svg);
        },

        'separable-blur-pipeline': function(container, w, h) {
            var svg = createSvg(w, h);

            // Input image
            var imgX = 50;
            var imgY = 70;
            var imgSize = 80;
            svg.appendChild(createRect(imgX, imgY, imgSize, imgSize, 4, 'rgba(45, 212, 191, 0.2)', 'rgba(45, 212, 191, 0.5)', 1));
            svg.appendChild(createText(imgX + imgSize/2, imgY + imgSize/2, 'Input', 'diagram-label-small'));

            // H-blur pass
            var hPassX = 200;
            svg.appendChild(createRect(hPassX, imgY, imgSize, imgSize, 4, 'rgba(232, 185, 35, 0.2)', 'rgba(232, 185, 35, 0.5)', 1));
            svg.appendChild(createText(hPassX + imgSize/2, imgY + imgSize/2 - 8, 'H-Blur', 'diagram-label-small'));
            svg.appendChild(createText(hPassX + imgSize/2, imgY + imgSize/2 + 10, '(9 taps)', 'diagram-label-tiny'));

            // Arrow with horizontal kernel visualization
            svg.appendChild(createArrow(imgX + imgSize + 10, imgY + imgSize/2, hPassX - 10, imgY + imgSize/2, 'rgba(255,255,255,0.5)'));
            // Horizontal kernel dots
            for (var i = -2; i <= 2; i++) {
                var kx = (imgX + imgSize + hPassX) / 2 + i * 8;
                var ky = imgY + imgSize/2 - 20;
                var size = 4 - Math.abs(i) * 0.8;
                svg.appendChild(createCircle(kx, ky, size, '#e8b923', 'none'));
            }

            // V-blur pass
            var vPassX = 350;
            svg.appendChild(createRect(vPassX, imgY, imgSize, imgSize, 4, 'rgba(232, 185, 35, 0.2)', 'rgba(232, 185, 35, 0.5)', 1));
            svg.appendChild(createText(vPassX + imgSize/2, imgY + imgSize/2 - 8, 'V-Blur', 'diagram-label-small'));
            svg.appendChild(createText(vPassX + imgSize/2, imgY + imgSize/2 + 10, '(9 taps)', 'diagram-label-tiny'));

            // Arrow with vertical kernel visualization
            svg.appendChild(createArrow(hPassX + imgSize + 10, imgY + imgSize/2, vPassX - 10, imgY + imgSize/2, 'rgba(255,255,255,0.5)'));
            // Vertical kernel dots
            for (var j = -2; j <= 2; j++) {
                var kx2 = (hPassX + imgSize + vPassX) / 2;
                var ky2 = imgY + imgSize/2 - 20 + j * 8;
                var size2 = 4 - Math.abs(j) * 0.8;
                svg.appendChild(createCircle(kx2, ky2, size2, '#e8b923', 'none'));
            }

            // Output
            var outX = 500;
            svg.appendChild(createRect(outX, imgY, imgSize, imgSize, 4, 'rgba(45, 212, 191, 0.3)', '#2dd4bf', 2));
            svg.appendChild(createText(outX + imgSize/2, imgY + imgSize/2, 'Blurred', 'diagram-label-small'));

            svg.appendChild(createArrow(vPassX + imgSize + 10, imgY + imgSize/2, outX - 10, imgY + imgSize/2, 'rgba(255,255,255,0.5)'));

            // Complexity comparison
            svg.appendChild(createText(w/2, 180, '2D blur: N\u00B2 samples  |  Separable: 2N samples  (N=9: 81 vs 18)', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 25, 'Separable Gaussian Blur', 'diagram-title'));

            container.appendChild(svg);
        },

        'linear-sampling-trick': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left side: standard sampling
            var leftX = 120;
            var y = 100;

            svg.appendChild(createText(leftX, 40, 'Standard Sampling', 'diagram-label'));

            // Texel grid
            for (var i = 0; i < 5; i++) {
                var tx = leftX - 60 + i * 30;
                svg.appendChild(createRect(tx, y, 28, 28, 2, 'rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.4)', 1));
                svg.appendChild(createText(tx + 14, y + 18, 'T' + i, 'diagram-label-tiny'));
            }

            // Sample points at texel centers
            var sampleY = y - 25;
            for (var j = 0; j < 5; j++) {
                var sx = leftX - 60 + j * 30 + 14;
                var dot = createCircle(sx, sampleY, 4, '#e8b923', 'none');
                svg.appendChild(dot);
                svg.appendChild(createLine(sx, sampleY + 4, sx, y, 'rgba(232, 185, 35, 0.3)', 1));
            }
            svg.appendChild(createText(leftX, sampleY - 15, '5 fetches', 'diagram-label-tiny'));

            // Right side: linear sampling
            var rightX = 480;

            svg.appendChild(createText(rightX, 40, 'Linear Sampling', 'diagram-label'));

            // Texel grid
            for (var k = 0; k < 5; k++) {
                var tx2 = rightX - 60 + k * 30;
                svg.appendChild(createRect(tx2, y, 28, 28, 2, 'rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.4)', 1));
                svg.appendChild(createText(tx2 + 14, y + 18, 'T' + k, 'diagram-label-tiny'));
            }

            // Sample points BETWEEN texels (fewer samples)
            var sampleY2 = y - 25;
            var linearSamples = [0, 1.38, 3.23]; // Optimized offsets
            linearSamples.forEach(function(offset, idx) {
                var sx2 = rightX - 60 + 14 + 60 + offset * 20;
                var dot2 = createCircle(sx2, sampleY2, 5, '#2dd4bf', 'none');
                dot2.innerHTML = '<animate attributeName="r" values="4;6;4" dur="1.5s" begin="' + (idx * 0.2) + 's" repeatCount="indefinite"/>';
                svg.appendChild(dot2);

                // Bilinear fetch visualization
                if (idx > 0) {
                    var fetchLine = createLine(sx2, sampleY2 + 5, sx2, y, '#2dd4bf', 1);
                    fetchLine.setAttribute('stroke-dasharray', '3,2');
                    svg.appendChild(fetchLine);
                } else {
                    svg.appendChild(createLine(sx2, sampleY2 + 5, sx2, y, '#2dd4bf', 1));
                }
            });
            svg.appendChild(createText(rightX, sampleY2 - 15, '3 fetches!', 'diagram-label-tiny'));

            // Explanation
            svg.appendChild(createText(w/2, 165, 'Sample between texels: GPU bilinear filter gives weighted average for free', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 20, 'Linear Sampling: 2 Texels per Fetch', 'diagram-title'));

            container.appendChild(svg);
        },

        'glass-complete-pipeline': function(container, w, h) {
            var svg = createSvg(w, h);

            var stages = [
                {label: 'Scene FBO', color: '#2dd4bf'},
                {label: 'Downsample', color: '#2dd4bf'},
                {label: 'Blur H+V', color: '#e8b923'},
                {label: 'Kawase x2', color: '#e8b923'},
                {label: 'SDF Mask', color: '#ff6b6b'},
                {label: 'Refract UV', color: '#ff6b6b'},
                {label: 'Composite', color: '#2dd4bf'}
            ];

            var stageW = 85;
            var stageH = 45;
            var startX = 20;
            var y = 70;

            stages.forEach(function(stage, i) {
                var x = startX + i * (stageW + 10);
                var rect = createRect(x, y, stageW, stageH, 6, 'rgba(255,255,255,0.05)', stage.color, 1.5);
                rect.innerHTML = '<animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2s" begin="' + (i * 0.2) + 's" repeatCount="indefinite"/>';
                svg.appendChild(rect);
                svg.appendChild(createText(x + stageW/2, y + stageH/2 + 4, stage.label, 'diagram-label-tiny'));

                if (i < stages.length - 1) {
                    svg.appendChild(createArrow(x + stageW + 2, y + stageH/2, x + stageW + 8, y + stageH/2, 'rgba(255,255,255,0.4)'));
                }
            });

            svg.appendChild(createText(w/2, 25, 'Complete Frosted Glass Pipeline', 'diagram-title'));
            svg.appendChild(createText(w/2, 145, 'Teal = texture ops | Gold = blur | Red = SDF compositing', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        // ============================================
        // GPU CACHE HIERARCHY DIAGRAMS
        // ============================================

        'cache-hierarchy-overview': function(container, w, h) {
            var svg = createSvg(w, h);

            // Pyramid layers representing memory hierarchy
            var levels = [
                { name: 'Registers', size: '~256KB/SM', latency: '~1 cycle', y: 40, width: 120, color: '#2dd4bf' },
                { name: 'L1 Cache', size: '32-128KB/SM', latency: '~20-30 cycles', y: 90, width: 200, color: '#2dd4bf' },
                { name: 'L2 Cache', size: '2-6MB shared', latency: '~100-200 cycles', y: 140, width: 320, color: '#e8b923' },
                { name: 'VRAM (GDDR6/HBM)', size: '8-24GB', latency: '~400-800 cycles', y: 200, width: 500, color: '#ff6b6b' }
            ];

            var centerX = w / 2;

            // Add gradient defs
            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML =
                '<linearGradient id="cacheGradTeal" x1="0%" y1="0%" x2="100%" y2="0%">' +
                    '<stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.1"/>' +
                    '<stop offset="50%" stop-color="#2dd4bf" stop-opacity="0.3"/>' +
                    '<stop offset="100%" stop-color="#2dd4bf" stop-opacity="0.1"/>' +
                '</linearGradient>' +
                '<linearGradient id="cacheGradGold" x1="0%" y1="0%" x2="100%" y2="0%">' +
                    '<stop offset="0%" stop-color="#e8b923" stop-opacity="0.1"/>' +
                    '<stop offset="50%" stop-color="#e8b923" stop-opacity="0.3"/>' +
                    '<stop offset="100%" stop-color="#e8b923" stop-opacity="0.1"/>' +
                '</linearGradient>' +
                '<linearGradient id="cacheGradRed" x1="0%" y1="0%" x2="100%" y2="0%">' +
                    '<stop offset="0%" stop-color="#ff6b6b" stop-opacity="0.1"/>' +
                    '<stop offset="50%" stop-color="#ff6b6b" stop-opacity="0.3"/>' +
                    '<stop offset="100%" stop-color="#ff6b6b" stop-opacity="0.1"/>' +
                '</linearGradient>';
            svg.appendChild(defs);

            levels.forEach(function(level, i) {
                var rect = createRect(centerX - level.width/2, level.y, level.width, 40, 6,
                    i < 2 ? 'url(#cacheGradTeal)' : (i === 2 ? 'url(#cacheGradGold)' : 'url(#cacheGradRed)'),
                    level.color, 1.5);
                rect.innerHTML = '<animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(rect);

                svg.appendChild(createText(centerX, level.y + 16, level.name, 'diagram-label'));
                svg.appendChild(createText(centerX, level.y + 32, level.size + ' | ' + level.latency, 'diagram-label-tiny'));
            });

            // Speed/Size labels on sides
            svg.appendChild(createText(80, 120, 'FASTER', 'diagram-label-small'));
            svg.appendChild(createText(80, 140, 'SMALLER', 'diagram-label-tiny'));
            svg.appendChild(createArrow(80, 160, 80, 80, '#2dd4bf'));

            svg.appendChild(createText(w - 80, 120, 'SLOWER', 'diagram-label-small'));
            svg.appendChild(createText(w - 80, 140, 'LARGER', 'diagram-label-tiny'));
            svg.appendChild(createArrow(w - 80, 80, w - 80, 160, '#ff6b6b'));

            // Data flow animation - dot traveling down
            var dataPath = createCircle(centerX, 60, 6, '#fff', 'none');
            dataPath.innerHTML =
                '<animate attributeName="cy" values="60;100;150;220;220;150;100;60" dur="4s" repeatCount="indefinite"/>' +
                '<animate attributeName="fill" values="#2dd4bf;#2dd4bf;#e8b923;#ff6b6b;#ff6b6b;#e8b923;#2dd4bf;#2dd4bf" dur="4s" repeatCount="indefinite"/>';
            svg.appendChild(dataPath);

            svg.appendChild(createText(centerX + 230, 280, 'Texture fetch travels down until data is found', 'diagram-label-small'));

            svg.appendChild(createText(centerX, 285, 'GPU Memory Hierarchy', 'diagram-title'));

            container.appendChild(svg);
        },

        'cache-latency-comparison': function(container, w, h) {
            var svg = createSvg(w, h);

            var bars = [
                { name: 'Registers', cycles: 1, color: '#2dd4bf' },
                { name: 'L1 Cache', cycles: 25, color: '#2dd4bf' },
                { name: 'L2 Cache', cycles: 150, color: '#e8b923' },
                { name: 'VRAM', cycles: 600, color: '#ff6b6b' }
            ];

            var maxCycles = 600;
            var barHeight = 35;
            var startX = 120;
            var maxWidth = w - 180;
            var startY = 50;

            bars.forEach(function(bar, i) {
                var y = startY + i * (barHeight + 15);
                var barWidth = (bar.cycles / maxCycles) * maxWidth;

                // Label
                svg.appendChild(createText(startX - 10, y + barHeight/2, bar.name, 'diagram-label-small'));

                // Bar background
                svg.appendChild(createRect(startX, y, maxWidth, barHeight, 4, 'rgba(255,255,255,0.05)', 'none'));

                // Actual bar with animation
                var rect = createRect(startX, y, 0, barHeight, 4, bar.color + '40', bar.color, 1);
                rect.innerHTML = '<animate attributeName="width" from="0" to="' + barWidth + '" dur="1.5s" begin="' + (i * 0.2) + 's" fill="freeze"/>';
                svg.appendChild(rect);

                // Cycle count
                var cycleText = createText(startX + barWidth + 35, y + barHeight/2, '~' + bar.cycles + ' cycles', 'diagram-label-tiny');
                cycleText.innerHTML = '<animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="' + (i * 0.2 + 1.2) + 's" fill="freeze"/>';
                cycleText.setAttribute('opacity', '0');
                svg.appendChild(cycleText);
            });

            // Scale reference
            svg.appendChild(createText(startX + maxWidth/2, 215, '10-20x faster to hit L1 than VRAM', 'diagram-label'));

            svg.appendChild(createText(w/2, 25, 'Memory Access Latency (GPU Cycles)', 'diagram-title'));

            container.appendChild(svg);
        },

        'cache-line-fetch': function(container, w, h) {
            var svg = createSvg(w, h);

            var centerX = w / 2;
            var gridStartX = centerX - 160;
            var gridY = 80;
            var texelSize = 20;

            // 16x8 texture grid representation
            for (var ty = 0; ty < 8; ty++) {
                for (var tx = 0; tx < 16; tx++) {
                    var x = gridStartX + tx * texelSize;
                    var y = gridY + ty * texelSize;
                    var fill = 'rgba(45, 212, 191, 0.1)';

                    // Highlight cache line (4 texels wide, row 3-4)
                    if (ty >= 3 && ty <= 4 && tx >= 5 && tx < 9) {
                        fill = 'rgba(45, 212, 191, 0.4)';
                    }

                    var rect = createRect(x, y, texelSize - 1, texelSize - 1, 2, fill, 'rgba(45, 212, 191, 0.3)', 0.5);
                    svg.appendChild(rect);
                }
            }

            // Sample point (single texel request)
            var sampleX = gridStartX + 6.5 * texelSize;
            var sampleY = gridY + 3.5 * texelSize;
            var sampleDot = createCircle(sampleX, sampleY, 4, '#fff', 'none');
            sampleDot.innerHTML = '<animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite"/>';
            svg.appendChild(sampleDot);

            // Cache line bracket
            var cacheLineX = gridStartX + 5 * texelSize;
            var cacheLineY = gridY + 3 * texelSize;
            var bracket = createPath(
                'M' + cacheLineX + ',' + (cacheLineY - 8) +
                ' L' + cacheLineX + ',' + (cacheLineY - 15) +
                ' L' + (cacheLineX + 4 * texelSize) + ',' + (cacheLineY - 15) +
                ' L' + (cacheLineX + 4 * texelSize) + ',' + (cacheLineY - 8),
                'none', '#e8b923', 2
            );
            svg.appendChild(bracket);
            svg.appendChild(createText(cacheLineX + 2 * texelSize, cacheLineY - 28, 'Cache Line (32 bytes = 8 RGBA8 texels)', 'diagram-label-small'));

            // Arrow from sample to explanation
            svg.appendChild(createArrow(sampleX + 80, sampleY, sampleX + 140, sampleY, '#fff'));

            // Explanation box
            var explainX = sampleX + 150;
            var explainRect = createRect(explainX, sampleY - 35, 160, 70, 6, 'rgba(232, 185, 35, 0.1)', '#e8b923', 1);
            svg.appendChild(explainRect);
            svg.appendChild(createText(explainX + 80, sampleY - 15, 'Request 1 texel', 'diagram-label-small'));
            svg.appendChild(createText(explainX + 80, sampleY + 5, '→ GPU fetches 8+', 'diagram-label-small'));
            svg.appendChild(createText(explainX + 80, sampleY + 22, '(entire cache line)', 'diagram-label-tiny'));

            svg.appendChild(createText(centerX, 25, 'Cache Line Fetching', 'diagram-title'));
            svg.appendChild(createText(centerX, 255, 'Neighboring samples hit already-cached data = FREE', 'diagram-label'));

            container.appendChild(svg);
        },

        'warp-coalescing': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left side: Good coalescing
            var leftX = 180;
            var threadY = 70;

            svg.appendChild(createText(leftX, 35, 'Coalesced Access', 'diagram-label'));
            svg.appendChild(createText(leftX, 52, '(1 memory transaction)', 'diagram-label-tiny'));

            // Threads
            for (var t = 0; t < 8; t++) {
                var tx = leftX - 70 + t * 20;
                var threadRect = createRect(tx, threadY, 16, 25, 3, 'rgba(45, 212, 191, 0.3)', '#2dd4bf', 1);
                threadRect.innerHTML = '<animate attributeName="fill" values="rgba(45,212,191,0.3);rgba(45,212,191,0.6);rgba(45,212,191,0.3)" dur="1.5s" begin="' + (t * 0.05) + 's" repeatCount="indefinite"/>';
                svg.appendChild(threadRect);
                svg.appendChild(createText(tx + 8, threadY + 15, 'T' + t, 'diagram-label-tiny'));
            }

            // Arrows converging to cache line
            var cacheY = threadY + 60;
            for (var a = 0; a < 8; a++) {
                var ax = leftX - 62 + a * 20;
                svg.appendChild(createLine(ax, threadY + 28, ax, cacheY, 'rgba(45, 212, 191, 0.4)', 1));
            }

            // Single cache line
            var cacheLine1 = createRect(leftX - 70, cacheY, 160, 30, 4, 'rgba(45, 212, 191, 0.2)', '#2dd4bf', 2);
            cacheLine1.innerHTML = '<animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite"/>';
            svg.appendChild(cacheLine1);
            svg.appendChild(createText(leftX, cacheY + 18, 'Cache Line', 'diagram-label-small'));

            // Memory transaction indicator
            svg.appendChild(createText(leftX, cacheY + 55, '1 fetch', 'diagram-label'));

            // Right side: Scattered access
            var rightX = w - 180;

            svg.appendChild(createText(rightX, 35, 'Scattered Access', 'diagram-label'));
            svg.appendChild(createText(rightX, 52, '(8 memory transactions!)', 'diagram-label-tiny'));

            // Threads
            for (var t2 = 0; t2 < 8; t2++) {
                var tx2 = rightX - 70 + t2 * 20;
                var threadRect2 = createRect(tx2, threadY, 16, 25, 3, 'rgba(255, 107, 107, 0.3)', '#ff6b6b', 1);
                threadRect2.innerHTML = '<animate attributeName="fill" values="rgba(255,107,107,0.3);rgba(255,107,107,0.6);rgba(255,107,107,0.3)" dur="1.5s" begin="' + (t2 * 0.1) + 's" repeatCount="indefinite"/>';
                svg.appendChild(threadRect2);
                svg.appendChild(createText(tx2 + 8, threadY + 15, 'T' + t2, 'diagram-label-tiny'));
            }

            // Scattered cache lines
            var scatterOffsets = [-30, 50, -60, 80, 20, -40, 60, -20];
            for (var s = 0; s < 8; s++) {
                var sx = rightX - 62 + s * 20;
                var cacheX = rightX + scatterOffsets[s];
                svg.appendChild(createLine(sx, threadY + 28, cacheX, cacheY, 'rgba(255, 107, 107, 0.4)', 1));

                var miniCache = createRect(cacheX - 10, cacheY, 20, 30, 2, 'rgba(255, 107, 107, 0.2)', '#ff6b6b', 1);
                miniCache.innerHTML = '<animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="1s" begin="' + (s * 0.1) + 's" repeatCount="indefinite"/>';
                svg.appendChild(miniCache);
            }

            svg.appendChild(createText(rightX, cacheY + 55, '8 fetches', 'diagram-label'));

            // VS divider
            svg.appendChild(createLine(w/2, 25, w/2, 200, 'rgba(255,255,255,0.1)', 1));
            svg.appendChild(createText(w/2, 140, 'VS', 'diagram-label-small'));

            // Performance comparison
            var perfY = 230;
            svg.appendChild(createRect(100, perfY, 150, 25, 4, 'rgba(45, 212, 191, 0.3)', '#2dd4bf', 1));
            svg.appendChild(createText(175, perfY + 15, 'Fast ✓', 'diagram-label-small'));

            svg.appendChild(createRect(w - 250, perfY, 150, 25, 4, 'rgba(255, 107, 107, 0.3)', '#ff6b6b', 1));
            svg.appendChild(createText(w - 175, perfY + 15, '8x Slower ✗', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 280, 'Warp Memory Coalescing', 'diagram-title'));

            container.appendChild(svg);
        },

        'cache-miss-patterns': function(container, w, h) {
            var svg = createSvg(w, h);

            var patterns = [
                { name: 'Random UVs', desc: 'Noise/stippling', x: 100 },
                { name: 'Dependent Reads', desc: 'UV from texture', x: 280 },
                { name: 'Working Set', desc: 'Too many textures', x: 460 },
                { name: 'Large UV Jumps', desc: 'Mip discontinuity', x: 640 }
            ];

            var gridY = 100;
            var gridSize = 80;

            patterns.forEach(function(pattern, pi) {
                var px = pattern.x;

                // Label
                svg.appendChild(createText(px, 45, pattern.name, 'diagram-label'));
                svg.appendChild(createText(px, 62, pattern.desc, 'diagram-label-tiny'));

                // Mini texture grid
                for (var gy = 0; gy < 4; gy++) {
                    for (var gx = 0; gx < 4; gx++) {
                        var cellX = px - gridSize/2 + gx * 20;
                        var cellY = gridY + gy * 20;
                        svg.appendChild(createRect(cellX, cellY, 18, 18, 2, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.2)', 0.5));
                    }
                }

                // Pattern-specific visualization
                if (pi === 0) {
                    // Random dots
                    var randomPositions = [[0.2, 0.8], [0.9, 0.1], [0.1, 0.3], [0.7, 0.6], [0.4, 0.9]];
                    randomPositions.forEach(function(pos, ri) {
                        var rx = px - gridSize/2 + pos[0] * gridSize;
                        var ry = gridY + pos[1] * gridSize;
                        var dot = createCircle(rx, ry, 3, '#ff6b6b', 'none');
                        dot.innerHTML = '<animate attributeName="opacity" values="1;0.3;1" dur="0.5s" begin="' + (ri * 0.15) + 's" repeatCount="indefinite"/>';
                        svg.appendChild(dot);
                    });
                } else if (pi === 1) {
                    // Chain visualization
                    var chain1 = createCircle(px - 20, gridY + 30, 4, '#e8b923', 'none');
                    var chain2 = createCircle(px + 20, gridY + 50, 4, '#ff6b6b', 'none');
                    chain1.innerHTML = '<animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite"/>';
                    chain2.innerHTML = '<animate attributeName="r" values="4;6;4" dur="1s" begin="0.5s" repeatCount="indefinite"/>';
                    svg.appendChild(chain1);
                    svg.appendChild(createArrow(px - 15, gridY + 35, px + 15, gridY + 45, 'rgba(232, 185, 35, 0.6)'));
                    svg.appendChild(chain2);
                    svg.appendChild(createText(px, gridY + 95, 'wait...', 'diagram-label-tiny'));
                } else if (pi === 2) {
                    // Multiple texture boxes
                    for (var mt = 0; mt < 3; mt++) {
                        var miniTex = createRect(px - 35 + mt * 25, gridY + 20, 20, 40, 3, 'rgba(255, 107, 107, 0.2)', '#ff6b6b', 1);
                        miniTex.innerHTML = '<animate attributeName="stroke-opacity" values="0.4;1;0.4" dur="1.5s" begin="' + (mt * 0.3) + 's" repeatCount="indefinite"/>';
                        svg.appendChild(miniTex);
                    }
                    svg.appendChild(createText(px, gridY + 95, 'L2 overflow', 'diagram-label-tiny'));
                } else {
                    // UV jump arrows
                    svg.appendChild(createArrow(px - 30, gridY + 20, px + 25, gridY + 60, '#ff6b6b'));
                    svg.appendChild(createArrow(px + 25, gridY + 60, px - 25, gridY + 30, 'rgba(255, 107, 107, 0.5)'));
                    svg.appendChild(createText(px, gridY + 95, 'cache thrash', 'diagram-label-tiny'));
                }
            });

            // Miss indicator at bottom
            svg.appendChild(createRect(w/2 - 200, 240, 400, 30, 6, 'rgba(255, 107, 107, 0.1)', '#ff6b6b', 1));
            svg.appendChild(createText(w/2, 258, 'All patterns cause cache misses → 10-20x latency penalty', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 295, 'Common Cache Miss Patterns', 'diagram-title'));

            container.appendChild(svg);
        },

        'mipmap-cache-benefit': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left: Full resolution nightmare
            var leftX = 170;
            var leftY = 80;

            svg.appendChild(createText(leftX, 35, 'No Mipmaps (Far Surface)', 'diagram-label'));

            // Large texture with scattered samples
            var bigTex = createRect(leftX - 80, leftY, 160, 160, 4, 'rgba(255, 107, 107, 0.1)', '#ff6b6b', 1);
            svg.appendChild(bigTex);
            svg.appendChild(createText(leftX, leftY - 10, '1024×1024', 'diagram-label-tiny'));

            // Scattered sample points (minification aliasing)
            var scatterSamples = [[0.1, 0.1], [0.9, 0.2], [0.2, 0.8], [0.8, 0.9], [0.5, 0.5], [0.3, 0.4], [0.7, 0.3]];
            scatterSamples.forEach(function(pos, si) {
                var sx = leftX - 80 + pos[0] * 160;
                var sy = leftY + pos[1] * 160;
                var dot = createCircle(sx, sy, 3, '#ff6b6b', 'none');
                dot.innerHTML = '<animate attributeName="opacity" values="1;0.3;1" dur="0.4s" begin="' + (si * 0.08) + 's" repeatCount="indefinite"/>';
                svg.appendChild(dot);
            });

            svg.appendChild(createText(leftX, leftY + 180, 'Many cache lines touched', 'diagram-label-tiny'));
            svg.appendChild(createText(leftX, leftY + 195, '7+ fetches', 'diagram-label-small'));

            // Right: Mipmap efficiency
            var rightX = w - 170;

            svg.appendChild(createText(rightX, 35, 'With Mipmaps (Far Surface)', 'diagram-label'));

            // Mip pyramid
            var mips = [
                { size: 140, label: '1024', y: leftY + 20 },
                { size: 100, label: '512', y: leftY + 50 },
                { size: 60, label: '256', y: leftY + 80 },
                { size: 30, label: '128', y: leftY + 105 }
            ];

            mips.forEach(function(mip, mi) {
                var opacity = mi === 3 ? 0.4 : 0.1;
                var strokeColor = mi === 3 ? '#2dd4bf' : 'rgba(45, 212, 191, 0.3)';
                var mipRect = createRect(rightX - mip.size/2, mip.y, mip.size, 20, 2,
                    'rgba(45, 212, 191, ' + opacity + ')', strokeColor, mi === 3 ? 2 : 1);
                if (mi === 3) {
                    mipRect.innerHTML = '<animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>';
                }
                svg.appendChild(mipRect);
            });

            svg.appendChild(createText(rightX + 90, leftY + 113, '← Used mip', 'diagram-label-tiny'));

            // Compact sample region in selected mip
            var compactSamples = [[0.3, 0.3], [0.5, 0.5], [0.7, 0.4], [0.4, 0.6]];
            compactSamples.forEach(function(pos, ci) {
                var cx = rightX - 15 + pos[0] * 30;
                var cy = leftY + 105 + pos[1] * 20;
                var dot = createCircle(cx, cy, 2, '#2dd4bf', 'none');
                dot.innerHTML = '<animate attributeName="r" values="2;3;2" dur="1s" begin="' + (ci * 0.1) + 's" repeatCount="indefinite"/>';
                svg.appendChild(dot);
            });

            svg.appendChild(createText(rightX, leftY + 180, 'All samples in 1 cache line!', 'diagram-label-tiny'));
            svg.appendChild(createText(rightX, leftY + 195, '1 fetch', 'diagram-label-small'));

            // VS divider
            svg.appendChild(createLine(w/2, 25, w/2, 220, 'rgba(255,255,255,0.1)', 1));
            svg.appendChild(createText(w/2, 140, 'VS', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 260, 'Mipmap Cache Efficiency', 'diagram-title'));

            container.appendChild(svg);
        },

        'cache-hit-rate-gauge': function(container, w, h) {
            var svg = createSvg(w, h);

            var gaugeY = 90;
            var gaugeWidth = 500;
            var gaugeHeight = 40;
            var gaugeX = (w - gaugeWidth) / 2;

            // Gradient background for gauge
            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML =
                '<linearGradient id="hitRateGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
                    '<stop offset="0%" stop-color="#ff6b6b"/>' +
                    '<stop offset="40%" stop-color="#e8b923"/>' +
                    '<stop offset="70%" stop-color="#2dd4bf"/>' +
                    '<stop offset="100%" stop-color="#2dd4bf"/>' +
                '</linearGradient>';
            svg.appendChild(defs);

            // Gauge background
            svg.appendChild(createRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 6, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.2)', 1));

            // Filled portion
            var fillRect = createRect(gaugeX, gaugeY, 0, gaugeHeight, 6, 'url(#hitRateGrad)', 'none');
            fillRect.innerHTML = '<animate attributeName="width" values="0;400;350;400;380;400" dur="4s" repeatCount="indefinite"/>';
            svg.appendChild(fillRect);

            // Percentage markers
            var markers = [0, 25, 50, 75, 100];
            markers.forEach(function(pct) {
                var mx = gaugeX + (pct / 100) * gaugeWidth;
                svg.appendChild(createLine(mx, gaugeY + gaugeHeight, mx, gaugeY + gaugeHeight + 8, 'rgba(255,255,255,0.4)', 1));
                svg.appendChild(createText(mx, gaugeY + gaugeHeight + 20, pct + '%', 'diagram-label-tiny'));
            });

            // Zone labels
            svg.appendChild(createText(gaugeX + 75, gaugeY - 15, 'Poor (<60%)', 'diagram-label-tiny'));
            svg.appendChild(createText(gaugeX + gaugeWidth/2, gaugeY - 15, 'Moderate', 'diagram-label-tiny'));
            svg.appendChild(createText(gaugeX + gaugeWidth - 60, gaugeY - 15, 'Good (>80%)', 'diagram-label-tiny'));

            // Title
            svg.appendChild(createText(w/2, 25, 'L1 Cache Hit Rate', 'diagram-title'));
            svg.appendChild(createText(w/2, 170, 'Higher = more samples served from fast cache', 'diagram-label-small'));

            container.appendChild(svg);
        },

        'latency-hiding': function(container, w, h) {
            var svg = createSvg(w, h);

            var lanes = 4;
            var laneHeight = 40;
            var laneY = 70;
            var timelineWidth = 550;
            var startX = 120;

            // Lane labels
            for (var lane = 0; lane < lanes; lane++) {
                var ly = laneY + lane * (laneHeight + 10);
                svg.appendChild(createText(60, ly + laneHeight/2, 'Warp ' + lane, 'diagram-label-small'));
                svg.appendChild(createRect(startX, ly, timelineWidth, laneHeight, 4, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.1)', 0.5));
            }

            // Execution blocks per warp
            var warpSchedule = [
                [{start: 0, dur: 0.15, type: 'exec'}, {start: 0.15, dur: 0.35, type: 'wait'}, {start: 0.5, dur: 0.2, type: 'exec'}, {start: 0.7, dur: 0.3, type: 'wait'}],
                [{start: 0.15, dur: 0.2, type: 'exec'}, {start: 0.35, dur: 0.25, type: 'wait'}, {start: 0.6, dur: 0.15, type: 'exec'}, {start: 0.75, dur: 0.25, type: 'wait'}],
                [{start: 0.35, dur: 0.15, type: 'exec'}, {start: 0.5, dur: 0.3, type: 'wait'}, {start: 0.8, dur: 0.2, type: 'exec'}],
                [{start: 0.5, dur: 0.1, type: 'exec'}, {start: 0.6, dur: 0.2, type: 'wait'}, {start: 0.8, dur: 0.15, type: 'exec'}]
            ];

            warpSchedule.forEach(function(warp, wi) {
                var wy = laneY + wi * (laneHeight + 10);
                warp.forEach(function(block, bi) {
                    var bx = startX + block.start * timelineWidth;
                    var bw = block.dur * timelineWidth;
                    var color = block.type === 'exec' ? '#2dd4bf' : 'rgba(255, 107, 107, 0.3)';
                    var strokeColor = block.type === 'exec' ? '#2dd4bf' : '#ff6b6b';

                    var blockRect = createRect(bx, wy + 5, bw, laneHeight - 10, 3, color + '40', strokeColor, 1);
                    if (block.type === 'exec') {
                        blockRect.innerHTML = '<animate attributeName="fill-opacity" values="0.3;0.6;0.3" dur="1s" begin="' + (block.start * 2) + 's" repeatCount="indefinite"/>';
                    }
                    svg.appendChild(blockRect);

                    if (block.type === 'wait' && bw > 40) {
                        svg.appendChild(createText(bx + bw/2, wy + laneHeight/2 + 2, 'waiting...', 'diagram-label-tiny'));
                    }
                });
            });

            // Time arrow
            svg.appendChild(createArrow(startX, laneY + lanes * (laneHeight + 10) + 15, startX + timelineWidth, laneY + lanes * (laneHeight + 10) + 15, 'rgba(255,255,255,0.4)'));
            svg.appendChild(createText(startX + timelineWidth/2, laneY + lanes * (laneHeight + 10) + 35, 'Time →', 'diagram-label-tiny'));

            // Legend
            svg.appendChild(createRect(startX + 380, 240, 15, 15, 2, 'rgba(45, 212, 191, 0.4)', '#2dd4bf', 1));
            svg.appendChild(createText(startX + 420, 250, 'Execute', 'diagram-label-tiny'));
            svg.appendChild(createRect(startX + 470, 240, 15, 15, 2, 'rgba(255, 107, 107, 0.3)', '#ff6b6b', 1));
            svg.appendChild(createText(startX + 520, 250, 'Stalled', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 25, 'Latency Hiding: While One Warp Waits, Others Execute', 'diagram-title'));

            container.appendChild(svg);
        },

        'morton-order': function(container, w, h) {
            var svg = createSvg(w, h);

            var leftX = 170;
            var rightX = w - 200;
            var gridY = 70;
            var cellSize = 30;

            // Left: Linear order
            svg.appendChild(createText(leftX, 40, 'Linear (Row-Major)', 'diagram-label'));

            var linearPath = 'M';
            for (var row = 0; row < 4; row++) {
                for (var col = 0; col < 4; col++) {
                    var lx = leftX - 60 + col * cellSize;
                    var ly = gridY + row * cellSize;
                    var idx = row * 4 + col;

                    svg.appendChild(createRect(lx, ly, cellSize - 2, cellSize - 2, 2, 'rgba(255, 107, 107, 0.15)', 'rgba(255, 107, 107, 0.4)', 0.5));
                    svg.appendChild(createText(lx + cellSize/2 - 1, ly + cellSize/2, idx.toString(), 'diagram-label-tiny'));

                    var cx = lx + cellSize/2 - 1;
                    var cy = ly + cellSize/2;
                    linearPath += (idx === 0 ? '' : ' L') + cx + ',' + cy;
                }
            }

            var linearLine = createPath(linearPath, 'none', '#ff6b6b', 1.5);
            linearLine.setAttribute('stroke-dasharray', '4,2');
            svg.appendChild(linearLine);

            svg.appendChild(createText(leftX, gridY + 140, 'Poor 2D locality', 'diagram-label-tiny'));

            // Right: Morton order (Z-curve)
            svg.appendChild(createText(rightX, 40, 'Morton Order (Z-curve)', 'diagram-label'));

            // Morton order indices for 4x4
            var mortonOrder = [0, 1, 4, 5, 2, 3, 6, 7, 8, 9, 12, 13, 10, 11, 14, 15];
            var mortonToGrid = {};
            mortonOrder.forEach(function(idx, mi) {
                mortonToGrid[idx] = mi;
            });

            var mortonPath = 'M';
            for (var mi = 0; mi < 16; mi++) {
                var gridIdx = mortonOrder.indexOf(mi);
                var mrow = Math.floor(gridIdx / 4);
                var mcol = gridIdx % 4;
                var mx = rightX - 60 + mcol * cellSize;
                var my = gridY + mrow * cellSize;

                svg.appendChild(createRect(mx, my, cellSize - 2, cellSize - 2, 2, 'rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.4)', 0.5));
                svg.appendChild(createText(mx + cellSize/2 - 1, my + cellSize/2, mi.toString(), 'diagram-label-tiny'));

                var cx2 = mx + cellSize/2 - 1;
                var cy2 = my + cellSize/2;
                mortonPath += (mi === 0 ? '' : ' L') + cx2 + ',' + cy2;
            }

            var mortonLine = createPath(mortonPath, 'none', '#2dd4bf', 1.5);
            mortonLine.setAttribute('stroke-dasharray', '200');
            mortonLine.setAttribute('stroke-dashoffset', '200');
            mortonLine.innerHTML = '<animate attributeName="stroke-dashoffset" from="200" to="0" dur="3s" repeatCount="indefinite"/>';
            svg.appendChild(mortonLine);

            svg.appendChild(createText(rightX, gridY + 140, 'Preserves 2D locality!', 'diagram-label-tiny'));

            // VS divider
            svg.appendChild(createLine(w/2, 30, w/2, 200, 'rgba(255,255,255,0.1)', 1));
            svg.appendChild(createText(w/2, 120, 'VS', 'diagram-label-small'));

            // Explanation
            svg.appendChild(createText(w/2, 240, 'Morton order keeps 2D-neighboring texels close in memory', 'diagram-label'));

            svg.appendChild(createText(w/2, 265, 'GPU Texture Memory Layout', 'diagram-title'));

            container.appendChild(svg);
        },

        'dependent-read-chain': function(container, w, h) {
            var svg = createSvg(w, h);

            var stages = [
                { label: 'Sample UV Map', time: '~400 cycles', x: 100 },
                { label: 'Compute New UV', time: '~4 cycles', x: 280 },
                { label: 'Sample Albedo', time: '~400 cycles', x: 460 },
                { label: 'Continue Shader', time: '...', x: 620 }
            ];

            var stageY = 80;
            var stageH = 50;

            stages.forEach(function(stage, si) {
                var isTexFetch = si === 0 || si === 2;
                var color = isTexFetch ? '#ff6b6b' : '#2dd4bf';

                var stageRect = createRect(stage.x - 60, stageY, 120, stageH, 6,
                    isTexFetch ? 'rgba(255, 107, 107, 0.2)' : 'rgba(45, 212, 191, 0.2)',
                    color, 1.5);

                if (isTexFetch) {
                    stageRect.innerHTML = '<animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" begin="' + (si * 0.5) + 's" repeatCount="indefinite"/>';
                }
                svg.appendChild(stageRect);

                svg.appendChild(createText(stage.x, stageY + 20, stage.label, 'diagram-label-small'));
                svg.appendChild(createText(stage.x, stageY + 38, stage.time, 'diagram-label-tiny'));

                if (si < stages.length - 1) {
                    var arrow = createArrow(stage.x + 65, stageY + stageH/2, stages[si + 1].x - 65, stageY + stageH/2, 'rgba(255,255,255,0.4)');
                    svg.appendChild(arrow);

                    // "Must wait" label
                    if (si === 0 || si === 2) {
                        svg.appendChild(createText((stage.x + stages[si + 1].x) / 2, stageY + stageH/2 - 15, 'wait', 'diagram-label-tiny'));
                    }
                }
            });

            // Total time
            svg.appendChild(createRect(w/2 - 100, 160, 200, 30, 6, 'rgba(255, 107, 107, 0.1)', '#ff6b6b', 1));
            svg.appendChild(createText(w/2, 178, 'Total: ~804 cycles (serialized!)', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 30, 'Dependent Texture Read Latency', 'diagram-title'));

            container.appendChild(svg);
        },

        'architecture-comparison': function(container, w, h) {
            var svg = createSvg(w, h);

            var archs = [
                {
                    name: 'NVIDIA (Ampere)',
                    x: 130,
                    levels: [
                        { name: 'L1/Shared', size: '128KB', y: 65 },
                        { name: 'L2', size: '6MB', y: 115 },
                        { name: 'GDDR6X', size: '24GB', y: 165 }
                    ]
                },
                {
                    name: 'AMD (RDNA 3)',
                    x: 375,
                    levels: [
                        { name: 'L0 Vector', size: '32KB', y: 55 },
                        { name: 'L1 Scalar', size: '16KB', y: 85 },
                        { name: 'L2', size: '6MB', y: 125 },
                        { name: 'Infinity Cache', size: '96MB', y: 165 },
                        { name: 'GDDR6', size: '24GB', y: 200 }
                    ]
                },
                {
                    name: 'Mobile (Adreno)',
                    x: 620,
                    levels: [
                        { name: 'L1', size: '16KB', y: 65 },
                        { name: 'L2', size: '512KB', y: 115 },
                        { name: 'LPDDR5', size: 'Shared', y: 165 }
                    ]
                }
            ];

            archs.forEach(function(arch) {
                svg.appendChild(createText(arch.x, 30, arch.name, 'diagram-label'));

                arch.levels.forEach(function(level, li) {
                    var levelWidth = 100 - li * 10;
                    var color = li < 2 ? '#2dd4bf' : (li < 4 ? '#e8b923' : '#ff6b6b');

                    var rect = createRect(arch.x - levelWidth/2, level.y, levelWidth, 25, 4,
                        color + '20', color, 1);
                    svg.appendChild(rect);
                    svg.appendChild(createText(arch.x, level.y + 14, level.name, 'diagram-label-tiny'));
                    svg.appendChild(createText(arch.x + levelWidth/2 + 25, level.y + 14, level.size, 'diagram-label-tiny'));
                });
            });

            svg.appendChild(createText(w/2, 245, 'Cache architectures vary significantly—profile on target hardware', 'diagram-label-small'));

            container.appendChild(svg);
        },

        // ============================================
        // APPLE LIQUID GLASS ARTICLE DIAGRAMS
        // ============================================

        // Overview of Liquid Glass effect components
        'liquid-glass-overview': function(container, w, h) {
            var svg = createSvg(w, h);

            // Background
            svg.appendChild(createRect(0, 0, w, h, 0, '#0a0f14', 'none'));

            // Center glass panel representation
            var panelX = w/2 - 120;
            var panelY = 60;
            var panelW = 240;
            var panelH = 140;

            // Outer glow
            var glowRect = createRect(panelX - 20, panelY - 20, panelW + 40, panelH + 40, 30, 'none', 'none');
            glowRect.innerHTML = '<animate attributeName="fill" values="rgba(45,212,191,0.05);rgba(45,212,191,0.1);rgba(45,212,191,0.05)" dur="3s" repeatCount="indefinite"/>';
            svg.appendChild(glowRect);

            // Main glass panel with squircle-like corners
            var panelPath = createPath(
                'M' + (panelX + 25) + ',' + panelY +
                ' Q' + panelX + ',' + panelY + ' ' + panelX + ',' + (panelY + 25) +
                ' L' + panelX + ',' + (panelY + panelH - 25) +
                ' Q' + panelX + ',' + (panelY + panelH) + ' ' + (panelX + 25) + ',' + (panelY + panelH) +
                ' L' + (panelX + panelW - 25) + ',' + (panelY + panelH) +
                ' Q' + (panelX + panelW) + ',' + (panelY + panelH) + ' ' + (panelX + panelW) + ',' + (panelY + panelH - 25) +
                ' L' + (panelX + panelW) + ',' + (panelY + 25) +
                ' Q' + (panelX + panelW) + ',' + panelY + ' ' + (panelX + panelW - 25) + ',' + panelY + ' Z',
                'rgba(255,255,255,0.08)', 'rgba(45,212,191,0.5)', 1.5
            );
            svg.appendChild(panelPath);

            // Bevel highlight (left edge)
            var bevelLeft = createPath(
                'M' + panelX + ',' + (panelY + 30) + ' L' + panelX + ',' + (panelY + panelH - 30),
                'none', 'url(#bevelGrad)', 3
            );
            svg.appendChild(bevelLeft);

            // Specular highlight dot
            var specDot = createCircle(panelX + 60, panelY + 40, 8, '#fff', 'none');
            specDot.setAttribute('opacity', '0.6');
            specDot.innerHTML = '<animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite"/>';
            svg.appendChild(specDot);

            // Chromatic aberration representation at edge
            var chromR = createLine(panelX - 5, panelY + 60, panelX + 15, panelY + 60, '#ff6b6b', 2);
            chromR.setAttribute('opacity', '0.7');
            var chromG = createLine(panelX - 3, panelY + 65, panelX + 12, panelY + 65, '#4ade80', 2);
            chromG.setAttribute('opacity', '0.7');
            var chromB = createLine(panelX - 1, panelY + 70, panelX + 9, panelY + 70, '#60a5fa', 2);
            chromB.setAttribute('opacity', '0.7');
            svg.appendChild(chromR);
            svg.appendChild(chromG);
            svg.appendChild(chromB);

            // Labels around the panel
            var labels = [
                { x: 80, y: 70, text: 'Squircle SDF', line: { x2: panelX + 10, y2: panelY + 15 } },
                { x: 80, y: 130, text: 'Bevel Geometry', line: { x2: panelX + 5, y2: panelY + 70 } },
                { x: 80, y: 190, text: 'Chromatic Aberration', line: { x2: panelX + 5, y2: panelY + 100 } },
                { x: w - 80, y: 70, text: 'Specular Fresnel', line: { x2: panelX + panelW - 60, y2: panelY + 40 } },
                { x: w - 80, y: 130, text: 'Gaussian Blur', line: { x2: panelX + panelW/2, y2: panelY + panelH/2 } },
                { x: w - 80, y: 190, text: 'Caustic Focusing', line: { x2: panelX + panelW - 30, y2: panelY + panelH - 30 } }
            ];

            labels.forEach(function(lbl, i) {
                var isLeft = lbl.x < w/2;
                var textEl = createText(lbl.x, lbl.y, lbl.text, 'diagram-label-small');
                textEl.setAttribute('text-anchor', isLeft ? 'start' : 'end');
                svg.appendChild(textEl);

                var lineEl = createLine(isLeft ? lbl.x + lbl.text.length * 4 + 10 : lbl.x - lbl.text.length * 4 - 10, lbl.y, lbl.line.x2, lbl.line.y2, 'rgba(45,212,191,0.3)', 1);
                lineEl.setAttribute('stroke-dasharray', '3,3');
                svg.appendChild(lineEl);
            });

            // Title
            svg.appendChild(createText(w/2, 250, 'Liquid Glass: Six Components Working Together', 'diagram-label'));

            // Gradient definitions
            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = '<linearGradient id="bevelGrad" x1="0%" y1="0%" x2="0%" y2="100%">' +
                '<stop offset="0%" stop-color="rgba(255,255,255,0)"/>' +
                '<stop offset="30%" stop-color="rgba(255,255,255,0.6)"/>' +
                '<stop offset="70%" stop-color="rgba(255,255,255,0.6)"/>' +
                '<stop offset="100%" stop-color="rgba(255,255,255,0)"/>' +
            '</linearGradient>';
            svg.appendChild(defs);

            container.appendChild(svg);
        },

        // Squircle vs rounded rect vs ellipse comparison
        'squircle-comparison': function(container, w, h) {
            var svg = createSvg(w, h);

            var shapes = [
                { x: 120, name: 'Ellipse (n=2)', n: 2, color: 'rgba(255,100,100,0.5)' },
                { x: 350, name: 'Squircle (n=4)', n: 4, color: '#e8b923' },
                { x: 580, name: 'Rounded Rect', n: 'rect', color: 'rgba(100,150,255,0.5)' }
            ];

            shapes.forEach(function(shape) {
                var y = 110;
                var width = 100;
                var height = 60;

                if (shape.n === 'rect') {
                    // Rounded rectangle
                    var rect = createRect(shape.x - width/2, y - height/2, width, height, 12, 'none', shape.color, 2);
                    svg.appendChild(rect);
                } else {
                    // Draw superellipse using path approximation
                    var path = '';
                    var steps = 100;
                    for (var i = 0; i <= steps; i++) {
                        var t = (i / steps) * Math.PI * 2;
                        var cos = Math.cos(t);
                        var sin = Math.sin(t);
                        var px = shape.x + Math.sign(cos) * Math.pow(Math.abs(cos), 2/shape.n) * width/2;
                        var py = y + Math.sign(sin) * Math.pow(Math.abs(sin), 2/shape.n) * height/2;
                        path += (i === 0 ? 'M' : 'L') + px.toFixed(2) + ',' + py.toFixed(2);
                    }
                    path += 'Z';
                    var pathEl = createPath(path, 'none', shape.color, 2);
                    svg.appendChild(pathEl);
                }

                // Label
                svg.appendChild(createText(shape.x, 170, shape.name, 'diagram-label-small'));

                // Apple indicator for squircle
                if (shape.n === 4) {
                    var apple = createText(shape.x, 190, '← Apple Style', 'diagram-label-tiny');
                    apple.setAttribute('fill', '#e8b923');
                    svg.appendChild(apple);
                }
            });

            // Zoom into corner comparison
            svg.appendChild(createText(w/2, 25, 'Corner Curvature Comparison', 'diagram-label'));

            // Corner zoom boxes
            var zoomY = 105;
            [{ x: 165, n: 2 }, { x: 395, n: 4 }, { x: 535, n: 'rect' }].forEach(function(corner) {
                var zoomBox = createRect(corner.x, zoomY - 25, 50, 50, 0, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.2)', 1);
                svg.appendChild(zoomBox);
            });

            container.appendChild(svg);
        },

        // Bevel geometry cross-section
        'bevel-geometry-cross-section': function(container, w, h) {
            var svg = createSvg(w, h);

            // Cross-section visualization
            var startX = 100;
            var endX = 600;
            var centerY = 140;

            // Background panel (flat part)
            svg.appendChild(createRect(startX, centerY - 5, endX - startX, 10, 0, 'rgba(45,212,191,0.2)', 'none'));

            // Left bevel curve using 1 - sqrt(1 - x²)
            var leftBevelPath = 'M' + startX + ',' + centerY;
            var bevelWidth = 80;
            for (var i = 0; i <= 40; i++) {
                var x = i / 40; // 0 to 1
                var curve = 1 - Math.sqrt(1 - x * x); // lens curve
                var px = startX + x * bevelWidth;
                var py = centerY - curve * 60;
                leftBevelPath += ' L' + px.toFixed(2) + ',' + py.toFixed(2);
            }
            svg.appendChild(createPath(leftBevelPath, 'none', '#2dd4bf', 2.5));

            // Right bevel curve (mirrored)
            var rightBevelPath = 'M' + endX + ',' + centerY;
            for (var j = 0; j <= 40; j++) {
                var x2 = j / 40;
                var curve2 = 1 - Math.sqrt(1 - x2 * x2);
                var px2 = endX - x2 * bevelWidth;
                var py2 = centerY - curve2 * 60;
                rightBevelPath += ' L' + px2.toFixed(2) + ',' + py2.toFixed(2);
            }
            svg.appendChild(createPath(rightBevelPath, 'none', '#2dd4bf', 2.5));

            // Normal vectors at different points
            var normals = [
                { x: startX + 20, angle: -60 },
                { x: startX + 50, angle: -35 },
                { x: startX + 80, angle: -10 },
                { x: w/2, angle: 0 },
                { x: endX - 80, angle: 10 },
                { x: endX - 50, angle: 35 },
                { x: endX - 20, angle: 60 }
            ];

            normals.forEach(function(n, i) {
                var yOffset = 0;
                if (Math.abs(n.angle) > 5) {
                    var absX = Math.abs(n.x < w/2 ? n.x - startX : endX - n.x) / bevelWidth;
                    absX = Math.min(absX, 1);
                    yOffset = (1 - Math.sqrt(1 - absX * absX)) * 60;
                }

                var ny = centerY - yOffset;
                var rad = n.angle * Math.PI / 180;
                var nx = n.x + Math.sin(rad) * 30;
                var ny2 = ny - Math.cos(rad) * 30;

                var arrow = createArrow(n.x, ny, nx, ny2, '#e8b923');
                arrow.setAttribute('opacity', '0.7');
                svg.appendChild(arrow);
            });

            // Labels
            svg.appendChild(createText(startX + 40, 50, 'Tilted Normal', 'diagram-label-tiny'));
            svg.appendChild(createText(w/2, 50, 'Flat Normal', 'diagram-label-tiny'));

            // Formula annotation
            svg.appendChild(createText(w/2, 200, 'Bevel curve: y = 1 - √(1 - x²)', 'diagram-label-small'));
            svg.appendChild(createText(w/2, 220, 'Same formula as a circular lens edge profile', 'diagram-label-tiny'));

            // Dimension annotations
            svg.appendChild(createDoubleArrow(startX, 175, startX + bevelWidth, 175, 'rgba(255,255,255,0.4)'));
            svg.appendChild(createText(startX + bevelWidth/2, 190, 'effectZone', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 25, 'Cross-Section: Bevel Geometry & Surface Normals', 'diagram-label'));

            container.appendChild(svg);
        },

        // Separable blur diagram
        'separable-blur-diagram': function(container, w, h) {
            var svg = createSvg(w, h);

            // Source image representation
            var sourceX = 60;
            var sourceY = 60;
            var boxSize = 80;

            svg.appendChild(createRect(sourceX, sourceY, boxSize, boxSize, 4, 'rgba(45,212,191,0.2)', 'rgba(45,212,191,0.5)', 1));
            svg.appendChild(createText(sourceX + boxSize/2, sourceY + boxSize/2, 'Scene', 'diagram-label-small'));
            svg.appendChild(createText(sourceX + boxSize/2, sourceY + boxSize + 15, 'N² samples', 'diagram-label-tiny'));

            // Arrow
            svg.appendChild(createArrow(sourceX + boxSize + 10, sourceY + boxSize/2, sourceX + boxSize + 50, sourceY + boxSize/2, '#e8b923'));

            // H-blur
            var hBlurX = 190;
            svg.appendChild(createRect(hBlurX, sourceY, boxSize, boxSize, 4, 'rgba(232,185,35,0.2)', 'rgba(232,185,35,0.5)', 1));

            // Horizontal blur indicator
            for (var i = 0; i < 5; i++) {
                var lineY = sourceY + 15 + i * 14;
                var opacity = 1 - Math.abs(i - 2) * 0.3;
                svg.appendChild(createLine(hBlurX + 10, lineY, hBlurX + boxSize - 10, lineY, 'rgba(232,185,35,' + opacity + ')', 2));
            }
            svg.appendChild(createText(hBlurX + boxSize/2, sourceY + boxSize + 15, 'H-Pass (N)', 'diagram-label-tiny'));

            // Arrow
            svg.appendChild(createArrow(hBlurX + boxSize + 10, sourceY + boxSize/2, hBlurX + boxSize + 50, sourceY + boxSize/2, '#e8b923'));

            // V-blur
            var vBlurX = 320;
            svg.appendChild(createRect(vBlurX, sourceY, boxSize, boxSize, 4, 'rgba(45,212,191,0.2)', 'rgba(45,212,191,0.5)', 1));

            // Vertical blur indicator
            for (var j = 0; j < 5; j++) {
                var lineX = vBlurX + 15 + j * 14;
                var opacity2 = 1 - Math.abs(j - 2) * 0.3;
                svg.appendChild(createLine(lineX, sourceY + 10, lineX, sourceY + boxSize - 10, 'rgba(45,212,191,' + opacity2 + ')', 2));
            }
            svg.appendChild(createText(vBlurX + boxSize/2, sourceY + boxSize + 15, 'V-Pass (N)', 'diagram-label-tiny'));

            // Arrow
            svg.appendChild(createArrow(vBlurX + boxSize + 10, sourceY + boxSize/2, vBlurX + boxSize + 50, sourceY + boxSize/2, '#e8b923'));

            // Result
            var resultX = 450;
            svg.appendChild(createRect(resultX, sourceY, boxSize, boxSize, 4, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.5)', 1));

            // Blur effect representation
            var blurCircle = createCircle(resultX + boxSize/2, sourceY + boxSize/2, 25, 'rgba(255,255,255,0.2)', 'none');
            blurCircle.innerHTML = '<animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite"/>';
            svg.appendChild(blurCircle);
            svg.appendChild(createText(resultX + boxSize/2, sourceY + boxSize/2, 'Blurred', 'diagram-label-small'));
            svg.appendChild(createText(resultX + boxSize/2, sourceY + boxSize + 15, '2N total', 'diagram-label-tiny'));

            // Complexity comparison
            svg.appendChild(createText(w/2, 175, 'O(N²) → O(2N): 81 samples → 18 samples for 9-tap kernel', 'diagram-label-small'));

            svg.appendChild(createText(w/2, 25, 'Separable Gaussian Blur', 'diagram-label'));

            container.appendChild(svg);
        },

        // Linear sampling optimization
        'linear-sampling-optimization': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left side: discrete sampling
            var leftX = 150;
            var y = 90;

            svg.appendChild(createText(leftX, 30, 'Discrete Sampling', 'diagram-label-small'));

            // Texel grid
            for (var i = 0; i < 5; i++) {
                var tx = leftX - 80 + i * 40;
                svg.appendChild(createRect(tx, y - 15, 38, 30, 2, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 1));
                svg.appendChild(createText(tx + 19, y, 'T' + i, 'diagram-label-tiny'));

                // Sample points
                var sampleDot = createCircle(tx + 19, y + 35, 5, '#2dd4bf', 'none');
                sampleDot.innerHTML = '<animate attributeName="r" values="4;6;4" dur="1s" begin="' + (i * 0.15) + 's" repeatCount="indefinite"/>';
                svg.appendChild(sampleDot);
            }
            svg.appendChild(createText(leftX, 150, '5 texture fetches', 'diagram-label-tiny'));

            // Divider
            svg.appendChild(createLine(300, 20, 300, 160, 'rgba(255,255,255,0.2)', 1));
            svg.appendChild(createText(300, 90, '→', 'diagram-label'));

            // Right side: linear sampling
            var rightX = 480;

            svg.appendChild(createText(rightX, 30, 'Linear Sampling', 'diagram-label-small'));

            // Texel grid
            for (var j = 0; j < 5; j++) {
                var tx2 = rightX - 80 + j * 40;
                svg.appendChild(createRect(tx2, y - 15, 38, 30, 2, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 1));
                svg.appendChild(createText(tx2 + 19, y, 'T' + j, 'diagram-label-tiny'));
            }

            // Sample points between texels
            var samplePositions = [rightX - 61, rightX, rightX + 59];
            samplePositions.forEach(function(sx, idx) {
                var sampleDot2 = createCircle(sx, y + 35, 6, '#e8b923', 'none');
                sampleDot2.innerHTML = '<animate attributeName="r" values="5;7;5" dur="1s" begin="' + (idx * 0.2) + 's" repeatCount="indefinite"/>';
                svg.appendChild(sampleDot2);

                // Lines showing interpolation
                if (idx === 0 || idx === 2) {
                    svg.appendChild(createLine(sx - 20, y + 20, sx, y + 30, 'rgba(232,185,35,0.5)', 1));
                    svg.appendChild(createLine(sx + 20, y + 20, sx, y + 30, 'rgba(232,185,35,0.5)', 1));
                }
            });

            svg.appendChild(createText(rightX, 150, '3 fetches (HW bilinear)', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        // Chromatic dispersion diagram
        'chromatic-dispersion-diagram': function(container, w, h) {
            var svg = createSvg(w, h);

            // Glass bevel cross-section
            var glassX = 150;
            var glassY = 40;
            var glassH = 160;

            // Glass shape
            var glassPath = createPath(
                'M' + glassX + ',' + glassY +
                ' Q' + (glassX - 40) + ',' + (glassY + glassH/2) + ' ' + glassX + ',' + (glassY + glassH) +
                ' L' + (glassX + 30) + ',' + (glassY + glassH) +
                ' L' + (glassX + 30) + ',' + glassY + ' Z',
                'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 1
            );
            svg.appendChild(glassPath);

            // Incoming white light
            svg.appendChild(createLine(50, glassY + glassH/2, glassX - 25, glassY + glassH/2, '#fff', 3));
            svg.appendChild(createText(70, glassY + glassH/2 - 15, 'White Light', 'diagram-label-tiny'));

            // Dispersed light rays
            var rays = [
                { color: '#ff6b6b', name: 'Red (656nm)', n: 1.514, angle: 12 },
                { color: '#4ade80', name: 'Green (550nm)', n: 1.519, angle: 15 },
                { color: '#60a5fa', name: 'Blue (486nm)', n: 1.528, angle: 18 }
            ];

            rays.forEach(function(ray, i) {
                var startX = glassX + 30;
                var startY = glassY + glassH/2 + (i - 1) * 8;
                var endX = 500;
                var endY = startY + Math.tan(ray.angle * Math.PI / 180) * (endX - startX);

                var rayLine = createLine(startX, startY, endX, endY, ray.color, 2);
                rayLine.setAttribute('stroke-dasharray', '300');
                rayLine.setAttribute('stroke-dashoffset', '300');
                rayLine.innerHTML = '<animate attributeName="stroke-dashoffset" from="300" to="0" dur="1s" begin="' + (0.5 + i * 0.2) + 's" fill="freeze"/>';
                svg.appendChild(rayLine);

                // Label
                svg.appendChild(createText(520, endY, ray.name, 'diagram-label-tiny'));
                svg.appendChild(createText(600, endY, 'n=' + ray.n, 'diagram-label-tiny'));
            });

            // Annotations
            svg.appendChild(createText(glassX - 10, 25, 'Glass Bevel', 'diagram-label-small'));
            svg.appendChild(createText(w/2, 220, 'Cauchy equation: n(λ) ≈ A + B/λ² — shorter wavelengths bend more', 'diagram-label-small'));

            container.appendChild(svg);
        },

        // Fresnel reflection diagram
        'fresnel-reflection-diagram': function(container, w, h) {
            var svg = createSvg(w, h);

            // Glass surface
            var surfaceY = 120;
            svg.appendChild(createLine(100, surfaceY, 600, surfaceY, 'rgba(45,212,191,0.5)', 2));
            svg.appendChild(createRect(100, surfaceY, 500, 60, 0, 'rgba(45,212,191,0.1)', 'none'));

            // Normal incidence (left)
            var normalX = 200;
            svg.appendChild(createArrow(normalX, 40, normalX, surfaceY - 5, '#fff'));
            svg.appendChild(createArrow(normalX, surfaceY + 5, normalX, surfaceY + 50, 'rgba(255,255,255,0.3)'));
            svg.appendChild(createText(normalX, 25, 'Normal', 'diagram-label-tiny'));
            svg.appendChild(createText(normalX, surfaceY - 45, '~4% reflects', 'diagram-label-tiny'));
            svg.appendChild(createText(normalX + 40, surfaceY - 45, '→ F0', 'diagram-label-tiny'));

            // Grazing angle (right)
            var grazingX = 450;
            svg.appendChild(createArrow(grazingX - 80, surfaceY - 30, grazingX, surfaceY - 5, '#fff'));
            svg.appendChild(createArrow(grazingX, surfaceY - 5, grazingX + 80, surfaceY - 30, '#e8b923'));
            svg.appendChild(createArrow(grazingX, surfaceY + 5, grazingX + 20, surfaceY + 50, 'rgba(255,255,255,0.1)'));
            svg.appendChild(createText(grazingX, 25, 'Grazing', 'diagram-label-tiny'));
            svg.appendChild(createText(grazingX + 50, surfaceY - 50, '~100% reflects', 'diagram-label-tiny'));

            // Fresnel curve
            var curveStartX = 100;
            var curveEndX = 600;
            var curveY = 195;

            svg.appendChild(createLine(curveStartX, curveY, curveEndX, curveY, 'rgba(255,255,255,0.2)', 1));
            svg.appendChild(createLine(curveStartX, curveY, curveStartX, curveY - 50, 'rgba(255,255,255,0.2)', 1));

            // Fresnel curve path
            var fresnelPath = 'M' + curveStartX + ',' + (curveY - 2); // F0 = 0.04
            for (var angle = 0; angle <= 90; angle += 5) {
                var x = curveStartX + (angle / 90) * (curveEndX - curveStartX);
                var cosTheta = Math.cos(angle * Math.PI / 180);
                var F0 = 0.04;
                var fresnel = F0 + (1 - F0) * Math.pow(1 - cosTheta, 5);
                var y = curveY - fresnel * 45;
                fresnelPath += ' L' + x.toFixed(1) + ',' + y.toFixed(1);
            }
            svg.appendChild(createPath(fresnelPath, 'none', '#2dd4bf', 2));

            svg.appendChild(createText(curveStartX - 15, curveY - 2, 'F0', 'diagram-label-tiny'));
            svg.appendChild(createText(curveStartX - 15, curveY - 45, '1.0', 'diagram-label-tiny'));
            svg.appendChild(createText(curveStartX + 20, curveY + 12, '0°', 'diagram-label-tiny'));
            svg.appendChild(createText(curveEndX - 10, curveY + 12, '90°', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 10, 'Fresnel Effect: Reflectance vs. Viewing Angle', 'diagram-label'));

            container.appendChild(svg);
        },

        // Window reflection physics
        'window-reflection-physics': function(container, w, h) {
            var svg = createSvg(w, h);

            // Glass panel (center)
            var panelX = w/2 - 10;
            var panelTop = 40;
            var panelBottom = 180;

            svg.appendChild(createLine(panelX, panelTop, panelX, panelBottom, 'rgba(45,212,191,0.6)', 3));
            svg.appendChild(createRect(panelX - 5, panelTop, 10, panelBottom - panelTop, 0, 'rgba(45,212,191,0.1)', 'none'));
            svg.appendChild(createText(panelX, 195, 'Glass Panel', 'diagram-label-small'));

            // Camera (left side)
            var cameraX = 150;
            var cameraY = 110;
            svg.appendChild(createRect(cameraX - 20, cameraY - 15, 40, 30, 4, 'rgba(255,255,255,0.2)', '#fff', 1));
            svg.appendChild(createCircle(cameraX + 10, cameraY, 8, 'none', '#fff'));
            svg.appendChild(createText(cameraX, cameraY + 35, 'Camera', 'diagram-label-tiny'));

            // Light source BEHIND camera (correct)
            var lightBehindX = 80;
            var lightBehindY = 60;
            var lightBehind = createCircle(lightBehindX, lightBehindY, 12, '#e8b923', 'none');
            lightBehind.innerHTML = '<animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite"/>';
            svg.appendChild(lightBehind);
            svg.appendChild(createText(lightBehindX, lightBehindY + 25, 'Light', 'diagram-label-tiny'));

            // Light ray: light → panel → reflects back
            svg.appendChild(createLine(lightBehindX + 10, lightBehindY + 5, panelX - 3, 80, '#e8b923', 1.5));
            svg.appendChild(createArrow(panelX - 3, 80, cameraX + 25, cameraY - 10, '#e8b923'));
            svg.appendChild(createText(panelX - 60, 65, 'Reflects ✓', 'diagram-label-tiny'));

            // Light source IN FRONT (wrong - no reflection visible)
            var lightFrontX = 550;
            var lightFrontY = 70;
            var lightFront = createCircle(lightFrontX, lightFrontY, 10, 'rgba(255,100,100,0.5)', 'none');
            svg.appendChild(lightFront);
            svg.appendChild(createText(lightFrontX, lightFrontY + 22, 'Light', 'diagram-label-tiny'));

            // Light ray: transmits through
            svg.appendChild(createLine(lightFrontX - 10, lightFrontY, panelX + 3, 90, 'rgba(255,100,100,0.3)', 1.5));
            var transmitLine = createLine(panelX - 3, 90, 80, 130, 'rgba(255,100,100,0.3)', 1.5);
            transmitLine.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(transmitLine);
            svg.appendChild(createText(panelX + 70, 75, 'Transmits', 'diagram-label-tiny'));

            // Labels
            svg.appendChild(createText(120, 215, 'Behind camera: REFLECTS', 'diagram-label-tiny'));
            svg.appendChild(createText(520, 215, 'In front: TRANSMITS', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 15, 'Window Reflection: Light Position Matters', 'diagram-label'));

            container.appendChild(svg);
        },

        // Caustics focusing diagram
        'caustics-focusing-diagram': function(container, w, h) {
            var svg = createSvg(w, h);

            // Glass bevel (curved lens edge)
            var lensX = 200;
            var lensTop = 30;
            var lensBottom = 200;

            // Draw curved lens edge
            var lensPath = 'M' + lensX + ',' + lensTop;
            for (var y = lensTop; y <= lensBottom; y += 5) {
                var t = (y - lensTop) / (lensBottom - lensTop);
                var curve = Math.sin(t * Math.PI) * 30;
                lensPath += ' L' + (lensX + curve) + ',' + y;
            }
            svg.appendChild(createPath(lensPath, 'none', 'rgba(45,212,191,0.6)', 3));

            // Incoming parallel rays
            var rayStartX = 80;
            var rayColors = ['#ff6b6b', '#4ade80', '#60a5fa'];
            var rayNames = ['R', 'G', 'B'];
            var focalPoints = [380, 350, 320]; // Red focuses furthest, blue closest

            for (var i = 0; i < 5; i++) {
                var rayY = lensTop + 20 + i * 40;
                var lensHitX = lensX + Math.sin(((rayY - lensTop) / (lensBottom - lensTop)) * Math.PI) * 30;

                // White incoming ray
                svg.appendChild(createLine(rayStartX, rayY, lensHitX - 2, rayY, 'rgba(255,255,255,0.5)', 1.5));

                // Dispersed refracted rays
                rayColors.forEach(function(color, ci) {
                    var focalX = focalPoints[ci];
                    var focalY = 115; // All converge to same Y but different X
                    var refractedLine = createLine(lensHitX + 2, rayY, focalX, focalY, color, 1);
                    refractedLine.setAttribute('opacity', '0.6');
                    svg.appendChild(refractedLine);
                });
            }

            // Focal points with labels
            rayColors.forEach(function(color, ci) {
                var focalDot = createCircle(focalPoints[ci], 115, 6, color, 'none');
                focalDot.innerHTML = '<animate attributeName="r" values="5;8;5" dur="1.5s" begin="' + (ci * 0.2) + 's" repeatCount="indefinite"/>';
                svg.appendChild(focalDot);
            });

            // Caustic band representation
            var causticRect = createRect(310, 100, 80, 30, 4, 'none', 'rgba(232,185,35,0.5)', 1);
            causticRect.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(causticRect);
            svg.appendChild(createText(350, 145, 'Caustic Band', 'diagram-label-tiny'));

            // Labels
            svg.appendChild(createText(80, 15, 'Parallel Light', 'diagram-label-tiny'));
            svg.appendChild(createText(lensX + 50, 15, 'Curved Bevel', 'diagram-label-tiny'));
            svg.appendChild(createText(500, 95, 'R (outer)', 'diagram-label-tiny'));
            svg.appendChild(createText(500, 115, 'G (middle)', 'diagram-label-tiny'));
            svg.appendChild(createText(500, 135, 'B (inner)', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 235, 'Chromatic Caustics: Each wavelength focuses at different position', 'diagram-label-small'));

            container.appendChild(svg);
        },

        // Full Liquid Glass pipeline
        'liquid-glass-pipeline': function(container, w, h) {
            var svg = createSvg(w, h);

            var stages = [
                { name: 'Scene', sub: 'FBO' },
                { name: 'Downsample', sub: '1/4 res' },
                { name: 'H-Blur', sub: 'Gaussian' },
                { name: 'V-Blur', sub: 'Gaussian' },
                { name: 'SDF+Bevel', sub: 'Geometry' },
                { name: 'Refract', sub: 'Per-λ' },
                { name: 'Specular', sub: 'Fresnel' },
                { name: 'Caustics', sub: 'Focusing' },
                { name: 'Composite', sub: 'Final' }
            ];

            var stageWidth = 70;
            var startX = 20;
            var y = 70;

            stages.forEach(function(stage, i) {
                var x = startX + i * (stageWidth + 8);

                var fillColor = i < 4 ? 'rgba(45,212,191,0.15)' : 'rgba(232,185,35,0.15)';
                var strokeColor = i < 4 ? 'rgba(45,212,191,0.5)' : 'rgba(232,185,35,0.5)';

                var rect = createRect(x, y, stageWidth, 45, 6, fillColor, strokeColor, 1);
                rect.innerHTML = '<animate attributeName="fill" values="' + fillColor + ';' + fillColor.replace('0.15', '0.3') + ';' + fillColor + '" dur="3s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(rect);

                svg.appendChild(createText(x + stageWidth/2, y + 18, stage.name, 'diagram-label-tiny'));
                var subLabel = createText(x + stageWidth/2, y + 33, stage.sub, 'diagram-label-tiny');
                subLabel.setAttribute('fill', 'rgba(255,255,255,0.5)');
                svg.appendChild(subLabel);

                if (i < stages.length - 1) {
                    svg.appendChild(createPath('M' + (x + stageWidth + 2) + ',' + (y + 22) + ' L' + (x + stageWidth + 6) + ',' + (y + 22),
                        'none', 'rgba(255,255,255,0.3)', 1.5));
                }
            });

            // Section labels
            svg.appendChild(createLine(startX, 130, startX + 4 * (stageWidth + 8) - 8, 130, 'rgba(45,212,191,0.3)', 1));
            svg.appendChild(createText(startX + 2 * (stageWidth + 8), 145, 'Blur Pipeline', 'diagram-label-tiny'));

            svg.appendChild(createLine(startX + 4 * (stageWidth + 8), 130, startX + 9 * (stageWidth + 8) - 8, 130, 'rgba(232,185,35,0.3)', 1));
            svg.appendChild(createText(startX + 6.5 * (stageWidth + 8), 145, 'Glass Effects', 'diagram-label-tiny'));

            svg.appendChild(createText(w/2, 25, 'Complete Liquid Glass Render Pipeline', 'diagram-label'));

            container.appendChild(svg);
        }
    };

    // Expose globally for blog.js to use
    window.blogSvgDiagrams = svgDiagrams;

})();
