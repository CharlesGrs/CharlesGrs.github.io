// ============================================
// COUNTING ANIMATION FOR STATS
// ============================================
(function initStats() {
    // Animate stat-number, impact-number, and hero-stat-number elements
    const stats = document.querySelectorAll('.stat-number[data-target], .impact-number[data-target], .hero-stat-number[data-target]');
    stats.forEach((stat, index) => {
        const target = parseInt(stat.dataset.target);
        const suffix = stat.dataset.suffix || '';
        let current = 0;
        const duration = 1200;
        // Hero stats animate slightly later to sync with CSS animation
        const isHeroStat = stat.classList.contains('hero-stat-number');
        const startDelay = isHeroStat ? 1000 + index * 100 : 400 + index * 150;
        const stepTime = Math.max(duration / target, 20);

        setTimeout(() => {
            const interval = setInterval(() => {
                current++;
                stat.textContent = current + (current === target ? suffix : '');
                if (current >= target) clearInterval(interval);
            }, stepTime);
        }, startDelay);
    });
})();

// ============================================
// STAGGERED REVEAL ANIMATIONS
// ============================================
(function initAnimations() {
    document.querySelectorAll('.client-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.08}s`; });
    document.querySelectorAll('.project-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.12}s`; });
})();

// ============================================
// GPU PIPELINE PORTFOLIO VISUALIZATION
// ============================================
(function initPipelinePortfolio() {
    const passes = document.querySelectorAll('.render-pass');
    const viewport = document.getElementById('main-viewport');
    const titleEl = document.getElementById('pipeline-title');
    const tagEl = document.getElementById('project-tag');
    const linkEl = document.getElementById('project-link');
    const track = document.getElementById('pipeline-track');
    const prevBtn = document.querySelector('.strip-nav.prev');
    const nextBtn = document.querySelector('.strip-nav.next');

    if (!passes.length || !viewport) return;

    let currentIndex = 0;
    const totalItems = passes.length;
    let activeVideo = null;

    // Clone media from pass to viewport
    function updateViewport(pass) {
        const media = pass.querySelector('img, video');
        if (!media) return;

        // Add loading state
        viewport.classList.add('loading');

        // Clear current viewport
        viewport.innerHTML = '';

        // Clone the media element
        const clone = media.cloneNode(true);

        // For videos, set up proper attributes
        if (clone.tagName === 'VIDEO') {
            clone.muted = pass.dataset.hasAudio !== 'true';
            clone.loop = true;
            clone.playsInline = true;

            // Load the video if it has data-src
            if (clone.dataset.src && !clone.src) {
                var mp4Src = clone.dataset.src;
                var webmSrc = mp4Src.replace('.mp4', '.webm');
                var canPlayWebm = clone.canPlayType('video/webm; codecs="vp9"');
                clone.src = (canPlayWebm === 'probably' || canPlayWebm === 'maybe') ? webmSrc : mp4Src;
            }

            clone.addEventListener('loadeddata', function() {
                viewport.classList.remove('loading');
            });

            clone.addEventListener('canplay', function() {
                clone.play().catch(function() {});
            });

            activeVideo = clone;
        } else {
            clone.addEventListener('load', function() {
                viewport.classList.remove('loading');
            });
            activeVideo = null;
        }

        viewport.appendChild(clone);

        // Remove loading state after timeout as fallback
        setTimeout(function() {
            viewport.classList.remove('loading');
        }, 1000);
    }

    // Update the active pass and viewport
    function goToPass(index) {
        if (index < 0) index = totalItems - 1;
        if (index >= totalItems) index = 0;

        // Pause previous video
        if (activeVideo) {
            activeVideo.pause();
        }

        currentIndex = index;
        const pass = passes[currentIndex];

        // Update active states
        passes.forEach(function(p, i) {
            p.classList.toggle('active', i === currentIndex);
        });

        // Update viewport
        updateViewport(pass);

        // Update info
        if (titleEl) titleEl.textContent = pass.dataset.title || '';
        if (tagEl) tagEl.textContent = pass.dataset.tag || '';
        if (linkEl) {
            linkEl.href = pass.dataset.url || '';
            linkEl.style.display = pass.dataset.url ? '' : 'none';
        }

        // Scroll to center the active pass
        scrollToPass(currentIndex);
    }

    // Scroll the strip to center the active pass
    function scrollToPass(index) {
        if (!track) return;
        var pass = passes[index];
        if (!pass) return;

        var trackRect = track.getBoundingClientRect();
        var passRect = pass.getBoundingClientRect();
        var scrollLeft = track.scrollLeft;
        var passCenter = passRect.left - trackRect.left + scrollLeft + passRect.width / 2;
        var targetScroll = passCenter - trackRect.width / 2;

        track.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    }

    // Navigation
    if (prevBtn) prevBtn.addEventListener('click', function() { goToPass(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goToPass(currentIndex + 1); });

    // Click on pass nodes
    passes.forEach(function(pass, i) {
        pass.addEventListener('click', function() {
            if (i === currentIndex) {
                // If clicking active pass, open URL or toggle audio
                if (pass.dataset.hasAudio === 'true' && activeVideo) {
                    activeVideo.muted = !activeVideo.muted;
                    if (!activeVideo.muted) activeVideo.play().catch(function() {});
                } else if (pass.dataset.url) {
                    window.open(pass.dataset.url, '_blank');
                }
            } else {
                goToPass(i);
            }
        });
    });

    // Click on main viewport to open URL
    viewport.addEventListener('click', function() {
        var pass = passes[currentIndex];
        if (pass && pass.dataset.url) {
            window.open(pass.dataset.url, '_blank');
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        var portfolioPanel = document.getElementById('panel-portfolio');
        if (!portfolioPanel || !portfolioPanel.classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowLeft':
                goToPass(currentIndex - 1);
                e.preventDefault();
                break;
            case 'ArrowRight':
                goToPass(currentIndex + 1);
                e.preventDefault();
                break;
            case 'Enter':
                var pass = passes[currentIndex];
                if (pass && pass.dataset.url) {
                    window.open(pass.dataset.url, '_blank');
                }
                e.preventDefault();
                break;
            case ' ':
                if (activeVideo) {
                    if (activeVideo.paused) {
                        activeVideo.play().catch(function() {});
                    } else {
                        activeVideo.pause();
                    }
                    e.preventDefault();
                }
                break;
        }
    });

    // Touch swipe on viewport
    var touchStartX = 0;
    viewport.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', function(e) {
        var diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            goToPass(currentIndex + (diff > 0 ? 1 : -1));
        }
    }, { passive: true });

    // Mouse wheel on strip
    if (track) {
        var wheelThrottled = false;
        track.addEventListener('wheel', function(e) {
            if (wheelThrottled) return;
            wheelThrottled = true;

            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                // Horizontal scroll - let it scroll naturally
            } else {
                // Vertical scroll - navigate
                e.preventDefault();
                goToPass(currentIndex + (e.deltaY > 0 ? 1 : -1));
            }

            setTimeout(function() { wheelThrottled = false; }, 300);
        }, { passive: false });
    }

    // Initialize first pass
    goToPass(0);
})();

