// ============================================
// LIGHT TRANSPORT LAB - APPLICATION
// ============================================

// ========== Physical Constants ==========
const WAVELENGTHS_NM = { r: 700, g: 550, b: 450 };
const PI = Math.PI;

// ========== Utility Functions ==========
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 };
}

// ========== State ==========
const effects = {
    absorption: true,
    rayleigh: false,
    mie: false
};

// View mode: 'transmitted', 'scattered', 'combined'
let viewMode = 'combined';

const params = {
    // Absorption coefficients for water (scaled for visualization)
    sigmaR: 0.8,   // Red absorbs most in water
    sigmaG: 0.15,
    sigmaB: 0.02,  // Blue absorbs least
    // Scattering
    particleSize: 1.0,     // nm (will convert to μm for Mie)
    density: 1.0,          // relative density multiplier
    anisotropy: 0.76,      // Henyey-Greenstein g parameter
    // Light
    lightColor: { r: 1.0, g: 0.973, b: 0.941 }, // #fff8f0
    lightIntensity: 3.0,
};

// Fixed light direction (normalized)
const lightDir = {
    x: 0.6,
    y: 0.5,
    z: 0.6
};

// Normalize light direction
const lightDirLen = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
lightDir.x /= lightDirLen;
lightDir.y /= lightDirLen;
lightDir.z /= lightDirLen;

// ========== Real-World Presets with Physical Values ==========
const presets = {
    'clear-water': {
        name: 'Clear Water',
        description: 'Pure water - absorbs red, transmits blue',
        sigmaR: 0.8, sigmaG: 0.15, sigmaB: 0.02,
        particleSize: 0.3, density: 0.1, anisotropy: 0.9,
        effects: { absorption: true, rayleigh: false, mie: false }
    },
    'atmosphere': {
        name: 'Atmosphere',
        description: 'Air - Rayleigh scattering dominates (blue sky)',
        sigmaR: 0.01, sigmaG: 0.01, sigmaB: 0.01,
        particleSize: 0.3, density: 1.5, anisotropy: 0.0,
        effects: { absorption: false, rayleigh: true, mie: false }
    },
    'fog': {
        name: 'Dense Fog',
        description: 'Water droplets ~10μm - wavelength-independent (white)',
        sigmaR: 0.05, sigmaG: 0.05, sigmaB: 0.05,
        particleSize: 10000, density: 2.0, anisotropy: 0.8,
        effects: { absorption: false, rayleigh: false, mie: true }
    },
    'cloud': {
        name: 'Cloud',
        description: 'Dense water droplets - strong Mie scattering (bright white)',
        sigmaR: 0.02, sigmaG: 0.02, sigmaB: 0.02,
        particleSize: 8000, density: 3.0, anisotropy: 0.85,
        effects: { absorption: false, rayleigh: false, mie: true }
    },
    'milk': {
        name: 'Milk',
        description: 'Fat globules ~1μm - absorption + strong scattering',
        sigmaR: 0.3, sigmaG: 0.3, sigmaB: 0.2,
        particleSize: 1000, density: 4.0, anisotropy: 0.7,
        effects: { absorption: true, rayleigh: false, mie: true }
    },
    'blood': {
        name: 'Blood',
        description: 'Hemoglobin absorbs blue/green strongly (red)',
        sigmaR: 0.3, sigmaG: 2.5, sigmaB: 3.0,
        particleSize: 7000, density: 0.5, anisotropy: 0.95,
        effects: { absorption: true, rayleigh: false, mie: false }
    },
    'ocean-deep': {
        name: 'Deep Ocean',
        description: 'Water + particles - absorption + Rayleigh',
        sigmaR: 1.0, sigmaG: 0.25, sigmaB: 0.05,
        particleSize: 500, density: 0.8, anisotropy: 0.9,
        effects: { absorption: true, rayleigh: true, mie: false }
    },
    'sunset': {
        name: 'Sunset Path',
        description: 'Long atmospheric path - blue scattered, red remains',
        sigmaR: 0.01, sigmaG: 0.01, sigmaB: 0.01,
        particleSize: 0.3, density: 3.0, anisotropy: 0.0,
        effects: { absorption: false, rayleigh: true, mie: false }
    }
};

