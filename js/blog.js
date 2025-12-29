// ============================================
// BLOG MODULE - Shader Journal
// Handles loading, filtering, and displaying blog posts
// ============================================

(function initBlog() {
    'use strict';

    // Cache DOM elements
    var postsGrid = document.getElementById('blog-posts-grid');
    var listView = document.getElementById('blog-list-view');
    var postView = document.getElementById('blog-post-view');
    var articleContainer = document.getElementById('blog-article');
    var backBtn = document.getElementById('back-to-list');
    var postCountEl = document.getElementById('blog-post-count');
    var filterChips = document.querySelectorAll('.filter-chip');

    // State
    var posts = [];
    var currentFilter = 'all';
    var blogInitialized = false;

    // ============================================
    // FETCH & LOAD POSTS
    // ============================================

    function loadBlogIndex() {
        return fetch('blog/index.json')
            .then(function(response) {
                if (!response.ok) throw new Error('Failed to load blog index');
                return response.json();
            })
            .then(function(index) {
                // Load all post details in parallel
                var postPromises = index.posts.map(function(postId) {
                    return fetch('blog/posts/' + postId + '.json')
                        .then(function(response) {
                            if (!response.ok) return null;
                            return response.json();
                        })
                        .catch(function() { return null; });
                });
                return Promise.all(postPromises);
            })
            .then(function(loadedPosts) {
                posts = loadedPosts.filter(function(p) { return p !== null; });
                // Sort by date (newest first)
                posts.sort(function(a, b) {
                    return new Date(b.date) - new Date(a.date);
                });
                return posts;
            });
    }

    // ============================================
    // RENDER POSTS GRID
    // ============================================

    function renderPostsGrid(filteredPosts) {
        if (!postsGrid) return;

        postsGrid.innerHTML = '';

        if (filteredPosts.length === 0) {
            postsGrid.innerHTML = '<div class="blog-empty">No posts found in this category.</div>';
            return;
        }

        filteredPosts.forEach(function(post, index) {
            var card = createPostCard(post, index);
            postsGrid.appendChild(card);
        });

        // Update post count
        if (postCountEl) {
            postCountEl.textContent = filteredPosts.length + ' entr' + (filteredPosts.length === 1 ? 'y' : 'ies');
        }
    }

    function createPostCard(post, index) {
        var card = document.createElement('article');
        card.className = 'blog-post-card' + (post.featured ? ' featured' : '');
        card.setAttribute('data-post-id', post.id);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Read article: ' + post.title);

        // Format date
        var date = new Date(post.date);
        var formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Create thumbnail HTML
        var thumbnailContent = post.thumbnail
            ? '<img src="blog/images/' + post.thumbnail + '" alt="" loading="lazy">'
            : '<div class="placeholder-graphic"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>';

        // Create featured badge HTML
        var featuredBadge = post.featured
            ? '<span class="card-featured-badge"><svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Featured</span>'
            : '';

        // Create tags HTML (limit to 3)
        var tagsHtml = (post.tags || []).slice(0, 3).map(function(tag) {
            return '<span class="card-tag">' + tag + '</span>';
        }).join('');

        card.innerHTML =
            '<div class="card-thumbnail">' +
                thumbnailContent +
                '<span class="card-category">' + post.category + '</span>' +
                featuredBadge +
            '</div>' +
            '<div class="card-content">' +
                '<div class="card-meta">' +
                    '<span class="meta-date">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
                        formattedDate +
                    '</span>' +
                    '<span class="meta-separator"></span>' +
                    '<span class="meta-read-time">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                        post.readTime +
                    '</span>' +
                '</div>' +
                '<h3 class="card-title">' + post.title + '</h3>' +
                '<p class="card-excerpt">' + post.excerpt + '</p>' +
                '<div class="card-tags">' + tagsHtml + '</div>' +
                '<div class="card-arrow">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
                '</div>' +
            '</div>';

        // Click handler
        card.addEventListener('click', function() {
            openPost(post);
        });

        // Keyboard handler
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPost(post);
            }
        });

        return card;
    }

    // ============================================
    // RENDER SINGLE POST
    // ============================================

    function openPost(post) {
        if (!articleContainer || !listView || !postView) return;

        // Get blog panel and add article-view class
        var blogPanel = document.querySelector('.blog-panel');
        if (blogPanel) blogPanel.classList.add('article-view');

        // Hide list, show article
        listView.classList.add('hidden');
        postView.classList.add('active');

        // Scroll to top of panel
        postView.scrollTop = 0;

        // Render article
        renderArticle(post);
    }

    function closePost() {
        if (!listView || !postView) return;

        // Remove article-view class from blog panel
        var blogPanel = document.querySelector('.blog-panel');
        if (blogPanel) blogPanel.classList.remove('article-view');

        postView.classList.remove('active');
        listView.classList.remove('hidden');

        // Scroll to top of list
        listView.scrollTop = 0;
    }

    function renderArticle(post) {
        if (!articleContainer) return;

        // Format date
        var date = new Date(post.date);
        var formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Build header
        var headerHtml =
            '<header class="article-header">' +
                '<div class="article-meta">' +
                    '<span class="article-category">' + post.category + '</span>' +
                    '<span>' + formattedDate + '</span>' +
                    '<span>' + post.readTime + ' read</span>' +
                '</div>' +
                '<h1 class="article-title">' + post.title + '</h1>' +
                (post.subtitle ? '<p class="article-subtitle">' + post.subtitle + '</p>' : '') +
            '</header>';

        // Build content sections
        var contentHtml = '<div class="article-content">';
        (post.sections || []).forEach(function(section) {
            contentHtml += renderSection(section);
        });
        contentHtml += '</div>';

        articleContainer.innerHTML = headerHtml + contentHtml;

        // Apply syntax highlighting to code blocks
        applySyntaxHighlighting();

        // Initialize SVG diagrams
        initSvgDiagrams();
    }

    function renderSection(section) {
        switch (section.type) {
            case 'intro':
                return '<p class="article-section section-intro">' + section.content + '</p>';

            case 'heading':
                var tag = 'h' + (section.level || 2);
                return '<' + tag + ' class="article-section section-heading">' + section.content + '</' + tag + '>';

            case 'paragraph':
                return '<p class="article-section section-paragraph">' + section.content + '</p>';

            case 'code':
                return '<div class="article-section section-code">' +
                    '<div class="code-header">' +
                        '<span class="code-title">' + (section.title || 'Code') + '</span>' +
                        '<span class="code-language">' + (section.language || 'code') + '</span>' +
                    '</div>' +
                    '<div class="code-content"><pre>' + escapeHtml(section.content) + '</pre></div>' +
                '</div>';

            case 'list':
                var itemsHtml = (section.items || []).map(function(item) {
                    return '<li>' + item + '</li>';
                }).join('');
                return '<ul class="article-section section-list">' + itemsHtml + '</ul>';

            case 'image':
                return '<figure class="article-section section-image">' +
                    '<img src="blog/images/' + section.src + '" alt="' + (section.alt || '') + '" loading="lazy">' +
                    (section.caption ? '<figcaption>' + section.caption + '</figcaption>' : '') +
                '</figure>';

            case 'callout':
                return '<aside class="article-section section-callout ' + (section.variant || 'info') + '">' +
                    '<p>' + section.content + '</p>' +
                '</aside>';

            case 'svg-diagram':
                return '<figure class="article-section section-svg-diagram" data-diagram-id="' + section.id + '">' +
                    '<div class="svg-container" style="max-width: ' + (section.width || 600) + 'px;">' +
                        '<div class="svg-placeholder" data-width="' + (section.width || 600) + '" data-height="' + (section.height || 200) + '"></div>' +
                    '</div>' +
                    (section.title ? '<figcaption>' + section.title + '</figcaption>' : '') +
                '</figure>';

            default:
                return '';
        }
    }

    // ============================================
    // SVG DIAGRAM GENERATOR
    // Creates animated technical diagrams
    // ============================================

    var svgDiagrams = {
        // Standard vs Anamorphic Bloom comparison
        'bloom-comparison': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left side: Standard bloom
            var leftGroup = createGroup('translate(80, 100)');

            // Center glow (standard - circular)
            var standardGlow = createCircle(0, 0, 40, 'url(#standardGlowGrad)', 'none');
            standardGlow.innerHTML = '<animate attributeName="r" values="35;45;35" dur="2s" repeatCount="indefinite"/>';

            var standardCore = createCircle(0, 0, 15, '#fff', 'none');
            leftGroup.appendChild(standardGlow);
            leftGroup.appendChild(standardCore);

            // Label
            var standardLabel = createText(0, 70, 'Standard Bloom', 'diagram-label');
            leftGroup.appendChild(standardLabel);

            // Right side: Anamorphic bloom
            var rightGroup = createGroup('translate(350, 100)');

            // Horizontal streak effect
            var anamorphicGlow = createEllipse(0, 0, 120, 25, 'url(#anamorphicGlowGrad)', 'none');
            anamorphicGlow.innerHTML = '<animate attributeName="rx" values="100;140;100" dur="2s" repeatCount="indefinite"/>' +
                '<animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>';

            var anamorphicCore = createCircle(0, 0, 12, '#fff', 'none');
            rightGroup.appendChild(anamorphicGlow);
            rightGroup.appendChild(anamorphicCore);

            // Streak lines
            for (var i = 0; i < 5; i++) {
                var streak = createLine(-150 + i * 20, 0, 150 - i * 20, 0, 'rgba(45, 212, 191, ' + (0.3 - i * 0.05) + ')', 2 - i * 0.3);
                streak.innerHTML = '<animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" begin="' + (i * 0.1) + 's" repeatCount="indefinite"/>';
                rightGroup.appendChild(streak);
            }

            var anamorphicLabel = createText(0, 70, 'Anamorphic Bloom', 'diagram-label');
            rightGroup.appendChild(anamorphicLabel);

            // Add gradients
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

            // VS divider
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

                // Box
                var rect = createRect(x, y, stageWidth, 50, 8, 'rgba(45, 212, 191, 0.1)', 'rgba(45, 212, 191, 0.5)', 1);

                // Animate highlight traveling through pipeline
                rect.innerHTML = '<animate attributeName="fill" values="rgba(45,212,191,0.1);rgba(45,212,191,0.3);rgba(45,212,191,0.1)" dur="3.5s" begin="' + (i * 0.5) + 's" repeatCount="indefinite"/>';

                svg.appendChild(rect);

                // Label
                var label = createText(x + stageWidth/2, y + 30, stage, 'diagram-label-small');
                svg.appendChild(label);

                // Arrow to next
                if (i < stages.length - 1) {
                    var arrowX = x + stageWidth + 3;
                    var arrow = createPath('M' + arrowX + ',105 L' + (arrowX + 10) + ',105', 'none', 'rgba(232, 185, 35, 0.6)', 2);
                    arrow.setAttribute('marker-end', 'url(#arrowhead)');
                    svg.appendChild(arrow);
                }
            });

            // Resolution labels
            var resLabels = ['Full', 'Full', '1/2', '1/2', '1/2', 'Full', 'Full'];
            resLabels.forEach(function(res, i) {
                var x = startX + i * (stageWidth + 15) + stageWidth/2;
                var resLabel = createText(x, 155, res + ' res', 'diagram-label-tiny');
                resLabel.setAttribute('fill', 'rgba(255,255,255,0.4)');
                svg.appendChild(resLabel);
            });

            // Title
            var title = createText(w/2, 35, 'Multi-Pass Bloom Pipeline', 'diagram-title');
            svg.appendChild(title);

            // Arrow marker
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

            // Axes
            var axisColor = 'rgba(255,255,255,0.3)';
            svg.appendChild(createLine(60, 180, 450, 180, axisColor, 1));
            svg.appendChild(createLine(60, 180, 60, 30, axisColor, 1));

            // Labels
            svg.appendChild(createText(250, 210, 'Input Luminance', 'diagram-label-small'));
            var yLabel = createText(25, 105, 'Output', 'diagram-label-small');
            yLabel.setAttribute('transform', 'rotate(-90, 25, 105)');
            svg.appendChild(yLabel);

            // Hard threshold line (bad)
            var hardPath = 'M60,180 L200,180 L200,40 L450,40';
            var hardLine = createPath(hardPath, 'none', 'rgba(255, 100, 100, 0.5)', 2);
            hardLine.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(hardLine);

            // Soft knee curve (good) - animated
            var softPath = 'M60,180 Q150,180 200,140 T280,50 L450,40';
            var softLine = createPath(softPath, 'none', '#2dd4bf', 2.5);

            // Animate drawing
            softLine.setAttribute('stroke-dasharray', '500');
            softLine.setAttribute('stroke-dashoffset', '500');
            softLine.innerHTML = '<animate attributeName="stroke-dashoffset" from="500" to="0" dur="2s" fill="freeze" begin="0.5s"/>';
            svg.appendChild(softLine);

            // Threshold marker
            svg.appendChild(createLine(200, 180, 200, 30, 'rgba(232, 185, 35, 0.3)', 1));
            svg.appendChild(createText(200, 195, 'Threshold', 'diagram-label-tiny'));

            // Knee region
            var kneeRect = createRect(150, 30, 100, 150, 4, 'rgba(232, 185, 35, 0.05)', 'rgba(232, 185, 35, 0.2)', 1);
            kneeRect.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(kneeRect);
            svg.appendChild(createText(200, 20, 'Soft Knee Region', 'diagram-label-tiny'));

            // Legend
            svg.appendChild(createLine(320, 165, 350, 165, 'rgba(255, 100, 100, 0.5)', 2));
            svg.appendChild(createText(360, 168, 'Hard cutoff', 'diagram-label-tiny'));
            svg.appendChild(createLine(320, 185, 350, 185, '#2dd4bf', 2.5));
            svg.appendChild(createText(360, 188, 'Soft knee', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        // Asymmetric kernel visualization
        'kernel-asymmetry': function(container, w, h) {
            var svg = createSvg(w, h);

            // Standard kernel (left)
            var leftX = 120;
            var leftY = 125;

            svg.appendChild(createText(leftX, 30, 'Standard Kernel', 'diagram-label'));

            // Draw circular kernel
            for (var r = 50; r > 0; r -= 10) {
                var opacity = 0.15 + (50 - r) / 50 * 0.6;
                var circle = createCircle(leftX, leftY, r, 'rgba(45, 212, 191, ' + opacity + ')', 'none');
                svg.appendChild(circle);
            }

            // Anamorphic kernel (right)
            var rightX = 420;
            var rightY = 125;

            svg.appendChild(createText(rightX, 30, 'Anamorphic Kernel', 'diagram-label'));

            // Draw stretched elliptical kernel
            for (var r = 50; r > 0; r -= 10) {
                var opacity = 0.15 + (50 - r) / 50 * 0.6;
                var ellipse = createEllipse(rightX, rightY, r * 2.5, r * 0.4, 'rgba(232, 185, 35, ' + opacity + ')', 'none');
                svg.appendChild(ellipse);
            }

            // Dimension arrows
            // Standard - equal both ways
            svg.appendChild(createDoubleArrow(leftX - 55, leftY, leftX + 55, leftY, '#2dd4bf'));
            svg.appendChild(createDoubleArrow(leftX, leftY - 55, leftX, leftY + 55, '#2dd4bf'));
            svg.appendChild(createText(leftX, leftY + 85, '1:1 ratio', 'diagram-label-tiny'));

            // Anamorphic - stretched
            svg.appendChild(createDoubleArrow(rightX - 130, rightY, rightX + 130, rightY, '#e8b923'));
            svg.appendChild(createDoubleArrow(rightX, rightY - 25, rightX, rightY + 25, '#e8b923'));
            svg.appendChild(createText(rightX, rightY + 85, '4:1 ratio', 'diagram-label-tiny'));

            // Animation - pulsing
            var pulseAnim = '<animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>';

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

            weights.forEach(function(w, i) {
                var x = startX + i * (barWidth + 5);
                var barHeight = w * maxHeight;
                var y = baseY - barHeight;

                // Bar with gradient effect
                var bar = createRect(x, y, barWidth, barHeight, 3, 'url(#barGrad)', 'rgba(45, 212, 191, 0.5)', 1);

                // Animate bars appearing
                bar.innerHTML = '<animate attributeName="height" from="0" to="' + barHeight + '" dur="0.5s" begin="' + (i * 0.05) + 's" fill="freeze"/>' +
                    '<animate attributeName="y" from="' + baseY + '" to="' + y + '" dur="0.5s" begin="' + (i * 0.05) + 's" fill="freeze"/>';
                svg.appendChild(bar);

                // Tap label
                var tapLabel = createText(x + barWidth/2, baseY + 15, i === 0 ? 'C' : (i > 0 ? '\u00B1' + i : ''), 'diagram-label-tiny');
                svg.appendChild(tapLabel);
            });

            // Axis
            svg.appendChild(createLine(50, baseY, 550, baseY, 'rgba(255,255,255,0.3)', 1));

            // Labels
            svg.appendChild(createText(300, 25, 'Gaussian Weight Distribution (25-tap kernel)', 'diagram-label'));
            svg.appendChild(createText(300, baseY + 35, 'Tap offset from center', 'diagram-label-small'));

            // Gradient def
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

            // Background grid
            for (var x = -2; x <= 2; x++) {
                for (var y = -2; y <= 2; y++) {
                    var rect = createRect(centerX + x * gridSize - 18, centerY + y * gridSize - 18, 36, 36, 2, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.1)', 1);
                    svg.appendChild(rect);
                }
            }

            // Sample points with labels
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

                // Pulse animation
                circle.innerHTML = '<animate attributeName="r" values="' + radius + ';' + (radius + 3) + ';' + radius + '" dur="2s" begin="' + (i * 0.1) + 's" repeatCount="indefinite"/>';
                svg.appendChild(circle);

                var label = createText(px, py + 4, s.label, 'diagram-label-tiny');
                label.setAttribute('fill', '#fff');
                svg.appendChild(label);
            });

            // Legend
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
                // Mip rectangle
                var rect = createRect(mip.x - mip.size/2, centerY - mip.size/2, mip.size, mip.size, 4,
                    'rgba(45, 212, 191, ' + (0.15 + i * 0.1) + ')',
                    'rgba(45, 212, 191, 0.5)', 1);
                svg.appendChild(rect);

                // Label
                svg.appendChild(createText(mip.x, centerY + mip.size/2 + 20, mip.label, 'diagram-label-tiny'));

                // Arrow and + sign
                if (i < mips.length - 1) {
                    var nextMip = mips[i + 1];
                    var arrowStart = mip.x + mip.size/2 + 5;
                    var arrowEnd = nextMip.x - nextMip.size/2 - 15;

                    // Animated arrow
                    var arrow = createPath('M' + arrowStart + ',' + centerY + ' L' + arrowEnd + ',' + centerY, 'none', '#e8b923', 2);
                    arrow.setAttribute('marker-end', 'url(#arrowhead2)');
                    arrow.setAttribute('stroke-dasharray', '60');
                    arrow.setAttribute('stroke-dashoffset', '60');
                    arrow.innerHTML = '<animate attributeName="stroke-dashoffset" from="60" to="0" dur="0.5s" begin="' + (i * 0.3 + 0.5) + 's" fill="freeze"/>';
                    svg.appendChild(arrow);

                    // Plus sign
                    var plusX = (arrowStart + arrowEnd) / 2;
                    svg.appendChild(createText(plusX, centerY - 15, '+', 'diagram-label'));
                }
            });

            // Title
            svg.appendChild(createText(350, 25, 'Progressive Upsample with Additive Blending', 'diagram-label'));

            // Arrow marker
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

            // Scene input
            var sceneBox = createRect(20, 130, 80, 60, 6, 'rgba(100, 100, 255, 0.2)', 'rgba(100, 100, 255, 0.6)', 2);
            svg.appendChild(sceneBox);
            svg.appendChild(createText(60, 165, 'Scene', 'diagram-label-small'));

            // Threshold
            var threshBox = createRect(130, 130, 70, 60, 6, 'rgba(232, 185, 35, 0.2)', 'rgba(232, 185, 35, 0.6)', 2);
            svg.appendChild(threshBox);
            svg.appendChild(createText(165, 165, 'Thresh', 'diagram-label-small'));

            // Downsample chain
            var dsY = 50;
            var dsBoxes = [{x: 230, w: 50}, {x: 290, w: 40}, {x: 340, w: 30}, {x: 380, w: 20}];
            dsBoxes.forEach(function(ds, i) {
                var box = createRect(ds.x, dsY + 50 - ds.w/2, ds.w, ds.w, 4, 'rgba(45, 212, 191, 0.2)', 'rgba(45, 212, 191, 0.5)', 1);
                svg.appendChild(box);
            });
            svg.appendChild(createText(310, 25, 'Downsample + Blur', 'diagram-label-tiny'));

            // Upsample chain
            var usY = 210;
            dsBoxes.slice().reverse().forEach(function(ds, i) {
                var box = createRect(ds.x, usY + 50 - ds.w/2, ds.w, ds.w, 4, 'rgba(45, 212, 191, 0.2)', 'rgba(45, 212, 191, 0.5)', 1);
                svg.appendChild(box);
            });
            svg.appendChild(createText(310, 295, 'Upsample + Accumulate', 'diagram-label-tiny'));

            // Composite
            var compBox = createRect(450, 130, 80, 60, 6, 'rgba(255, 100, 255, 0.2)', 'rgba(255, 100, 255, 0.6)', 2);
            svg.appendChild(compBox);
            svg.appendChild(createText(490, 165, 'Composite', 'diagram-label-small'));

            // Output
            var outBox = createRect(560, 130, 80, 60, 6, 'rgba(100, 255, 100, 0.2)', 'rgba(100, 255, 100, 0.6)', 2);
            svg.appendChild(outBox);
            svg.appendChild(createText(600, 165, 'Output', 'diagram-label-small'));

            // Flow arrows
            var arrows = [
                {x1: 100, y1: 160, x2: 125, y2: 160},
                {x1: 200, y1: 160, x2: 225, y2: 90},
                {x1: 400, y1: 70, x2: 400, y2: 250},
                {x1: 225, y1: 250, x2: 445, y2: 160},
                {x1: 530, y1: 160, x2: 555, y2: 160},
                {x1: 60, y1: 195, x2: 60, y2: 270, x3: 445, y3: 160}
            ];

            // Simple arrows for flow
            svg.appendChild(createArrow(100, 160, 125, 160, '#e8b923'));
            svg.appendChild(createArrow(200, 160, 225, 90, '#e8b923'));
            svg.appendChild(createArrow(400, 90, 400, 230, '#2dd4bf'));
            svg.appendChild(createArrow(225, 250, 445, 175, '#2dd4bf'));
            svg.appendChild(createArrow(530, 160, 555, 160, '#e8b923'));

            // Bypass arrow (scene to composite)
            var bypass = createPath('M60,190 L60,270 L450,270 L450,195', 'none', 'rgba(255,255,255,0.3)', 1);
            bypass.setAttribute('stroke-dasharray', '4,4');
            bypass.setAttribute('marker-end', 'url(#arrowhead3)');
            svg.appendChild(bypass);
            svg.appendChild(createText(250, 285, 'Original scene bypass', 'diagram-label-tiny'));

            // Arrow marker
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

        // Overview: Screen-space vs Ray-marched comparison
        'volumetric-overview': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left side: Ray-marched (expensive)
            var leftGroup = createGroup('translate(170, 110)');

            // Camera
            var camera = createRect(-100, -15, 30, 30, 4, 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.5)', 1);
            leftGroup.appendChild(camera);
            leftGroup.appendChild(createText(-85, 5, 'Cam', 'diagram-label-tiny'));

            // Ray lines with sample points
            for (var r = 0; r < 5; r++) {
                var angle = (r - 2) * 0.15;
                var rayEndX = 80;
                var rayEndY = angle * 100;
                var ray = createLine(-65, 0, rayEndX, rayEndY, 'rgba(45, 212, 191, 0.3)', 1);
                leftGroup.appendChild(ray);

                // Sample points along ray
                for (var s = 0; s < 6; s++) {
                    var t = (s + 1) / 7;
                    var px = -65 + t * (rayEndX + 65);
                    var py = t * rayEndY;
                    var sampleDot = createCircle(px, py, 3, '#2dd4bf', 'none');
                    sampleDot.innerHTML = '<animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="' + (s * 0.1 + r * 0.05) + 's" repeatCount="indefinite"/>';
                    leftGroup.appendChild(sampleDot);
                }
            }

            // Light source
            var light = createCircle(80, 0, 15, '#e8b923', 'none');
            light.innerHTML = '<animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite"/>';
            leftGroup.appendChild(light);

            svg.appendChild(leftGroup);
            svg.appendChild(createText(170, 30, 'Ray Marching', 'diagram-label'));
            svg.appendChild(createText(170, 195, '~64 samples/pixel', 'diagram-label-tiny'));

            // Right side: Screen-space (fast)
            var rightGroup = createGroup('translate(520, 110)');

            // Screen quad
            var screen = createRect(-80, -60, 160, 120, 6, 'rgba(45, 212, 191, 0.05)', 'rgba(45, 212, 191, 0.3)', 1);
            rightGroup.appendChild(screen);

            // Light position on screen
            var lightScreen = createCircle(20, -10, 12, '#e8b923', 'none');
            lightScreen.innerHTML = '<animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite"/>';
            rightGroup.appendChild(lightScreen);

            // Radial gradient lines
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

            // VS divider
            svg.appendChild(createLine(350, 40, 350, 180, 'rgba(255,255,255,0.1)', 1));
            svg.appendChild(createText(350, 115, 'VS', 'diagram-label-small'));

            // Performance comparison
            svg.appendChild(createText(170, 210, 'Expensive', 'diagram-label-tiny'));
            svg.appendChild(createText(520, 210, 'Fast', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        // Radial falloff from screen-space light
        'radial-falloff-diagram': function(container, w, h) {
            var svg = createSvg(w, h);
            var centerX = 300;
            var centerY = 125;

            // Radial gradient rings
            for (var r = 120; r > 0; r -= 20) {
                var opacity = (120 - r) / 120 * 0.4 + 0.05;
                var ring = createCircle(centerX, centerY, r, 'rgba(232, 185, 35, ' + opacity + ')', 'none');
                svg.appendChild(ring);
            }

            // Light source at center
            var lightCore = createCircle(centerX, centerY, 8, '#fff', 'none');
            lightCore.innerHTML = '<animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite"/>';
            svg.appendChild(lightCore);

            // Distance labels
            var distances = [{r: 40, label: 'd=1'}, {r: 80, label: 'd=2'}, {r: 120, label: 'd=3'}];
            distances.forEach(function(d) {
                var labelX = centerX + d.r + 10;
                svg.appendChild(createText(labelX, centerY + 4, d.label, 'diagram-label-tiny'));
                svg.appendChild(createLine(centerX + d.r - 5, centerY, centerX + d.r + 5, centerY, 'rgba(255,255,255,0.5)', 1));
            });

            // Intensity formula
            svg.appendChild(createText(centerX, 230, 'I = 1 / (1 + d^falloff)', 'diagram-label-small'));

            // Falloff curve on right
            var curveX = 500;
            var curveY = 60;
            var curveW = 80;
            var curveH = 120;

            // Axes
            svg.appendChild(createLine(curveX, curveY + curveH, curveX + curveW, curveY + curveH, 'rgba(255,255,255,0.3)', 1));
            svg.appendChild(createLine(curveX, curveY + curveH, curveX, curveY, 'rgba(255,255,255,0.3)', 1));

            // Curve
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

            // Title
            svg.appendChild(createText(centerX, 25, 'Screen-Space Radial Falloff', 'diagram-title'));

            container.appendChild(svg);
        },

        // Edge fade zones visualization
        'edge-fade-visualization': function(container, w, h) {
            var svg = createSvg(w, h);
            var screenW = 280;
            var screenH = 180;
            var screenX = (w - screenW) / 2;
            var screenY = 50;

            // Outer fade zone (red)
            var outerZone = createRect(screenX - 60, screenY - 40, screenW + 120, screenH + 80, 8, 'rgba(255, 100, 100, 0.1)', 'rgba(255, 100, 100, 0.3)', 1);
            outerZone.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(outerZone);

            // Screen bounds (white)
            var screenRect = createRect(screenX, screenY, screenW, screenH, 4, 'rgba(45, 212, 191, 0.1)', 'rgba(45, 212, 191, 0.5)', 2);
            svg.appendChild(screenRect);

            // Safe zone (green inner)
            var safeZone = createRect(screenX + 40, screenY + 30, screenW - 80, screenH - 60, 4, 'rgba(100, 255, 100, 0.1)', 'rgba(100, 255, 100, 0.3)', 1);
            safeZone.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(safeZone);

            // Light positions showing fade
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

            // Labels
            svg.appendChild(createText(w/2, 25, 'Edge Fade Zones', 'diagram-title'));
            svg.appendChild(createText(screenX + screenW + 70, screenY + 20, 'Fade Zone', 'diagram-label-tiny'));
            svg.appendChild(createText(screenX + screenW/2, screenY + screenH + 25, 'Screen Bounds', 'diagram-label-tiny'));

            container.appendChild(svg);
        },

        // Perspective correction diagram
        'perspective-correction': function(container, w, h) {
            var svg = createSvg(w, h);

            // Left: Without correction (wrong)
            var leftX = 160;
            var leftY = 120;

            svg.appendChild(createText(leftX, 30, 'Without Correction', 'diagram-label'));

            // Camera
            var cam1 = createRect(30, leftY - 10, 25, 20, 3, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', 1);
            svg.appendChild(cam1);

            // Light at different distances - same screen size (wrong)
            var light1Near = createCircle(leftX - 40, leftY, 25, 'rgba(232, 185, 35, 0.4)', '#e8b923', 1);
            var light1Far = createCircle(leftX + 60, leftY, 25, 'rgba(232, 185, 35, 0.4)', '#e8b923', 1);
            svg.appendChild(light1Near);
            svg.appendChild(light1Far);
            svg.appendChild(createText(leftX - 40, leftY + 45, 'Near', 'diagram-label-tiny'));
            svg.appendChild(createText(leftX + 60, leftY + 45, 'Far', 'diagram-label-tiny'));
            svg.appendChild(createText(leftX + 10, leftY + 70, 'Same glow size', 'diagram-label-tiny'));

            // X mark
            svg.appendChild(createText(leftX, 200, 'Looks wrong', 'diagram-label-tiny'));

            // Right: With correction (correct)
            var rightX = 490;
            var rightY = 120;

            svg.appendChild(createText(rightX, 30, 'With Correction', 'diagram-label'));

            // Camera
            var cam2 = createRect(360, rightY - 10, 25, 20, 3, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', 1);
            svg.appendChild(cam2);

            // Light at different distances - proper perspective
            var light2Near = createCircle(rightX - 40, rightY, 35, 'rgba(45, 212, 191, 0.4)', '#2dd4bf', 1);
            light2Near.innerHTML = '<animate attributeName="r" values="32;38;32" dur="2s" repeatCount="indefinite"/>';
            var light2Far = createCircle(rightX + 60, rightY, 15, 'rgba(45, 212, 191, 0.4)', '#2dd4bf', 1);
            light2Far.innerHTML = '<animate attributeName="r" values="13;17;13" dur="2s" repeatCount="indefinite"/>';
            svg.appendChild(light2Near);
            svg.appendChild(light2Far);
            svg.appendChild(createText(rightX - 40, rightY + 55, 'Near (large)', 'diagram-label-tiny'));
            svg.appendChild(createText(rightX + 60, rightY + 35, 'Far (small)', 'diagram-label-tiny'));

            // Check mark
            svg.appendChild(createText(rightX, 200, 'Physically correct', 'diagram-label-tiny'));

            // VS divider
            svg.appendChild(createLine(325, 50, 325, 190, 'rgba(255,255,255,0.1)', 1));

            container.appendChild(svg);
        },

        // 3D Noise sampling via skybox direction
        'noise-sampling-diagram': function(container, w, h) {
            var svg = createSvg(w, h);
            var centerX = 300;
            var centerY = 130;

            // Camera/eye
            var eye = createCircle(80, centerY, 12, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.6)', 1);
            svg.appendChild(eye);
            svg.appendChild(createText(80, centerY + 30, 'Camera', 'diagram-label-tiny'));

            // Screen plane
            var screenX = 160;
            svg.appendChild(createLine(screenX, centerY - 80, screenX, centerY + 80, 'rgba(45, 212, 191, 0.5)', 2));
            svg.appendChild(createText(screenX, centerY + 100, 'Screen', 'diagram-label-tiny'));

            // Ray directions to skybox
            var rays = [
                {screenY: -50, skyX: 480, skyY: 40},
                {screenY: 0, skyX: 500, skyY: centerY},
                {screenY: 50, skyX: 480, skyY: 220}
            ];

            rays.forEach(function(ray, i) {
                // Ray line
                var rayLine = createLine(80, centerY, ray.skyX, ray.skyY, 'rgba(232, 185, 35, 0.4)', 1);
                rayLine.setAttribute('stroke-dasharray', '4,4');
                svg.appendChild(rayLine);

                // Screen intersection point
                var screenPt = createCircle(screenX, centerY + ray.screenY, 5, '#2dd4bf', 'none');
                screenPt.innerHTML = '<animate attributeName="r" values="4;6;4" dur="1.5s" begin="' + (i * 0.2) + 's" repeatCount="indefinite"/>';
                svg.appendChild(screenPt);

                // Skybox sample point (noise)
                var noisePt = createCircle(ray.skyX, ray.skyY, 8, '#e8b923', 'none');
                noisePt.innerHTML = '<animate attributeName="opacity" values="0.5;1;0.5" dur="2s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(noisePt);
            });

            // Skybox sphere segment
            var skyboxArc = createPath('M 450,30 Q 530,130 450,230', 'none', 'rgba(232, 185, 35, 0.3)', 2);
            svg.appendChild(skyboxArc);
            svg.appendChild(createText(530, centerY, '3D Noise', 'diagram-label-small'));
            svg.appendChild(createText(530, centerY + 18, 'Domain', 'diagram-label-small'));

            // Title
            svg.appendChild(createText(300, 25, 'View-Dependent 3D Noise Sampling', 'diagram-title'));

            container.appendChild(svg);
        },

        // FBM octave blending
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
                // Wave visualization
                var wavePath = 'M' + (oct.x - waveW/2) + ',' + waveY;
                for (var x = 0; x <= waveW; x += 2) {
                    var y = waveY + Math.sin(x / waveW * Math.PI * 2 * oct.freq) * waveH * oct.amp;
                    wavePath += ' L' + (oct.x - waveW/2 + x) + ',' + y;
                }
                var wave = createPath(wavePath, 'none', oct.color, 2);
                wave.innerHTML = '<animate attributeName="stroke-dashoffset" from="0" to="20" dur="1s" repeatCount="indefinite"/>';
                wave.setAttribute('stroke-dasharray', '10,5');
                svg.appendChild(wave);

                // Labels
                svg.appendChild(createText(oct.x, 40, oct.label, 'diagram-label'));
                svg.appendChild(createText(oct.x, 165, 'freq: ' + oct.freq + 'x', 'diagram-label-tiny'));
                svg.appendChild(createText(oct.x, 180, 'amp: ' + oct.amp, 'diagram-label-tiny'));

                // Plus signs between octaves
                if (i < octaves.length - 1) {
                    svg.appendChild(createText((oct.x + octaves[i+1].x) / 2, waveY, '+', 'diagram-label'));
                }
            });

            // Result arrow
            svg.appendChild(createText(580, waveY, '=', 'diagram-label'));
            svg.appendChild(createText(640, waveY, 'FBM', 'diagram-label'));

            container.appendChild(svg);
        },

        // Multi-light additive blending
        'multi-light-blend': function(container, w, h) {
            var svg = createSvg(w, h);

            // Three overlapping light contributions
            var lights = [
                {x: 180, y: 110, color: 'rgba(255, 150, 100, 0.4)', label: 'Light 0 (Warm)'},
                {x: 320, y: 90, color: 'rgba(100, 200, 255, 0.4)', label: 'Light 1 (Cool)'},
                {x: 450, y: 120, color: 'rgba(200, 255, 150, 0.4)', label: 'Light 2 (Green)'}
            ];

            // Draw overlapping circles with blend
            lights.forEach(function(light, i) {
                for (var r = 80; r > 0; r -= 15) {
                    var opacity = (80 - r) / 80 * 0.3;
                    var colorParts = light.color.match(/[\d.]+/g);
                    var fillColor = 'rgba(' + colorParts[0] + ',' + colorParts[1] + ',' + colorParts[2] + ',' + opacity + ')';
                    var circle = createCircle(light.x, light.y, r, fillColor, 'none');
                    svg.appendChild(circle);
                }

                // Core
                var core = createCircle(light.x, light.y, 8, '#fff', 'none');
                core.innerHTML = '<animate attributeName="r" values="6;10;6" dur="2s" begin="' + (i * 0.3) + 's" repeatCount="indefinite"/>';
                svg.appendChild(core);
            });

            // Labels
            svg.appendChild(createText(180, 200, 'Light 0', 'diagram-label-tiny'));
            svg.appendChild(createText(320, 200, 'Light 1', 'diagram-label-tiny'));
            svg.appendChild(createText(450, 200, 'Light 2', 'diagram-label-tiny'));

            // Formula
            svg.appendChild(createText(325, 25, 'result = L0 + L1 + L2 (Additive)', 'diagram-label'));

            // Overlap region highlight
            var overlapText = createText(320, 110, 'Additive', 'diagram-label-tiny');
            overlapText.setAttribute('fill', '#fff');
            svg.appendChild(overlapText);

            container.appendChild(svg);
        }
    };

    // SVG Helper functions
    function createSvg(w, h) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', 'auto');
        svg.style.maxWidth = w + 'px';
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
        rect.setAttribute('stroke-width', strokeWidth || 1);
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
        path.setAttribute('stroke', stroke || '#fff');
        path.setAttribute('stroke-width', strokeWidth || 1);
        return path;
    }

    function createText(x, y, text, className) {
        var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('class', className || '');
        textEl.textContent = text;
        return textEl;
    }

    function createArrow(x1, y1, x2, y2, color) {
        var angle = Math.atan2(y2 - y1, x2 - x1);
        var headLen = 8;

        var g = createGroup();
        g.appendChild(createLine(x1, y1, x2, y2, color, 2));

        var headPath = 'M' + x2 + ',' + y2 +
            ' L' + (x2 - headLen * Math.cos(angle - Math.PI/6)) + ',' + (y2 - headLen * Math.sin(angle - Math.PI/6)) +
            ' M' + x2 + ',' + y2 +
            ' L' + (x2 - headLen * Math.cos(angle + Math.PI/6)) + ',' + (y2 - headLen * Math.sin(angle + Math.PI/6));
        g.appendChild(createPath(headPath, 'none', color, 2));

        return g;
    }

    function createDoubleArrow(x1, y1, x2, y2, color) {
        var g = createGroup();
        g.appendChild(createArrow(x1, y1, x2, y2, color));
        g.appendChild(createArrow(x2, y2, x1, y1, color));
        return g;
    }

    function initSvgDiagrams() {
        var diagramContainers = articleContainer.querySelectorAll('.section-svg-diagram');

        diagramContainers.forEach(function(container) {
            var diagramId = container.getAttribute('data-diagram-id');
            var placeholder = container.querySelector('.svg-placeholder');

            if (placeholder && svgDiagrams[diagramId]) {
                var w = parseInt(placeholder.getAttribute('data-width')) || 600;
                var h = parseInt(placeholder.getAttribute('data-height')) || 200;

                var svgContainer = container.querySelector('.svg-container');
                svgContainer.innerHTML = '';

                try {
                    svgDiagrams[diagramId](svgContainer, w, h);
                } catch (e) {
                    console.error('Error rendering SVG diagram:', diagramId, e);
                    svgContainer.innerHTML = '<div class="svg-error">Diagram failed to load</div>';
                }
            }
        });
    }

    // ============================================
    // SYNTAX HIGHLIGHTING (BASIC)
    // ============================================

    function applySyntaxHighlighting() {
        var codeBlocks = articleContainer.querySelectorAll('.code-content pre');

        codeBlocks.forEach(function(block) {
            var code = block.textContent;

            // GLSL/C-style keywords
            var keywords = ['uniform', 'varying', 'in', 'out', 'void', 'float', 'vec2', 'vec3', 'vec4',
                'mat2', 'mat3', 'mat4', 'sampler2D', 'samplerCube', 'int', 'bool', 'const',
                'if', 'else', 'for', 'while', 'return', 'discard', 'struct', 'precision',
                'highp', 'mediump', 'lowp', 'true', 'false', 'gl_FragColor', 'gl_Position',
                'attribute', 'layout', 'location'];

            // Built-in functions
            var functions = ['texture2D', 'texture', 'normalize', 'dot', 'cross', 'mix', 'clamp',
                'smoothstep', 'step', 'length', 'distance', 'reflect', 'refract', 'pow', 'exp',
                'log', 'sqrt', 'abs', 'sign', 'floor', 'ceil', 'fract', 'mod', 'min', 'max',
                'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'radians', 'degrees', 'main'];

            // Escape HTML first
            code = escapeHtml(code);

            // Apply highlighting (order matters!)
            // Comments first
            code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
            code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

            // Numbers
            code = code.replace(/\b(\d+\.?\d*f?)\b/g, '<span class="number">$1</span>');

            // Strings
            code = code.replace(/(&quot;[^&]*&quot;|'[^']*')/g, '<span class="string">$1</span>');

            // Keywords
            keywords.forEach(function(kw) {
                var regex = new RegExp('\\b(' + kw + ')\\b', 'g');
                code = code.replace(regex, '<span class="keyword">$1</span>');
            });

            // Functions
            functions.forEach(function(fn) {
                var regex = new RegExp('\\b(' + fn + ')\\s*\\(', 'g');
                code = code.replace(regex, '<span class="function">$1</span>(');
            });

            // User-defined functions (word followed by open paren, not already highlighted)
            code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, function(match, name) {
                if (match.indexOf('<span') === -1) {
                    return '<span class="function">' + name + '</span>(';
                }
                return match;
            });

            block.innerHTML = code;
        });
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // FILTERING
    // ============================================

    function filterPosts(category) {
        currentFilter = category;

        var filtered = category === 'all'
            ? posts
            : posts.filter(function(p) { return p.category === category; });

        renderPostsGrid(filtered);

        // Update filter chip states
        filterChips.forEach(function(chip) {
            var chipCategory = chip.getAttribute('data-category');
            chip.classList.toggle('active', chipCategory === category);
            chip.setAttribute('aria-selected', chipCategory === category);
        });
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    function initFilterListeners() {
        filterChips.forEach(function(chip) {
            chip.addEventListener('click', function() {
                var category = chip.getAttribute('data-category');
                filterPosts(category);
            });
        });
    }

    function initBackButton() {
        if (backBtn) {
            backBtn.addEventListener('click', closePost);
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function initializeBlog() {
        if (blogInitialized) return;
        blogInitialized = true;

        loadBlogIndex()
            .then(function() {
                renderPostsGrid(posts);
                initFilterListeners();
                initBackButton();
            })
            .catch(function(error) {
                console.error('Blog initialization error:', error);
                if (postsGrid) {
                    postsGrid.innerHTML =
                        '<div class="blog-empty">' +
                            '<p>Unable to load blog posts.</p>' +
                            '<p style="font-size: 0.8em; opacity: 0.7;">Check that blog/index.json exists.</p>' +
                        '</div>';
                }
            });
    }

    // Initialize when blog tab is activated (lazy loading)
    document.addEventListener('click', function(e) {
        var tab = e.target.closest('.chrome-tab[data-panel="blog"]');
        if (tab) {
            // Small delay to ensure DOM is ready
            setTimeout(initializeBlog, 100);
        }
    });

    // Also check if blog panel is already visible on page load
    var blogPanel = document.getElementById('panel-blog');
    if (blogPanel && blogPanel.classList.contains('active')) {
        initializeBlog();
    }

    // Expose for external use if needed
    window.blogModule = {
        refresh: function() {
            blogInitialized = false;
            initializeBlog();
        },
        filterPosts: filterPosts
    };

})();