// ============================================
// TYPEWRITER EFFECT WITH TYPOS
// ============================================
(function initTypewriter() {
    const container = document.getElementById('typewriter-container');
    const typingIndicator = document.getElementById('typing-indicator');
    const dots = typingIndicator ? typingIndicator.querySelectorAll('.typing-dots span') : [];
    if (!container) return;

    const fullText = [
        { text: 'Founder of ', highlight: false },
        { text: 'Zylaris Ltd', highlight: true },
        { text: ' — the studio AAA teams call when ', highlight: false },
        { text: 'performance is non-negotiable', highlight: true },
        { text: '.', highlight: false, pauseAfter: 500 },
        { text: ' 8+ years pushing pixels for ', highlight: false },
        { text: 'Meta', highlight: true },
        { text: ', ', highlight: false },
        { text: 'Ubisoft', highlight: true },
        { text: ', ', highlight: false },
        { text: 'Nexus Studios', highlight: true },
        { text: ', and ', highlight: false },
        { text: '12+ studios worldwide', highlight: true },
        { text: '.', highlight: false, pauseAfter: 600 },
        { text: ' From ', highlight: false },
        { text: '90 FPS VR', highlight: true },
        { text: ' on Quest to ', highlight: false },
        { text: '16K immersive installations', highlight: true },
        { text: ' — I build rendering systems that ship.', highlight: false, pauseAfter: 500 },
        { text: ' ', highlight: false },
        { text: '100+ shaders', highlight: true },
        { text: ' delivered. ', highlight: false },
        { text: '70% average performance gains', highlight: true },
        { text: '. ', highlight: false },
        { text: '15× faster light baking', highlight: true },
        { text: '.', highlight: false, pauseAfter: 600 },
        { text: ' Video games, VR, ', highlight: false },
        { text: 'Web3', highlight: true },
        { text: ', projection mapping — if it runs on a GPU, I optimize it.', highlight: false, pauseAfter: 500 },
        { text: ' Latest: ', highlight: false },
        { text: 'Blumhouse Enhanced Cinema', highlight: true },
        { text: ' on ', highlight: false },
        { text: 'Meta Quest 3', highlight: true },
        { text: '.', highlight: false }
    ];

    const typos = [
        { pos: 35, wrong: 'z', correct: 's' },
        { pos: 120, wrong: 'n', correct: 'm' },
    ];

    // Create invisible placeholder to reserve space for full text
    const placeholder = document.createElement('span');
    placeholder.className = 'typewriter-placeholder';
    placeholder.textContent = fullText.map(s => s.text).join('');
    placeholder.setAttribute('aria-hidden', 'true');
    container.appendChild(placeholder);

    // Create content wrapper for typed text (positioned over placeholder)
    const contentWrapper = document.createElement('span');
    contentWrapper.className = 'typewriter-content';
    container.appendChild(contentWrapper);

    let cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    contentWrapper.appendChild(cursor);

    let globalPos = 0, segmentIndex = 0, charIndex = 0, currentSpan = null;
    let typoQueue = [...typos].sort((a, b) => a.pos - b.pos);
    let isDeleting = false, deleteCount = 0, typoChar = null;
    let dotIndex = 0;

    const dotInterval = setInterval(() => {
        if (!dots.length) return;
        dots.forEach((dot, i) => dot.classList.toggle('visible', i < dotIndex));
        dotIndex = (dotIndex + 1) % 4;
    }, 300);

    // Fast typing
    function getBaseDelay() {
        return 8 + Math.random() * 12; // 8-20ms per character
    }

    function finishTyping() {
        cursor.classList.add('hidden');
        if (typingIndicator) typingIndicator.classList.add('hidden');
        clearInterval(dotInterval);

        // Add terminal prompt line with blinking cursor
        const promptLine = document.createElement('div');
        promptLine.className = 'terminal-prompt-line';
        promptLine.innerHTML = '<span class="prompt-path">~/charles/gpu_profile</span><span class="prompt-arrow">&gt;</span><span class="prompt-cursor">_</span>';
        container.parentNode.appendChild(promptLine);
    }

    function type() {
        if (segmentIndex >= fullText.length) { finishTyping(); return; }

        const segment = fullText[segmentIndex];
        if (!currentSpan) {
            currentSpan = document.createElement('span');
            if (segment.highlight) currentSpan.className = 'highlight-text';
            contentWrapper.insertBefore(currentSpan, cursor);
        }

        const currentTypo = typoQueue[0];
        if (currentTypo && globalPos === currentTypo.pos && !isDeleting && !typoChar) {
            typoChar = document.createElement('span');
            typoChar.className = 'typo-char';
            typoChar.textContent = currentTypo.wrong;
            currentSpan.appendChild(typoChar);
            globalPos++; charIndex++;
            setTimeout(() => { isDeleting = true; deleteCount = 1; setTimeout(type, 40 + Math.random() * 30); }, 60 + Math.random() * 40);
            return;
        }

        if (isDeleting && deleteCount > 0) {
            if (typoChar) { typoChar.remove(); typoChar = null; }
            globalPos--; charIndex--; deleteCount--;
            isDeleting = false; typoQueue.shift();
            setTimeout(type, 50);
            return;
        }

        if (charIndex < segment.text.length) {
            currentSpan.textContent += segment.text[charIndex];
            charIndex++; globalPos++;
            let delay = getBaseDelay();
            const char = segment.text[charIndex - 1];
            if (['.', ',', '!', '?'].includes(char)) delay += 30 + Math.random() * 20;
            setTimeout(type, delay);
        } else {
            // Check for explicit pause after segment
            const pauseTime = segment.pauseAfter || getBaseDelay();
            segmentIndex++; charIndex = 0; currentSpan = null;
            setTimeout(type, pauseTime);
        }
    }

    setTimeout(type, 500);
})();

