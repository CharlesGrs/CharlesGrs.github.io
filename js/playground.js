// ============================================
// SHADER PLAYGROUND WITH TRANSFORM FEEDBACK PARTICLES
// ============================================
(function initPlayground() {
    const canvas = document.getElementById('playground-canvas');
    const fpsDisplay = document.getElementById('playground-fps');
    const particleDisplay = document.getElementById('playground-particles');
    const particleControls = document.getElementById('particle-controls');
    const shaderControls = document.querySelector('.shader-only-controls');
    if (!canvas) return;

    // Try WebGL 2 first for transform feedback
    let gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    const isWebGL2 = !!gl;

    if (!gl) {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    }

    if (!gl) {
        console.warn('WebGL not supported for playground');
        return;
    }

    console.log('Playground initialized with', isWebGL2 ? 'WebGL 2' : 'WebGL 1');

    // ============================================
    // TRANSFORM FEEDBACK PARTICLE SYSTEM (WebGL 2)
    // ============================================
    const PARTICLE_COUNT = 524288; // 500k particles (2^19) - reduced for faster init

    // Shaders loaded from shaders/playground-particles.glsl.js
    const simulationVS = window.PLAYGROUND_SIMULATION_VS;
    const simulationFS = window.PLAYGROUND_SIMULATION_FS;
    const renderVS = window.PLAYGROUND_RENDER_VS;
    const renderFS = window.PLAYGROUND_RENDER_FS;

    // NOTE: Shader code moved to external files:
    // - shaders/playground-particles.glsl.js (transform feedback particle system)
    // - shaders/playground-effects.glsl.js (voronoi, raymarching, fractal)

    // ============================================
    // FULLSCREEN SHADER EFFECTS (WebGL 1/2)
    // ============================================
    // Shaders loaded from shaders/playground-effects.glsl.js
    const shaderSources = {
        voronoi: window.SHADER_VORONOI,
        raymarching: window.SHADER_RAYMARCHING,
        fractal: window.SHADER_FRACTAL
    };

    const fullscreenVS = isWebGL2 ? window.FULLSCREEN_VS_WEBGL2 : window.FULLSCREEN_VS_WEBGL1;

    // State
    let currentShader = 'particles';
    let currentMode = 0; // Unused - kept for shader uniform compatibility
    let mouse = { x: 0.5, y: 0.5 };
    let prevMouse = { x: 0.5, y: 0.5 };
    let mouseVel = { x: 0, y: 0 };
    let mouseDown = 0;
    let particleParams = { attraction: 1.0, turbulence: 0.6, speed: 1.0, hue: 0 };
    let shaderParams = { speed: 1.0, scale: 1.0, intensity: 1.0, hue: 0 };
    let isActive = false;
    let animationId = null;
    let burstStrength = 0;
    let burstPos = { x: 0.5, y: 0.5 };
    let lastTime = performance.now();

    // Particle system state (WebGL 2 only)
    let particleSystem = null;

    // Shader programs for fullscreen effects
    let shaderPrograms = {};
    let shaderUniforms = {};
    let fullscreenBuffer = null;

    // Helper functions
    function checkGLError(label) {
        const err = gl.getError();
        if (err !== gl.NO_ERROR) {
            console.error(`WebGL Error at ${label}:`, err);
            return true;
        }
        return false;
    }

    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            console.error('Shader source:', source);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgramWithTransformFeedback(vsSource, fsSource, varyings) {
        const vs = compileShader(vsSource, gl.VERTEX_SHADER);
        const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);

        if (varyings) {
            gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
        }

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    function createProgram(vsSource, fsSource) {
        const vs = compileShader(vsSource, gl.VERTEX_SHADER);
        const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    // Initialize particle system (WebGL 2 only)
    function initParticleSystem() {
        if (!isWebGL2) {
            console.log('WebGL 2 not available - particle system disabled');
            return;
        }

        try {
            // Create simulation program with transform feedback
            console.log('Creating simulation program...');
            const simProgram = createProgramWithTransformFeedback(
                simulationVS, simulationFS, ['vPosition', 'vLife']
            );

            // Create render program
            console.log('Creating render program...');
            const renderProgram = createProgram(renderVS, renderFS);

            if (!simProgram || !renderProgram) {
                console.error('Failed to create particle programs - particle system disabled');
                console.error('simProgram:', simProgram, 'renderProgram:', renderProgram);
                return;
            }

            console.log('Particle programs created successfully');

        // Initialize particle data
        const positions = new Float32Array(PARTICLE_COUNT * 4); // xy = pos, zw = vel
        const lives = new Float32Array(PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Random position in a circular pattern
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.8;
            positions[i * 4] = Math.cos(angle) * radius;     // x
            positions[i * 4 + 1] = Math.sin(angle) * radius; // y
            positions[i * 4 + 2] = (Math.random() - 0.5) * 0.1; // vx
            positions[i * 4 + 3] = (Math.random() - 0.5) * 0.1; // vy
            lives[i] = Math.random();
        }

        // Create double buffers for ping-pong
        const posBuffers = [gl.createBuffer(), gl.createBuffer()];
        const lifeBuffers = [gl.createBuffer(), gl.createBuffer()];

        for (let i = 0; i < 2; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffers[i]);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_COPY);

            gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffers[i]);
            gl.bufferData(gl.ARRAY_BUFFER, lives, gl.DYNAMIC_COPY);
        }

        // Create VAOs for simulation
        const simVAOs = [gl.createVertexArray(), gl.createVertexArray()];
        const simLocations = {
            aPosition: gl.getAttribLocation(simProgram, 'aPosition'),
            aLife: gl.getAttribLocation(simProgram, 'aLife')
        };

        for (let i = 0; i < 2; i++) {
            gl.bindVertexArray(simVAOs[i]);

            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffers[i]);
            gl.enableVertexAttribArray(simLocations.aPosition);
            gl.vertexAttribPointer(simLocations.aPosition, 4, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffers[i]);
            gl.enableVertexAttribArray(simLocations.aLife);
            gl.vertexAttribPointer(simLocations.aLife, 1, gl.FLOAT, false, 0, 0);
        }

        // Create VAOs for rendering
        const renderVAOs = [gl.createVertexArray(), gl.createVertexArray()];
        const renderLocations = {
            aPosition: gl.getAttribLocation(renderProgram, 'aPosition'),
            aLife: gl.getAttribLocation(renderProgram, 'aLife')
        };

        for (let i = 0; i < 2; i++) {
            gl.bindVertexArray(renderVAOs[i]);

            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffers[i]);
            gl.enableVertexAttribArray(renderLocations.aPosition);
            gl.vertexAttribPointer(renderLocations.aPosition, 4, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffers[i]);
            gl.enableVertexAttribArray(renderLocations.aLife);
            gl.vertexAttribPointer(renderLocations.aLife, 1, gl.FLOAT, false, 0, 0);
        }

        // Create transform feedbacks
        const transformFeedbacks = [gl.createTransformFeedback(), gl.createTransformFeedback()];
        for (let i = 0; i < 2; i++) {
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbacks[i]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, posBuffers[1 - i]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, lifeBuffers[1 - i]);
        }
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        particleSystem = {
            simProgram,
            renderProgram,
            posBuffers,
            lifeBuffers,
            simVAOs,
            renderVAOs,
            transformFeedbacks,
            simUniforms: {
                uTime: gl.getUniformLocation(simProgram, 'uTime'),
                uDeltaTime: gl.getUniformLocation(simProgram, 'uDeltaTime'),
                uMouse: gl.getUniformLocation(simProgram, 'uMouse'),
                uMouseVel: gl.getUniformLocation(simProgram, 'uMouseVel'),
                uMouseDown: gl.getUniformLocation(simProgram, 'uMouseDown'),
                uAttraction: gl.getUniformLocation(simProgram, 'uAttraction'),
                uTurbulence: gl.getUniformLocation(simProgram, 'uTurbulence'),
                uSpeed: gl.getUniformLocation(simProgram, 'uSpeed'),
                uResolution: gl.getUniformLocation(simProgram, 'uResolution'),
                uBurst: gl.getUniformLocation(simProgram, 'uBurst'),
                uBurstPos: gl.getUniformLocation(simProgram, 'uBurstPos'),
                uMode: gl.getUniformLocation(simProgram, 'uMode')
            },
            renderUniforms: {
                uResolution: gl.getUniformLocation(renderProgram, 'uResolution'),
                uHue: gl.getUniformLocation(renderProgram, 'uHue'),
                uTime: gl.getUniformLocation(renderProgram, 'uTime'),
                uMode: gl.getUniformLocation(renderProgram, 'uMode')
            },
            currentBuffer: 0
        };

            // Update particle display
            if (particleDisplay) {
                particleDisplay.textContent = (PARTICLE_COUNT / 1000000).toFixed(1) + 'M Particles';
            }

            console.log('Particle system initialized successfully with ' + PARTICLE_COUNT + ' particles');
        } catch (error) {
            console.error('Error initializing particle system:', error);
            particleSystem = null;
            if (particleDisplay) {
                particleDisplay.textContent = 'Particle system error';
            }
        }
    }

    // Initialize fullscreen shader programs
    function initShaderPrograms() {
        fullscreenBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);

        for (const [name, fragSource] of Object.entries(shaderSources)) {
            // Wrap fragment shader for WebGL 2
            let fs;
            if (isWebGL2) {
                // Convert WebGL 1 shader to WebGL 2
                // Replace gl_FragColor with fragColor globally, then add out declaration
                const converted = fragSource.replace(/gl_FragColor/g, 'fragColor');
                // Find void main() and insert out declaration before it
                const mainIndex = converted.indexOf('void main()');
                if (mainIndex !== -1) {
                    fs = `#version 300 es
${converted.substring(0, mainIndex)}out vec4 fragColor;
${converted.substring(mainIndex)}`;
                } else {
                    fs = `#version 300 es\nout vec4 fragColor;\n${converted}`;
                }
            } else {
                fs = fragSource;
            }

            const program = createProgram(fullscreenVS, fs);
            if (program) {
                shaderPrograms[name] = program;
                shaderUniforms[name] = {
                    uTime: gl.getUniformLocation(program, 'uTime'),
                    uResolution: gl.getUniformLocation(program, 'uResolution'),
                    uMouse: gl.getUniformLocation(program, 'uMouse'),
                    uSpeed: gl.getUniformLocation(program, 'uSpeed'),
                    uScale: gl.getUniformLocation(program, 'uScale'),
                    uIntensity: gl.getUniformLocation(program, 'uIntensity'),
                    uHue: gl.getUniformLocation(program, 'uHue'),
                    aPosition: gl.getAttribLocation(program, 'aPosition')
                };
            } else {
                console.error(`Failed to create shader program: ${name}`);
            }
        }
    }

    // Resize canvas
    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // FPS tracking
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let startTime = performance.now();

    // Render particles
    function renderParticles(time, deltaTime) {
        if (!particleSystem) return;

        const ps = particleSystem;
        const current = ps.currentBuffer;
        const next = 1 - current;

        // Update mouse velocity (smoothed)
        const mvx = (mouse.x - prevMouse.x) / Math.max(deltaTime, 0.016);
        const mvy = (mouse.y - prevMouse.y) / Math.max(deltaTime, 0.016);
        mouseVel.x = mouseVel.x * 0.8 + mvx * 0.2;
        mouseVel.y = mouseVel.y * 0.8 + mvy * 0.2;
        prevMouse.x = mouse.x;
        prevMouse.y = mouse.y;

        // Decay mouse down effect
        if (mouseDown > 0 && !isMouseHeld) {
            mouseDown *= 0.95;
            if (mouseDown < 0.01) mouseDown = 0;
        }

        // === SIMULATION PASS ===
        gl.useProgram(ps.simProgram);
        gl.bindVertexArray(ps.simVAOs[current]);

        // Set simulation uniforms
        gl.uniform1f(ps.simUniforms.uTime, time);
        gl.uniform1f(ps.simUniforms.uDeltaTime, Math.min(deltaTime, 0.033)); // Cap at ~30fps equivalent
        gl.uniform2f(ps.simUniforms.uMouse, mouse.x, mouse.y);
        gl.uniform2f(ps.simUniforms.uMouseVel, mouseVel.x, mouseVel.y);
        gl.uniform1f(ps.simUniforms.uMouseDown, mouseDown);
        gl.uniform1f(ps.simUniforms.uAttraction, particleParams.attraction);
        gl.uniform1f(ps.simUniforms.uTurbulence, particleParams.turbulence);
        gl.uniform1f(ps.simUniforms.uSpeed, particleParams.speed);
        gl.uniform2f(ps.simUniforms.uResolution, canvas.width, canvas.height);
        gl.uniform1f(ps.simUniforms.uBurst, burstStrength);
        gl.uniform2f(ps.simUniforms.uBurstPos, burstPos.x, burstPos.y);
        gl.uniform1i(ps.simUniforms.uMode, currentMode);

        // Decay burst
        burstStrength *= 0.9;
        if (burstStrength < 0.01) burstStrength = 0;

        // Enable rasterizer discard for simulation (we don't need fragments)
        gl.enable(gl.RASTERIZER_DISCARD);

        // Begin transform feedback
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, ps.transformFeedbacks[current]);
        gl.beginTransformFeedback(gl.POINTS);

        gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
        checkGLError('simulation draw');

        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        checkGLError('end transform feedback');

        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindVertexArray(null);

        // === RENDER PASS ===
        gl.useProgram(ps.renderProgram);
        gl.bindVertexArray(ps.renderVAOs[next]);

        // Set render uniforms
        gl.uniform2f(ps.renderUniforms.uResolution, canvas.width, canvas.height);
        gl.uniform1f(ps.renderUniforms.uHue, particleParams.hue);
        gl.uniform1f(ps.renderUniforms.uTime, time);
        gl.uniform1i(ps.renderUniforms.uMode, currentMode);

        // Clear canvas
        gl.clearColor(0.01, 0.02, 0.04, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Enable additive blending for particles
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
        checkGLError('render draw');

        gl.disable(gl.BLEND);
        gl.bindVertexArray(null);

        // Swap buffers
        ps.currentBuffer = next;
    }

    // Render fullscreen shader
    function renderShader(time) {
        const program = shaderPrograms[currentShader];
        const u = shaderUniforms[currentShader];
        if (!program || !u) return;

        gl.useProgram(program);

        gl.uniform1f(u.uTime, time);
        gl.uniform2f(u.uResolution, canvas.width, canvas.height);
        gl.uniform2f(u.uMouse, mouse.x, 1.0 - mouse.y);
        gl.uniform1f(u.uSpeed, shaderParams.speed);
        gl.uniform1f(u.uScale, shaderParams.scale);
        gl.uniform1f(u.uIntensity, shaderParams.intensity);
        gl.uniform1f(u.uHue, shaderParams.hue);

        gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);
        gl.enableVertexAttribArray(u.aPosition);
        gl.vertexAttribPointer(u.aPosition, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Main render loop
    function render() {
        if (!isActive) return;

        const now = performance.now();
        const time = (now - startTime) / 1000;
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;

        if (currentShader === 'particles') {
            if (particleSystem) {
                renderParticles(time, deltaTime);
            } else {
                // Particle system not available, fallback to shader
                if (shaderPrograms['voronoi']) {
                    currentShader = 'voronoi';
                    renderShader(time);
                }
            }
        } else {
            renderShader(time);
        }

        // Update FPS
        frameCount++;
        if (now - lastFpsTime >= 500) {
            const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
            if (fpsDisplay) fpsDisplay.textContent = fps + ' FPS';
            frameCount = 0;
            lastFpsTime = now;
        }

        animationId = requestAnimationFrame(render);
    }

    function start() {
        if (isActive) return;
        isActive = true;
        resize();
        startTime = performance.now();
        lastTime = performance.now();
        render();
    }

    function stop() {
        isActive = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // Update UI based on current shader
    function updateControlsVisibility() {
        if (currentShader === 'particles') {
            if (particleControls) particleControls.style.display = 'flex';
            if (shaderControls) shaderControls.style.display = 'none';
            if (particleDisplay) particleDisplay.style.display = 'block';
        } else {
            if (particleControls) particleControls.style.display = 'none';
            if (shaderControls) shaderControls.style.display = 'flex';
            if (particleDisplay) particleDisplay.style.display = 'none';
        }
    }

    // Event listeners
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) / rect.width;
        mouse.y = (e.clientY - rect.top) / rect.height;
    });

    // Mouse hold for black hole effect
    let isMouseHeld = false;
    let holdTimer = null;

    canvas.addEventListener('mouseleave', () => {
        mouse.x = 0.5;
        mouse.y = 0.5;
        isMouseHeld = false;
        mouseDown = 0;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (currentShader === 'particles') {
            isMouseHeld = true;
            // Ramp up black hole strength while held
            const rampUp = () => {
                if (isMouseHeld && mouseDown < 1.0) {
                    mouseDown = Math.min(mouseDown + 0.05, 1.0);
                    holdTimer = requestAnimationFrame(rampUp);
                }
            };
            rampUp();
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (currentShader === 'particles') {
            const rect = canvas.getBoundingClientRect();
            burstPos.x = (e.clientX - rect.left) / rect.width;
            burstPos.y = (e.clientY - rect.top) / rect.height;

            // Burst strength based on how long held
            burstStrength = 2.0 + mouseDown * 4.0;

            isMouseHeld = false;
            if (holdTimer) {
                cancelAnimationFrame(holdTimer);
                holdTimer = null;
            }
        }
    });

    canvas.addEventListener('click', (e) => {
        // Click handled by mouseup for particles
    });

    window.addEventListener('resize', () => {
        if (isActive) resize();
    });

    // Shader selector buttons
    document.querySelectorAll('.shader-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const shaderType = btn.dataset.shader;

            // Prevent switching to particles if not available
            if (shaderType === 'particles' && !particleSystem) {
                console.warn('Particle system not available - cannot switch to particles mode');
                return;
            }

            document.querySelectorAll('.shader-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentShader = shaderType;
            updateControlsVisibility();
        });
    });

    // Particle control sliders
    const particleSliders = {
        attraction: { element: document.getElementById('ctrl-attraction'), display: document.getElementById('val-attraction'), format: v => (v / 100).toFixed(1) + 'x' },
        turbulence: { element: document.getElementById('ctrl-turbulence'), display: document.getElementById('val-turbulence'), format: v => (v / 100).toFixed(1) + 'x' },
        speed: { element: document.getElementById('ctrl-speed'), display: document.getElementById('val-speed'), format: v => (v / 100).toFixed(1) + 'x' },
        hue: { element: document.getElementById('ctrl-hue'), display: document.getElementById('val-hue'), format: v => v + '°' }
    };

    for (const [key, slider] of Object.entries(particleSliders)) {
        if (slider.element) {
            slider.element.addEventListener('input', () => {
                const value = parseFloat(slider.element.value);
                if (key === 'hue') {
                    particleParams[key] = value;
                } else {
                    particleParams[key] = value / 100;
                }
                if (slider.display) {
                    slider.display.textContent = slider.format(value);
                }
            });
        }
    }

    // Shader control sliders
    const shaderSliderConfigs = {
        'shader-speed': { param: 'speed', element: document.getElementById('ctrl-shader-speed'), display: document.getElementById('val-shader-speed'), format: v => (v / 100).toFixed(1) + 'x' },
        scale: { param: 'scale', element: document.getElementById('ctrl-scale'), display: document.getElementById('val-scale'), format: v => (v / 100).toFixed(1) + 'x' },
        intensity: { param: 'intensity', element: document.getElementById('ctrl-intensity'), display: document.getElementById('val-intensity'), format: v => (v / 100).toFixed(1) + 'x' },
        'shader-hue': { param: 'hue', element: document.getElementById('ctrl-shader-hue'), display: document.getElementById('val-shader-hue'), format: v => v + '°' }
    };

    for (const [key, slider] of Object.entries(shaderSliderConfigs)) {
        if (slider.element) {
            slider.element.addEventListener('input', () => {
                const value = parseFloat(slider.element.value);
                if (slider.param === 'hue') {
                    shaderParams[slider.param] = value;
                } else {
                    shaderParams[slider.param] = value / 100;
                }
                if (slider.display) {
                    slider.display.textContent = slider.format(value);
                }
            });
        }
    }

    // Tab activation handling - DEFER heavy initialization until first activation
    let hasInitialized = false;
    const playgroundPanel = document.getElementById('panel-playground');

    function initializePlayground() {
        if (hasInitialized) return;
        hasInitialized = true;
        console.log('Initializing playground on first activation...');
        resize();
        initParticleSystem();
        initShaderPrograms();
        updateControlsVisibility();
    }

    if (playgroundPanel) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (playgroundPanel.classList.contains('active')) {
                        initializePlayground();
                        start();
                    } else {
                        stop();
                    }
                }
            });
        });
        observer.observe(playgroundPanel, { attributes: true });

        // Only initialize immediately if already active (unlikely on page load)
        if (playgroundPanel.classList.contains('active')) {
            initializePlayground();
            start();
        }
    }

    // If WebGL 2 not available, set fallback UI immediately
    if (!isWebGL2) {
        currentShader = 'voronoi';
        const particlesBtn = document.querySelector('.shader-btn[data-shader="particles"]');
        const voronoiBtn = document.querySelector('.shader-btn[data-shader="voronoi"]');

        if (particlesBtn) {
            particlesBtn.classList.remove('active');
            particlesBtn.disabled = true;
            particlesBtn.title = 'Requires WebGL 2';
        }
        if (voronoiBtn) {
            voronoiBtn.classList.add('active');
        }

        if (particleDisplay) {
            particleDisplay.textContent = 'WebGL 2 not available';
        }
    }
})();