// ========== Camera State ==========
const camera = {
    rotX: 0.3,
    rotY: 0.5,
    targetRotX: 0.3,
    targetRotY: 0.5,
    zoom: 3.0,
    targetZoom: 3.0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    sensitivity: 0.005,
    damping: 0.1
};

// ========== WebGL State ==========
let gl, program, quadBuffer, uniforms;
const sceneCanvas = document.getElementById('sceneCanvas');
const sceneWrapper = document.getElementById('sceneWrapper');

// ========== Physical Calculations ==========
function rayleighCoeff(wavelengthNm, baseDensity) {
    const lambda = wavelengthNm / 550;
    return baseDensity / Math.pow(lambda, 4);
}

function mieCoeff(particleSizeNm, wavelengthNm, baseDensity) {
    const x = (2 * PI * (particleSizeNm / 2)) / wavelengthNm;

    if (x < 0.1) {
        return rayleighCoeff(wavelengthNm, baseDensity);
    } else if (x > 10) {
        return baseDensity;
    } else {
        const t = (x - 0.1) / 9.9;
        return rayleighCoeff(wavelengthNm, baseDensity) * (1 - t) + baseDensity * t;
    }
}

function calculatePhysicalValues() {
    let sigmaT_r = 0, sigmaT_g = 0, sigmaT_b = 0;
    let sigmaS_r = 0, sigmaS_g = 0, sigmaS_b = 0;
    let sigmaA_r = 0, sigmaA_g = 0, sigmaA_b = 0;

    if (effects.absorption) {
        sigmaA_r = params.sigmaR;
        sigmaA_g = params.sigmaG;
        sigmaA_b = params.sigmaB;
        sigmaT_r += sigmaA_r;
        sigmaT_g += sigmaA_g;
        sigmaT_b += sigmaA_b;
    }

    if (effects.rayleigh) {
        const rayleighBase = 0.01 * params.density;
        sigmaS_r += rayleighCoeff(WAVELENGTHS_NM.r, rayleighBase);
        sigmaS_g += rayleighCoeff(WAVELENGTHS_NM.g, rayleighBase);
        sigmaS_b += rayleighCoeff(WAVELENGTHS_NM.b, rayleighBase);
    }

    if (effects.mie) {
        const mieBase = 0.1 * params.density;
        sigmaS_r += mieCoeff(params.particleSize, WAVELENGTHS_NM.r, mieBase);
        sigmaS_g += mieCoeff(params.particleSize, WAVELENGTHS_NM.g, mieBase);
        sigmaS_b += mieCoeff(params.particleSize, WAVELENGTHS_NM.b, mieBase);
    }

    sigmaT_r += sigmaS_r;
    sigmaT_g += sigmaS_g;
    sigmaT_b += sigmaS_b;

    const sigmaT_avg = (sigmaT_r + sigmaT_g + sigmaT_b) / 3;
    const sigmaS_avg = (sigmaS_r + sigmaS_g + sigmaS_b) / 3;
    const sigmaA_avg = (sigmaA_r + sigmaA_g + sigmaA_b) / 3;

    const albedo = sigmaT_avg > 0 ? sigmaS_avg / sigmaT_avg : 0;
    const mfp = sigmaT_avg > 0 ? 1 / sigmaT_avg : Infinity;
    const opticalDepth = sigmaT_avg;

    return {
        extinction: sigmaT_avg,
        albedo: albedo,
        mfp: mfp,
        opticalDepth: opticalDepth,
        sigmaA: sigmaA_avg,
        sigmaS: sigmaS_avg
    };
}

function updatePhysicalValuesDisplay() {
    const values = calculatePhysicalValues();

    document.getElementById('extinctionValue').textContent =
        values.extinction < 0.01 ? values.extinction.toExponential(2) + ' m⁻¹' :
        values.extinction.toFixed(2) + ' m⁻¹';

    document.getElementById('albedoValue').textContent = values.albedo.toFixed(2);

    document.getElementById('mfpValue').textContent =
        values.mfp === Infinity ? '∞' :
        values.mfp > 1000 ? (values.mfp / 1000).toFixed(1) + ' km' :
        values.mfp.toFixed(2) + ' m';

    document.getElementById('opticalDepthValue').textContent =
        values.opticalDepth < 0.01 ? values.opticalDepth.toExponential(2) :
        values.opticalDepth.toFixed(2);

    updateAlbedoBar(values);
}