// ============================================
// PROJECT LIST SCROLL HANDLER
// ============================================
(function initProjectScroll() {
    const wrapper = document.getElementById('project-list-wrapper');
    const list = document.getElementById('project-list');
    const hint = wrapper ? wrapper.querySelector('.scroll-hint') : null;
    if (!wrapper || !list) return;

    function updateScrollState() {
        const scrollPos = list.scrollTop;
        const maxScroll = list.scrollHeight - list.clientHeight;
        wrapper.classList.remove('scrolled-top', 'scrolled-middle', 'scrolled-end');
        if (scrollPos <= 10) { wrapper.classList.add('scrolled-top'); if (hint) hint.style.opacity = '0.7'; }
        else if (scrollPos >= maxScroll - 10) { wrapper.classList.add('scrolled-end'); if (hint) hint.style.opacity = '0'; }
        else { wrapper.classList.add('scrolled-middle'); if (hint) hint.style.opacity = '0.5'; }
    }

    list.addEventListener('scroll', updateScrollState);
    updateScrollState();
})();

// ============================================
// TABBED CAROUSEL
// ============================================
(function initTabs() {
    const tabs = document.querySelectorAll('.chrome-tab, .pipeline-node, .carousel-tab');
    const panels = document.querySelectorAll('.carousel-panel');
    if (!tabs.length || !panels.length) return;

    function triggerPanelAnimations(panel) {
        panel.querySelectorAll('.client-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.08}s`; });
        panel.querySelectorAll('.project-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.12}s`; });
        const portfolioCarousel = panel.querySelector('.portfolio-carousel');
        if (portfolioCarousel) { portfolioCarousel.style.animation = 'none'; portfolioCarousel.offsetHeight; portfolioCarousel.style.animation = ''; }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const panelId = tab.dataset.panel;
            const container = document.querySelector('.container');

            // Get the index of clicked tab
            const activeIndex = parseInt(tab.dataset.index) || 0;

            // Update active and loaded states
            tabs.forEach(t => {
                t.classList.remove('active');
                const tabIndex = parseInt(t.dataset.index) || 0;
                // Add 'loaded' class to all tabs up to and including active
                if (tabIndex <= activeIndex) {
                    t.classList.add('loaded');
                } else {
                    t.classList.remove('loaded');
                }
            });
            tab.classList.add('active');

            // Hide hero sections and show the selected panel
            if (container) {
                container.classList.add('hero-hidden');
            }
            panels.forEach(panel => {
                if (panel.id === `panel-${panelId}`) { panel.classList.add('active'); triggerPanelAnimations(panel); }
                else panel.classList.remove('active');
            });

            // Show/hide settings panel based on whether skills tab with graph view is active
            const settingsPanel = document.getElementById('settings-panel');
            if (settingsPanel) {
                if (panelId === 'skills') {
                    // Only show if graph view is active
                    const graphBtn = document.querySelector('.view-toggle-btn[data-view="graph"]');
                    const isGraphView = graphBtn && graphBtn.classList.contains('active');
                    settingsPanel.style.display = isGraphView ? '' : 'none';
                } else {
                    settingsPanel.style.display = 'none';
                }
            }

            if (panelId === 'skills') {
                window.dispatchEvent(new Event('skillsTabActivated'));
                window.dispatchEvent(new Event('resize'));
            }
            // Lazy load portfolio videos when Portfolio tab is activated
            if (panelId === 'portfolio') {
                const portfolioPanel = document.getElementById('panel-portfolio');
                if (portfolioPanel) {
                    portfolioPanel.querySelectorAll('video[data-src]').forEach(video => {
                        if (!video.src || video.src === window.location.href) {
                            // Prefer WebM format if browser supports it
                            var mp4Src = video.dataset.src;
                            var webmSrc = mp4Src.replace('.mp4', '.webm');

                            // Check if browser supports WebM
                            var canPlayWebm = video.canPlayType('video/webm; codecs="vp9"');
                            if (canPlayWebm === 'probably' || canPlayWebm === 'maybe') {
                                video.src = webmSrc;
                            } else {
                                video.src = mp4Src;
                            }

                            video.preload = 'auto';
                            video.load();
                            // Only auto-play muted videos; videos with audio require user interaction
                            if (video.muted) {
                                video.addEventListener('canplaythrough', () => {
                                    video.play().catch(() => {});
                                }, { once: true });
                            }
                        }
                    });
                }
            }
        });
    });
})();

