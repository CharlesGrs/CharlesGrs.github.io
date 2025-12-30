/**
 * SVG to PNG converter using Puppeteer
 * Usage: node tools/svg-to-png.js <input.svg> [output.png]
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng(svgPath, pngPath) {
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // Extract dimensions from SVG
    const widthMatch = svgContent.match(/width="(\d+)"/);
    const heightMatch = svgContent.match(/height="(\d+)"/);
    const width = widthMatch ? parseInt(widthMatch[1]) : 800;
    const height = heightMatch ? parseInt(heightMatch[1]) : 450;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; }
                body {
                    width: ${width}px;
                    height: ${height}px;
                    overflow: hidden;
                    background: transparent;
                }
                svg { display: block; }
            </style>
        </head>
        <body>${svgContent}</body>
        </html>
    `;

    await page.setContent(html);
    await page.screenshot({
        path: pngPath,
        type: 'png',
        clip: { x: 0, y: 0, width, height }
    });

    await browser.close();
    console.log(`Created: ${pngPath}`);
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log('Usage: node tools/svg-to-png.js <input.svg> [output.png]');
    process.exit(1);
}

const svgPath = path.resolve(args[0]);
const pngPath = args[1]
    ? path.resolve(args[1])
    : svgPath.replace(/\.svg$/, '.png');

convertSvgToPng(svgPath, pngPath).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