function updateAlbedoBar(values) {
    const albedo = values.albedo;
    const absorbedPercent = (1 - albedo) * 100;
    const scatteredPercent = albedo * 100;

    document.getElementById('absorbedBar').style.width = absorbedPercent + '%';
    document.getElementById('scatteredBar').style.width = scatteredPercent + '%';

    const percentEl = document.getElementById('albedoPercent');
    if (absorbedPercent > 90) {
        percentEl.textContent = `${Math.round(absorbedPercent)}% absorbed`;
    } else if (scatteredPercent > 90) {
        percentEl.textContent = `${Math.round(scatteredPercent)}% scattered`;
    } else {
        percentEl.textContent = `ω = ${albedo.toFixed(2)}`;
    }

    const absLabel = document.querySelector('#absorbedBar .albedo-bar-label');
    const scatLabel = document.querySelector('#scatteredBar .albedo-bar-label');
    absLabel.style.display = absorbedPercent > 20 ? 'block' : 'none';
    scatLabel.style.display = scatteredPercent > 20 ? 'block' : 'none';
}

function updateWavelengthBars() {
    const container = document.getElementById('wavelengthResponse');
    container.classList.toggle('visible', effects.rayleigh);

    if (!effects.rayleigh) return;

    const baseR = Math.pow(550/700, 4);
    const baseG = 1.0;
    const baseB = Math.pow(550/450, 4);
    const maxVal = baseB;

    document.getElementById('barRed').style.width = (baseR / maxVal * 100) + '%';
    document.getElementById('barGreen').style.width = (baseG / maxVal * 100) + '%';
    document.getElementById('barBlue').style.width = '100%';

    document.getElementById('multRed').textContent = (baseR).toFixed(1) + '×';
    document.getElementById('multGreen').textContent = (baseG).toFixed(1) + '×';
    document.getElementById('multBlue').textContent = (baseB).toFixed(1) + '×';
}

function updatePhaseDiagram() {
    const container = document.getElementById('phaseDiagram');
    const hasScattering = effects.rayleigh || effects.mie;
    container.classList.toggle('visible', hasScattering);

    if (!hasScattering) return;

    const g = effects.mie ? params.anisotropy : 0;
    const points = [];
    const centerX = 100;
    const centerY = 100;
    const maxRadius = 75;

    for (let i = 0; i <= 360; i += 5) {
        const theta = i * PI / 180;
        const cosTheta = Math.cos(theta);

        let phase;
        if (effects.mie) {
            const g2 = g * g;
            const denom = 1 + g2 - 2 * g * cosTheta;
            phase = (1 - g2) / (4 * PI * Math.pow(denom, 1.5));
        } else {
            phase = (3 / (16 * PI)) * (1 + cosTheta * cosTheta);
        }

        const maxPhase = effects.mie ? (1 - g*g) / (4 * PI * Math.pow(1 - g, 3)) : 3 / (8 * PI);
        const r = (phase / maxPhase) * maxRadius;

        const x = centerX + r * Math.cos(theta);
        const y = centerY - r * Math.sin(theta);
        points.push(`${x},${y}`);
    }

    const path = document.getElementById('phaseCurve');
    path.setAttribute('d', `M ${points.join(' L ')} Z`);
}

function updateRegimeBadge() {
    const badge = document.getElementById('regimeBadge');
    const size = params.particleSize;
    const x = (2 * PI * (size / 2)) / 550;

    if (x < 0.1) {
        badge.textContent = 'Rayleigh';
        badge.className = 'regime-badge rayleigh';
    } else if (x > 10) {
        badge.textContent = 'Geometric';
        badge.className = 'regime-badge geometric';
    } else {
        badge.textContent = 'Mie';
        badge.className = 'regime-badge mie';
    }
}

// ========== WebGL Setup ==========
async function loadShader(url) {
    const response = await fetch(url);
    return response.text();
}

