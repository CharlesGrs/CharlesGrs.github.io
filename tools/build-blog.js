#!/usr/bin/env node
/**
 * Blog Static HTML Generator
 *
 * Converts JSON blog posts to static HTML pages for SEO.
 * Each post gets its own folder with index.html for clean URLs.
 *
 * Usage: node tools/build-blog.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const POSTS_JSON_DIR = path.join(BLOG_DIR, 'posts');

// Site configuration
const SITE_CONFIG = {
    siteUrl: 'https://charlesgrs.github.io',
    siteName: 'Charles Grassi',
    authorName: 'Charles Grassi',
    authorTwitter: '@charles_grassi',
    defaultOgImage: 'https://charlesgrs.github.io/og-image.png'
};

// Category metadata
const CATEGORIES = {
    rendering: { label: 'Rendering', icon: 'cube' },
    simulation: { label: 'Simulation', icon: 'physics' },
    optimization: { label: 'Optimization', icon: 'bolt' },
    vfx: { label: 'VFX', icon: 'sparkles' }
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Generate URL-friendly slug from text
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim()
        .substring(0, 50);
}

/**
 * Apply syntax highlighting to code (same logic as blog.js)
 */
function highlightCode(code, language) {
    let html = escapeHtml(code);

    // GLSL/C-style keywords
    const keywords = ['uniform', 'varying', 'in', 'out', 'void', 'float', 'vec2', 'vec3', 'vec4',
        'mat2', 'mat3', 'mat4', 'sampler2D', 'samplerCube', 'int', 'bool', 'const',
        'if', 'else', 'for', 'while', 'return', 'discard', 'struct', 'precision',
        'highp', 'mediump', 'lowp', 'true', 'false', 'gl_FragColor', 'gl_Position',
        'attribute', 'layout', 'location', 'function', 'var', 'let', 'new', 'this'];

    // Built-in functions
    const functions = ['texture2D', 'texture', 'normalize', 'dot', 'cross', 'mix', 'clamp',
        'smoothstep', 'step', 'length', 'distance', 'reflect', 'refract', 'pow', 'exp',
        'log', 'sqrt', 'abs', 'sign', 'floor', 'ceil', 'fract', 'mod', 'min', 'max',
        'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'radians', 'degrees', 'main'];

    // Comments
    html = html.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

    // Numbers
    html = html.replace(/\b(\d+\.?\d*f?)\b/g, '<span class="number">$1</span>');

    // Strings
    html = html.replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g, '<span class="string">$1</span>');

    // Keywords
    keywords.forEach(kw => {
        const regex = new RegExp('\\b(' + kw + ')\\b', 'g');
        html = html.replace(regex, '<span class="keyword">$1</span>');
    });

    // Functions
    functions.forEach(fn => {
        const regex = new RegExp('\\b(' + fn + ')\\s*\\(', 'g');
        html = html.replace(regex, '<span class="function">$1</span>(');
    });

    return html;
}

/**
 * Render a single section to HTML
 */