// ============================================
// SKILLS VIEW TOGGLE
// ============================================
(function initSkillsToggle() {
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn[data-view]');
    const graphView = document.getElementById('skills-graph-view');
    const listView = document.getElementById('skills-list-view');
    const shaderControls = document.getElementById('shader-controls-container');
    const skillsPanel = document.getElementById('panel-skills');
    const canvasSection = document.getElementById('canvas-section');

    if (!viewToggleBtns.length || !listView) return;

    // Set graph view as default
    function setGraphViewActive() {
        // Update button states
        viewToggleBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.view === 'graph');
        });
        // Hide list view
        listView.classList.remove('active');
        // Show canvas section for 3D WebGL graph
        if (canvasSection) {
            canvasSection.classList.add('active');
        }
        // Show graphView as transparent overlay for 2D labels
        if (graphView) {
            graphView.classList.add('active');
        }
        // Enable graph mode for panel
        if (skillsPanel) {
            skillsPanel.classList.add('graph-active');
        }
        // Show shader controls
        if (shaderControls) {
            shaderControls.style.display = '';
        }
        // Trigger resize after DOM is ready
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('resize'));
            });
        });
    }

    // Initialize with graph view as default
    setGraphViewActive();

    // View toggle (graph/list)
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;

            // Update button states
            viewToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle views
            if (view === 'graph') {
                // Hide list view, show canvas section AND graphView (for labels overlay)
                listView.classList.remove('active');
                // Show canvas section for 3D WebGL graph
                if (canvasSection) {
                    canvasSection.classList.add('active');
                }
                // Show graphView as transparent overlay for 2D labels
                if (graphView) {
                    graphView.classList.add('active');
                }
                // Enable graph mode for panel
                if (skillsPanel) {
                    skillsPanel.classList.add('graph-active');
                }
                // Show shader controls
                if (shaderControls) {
                    shaderControls.style.display = '';
                }
                // Show settings panel
                const settingsPanel = document.getElementById('settings-panel');
                if (settingsPanel) {
                    settingsPanel.style.display = '';
                }
                // Trigger multiple resizes to ensure canvas gets proper dimensions
                // Double RAF ensures CSS transitions have fully applied
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        window.dispatchEvent(new Event('resize'));
                        // Additional resize after a short delay for safety
                        setTimeout(() => {
                            window.dispatchEvent(new Event('resize'));
                        }, 100);
                    });
                });
            } else {
                // Show list view, hide canvas
                listView.classList.add('active');
                if (graphView) graphView.classList.remove('active');
                // Hide canvas section for list view
                if (canvasSection) {
                    canvasSection.classList.remove('active');
                }
                // Disable graph mode for panel
                if (skillsPanel) {
                    skillsPanel.classList.remove('graph-active');
                }
                // Hide shader controls
                if (shaderControls) {
                    shaderControls.style.display = 'none';
                }
                // Hide settings panel
                const settingsPanel = document.getElementById('settings-panel');
                if (settingsPanel) {
                    settingsPanel.style.display = 'none';
                }
            }
        });
    });
})();