async function initWebGL() {
    gl = sceneCanvas.getContext('webgl2');
    if (!gl) {
        console.error('WebGL 2 not supported');
        return;
    }

    // Load shaders from external files
    const [vertexSource, fragmentSource] = await Promise.all([
        loadShader('shaders/volume.vert.glsl'),
        loadShader('shaders/volume.frag.glsl')
    ]);

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error('VS:', gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error('FS:', gl.getShaderInfoLog(fs));
    }

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Link:', gl.getProgramInfoLog(program));
    }

    // Create quad
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1, 1, 1
    ]), gl.STATIC_DRAW);

    // Cache uniforms
    uniforms = {
        aPosition: gl.getAttribLocation(program, 'aPosition'),
        uSigmaA: gl.getUniformLocation(program, 'uSigmaA'),
        uRayleighDensity: gl.getUniformLocation(program, 'uRayleighDensity'),
        uMieDensity: gl.getUniformLocation(program, 'uMieDensity'),
        uParticleSize: gl.getUniformLocation(program, 'uParticleSize'),
        uAnisotropy: gl.getUniformLocation(program, 'uAnisotropy'),
        uEffects: gl.getUniformLocation(program, 'uEffects'),
        uViewMode: gl.getUniformLocation(program, 'uViewMode'),
        uResolution: gl.getUniformLocation(program, 'uResolution'),
        uCameraRotX: gl.getUniformLocation(program, 'uCameraRotX'),
        uCameraRotY: gl.getUniformLocation(program, 'uCameraRotY'),
        uCameraZoom: gl.getUniformLocation(program, 'uCameraZoom'),
        uLightColor: gl.getUniformLocation(program, 'uLightColor'),
        uLightIntensity: gl.getUniformLocation(program, 'uLightIntensity'),
        uLightDir: gl.getUniformLocation(program, 'uLightDir')
    };
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio;
    const rect = sceneCanvas.getBoundingClientRect();
    sceneCanvas.width = rect.width * dpr;
    sceneCanvas.height = rect.height * dpr;
}

function render() {
    if (!gl || !program) {
        requestAnimationFrame(render);
        return;
    }

    // Update camera smoothly
    camera.rotX += (camera.targetRotX - camera.rotX) * camera.damping;
    camera.rotY += (camera.targetRotY - camera.rotY) * camera.damping;
    camera.zoom += (camera.targetZoom - camera.zoom) * camera.damping;

    const w = sceneCanvas.width;
    const h = sceneCanvas.height;
    gl.viewport(0, 0, w, h);

    gl.useProgram(program);

    // Set uniforms
    gl.uniform3f(uniforms.uSigmaA, params.sigmaR, params.sigmaG, params.sigmaB);
    gl.uniform1f(uniforms.uRayleighDensity, effects.rayleigh ? params.density : 0.0);
    gl.uniform1f(uniforms.uMieDensity, effects.mie ? params.density : 0.0);
    gl.uniform1f(uniforms.uParticleSize, params.particleSize);
    gl.uniform1f(uniforms.uAnisotropy, params.anisotropy);
    gl.uniform3f(uniforms.uLightColor, params.lightColor.r, params.lightColor.g, params.lightColor.b);
    gl.uniform1f(uniforms.uLightIntensity, params.lightIntensity);
    gl.uniform3f(uniforms.uLightDir, lightDir.x, lightDir.y, lightDir.z);

    // Effect flags
    let effectFlags = 0;
    if (effects.absorption) effectFlags |= 1;
    if (effects.rayleigh) effectFlags |= 2;
    if (effects.mie) effectFlags |= 4;
    gl.uniform1i(uniforms.uEffects, effectFlags);

    // View mode
    const viewModeInt = viewMode === 'transmitted' ? 0 : viewMode === 'scattered' ? 1 : 2;
    gl.uniform1i(uniforms.uViewMode, viewModeInt);

    gl.uniform2f(uniforms.uResolution, w, h);
    gl.uniform1f(uniforms.uCameraRotX, camera.rotX);
    gl.uniform1f(uniforms.uCameraRotY, camera.rotY);
    gl.uniform1f(uniforms.uCameraZoom, camera.zoom);

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(uniforms.aPosition);
    gl.vertexAttribPointer(uniforms.aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

// ========== Camera Controls ==========
function initCameraControls() {
    sceneWrapper.addEventListener('mousedown', (e) => {
        camera.isDragging = true;
        camera.lastX = e.clientX;
        camera.lastY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!camera.isDragging) return;
        const dx = e.clientX - camera.lastX;
        const dy = e.clientY - camera.lastY;
        camera.targetRotY += dx * camera.sensitivity;
        camera.targetRotX += dy * camera.sensitivity;
        camera.targetRotX = Math.max(-1.5, Math.min(1.5, camera.targetRotX));
        camera.lastX = e.clientX;
        camera.lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        camera.isDragging = false;
    });

    sceneWrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.targetZoom += e.deltaY * 0.005;
        camera.targetZoom = Math.max(1.5, Math.min(8, camera.targetZoom));
    }, { passive: false });

    // Touch support
    sceneWrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            camera.isDragging = true;
            camera.lastX = e.touches[0].clientX;
            camera.lastY = e.touches[0].clientY;
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!camera.isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - camera.lastX;
        const dy = e.touches[0].clientY - camera.lastY;
        camera.targetRotY += dx * camera.sensitivity;
        camera.targetRotX += dy * camera.sensitivity;
        camera.targetRotX = Math.max(-1.5, Math.min(1.5, camera.targetRotX));
        camera.lastX = e.touches[0].clientX;
        camera.lastY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', () => {
        camera.isDragging = false;
    });
}