function renderSection(section, index) {
    switch (section.type) {
        case 'intro':
            return `<p class="article-section section-intro">${escapeHtml(section.content)}</p>`;

        case 'heading':
            const tag = `h${section.level || 2}`;
            const headingId = `section-${index}-${slugify(section.content)}`;
            return `<${tag} id="${headingId}" class="article-section section-heading" data-toc-level="${section.level || 2}">${escapeHtml(section.content)}</${tag}>`;

        case 'paragraph':
            return `<p class="article-section section-paragraph">${escapeHtml(section.content)}</p>`;

        case 'code':
            const highlighted = highlightCode(section.content, section.language);
            return `<div class="article-section section-code">
                <div class="code-header">
                    <span class="code-title">${escapeHtml(section.title || 'Code')}</span>
                    <span class="code-language">${escapeHtml(section.language || 'code')}</span>
                </div>
                <div class="code-content"><pre>${highlighted}</pre></div>
            </div>`;

        case 'list':
            const items = (section.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('\n');
            return `<ul class="article-section section-list">${items}</ul>`;

        case 'image':
            const caption = section.caption ? `<figcaption>${escapeHtml(section.caption)}</figcaption>` : '';
            return `<figure class="article-section section-image">
                <img src="../../blog/images/${section.src}" alt="${escapeHtml(section.alt || '')}" loading="lazy">
                ${caption}
            </figure>`;

        case 'callout':
            return `<aside class="article-section section-callout ${section.variant || 'info'}">
                <p>${escapeHtml(section.content)}</p>
            </aside>`;

        case 'svg-diagram':
            // For static pages, show a placeholder that JS will enhance
            return `<figure class="article-section section-svg-diagram" data-diagram-id="${section.id}">
                <div class="svg-container" style="max-width: ${section.width || 600}px;">
                    <div class="svg-placeholder" data-width="${section.width || 600}" data-height="${section.height || 200}">
                        <noscript>Diagram: ${escapeHtml(section.title || section.id)}</noscript>
                    </div>
                </div>
                ${section.title ? `<figcaption>${escapeHtml(section.title)}</figcaption>` : ''}
            </figure>`;

        case 'shader-demo':
            // Shader demos need JS, show placeholder for no-JS
            const controlsHtml = (section.controls || []).map(ctrl => `
                <div class="shader-control">
                    <label>${escapeHtml(ctrl.label)}</label>
                    <input type="range"
                        data-uniform="${ctrl.uniform}"
                        min="${ctrl.min || 0}"
                        max="${ctrl.max || 1}"
                        step="${ctrl.step || 0.01}"
                        value="${ctrl.default || 0.5}">
                    <span class="control-value">${ctrl.default || 0.5}</span>
                </div>
            `).join('');

            const shaderConfig = JSON.stringify({
                vertexShader: section.vertexShader,
                fragmentShader: section.fragmentShader,
                uniforms: section.uniforms || {}
            }).replace(/'/g, '&#39;');

            return `<figure class="article-section section-shader-demo" data-demo-id="${section.id}" data-shader-config='${shaderConfig}'>
                <div class="shader-canvas-container" style="max-width: ${section.width || 700}px;">
                    <canvas class="shader-canvas" width="${section.width || 700}" height="${section.height || 400}"></canvas>
                    <div class="shader-loading">Initializing WebGL...</div>
                </div>
                ${controlsHtml ? `<div class="shader-controls">${controlsHtml}</div>` : ''}
                ${section.title ? `<figcaption>${escapeHtml(section.title)}</figcaption>` : ''}
            </figure>`;

        default:
            return '';
    }
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format date for ISO
 */
function formatDateISO(dateStr) {
    return new Date(dateStr).toISOString();
}

/**
 * Generate Table of Contents HTML from sections
 */
function generateTocHtml(sections) {
    const headings = [];
    sections.forEach((section, index) => {
        if (section.type === 'heading') {
            headings.push({
                id: `section-${index}-${slugify(section.content)}`,
                text: section.content,
                level: section.level || 2
            });
        }
    });

    // Need at least 2 headings for a TOC
    if (headings.length < 2) return '';

    const tocItems = headings.map(h => {
        const isSubchapter = h.level >= 3;
        return `<a class="toc-item${isSubchapter ? ' toc-subchapter' : ''}" href="#${h.id}" data-target="${h.id}">${escapeHtml(h.text)}</a>`;
    }).join('\n                    ');

    return `
        <aside class="article-toc">
            <div class="toc-header">
                <svg class="toc-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 6h16M4 12h16M4 18h10"/>
                </svg>
                <span class="toc-header-title">Contents</span>
            </div>
            <nav class="toc-nav">
                ${tocItems}
            </nav>
        </aside>`;
}

/**
 * Generate HTML for a single blog post
 */
function generatePostHtml(post) {
    const sectionsHtml = (post.sections || []).map((section, index) => renderSection(section, index)).join('\n');
    const tocHtml = generateTocHtml(post.sections || []);
    const tagsHtml = (post.tags || []).map(tag => `<span class="card-tag">${escapeHtml(tag)}</span>`).join('');

    const ogImage = post.thumbnail
        ? `${SITE_CONFIG.siteUrl}/blog/images/${post.thumbnail}`
        : SITE_CONFIG.defaultOgImage;

    const postUrl = `${SITE_CONFIG.siteUrl}/blog/${post.id}/`;
    const categoryLabel = CATEGORIES[post.category]?.label || post.category;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-5KEDPWV47H"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-5KEDPWV47H');
    </script>

    <!-- Primary Meta Tags -->
    <title>${escapeHtml(post.title)} | ${SITE_CONFIG.siteName}</title>
    <meta name="title" content="${escapeHtml(post.title)} | ${SITE_CONFIG.siteName}">
    <meta name="description" content="${escapeHtml(post.excerpt)}">
    <meta name="author" content="${SITE_CONFIG.authorName}">
    <meta name="robots" content="index, follow">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${postUrl}">
    <meta property="og:title" content="${escapeHtml(post.title)}">
    <meta property="og:description" content="${escapeHtml(post.excerpt)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:site_name" content="${SITE_CONFIG.siteName}">
    <meta property="article:published_time" content="${formatDateISO(post.date)}">
    <meta property="article:author" content="${SITE_CONFIG.authorName}">
    <meta property="article:section" content="${categoryLabel}">
    ${(post.tags || []).map(tag => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n    ')}

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${SITE_CONFIG.authorTwitter}">
    <meta name="twitter:creator" content="${SITE_CONFIG.authorTwitter}">
    <meta name="twitter:title" content="${escapeHtml(post.title)}">
    <meta name="twitter:description" content="${escapeHtml(post.excerpt)}">
    <meta name="twitter:image" content="${ogImage}">

    <!-- Canonical URL -->
    <link rel="canonical" href="${postUrl}">

    <!-- Theme -->
    <meta name="theme-color" content="#0a0f14">

    <!-- Favicons -->
    <link rel="icon" type="image/x-icon" href="../../assets/favicon/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="../../assets/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../../assets/favicon/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../../assets/favicon/apple-touch-icon.png">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": "${escapeHtml(post.title).replace(/"/g, '\\"')}",
        "description": "${escapeHtml(post.excerpt).replace(/"/g, '\\"')}",
        "image": "${ogImage}",
        "datePublished": "${formatDateISO(post.date)}",
        "dateModified": "${formatDateISO(post.date)}",
        "author": {
            "@type": "Person",
            "name": "${SITE_CONFIG.authorName}",
            "url": "${SITE_CONFIG.siteUrl}"
        },
        "publisher": {
            "@type": "Person",
            "name": "${SITE_CONFIG.authorName}",
            "url": "${SITE_CONFIG.siteUrl}"
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${postUrl}"
        },
        "articleSection": "${categoryLabel}",
        "keywords": "${(post.tags || []).join(', ')}"
    }
    </script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="../../css/styles.css">
    <link rel="stylesheet" href="../../css/blog.css">

    <style>
        /* Static page specific styles */
        body {
            background: var(--bg-primary);
            min-height: 100vh;
        }

        /* Top header bar - fixed */
        .site-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(10, 15, 20, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 0.75rem 1.5rem;
        }

        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 1rem;
        }

        .header-brand {
            margin-right: auto;
        }

        .header-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
        }

        .brand-name {
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .brand-separator {
            color: rgba(255, 255, 255, 0.2);
            font-family: 'JetBrains Mono', monospace;
        }

        .brand-section {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
            color: var(--accent-teal);
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .header-cta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .cta-demos {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(45, 212, 191, 0.1);
            border: 1px solid rgba(45, 212, 191, 0.3);
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
            color: var(--accent-teal);
            text-decoration: none;
            transition: all 0.25s ease;
        }

        .cta-demos:hover {
            background: rgba(45, 212, 191, 0.2);
            border-color: rgba(45, 212, 191, 0.5);
            box-shadow: 0 0 20px rgba(45, 212, 191, 0.15);
        }

        .cta-hire {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1.25rem;
            background: linear-gradient(135deg, var(--accent-gold) 0%, #d4a520 100%);
            border: none;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
            font-weight: 600;
            color: #0a0f14;
            text-decoration: none;
            transition: all 0.25s ease;
            box-shadow: 0 2px 8px rgba(232, 185, 35, 0.3);
        }

        .cta-hire:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(232, 185, 35, 0.4);
        }

        .static-blog-page {
            max-width: 1400px;
            margin: 0 auto;
            padding: var(--space-lg);
            padding-top: 5rem; /* Account for fixed header */
        }

        .article-nav {
            max-width: 1100px;
            margin: 0 auto var(--space-md) auto;
        }

        /* Article with TOC Layout */
        .article-with-toc {
            display: grid;
            grid-template-columns: minmax(0, 800px) 220px;
            gap: 0 2rem;
            justify-content: center;
        }

        .article-with-toc .blog-article {
            max-width: 800px;
        }

        /* TOC Styles */
        .article-toc {
            position: sticky;
            top: 5rem;
            align-self: start;
            width: 220px;
            max-height: calc(100vh - 180px);
        }

        .toc-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: var(--space-sm);
            padding-bottom: var(--space-xs);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .toc-header-icon {
            width: 14px;
            height: 14px;
            color: var(--accent-teal);
            opacity: 0.7;
        }

        .toc-header-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.65rem;
            font-weight: 500;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.12em;
        }

        .toc-nav {
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow-y: auto;
            max-height: calc(100vh - 240px);
        }

        .toc-item {
            display: flex;
            padding: 0.5rem 0.75rem;
            font-family: 'Outfit', sans-serif;
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--text-secondary);
            text-decoration: none;
            border-radius: 6px;
            transition: all 0.2s ease;
            line-height: 1.35;
        }

        .toc-item:hover {
            color: var(--text-primary);
            background: rgba(255, 255, 255, 0.03);
        }

        .toc-item.toc-subchapter {
            padding-left: 1.5rem;
            font-size: 0.75rem;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.45);
        }

        .toc-item.active {
            color: var(--accent-teal);
            background: rgba(45, 212, 191, 0.04);
        }

        .toc-item.active.settled {
            color: var(--accent-gold);
            background: rgba(232, 185, 35, 0.06);
        }

        /* Hide TOC on smaller screens */
        @media (max-width: 1080px) {
            .article-toc {
                display: none;
            }

            .article-with-toc {
                grid-template-columns: minmax(0, 900px);
            }

            .article-with-toc .blog-article {
                max-width: 900px;
            }

            .article-nav {
                max-width: 900px;
            }
        }

        .nav-back {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.8rem;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.7rem;
            color: var(--text-secondary);
            text-decoration: none;
            transition: all 0.25s ease;
        }

        .nav-back:hover {
            border-color: var(--accent-teal);
            color: var(--accent-teal);
        }

        .nav-back svg {
            width: 14px;
            height: 14px;
            transition: transform 0.25s ease;
        }

        .nav-back:hover svg {
            transform: translateX(-3px);
        }

        /* CTA Banner after article */
        .article-cta-banner {
            margin-top: var(--space-xl);
            padding: var(--space-lg);
            background: linear-gradient(145deg, rgba(20, 28, 38, 0.9) 0%, rgba(15, 22, 30, 0.95) 100%);
            border: 1px solid rgba(232, 185, 35, 0.2);
            border-radius: 12px;
            text-align: center;
        }

        .cta-banner-title {
            font-family: 'Outfit', sans-serif;
            font-size: var(--text-xl);
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 0.5rem 0;
        }

        .cta-banner-subtitle {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--text-sm);
            color: var(--text-secondary);
            margin: 0 0 var(--space-md) 0;
        }

        .cta-banner-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .cta-banner-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.25s ease;
        }

        .cta-banner-btn.primary {
            background: linear-gradient(135deg, var(--accent-gold) 0%, #d4a520 100%);
            color: #0a0f14;
            box-shadow: 0 2px 12px rgba(232, 185, 35, 0.3);
        }

        .cta-banner-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(232, 185, 35, 0.4);
        }

        .cta-banner-btn.secondary {
            background: rgba(45, 212, 191, 0.1);
            border: 1px solid rgba(45, 212, 191, 0.3);
            color: var(--accent-teal);
        }

        .cta-banner-btn.secondary:hover {
            background: rgba(45, 212, 191, 0.2);
            border-color: rgba(45, 212, 191, 0.5);
        }

        .static-footer {
            margin-top: var(--space-xl);
            padding-top: var(--space-lg);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            text-align: center;
        }

        .footer-author {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-xs);
            margin-bottom: var(--space-md);
        }

        .footer-author-name {
            font-family: 'Outfit', sans-serif;
            font-size: var(--text-base);
            font-weight: 600;
            color: var(--text-primary);
        }

        .footer-author-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--text-xs);
            color: var(--text-secondary);
        }

        .footer-links {
            display: flex;
            justify-content: center;
            gap: var(--space-md);
        }

        .footer-link {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--text-xs);
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.25s;
        }

        .footer-link:hover {
            color: var(--accent-teal);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .site-header {
                padding: 0.5rem 1rem;
            }

            .header-content {
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .brand-separator, .brand-section {
                display: none;
            }

            .header-cta {
                gap: 0.5rem;
            }

            .cta-demos span,
            .cta-hire span {
                display: none;
            }

            .cta-demos,
            .cta-hire {
                padding: 0.5rem;
            }

            .static-blog-page {
                padding: var(--space-md);
                padding-top: 4.5rem;
            }

            .cta-banner-buttons {
                flex-direction: column;
            }

            .cta-banner-btn {
                width: 100%;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <!-- Fixed Header -->
    <header class="site-header">
        <div class="header-content">
            <a href="../../" class="header-brand">
                <span class="brand-name">${SITE_CONFIG.authorName}</span>
                <span class="brand-separator">//</span>
                <span class="brand-section">Blog</span>
            </a>
            <div class="header-cta">
                <a href="../../?tab=skills" class="cta-demos">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    <span>Live Demos</span>
                </a>
                <a href="../../?tab=contact" class="cta-hire">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Hire Me</span>
                </a>
            </div>
        </div>
    </header>

    <div class="static-blog-page">
        <!-- Back Navigation -->
        <nav class="article-nav">
            <a href="../../blog/" class="nav-back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                All Posts
            </a>
        </nav>

        <!-- Article with TOC Layout -->
        <div class="article-with-toc">
            <article class="blog-article">
                <header class="article-header">
                    <div class="article-meta">
                        <span class="article-category">${escapeHtml(categoryLabel)}</span>
                        <span>${formatDate(post.date)}</span>
                        <span>${escapeHtml(post.readTime)} read</span>
                    </div>
                    <h1 class="article-title">${escapeHtml(post.title)}</h1>
                    ${post.subtitle ? `<p class="article-subtitle">${escapeHtml(post.subtitle)}</p>` : ''}
                    <div class="card-tags" style="margin-top: var(--space-sm);">${tagsHtml}</div>
                </header>

                <div class="article-content">
                    ${sectionsHtml}
                </div>
            </article>
            ${tocHtml}
        </div>

        <!-- CTA Banner -->
        <div class="article-cta-banner">
            <h2 class="cta-banner-title">Want to see more?</h2>
            <p class="cta-banner-subtitle">Check out my interactive portfolio with live shader demos</p>
            <div class="cta-banner-buttons">
                <a href="../../?tab=contact" class="cta-banner-btn primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Get in Touch
                </a>
                <a href="../../?tab=skills" class="cta-banner-btn secondary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Live Demos
                </a>
            </div>
        </div>

        <!-- Footer -->
        <footer class="static-footer">
            <div class="footer-author">
                <span class="footer-author-name">${SITE_CONFIG.authorName}</span>
                <span class="footer-author-title">Graphics Programmer & Technical Artist</span>
            </div>
            <div class="footer-links">
                <a href="../../" class="footer-link">Portfolio</a>
                <a href="../../blog/" class="footer-link">Blog</a>
                <a href="https://twitter.com/charles_grassi" class="footer-link" target="_blank" rel="noopener">Twitter</a>
                <a href="https://www.linkedin.com/in/charles-grassi/" class="footer-link" target="_blank" rel="noopener">LinkedIn</a>
            </div>
        </footer>
    </div>

    <!-- Optional: Load JS for interactive diagrams/demos -->
    <script src="../../js/blog-diagrams.js" defer></script>
    <script>
        // Initialize SVG diagrams if blog-diagrams.js is available
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof window.blogSvgDiagrams !== 'undefined') {
                var diagrams = document.querySelectorAll('.section-svg-diagram');
                diagrams.forEach(function(container) {
                    var id = container.getAttribute('data-diagram-id');
                    var placeholder = container.querySelector('.svg-placeholder');
                    if (placeholder && window.blogSvgDiagrams[id]) {
                        var w = parseInt(placeholder.getAttribute('data-width')) || 600;
                        var h = parseInt(placeholder.getAttribute('data-height')) || 200;
                        var svgContainer = container.querySelector('.svg-container');
                        svgContainer.innerHTML = '';
                        try {
                            window.blogSvgDiagrams[id](svgContainer, w, h);
                        } catch (e) {
                            console.error('Diagram error:', id, e);
                        }
                    }
                });
            }

            // Initialize shader demos
            var demos = document.querySelectorAll('.section-shader-demo');
            demos.forEach(function(container) {
                var canvas = container.querySelector('.shader-canvas');
                var loadingEl = container.querySelector('.shader-loading');
                var configStr = container.getAttribute('data-shader-config');

                if (!canvas || !configStr) return;

                try {
                    var config = JSON.parse(configStr);
                    initShaderDemo(canvas, config, container, loadingEl);
                } catch (e) {
                    if (loadingEl) {
                        loadingEl.textContent = 'Shader error: ' + e.message;
                        loadingEl.classList.add('error');
                    }
                }
            });
        });

        function initShaderDemo(canvas, config, container, loadingEl) {
            var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) throw new Error('WebGL not supported');

            var vertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertShader, config.vertexShader);
            gl.compileShader(vertShader);
            if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(vertShader));
            }

            var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragShader, config.fragmentShader);
            gl.compileShader(fragShader);
            if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(fragShader));
            }

            var program = gl.createProgram();
            gl.attachShader(program, vertShader);
            gl.attachShader(program, fragShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(program));
            }

            gl.useProgram(program);

            var posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
            ]), gl.STATIC_DRAW);

            var posLoc = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            var uniformLocs = {};
            var uniformValues = {};
            for (var name in config.uniforms) {
                uniformLocs[name] = gl.getUniformLocation(program, name);
                uniformValues[name] = config.uniforms[name].value;
            }

            // Setup controls
            var controls = container.querySelectorAll('input[type="range"]');
            controls.forEach(function(input) {
                var uniformName = input.getAttribute('data-uniform');
                var valueDisplay = input.parentElement.querySelector('.control-value');
                input.addEventListener('input', function() {
                    uniformValues[uniformName] = parseFloat(input.value);
                    if (valueDisplay) valueDisplay.textContent = parseFloat(input.value).toFixed(2);
                });
            });

            var startTime = performance.now();

            function render() {
                var elapsed = (performance.now() - startTime) / 1000;
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clearColor(0.04, 0.06, 0.08, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.useProgram(program);

                for (var name in uniformLocs) {
                    var loc = uniformLocs[name];
                    if (!loc) continue;
                    if (name === 'u_time') gl.uniform1f(loc, elapsed);
                    else if (name === 'u_resolution') gl.uniform2f(loc, canvas.width, canvas.height);
                    else {
                        var val = uniformValues[name];
                        if (typeof val === 'number') gl.uniform1f(loc, val);
                        else if (Array.isArray(val) && val.length === 2) gl.uniform2f(loc, val[0], val[1]);
                        else if (Array.isArray(val) && val.length === 3) gl.uniform3f(loc, val[0], val[1], val[2]);
                    }
                }

                gl.drawArrays(gl.TRIANGLES, 0, 6);
                requestAnimationFrame(render);
            }

            if (loadingEl) loadingEl.style.display = 'none';
            render();
        }

        // TOC scroll tracking and smooth scroll
        (function initToc() {
            var tocItems = document.querySelectorAll('.toc-item');
            var headings = document.querySelectorAll('.section-heading[id]');
            if (tocItems.length < 2 || headings.length < 2) return;

            var settleTimeout = null;
            var currentActiveId = null;

            function setActiveTocItem(activeId, immediate) {
                if (settleTimeout) {
                    clearTimeout(settleTimeout);
                    settleTimeout = null;
                }

                tocItems.forEach(function(item) {
                    item.classList.remove('settled');
                    var isActive = item.getAttribute('data-target') === activeId;
                    item.classList.toggle('active', isActive);
                });

                currentActiveId = activeId;

                var delay = immediate ? 0 : 150;
                settleTimeout = setTimeout(function() {
                    var activeItem = document.querySelector('.toc-item[data-target="' + currentActiveId + '"]');
                    if (activeItem) activeItem.classList.add('settled');
                }, delay);
            }

            // Smooth scroll on click
            tocItems.forEach(function(item) {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    var targetId = item.getAttribute('data-target');
                    var target = document.getElementById(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setActiveTocItem(targetId, false);
                    }
                });
            });

            // Scroll tracking with IntersectionObserver
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        setActiveTocItem(entry.target.id, false);
                    }
                });
            }, {
                rootMargin: '-80px 0px -60% 0px',
                threshold: 0
            });

            headings.forEach(function(heading) {
                observer.observe(heading);
            });

            // Set initial state
            if (headings.length > 0) {
                setActiveTocItem(headings[0].id, true);
            }
        })();
    </script>