// ============================================
// STATIC FAVICON - STYLIZED "CG" MONOGRAM
// ============================================
(function initFavicon() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const link = document.getElementById('favicon');
    const gold = '#e8b923';
    const darkBg = '#0a0f14';

    // Draw background
    ctx.fillStyle = darkBg;
    ctx.fillRect(0, 0, 32, 32);

    // Draw outer glow
    const glowGradient = ctx.createRadialGradient(16, 16, 8, 16, 16, 16);
    glowGradient.addColorStop(0, 'rgba(232, 185, 35, 0.3)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, 32, 32);

    // Draw hexagon shape
    ctx.beginPath();
    const sides = 6;
    const radius = 12;
    const centerX = 16, centerY = 16;
    for (let i = 0; i < sides; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw "C" letter stylized
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = gold;
    ctx.fillText('C', 16, 17);

    // Set favicon
    link.href = canvas.toDataURL('image/png');
})();

// ============================================
// FPS PERFORMANCE COUNTER WITH RENDER TIME
// ============================================
(function initFPS() {
    const fpsBadge = document.getElementById('fps-badge');
    const fpsValue = document.getElementById('fps-value');
    const gpuValue = document.getElementById('gpu-value');
    if (!fpsBadge || !fpsValue) return;

    let frameCount = 0, lastTime = performance.now(), fps = 60;

    function updateFPS() {
        const now = performance.now();
        frameCount++;
        const elapsed = now - lastTime;

        if (elapsed >= 500) {
            fps = Math.round((frameCount * 1000) / elapsed);
            frameCount = 0; lastTime = now;
            fpsValue.textContent = fps;
            fpsBadge.classList.remove('good', 'warn', 'bad');
            if (fps >= 50) fpsBadge.classList.add('good');
            else if (fps >= 30) fpsBadge.classList.add('warn');
            else fpsBadge.classList.add('bad');

            // Update render time display from global timing system
            if (gpuValue && window.renderTiming && typeof window.renderTiming.average === 'number') {
                gpuValue.textContent = window.renderTiming.average.toFixed(2);
            }
        }

        requestAnimationFrame(updateFPS);
    }

    requestAnimationFrame(updateFPS);
})();

// ============================================
// CANVAS FULLSCREEN TOGGLE
// ============================================
(function initCanvasFullscreen() {
    const canvasSection = document.getElementById('canvas-section');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    if (!canvasSection || !fullscreenBtn) return;

    // Check if mobile (screen width <= 600px)
    function isMobile() {
        return window.innerWidth <= 600;
    }

    fullscreenBtn.addEventListener('click', function() {
        // Disable fullscreen on mobile
        if (isMobile()) return;

        canvasSection.classList.toggle('fullscreen');
        document.body.classList.toggle('canvas-fullscreen');

        // Trigger resize event so canvas updates its dimensions
        window.dispatchEvent(new Event('resize'));
    });

    // ESC key to exit fullscreen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && canvasSection.classList.contains('fullscreen')) {
            canvasSection.classList.remove('fullscreen');
            document.body.classList.remove('canvas-fullscreen');
            window.dispatchEvent(new Event('resize'));
        }
    });

    // Exit fullscreen if window is resized to mobile size
    window.addEventListener('resize', function() {
        if (isMobile() && canvasSection.classList.contains('fullscreen')) {
            canvasSection.classList.remove('fullscreen');
            document.body.classList.remove('canvas-fullscreen');
        }
    });
})();