// ========== UI Event Handlers ==========
function initUI() {
    // Effect toggles
    document.querySelectorAll('.effect-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const effect = btn.dataset.effect;
            effects[effect] = !effects[effect];
            btn.classList.toggle('active', effects[effect]);
            updatePhysicalValuesDisplay();
            updateShaderCode();
            highlightBuildingBlock(effect, effects[effect]);
            updateWavelengthBars();
            updatePhaseDiagram();
        });
    });

    // View mode buttons
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            viewMode = btn.dataset.mode;
        });
    });

    // Sliders
    const sliderIds = ['sigmaR', 'sigmaG', 'sigmaB', 'particleSize', 'density', 'anisotropy'];
    sliderIds.forEach(id => {
        const slider = document.getElementById(id);
        slider.addEventListener('input', (e) => {
            params[id] = parseFloat(e.target.value);
            updateSliderDisplay(id);
            updatePhysicalValuesDisplay();
            updateShaderCode();
            clearActivePreset();
            if (id === 'particleSize') {
                updateRegimeBadge();
            }
            if (id === 'anisotropy') {
                updatePhaseDiagram();
            }
        });
    });

    // Light color picker
    const lightColorInput = document.getElementById('lightColor');
    lightColorInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        params.lightColor = hexToRgb(hex);
        document.getElementById('lightColorValue').textContent = hex;
        updateLightLabel();
    });

    // Light intensity slider
    const lightIntensityInput = document.getElementById('lightIntensity');
    lightIntensityInput.addEventListener('input', (e) => {
        params.lightIntensity = parseFloat(e.target.value);
        document.getElementById('lightIntensityValue').textContent = params.lightIntensity.toFixed(1);
    });

    // Learning path tabs
    document.querySelectorAll('.learning-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.learning-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const path = tab.dataset.path;
            filterPresets(path);
        });
    });

    // Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = presets[btn.dataset.preset];
            if (!preset) return;

            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            params.sigmaR = preset.sigmaR;
            params.sigmaG = preset.sigmaG;
            params.sigmaB = preset.sigmaB;
            params.particleSize = preset.particleSize;
            params.density = preset.density;
            params.anisotropy = preset.anisotropy;

            effects.absorption = preset.effects.absorption;
            effects.rayleigh = preset.effects.rayleigh;
            effects.mie = preset.effects.mie;

            updateAllSliders();
            updateEffectToggles();
            updatePhysicalValuesDisplay();
            updateShaderCode();
            updateRegimeBadge();
            updateWavelengthBars();
            updatePhaseDiagram();
        });
    });

    // Why is buttons
    document.querySelectorAll('.why-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const answerId = btn.dataset.answer;
            const answer = document.getElementById('answer-' + answerId);
            const isVisible = answer.classList.contains('visible');

            document.querySelectorAll('.why-answer').forEach(a => a.classList.remove('visible'));
            document.querySelectorAll('.why-btn').forEach(b => b.classList.remove('active'));

            if (!isVisible) {
                answer.classList.add('visible');
                btn.classList.add('active');
            }
        });
    });
}

function filterPresets(path) {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        if (path === 'all') {
            btn.classList.remove('hidden');
        } else {
            const btnPath = btn.dataset.path;
            btn.classList.toggle('hidden', btnPath !== path);
        }
    });
}

function updateLightLabel() {
    const label = document.getElementById('lightLabel');
    const r = params.lightColor.r;
    const g = params.lightColor.g;
    const b = params.lightColor.b;

    if (r > 0.9 && g > 0.9 && b > 0.85) {
        label.textContent = 'Sunlight';
    } else if (r > 0.8 && g > 0.6 && b < 0.5) {
        label.textContent = 'Warm Light';
    } else if (b > r && b > g) {
        label.textContent = 'Cool Light';
    } else {
        label.textContent = 'Point Light';
    }
}