</body>
</html>`;
}

/**
 * Generate blog index page HTML
 */
function generateIndexHtml(posts) {
    const postsHtml = posts.map(post => {
        const categoryLabel = CATEGORIES[post.category]?.label || post.category;
        const formattedDate = formatDate(post.date);
        const tagsHtml = (post.tags || []).slice(0, 3).map(tag =>
            `<span class="card-tag">${escapeHtml(tag)}</span>`
        ).join('');

        const thumbnailHtml = post.thumbnail
            ? `<img src="images/${post.thumbnail}" alt="" loading="lazy">`
            : `<div class="placeholder-graphic"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>`;

        // New badge for posts less than 30 days old
        const postDate = new Date(post.date);
        const now = new Date();
        const daysDiff = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));
        const newBadge = daysDiff <= 30 ? '<span class="card-new-badge">New</span>' : '';

        return `
            <article class="blog-post-card${post.featured ? ' featured' : ''}">
                <a href="${post.id}/" class="card-link">
                    <div class="card-thumbnail">
                        ${thumbnailHtml}
                        ${newBadge}
                    </div>
                    <div class="card-content">
                        <div class="card-meta">
                            <span class="meta-date">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                ${formattedDate}
                            </span>
                            <span class="meta-separator"></span>
                            <span class="meta-read-time">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                ${escapeHtml(post.readTime)}
                            </span>
                        </div>
                        <h2 class="card-title">${escapeHtml(post.title)}</h2>
                        <p class="card-excerpt">${escapeHtml(post.excerpt)}</p>
                        <div class="card-tags">${tagsHtml}</div>
                        <div class="card-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </a>
            </article>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-5KEDPWV47H"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-5KEDPWV47H');
    </script>

    <!-- Primary Meta Tags -->
    <title>Blog | ${SITE_CONFIG.siteName} - Graphics Programming Articles</title>
    <meta name="title" content="Blog | ${SITE_CONFIG.siteName} - Graphics Programming Articles">
    <meta name="description" content="Technical articles on real-time rendering, shader development, GPU optimization, and visual effects by ${SITE_CONFIG.authorName}.">
    <meta name="author" content="${SITE_CONFIG.authorName}">
    <meta name="robots" content="index, follow">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_CONFIG.siteUrl}/blog/">
    <meta property="og:title" content="Blog | ${SITE_CONFIG.siteName}">
    <meta property="og:description" content="Technical articles on real-time rendering, shader development, GPU optimization, and visual effects.">
    <meta property="og:image" content="${SITE_CONFIG.defaultOgImage}">
    <meta property="og:site_name" content="${SITE_CONFIG.siteName}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${SITE_CONFIG.authorTwitter}">
    <meta name="twitter:title" content="Blog | ${SITE_CONFIG.siteName}">
    <meta name="twitter:description" content="Technical articles on real-time rendering, shader development, GPU optimization, and visual effects.">
    <meta name="twitter:image" content="${SITE_CONFIG.defaultOgImage}">

    <!-- Canonical URL -->
    <link rel="canonical" href="${SITE_CONFIG.siteUrl}/blog/">

    <!-- Theme -->
    <meta name="theme-color" content="#0a0f14">

    <!-- Favicons -->
    <link rel="icon" type="image/x-icon" href="../assets/favicon/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="../assets/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../assets/favicon/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../assets/favicon/apple-touch-icon.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/blog.css">

    <style>
        body {
            background: var(--bg-primary);
            min-height: 100vh;
        }

        .static-blog-index {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--space-lg);
        }

        .index-header {
            text-align: center;
            margin-bottom: var(--space-xl);
        }

        .index-nav {
            display: flex;
            justify-content: flex-start;
            margin-bottom: var(--space-lg);
        }

        .nav-home {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(20, 28, 38, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--text-sm);
            color: var(--text-secondary);
            text-decoration: none;
            transition: all 0.25s ease;
        }

        .nav-home:hover {
            background: rgba(30, 40, 55, 0.8);
            border-color: var(--accent-teal);
            color: var(--accent-teal);
        }

        .index-title {
            font-family: 'Outfit', sans-serif;
            font-size: clamp(2rem, 5vw, 3rem);
            font-weight: 700;
            color: var(--text-primary);
            margin: 0 0 var(--space-sm) 0;
        }

        .index-subtitle {
            font-family: 'JetBrains Mono', monospace;
            font-size: var(--text-base);
            color: var(--text-secondary);
            margin: 0;
        }

        .posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: var(--space-md);
        }

        .blog-post-card .card-link {
            display: block;
            text-decoration: none;
            color: inherit;
        }

        .blog-post-card:hover {
            transform: translateY(-4px);
            border-color: rgba(232, 185, 35, 0.3);
            box-shadow:
                0 8px 32px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(232, 185, 35, 0.1),
                0 0 40px rgba(232, 185, 35, 0.05);
        }

        .blog-post-card:hover .card-title {
            color: var(--accent-gold);
        }

        .blog-post-card:hover .card-arrow {
            opacity: 1;
            transform: translateX(0);
        }

        @media (max-width: 768px) {
            .static-blog-index {
                padding: var(--space-md);
            }

            .posts-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="static-blog-index">
        <!-- Navigation -->
        <nav class="index-nav">
            <a href="../" class="nav-home">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Portfolio
            </a>
        </nav>

        <!-- Header -->
        <header class="index-header">
            <h1 class="index-title">Shader Journal</h1>
            <p class="index-subtitle">Technical deep-dives into rendering, shaders, and real-time graphics</p>
        </header>

        <!-- Posts Grid -->
        <div class="posts-grid">
            ${postsHtml}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Main build function
 */
async function build() {
    console.log('Building static blog pages...\n');

    // Read blog index
    const indexPath = path.join(BLOG_DIR, 'index.json');
    if (!fs.existsSync(indexPath)) {
        console.error('Error: blog/index.json not found');
        process.exit(1);
    }

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const posts = [];

    // Load all posts
    for (const postId of index.posts) {
        const postPath = path.join(POSTS_JSON_DIR, `${postId}.json`);
        if (!fs.existsSync(postPath)) {
            console.warn(`Warning: Post not found: ${postId}`);
            continue;
        }

        const post = JSON.parse(fs.readFileSync(postPath, 'utf8'));
        posts.push(post);

        // Create post directory
        const postDir = path.join(BLOG_DIR, postId);
        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir, { recursive: true });
        }

        // Generate post HTML
        const postHtml = generatePostHtml(post);
        const postHtmlPath = path.join(postDir, 'index.html');
        fs.writeFileSync(postHtmlPath, postHtml);
        console.log(`  Created: /blog/${postId}/index.html`);
    }

    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate index page
    const indexHtml = generateIndexHtml(posts);
    const indexHtmlPath = path.join(BLOG_DIR, 'index.html');
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log(`  Created: /blog/index.html`);

    console.log(`\nDone! Generated ${posts.length} blog post pages.`);
    console.log('\nURLs:');
    console.log(`  Blog index: ${SITE_CONFIG.siteUrl}/blog/`);
    posts.forEach(post => {
        console.log(`  ${post.title}: ${SITE_CONFIG.siteUrl}/blog/${post.id}/`);
    });
}

// Run build
build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