// ============================================
// CONTACT MODAL
// ============================================
(function initContactModal() {
    const modal = document.getElementById('contact-modal');
    const closeBtn = document.getElementById('contact-modal-close');
    const contactBtn = document.querySelector('.contact-btn');
    const form = document.getElementById('contact-form');

    if (!modal) return;

    function openModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Focus first input for accessibility
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Open modal when contact button is clicked
    if (contactBtn) {
        contactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Handle form submission via Formspree
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            })
            .then(function(response) {
                if (response.ok) {
                    submitBtn.textContent = 'Sent!';
                    form.reset();
                    setTimeout(function() {
                        closeModal();
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }, 1500);
                } else {
                    throw new Error('Form submission failed');
                }
            })
            .catch(function() {
                submitBtn.textContent = 'Error - Try Again';
                submitBtn.disabled = false;
                setTimeout(function() {
                    submitBtn.textContent = originalText;
                }, 2000);
            });
        });
    }
})();

// ============================================
// CONTACT PANEL FORM HANDLER
// ============================================
(function initContactPanelForm() {
    const form = document.getElementById('contact-form-panel');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Sending...';
        submitBtn.disabled = true;

        fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        })
        .then(function(response) {
            if (response.ok) {
                submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg> Message Sent!';
                form.reset();
                setTimeout(function() {
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                }, 3000);
            } else {
                throw new Error('Form submission failed');
            }
        })
        .catch(function() {
            submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Error - Try Again';
            submitBtn.disabled = false;
            setTimeout(function() {
                submitBtn.innerHTML = originalHTML;
            }, 3000);
        });
    });
})();

