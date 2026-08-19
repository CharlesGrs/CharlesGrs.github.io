#!/usr/bin/env node
// ============================================
// BLOG TO LINKEDIN CONVERTER
// Converts JSON blog posts to LinkedIn article format
// with automatic SVG diagram screenshots
// ============================================
//
// Usage: node tools/blog-to-linkedin.js <post-id>
// Example: node tools/blog-to-linkedin.js anamorphic-bloom
//
// First run: npm install puppeteer (in tools folder)
//
// Output:
//   tools/output/<post-id>-linkedin.md
//   tools/output/<post-id>-linkedin.html (for pasting into LinkedIn)
//   tools/output/<post-id>-images/*.png

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configuration
const SITE_URL = 'https://charlesgrassi.dev';
const AUTHOR_NAME = 'Charles Grassi';
const LOCAL_PORT = 8080;

// Get post ID from command line
const postId = process.argv[2];

if (!postId) {
    console.log('\n📝 Blog to LinkedIn Converter\n');
    console.log('Usage: node tools/blog-to-linkedin.js <post-id>\n');
    console.log('Available posts:');

    const indexPath = path.join(__dirname, '..', 'blog', 'index.json');
    try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        index.posts.forEach(id => console.log(`  - ${id}`));
    } catch (e) {
        console.log('  (Could not read blog index)');
    }

    console.log('\nExample: node tools/blog-to-linkedin.js anamorphic-bloom');
    console.log('\nFor automatic screenshots, first install puppeteer:');
    console.log('  cd tools && npm install puppeteer\n');
    process.exit(1);
}

// Load the post
const postPath = path.join(__dirname, '..', 'blog', 'posts', `${postId}.json`);

if (!fs.existsSync(postPath)) {
    console.error(`\n❌ Post not found: ${postId}`);
    console.error(`   Expected file: ${postPath}\n`);
    process.exit(1);
}

const post = JSON.parse(fs.readFileSync(postPath, 'utf8'));

// Create output directories
const outputDir = path.join(__dirname, 'output');
const imagesDir = path.join(outputDir, `${postId}-images`);

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Check if puppeteer is available
let puppeteer = null;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.log('\n⚠️  Puppeteer not installed - skipping screenshot generation');
    console.log('   To enable screenshots: cd tools && npm install puppeteer\n');
}