function updateSliderDisplay(id) {
    const value = params[id];
    const displayEl = document.getElementById(id + 'Value');

    if (id === 'particleSize') {
        if (value < 1000) {
            displayEl.textContent = value.toFixed(1) + ' nm';
        } else {
            displayEl.textContent = (value / 1000).toFixed(1) + ' μm';
        }
    } else if (id === 'anisotropy') {
        displayEl.textContent = value.toFixed(2);
    } else {
        displayEl.textContent = value.toFixed(2);
    }
}

function updateAllSliders() {
    ['sigmaR', 'sigmaG', 'sigmaB', 'particleSize', 'density', 'anisotropy'].forEach(id => {
        document.getElementById(id).value = params[id];
        updateSliderDisplay(id);
    });
}

function updateEffectToggles() {
    document.querySelectorAll('.effect-toggle').forEach(btn => {
        const effect = btn.dataset.effect;
        btn.classList.toggle('active', effects[effect]);
        highlightBuildingBlock(effect, effects[effect]);
    });
}

function highlightBuildingBlock(effect, active) {
    const blockMap = {
        'absorption': 'absorption',
        'rayleigh': 'rayleigh',
        'mie': 'mie'
    };
    const block = document.querySelector(`.block-item[data-block="${blockMap[effect]}"]`);
    if (block) {
        block.classList.toggle('highlight', active);
    }
}

function clearActivePreset() {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
}

// ========== Shader Code Generation ==========
function updateShaderCode() {
    let code = `// Light Transport - Combined Effects
// Active: ${[
    effects.absorption ? 'Absorption' : null,
    effects.rayleigh ? 'Rayleigh' : null,
    effects.mie ? 'Mie' : null
].filter(Boolean).join(' + ') || 'None'}

`;

    if (effects.absorption) {
        code += `// Beer-Lambert Absorption
vec3 sigmaA = vec3(${params.sigmaR.toFixed(3)}, ${params.sigmaG.toFixed(3)}, ${params.sigmaB.toFixed(3)});
vec3 absorption = exp(-sigmaA * depth);

`;
    }

    if (effects.rayleigh) {
        code += `// Rayleigh Scattering (σ ∝ 1/λ⁴)
vec3 rayleighCoeff(float density) {
    vec3 lambda = vec3(700.0, 550.0, 450.0) / 550.0;
    return density / (lambda * lambda * lambda * lambda);
}

float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
}

`;
    }

    if (effects.mie) {
        code += `// Mie Scattering (particle size: ${params.particleSize < 1000 ? params.particleSize.toFixed(0) + 'nm' : (params.particleSize/1000).toFixed(1) + 'μm'})
float henyeyGreenstein(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return (1.0 - g2) / (4.0 * PI * pow(denom, 1.5));
}

float g = ${params.anisotropy.toFixed(2)}; // Forward scattering

`;
    }

    code += `// Combined extinction coefficient
vec3 sigmaT = ${effects.absorption ? 'sigmaA' : 'vec3(0.0)'}`;
    if (effects.rayleigh) code += ` + sigmaS_rayleigh`;
    if (effects.mie) code += ` + sigmaS_mie`;
    code += `;

// Transmittance through medium
vec3 T = exp(-sigmaT * depth);`;

    document.getElementById('shaderCode').textContent = code;
}

function copyCode() {
    const code = document.getElementById('shaderCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.innerHTML = '<span>Copied!</span>';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = '<span>Copy Code</span>';
            btn.classList.remove('copied');
        }, 2000);
    });
}

// Make copyCode available globally
window.copyCode = copyCode;

// ========== Initialization ==========
window.addEventListener('load', async () => {
    await initWebGL();
    resizeCanvas();
    initCameraControls();
    initUI();
    updateAllSliders();
    updateEffectToggles();
    updatePhysicalValuesDisplay();
    updateShaderCode();
    updateRegimeBadge();
    updateWavelengthBars();
    updatePhaseDiagram();
    updateLightLabel();
    highlightBuildingBlock('absorption', effects.absorption);
    render();
});

window.addEventListener('resize', resizeCanvas);
