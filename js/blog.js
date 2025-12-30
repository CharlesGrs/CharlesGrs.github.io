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

        // Create "New" badge if post is less than 30 days old
        var postDate = new Date(post.date);
        var now = new Date();
        var daysDiff = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));
        var newBadge = daysDiff <= 30
            ? '<span class="card-new-badge">New</span>'
            : '';

        // Create tags HTML (limit to 3)
        var tagsHtml = (post.tags || []).slice(0, 3).map(function(tag) {
            return '<span class="card-tag">' + tag + '</span>';
        }).join('');

        card.innerHTML =
            '<div class="card-thumbnail">' +
                thumbnailContent +
                newBadge +
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

        // Remove TOC
        removeToc();

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
        (post.sections || []).forEach(function(section, index) {
            contentHtml += renderSection(section, index);
        });
        contentHtml += '</div>';

        articleContainer.innerHTML = headerHtml + contentHtml;

        // Generate and insert Table of Contents
        generateTableOfContents();

        // Apply syntax highlighting to code blocks
        applySyntaxHighlighting();

        // Initialize SVG diagrams
        initSvgDiagrams();

        // Initialize shader demos
        initShaderDemos();
    }

    function renderSection(section, index) {
        switch (section.type) {
            case 'intro':
                return '<p class="article-section section-intro">' + section.content + '</p>';

            case 'heading':
                var tag = 'h' + (section.level || 2);
                var headingId = 'section-' + index + '-' + slugify(section.content);
                return '<' + tag + ' id="' + headingId + '" class="article-section section-heading" data-toc-level="' + (section.level || 2) + '">' + section.content + '</' + tag + '>';

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

            case 'shader-demo':
                // Store shader config in data attribute for later initialization
                var shaderConfig = {
                    vertexShader: section.vertexShader,
                    fragmentShader: section.fragmentShader,
                    uniforms: section.uniforms || {}
                };
                var controlsHtml = '';
                if (section.controls && section.controls.length > 0) {
                    controlsHtml = '<div class="shader-controls">' +
                        section.controls.map(function(ctrl) {
                            return '<div class="shader-control">' +
                                '<label>' + ctrl.label + '</label>' +
                                '<input type="range" ' +
                                    'data-uniform="' + ctrl.uniform + '" ' +
                                    'min="' + (ctrl.min || 0) + '" ' +
                                    'max="' + (ctrl.max || 1) + '" ' +
                                    'step="' + (ctrl.step || 0.01) + '" ' +
                                    'value="' + (ctrl.default || 0.5) + '">' +
                                '<span class="control-value">' + (ctrl.default || 0.5) + '</span>' +
                            '</div>';
                        }).join('') +
                    '</div>';
                }
                return '<figure class="article-section section-shader-demo" data-demo-id="' + section.id + '" data-shader-config=\'' + JSON.stringify(shaderConfig).replace(/'/g, '&#39;') + '\'>' +
                    '<div class="shader-canvas-container" style="max-width: ' + (section.width || 700) + 'px;">' +
                        '<canvas class="shader-canvas" width="' + (section.width || 700) + '" height="' + (section.height || 400) + '"></canvas>' +
                        '<div class="shader-loading">Initializing WebGL...</div>' +
                    '</div>' +
                    controlsHtml +
                    (section.title ? '<figcaption>' + section.title + '</figcaption>' : '') +
                '</figure>';

            default:
                return '';
        }
    }

    // ============================================
    // SVG DIAGRAM INITIALIZATION
    // Diagrams are defined in js/blog-diagrams.js
    // ============================================

    function initSvgDiagrams() {
        var svgDiagrams = window.blogSvgDiagrams || {};
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
            } else if (placeholder && !svgDiagrams[diagramId]) {
                console.warn('SVG diagram not found:', diagramId);
            }
        });
    }

    // ============================================
    // WEBGL SHADER DEMOS
    // Interactive shader examples - config loaded from JSON
    // ============================================

    // Active demo instances for animation
    var activeDemos = [];

    function initShaderDemos() {
        // Clean up any existing demos
        activeDemos.forEach(function(demo) {
            if (demo.animationId) {
                cancelAnimationFrame(demo.animationId);
            }
        });
        activeDemos = [];

        var demoContainers = articleContainer.querySelectorAll('.section-shader-demo');

        demoContainers.forEach(function(container) {
            var demoId = container.getAttribute('data-demo-id');
            var canvas = container.querySelector('.shader-canvas');
            var loadingEl = container.querySelector('.shader-loading');

            // Read shader config from data attribute (defined in JSON)
            var configStr = container.getAttribute('data-shader-config');
            var shaderConfig = null;

            try {
                shaderConfig = configStr ? JSON.parse(configStr) : null;
            } catch (e) {
                console.error('Invalid shader config JSON:', e);
            }

            if (!canvas || !shaderConfig || !shaderConfig.vertexShader || !shaderConfig.fragmentShader) {
                if (loadingEl) loadingEl.textContent = 'Shader config missing for: ' + demoId;
                return;
            }

            try {
                var demo = initWebGLDemo(canvas, shaderConfig, container);
                if (demo) {
                    activeDemos.push(demo);
                    if (loadingEl) loadingEl.style.display = 'none';
                }
            } catch (e) {
                console.error('Error initializing shader demo:', demoId, e);
                if (loadingEl) {
                    loadingEl.textContent = 'WebGL error: ' + e.message;
                    loadingEl.classList.add('error');
                }
            }
        });
    }

    function initWebGLDemo(canvas, demoConfig, container) {
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            throw new Error('WebGL not supported');
        }

        // Create shaders
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, demoConfig.vertexShader);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            throw new Error('Vertex shader: ' + gl.getShaderInfoLog(vertShader));
        }

        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, demoConfig.fragmentShader);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            throw new Error('Fragment shader: ' + gl.getShaderInfoLog(fragShader));
        }

        // Create program
        var program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Program link: ' + gl.getProgramInfoLog(program));
        }

        gl.useProgram(program);

        // Create fullscreen quad
        var posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);

        var posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Get uniform locations
        var uniformLocs = {};
        var uniformValues = {};
        for (var name in demoConfig.uniforms) {
            uniformLocs[name] = gl.getUniformLocation(program, name);
            uniformValues[name] = demoConfig.uniforms[name].value;
        }

        // Set resolution uniform if exists
        if (uniformLocs.u_resolution) {
            gl.uniform2f(uniformLocs.u_resolution, canvas.width, canvas.height);
        }

        // Setup control listeners
        var controls = container.querySelectorAll('.shader-control input[type="range"]');
        controls.forEach(function(input) {
            var uniformName = input.getAttribute('data-uniform');
            var valueDisplay = input.parentElement.querySelector('.control-value');

            input.addEventListener('input', function() {
                var val = parseFloat(input.value);
                uniformValues[uniformName] = val;
                if (valueDisplay) {
                    valueDisplay.textContent = val.toFixed(2);
                }
            });
        });

        // Animation loop
        var startTime = performance.now();
        var animationId = null;

        function render() {
            var elapsed = (performance.now() - startTime) / 1000;

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.04, 0.06, 0.08, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(program);

            // Update uniforms
            for (var name in uniformLocs) {
                var loc = uniformLocs[name];
                if (!loc) continue;

                if (name === 'u_time') {
                    gl.uniform1f(loc, elapsed);
                } else if (name === 'u_resolution') {
                    gl.uniform2f(loc, canvas.width, canvas.height);
                } else {
                    var val = uniformValues[name];
                    if (typeof val === 'number') {
                        gl.uniform1f(loc, val);
                    } else if (Array.isArray(val) && val.length === 2) {
                        gl.uniform2f(loc, val[0], val[1]);
                    } else if (Array.isArray(val) && val.length === 3) {
                        gl.uniform3f(loc, val[0], val[1], val[2]);
                    }
                }
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            animationId = requestAnimationFrame(render);
        }

        render();

        return {
            gl: gl,
            program: program,
            animationId: animationId,
            stop: function() {
                if (animationId) cancelAnimationFrame(animationId);
            }
        };
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
    // SLUGIFY - Generate URL-friendly IDs
    // ============================================

    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim()
            .substring(0, 50);
    }

    // ============================================
    // TABLE OF CONTENTS
    // Generates navigation from headings
    // ============================================

    var tocObserver = null;
    var tocContainer = null;

    function generateTableOfContents() {
        // Find all headings in the article
        var headings = articleContainer.querySelectorAll('.section-heading[id]');

        // Need at least 2 headings for a TOC
        if (headings.length < 2) {
            removeToc();
            return;
        }

        // Remove existing TOC if any
        removeToc();

        // Create TOC container
        tocContainer = document.createElement('aside');
        tocContainer.className = 'article-toc';
        tocContainer.innerHTML =
            '<div class="toc-header">' +
                '<svg class="toc-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M4 6h16M4 12h16M4 18h10"/>' +
                '</svg>' +
                '<span class="toc-header-title">Contents</span>' +
            '</div>' +
            '<nav class="toc-nav"></nav>';

        var tocNav = tocContainer.querySelector('.toc-nav');

        // Build TOC items from headings
        headings.forEach(function(heading) {
            var level = parseInt(heading.getAttribute('data-toc-level')) || 2;
            var item = document.createElement('a');
            item.className = 'toc-item' + (level >= 3 ? ' toc-subchapter' : '');
            item.href = '#' + heading.id;
            item.textContent = heading.textContent.replace(/^\/\/\s*/, ''); // Remove // prefix
            item.setAttribute('data-target', heading.id);

            // Smooth scroll on click
            item.addEventListener('click', function(e) {
                e.preventDefault();
                var target = document.getElementById(heading.id);
                if (target) {
                    // Get the scroll container
                    var scrollContainer = postView;
                    var targetOffset = target.offsetTop - 80;

                    scrollContainer.scrollTo({
                        top: targetOffset,
                        behavior: 'smooth'
                    });

                    // Update active state - let scroll tracking handle settled
                    setActiveTocItem(heading.id, false);
                }
            });

            tocNav.appendChild(item);
        });

        // Insert TOC after the article in the post view
        postView.appendChild(tocContainer);

        // Initialize scroll tracking
        initScrollTracking(headings);
    }

    function removeToc() {
        if (tocContainer && tocContainer.parentNode) {
            tocContainer.parentNode.removeChild(tocContainer);
            tocContainer = null;
        }
        if (tocObserver) {
            tocObserver.disconnect();
            tocObserver = null;
        }
    }

    var settleTimeout = null;
    var currentActiveId = null;

    function setActiveTocItem(activeId, immediate) {
        if (!tocContainer) return;

        // Clear any pending settle timeout
        if (settleTimeout) {
            clearTimeout(settleTimeout);
            settleTimeout = null;
        }

        // Remove settled class from all items immediately
        var items = tocContainer.querySelectorAll('.toc-item');
        items.forEach(function(item) {
            item.classList.remove('settled');
        });

        // Update active state
        items.forEach(function(item) {
            var isActive = item.getAttribute('data-target') === activeId;
            item.classList.toggle('active', isActive);
        });

        currentActiveId = activeId;

        // Set settled state after delay (when scrolling stops)
        var delay = immediate ? 0 : 150;
        settleTimeout = setTimeout(function() {
            if (!tocContainer) return;
            var activeItem = tocContainer.querySelector('.toc-item[data-target="' + currentActiveId + '"]');
            if (activeItem) {
                activeItem.classList.add('settled');
            }
        }, delay);
    }

    function initScrollTracking(headings) {
        // Disconnect existing observer
        if (tocObserver) {
            tocObserver.disconnect();
        }

        // Use IntersectionObserver to track which section is visible
        var observerOptions = {
            root: postView,
            rootMargin: '-80px 0px -60% 0px',
            threshold: 0
        };

        tocObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    setActiveTocItem(entry.target.id, false);
                }
            });
        }, observerOptions);

        // Observe all headings
        headings.forEach(function(heading) {
            tocObserver.observe(heading);
        });

        // Set initial active state (first heading) - immediate settle
        if (headings.length > 0) {
            setActiveTocItem(headings[0].id, true);
        }
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

                // Check for deep link via URL parameter
                checkDeepLink();
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

    // ============================================
    // DEEP LINKING - Open post from URL parameter
    // URL format: /?post=screen-space-atmospheric-scattering
    // ============================================

    function checkDeepLink() {
        var params = new URLSearchParams(window.location.search);
        var postId = params.get('post');

        if (postId) {
            // Find the post by ID
            var post = posts.find(function(p) { return p.id === postId; });
            if (post) {
                // Switch to blog tab first
                switchToBlogTab();
                // Open the post after a short delay
                setTimeout(function() {
                    openPost(post);
                }, 150);
            }
        }
    }

    function switchToBlogTab() {
        // Find and click the blog tab to activate it
        var blogTab = document.querySelector('.chrome-tab[data-panel="blog"]');
        if (blogTab && !blogTab.classList.contains('active')) {
            blogTab.click();
        }
    }

    // Check for deep link on page load
    function checkInitialDeepLink() {
        var params = new URLSearchParams(window.location.search);
        var postId = params.get('post');

        if (postId) {
            // Switch to blog tab and initialize
            switchToBlogTab();
            setTimeout(initializeBlog, 100);
        }
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

    // Check for deep link parameter on initial page load
    document.addEventListener('DOMContentLoaded', checkInitialDeepLink);

    // Expose for external use if needed
    window.blogModule = {
        refresh: function() {
            blogInitialized = false;
            initializeBlog();
        },
        filterPosts: filterPosts,
        openPostById: function(postId) {
            var post = posts.find(function(p) { return p.id === postId; });
            if (post) {
                switchToBlogTab();
                setTimeout(function() {
                    openPost(post);
                }, 150);
            }
        }
    };

})();
