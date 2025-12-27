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
    document.querySelectorAll('.testimonial-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.15}s`; });
    document.querySelectorAll('.project-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.12}s`; });
})();

// ============================================
// 3D CURVED PORTFOLIO CAROUSEL
// ============================================
(function initPortfolio() {
    const items = document.querySelectorAll('.portfolio-item');
    const prevBtn = document.querySelector('.portfolio-nav.prev');
    const nextBtn = document.querySelector('.portfolio-nav.next');
    const titleEl = document.getElementById('portfolio-title');
    const linkEl = document.getElementById('portfolio-link');
    const dotsContainer = document.getElementById('portfolio-dots');
    const scene = document.querySelector('.portfolio-scene');

    if (!items.length) return;

    let currentIndex = 0;
    const totalItems = items.length;
    const visibleItems = 5;

    items.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'portfolio-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('.portfolio-dot');

    function updateCarousel() {
        const isMobile = cachedWindowWidth <= 900;
        if (isMobile) {
            items.forEach((item) => { item.style.transform = ''; item.style.opacity = ''; item.style.zIndex = ''; item.style.pointerEvents = ''; });
            return;
        }

        items.forEach((item, i) => {
            let offset = i - currentIndex;
            if (offset > totalItems / 2) offset -= totalItems;
            if (offset < -totalItems / 2) offset += totalItems;
            const absOffset = Math.abs(offset);

            if (absOffset > Math.floor(visibleItems / 2)) {
                item.style.opacity = '0';
                item.style.pointerEvents = 'none';
                item.style.transform = `translate(-50%, -50%) translateX(${offset * 300}px) translateZ(-500px) scale(0.5)`;
                return;
            }

            const angle = offset * 25;
            const translateX = offset * 180;
            const translateZ = -absOffset * 150;
            const scale = 1 - absOffset * 0.15;
            const opacity = 1 - absOffset * 0.3;

            item.style.transform = `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${-angle}deg) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = visibleItems - absOffset;
            item.style.pointerEvents = offset === 0 ? 'auto' : 'none';
            item.classList.toggle('active', offset === 0);
        });

        const activeItem = items[currentIndex];
        if (titleEl) titleEl.textContent = activeItem.dataset.title;
        if (linkEl) { linkEl.href = activeItem.dataset.url; linkEl.style.display = activeItem.dataset.url ? '' : 'none'; }
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));

        // Handle video playback - pause non-active videos, play active ones
        items.forEach((item, i) => {
            const video = item.querySelector('video');
            if (!video) return;
            if (i === currentIndex) {
                // Unmute videos with audio when they become active
                if (item.dataset.hasAudio === 'true') {
                    video.muted = false;
                }
                video.play().catch(() => {});
            } else {
                video.pause();
                // Re-mute audio videos when not active
                if (item.dataset.hasAudio === 'true') {
                    video.muted = true;
                }
            }
        });
    }

    function goToSlide(index) {
        if (index < 0) index = totalItems - 1;
        if (index >= totalItems) index = 0;
        currentIndex = index;
        updateCarousel();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            if (i === currentIndex) {
                // Check if this item has audio that can be toggled
                if (item.dataset.hasAudio === 'true') {
                    const video = item.querySelector('video');
                    if (video) {
                        video.muted = !video.muted;
                        if (!video.muted) video.play().catch(() => {});
                    }
                } else if (item.dataset.url) {
                    window.open(item.dataset.url, '_blank');
                }
            } else {
                goToSlide(i);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        const portfolioPanel = document.getElementById('panel-portfolio');
        if (!portfolioPanel || !portfolioPanel.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    });

    let touchStartX = 0;
    if (scene) {
        scene.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        scene.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) goToSlide(currentIndex + (diff > 0 ? 1 : -1));
        }, { passive: true });
        let wheelThrottled = false;
        scene.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (wheelThrottled) return;
            wheelThrottled = true;
            goToSlide(currentIndex + (e.deltaY > 0 ? 1 : -1));
            setTimeout(() => { wheelThrottled = false; }, 400);
        }, { passive: false });
    }

    let resizeTimeout;
    window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(updateCarousel, 100); });
    updateCarousel();
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
        { text: 'Running ', highlight: false },
        { text: 'Zylaris Ltd', highlight: true },
        { text: ', specializing in real-time graphics and shader development. 8+ years delivering for ', highlight: false },
        { text: 'Meta', highlight: true },
        { text: ', ', highlight: false },
        { text: 'Ubisoft', highlight: true },
        { text: ', ', highlight: false },
        { text: 'Nexus Studios', highlight: true },
        { text: ', and 12+ studios worldwide.', highlight: false, pauseAfter: 600 },
        { text: ' Video games, VR, ', highlight: false },
        { text: 'Web3', highlight: true },
        { text: ', ', highlight: false },
        { text: '16K immersive installations', highlight: true },
        { text: '.', highlight: false, pauseAfter: 600 },
        { text: ' Latest project: ', highlight: false },
        { text: 'Blumhouse Enhanced Cinema', highlight: true },
        { text: ' on Meta Quest 3.', highlight: false }
    ];

    const typos = [
        { pos: 35, wrong: 'z', correct: 's' },
        { pos: 120, wrong: 'n', correct: 'm' },
    ];

    let cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    container.appendChild(cursor);

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
    }

    function type() {
        if (segmentIndex >= fullText.length) { finishTyping(); return; }

        const segment = fullText[segmentIndex];
        if (!currentSpan) {
            currentSpan = document.createElement('span');
            if (segment.highlight) currentSpan.className = 'highlight-text';
            container.insertBefore(currentSpan, cursor);
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
    const tabs = document.querySelectorAll('.carousel-tab');
    const panels = document.querySelectorAll('.carousel-panel');
    if (!tabs.length || !panels.length) return;

    function triggerPanelAnimations(panel) {
        panel.querySelectorAll('.client-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.08}s`; });
        panel.querySelectorAll('.testimonial-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.15}s`; });
        panel.querySelectorAll('.project-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.12}s`; });
        const portfolioCarousel = panel.querySelector('.portfolio-carousel');
        if (portfolioCarousel) { portfolioCarousel.style.animation = 'none'; portfolioCarousel.offsetHeight; portfolioCarousel.style.animation = ''; }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const panelId = tab.dataset.panel;
            const container = document.querySelector('.container');

            tabs.forEach(t => t.classList.remove('active'));
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

    fullscreenBtn.addEventListener('click', function() {
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

// ============================================
// HEADER COLLAPSE (CLICK ONLY)
// ============================================
(function initHeaderCollapse() {
    const header = document.getElementById('main-header');
    const expandBtn = document.getElementById('header-expand-btn');
    const MOBILE_BREAKPOINT = 900;

    if (!header) return;

    function isMobile() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function collapseHeader() {
        // Don't collapse on mobile
        if (isMobile()) return;
        header.classList.add('collapsed');
    }

    function expandHeader() {
        header.classList.remove('collapsed');
    }

    // Expand button click
    if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            expandHeader();
        });
    }

    // Tab click - About keeps header expanded, others collapse (desktop only)
    document.querySelectorAll('.carousel-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.panel === 'about') {
                expandHeader();
            } else {
                collapseHeader();
            }
        });
    });

    // On resize, remove collapsed state if switching to mobile
    window.addEventListener('resize', () => {
        if (isMobile() && header.classList.contains('collapsed')) {
            header.classList.remove('collapsed');
        }
    });
})();
