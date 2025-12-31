#!/usr/bin/env node
/**
 * Convert HDR skybox to web-friendly JPG
 * Usage: node tools/convert-hdr.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '..', 'blog', 'shaders', 'skybox.hdr');
const outputPath = path.join(__dirname, '..', 'blog', 'shaders', 'skybox.jpg');

// HDR file parser (Radiance RGBE format)
function parseHDR(buffer) {
    const data = new Uint8Array(buffer);
    let pos = 0;

    // Read header
    function readLine() {
        let line = '';
        while (pos < data.length && data[pos] !== 10) {
            line += String.fromCharCode(data[pos++]);
        }
        pos++; // skip newline
        return line.trim();
    }

    // Parse magic number
    const magic = readLine();
    if (!magic.startsWith('#?RADIANCE') && !magic.startsWith('#?RGBE')) {
        throw new Error('Not a valid HDR file: ' + magic.substring(0, 20));
    }

    // Skip header lines until empty line
    let line;
    while ((line = readLine()) !== '') {
        // Skip FORMAT, EXPOSURE, etc
    }

    // Parse resolution
    const resLine = readLine();
    const match = resLine.match(/-Y\s+(\d+)\s+\+X\s+(\d+)/);
    if (!match) {
        throw new Error('Invalid resolution line: ' + resLine);
    }
    const height = parseInt(match[1]);
    const width = parseInt(match[2]);

    console.log(`HDR dimensions: ${width}x${height}`);

    // Decode RGBE data
    const pixels = new Float32Array(width * height * 3);

    for (let y = 0; y < height; y++) {
        // Check for new run-length encoding (scanline starts with magic bytes)
        if (data[pos] === 2 && data[pos + 1] === 2) {
            // New RLE format
            const scanlineWidth = (data[pos + 2] << 8) | data[pos + 3];
            if (scanlineWidth !== width) {
                throw new Error('Scanline width mismatch');
            }
            pos += 4;

            // Decode each channel separately
            const scanline = new Uint8Array(width * 4);
            for (let ch = 0; ch < 4; ch++) {
                let x = 0;
                while (x < width) {
                    const byte = data[pos++];
                    if (byte > 128) {
                        // RLE run
                        const count = byte - 128;
                        const val = data[pos++];
                        for (let i = 0; i < count && x < width; i++) {
                            scanline[x * 4 + ch] = val;
                            x++;
                        }
                    } else {
                        // Raw bytes
                        for (let i = 0; i < byte && x < width; i++) {
                            scanline[x * 4 + ch] = data[pos++];
                            x++;
                        }
                    }
                }
            }

            // Convert RGBE to RGB float
            for (let x = 0; x < width; x++) {
                const r = scanline[x * 4 + 0];
                const g = scanline[x * 4 + 1];
                const b = scanline[x * 4 + 2];
                const e = scanline[x * 4 + 3];

                const idx = (y * width + x) * 3;
                if (e === 0) {
                    pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = 0;
                } else {
                    const scale = Math.pow(2, e - 128 - 8);
                    pixels[idx + 0] = r * scale;
                    pixels[idx + 1] = g * scale;
                    pixels[idx + 2] = b * scale;
                }
            }
        } else {
            // Old format or uncompressed - read RGBE bytes directly
            for (let x = 0; x < width; x++) {
                const r = data[pos++];
                const g = data[pos++];
                const b = data[pos++];
                const e = data[pos++];

                const idx = (y * width + x) * 3;
                if (e === 0) {
                    pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = 0;
                } else {
                    const scale = Math.pow(2, e - 128 - 8);
                    pixels[idx + 0] = r * scale;
                    pixels[idx + 1] = g * scale;
                    pixels[idx + 2] = b * scale;
                }
            }
        }
    }

    return { width, height, data: pixels };
}

// ACES filmic tone mapping
function acesTonemap(x) {
    const a = 2.51;
    const b = 0.03;
    const c = 2.43;
    const d = 0.59;
    const e = 0.14;
    return Math.max(0, Math.min(1, (x * (a * x + b)) / (x * (c * x + d) + e)));
}

async function convert() {
    try {
        console.log('Converting HDR to JPG...');
        console.log('Input:', inputPath);

        if (!fs.existsSync(inputPath)) {
            console.error('HDR file not found:', inputPath);
            process.exit(1);
        }

        const buffer = fs.readFileSync(inputPath);
        const hdr = parseHDR(buffer.buffer);

        console.log('Applying tone mapping...');

        // Convert HDR to LDR with tone mapping
        const ldrData = Buffer.alloc(hdr.width * hdr.height * 3);
        for (let i = 0; i < hdr.width * hdr.height; i++) {
            // Apply exposure adjustment and tone mapping
            // Lower exposure for bright outdoor HDRIs like sunsets
            const exposure = 0.2;
            const r = acesTonemap(hdr.data[i * 3 + 0] * exposure);
            const g = acesTonemap(hdr.data[i * 3 + 1] * exposure);
            const b = acesTonemap(hdr.data[i * 3 + 2] * exposure);

            // Gamma correction (sRGB)
            ldrData[i * 3 + 0] = Math.round(Math.pow(r, 1/2.2) * 255);
            ldrData[i * 3 + 1] = Math.round(Math.pow(g, 1/2.2) * 255);
            ldrData[i * 3 + 2] = Math.round(Math.pow(b, 1/2.2) * 255);
        }

        // Use sharp to save as JPG
        await sharp(ldrData, {
            raw: {
                width: hdr.width,
                height: hdr.height,
                channels: 3
            }
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

        console.log('Output:', outputPath);

        const inputSize = fs.statSync(inputPath).size;
        const outputSize = fs.statSync(outputPath).size;
        console.log(`Size reduction: ${(inputSize / 1024 / 1024).toFixed(2)}MB -> ${(outputSize / 1024).toFixed(0)}KB`);

        console.log('Done!');
    } catch (err) {
        console.error('Error converting HDR:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

convert();
