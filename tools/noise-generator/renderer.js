/**
 * NOISE LAB - WebGL Renderer
 * Handles shader compilation, rendering, and texture management
 */

class NoiseRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            preserveDrawingBuffer: true,
            antialias: false
        });

        if (!this.gl) {
            throw new Error('WebGL 2.0 not supported');
        }

        this.programs = {};
        this.framebuffers = {};
        this.textures = {};
        this.quadBuffer = null;
        this.resolution = 512;
        this.seamless = true;

        this.init();
    }

    init() {
        const gl = this.gl;

        // Create fullscreen quad
        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);

        // Compile all noise shaders
        this.compileProgram('perlin', NoiseShaders.VERTEX_SHADER, NoiseShaders.PERLIN_FRAGMENT_SHADER);
        this.compileProgram('worley', NoiseShaders.VERTEX_SHADER, NoiseShaders.WORLEY_FRAGMENT_SHADER);
        this.compileProgram('fbm', NoiseShaders.VERTEX_SHADER, NoiseShaders.FBM_FRAGMENT_SHADER);
        this.compileProgram('warp', NoiseShaders.VERTEX_SHADER, NoiseShaders.WARP_FRAGMENT_SHADER);
        this.compileProgram('simplex', NoiseShaders.VERTEX_SHADER, NoiseShaders.SIMPLEX_FRAGMENT_SHADER);
        this.compileProgram('voronoi', NoiseShaders.VERTEX_SHADER, NoiseShaders.VORONOI_FRAGMENT_SHADER);
        this.compileProgram('blend', NoiseShaders.VERTEX_SHADER, NoiseShaders.BLEND_FRAGMENT_SHADER);

        // Create framebuffers for layer compositing
        this.createFramebuffer('layerA');
        this.createFramebuffer('layerB');
        this.createFramebuffer('composite');
        this.createFramebuffer('output');

        // Set default viewport
        this.setResolution(this.resolution);
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${info}`);
        }

        return shader;
    }

    compileProgram(name, vertSrc, fragSrc) {
        const gl = this.gl;

        const vertShader = this.compileShader(gl.VERTEX_SHADER, vertSrc);
        const fragShader = this.compileShader(gl.FRAGMENT_SHADER, fragSrc);

        const program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error(`Program link error: ${info}`);
        }

        // Cache attribute and uniform locations
        const attribs = {};
        const uniforms = {};

        const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttribs; i++) {
            const info = gl.getActiveAttrib(program, i);
            attribs[info.name] = gl.getAttribLocation(program, info.name);
        }

        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }

        this.programs[name] = { program, attribs, uniforms };

        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
    }

    createFramebuffer(name) {
        const gl = this.gl;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.resolution, this.resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        this.framebuffers[name] = framebuffer;
        this.textures[name] = texture;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    resizeFramebuffer(name) {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.textures[name]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.resolution, this.resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    setResolution(res) {
        this.resolution = res;
        this.canvas.width = res;
        this.canvas.height = res;
        this.gl.viewport(0, 0, res, res);

        // Resize all framebuffers
        for (const name of Object.keys(this.framebuffers)) {
            this.resizeFramebuffer(name);
        }
    }

    setSeamless(seamless) {
        this.seamless = seamless;
    }

    renderNoise(noiseType, params, targetFBO = null) {
        const gl = this.gl;
        const prog = this.programs[noiseType];
        if (!prog) {
            console.error(`Unknown noise type: ${noiseType}`);
            return;
        }

        // Bind framebuffer or canvas
        if (targetFBO) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[targetFBO]);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.viewport(0, 0, this.resolution, this.resolution);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(prog.program);

        // Set up quad
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(prog.attribs.a_position);
        gl.vertexAttribPointer(prog.attribs.a_position, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms
        const algo = NoiseAlgorithms[noiseType];
        const uniforms = algo.getUniforms(params);
        uniforms.u_seamless = this.seamless;

        for (const [name, value] of Object.entries(uniforms)) {
            const loc = prog.uniforms[name];
            if (loc === undefined) continue;

            if (Array.isArray(value)) {
                if (value.length === 2) gl.uniform2fv(loc, value);
                else if (value.length === 3) gl.uniform3fv(loc, value);
                else if (value.length === 4) gl.uniform4fv(loc, value);
            } else if (typeof value === 'boolean') {
                gl.uniform1i(loc, value ? 1 : 0);
            } else if (Number.isInteger(value)) {
                gl.uniform1i(loc, value);
            } else {
                gl.uniform1f(loc, value);
            }
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    blendLayers(baseFBO, blendFBO, outputFBO, blendMode, opacity) {
        const gl = this.gl;
        const prog = this.programs.blend;

        gl.bindFramebuffer(gl.FRAMEBUFFER, outputFBO ? this.framebuffers[outputFBO] : null);
        gl.viewport(0, 0, this.resolution, this.resolution);

        gl.useProgram(prog.program);

        // Bind textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[baseFBO]);
        gl.uniform1i(prog.uniforms.u_baseTexture, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[blendFBO]);
        gl.uniform1i(prog.uniforms.u_blendTexture, 1);

        gl.uniform1i(prog.uniforms.u_blendMode, blendMode);
        gl.uniform1f(prog.uniforms.u_opacity, opacity);

        // Set up quad
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.enableVertexAttribArray(prog.attribs.a_position);
        gl.vertexAttribPointer(prog.attribs.a_position, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    copyTexture(srcFBO, dstFBO) {
        const gl = this.gl;

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffers[srcFBO]);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFBO ? this.framebuffers[dstFBO] : null);
        gl.blitFramebuffer(
            0, 0, this.resolution, this.resolution,
            0, 0, this.resolution, this.resolution,
            gl.COLOR_BUFFER_BIT, gl.NEAREST
        );
    }

    renderLayers(layers) {
        if (layers.length === 0) {
            // Clear to gray
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.resolution, this.resolution);
            gl.clearColor(0.5, 0.5, 0.5, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return;
        }

        // Render first layer
        const firstLayer = layers[0];
        if (firstLayer.visible) {
            this.renderNoise(firstLayer.type, firstLayer.params, 'composite');
        } else {
            // Start with gray if first layer is hidden
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.composite);
            gl.clearColor(0.5, 0.5, 0.5, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        // Blend subsequent layers
        for (let i = 1; i < layers.length; i++) {
            const layer = layers[i];
            if (!layer.visible) continue;

            // Render layer to temp buffer
            this.renderNoise(layer.type, layer.params, 'layerA');

            // Blend with composite
            this.blendLayers('composite', 'layerA', 'layerB', layer.blendMode, layer.opacity);

            // Swap composite
            this.copyTexture('layerB', 'composite');
        }

        // Copy to canvas
        this.copyTexture('composite', null);
    }

    getPixelData() {
        const gl = this.gl;
        const pixels = new Uint8Array(this.resolution * this.resolution * 4);
        gl.readPixels(0, 0, this.resolution, this.resolution, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
    }

    getHistogram() {
        const pixels = this.getPixelData();
        const histogram = new Array(256).fill(0);
        let min = 255, max = 0, sum = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            // Use luminance
            const v = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
            histogram[v]++;
            min = Math.min(min, v);
            max = Math.max(max, v);
            sum += v;
        }

        const pixelCount = pixels.length / 4;
        const avg = Math.round(sum / pixelCount);

        return { histogram, min, max, avg };
    }

    exportImage(format = 'png', quality = 0.92) {
        const mimeTypes = {
            png: 'image/png',
            jpg: 'image/jpeg',
            webp: 'image/webp'
        };

        return this.canvas.toDataURL(mimeTypes[format] || 'image/png', quality);
    }

    getGPUInfo() {
        const gl = this.gl;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        return 'WebGL 2.0';
    }
}

window.NoiseRenderer = NoiseRenderer;