// Screenshot the diagrams using headless browser
async function generateDiagramScreenshots() {
    if (!puppeteer) return {};

    const screenshots = {};
    const diagramSections = post.sections.filter(s => s.type === 'svg-diagram');

    if (diagramSections.length === 0) {
        return screenshots;
    }

    console.log(`\n📸 Generating ${diagramSections.length} diagram screenshots...`);

    // Start local server
    const http = require('http');
    const server = http.createServer((req, res) => {
        let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url);

        // Handle query strings
        filePath = filePath.split('?')[0];

        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
        };

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
                res.end(content);
            }
        });
    });

    await new Promise(resolve => server.listen(LOCAL_PORT, resolve));
    console.log(`   Local server started on port ${LOCAL_PORT}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Capture console errors for debugging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`   [browser error] ${msg.text()}`);
            }
        });

        // Read the diagram script content once
        const diagramScriptPath = path.join(__dirname, '..', 'js', 'blog-diagrams.js');
        const diagramScriptContent = fs.readFileSync(diagramScriptPath, 'utf8');

        // Set dark background to match site theme
        await page.setViewport({ width: 800, height: 600 });

        for (const section of diagramSections) {
            const diagramId = section.id;
            const width = section.width || 700;
            const height = section.height || 300;

            console.log(`   Rendering: ${diagramId}`);

            // Set viewport to fit the diagram with padding
            await page.setViewport({
                width: width + 40,
                height: height + 40
            });

            // Create a minimal HTML page that renders just this diagram
            // Inline the script content to avoid caching issues
            const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0f14;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        #container {
            width: ${width}px;
            height: ${height}px;
            min-height: ${height}px;
        }
        #container svg {
            display: block;
            width: ${width}px !important;
            height: ${height}px !important;
            max-width: none !important;
        }
        /* SVG text styles matching blog.css */
        .diagram-title {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 16px;
            fill: #ffffff;
            font-weight: 500;
        }
        .diagram-label {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
            fill: #ffffff;
        }
        .diagram-label-small {
            font-family: 'Consolas', monospace;
            font-size: 11px;
            fill: rgba(255,255,255,0.7);
        }
        .diagram-label-tiny {
            font-family: 'Consolas', monospace;
            font-size: 9px;
            fill: rgba(255,255,255,0.5);
        }
        svg {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="container"></div>
    <script>
        // Inline the blog-diagrams.js content
        ${diagramScriptContent}
    </script>
    <script>
        window.diagramError = null;
        try {
            const container = document.getElementById('container');
            if (window.blogSvgDiagrams && window.blogSvgDiagrams['${diagramId}']) {
                window.blogSvgDiagrams['${diagramId}'](container, ${width}, ${height});

                // Remove animations for static screenshot
                document.querySelectorAll('animate, animateTransform').forEach(el => el.remove());

                window.diagramReady = true;
            } else {
                var available = window.blogSvgDiagrams ? Object.keys(window.blogSvgDiagrams).join(', ') : 'none';
                window.diagramError = 'Diagram "${diagramId}" not found. Available: ' + available;
                container.innerHTML = '<div style="color: red;">' + window.diagramError + '</div>';
                window.diagramReady = true;
            }
        } catch (e) {
            console.error('Diagram error:', e);
            window.diagramError = e.message;
            document.getElementById('container').innerHTML = '<div style="color: red;">Error: ' + e.message + '</div>';
            window.diagramReady = true;
        }
    </script>
</body>
</html>`;

            await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });

            // Wait for diagram to render
            await page.waitForFunction('window.diagramReady === true', { timeout: 10000 });

            // Check for errors
            const error = await page.evaluate(() => window.diagramError);
            if (error) {
                console.log(`   ⚠️  ${diagramId}: ${error}`);
            }

            // Debug: Check what's in the container
            const svgInfo = await page.evaluate(() => {
                const container = document.getElementById('container');
                const svg = container.querySelector('svg');
                if (!svg) return { hasSvg: false };
                return {
                    hasSvg: true,
                    childCount: svg.children.length,
                    viewBox: svg.getAttribute('viewBox'),
                    innerHTML: svg.innerHTML.substring(0, 200)
                };
            });

            if (!svgInfo.hasSvg) {
                console.log(`   ⚠️  ${diagramId}: No SVG found in container`);
            }

            // Longer delay for SVG rendering to complete
            await new Promise(r => setTimeout(r, 500));

            // Screenshot the container using clip for better results
            const screenshotPath = path.join(imagesDir, `${diagramId}.png`);
            const containerBox = await page.evaluate(() => {
                const el = document.getElementById('container');
                const rect = el.getBoundingClientRect();
                return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            });

            await page.screenshot({
                path: screenshotPath,
                clip: {
                    x: containerBox.x,
                    y: containerBox.y,
                    width: containerBox.width,
                    height: containerBox.height
                }
            });

            screenshots[diagramId] = `${postId}-images/${diagramId}.png`;
            console.log(`   ✓ Saved: ${diagramId}.png`);
        }
    } finally {
        await browser.close();
        server.close();
    }

    return screenshots;
}

