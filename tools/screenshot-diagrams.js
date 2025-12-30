const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function screenshotDiagrams() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Load the preview page
    const htmlPath = path.join(__dirname, 'diagram-preview.html');
    await page.goto('file://' + htmlPath);

    // Wait for diagrams to render
    await page.waitForTimeout(2000);

    // Create output directory
    const outputDir = path.join(__dirname, 'diagram-screenshots');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const diagramIds = [
        'cache-hierarchy-overview',
        'cache-latency-comparison',
        'cache-line-fetch',
        'warp-coalescing',
        'cache-miss-patterns',
        'mipmap-cache-benefit',
        'cache-hit-rate-gauge',
        'latency-hiding',
        'morton-order',
        'dependent-read-chain',
        'architecture-comparison'
    ];

    // Take full page screenshot first
    await page.screenshot({
        path: path.join(outputDir, 'all-diagrams.png'),
        fullPage: true
    });
    console.log('Saved: all-diagrams.png');

    // Screenshot each diagram individually
    for (const id of diagramIds) {
        const element = await page.$(`#container-${id}`);
        if (element) {
            await element.screenshot({
                path: path.join(outputDir, `${id}.png`)
            });
            console.log(`Saved: ${id}.png`);
        }
    }

    await browser.close();
    console.log('\nAll screenshots saved to:', outputDir);
}

screenshotDiagrams().catch(console.error);
