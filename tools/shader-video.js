/**
 * Shader Video Generator
 *
 * Creates promotional videos showing shader construction step-by-step.
 * Renders each shader stage to a buffer and smoothly transitions between them.
 *
 * Usage:
 *   node tools/shader-video.js <article-slug> [options]
 *   node tools/shader-video.js apple-liquid-glass --duration 2000 --transition 500
 *
 * Options:
 *   --duration <ms>     Duration per shader stage (default: 3000)
 *   --transition <ms>   Transition duration between stages (default: 800)
 *   --width <px>        Output width (default: 1920)
 *   --height <px>       Output height (default: 1080)
 *   --fps <number>      Frames per second (default: 60)
 *   --output <path>     Output file path (default: tools/output/<slug>-video.webm)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        slug: args[0] || 'apple-liquid-glass',
        duration: 3000,
        transition: 800,
        width: 1920,
        height: 1080,
        fps: 60,
        output: null
    };

    for (let i = 1; i < args.length; i += 2) {
        const key = args[i]?.replace('--', '');
        const value = args[i + 1];
        if (key && value) {
            if (['duration', 'transition', 'width', 'height', 'fps'].includes(key)) {
                options[key] = parseInt(value, 10);
            } else {
                options[key] = value;
            }
        }
    }

    if (!options.output) {
        options.output = `tools/output/${options.slug}-video.webm`;
    }

    return options;
}

// HTML template for shader video renderer
function generateHTML(shaders, options) {
    const shaderScripts = shaders.map((shader, i) =>
        `const SHADER_${i} = \`${shader.code}\`;`
    ).join('\n');

    const uniformsJSON = JSON.stringify(shaders.map(s => s.uniforms));

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0f14;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        canvas {
            display: block;
        }
        #status {
            position: fixed;
            top: 10px;
            left: 10px;
            color: #2dd4bf;
            font-family: monospace;
            font-size: 14px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="status">Initializing...</div>
    <canvas id="canvas"></canvas>

    <script>
        ${shaderScripts}

        const SHADERS = [${shaders.map((_, i) => `SHADER_${i}`).join(', ')}];
        const UNIFORMS = ${uniformsJSON};
        const OPTIONS = ${JSON.stringify(options)};

        const VERTEX_SHADER = \`
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        \`;

        const TRANSITION_SHADER = \`
            precision highp float;
            uniform sampler2D u_texA;
            uniform sampler2D u_texB;
            uniform float u_blend;
            varying vec2 v_uv;

            void main() {
                vec4 colorA = texture2D(u_texA, v_uv);
                vec4 colorB = texture2D(u_texB, v_uv);

                // Smooth cross-fade with slight zoom effect
                float t = smoothstep(0.0, 1.0, u_blend);

                gl_FragColor = mix(colorA, colorB, t);
            }
        \`;

        class ShaderVideoRenderer {
            constructor(canvas) {
                this.canvas = canvas;
                this.gl = canvas.getContext('webgl', {
                    preserveDrawingBuffer: true,
                    antialias: true
                });

                if (!this.gl) {
                    throw new Error('WebGL not supported');
                }

                this.programs = [];
                this.framebuffers = [];
                this.textures = [];
                this.transitionProgram = null;
                this.quadBuffer = null;
                this.startTime = 0;
                this.currentShader = 0;
                this.isRecording = false;
                this.frames = [];

                this.init();
            }

            init() {
                const gl = this.gl;

                // Create quad buffer
                this.quadBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                    -1, -1, 1, -1, -1, 1,
                    -1, 1, 1, -1, 1, 1
                ]), gl.STATIC_DRAW);

                // Compile shader programs
                for (let i = 0; i < SHADERS.length; i++) {
                    const program = this.createProgram(VERTEX_SHADER, SHADERS[i]);
                    this.programs.push(program);

                    // Create framebuffer and texture for this shader
                    const { framebuffer, texture } = this.createFramebuffer();
                    this.framebuffers.push(framebuffer);
                    this.textures.push(texture);
                }

                // Create transition program
                this.transitionProgram = this.createProgram(VERTEX_SHADER, TRANSITION_SHADER);

                this.startTime = performance.now();
                this.render();
            }

            createShader(type, source) {
                const gl = this.gl;
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                    console.error('Source:', source);
                    gl.deleteShader(shader);
                    return null;
                }

                return shader;
            }

            createProgram(vertexSrc, fragmentSrc) {
                const gl = this.gl;
                const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSrc);
                const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSrc);

                const program = gl.createProgram();
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);

                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    console.error('Program link error:', gl.getProgramInfoLog(program));
                    return null;
                }

                return program;
            }

            createFramebuffer() {
                const gl = this.gl;

                const texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                const framebuffer = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                return { framebuffer, texture };
            }

            setUniforms(program, uniforms, time) {
                const gl = this.gl;

                for (const [name, uniform] of Object.entries(uniforms)) {
                    const location = gl.getUniformLocation(program, name);
                    if (location === null) continue;

                    if (name === 'u_time') {
                        gl.uniform1f(location, time / 1000);
                    } else if (name === 'u_resolution') {
                        gl.uniform2f(location, this.canvas.width, this.canvas.height);
                    } else if (uniform.type === 'float') {
                        gl.uniform1f(location, uniform.value);
                    } else if (uniform.type === 'vec2') {
                        gl.uniform2f(location, uniform.value[0], uniform.value[1]);
                    } else if (uniform.type === 'vec3') {
                        gl.uniform3f(location, uniform.value[0], uniform.value[1], uniform.value[2]);
                    }
                }
            }

            renderShaderToBuffer(index, time) {
                const gl = this.gl;
                const program = this.programs[index];
                const framebuffer = this.framebuffers[index];
                const uniforms = UNIFORMS[index];

                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.useProgram(program);

                // Set position attribute
                const posLoc = gl.getAttribLocation(program, 'a_position');
                gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

                // Set uniforms - override resolution to canvas size
                const adjustedUniforms = { ...uniforms };
                if (adjustedUniforms.u_resolution) {
                    adjustedUniforms.u_resolution = {
                        type: 'vec2',
                        value: [this.canvas.width, this.canvas.height]
                    };
                }
                this.setUniforms(program, adjustedUniforms, time);

                gl.drawArrays(gl.TRIANGLES, 0, 6);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            renderTransition(indexA, indexB, blend) {
                const gl = this.gl;

                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.useProgram(this.transitionProgram);

                // Set position attribute
                const posLoc = gl.getAttribLocation(this.transitionProgram, 'a_position');
                gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

                // Bind textures
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.textures[indexA]);
                gl.uniform1i(gl.getUniformLocation(this.transitionProgram, 'u_texA'), 0);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, this.textures[indexB]);
                gl.uniform1i(gl.getUniformLocation(this.transitionProgram, 'u_texB'), 1);

                // Set blend
                gl.uniform1f(gl.getUniformLocation(this.transitionProgram, 'u_blend'), blend);

                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            render() {
                const time = performance.now() - this.startTime;
                const totalDuration = OPTIONS.duration + OPTIONS.transition;
                const totalLength = SHADERS.length * OPTIONS.duration + (SHADERS.length - 1) * OPTIONS.transition;

                // Compute which shaders to show
                let accumulatedTime = 0;
                let shaderA = 0;
                let shaderB = 0;
                let blend = 0;
                let inTransition = false;

                for (let i = 0; i < SHADERS.length; i++) {
                    const stageEnd = accumulatedTime + OPTIONS.duration;
                    const transitionEnd = stageEnd + OPTIONS.transition;

                    if (time < stageEnd) {
                        // In static display of shader i
                        shaderA = i;
                        shaderB = i;
                        blend = 0;
                        break;
                    } else if (time < transitionEnd && i < SHADERS.length - 1) {
                        // In transition from i to i+1
                        shaderA = i;
                        shaderB = i + 1;
                        blend = (time - stageEnd) / OPTIONS.transition;
                        inTransition = true;
                        break;
                    }

                    accumulatedTime = transitionEnd;

                    // Last shader - hold
                    if (i === SHADERS.length - 1) {
                        shaderA = i;
                        shaderB = i;
                        blend = 0;
                    }
                }

                // Render both shaders to their buffers
                this.renderShaderToBuffer(shaderA, time);
                if (shaderA !== shaderB) {
                    this.renderShaderToBuffer(shaderB, time);
                }

                // Render transition or single shader to screen
                this.renderTransition(shaderA, shaderB, blend);

                // Update status
                const status = document.getElementById('status');
                status.textContent = \`Shader \${shaderA + 1}/\${SHADERS.length} | Time: \${(time/1000).toFixed(1)}s | \${inTransition ? 'Transitioning...' : 'Playing'}\`;

                // Check if done
                if (time < totalLength + OPTIONS.duration) {
                    requestAnimationFrame(() => this.render());
                } else {
                    status.textContent = 'Complete!';
                    window.videoComplete = true;
                }
            }
        }

        // Initialize
        const canvas = document.getElementById('canvas');
        canvas.width = OPTIONS.width;
        canvas.height = OPTIONS.height;

        const renderer = new ShaderVideoRenderer(canvas);
        window.renderer = renderer;
    </script>
</body>
</html>
`;
}

async function loadShadersFromArticle(slug) {
    const postPath = path.join(__dirname, '..', 'blog', 'posts', `${slug}.json`);

    if (!fs.existsSync(postPath)) {
        throw new Error(`Article not found: ${postPath}`);
    }

    const post = JSON.parse(fs.readFileSync(postPath, 'utf-8'));
    const shaders = [];

    // Find all shader-demo sections
    for (const section of post.sections) {
        if (section.type === 'shader-demo' && section.shaderFile) {
            const shaderPath = path.join(__dirname, '..', 'blog', 'shaders', section.shaderFile);

            if (fs.existsSync(shaderPath)) {
                const code = fs.readFileSync(shaderPath, 'utf-8');
                shaders.push({
                    id: section.id,
                    title: section.title,
                    code: code,
                    uniforms: section.uniforms || {}
                });
                console.log(`Loaded shader: ${section.shaderFile}`);
            } else {
                console.warn(`Shader file not found: ${shaderPath}`);
            }
        }
    }

    return shaders;
}

async function recordVideo(options) {
    console.log('Loading shaders from article:', options.slug);
    const shaders = await loadShadersFromArticle(options.slug);

    if (shaders.length === 0) {
        throw new Error('No shaders found in article');
    }

    console.log(`Found ${shaders.length} shader stages`);

    // Generate HTML
    const html = generateHTML(shaders, options);
    const htmlPath = path.join(__dirname, 'shader-video-temp.html');
    fs.writeFileSync(htmlPath, html);

    // Ensure output directory exists
    const outputDir = path.dirname(path.join(__dirname, '..', options.output));
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: options.width, height: options.height },
        recordVideo: {
            dir: outputDir,
            size: { width: options.width, height: options.height }
        }
    });

    const page = await context.newPage();

    console.log('Loading shader renderer...');
    await page.goto('file://' + htmlPath);

    // Calculate total video duration
    const totalDuration = shaders.length * options.duration + (shaders.length - 1) * options.transition + options.duration;
    console.log(`Recording for ${(totalDuration / 1000).toFixed(1)} seconds...`);

    // Wait for completion
    await page.waitForFunction('window.videoComplete === true', { timeout: totalDuration + 10000 });

    console.log('Recording complete!');

    // Close and save video
    await page.close();
    await context.close();
    await browser.close();

    // Clean up temp file
    fs.unlinkSync(htmlPath);

    // Find and rename the recorded video
    const files = fs.readdirSync(outputDir);
    const videoFile = files.find(f => f.endsWith('.webm') && f !== path.basename(options.output));

    if (videoFile) {
        const sourcePath = path.join(outputDir, videoFile);
        const destPath = path.join(__dirname, '..', options.output);
        fs.renameSync(sourcePath, destPath);
        console.log(`Video saved to: ${options.output}`);
    }
}

// Main
const options = parseArgs();
console.log('Options:', options);

recordVideo(options).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