// Convert post to LinkedIn article format
function convertToLinkedIn(post, screenshots) {
    const lines = [];

    // Title
    lines.push(`# ${post.title}`);
    lines.push('');

    // Subtitle as lead paragraph
    if (post.subtitle) {
        lines.push(`*${post.subtitle}*`);
        lines.push('');
    }

    lines.push(`---`);
    lines.push('');

    // Process each section
    post.sections.forEach((section, index) => {
        switch (section.type) {
            case 'intro':
                lines.push(section.content);
                lines.push('');
                break;

            case 'heading':
                const prefix = section.level === 2 ? '##' : '###';
                lines.push(`${prefix} ${section.content}`);
                lines.push('');
                break;

            case 'paragraph':
                lines.push(section.content);
                lines.push('');
                break;

            case 'code':
                lines.push(`**${section.title || 'Code'}** *(${section.language || 'code'})*`);
                lines.push('```');
                lines.push(section.content);
                lines.push('```');
                lines.push('');
                break;

            case 'list':
                section.items.forEach(item => {
                    lines.push(`• ${item}`);
                });
                lines.push('');
                break;

            case 'callout':
                const emoji = section.variant === 'tip' ? '💡' :
                             section.variant === 'warning' ? '⚠️' : 'ℹ️';
                lines.push(`${emoji} **${section.variant.toUpperCase()}:** ${section.content}`);
                lines.push('');
                break;

            case 'svg-diagram':
                if (screenshots[section.id]) {
                    // Image was generated
                    lines.push(`![${section.title || 'Diagram'}](${screenshots[section.id]})`);
                    if (section.title) {
                        lines.push(`*${section.title}*`);
                    }
                } else {
                    // Fallback - no screenshot
                    lines.push(`📊 *[Diagram: ${section.title || 'Technical visualization'}]*`);
                    lines.push(`*(See animated version on my portfolio)*`);
                }
                lines.push('');
                break;

            case 'shader-demo':
                lines.push(`🎮 **Interactive Demo: ${section.title || 'Shader Demo'}**`);
                lines.push(`*Try the live WebGL demo with adjustable parameters on my portfolio →*`);
                lines.push('');
                break;

            case 'image':
                lines.push(`📷 *[Image: ${section.alt || section.caption || 'Figure'}]*`);
                lines.push('');
                break;
        }
    });

    // Backlink footer
    lines.push('---');
    lines.push('');
    lines.push('## See the Interactive Version');
    lines.push('');
    lines.push(`This article was originally published on my portfolio where you can:`);
    lines.push('');
    lines.push(`• **Try the interactive shader demos** with real-time parameter controls`);
    lines.push(`• **View animated SVG diagrams** that visualize the concepts`);
    lines.push(`• **Explore the full code examples** with syntax highlighting`);
    lines.push('');
    lines.push(`🔗 **Read with demos:** ${SITE_URL}/#blog/${post.id}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Hashtags
    const hashtags = (post.tags || [])
        .map(tag => `#${tag.replace(/[^a-zA-Z0-9]/g, '')}`)
        .join(' ');

    lines.push(`${hashtags} #graphicsprogramming #gamedev #shaders #rendering`);
    lines.push('');

    // Posting notes
    lines.push('---');
    lines.push('');
    lines.push('*LINKEDIN POSTING NOTES:*');
    lines.push('');
    lines.push(`*1. Publish on portfolio first, wait 1-2 days*`);
    lines.push(`*2. Add a personal hook at the start*`);
    if (Object.keys(screenshots).length > 0) {
        lines.push(`*3. Upload the generated images from: tools/output/${postId}-images/*`);
    } else {
        lines.push(`*3. Take screenshots of diagrams/demos for images*`);
    }
    lines.push(`*4. The backlink at the end drives traffic to your site*`);
    lines.push(`*5. Remove these notes before publishing!*`);

    return lines.join('\n');
}

// Main execution
async function main() {
    console.log(`\n📝 Converting: ${post.title}`);

    // Generate screenshots
    const screenshots = await generateDiagramScreenshots();

    // Generate markdown
    const linkedInContent = convertToLinkedIn(post, screenshots);

    // Write markdown file
    const mdOutputPath = path.join(outputDir, `${postId}-linkedin.md`);
    fs.writeFileSync(mdOutputPath, linkedInContent);

    // Generate HTML from markdown (for pasting into LinkedIn)
    // Strip the posting notes section before converting
    const contentWithoutNotes = linkedInContent.split('\n---\n\n*LINKEDIN POSTING NOTES:*')[0];
    const htmlContent = marked(contentWithoutNotes);

    // Create a clean HTML page for copying into LinkedIn
    const htmlPage = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${post.title} - LinkedIn Article</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        h1 { font-size: 28px; margin-bottom: 8px; }
        h2 { font-size: 22px; margin-top: 32px; color: #0a66c2; }
        h3 { font-size: 18px; margin-top: 24px; }
        p { margin: 16px 0; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', monospace;
        }
        pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13px;
        }
        pre code { background: none; padding: 0; }
        img { max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px; }
        blockquote {
            border-left: 3px solid #0a66c2;
            padding-left: 16px;
            color: #666;
            margin: 16px 0;
        }
        ul, ol { margin: 16px 0; padding-left: 24px; }
        li { margin: 8px 0; }
        hr { border: none; border-top: 1px solid #e0e0e0; margin: 32px 0; }
        a { color: #0a66c2; }
        strong { font-weight: 600; }
        em { font-style: italic; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    const htmlOutputPath = path.join(outputDir, `${postId}-linkedin.html`);
    fs.writeFileSync(htmlOutputPath, htmlPage);

    // Summary
    const diagramCount = post.sections.filter(s => s.type === 'svg-diagram').length;
    const demoCount = post.sections.filter(s => s.type === 'shader-demo').length;
    const screenshotCount = Object.keys(screenshots).length;

    console.log(`\n✅ LinkedIn article generated!`);
    console.log(`   Markdown: ${mdOutputPath}`);
    console.log(`   HTML:     ${htmlOutputPath}`);

    if (screenshotCount > 0) {
        console.log(`   Images:   ${imagesDir}/`);
        console.log(`             ${screenshotCount} diagram screenshots saved`);
    }

    console.log(`\n📋 Content summary:`);
    console.log(`   Title: ${post.title}`);
    console.log(`   Read time: ${post.readTime}`);
    console.log(`   Diagrams: ${diagramCount} (${screenshotCount} screenshots generated)`);
    console.log(`   Interactive demos: ${demoCount} (link to portfolio)`);
    console.log(`   Tags: ${(post.tags || []).join(', ')}`);

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Open the .html file in your browser`);
    console.log(`   2. Select all content below the instructions box`);
    console.log(`   3. Copy and paste into LinkedIn's article editor`);
    if (screenshotCount > 0) {
        console.log(`   4. Upload images from ${postId}-images/ folder`);
    }
    console.log(`   5. Add a personal intro hook`);
    console.log(`   6. Publish!\n`);
}

main().catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
});