// ============================================
// KEYBOARD NAVIGATION FOR SKILL GRAPH
// ============================================
(function initKeyboardNav() {
    document.addEventListener('keydown', function(e) {
        // Only handle when skills panel is active
        const skillsPanel = document.getElementById('panel-skills');
        if (!skillsPanel || !skillsPanel.classList.contains('active')) return;

        // Check if canvas section is active (graph view)
        const canvasSection = document.getElementById('canvas-section');
        if (!canvasSection || !canvasSection.classList.contains('active')) return;

        // Camera rotation with arrow keys
        const rotSpeed = 0.05;
        const zoomSpeed = 0.1;

        switch(e.key) {
            case 'ArrowLeft':
                if (typeof window.globalCameraRotY !== 'undefined') {
                    window.globalCameraRotY -= rotSpeed;
                }
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (typeof window.globalCameraRotY !== 'undefined') {
                    window.globalCameraRotY += rotSpeed;
                }
                e.preventDefault();
                break;
            case 'ArrowUp':
                if (typeof window.globalCameraRotX !== 'undefined') {
                    window.globalCameraRotX = Math.max(-Math.PI / 2, window.globalCameraRotX - rotSpeed);
                }
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (typeof window.globalCameraRotX !== 'undefined') {
                    window.globalCameraRotX = Math.min(Math.PI / 2, window.globalCameraRotX + rotSpeed);
                }
                e.preventDefault();
                break;
            case '+':
            case '=':
                if (typeof window.globalZoom !== 'undefined') {
                    window.globalZoom = Math.min(3, window.globalZoom + zoomSpeed);
                }
                e.preventDefault();
                break;
            case '-':
            case '_':
                if (typeof window.globalZoom !== 'undefined') {
                    window.globalZoom = Math.max(0.5, window.globalZoom - zoomSpeed);
                }
                e.preventDefault();
                break;
            case 'r':
            case 'R':
                // Reset camera
                if (typeof window.globalCameraRotX !== 'undefined') {
                    window.globalCameraRotX = 0;
                    window.globalCameraRotY = 0;
                    window.globalZoom = 1.0;
                }
                e.preventDefault();
                break;
        }
    });
})();

