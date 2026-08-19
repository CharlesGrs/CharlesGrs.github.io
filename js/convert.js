// ============================================
// CONVERSION
// The subscribe box, and the analytics that say whether any of it works.
// ============================================
//
// This file is loaded by the SPA and by every generated static blog page, so
// there is one copy of the behaviour rather than two that drift. It attaches
// itself to whatever is on the page and does nothing if nothing is there.
//
// Subscriptions post to the same Formspree form the contact page uses, tagged
// with a _subject so the two are separable in the inbox. That is deliberate:
// a dedicated mailing list provider is the better tool the day there is a list
// worth sending to, and waiting for that decision would have meant shipping no
// capture at all. Swap FORM_ENDPOINT when that day comes; nothing else changes.

(function () {
    'use strict';

    var FORM_ENDPOINT = 'https://formspree.io/f/xqezrkra';

    // ---------------------------------------------------------------
    // Analytics
    // ---------------------------------------------------------------

    // Every conversion path reports through here, so the funnel is one report
    // in GA rather than a guess. Silently does nothing if gtag is blocked,
    // which for this audience is a large share of visitors.
    function track(name, params) {
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', name, params || {});
            }
        } catch (e) { /* analytics must never break the page */ }
    }

    window.trackConversion = track;

    // ---------------------------------------------------------------
    // Subscribe box
    // ---------------------------------------------------------------

    function wireSubscribe(form) {
        if (form.dataset.wired === '1') return;
        form.dataset.wired = '1';

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var input = form.querySelector('input[type="email"]');
            var status = form.parentNode.querySelector('.subscribe-status');
            var button = form.querySelector('button');
            if (!input || !input.value) return;

            var say = function (text, ok) {
                if (!status) return;
                status.textContent = text;
                status.className = 'subscribe-status' + (ok ? ' ok' : ' error');
            };

            button.disabled = true;
            say('Sending...', true);

            var body = new FormData();
            body.append('email', input.value);
            body.append('_subject', 'New article subscriber');
            body.append('source', form.dataset.source || document.title);

            fetch(FORM_ENDPOINT, {
                method: 'POST',
                body: body,
                headers: { Accept: 'application/json' }
            }).then(function (response) {
                if (!response.ok) throw new Error(response.status);
                form.reset();
                say('Done. You will get the next one.', true);
                track('newsletter_subscribe', {
                    source: form.dataset.source || 'article'
                });
            }).catch(function () {
                say('That did not go through. Email me instead: contact.charles.grassi@gmail.com', false);
            }).then(function () {
                button.disabled = false;
            });
        });
    }

    // ---------------------------------------------------------------
    // Hire block
    // ---------------------------------------------------------------

    function wireHireBlock(root) {
        var links = root.querySelectorAll('.cta-banner-btn, .availability-badge');
        Array.prototype.forEach.call(links, function (link) {
            if (link.dataset.wired === '1') return;
            link.dataset.wired = '1';
            link.addEventListener('click', function () {
                var href = link.getAttribute('href') || '';
                track('hire_cta_click', {
                    destination: href.indexOf('mailto:') === 0 ? 'email'
                        : href.indexOf('linkedin') !== -1 ? 'linkedin'
                        : 'portfolio',
                    article: document.title
                });
            });
        });
    }

    // ---------------------------------------------------------------
    // Read depth
    // ---------------------------------------------------------------

    // Without this the conversion rate has no denominator worth having. Page
    // views count people who bounced in two seconds; what matters is how many
    // of the people who actually read the thing went on to click.
    function wireReadDepth() {
        var article = document.querySelector('.article-content');
        if (!article || window.__readDepthWired) return;
        window.__readDepthWired = true;

        var fired = {};
        var check = function () {
            var box = article.getBoundingClientRect();
            var height = box.height;
            if (height <= 0) return;

            var seen = Math.min(1, Math.max(0, (window.innerHeight - box.top) / height));
            [25, 50, 75, 100].forEach(function (mark) {
                if (seen >= mark / 100 && !fired[mark]) {
                    fired[mark] = true;
                    track('article_read_depth', {
                        percent: mark,
                        article: document.title
                    });
                }
            });
            if (fired[100]) window.removeEventListener('scroll', check);
        };

        window.addEventListener('scroll', check, { passive: true });
        check();
    }

    // ---------------------------------------------------------------

    function init(root) {
        var scope = root || document;
        Array.prototype.forEach.call(
            scope.querySelectorAll('.subscribe-form'), wireSubscribe);
        wireHireBlock(scope);
        wireReadDepth();
    }

    // The SPA swaps article content in without a navigation, so it calls this
    // again after each render.
    window.initConversion = init;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { init(); });
    } else {
        init();
    }
})();
