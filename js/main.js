// Charles Grassi CV - Main JavaScript
// All interactive functionality for the portfolio site

// ============================================
// MOBILE FULLSCREEN SIMULATION MODE
// ============================================
(function initMobileSimulationMode() {
    const isMobile = window.innerWidth <= 900;
    if (isMobile) {
        document.body.classList.add('mobile-simulation-mode');
    }
    // Also handle orientation changes
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 900) {
            document.body.classList.add('mobile-simulation-mode');
        } else {
            document.body.classList.remove('mobile-simulation-mode');
        }
    });
})();

// ============================================
// CACHED WINDOW DIMENSIONS (avoid forced reflow)
// ============================================
let cachedWindowWidth = window.innerWidth;
let cachedWindowHeight = window.innerHeight;

// ============================================
// RENDER PARAMETERS (UI-controllable)
// ============================================
// Planet A: Oceanic/Mountain planets (blue/green, water)
const planetParamsA = {
    noiseScale: 1.8,
    terrainHeight: 0.6,
    atmosIntensity: 0.6,
    atmosThickness: 2.5,
    atmosPower: 37.1,
    scatterColor: '#1a40e6',  // Blue-dominant for Earth-like Rayleigh scattering
    scatterScale: 0.5,
    sunsetStrength: 1.0,
    oceanRoughness: 0.55,
    sssIntensity: 1.0,
    seaLevel: 0.0,
    landRoughness: 0.65,
    normalStrength: 0.15
};

// Planet B: Lava/Desert planets (volcanic)
const planetParamsB = {
    noiseScale: 1.8,
    terrainHeight: 0.6,
    atmosIntensity: 0.8,
    atmosThickness: 2.0,
    atmosPower: 25.0,
    scatterColor: '#e63319',  // Red-dominant for volcanic/Mars-like atmosphere
    scatterScale: 0.8,
    sunsetStrength: 0.5,
    lavaIntensity: 3.0,
    seaLevel: 0.0,
    landRoughness: 0.75,
    normalStrength: 0.2
};

// Global render params (for backwards compatibility)
const renderParams = {
    parallaxStrength: 1.0   // 3D parallax effect strength (0=off, 1=normal)
};

// Light properties (shared across all planet types)
const lightParams = {
    light0Intensity: 1.0,
    light0Attenuation: 0.06,
    light0Kelvin: 15000,
    light1Intensity: 1.0,
    light1Attenuation: 0.06,
    light1Kelvin: 2000,
    light2Intensity: 1.0,
    light2Attenuation: 0.06,
    light2Kelvin: 5000,
    ambientIntensity: 0.0,  // Ambient light in space (default 0)
    fogIntensity: 0.15       // Fog intensity (colored by env light)
};

// Sun/Star halo parameters (UI-controllable)
const sunParams = {
    coreSize: 0.5,
    glowSize: 1.0,
    glowIntensity: 0.6,
    coronaIntensity: 1.0,
    rayCount: 12,
    rayIntensity: 1.0,
    rayLength: 2.0,
    streamerCount: 6,
    streamerIntensity: 1.0,
    streamerLength: 1.5,
    haloRing1Dist: 1.2,
    haloRing1Intensity: 0.15,
    haloRing2Dist: 1.8,
    haloRing2Intensity: 0.08,
    flickerSpeed: 3.0,
    pulseSpeed: 2.0,
    chromaticShift: 1.0
};

// Orbital system parameters (UI-controllable)
const orbitParams = {
    // Global orbital speed multiplier
    orbitSpeed: 1.0,           // Global orbit speed multiplier (0 - 3.0)
    // Sun positioning
    sunSpread: 1.0,            // How far apart suns are positioned (0.5 - 2.0)
    sunSpawnMin: 0.2,          // Minimum distance from center for suns (0.1 - 0.5)
    sunSpawnMax: 0.45,         // Maximum distance from center for suns (0.3 - 0.6)
    // Moon orbit settings
    moonOrbitRadius: 1.0,      // Moon orbit radius multiplier (0.5 - 2.0)
    moonOrbitSpacing: 1.0,     // Gap between successive moon orbits (0.5 - 2.0)
    moonOrbitTilt: 1.0,        // How tilted moon orbits are (0 - 2.0)
    baseOrbitMin: 0.04,        // Minimum base orbit radius (0.02 - 0.1)
    baseOrbitMax: 0.08,        // Maximum base orbit radius (0.05 - 0.15)
    spawnOffset: 0.0,          // Offset angle for all spawning positions in radians (-PI to PI)
    // Sub-moon settings
    subMoonOrbitRadius: 1.0,   // Sub-moon orbit radius multiplier (0.5 - 2.0)
    subMoonSpeed: 1.0,         // Sub-moon speed multiplier (0.5 - 3.0)
    subMoonSize: 0.5,          // Sub-moon size multiplier (0.2 - 1.0)
    // Visual settings
    orbitLineOpacity: 0.25,    // Orbit circle line opacity (0 - 1)
    orbitLineWidth: 1.0,       // Orbit circle line width (0.5 - 3)
    // Camera settings
    cameraRotSpeed: 1.0,       // Camera rotation sensitivity (0.2 - 3.0)
    // Display toggles
    showOrbits: 1.0            // Show orbit circles (0 or 1)
};

// Legacy alias for compatibility
const physicsParams = orbitParams;

// Display settings
let showPlanetLabels = true;  // Toggle for planet labels visibility
let showConnectionLinks = false;  // Toggle for connection links visibility (hidden by default)

// Global camera rotation (shared between skill network and background)
// Updated by skill network, read by background shader
window.globalCameraRotX = 0;
window.globalCameraRotY = 0;
window.globalZoom = 1.0;

// Nebula background parameters (UI-controllable)
// Used by the Three.js background shader
const nebulaParams = {
    intensity: 0.25,        // Overall nebula brightness (0-1)
    scale: 2.0,             // Noise scale - higher = smaller features (0.5-10)
    detail: 2.0,            // Detail/octaves (0-4)
    speed: 0.08,            // Animation speed (0-0.5)
    colorVariation: 0.8,    // Color variation amount (0-2)
    dustDensity: 0.4,       // Dust lane density (0-1)
    starDensity: 0.25,      // Background star density (0-1)
    lightInfluence: 0.4,    // How much lights affect nebula (0-2)
    fractalIntensity: 0.15, // Fractal pattern intensity in lit areas (0-1)
    fractalScale: 8.0,      // Fractal pattern scale (1-20)
    fractalSpeed: 0.03,     // Fractal animation speed (0-0.1)
    fractalSaturation: 3.0, // Fractal color saturation (1-5)
    fractalFalloff: 3.0,    // Fractal light falloff (1-10)
    vignetteStrength: 0.3,  // Vignette darkness (0-1)
    // Nebula colors (RGB 0-1)
    colorPurple: [0.12, 0.04, 0.18],
    colorCyan: [0.04, 0.12, 0.20],
    colorBlue: [0.03, 0.06, 0.15],
    colorGold: [0.15, 0.10, 0.03]
};

// Global light data (shared between skill network and background nebula shader)
// Updated by skill network renderSpheresGL, read by background shader
window.globalLights = {
    light0: { x: 0, y: 0, color: [1.0, 0.67, 0.2], intensity: 1.0 },
    light1: { x: 0, y: 0, color: [0.6, 0.3, 0.8], intensity: 1.0 },
    light2: { x: 0, y: 0, color: [0.2, 0.87, 1.0], intensity: 1.0 },
    resolution: { width: 1920, height: 1080 }
};

// Update cache on resize (debounced elsewhere)
window.addEventListener('resize', () => {
    cachedWindowWidth = window.innerWidth;
    cachedWindowHeight = window.innerHeight;
}, { passive: true });

// ============================================
// SHADER DEFINITIONS
// ============================================

// Background Nebula Shaders - loaded from external file shaders/nebula-background.glsl.js
// Uses distant sphere sampling technique matching god rays for consistent camera rotation
const backgroundVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

// The fragment shader is loaded from window.NEBULA_BACKGROUND_FRAGMENT_SHADER
// but we need to convert it for Three.js (uses vUv instead of vUV)
const nebulaFragmentShaderRaw = window.NEBULA_BACKGROUND_FRAGMENT_SHADER || '';
// Replace all vUV with vUv for Three.js compatibility
const backgroundFragmentShader = nebulaFragmentShaderRaw.replace(/vUV/g, 'vUv');

const particleVertexShader = `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform vec2 uParallax;
    attribute float aScale;
    attribute float aSpeed;
    attribute float aDepth;
    varying float vAlpha;

    void main() {
        vec3 pos = position;
        pos.x += sin(uTime * aSpeed * 0.5 + position.y * 2.0) * 0.02;
        pos.y += mod(uTime * aSpeed * 0.1, 2.0) - 1.0;
        pos.y = mod(pos.y + 1.0, 2.0) - 1.0;

        // Apply parallax based on depth - far particles move less
        float parallaxFactor = 0.1 + aDepth * 0.9; // Far=10%, Near=100%
        pos.xy += uParallax * parallaxFactor;

        gl_Position = vec4(pos, 1.0);
        gl_PointSize = aScale * uPixelRatio * 3.0;
        vAlpha = smoothstep(1.0, 0.7, abs(pos.y)) * 0.4;
    }
`;

const particleFragmentShader = `
    varying float vAlpha;
    void main() {
        float dist = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
        vec3 color = mix(vec3(0.91, 0.73, 0.14), vec3(0.18, 0.83, 0.75), 0.5);
        gl_FragColor = vec4(color, alpha);
    }
`;

// Skill Sphere WebGL Shaders - loaded from external .glsl.js files
// Edit shaders in: shaders/planet.vert.glsl.js, shaders/planet.frag.glsl.js, and shaders/sun.frag.glsl.js
// These are loaded via <script> tags in index.html BEFORE main.js
const sphereVertexShader = window.PLANET_VERTEX_SHADER;
const sphereFragmentShader = window.PLANET_FRAGMENT_SHADER;
const sunFragmentShader = window.SUN_FRAGMENT_SHADER;

// Verify shaders loaded correctly
if (!sphereVertexShader || !sphereFragmentShader || !sunFragmentShader) {
    console.error('Shaders not loaded! Make sure shader script tags are before main.js');
} else {
    console.log('Planet and Sun shaders loaded from external .glsl.js files');
}

// Nebula background shader - loaded from shaders/nebula-background.glsl.js
const nebulaBackgroundVertexShader = window.NEBULA_BACKGROUND_VERTEX_SHADER;
const nebulaBackgroundFragmentShader = window.NEBULA_BACKGROUND_FRAGMENT_SHADER;
if (!nebulaBackgroundFragmentShader) {
    console.error('Nebula background shader not loaded! Make sure nebula-background.glsl.js is before main.js');
} else {
    console.log('Nebula background shader loaded from external .glsl.js file');
}

// ============================================
// BACKGROUND NEBULA EFFECT (Three.js)
// Uses distant sphere sampling with light integration from skill graph
// ============================================
(function initBackground() {
    const canvas = document.getElementById('gpu-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // Check if nebula shader loaded
    if (!window.NEBULA_BACKGROUND_FRAGMENT_SHADER) {
        console.error('Nebula background shader not loaded!');
        return;
    }

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        premultipliedAlpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(cachedWindowWidth, cachedWindowHeight);
    renderer.setClearColor(0x000000, 0);  // Fully transparent clear

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    document.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX / cachedWindowWidth;
        mouse.targetY = 1.0 - e.clientY / cachedWindowHeight;
    }, { passive: true });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        vertexShader: backgroundVertexShader,
        fragmentShader: backgroundFragmentShader,
        uniforms: {
            // Basic uniforms
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uResolution: { value: new THREE.Vector2(cachedWindowWidth, cachedWindowHeight) },
            uCameraRotX: { value: 0 },
            uCameraRotY: { value: 0 },
            // Light sources from skill graph
            uLight0: { value: new THREE.Vector2(0, 0) },
            uLight1: { value: new THREE.Vector2(0, 0) },
            uLight2: { value: new THREE.Vector2(0, 0) },
            uLightColor0: { value: new THREE.Vector3(1.0, 0.67, 0.2) },
            uLightColor1: { value: new THREE.Vector3(0.6, 0.3, 0.8) },
            uLightColor2: { value: new THREE.Vector3(0.2, 0.87, 1.0) },
            uLight0Intensity: { value: 1.0 },
            uLight1Intensity: { value: 1.0 },
            uLight2Intensity: { value: 1.0 },
            // Nebula parameters (subtle defaults)
            uNebulaIntensity: { value: 0.25 },
            uNebulaScale: { value: 2.0 },
            uNebulaDetail: { value: 2.0 },
            uNebulaSpeed: { value: 0.08 },
            uLightInfluence: { value: 0.4 },
            uColorVariation: { value: 0.8 },
            uDustDensity: { value: 0.4 },
            uStarDensity: { value: 0.25 },
            uFractalIntensity: { value: 0.15 },
            uFractalScale: { value: 8.0 },
            uFractalSpeed: { value: 0.03 },
            uFractalSaturation: { value: 3.0 },
            uFractalFalloff: { value: 3.0 },
            uVignetteStrength: { value: 0.3 },
            // Nebula colors
            uNebulaColorPurple: { value: new THREE.Vector3(0.12, 0.04, 0.18) },
            uNebulaColorCyan: { value: new THREE.Vector3(0.04, 0.12, 0.20) },
            uNebulaColorBlue: { value: new THREE.Vector3(0.03, 0.06, 0.15) },
            uNebulaColorGold: { value: new THREE.Vector3(0.15, 0.10, 0.03) },
            uZoom: { value: 1.0 },
            uZoomCenter: { value: new THREE.Vector2(0.5, 0.5) }
        },
        transparent: true,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;
        mouse.x += (mouse.targetX - mouse.x) * 0.02;
        mouse.y += (mouse.targetY - mouse.y) * 0.02;
        material.uniforms.uTime.value = time;
        material.uniforms.uMouse.value.set(mouse.x, mouse.y);

        // Read camera rotation from global (set by skill network)
        material.uniforms.uCameraRotX.value = window.globalCameraRotX || 0;
        material.uniforms.uCameraRotY.value = window.globalCameraRotY || 0;

        // Read light data from global (set by skill network renderSpheresGL)
        const lights = window.globalLights;
        if (lights) {
            const res = lights.resolution || { width: cachedWindowWidth, height: cachedWindowHeight };
            material.uniforms.uResolution.value.set(res.width, res.height);

            // Update light positions (convert to normalized coordinates for shader)
            if (lights.light0) {
                material.uniforms.uLight0.value.set(lights.light0.x, lights.light0.y);
                if (lights.light0.color) {
                    material.uniforms.uLightColor0.value.set(
                        lights.light0.color[0], lights.light0.color[1], lights.light0.color[2]
                    );
                }
                material.uniforms.uLight0Intensity.value = lights.light0.intensity || 1.0;
            }
            if (lights.light1) {
                material.uniforms.uLight1.value.set(lights.light1.x, lights.light1.y);
                if (lights.light1.color) {
                    material.uniforms.uLightColor1.value.set(
                        lights.light1.color[0], lights.light1.color[1], lights.light1.color[2]
                    );
                }
                material.uniforms.uLight1Intensity.value = lights.light1.intensity || 1.0;
            }
            if (lights.light2) {
                material.uniforms.uLight2.value.set(lights.light2.x, lights.light2.y);
                if (lights.light2.color) {
                    material.uniforms.uLightColor2.value.set(
                        lights.light2.color[0], lights.light2.color[1], lights.light2.color[2]
                    );
                }
                material.uniforms.uLight2Intensity.value = lights.light2.intensity || 1.0;
            }
        }

        // Read nebula parameters from global nebulaParams object (set by UI)
        material.uniforms.uNebulaIntensity.value = nebulaParams.intensity;
        material.uniforms.uNebulaScale.value = nebulaParams.scale;
        material.uniforms.uNebulaDetail.value = nebulaParams.detail;
        material.uniforms.uNebulaSpeed.value = nebulaParams.speed;
        material.uniforms.uColorVariation.value = nebulaParams.colorVariation;
        material.uniforms.uDustDensity.value = nebulaParams.dustDensity;
        material.uniforms.uStarDensity.value = nebulaParams.starDensity;
        material.uniforms.uLightInfluence.value = nebulaParams.lightInfluence;
        material.uniforms.uFractalIntensity.value = nebulaParams.fractalIntensity;
        material.uniforms.uFractalScale.value = nebulaParams.fractalScale;
        material.uniforms.uFractalSpeed.value = nebulaParams.fractalSpeed;
        material.uniforms.uFractalSaturation.value = nebulaParams.fractalSaturation;
        material.uniforms.uFractalFalloff.value = nebulaParams.fractalFalloff;
        material.uniforms.uVignetteStrength.value = nebulaParams.vignetteStrength;
        // Nebula colors
        material.uniforms.uNebulaColorPurple.value.set(nebulaParams.colorPurple[0], nebulaParams.colorPurple[1], nebulaParams.colorPurple[2]);
        material.uniforms.uNebulaColorCyan.value.set(nebulaParams.colorCyan[0], nebulaParams.colorCyan[1], nebulaParams.colorCyan[2]);
        material.uniforms.uNebulaColorBlue.value.set(nebulaParams.colorBlue[0], nebulaParams.colorBlue[1], nebulaParams.colorBlue[2]);
        material.uniforms.uNebulaColorGold.value.set(nebulaParams.colorGold[0], nebulaParams.colorGold[1], nebulaParams.colorGold[2]);
        material.uniforms.uZoom.value = window.globalZoom || 1.0;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

    console.log('Nebula background initialized with light integration');
})();

// God Rays Fullscreen Shader - loaded from shaders/godrays.glsl.js
const godRaysVertexShader = window.GODRAYS_VERTEX_SHADER;
const godRaysFragmentShader = window.GODRAYS_FRAGMENT_SHADER;

// Debug Quad Shader - loaded from shaders/debug-quad.glsl.js
const debugQuadVertexShader = window.DEBUG_QUAD_VERTEX_SHADER;
const debugQuadFragmentShader = window.DEBUG_QUAD_FRAGMENT_SHADER;

// Space particles shaders (loaded from shaders/space-particles.glsl.js)
const spaceParticleVertexShader = window.SPACE_PARTICLE_VERTEX_SHADER;
const spaceParticleFragmentShader = window.SPACE_PARTICLE_FRAGMENT_SHADER;

// ============================================
// SKILL NETWORK GRAPH
// ============================================
(function initSkillGraph() {
    const canvas = document.getElementById('skill-graph-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    let time = 0;

    const colors = {
        gold: '#e8b923',
        goldDim: '#c49a1a',
        teal: '#2dd4bf',
        tealDim: '#1a9a87',
        textPrimary: '#e8eaed',
        textMuted: '#6b7280',
        border: '#1f2937',
        bgCard: '#151d26'
    };

    // Color palette - brighter, more saturated for visibility:
    // - Graphics APIs: Blue/purple family (distinct shades)
    // - Unity ecosystem: Brighter teal variations
    // - Unreal ecosystem: Vibrant orange/coral
    // - Tools: Purple with good contrast
    const skills = [
        // === SUNS (3 main hubs) - Kelvin temperature colors ===
        { id: 'unity', label: 'Unity', category: 'primary', baseSize: 45, isLight: true, lightColor: '#aaccff',
          desc: 'Primary game engine', usage: 'Daily since 2017 - shipped 12+ titles across mobile, PC, and VR platforms' },
        { id: 'unreal', label: 'Unreal', category: 'primary', baseSize: 35, isLight: true, lightColor: '#ff6030',
          desc: 'Secondary engine', usage: 'Blueprint systems and material editor for specific projects' },
        { id: 'graphics', label: 'Graphics APIs', category: 'primary', baseSize: 40, isLight: true, lightColor: '#ffcc66',
          desc: 'Low-level rendering', usage: 'DirectX, OpenGL, Vulkan for engine and tools development' },

        // === Unity ecosystem ===
        { id: 'csharp', label: 'C#', category: 'secondary', baseSize: 16, color: '#2dd4bf',
          desc: 'Main programming language', usage: '7+ years - gameplay systems, editor tools, and performance-critical code' },
        { id: 'hdrp', label: 'HDRP', category: 'secondary', baseSize: 12, color: '#f472b6',
          desc: 'High Definition Render Pipeline', usage: 'AAA-quality visuals for high-end platforms' },
        { id: 'urp', label: 'URP', category: 'secondary', baseSize: 11, color: '#fb923c',
          desc: 'Universal Render Pipeline', usage: 'Optimized rendering for mobile and cross-platform' },
        { id: 'vfx', label: 'VFX Graph', category: 'secondary', baseSize: 10, color: '#3bc9a5',
          desc: 'Unity visual effects', usage: 'GPU-driven particle systems and real-time simulations' },
        { id: 'arvr', label: 'AR/VR', category: 'secondary', baseSize: 10, color: '#00d9b5',
          desc: 'Immersive experiences', usage: 'Meta Quest, HoloLens, and mobile AR projects' },

        // === Unreal ecosystem ===
        { id: 'cpp', label: 'C++', category: 'secondary', baseSize: 10, color: '#6c8ebf',
          desc: 'Systems programming', usage: 'Native plugins, engine modifications, and Unreal development' },
        { id: 'niagara', label: 'Niagara', category: 'secondary', baseSize: 10, color: '#ffa066',
          desc: 'Unreal VFX system', usage: 'Complex particle effects for Unreal projects' },

        // === Graphics ecosystem ===
        { id: 'hlsl', label: 'HLSL', category: 'secondary', baseSize: 13, color: '#c850c0',
          desc: 'DirectX shader language', usage: 'Custom rendering pipelines, VFX, and compute shaders' },
        { id: 'glsl', label: 'GLSL', category: 'secondary', baseSize: 12, color: '#a855f7',
          desc: 'OpenGL shader language', usage: 'Cross-platform shaders and WebGL effects' },
        { id: 'directx', label: 'DirectX', category: 'secondary', baseSize: 13, color: '#5090e0',
          desc: 'Graphics API', usage: 'DX11/DX12 for Windows and Xbox development' },
        { id: 'opengl', label: 'OpenGL', category: 'secondary', baseSize: 10, color: '#5c7cfa',
          desc: 'Cross-platform graphics', usage: 'Mobile and desktop rendering' },
        { id: 'compute', label: 'Compute', category: 'secondary', baseSize: 10, color: '#38d9a9',
          desc: 'GPU compute shaders', usage: 'Particle simulations, procedural generation, and physics' },

        // === Tools & other ===
        { id: 'threejs', label: 'Three.js', category: 'secondary', baseSize: 8, color: '#66d9ef',
          desc: 'WebGL framework', usage: 'Interactive 3D web experiences and visualizations' },
        { id: 'python', label: 'Python', category: 'secondary', baseSize: 10, color: '#ffd43b',
          desc: 'Scripting & tools', usage: 'Build automation, asset pipelines, and data processing' },
        { id: 'renderdoc', label: 'RenderDoc', category: 'tool', baseSize: 10, color: '#b87fd8',
          desc: 'Graphics debugger', usage: 'Frame analysis and shader debugging' },
        { id: 'nsight', label: 'NSight', category: 'tool', baseSize: 9, color: '#76b900',
          desc: 'NVIDIA profiler', usage: 'GPU performance analysis and optimization' }
    ];

    const BASE_DIMENSION = 400;
    let sizeScale = 1;

    // Meaningful connections between related skills
    const connections = [
        // Unity ecosystem
        ['unity', 'csharp'],
        ['unity', 'hdrp'],
        ['unity', 'urp'],
        ['unity', 'vfx'],
        ['unity', 'arvr'],
        ['hdrp', 'vfx'],
        ['urp', 'vfx'],
        ['csharp', 'vfx'],

        // Unreal ecosystem
        ['unreal', 'cpp'],
        ['unreal', 'niagara'],
        ['cpp', 'niagara'],

        // Graphics APIs ecosystem
        ['graphics', 'hlsl'],
        ['graphics', 'glsl'],
        ['graphics', 'directx'],
        ['graphics', 'opengl'],
        ['graphics', 'compute'],
        ['hlsl', 'directx'],
        ['glsl', 'opengl'],
        ['hlsl', 'compute'],

        // Cross-system connections (engines use graphics)
        ['unity', 'graphics'],
        ['unreal', 'graphics'],

        // Tools connect to graphics
        ['graphics', 'renderdoc'],
        ['graphics', 'nsight'],
        ['renderdoc', 'nsight'],

        // Three.js uses WebGL/OpenGL
        ['glsl', 'threejs'],
        ['opengl', 'threejs'],

        // Python for tooling
        ['python', 'unity'],
        ['python', 'unreal']
    ];

    // Simple solar system: 3 suns at fixed positions, moons orbit around them
    // Positions in world units (will be multiplied by minDim to get screen pixels)
    // Spread them out more for better visibility
    const sunBasePositions = {
        unity:    { dirX: -0.92, dirY:  0.40, dist: 0.38 },   // Left-top direction
        unreal:   { dirX:  0.87, dirY: -0.50, dist: 0.40 },   // Right-bottom direction
        graphics: { dirX:  0.0,  dirY:  1.0,  dist: 0.38 }    // Top-center direction
    };

    // Dynamic sun position calculation
    function getSunPosition(sunId) {
        const base = sunBasePositions[sunId];
        const minDist = orbitParams.sunSpawnMin;
        const maxDist = orbitParams.sunSpawnMax;
        const spread = orbitParams.sunSpread;
        const offset = orbitParams.spawnOffset;
        // Map base distance (0-1) to min-max range, then apply spread
        const actualDist = (minDist + base.dist * (maxDist - minDist)) * spread;
        // Apply rotation offset to the direction
        const cosOff = Math.cos(offset);
        const sinOff = Math.sin(offset);
        const rotX = base.dirX * cosOff - base.dirY * sinOff;
        const rotY = base.dirX * sinOff + base.dirY * cosOff;
        return {
            x: rotX * actualDist,
            y: rotY * actualDist,
            z: 0
        };
    }

    // Per-solar-system orbital plane tilt (random axis for each sun's entire system)
    // All moons of the same sun share the same orbital plane
    const solarSystemTilts = {
        unity:    { tiltX: 0.4, tiltY: 0.3 },    // Unity system tilted one way
        unreal:   { tiltX: -0.5, tiltY: 0.2 },   // Unreal system tilted differently
        graphics: { tiltX: 0.2, tiltY: -0.4 }    // Graphics system with its own tilt
    };

    // Moon orbit configurations - baseRadius is normalized 0-1 (mapped to baseOrbitMin-Max)
    // All moons of the same sun share the solar system's orbital plane tilt
    // Final radius = (baseOrbitMin + baseRadius * (baseOrbitMax - baseOrbitMin)) + (orbitIndex * spacing)
    const moonOrbits = {
        // Unity moons (all share unity's orbital plane)
        csharp:   { baseRadius: 0.5, orbitIndex: 0, speed: 0.008, phase: 0, sun: 'unity' },
        vfx:      { baseRadius: 0.5, orbitIndex: 1, speed: -0.006, phase: Math.PI * 0.66, sun: 'unity' },
        arvr:     { baseRadius: 0.5, orbitIndex: 2, speed: 0.005, phase: Math.PI * 1.33, sun: 'unity' },
        // Unreal moons (all share unreal's orbital plane)
        cpp:      { baseRadius: 0.5, orbitIndex: 0, speed: 0.007, phase: 0, sun: 'unreal' },
        niagara:  { baseRadius: 0.5, orbitIndex: 1, speed: -0.005, phase: Math.PI, sun: 'unreal' },
        // Graphics moons (all share graphics' orbital plane)
        hlsl:     { baseRadius: 0.25, orbitIndex: 0, speed: 0.009, phase: 0, sun: 'graphics' },
        glsl:     { baseRadius: 0.25, orbitIndex: 1, speed: -0.007, phase: Math.PI * 0.4, sun: 'graphics' },
        directx:  { baseRadius: 0.25, orbitIndex: 2, speed: 0.006, phase: Math.PI * 0.8, sun: 'graphics' },
        opengl:   { baseRadius: 0.25, orbitIndex: 3, speed: -0.005, phase: Math.PI * 1.2, sun: 'graphics' },
        compute:  { baseRadius: 0.25, orbitIndex: 4, speed: 0.004, phase: Math.PI * 1.6, sun: 'graphics' }
    };

    // Sub-moons: former free floaters now orbit around planets (not suns)
    // They orbit at 1/3 the size/radius of their parent moon
    const subMoonOrbits = {
        renderdoc: { radius: 0.035, speed: 0.015, phase: 0, parent: 'directx', tiltX: 0.3, tiltY: -0.2 },
        nsight:    { radius: 0.03, speed: -0.012, phase: Math.PI * 0.5, parent: 'hlsl', tiltX: -0.4, tiltY: 0.35 },
        python:    { radius: 0.04, speed: 0.01, phase: Math.PI, parent: 'niagara', tiltX: 0.2, tiltY: 0.5 },
        threejs:   { radius: 0.038, speed: -0.014, phase: Math.PI * 1.5, parent: 'glsl', tiltX: -0.25, tiltY: -0.4 }
    };

    // Find parent sun for each planet based on connections
    function findParentSun(skillId) {
        const suns = ['unity', 'unreal', 'graphics'];
        if (suns.includes(skillId)) return null; // Suns have no parent

        // Check direct connections first
        for (const [a, b] of connections) {
            if (a === skillId && suns.includes(b)) return b;
            if (b === skillId && suns.includes(a)) return a;
        }

        // Check indirect connections (connected to something connected to a sun)
        for (const [a, b] of connections) {
            const connectedId = a === skillId ? b : (b === skillId ? a : null);
            if (!connectedId) continue;
            for (const [c, d] of connections) {
                if (c === connectedId && suns.includes(d)) return d;
                if (d === connectedId && suns.includes(c)) return c;
            }
        }
        return null;
    }

    let nodes = skills.map((skill) => {
        // Compute depth based on size: larger = closer (depth 1), smaller = farther (depth 0)
        // This is used for visual layering, NOT for perspective Z position
        const depth = Math.min(1.0, Math.max(0.0, (skill.baseSize - 6) / 28));

        // Orbital parameters for planets
        const parentSun = findParentSun(skill.id);

        // Random but not perpendicular orbital plane tilt (max ~45 degrees from XY plane)
        const orbitTiltX = (Math.random() - 0.5) * 0.8; // Tilt around X axis
        const orbitTiltZ = (Math.random() - 0.5) * 0.8; // Tilt around Z axis

        return {
            ...skill,
            size: skill.baseSize,
            x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, // Added z and vz for 3D positioning
            renderX: 0, renderY: 0, // Parallax-adjusted render positions
            depth: depth, // Depth for parallax (0=far, 1=near)
            // Orbital parameters
            parentSun: parentSun,
            orbitAngle: Math.random() * Math.PI * 2, // Starting angle in orbit
            orbitRadius: 0, // Will be assigned based on distance from sun
            orbitSpeed: 0.0005 + Math.random() * 0.001, // Orbital speed (radians per frame)
            orbitTiltX: orbitTiltX,
            orbitTiltZ: orbitTiltZ,
            // Visual effects
            pulseSpeed: 0.05 + Math.random() * 0.1,
            pulsePhase: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.001,
            glowIntensity: 0, targetGlowIntensity: 0, glowDelay: 0,
            shrinkProgress: 1, targetShrink: 1
        };
    });

    let width, height, centerX, centerY;
    let isDragging = false, dragNode = null, hoveredNode = null;
    let mouseX = 0, mouseY = 0;  // World coordinates (for dragging nodes)
    let mouseScreenX = 0, mouseScreenY = 0;  // Screen coordinates (for hit testing)
    let settled = false, settleTimer = 0;
    let startupPhase = true, globalFadeIn = 0;
    let zoomLevel = 1.0, targetZoom = 1.0;
    let zoomCenterX = 0, zoomCenterY = 0;
    let targetZoomCenterX = 0, targetZoomCenterY = 0;
    const MIN_ZOOM = 1.0, MAX_ZOOM = 3.0;
    let mouseLightEnabled = false; // Toggle with spacebar

    // Camera rotation (Alt + Right Click orbit)
    let cameraRotX = 0, cameraRotY = 0;  // Current rotation
    let targetCameraRotX = 0, targetCameraRotY = 0;  // Target rotation
    let isOrbiting = false;  // Alt + Right Click dragging
    let orbitStartX = 0, orbitStartY = 0;  // Mouse position when orbit started
    let orbitStartRotX = 0, orbitStartRotY = 0;  // Camera rotation when orbit started

    const tooltip = document.getElementById('skill-tooltip');
    const tooltipTitle = tooltip.querySelector('.skill-tooltip-title');
    const tooltipDesc = tooltip.querySelector('.skill-tooltip-desc');
    const tooltipUsage = tooltip.querySelector('.skill-tooltip-usage');

    let tooltipTarget = null, tooltipPos = { x: 0, y: 0 }, tooltipConnectPoint = { x: 0, y: 0 };
    let lineAnimProgress = 0, lineAnimStartTime = 0;
    const lineAnimDuration = 300;
    let tooltipSide = 'right';


    let tooltipOffset = { x: 0, y: 0 };
    const tooltipWidth = 260, tooltipHeight = 120;

    function generateTooltipPosition(node) {
        const margin = 20;
        // Use screen-space coordinates (renderX/renderY) for tooltip positioning
        const nodeScreenX = node.renderX !== undefined ? node.renderX : node.x;
        const nodeScreenY = node.renderY !== undefined ? node.renderY : node.y;

        tooltipSide = Math.random() > 0.5 ? 'right' : 'left';
        let tx = tooltipSide === 'right' ? width - tooltipWidth - margin : margin;
        const minY = margin, maxY = height - tooltipHeight - margin;
        let ty = nodeScreenY - tooltipHeight / 2 + (Math.random() - 0.5) * 100;
        ty = Math.max(minY, Math.min(maxY, ty));
        tooltipPos = { x: tx, y: ty };
        tooltipOffset = { x: tx - nodeScreenX, y: ty - nodeScreenY };
        tooltipConnectPoint = tooltipSide === 'right'
            ? { x: tx, y: ty + tooltipHeight / 2 }
            : { x: tx + tooltipWidth, y: ty + tooltipHeight / 2 };
        lineAnimProgress = 0;
        lineAnimStartTime = performance.now();
    }

    function updateTooltipPositionForDrag(node) {
        const margin = 20;
        // Use screen-space coordinates (renderX/renderY) for tooltip positioning
        const nodeScreenX = node.renderX !== undefined ? node.renderX : node.x;
        const nodeScreenY = node.renderY !== undefined ? node.renderY : node.y;

        let tx = Math.max(margin, Math.min(width - tooltipWidth - margin, nodeScreenX + tooltipOffset.x));
        let ty = Math.max(margin, Math.min(height - tooltipHeight - margin, nodeScreenY + tooltipOffset.y));
        tooltipPos = { x: tx, y: ty };
        tooltipConnectPoint = tooltipSide === 'right'
            ? { x: tx, y: ty + tooltipHeight / 2 }
            : { x: tx + tooltipWidth, y: ty + tooltipHeight / 2 };
        tooltip.style.left = tooltipPos.x + 'px';
        tooltip.style.top = tooltipPos.y + 'px';
    }

    function updateTooltip(node, forceKeep = false) {
        if (node) {
            if (tooltipTarget !== node && !isDragging) {
                tooltipTarget = node;
                generateTooltipPosition(node);
                tooltip.classList.remove('visible');
            }
            tooltipTitle.textContent = node.label;
            tooltipDesc.textContent = node.desc || '';
            tooltipUsage.textContent = node.usage || '';
            tooltip.className = 'skill-tooltip ' + node.category + (lineAnimProgress >= 1 ? ' visible' : '');
            tooltip.style.left = tooltipPos.x + 'px';
            tooltip.style.top = tooltipPos.y + 'px';
        } else if (!forceKeep) {
            tooltip.classList.remove('visible');
            tooltipTarget = null;
            lineAnimProgress = 0;
        }
    }

    function drawTooltipConnector() {
        if (!tooltipTarget) return;
        const elapsed = performance.now() - lineAnimStartTime;
        lineAnimProgress = Math.min(1, elapsed / lineAnimDuration);
        if (lineAnimProgress >= 1 && !tooltip.classList.contains('visible')) tooltip.classList.add('visible');

        const node = tooltipTarget;
        // Use screen-space coordinates (renderX/renderY) for connector drawing
        const nodeScreenX = node.renderX !== undefined ? node.renderX : node.x;
        const nodeScreenY = node.renderY !== undefined ? node.renderY : node.y;

        let lineColor = node.category === 'primary' ? colors.gold : node.category === 'secondary' ? colors.teal : colors.textMuted;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;

        const cornerX = nodeScreenX, cornerY = tooltipConnectPoint.y;
        const verticalDist = Math.abs(cornerY - nodeScreenY);
        const horizontalDist = Math.abs(tooltipConnectPoint.x - cornerX);
        const totalDist = verticalDist + horizontalDist;
        const drawDist = totalDist * lineAnimProgress;

        ctx.beginPath();
        ctx.moveTo(nodeScreenX, nodeScreenY);
        if (drawDist <= verticalDist) {
            ctx.lineTo(nodeScreenX, nodeScreenY + (cornerY - nodeScreenY) * (drawDist / verticalDist));
        } else {
            ctx.lineTo(cornerX, cornerY);
            const hProgress = (drawDist - verticalDist) / horizontalDist;
            ctx.lineTo(cornerX + (tooltipConnectPoint.x - cornerX) * hProgress, cornerY);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(nodeScreenX, nodeScreenY, 3, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
    }

    // WebGL sphere renderer
    let gl, glCanvas, sphereProgram, sunProgram, godRaysProgram, debugQuadProgram, glReady = false;
    let godRaysQuadBuffer, debugQuadBuffer;
    let showDebugQuads = false; // Toggle for debug quad overlay

    // Space particles system
    let spaceParticleProgram = null;
    let spaceParticleBuffer = null;
    const SPACE_PARTICLE_COUNT = 25000;  // 25k particles for good density
    let spaceParticleData = null;  // Float32Array for particle positions
    let spaceParticleLastTime = 0;

    // Shooting star data (separate from main particle buffer)
    // Each entry: { active: bool, type: 1=gold/2=teal, progress: 0-1, vx, vy, vz, originalIdx }
    let shootingStars = [];

    // Shooting star parameters (UI-controllable)
    const shootingStarParams = {
        chance: 0.1,              // DEBUG: Very frequent (normal: 0.0003)
        duration: 0.8,            // Duration in seconds
        speed: 0.4,               // Speed multiplier
        maxActive: 5,             // Maximum concurrent shooting stars
        goldColor: '#e8b923',     // Gold color (accent-gold)
        tealColor: '#2dd4bf'      // Teal color (accent-teal)
    };

    // Space particle DoF parameters (UI-controllable)
    const spaceParticleParams = {
        // Focus distance settings
        focusDistance: 0.7,     // Distance from camera where particles are in focus
        focusRange: 0.15,       // Range around focus distance that's sharp
        nearBlurDist: 0.3,      // Distance where near blur starts
        farBlurDist: 1.2,       // Distance where far blur starts

        // Bokeh effect
        maxBlurSize: 25.0,      // Maximum blur circle size in pixels
        apertureSize: 1.0,      // Affects bokeh intensity (f-stop simulation)
        bokehRingWidth: 0.5,    // Width of bokeh ring (0 = filled, 1 = thin ring)
        bokehRingIntensity: 0.8, // Brightness of ring edge

        // Circle quality
        circleSoftness: 0.3,    // Edge softness (0 = hard, 1 = very soft)

        // Appearance
        particleSize: 2.0,      // Base particle size
        brightness: 1.0,        // Overall particle brightness
        lightFalloff: 3.0,      // How quickly light falls off with distance
        baseColor: '#fffaf2',   // Default warm white particle color

        // Internal
        sphereRadius: 0.35,     // Particle distribution sphere radius
        planetZ: 0.0            // Z depth where planets live (for depth sorting)
    };

    // God rays parameters (UI-controllable)
    const godRaysParams = {
        rayIntensity: 0.5,    // Light ray intensity (0-2)
        rayFalloff: 4.0,      // Ray falloff exponent (1-10)
        glowIntensity: 0.5,   // Glow intensity (0-2)
        glowSize: 4.0,        // Glow size/falloff (1-12)
        fogDensity: 6.0,      // Fog noise density (1-15)
        ambientFog: 0.08,     // Ambient fog intensity (0-0.3)
        animSpeed: 1.0,       // Animation speed multiplier (0-3)
        noiseScale: 1.0,      // Noise frequency scale (0.1-3)
        noiseOctaves: 1.0,    // Noise detail/octaves blend (0-2)
        noiseContrast: 1.0    // Noise contrast/sharpness (0.2-3)
    };

    function initSphereGL() {
        glCanvas = document.createElement('canvas');
        glCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
        container.insertBefore(glCanvas, container.firstChild);

        gl = glCanvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
        if (!gl) return false;

        function comp(s, t) {
            const sh = gl.createShader(t);
            gl.shaderSource(sh, s);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(sh));
                return null;
            }
            return sh;
        }

        const vs = comp(sphereVertexShader, gl.VERTEX_SHADER);
        const fs = comp(sphereFragmentShader, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return false;

        sphereProgram = gl.createProgram();
        gl.attachShader(sphereProgram, vs);
        gl.attachShader(sphereProgram, fs);
        gl.linkProgram(sphereProgram);

        if (!gl.getProgramParameter(sphereProgram, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(sphereProgram));
            return false;
        }

        sphereProgram.aPos = gl.getAttribLocation(sphereProgram, 'aPos');
        sphereProgram.aCenter = gl.getAttribLocation(sphereProgram, 'aCenter');
        sphereProgram.aRadius = gl.getAttribLocation(sphereProgram, 'aRadius');
        sphereProgram.aColor = gl.getAttribLocation(sphereProgram, 'aColor');
        sphereProgram.aAlpha = gl.getAttribLocation(sphereProgram, 'aAlpha');
        sphereProgram.aAppear = gl.getAttribLocation(sphereProgram, 'aAppear');
        sphereProgram.aGlow = gl.getAttribLocation(sphereProgram, 'aGlow');
        sphereProgram.aIndex = gl.getAttribLocation(sphereProgram, 'aIndex');
        sphereProgram.aIsLight = gl.getAttribLocation(sphereProgram, 'aIsLight');
        sphereProgram.aDepth = gl.getAttribLocation(sphereProgram, 'aDepth');
        sphereProgram.aZ = gl.getAttribLocation(sphereProgram, 'aZ');
        sphereProgram.uRes = gl.getUniformLocation(sphereProgram, 'uRes');
        sphereProgram.uMouse = gl.getUniformLocation(sphereProgram, 'uMouse');
        sphereProgram.uTime = gl.getUniformLocation(sphereProgram, 'uTime');
        sphereProgram.uLight0 = gl.getUniformLocation(sphereProgram, 'uLight0');
        sphereProgram.uLight1 = gl.getUniformLocation(sphereProgram, 'uLight1');
        sphereProgram.uLight2 = gl.getUniformLocation(sphereProgram, 'uLight2');
        sphereProgram.uLightColor0 = gl.getUniformLocation(sphereProgram, 'uLightColor0');
        sphereProgram.uLightColor1 = gl.getUniformLocation(sphereProgram, 'uLightColor1');
        sphereProgram.uLightColor2 = gl.getUniformLocation(sphereProgram, 'uLightColor2');
        sphereProgram.uLight0Intensity = gl.getUniformLocation(sphereProgram, 'uLight0Intensity');
        sphereProgram.uLight1Intensity = gl.getUniformLocation(sphereProgram, 'uLight1Intensity');
        sphereProgram.uLight2Intensity = gl.getUniformLocation(sphereProgram, 'uLight2Intensity');
        sphereProgram.uLight0Atten = gl.getUniformLocation(sphereProgram, 'uLight0Atten');
        sphereProgram.uLight1Atten = gl.getUniformLocation(sphereProgram, 'uLight1Atten');
        sphereProgram.uLight2Atten = gl.getUniformLocation(sphereProgram, 'uLight2Atten');
        sphereProgram.uLight0Z = gl.getUniformLocation(sphereProgram, 'uLight0Z');
        sphereProgram.uLight1Z = gl.getUniformLocation(sphereProgram, 'uLight1Z');
        sphereProgram.uLight2Z = gl.getUniformLocation(sphereProgram, 'uLight2Z');
        sphereProgram.uLight0WorldPos = gl.getUniformLocation(sphereProgram, 'uLight0WorldPos');
        sphereProgram.uLight1WorldPos = gl.getUniformLocation(sphereProgram, 'uLight1WorldPos');
        sphereProgram.uLight2WorldPos = gl.getUniformLocation(sphereProgram, 'uLight2WorldPos');
        sphereProgram.uLight0ScreenPos = gl.getUniformLocation(sphereProgram, 'uLight0ScreenPos');
        sphereProgram.uLight1ScreenPos = gl.getUniformLocation(sphereProgram, 'uLight1ScreenPos');
        sphereProgram.uLight2ScreenPos = gl.getUniformLocation(sphereProgram, 'uLight2ScreenPos');
        sphereProgram.uMouseLightEnabled = gl.getUniformLocation(sphereProgram, 'uMouseLightEnabled');
        sphereProgram.uAmbientIntensity = gl.getUniformLocation(sphereProgram, 'uAmbientIntensity');
        sphereProgram.uFogIntensity = gl.getUniformLocation(sphereProgram, 'uFogIntensity');
        sphereProgram.uZoom = gl.getUniformLocation(sphereProgram, 'uZoom');
        sphereProgram.uZoomCenter = gl.getUniformLocation(sphereProgram, 'uZoomCenter');
        sphereProgram.uCameraRotX = gl.getUniformLocation(sphereProgram, 'uCameraRotX');
        sphereProgram.uCameraRotY = gl.getUniformLocation(sphereProgram, 'uCameraRotY');

        // Planet A (Oceanic/Mountain) uniforms
        sphereProgram.uNoiseScaleA = gl.getUniformLocation(sphereProgram, 'uNoiseScaleA');
        sphereProgram.uTerrainHeightA = gl.getUniformLocation(sphereProgram, 'uTerrainHeightA');
        sphereProgram.uAtmosIntensityA = gl.getUniformLocation(sphereProgram, 'uAtmosIntensityA');
        sphereProgram.uAtmosThicknessA = gl.getUniformLocation(sphereProgram, 'uAtmosThicknessA');
        sphereProgram.uAtmosPowerA = gl.getUniformLocation(sphereProgram, 'uAtmosPowerA');
        sphereProgram.uScatterRA = gl.getUniformLocation(sphereProgram, 'uScatterRA');
        sphereProgram.uScatterGA = gl.getUniformLocation(sphereProgram, 'uScatterGA');
        sphereProgram.uScatterBA = gl.getUniformLocation(sphereProgram, 'uScatterBA');
        sphereProgram.uScatterScaleA = gl.getUniformLocation(sphereProgram, 'uScatterScaleA');
        sphereProgram.uSunsetStrengthA = gl.getUniformLocation(sphereProgram, 'uSunsetStrengthA');
        sphereProgram.uOceanRoughnessA = gl.getUniformLocation(sphereProgram, 'uOceanRoughnessA');
        sphereProgram.uSSSIntensityA = gl.getUniformLocation(sphereProgram, 'uSSSIntensityA');
        sphereProgram.uSeaLevelA = gl.getUniformLocation(sphereProgram, 'uSeaLevelA');
        sphereProgram.uLandRoughnessA = gl.getUniformLocation(sphereProgram, 'uLandRoughnessA');
        sphereProgram.uNormalStrengthA = gl.getUniformLocation(sphereProgram, 'uNormalStrengthA');

        // Planet B (Lava/Desert) uniforms
        sphereProgram.uNoiseScaleB = gl.getUniformLocation(sphereProgram, 'uNoiseScaleB');
        sphereProgram.uTerrainHeightB = gl.getUniformLocation(sphereProgram, 'uTerrainHeightB');
        sphereProgram.uAtmosIntensityB = gl.getUniformLocation(sphereProgram, 'uAtmosIntensityB');
        sphereProgram.uAtmosThicknessB = gl.getUniformLocation(sphereProgram, 'uAtmosThicknessB');
        sphereProgram.uAtmosPowerB = gl.getUniformLocation(sphereProgram, 'uAtmosPowerB');
        sphereProgram.uScatterRB = gl.getUniformLocation(sphereProgram, 'uScatterRB');
        sphereProgram.uScatterGB = gl.getUniformLocation(sphereProgram, 'uScatterGB');
        sphereProgram.uScatterBB = gl.getUniformLocation(sphereProgram, 'uScatterBB');
        sphereProgram.uScatterScaleB = gl.getUniformLocation(sphereProgram, 'uScatterScaleB');
        sphereProgram.uSunsetStrengthB = gl.getUniformLocation(sphereProgram, 'uSunsetStrengthB');
        sphereProgram.uLavaIntensityB = gl.getUniformLocation(sphereProgram, 'uLavaIntensityB');
        sphereProgram.uSeaLevelB = gl.getUniformLocation(sphereProgram, 'uSeaLevelB');
        sphereProgram.uLandRoughnessB = gl.getUniformLocation(sphereProgram, 'uLandRoughnessB');
        sphereProgram.uNormalStrengthB = gl.getUniformLocation(sphereProgram, 'uNormalStrengthB');

        sphereProgram.buf = gl.createBuffer();

        // Sun program (separate shader for suns with halo effects)
        const sunFs = comp(sunFragmentShader, gl.FRAGMENT_SHADER);
        if (!sunFs) {
            console.error('Sun fragment shader compilation failed');
            return false;
        }

        sunProgram = gl.createProgram();
        gl.attachShader(sunProgram, vs); // Reuse vertex shader
        gl.attachShader(sunProgram, sunFs);
        gl.linkProgram(sunProgram);

        if (!gl.getProgramParameter(sunProgram, gl.LINK_STATUS)) {
            console.error('Sun program link error:', gl.getProgramInfoLog(sunProgram));
            return false;
        }

        // Sun program attributes (same as planet)
        sunProgram.aPos = gl.getAttribLocation(sunProgram, 'aPos');
        sunProgram.aCenter = gl.getAttribLocation(sunProgram, 'aCenter');
        sunProgram.aRadius = gl.getAttribLocation(sunProgram, 'aRadius');
        sunProgram.aColor = gl.getAttribLocation(sunProgram, 'aColor');
        sunProgram.aAlpha = gl.getAttribLocation(sunProgram, 'aAlpha');
        sunProgram.aAppear = gl.getAttribLocation(sunProgram, 'aAppear');
        sunProgram.aGlow = gl.getAttribLocation(sunProgram, 'aGlow');
        sunProgram.aIndex = gl.getAttribLocation(sunProgram, 'aIndex');
        sunProgram.aIsLight = gl.getAttribLocation(sunProgram, 'aIsLight');
        sunProgram.aDepth = gl.getAttribLocation(sunProgram, 'aDepth');
        sunProgram.aZ = gl.getAttribLocation(sunProgram, 'aZ');

        // Sun program uniforms
        sunProgram.uRes = gl.getUniformLocation(sunProgram, 'uRes');
        sunProgram.uTime = gl.getUniformLocation(sunProgram, 'uTime');
        sunProgram.uZoom = gl.getUniformLocation(sunProgram, 'uZoom');
        sunProgram.uZoomCenter = gl.getUniformLocation(sunProgram, 'uZoomCenter');
        sunProgram.uCameraRotX = gl.getUniformLocation(sunProgram, 'uCameraRotX');
        sunProgram.uCameraRotY = gl.getUniformLocation(sunProgram, 'uCameraRotY');

        // Sun halo parameter uniforms
        sunProgram.uSunCoreSize = gl.getUniformLocation(sunProgram, 'uSunCoreSize');
        sunProgram.uSunGlowSize = gl.getUniformLocation(sunProgram, 'uSunGlowSize');
        sunProgram.uSunGlowIntensity = gl.getUniformLocation(sunProgram, 'uSunGlowIntensity');
        sunProgram.uSunCoronaIntensity = gl.getUniformLocation(sunProgram, 'uSunCoronaIntensity');
        sunProgram.uSunRayCount = gl.getUniformLocation(sunProgram, 'uSunRayCount');
        sunProgram.uSunRayIntensity = gl.getUniformLocation(sunProgram, 'uSunRayIntensity');
        sunProgram.uSunRayLength = gl.getUniformLocation(sunProgram, 'uSunRayLength');
        sunProgram.uSunStreamerCount = gl.getUniformLocation(sunProgram, 'uSunStreamerCount');
        sunProgram.uSunStreamerIntensity = gl.getUniformLocation(sunProgram, 'uSunStreamerIntensity');
        sunProgram.uSunStreamerLength = gl.getUniformLocation(sunProgram, 'uSunStreamerLength');
        sunProgram.uSunHaloRing1Dist = gl.getUniformLocation(sunProgram, 'uSunHaloRing1Dist');
        sunProgram.uSunHaloRing1Intensity = gl.getUniformLocation(sunProgram, 'uSunHaloRing1Intensity');
        sunProgram.uSunHaloRing2Dist = gl.getUniformLocation(sunProgram, 'uSunHaloRing2Dist');
        sunProgram.uSunHaloRing2Intensity = gl.getUniformLocation(sunProgram, 'uSunHaloRing2Intensity');
        sunProgram.uSunFlickerSpeed = gl.getUniformLocation(sunProgram, 'uSunFlickerSpeed');
        sunProgram.uSunPulseSpeed = gl.getUniformLocation(sunProgram, 'uSunPulseSpeed');
        sunProgram.uSunChromaticShift = gl.getUniformLocation(sunProgram, 'uSunChromaticShift');

        sunProgram.buf = gl.createBuffer();

        // God rays program
        const grVs = comp(godRaysVertexShader, gl.VERTEX_SHADER);
        const grFs = comp(godRaysFragmentShader, gl.FRAGMENT_SHADER);
        if (grVs && grFs) {
            godRaysProgram = gl.createProgram();
            gl.attachShader(godRaysProgram, grVs);
            gl.attachShader(godRaysProgram, grFs);
            gl.linkProgram(godRaysProgram);

            if (gl.getProgramParameter(godRaysProgram, gl.LINK_STATUS)) {
                godRaysProgram.aPosition = gl.getAttribLocation(godRaysProgram, 'aPosition');
                godRaysProgram.uResolution = gl.getUniformLocation(godRaysProgram, 'uResolution');
                godRaysProgram.uTime = gl.getUniformLocation(godRaysProgram, 'uTime');
                godRaysProgram.uMouse = gl.getUniformLocation(godRaysProgram, 'uMouse');
                godRaysProgram.uLight0 = gl.getUniformLocation(godRaysProgram, 'uLight0');
                godRaysProgram.uLight1 = gl.getUniformLocation(godRaysProgram, 'uLight1');
                godRaysProgram.uLight2 = gl.getUniformLocation(godRaysProgram, 'uLight2');
                godRaysProgram.uLightColor0 = gl.getUniformLocation(godRaysProgram, 'uLightColor0');
                godRaysProgram.uLightColor1 = gl.getUniformLocation(godRaysProgram, 'uLightColor1');
                godRaysProgram.uLightColor2 = gl.getUniformLocation(godRaysProgram, 'uLightColor2');
                godRaysProgram.uZoom = gl.getUniformLocation(godRaysProgram, 'uZoom');
                godRaysProgram.uZoomCenter = gl.getUniformLocation(godRaysProgram, 'uZoomCenter');
                godRaysProgram.uCameraRotX = gl.getUniformLocation(godRaysProgram, 'uCameraRotX');
                godRaysProgram.uCameraRotY = gl.getUniformLocation(godRaysProgram, 'uCameraRotY');
                // Controllable parameters
                godRaysProgram.uRayIntensity = gl.getUniformLocation(godRaysProgram, 'uRayIntensity');
                godRaysProgram.uRayFalloff = gl.getUniformLocation(godRaysProgram, 'uRayFalloff');
                godRaysProgram.uGlowIntensity = gl.getUniformLocation(godRaysProgram, 'uGlowIntensity');
                godRaysProgram.uGlowSize = gl.getUniformLocation(godRaysProgram, 'uGlowSize');
                godRaysProgram.uFogDensity = gl.getUniformLocation(godRaysProgram, 'uFogDensity');
                godRaysProgram.uAmbientFog = gl.getUniformLocation(godRaysProgram, 'uAmbientFog');
                godRaysProgram.uAnimSpeed = gl.getUniformLocation(godRaysProgram, 'uAnimSpeed');
                godRaysProgram.uNoiseScale = gl.getUniformLocation(godRaysProgram, 'uNoiseScale');
                godRaysProgram.uNoiseOctaves = gl.getUniformLocation(godRaysProgram, 'uNoiseOctaves');
                godRaysProgram.uNoiseContrast = gl.getUniformLocation(godRaysProgram, 'uNoiseContrast');

                // Fullscreen quad buffer
                godRaysQuadBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, godRaysQuadBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                    -1, -1,  1, -1,  1, 1,
                    -1, -1,  1, 1,  -1, 1
                ]), gl.STATIC_DRAW);
            } else {
                console.error('God rays program link error:', gl.getProgramInfoLog(godRaysProgram));
                godRaysProgram = null;
            }
        }

        // Debug quad program
        if (debugQuadVertexShader && debugQuadFragmentShader) {
            const dqVs = comp(debugQuadVertexShader, gl.VERTEX_SHADER);
            const dqFs = comp(debugQuadFragmentShader, gl.FRAGMENT_SHADER);
            if (dqVs && dqFs) {
                debugQuadProgram = gl.createProgram();
                gl.attachShader(debugQuadProgram, dqVs);
                gl.attachShader(debugQuadProgram, dqFs);
                gl.linkProgram(debugQuadProgram);

                if (gl.getProgramParameter(debugQuadProgram, gl.LINK_STATUS)) {
                    debugQuadProgram.aPosition = gl.getAttribLocation(debugQuadProgram, 'aPosition');
                    debugQuadProgram.uCenter = gl.getUniformLocation(debugQuadProgram, 'uCenter');
                    debugQuadProgram.uSize = gl.getUniformLocation(debugQuadProgram, 'uSize');
                    debugQuadProgram.uResolution = gl.getUniformLocation(debugQuadProgram, 'uResolution');
                    debugQuadProgram.uZoom = gl.getUniformLocation(debugQuadProgram, 'uZoom');
                    debugQuadProgram.uCameraRotX = gl.getUniformLocation(debugQuadProgram, 'uCameraRotX');
                    debugQuadProgram.uCameraRotY = gl.getUniformLocation(debugQuadProgram, 'uCameraRotY');
                    debugQuadProgram.uWorldZ = gl.getUniformLocation(debugQuadProgram, 'uWorldZ');

                    // Quad buffer (2 triangles)
                    debugQuadBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, debugQuadBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                        -1, -1,  1, -1,  1, 1,
                        -1, -1,  1, 1,  -1, 1
                    ]), gl.STATIC_DRAW);
                    console.log('Debug quad shader loaded');
                } else {
                    console.error('Debug quad program link error:', gl.getProgramInfoLog(debugQuadProgram));
                    debugQuadProgram = null;
                }
            }
        }

        // Space particles program
        const spVs = comp(spaceParticleVertexShader, gl.VERTEX_SHADER);
        const spFs = comp(spaceParticleFragmentShader, gl.FRAGMENT_SHADER);
        if (spVs && spFs) {
            spaceParticleProgram = gl.createProgram();
            gl.attachShader(spaceParticleProgram, spVs);
            gl.attachShader(spaceParticleProgram, spFs);
            gl.linkProgram(spaceParticleProgram);

            if (gl.getProgramParameter(spaceParticleProgram, gl.LINK_STATUS)) {
                spaceParticleProgram.aPosition = gl.getAttribLocation(spaceParticleProgram, 'aPosition');
                spaceParticleProgram.aLife = gl.getAttribLocation(spaceParticleProgram, 'aLife');
                spaceParticleProgram.uResolution = gl.getUniformLocation(spaceParticleProgram, 'uResolution');
                spaceParticleProgram.uZoom = gl.getUniformLocation(spaceParticleProgram, 'uZoom');
                spaceParticleProgram.uZoomCenter = gl.getUniformLocation(spaceParticleProgram, 'uZoomCenter');
                spaceParticleProgram.uTime = gl.getUniformLocation(spaceParticleProgram, 'uTime');

                // DoF uniforms
                spaceParticleProgram.uFocusDistance = gl.getUniformLocation(spaceParticleProgram, 'uFocusDistance');
                spaceParticleProgram.uFocusRange = gl.getUniformLocation(spaceParticleProgram, 'uFocusRange');
                spaceParticleProgram.uNearBlurDist = gl.getUniformLocation(spaceParticleProgram, 'uNearBlurDist');
                spaceParticleProgram.uFarBlurDist = gl.getUniformLocation(spaceParticleProgram, 'uFarBlurDist');
                spaceParticleProgram.uMaxBlurSize = gl.getUniformLocation(spaceParticleProgram, 'uMaxBlurSize');
                spaceParticleProgram.uApertureSize = gl.getUniformLocation(spaceParticleProgram, 'uApertureSize');

                // Particle appearance uniforms
                spaceParticleProgram.uParticleSize = gl.getUniformLocation(spaceParticleProgram, 'uParticleSize');
                spaceParticleProgram.uBrightness = gl.getUniformLocation(spaceParticleProgram, 'uBrightness');
                spaceParticleProgram.uSphereRadius = gl.getUniformLocation(spaceParticleProgram, 'uSphereRadius');

                // Render control uniforms
                spaceParticleProgram.uPlanetZ = gl.getUniformLocation(spaceParticleProgram, 'uPlanetZ');
                spaceParticleProgram.uRenderPass = gl.getUniformLocation(spaceParticleProgram, 'uRenderPass');
                spaceParticleProgram.uCameraRotX = gl.getUniformLocation(spaceParticleProgram, 'uCameraRotX');
                spaceParticleProgram.uCameraRotY = gl.getUniformLocation(spaceParticleProgram, 'uCameraRotY');

                // Fragment shader uniforms
                spaceParticleProgram.uCircleSoftness = gl.getUniformLocation(spaceParticleProgram, 'uCircleSoftness');
                spaceParticleProgram.uBokehRingWidth = gl.getUniformLocation(spaceParticleProgram, 'uBokehRingWidth');
                spaceParticleProgram.uBokehRingIntensity = gl.getUniformLocation(spaceParticleProgram, 'uBokehRingIntensity');
                spaceParticleProgram.uLightFalloff = gl.getUniformLocation(spaceParticleProgram, 'uLightFalloff');

                // Sun light uniforms for particle coloring
                spaceParticleProgram.uLight0 = gl.getUniformLocation(spaceParticleProgram, 'uLight0');
                spaceParticleProgram.uLight1 = gl.getUniformLocation(spaceParticleProgram, 'uLight1');
                spaceParticleProgram.uLight2 = gl.getUniformLocation(spaceParticleProgram, 'uLight2');
                spaceParticleProgram.uLightColor0 = gl.getUniformLocation(spaceParticleProgram, 'uLightColor0');
                spaceParticleProgram.uLightColor1 = gl.getUniformLocation(spaceParticleProgram, 'uLightColor1');
                spaceParticleProgram.uLightColor2 = gl.getUniformLocation(spaceParticleProgram, 'uLightColor2');
                spaceParticleProgram.uLight0Intensity = gl.getUniformLocation(spaceParticleProgram, 'uLight0Intensity');
                spaceParticleProgram.uLight1Intensity = gl.getUniformLocation(spaceParticleProgram, 'uLight1Intensity');
                spaceParticleProgram.uLight2Intensity = gl.getUniformLocation(spaceParticleProgram, 'uLight2Intensity');

                // Shooting star color uniforms
                spaceParticleProgram.uShootingGoldColor = gl.getUniformLocation(spaceParticleProgram, 'uShootingGoldColor');
                spaceParticleProgram.uShootingTealColor = gl.getUniformLocation(spaceParticleProgram, 'uShootingTealColor');

                // Base particle color uniform
                spaceParticleProgram.uBaseParticleColor = gl.getUniformLocation(spaceParticleProgram, 'uBaseParticleColor');

                // Initialize particle data: x, y, z (world space), life
                // Particles fill a larger sphere encompassing all planet positions
                const particleSphereRadius = 0.35; // Much larger to surround all planets
                spaceParticleData = new Float32Array(SPACE_PARTICLE_COUNT * 4);
                for (let i = 0; i < SPACE_PARTICLE_COUNT; i++) {
                    const idx = i * 4;
                    // Random positions in a sphere using rejection sampling
                    let x, y, z;
                    do {
                        x = (Math.random() * 2 - 1);
                        y = (Math.random() * 2 - 1);
                        z = (Math.random() * 2 - 1);
                    } while (x * x + y * y + z * z > 1);
                    // Scale to particle sphere radius (in world units)
                    spaceParticleData[idx] = x * particleSphereRadius;      // x (world units)
                    spaceParticleData[idx + 1] = y * particleSphereRadius;  // y (world units)
                    spaceParticleData[idx + 2] = z * particleSphereRadius;  // z (world units)
                    spaceParticleData[idx + 3] = Math.random();              // life (0-1)
                }

                spaceParticleBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, spaceParticleData, gl.DYNAMIC_DRAW);

                console.log('Space particles initialized: ' + SPACE_PARTICLE_COUNT + ' particles');
            } else {
                console.error('Space particle program link error:', gl.getProgramInfoLog(spaceParticleProgram));
                spaceParticleProgram = null;
            }
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        glReady = true;
        return true;
    }

    function resizeSphereGL() {
        if (!glReady) return;
        glCanvas.width = width * (window.devicePixelRatio || 1);
        glCanvas.height = height * (window.devicePixelRatio || 1);
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    }

    function hex2vec(h) {
        return [parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255];
    }

    function renderSpheresGL(nodes, hovered, connected) {
        if (!glReady) return false;

        gl.clear(gl.COLOR_BUFFER_BIT);

        // Get light data first (needed for both god rays and spheres)
        const lightNodes = nodes.filter(n => n.isLight);
        const light0 = lightNodes[0] || { x: 0, y: 0, lightColor: '#ffaa33' };
        const light1 = lightNodes[1] || { x: 0, y: 0, lightColor: '#9b4dca' };
        const light2 = lightNodes[2] || { x: 0, y: 0, lightColor: '#33ddff' };
        const lc0 = hex2vec(light0.lightColor || '#ffaa33');
        const lc1 = hex2vec(light1.lightColor || '#9b4dca');
        const lc2 = hex2vec(light2.lightColor || '#33ddff');

        // Export light data globally for background nebula shader
        window.globalLights.light0 = { x: light0.x, y: light0.y, color: lc0, intensity: lightParams.light0Intensity };
        window.globalLights.light1 = { x: light1.x, y: light1.y, color: lc1, intensity: lightParams.light1Intensity };
        window.globalLights.light2 = { x: light2.x, y: light2.y, color: lc2, intensity: lightParams.light2Intensity };
        window.globalLights.resolution = { width: width, height: height };

        // Particle simulation (run once per frame, not per render pass)
        // Particles fill larger sphere surrounding all planets
        const particleSphereRadius = 0.35;
        if (spaceParticleProgram && spaceParticleData) {
            const deltaTime = Math.min(time - spaceParticleLastTime, 0.033);
            spaceParticleLastTime = time;

            // Update existing shooting stars
            for (let s = shootingStars.length - 1; s >= 0; s--) {
                const star = shootingStars[s];
                star.progress += deltaTime / shootingStarParams.duration;

                if (star.progress >= 1.0) {
                    // Shooting star finished - reset particle to random position
                    const idx = star.originalIdx * 4;
                    let rx, ry, rz;
                    do {
                        rx = (Math.random() * 2 - 1);
                        ry = (Math.random() * 2 - 1);
                        rz = (Math.random() * 2 - 1);
                    } while (rx * rx + ry * ry + rz * rz > 1);
                    spaceParticleData[idx] = rx * particleSphereRadius;
                    spaceParticleData[idx + 1] = ry * particleSphereRadius;
                    spaceParticleData[idx + 2] = rz * particleSphereRadius;
                    spaceParticleData[idx + 3] = Math.random(); // Reset to normal particle
                    shootingStars.splice(s, 1);
                    continue;
                }

                // Move shooting star fast in its direction
                const idx = star.originalIdx * 4;
                const speed = shootingStarParams.speed * deltaTime * (1.0 - star.progress * 0.5); // Slow down as it fades
                spaceParticleData[idx] += star.vx * speed;
                spaceParticleData[idx + 1] += star.vy * speed;
                spaceParticleData[idx + 2] += star.vz * speed;

                // Encode type (1 or 2) + progress as the life value
                // type.progress format (e.g., 1.35 = gold at 35% progress)
                spaceParticleData[idx + 3] = star.type + star.progress;
            }

            // Randomly spawn new shooting stars (very rare)
            if (Math.random() < shootingStarParams.chance && shootingStars.length < shootingStarParams.maxActive) {
                // Pick a random particle that's not already a shooting star
                const candidateIdx = Math.floor(Math.random() * SPACE_PARTICLE_COUNT);
                const isAlreadyShooting = shootingStars.some(s => s.originalIdx === candidateIdx);

                if (!isAlreadyShooting) {
                    // Random chaotic direction
                    const angle1 = Math.random() * Math.PI * 2;
                    const angle2 = (Math.random() - 0.5) * Math.PI;
                    const vx = Math.cos(angle1) * Math.cos(angle2);
                    const vy = Math.sin(angle2);
                    const vz = Math.sin(angle1) * Math.cos(angle2);

                    shootingStars.push({
                        originalIdx: candidateIdx,
                        type: Math.random() < 0.5 ? 1 : 2, // 1 = gold, 2 = teal
                        progress: 0,
                        vx: vx,
                        vy: vy,
                        vz: vz
                    });
                }
            }

            for (let i = 0; i < SPACE_PARTICLE_COUNT; i++) {
                // Skip particles that are shooting stars (they're handled above)
                const isShooting = shootingStars.some(s => s.originalIdx === i);
                if (isShooting) continue;

                const idx = i * 4;
                let x = spaceParticleData[idx];
                let y = spaceParticleData[idx + 1];
                let z = spaceParticleData[idx + 2];
                let life = spaceParticleData[idx + 3];

                // Ensure normal particles have life < 1 (fractional only)
                if (life >= 1.0) life = life % 1.0;

                // Distance from origin for depth-based effects
                const dist = Math.sqrt(x * x + y * y + z * z);
                const distNorm = dist / particleSphereRadius; // 0 = center, 1 = edge

                // Speed based on distance from center (edge particles orbit slower)
                const speedFactor = 0.3 + (1 - distNorm) * 0.7;

                // Orbital drift around origin (creates swirling effect)
                const phase = i * 0.1;
                // Tangential velocity (orbit around Y axis primarily)
                const orbitSpeed = 0.0002 * speedFactor;
                const tangentX = -z * orbitSpeed;
                const tangentZ = x * orbitSpeed;
                // Add some turbulence
                const turbX = Math.sin(time * 0.3 + phase + y * 10) * 0.00005;
                const turbY = Math.cos(time * 0.25 + phase + x * 10) * 0.00004;
                const turbZ = Math.sin(time * 0.2 + phase + z * 10) * 0.00005;

                // Apply movement
                x += (tangentX + turbX) * 60 * deltaTime;
                y += turbY * 60 * deltaTime;
                z += (tangentZ + turbZ) * 60 * deltaTime;

                // Keep particles inside sphere (soft boundary)
                const newDist = Math.sqrt(x * x + y * y + z * z);
                if (newDist > particleSphereRadius) {
                    const scale = particleSphereRadius / newDist;
                    x *= scale * 0.99; // Slight inward push
                    y *= scale * 0.99;
                    z *= scale * 0.99;
                }

                spaceParticleData[idx] = x;
                spaceParticleData[idx + 1] = y;
                spaceParticleData[idx + 2] = z;

                // Cycle life for twinkling (keep in 0-1 range for normal particles)
                life = (life + deltaTime * 0.1) % 1.0;
                spaceParticleData[idx + 3] = life;
            }

            // Upload updated particle data
            gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, spaceParticleData);
        }

        // Helper function to render particles with a specific pass
        // pass: 0 = all, 1 = far only (z < planetZ), 2 = near only (z >= planetZ)
        function renderParticles(pass) {
            if (!spaceParticleProgram || !spaceParticleData) return;

            gl.useProgram(spaceParticleProgram);
            gl.uniform2f(spaceParticleProgram.uResolution, width, height);
            gl.uniform1f(spaceParticleProgram.uZoom, zoomLevel);
            gl.uniform2f(spaceParticleProgram.uZoomCenter, zoomCenterX, zoomCenterY);
            gl.uniform1f(spaceParticleProgram.uTime, time);

            // DoF uniforms
            gl.uniform1f(spaceParticleProgram.uFocusDistance, spaceParticleParams.focusDistance);
            gl.uniform1f(spaceParticleProgram.uFocusRange, spaceParticleParams.focusRange);
            gl.uniform1f(spaceParticleProgram.uNearBlurDist, spaceParticleParams.nearBlurDist);
            gl.uniform1f(spaceParticleProgram.uFarBlurDist, spaceParticleParams.farBlurDist);
            gl.uniform1f(spaceParticleProgram.uMaxBlurSize, spaceParticleParams.maxBlurSize);
            gl.uniform1f(spaceParticleProgram.uApertureSize, spaceParticleParams.apertureSize);

            // Particle appearance uniforms
            gl.uniform1f(spaceParticleProgram.uParticleSize, spaceParticleParams.particleSize);
            gl.uniform1f(spaceParticleProgram.uBrightness, spaceParticleParams.brightness);
            gl.uniform1f(spaceParticleProgram.uSphereRadius, spaceParticleParams.sphereRadius);

            // Render control uniforms
            gl.uniform1f(spaceParticleProgram.uPlanetZ, spaceParticleParams.planetZ);
            gl.uniform1f(spaceParticleProgram.uRenderPass, pass);
            gl.uniform1f(spaceParticleProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(spaceParticleProgram.uCameraRotY, cameraRotY);

            // Fragment shader uniforms
            gl.uniform1f(spaceParticleProgram.uCircleSoftness, spaceParticleParams.circleSoftness);
            gl.uniform1f(spaceParticleProgram.uBokehRingWidth, spaceParticleParams.bokehRingWidth);
            gl.uniform1f(spaceParticleProgram.uBokehRingIntensity, spaceParticleParams.bokehRingIntensity);
            gl.uniform1f(spaceParticleProgram.uLightFalloff, spaceParticleParams.lightFalloff);

            // Sun light uniforms for particle coloring
            gl.uniform2f(spaceParticleProgram.uLight0, light0.x, light0.y);
            gl.uniform2f(spaceParticleProgram.uLight1, light1.x, light1.y);
            gl.uniform2f(spaceParticleProgram.uLight2, light2.x, light2.y);
            gl.uniform3f(spaceParticleProgram.uLightColor0, lc0.r, lc0.g, lc0.b);
            gl.uniform3f(spaceParticleProgram.uLightColor1, lc1.r, lc1.g, lc1.b);
            gl.uniform3f(spaceParticleProgram.uLightColor2, lc2.r, lc2.g, lc2.b);
            gl.uniform1f(spaceParticleProgram.uLight0Intensity, lightParams.light0Intensity);
            gl.uniform1f(spaceParticleProgram.uLight1Intensity, lightParams.light1Intensity);
            gl.uniform1f(spaceParticleProgram.uLight2Intensity, lightParams.light2Intensity);

            // Shooting star colors
            const goldRGB = hex2vec(shootingStarParams.goldColor);
            const tealRGB = hex2vec(shootingStarParams.tealColor);
            gl.uniform3f(spaceParticleProgram.uShootingGoldColor, goldRGB[0], goldRGB[1], goldRGB[2]);
            gl.uniform3f(spaceParticleProgram.uShootingTealColor, tealRGB[0], tealRGB[1], tealRGB[2]);

            // Base particle color
            const baseRGB = hex2vec(spaceParticleParams.baseColor);
            gl.uniform3f(spaceParticleProgram.uBaseParticleColor, baseRGB[0], baseRGB[1], baseRGB[2]);

            // Use additive blending for glowing particles
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
            gl.enableVertexAttribArray(spaceParticleProgram.aPosition);
            gl.vertexAttribPointer(spaceParticleProgram.aPosition, 3, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(spaceParticleProgram.aLife);
            gl.vertexAttribPointer(spaceParticleProgram.aLife, 1, gl.FLOAT, false, 16, 12);

            gl.drawArrays(gl.POINTS, 0, SPACE_PARTICLE_COUNT);

            gl.disableVertexAttribArray(spaceParticleProgram.aPosition);
            gl.disableVertexAttribArray(spaceParticleProgram.aLife);

            // Restore normal blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        // PASS 1: Render FAR particles (behind planets, z < planetZ)
        renderParticles(1);

        // Compute light screen positions (after camera transform) for god rays
        // Same math as vertex shader for sphere program
        const computeLightScreenPos = (lx, ly, lz) => {
            const od = 1.0;
            const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
            const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
            const cpx = od * sry * crx, cpy = od * srx, cpz = od * cry * crx;
            const cfLen = Math.sqrt(cpx*cpx + cpy*cpy + cpz*cpz);
            const fx = -cpx/cfLen, fy = -cpy/cfLen, fz = -cpz/cfLen;
            const rxLen = Math.sqrt(fz*fz + fx*fx) || 1;
            const rx = fz/rxLen, rz = -fx/rxLen;
            const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
            const ws = 1.0 / width;
            const scx = width * 0.5;
            const scy = height * 0.5;
            const wx = (lx - scx) * ws, wy = -(ly - scy) * ws, wz = lz || 0;
            const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
            const zd = tx * fx + ty * fy + tz * fz;
            if (zd < 0.01) return { x: scx, y: scy };
            const ps = od / zd;
            const px = (tx * rx + tz * rz) * ps;
            const py = (tx * ux + ty * uy + tz * uz) * ps;
            return { x: scx + px * width * zoomLevel, y: scy - py * width * zoomLevel };
        };
        const godRayLight0 = computeLightScreenPos(light0.x, light0.y, light0.z);
        const godRayLight1 = computeLightScreenPos(light1.x, light1.y, light1.z);
        const godRayLight2 = computeLightScreenPos(light2.x, light2.y, light2.z);

        // Render god rays (background layer, after particles)
        if (godRaysProgram) {
            gl.useProgram(godRaysProgram);
            gl.uniform2f(godRaysProgram.uResolution, width, height);
            gl.uniform1f(godRaysProgram.uTime, time);
            gl.uniform2f(godRaysProgram.uMouse, mouseScreenX, mouseScreenY);
            gl.uniform2f(godRaysProgram.uLight0, godRayLight0.x, godRayLight0.y);
            gl.uniform2f(godRaysProgram.uLight1, godRayLight1.x, godRayLight1.y);
            gl.uniform2f(godRaysProgram.uLight2, godRayLight2.x, godRayLight2.y);
            gl.uniform3f(godRaysProgram.uLightColor0, lc0[0], lc0[1], lc0[2]);
            gl.uniform3f(godRaysProgram.uLightColor1, lc1[0], lc1[1], lc1[2]);
            gl.uniform3f(godRaysProgram.uLightColor2, lc2[0], lc2[1], lc2[2]);
            gl.uniform1f(godRaysProgram.uZoom, zoomLevel);
            gl.uniform2f(godRaysProgram.uZoomCenter, zoomCenterX, zoomCenterY);
            gl.uniform1f(godRaysProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(godRaysProgram.uCameraRotY, cameraRotY);
            // Controllable parameters
            gl.uniform1f(godRaysProgram.uRayIntensity, godRaysParams.rayIntensity);
            gl.uniform1f(godRaysProgram.uRayFalloff, godRaysParams.rayFalloff);
            gl.uniform1f(godRaysProgram.uGlowIntensity, godRaysParams.glowIntensity);
            gl.uniform1f(godRaysProgram.uGlowSize, godRaysParams.glowSize);
            gl.uniform1f(godRaysProgram.uFogDensity, godRaysParams.fogDensity);
            gl.uniform1f(godRaysProgram.uAmbientFog, godRaysParams.ambientFog);
            gl.uniform1f(godRaysProgram.uAnimSpeed, godRaysParams.animSpeed);
            gl.uniform1f(godRaysProgram.uNoiseScale, godRaysParams.noiseScale);
            gl.uniform1f(godRaysProgram.uNoiseOctaves, godRaysParams.noiseOctaves);
            gl.uniform1f(godRaysProgram.uNoiseContrast, godRaysParams.noiseContrast);

            gl.bindBuffer(gl.ARRAY_BUFFER, godRaysQuadBuffer);
            gl.enableVertexAttribArray(godRaysProgram.aPosition);
            gl.vertexAttribPointer(godRaysProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(godRaysProgram.aPosition);
        }

        // Render spheres on top
        gl.useProgram(sphereProgram);
        gl.uniform2f(sphereProgram.uRes, width, height);
        gl.uniform2f(sphereProgram.uMouse, mouseScreenX, mouseScreenY);
        gl.uniform1f(sphereProgram.uTime, time);
        gl.uniform2f(sphereProgram.uLight0, light0.x, light0.y);
        gl.uniform2f(sphereProgram.uLight1, light1.x, light1.y);
        gl.uniform2f(sphereProgram.uLight2, light2.x, light2.y);
        gl.uniform3f(sphereProgram.uLightColor0, lc0[0], lc0[1], lc0[2]);
        gl.uniform3f(sphereProgram.uLightColor1, lc1[0], lc1[1], lc1[2]);
        gl.uniform3f(sphereProgram.uLightColor2, lc2[0], lc2[1], lc2[2]);
        gl.uniform1f(sphereProgram.uLight0Intensity, lightParams.light0Intensity);
        gl.uniform1f(sphereProgram.uLight1Intensity, lightParams.light1Intensity);
        gl.uniform1f(sphereProgram.uLight2Intensity, lightParams.light2Intensity);
        gl.uniform1f(sphereProgram.uLight0Atten, lightParams.light0Attenuation);
        gl.uniform1f(sphereProgram.uLight1Atten, lightParams.light1Attenuation);
        gl.uniform1f(sphereProgram.uLight2Atten, lightParams.light2Attenuation);
        gl.uniform1f(sphereProgram.uLight0Z, light0.z || 0);
        gl.uniform1f(sphereProgram.uLight1Z, light1.z || 0);
        gl.uniform1f(sphereProgram.uLight2Z, light2.z || 0);
        // Compute and pass world-space light positions
        const ws = 1.0 / width;
        const scx = width * 0.5;
        const scy = height * 0.5;
        gl.uniform3f(sphereProgram.uLight0WorldPos, (light0.x - scx) * ws, -(light0.y - scy) * ws, light0.z || 0);
        gl.uniform3f(sphereProgram.uLight1WorldPos, (light1.x - scx) * ws, -(light1.y - scy) * ws, light1.z || 0);
        gl.uniform3f(sphereProgram.uLight2WorldPos, (light2.x - scx) * ws, -(light2.y - scy) * ws, light2.z || 0);

        // Compute light screen positions (after camera transform) - same math as vertex shader
        {
            const od = 1.0;
            const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
            const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
            const cpx = od * sry * crx, cpy = od * srx, cpz = od * cry * crx;
            const cfLen = Math.sqrt(cpx*cpx + cpy*cpy + cpz*cpz);
            const fx = -cpx/cfLen, fy = -cpy/cfLen, fz = -cpz/cfLen;
            const rxLen = Math.sqrt(fz*fz + fx*fx) || 1;
            const rx = fz/rxLen, rz = -fx/rxLen;
            const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;

            const proj = (lx, ly, lz) => {
                const wx = (lx - scx) * ws, wy = -(ly - scy) * ws, wz = lz || 0;
                const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
                const zd = tx * fx + ty * fy + tz * fz;
                if (zd < 0.01) return { x: scx, y: scy };
                const ps = od / zd;
                const px = (tx * rx + tz * rz) * ps;
                const py = (tx * ux + ty * uy + tz * uz) * ps;
                return { x: scx + px * width * zoomLevel, y: scy - py * width * zoomLevel };
            };
            const l0s = proj(light0.x, light0.y, light0.z);
            const l1s = proj(light1.x, light1.y, light1.z);
            const l2s = proj(light2.x, light2.y, light2.z);
            gl.uniform2f(sphereProgram.uLight0ScreenPos, l0s.x, l0s.y);
            gl.uniform2f(sphereProgram.uLight1ScreenPos, l1s.x, l1s.y);
            gl.uniform2f(sphereProgram.uLight2ScreenPos, l2s.x, l2s.y);
        }
        gl.uniform1f(sphereProgram.uMouseLightEnabled, mouseLightEnabled ? 1.0 : 0.0);
        gl.uniform1f(sphereProgram.uAmbientIntensity, lightParams.ambientIntensity);
        gl.uniform1f(sphereProgram.uFogIntensity, lightParams.fogIntensity);
        gl.uniform1f(sphereProgram.uZoom, zoomLevel);
        gl.uniform2f(sphereProgram.uZoomCenter, zoomCenterX, zoomCenterY);
        gl.uniform1f(sphereProgram.uCameraRotX, cameraRotX);
        gl.uniform1f(sphereProgram.uCameraRotY, cameraRotY);

        // Planet A (Oceanic/Mountain) uniforms
        gl.uniform1f(sphereProgram.uNoiseScaleA, planetParamsA.noiseScale);
        gl.uniform1f(sphereProgram.uTerrainHeightA, planetParamsA.terrainHeight);
        gl.uniform1f(sphereProgram.uAtmosIntensityA, planetParamsA.atmosIntensity);
        gl.uniform1f(sphereProgram.uAtmosThicknessA, planetParamsA.atmosThickness);
        gl.uniform1f(sphereProgram.uAtmosPowerA, planetParamsA.atmosPower);
        // Convert scatter color hex to RGB beta values
        const scatterA = hex2vec(planetParamsA.scatterColor);
        gl.uniform1f(sphereProgram.uScatterRA, scatterA[0]);
        gl.uniform1f(sphereProgram.uScatterGA, scatterA[1]);
        gl.uniform1f(sphereProgram.uScatterBA, scatterA[2]);
        gl.uniform1f(sphereProgram.uScatterScaleA, planetParamsA.scatterScale);
        gl.uniform1f(sphereProgram.uSunsetStrengthA, planetParamsA.sunsetStrength);
        gl.uniform1f(sphereProgram.uOceanRoughnessA, planetParamsA.oceanRoughness);
        gl.uniform1f(sphereProgram.uSSSIntensityA, planetParamsA.sssIntensity);
        gl.uniform1f(sphereProgram.uSeaLevelA, planetParamsA.seaLevel);
        gl.uniform1f(sphereProgram.uLandRoughnessA, planetParamsA.landRoughness);
        gl.uniform1f(sphereProgram.uNormalStrengthA, planetParamsA.normalStrength);

        // Planet B (Lava/Desert) uniforms
        gl.uniform1f(sphereProgram.uNoiseScaleB, planetParamsB.noiseScale);
        gl.uniform1f(sphereProgram.uTerrainHeightB, planetParamsB.terrainHeight);
        gl.uniform1f(sphereProgram.uAtmosIntensityB, planetParamsB.atmosIntensity);
        gl.uniform1f(sphereProgram.uAtmosThicknessB, planetParamsB.atmosThickness);
        gl.uniform1f(sphereProgram.uAtmosPowerB, planetParamsB.atmosPower);
        // Convert scatter color hex to RGB beta values
        const scatterB = hex2vec(planetParamsB.scatterColor);
        gl.uniform1f(sphereProgram.uScatterRB, scatterB[0]);
        gl.uniform1f(sphereProgram.uScatterGB, scatterB[1]);
        gl.uniform1f(sphereProgram.uScatterBB, scatterB[2]);
        gl.uniform1f(sphereProgram.uScatterScaleB, planetParamsB.scatterScale);
        gl.uniform1f(sphereProgram.uSunsetStrengthB, planetParamsB.sunsetStrength);
        gl.uniform1f(sphereProgram.uLavaIntensityB, planetParamsB.lavaIntensity);
        gl.uniform1f(sphereProgram.uSeaLevelB, planetParamsB.seaLevel);
        gl.uniform1f(sphereProgram.uLandRoughnessB, planetParamsB.landRoughness);
        gl.uniform1f(sphereProgram.uNormalStrengthB, planetParamsB.normalStrength);

        const q = [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];

        // Helper to build vertex data for a node
        function buildNodeVertices(n, idx) {
            const fadeAmount = n.shrinkProgress !== undefined ? n.shrinkProgress : 1;
            const minAlpha = 0.3;
            const alphaMultiplier = minAlpha + fadeAmount * (1 - minAlpha);

            let c;
            if (n.isLight && n.lightColor) c = hex2vec(n.lightColor);
            else if (n.color) c = hex2vec(n.color);
            else if (n.category === 'primary') c = hex2vec(colors.gold);
            else if (n.category === 'secondary') c = hex2vec(colors.teal);
            else c = hex2vec(colors.textMuted);

            const g = n.glowIntensity || 0;
            const p = Math.sin(time * n.pulseSpeed + n.pulsePhase);
            const r = n.size + p * 0.5 + g * 3;
            const ap = globalFadeIn * alphaMultiplier;
            const a = alphaMultiplier * globalFadeIn;
            const isLight = n.isLight ? 1.0 : 0.0;
            // Depth for visual layering (separate from 3D position)
            const depth = n.depth !== undefined ? n.depth : 0.0;
            // World Z position (for 3D sphere distribution)
            const worldZ = n.z !== undefined ? n.z : 0.0;

            const verts = [];
            q.forEach(([qx,qy]) => {
                // 15 floats per vertex: aPos(2), aCenter(2), aRadius(1), aColor(3), aAlpha(1), aAppear(1), aGlow(1), aIndex(1), aIsLight(1), aDepth(1), aZ(1)
                // Pass world positions (n.x, n.y, n.z) - shader applies perspective
                verts.push(qx, qy, n.x, n.y, r, c[0], c[1], c[2], a, ap, g, idx, isLight, depth, worldZ);
            });
            return verts;
        }

        // Separate planets and suns
        const planetNodes = nodes.filter(n => !n.isLight);
        const sunNodes = nodes.filter(n => n.isLight);

        // Sort nodes by distance from camera (back to front for proper alpha blending)
        // Compute camera position and forward direction (same as vertex shader)
        const orbitDist = 1.0;
        const cosRotX = Math.cos(cameraRotX);
        const sinRotX = Math.sin(cameraRotX);
        const cosRotY = Math.cos(cameraRotY);
        const sinRotY = Math.sin(cameraRotY);

        const camX = orbitDist * sinRotY * cosRotX;
        const camY = orbitDist * sinRotX;
        const camZ = orbitDist * cosRotY * cosRotX;

        // Camera forward = -cameraPos normalized (looking at origin)
        const camLen = Math.sqrt(camX * camX + camY * camY + camZ * camZ);
        const fwdX = -camX / camLen;
        const fwdY = -camY / camLen;
        const fwdZ = -camZ / camLen;

        // World scale (same as vertex shader)
        const worldScale = 1.0 / width;
        const screenCenterX = width * 0.5;
        const screenCenterY = height * 0.5;

        // Function to compute camera distance for a node
        function getCameraDistance(n) {
            // Convert screen position to world position (now with 3D Z position)
            const worldX = (n.x - screenCenterX) * worldScale;
            const worldY = -(n.y - screenCenterY) * worldScale;
            const worldZ = (n.z !== undefined && !isNaN(n.z)) ? n.z : 0.0;

            // Vector from camera to node
            const toNodeX = worldX - camX;
            const toNodeY = worldY - camY;
            const toNodeZ = worldZ - camZ;

            // Distance along camera forward (z-depth in view space)
            const dist = toNodeX * fwdX + toNodeY * fwdY + toNodeZ * fwdZ;
            return isNaN(dist) ? 0 : dist;
        }

        // Combine all nodes and sort by camera distance (back to front)
        const allNodes = [...planetNodes, ...sunNodes];
        allNodes.forEach(n => { n.cameraDistance = getCameraDistance(n); });
        // Sort back to front: larger distance (further) renders first
        allNodes.sort((a, b) => b.cameraDistance - a.cameraDistance);

        const st = 15 * 4; // 15 floats per vertex (added aZ for 3D position)

        // Helper to set up vertex attributes for a program
        function setupVertexAttribs(program) {
            gl.enableVertexAttribArray(program.aPos);
            gl.vertexAttribPointer(program.aPos, 2, gl.FLOAT, false, st, 0);
            gl.enableVertexAttribArray(program.aCenter);
            gl.vertexAttribPointer(program.aCenter, 2, gl.FLOAT, false, st, 8);
            gl.enableVertexAttribArray(program.aRadius);
            gl.vertexAttribPointer(program.aRadius, 1, gl.FLOAT, false, st, 16);
            gl.enableVertexAttribArray(program.aColor);
            gl.vertexAttribPointer(program.aColor, 3, gl.FLOAT, false, st, 20);
            gl.enableVertexAttribArray(program.aAlpha);
            gl.vertexAttribPointer(program.aAlpha, 1, gl.FLOAT, false, st, 32);
            gl.enableVertexAttribArray(program.aAppear);
            gl.vertexAttribPointer(program.aAppear, 1, gl.FLOAT, false, st, 36);
            gl.enableVertexAttribArray(program.aGlow);
            gl.vertexAttribPointer(program.aGlow, 1, gl.FLOAT, false, st, 40);
            gl.enableVertexAttribArray(program.aIndex);
            gl.vertexAttribPointer(program.aIndex, 1, gl.FLOAT, false, st, 44);
            gl.enableVertexAttribArray(program.aIsLight);
            gl.vertexAttribPointer(program.aIsLight, 1, gl.FLOAT, false, st, 48);
            gl.enableVertexAttribArray(program.aDepth);
            gl.vertexAttribPointer(program.aDepth, 1, gl.FLOAT, false, st, 52);
            gl.enableVertexAttribArray(program.aZ);
            gl.vertexAttribPointer(program.aZ, 1, gl.FLOAT, false, st, 56);
        }

        // Track current shader type and blend mode to minimize state changes
        let currentIsSun = null;
        let currentBlendAdditive = null;

        // Render all nodes in depth order, switching shaders and blend modes as needed
        for (const n of allNodes) {
            const isSun = n.isLight;
            const nodeIdx = nodes.indexOf(n);
            const verts = buildNodeVertices(n, nodeIdx);
            const vertData = new Float32Array(verts);

            if (isSun) {
                // Suns use additive blending for nice glow stacking
                if (currentBlendAdditive !== true) {
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                    currentBlendAdditive = true;
                }

                // Switch to sun shader if not already
                if (currentIsSun !== true) {
                    gl.useProgram(sunProgram);
                    gl.uniform2f(sunProgram.uRes, width, height);
                    gl.uniform1f(sunProgram.uTime, time);
                    gl.uniform1f(sunProgram.uZoom, zoomLevel);
                    gl.uniform2f(sunProgram.uZoomCenter, zoomCenterX, zoomCenterY);
                    gl.uniform1f(sunProgram.uCameraRotX, cameraRotX);
                    gl.uniform1f(sunProgram.uCameraRotY, cameraRotY);

                    // Sun halo uniforms
                    gl.uniform1f(sunProgram.uSunCoreSize, sunParams.coreSize);
                    gl.uniform1f(sunProgram.uSunGlowSize, sunParams.glowSize);
                    gl.uniform1f(sunProgram.uSunGlowIntensity, sunParams.glowIntensity);
                    gl.uniform1f(sunProgram.uSunCoronaIntensity, sunParams.coronaIntensity);
                    gl.uniform1f(sunProgram.uSunRayCount, sunParams.rayCount);
                    gl.uniform1f(sunProgram.uSunRayIntensity, sunParams.rayIntensity);
                    gl.uniform1f(sunProgram.uSunRayLength, sunParams.rayLength);
                    gl.uniform1f(sunProgram.uSunStreamerCount, sunParams.streamerCount);
                    gl.uniform1f(sunProgram.uSunStreamerIntensity, sunParams.streamerIntensity);
                    gl.uniform1f(sunProgram.uSunStreamerLength, sunParams.streamerLength);
                    gl.uniform1f(sunProgram.uSunHaloRing1Dist, sunParams.haloRing1Dist);
                    gl.uniform1f(sunProgram.uSunHaloRing1Intensity, sunParams.haloRing1Intensity);
                    gl.uniform1f(sunProgram.uSunHaloRing2Dist, sunParams.haloRing2Dist);
                    gl.uniform1f(sunProgram.uSunHaloRing2Intensity, sunParams.haloRing2Intensity);
                    gl.uniform1f(sunProgram.uSunFlickerSpeed, sunParams.flickerSpeed);
                    gl.uniform1f(sunProgram.uSunPulseSpeed, sunParams.pulseSpeed);
                    gl.uniform1f(sunProgram.uSunChromaticShift, sunParams.chromaticShift);

                    currentIsSun = true;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, sunProgram.buf);
                gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
                setupVertexAttribs(sunProgram);
                gl.drawArrays(gl.TRIANGLES, 0, verts.length / 15);
            } else {
                // Planets use premultiplied alpha blending
                // This allows the opaque core to occlude while edges blend nicely
                if (currentBlendAdditive !== false) {
                    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                    currentBlendAdditive = false;
                }

                // Switch to planet shader if not already
                if (currentIsSun !== false) {
                    gl.useProgram(sphereProgram);
                    // Planet uniforms already set above
                    currentIsSun = false;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, sphereProgram.buf);
                gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
                setupVertexAttribs(sphereProgram);
                gl.drawArrays(gl.TRIANGLES, 0, verts.length / 15);
            }
        }

        // Restore normal alpha blending after rendering all nodes
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Render debug quads if enabled
        if (showDebugQuads && debugQuadProgram) {
            gl.useProgram(debugQuadProgram);
            gl.uniform2f(debugQuadProgram.uResolution, width, height);
            gl.uniform1f(debugQuadProgram.uZoom, zoomLevel);
            gl.uniform1f(debugQuadProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(debugQuadProgram.uCameraRotY, cameraRotY);

            gl.bindBuffer(gl.ARRAY_BUFFER, debugQuadBuffer);
            gl.enableVertexAttribArray(debugQuadProgram.aPosition);
            gl.vertexAttribPointer(debugQuadProgram.aPosition, 2, gl.FLOAT, false, 0, 0);

            for (const n of nodes) {
                gl.uniform2f(debugQuadProgram.uCenter, n.x, n.y);
                gl.uniform1f(debugQuadProgram.uSize, n.size);
                gl.uniform1f(debugQuadProgram.uWorldZ, n.z || 0.0);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            gl.disableVertexAttribArray(debugQuadProgram.aPosition);
        }

        // PASS 2: Render NEAR particles (in front of planets, z >= planetZ)
        renderParticles(2);

        return true;
    }

    function drawLitSphere(x, y, radius, baseColor, alpha, appearProgress, glow) {
        if (appearProgress < 0.01) return;
        const r = radius * appearProgress;
        if (r < 1) return;

        const cr = parseInt(baseColor.slice(1,3), 16);
        const cg = parseInt(baseColor.slice(3,5), 16);
        const cb = parseInt(baseColor.slice(5,7), 16);

        const lx = (mouseX - x) / (width || 1);
        const ly = (mouseY - y) / (height || 1);
        const ld = Math.sqrt(lx*lx + ly*ly) || 1;
        const hx = x - (lx/ld) * r * 0.35;
        const hy = y - (ly/ld) * r * 0.35;

        const grad = ctx.createRadialGradient(hx, hy, 0, x, y, r);
        grad.addColorStop(0, `rgba(${Math.min(255,cr+70)},${Math.min(255,cg+70)},${Math.min(255,cb+70)},${alpha})`);
        grad.addColorStop(0.35, `rgba(${cr},${cg},${cb},${alpha})`);
        grad.addColorStop(0.8, `rgba(${cr*0.55|0},${cg*0.55|0},${cb*0.55|0},${alpha})`);
        grad.addColorStop(1, `rgba(${cr*0.25|0},${cg*0.25|0},${cb*0.25|0},${alpha*0.85})`);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        const sg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r*0.28);
        sg.addColorStop(0, `rgba(255,255,255,${alpha*0.75})`);
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(hx, hy, r*0.28, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${alpha*0.18 + (glow||0)*0.35})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function resize() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        centerX = width / 2;
        centerY = height / 2;
        // Initialize zoom center to canvas center
        if (zoomCenterX === 0 && zoomCenterY === 0) {
            zoomCenterX = centerX;
            zoomCenterY = centerY;
            targetZoomCenterX = centerX;
            targetZoomCenterY = centerY;
        }
        settled = false;
        settleTimer = 0;

        const minDim = Math.min(width, height);
        sizeScale = Math.max(0.5, Math.min(1.2, minDim / BASE_DIMENSION));

        // Initialize node sizes and velocities
        nodes.forEach((node, i) => {
            node.size = node.baseSize * sizeScale;
            node.vx = (Math.random() - 0.5) * 0.5;
            node.vy = (Math.random() - 0.5) * 0.5;
            node.vz = (Math.random() - 0.5) * 0.0001; // Small Z velocity
            node.x = 0;
            node.y = 0;
            node.z = 0;
            node.placed = false;
        });

        // Sphere radius in world units (camera orbits at distance 1.0)
        // Smaller radius = tighter cluster, better for 3D perspective viewing
        const sphereRadius = 0.15; // World units - compact cluster for better 3D visibility

        // Place suns first, spread around in 3D sphere
        const suns = nodes.filter(n => n.isLight);
        suns.forEach((sun, i) => {
            // Distribute suns evenly around sphere using golden spiral
            const phi = Math.acos(1 - 2 * (i + 0.5) / suns.length);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i + Math.random() * 0.3;
            const r = sphereRadius * (0.7 + Math.random() * 0.3); // Vary radius slightly

            // Convert spherical to Cartesian (in world units)
            const worldX = r * Math.sin(phi) * Math.cos(theta);
            const worldY = r * Math.sin(phi) * Math.sin(theta);
            const worldZ = r * Math.cos(phi);

            // Convert world X/Y to screen coordinates
            sun.x = centerX + worldX * width;
            sun.y = centerY - worldY * width; // Flip Y for screen coords
            sun.z = worldZ; // Z stays in world units
            sun.placed = true;
        });

        // Place other nodes near their connected suns in 3D
        const maxIterations = 10;
        for (let iter = 0; iter < maxIterations; iter++) {
            nodes.forEach(node => {
                if (node.placed) return;

                // Find placed connected nodes
                const connectedIds = connectionMap.get(node.id);
                if (!connectedIds) return;

                const placedConnections = nodes.filter(n => n.placed && connectedIds.has(n.id));
                if (placedConnections.length === 0) return;

                // Average position of connected nodes (in world coords)
                let avgWorldX = 0, avgWorldY = 0, avgWorldZ = 0;
                placedConnections.forEach(n => {
                    avgWorldX += (n.x - centerX) / width;
                    avgWorldY += -(n.y - centerY) / width;
                    avgWorldZ += n.z;
                });
                avgWorldX /= placedConnections.length;
                avgWorldY /= placedConnections.length;
                avgWorldZ /= placedConnections.length;

                // Direction away from origin (outward)
                const dist = Math.sqrt(avgWorldX * avgWorldX + avgWorldY * avgWorldY + avgWorldZ * avgWorldZ) || 0.01;
                const outX = avgWorldX / dist;
                const outY = avgWorldY / dist;
                const outZ = avgWorldZ / dist;

                // Random direction on sphere
                const randPhi = Math.random() * Math.PI;
                const randTheta = Math.random() * Math.PI * 2;
                const randX = Math.sin(randPhi) * Math.cos(randTheta);
                const randY = Math.sin(randPhi) * Math.sin(randTheta);
                const randZ = Math.cos(randPhi);

                // Combine outward direction with randomness
                const outwardBias = 0.5;
                const dirX = outX * outwardBias + randX * (1 - outwardBias);
                const dirY = outY * outwardBias + randY * (1 - outwardBias);
                const dirZ = outZ * outwardBias + randZ * (1 - outwardBias);

                // Offset distance in world units
                const offset = (node.size * 0.0015 + Math.random() * 0.03);

                const newWorldX = avgWorldX + dirX * offset;
                const newWorldY = avgWorldY + dirY * offset;
                const newWorldZ = avgWorldZ + dirZ * offset;

                // Convert back to screen coordinates
                node.x = centerX + newWorldX * width;
                node.y = centerY - newWorldY * width;
                node.z = newWorldZ;
                node.placed = true;
            });
        }

        // Place any remaining unplaced nodes randomly in sphere
        nodes.forEach(node => {
            if (!node.placed) {
                // Random point in sphere using rejection sampling
                let worldX, worldY, worldZ;
                do {
                    worldX = (Math.random() - 0.5) * 2 * sphereRadius;
                    worldY = (Math.random() - 0.5) * 2 * sphereRadius;
                    worldZ = (Math.random() - 0.5) * 2 * sphereRadius;
                } while (worldX * worldX + worldY * worldY + worldZ * worldZ > sphereRadius * sphereRadius);

                node.x = centerX + worldX * width;
                node.y = centerY - worldY * width;
                node.z = worldZ;
            }
            delete node.placed;
        });

        resizeSphereGL();
    }

    function getNodeAt(screenX, screenY) {
        // Pick nodes based on their projected screen position (renderX, renderY)
        // screenX, screenY are in screen/pixel coordinates
        // Sort by camera distance (closest first) for proper picking
        const sortedNodes = [...nodes].sort((a, b) => {
            const distA = a.cameraDistance !== undefined ? a.cameraDistance : 0;
            const distB = b.cameraDistance !== undefined ? b.cameraDistance : 0;
            return distA - distB; // Closest first
        });

        for (let i = 0; i < sortedNodes.length; i++) {
            const node = sortedNodes[i];
            // Use projected screen position for hit testing
            const renderX = node.renderX !== undefined ? node.renderX : node.x;
            const renderY = node.renderY !== undefined ? node.renderY : node.y;
            const renderScale = node.renderScale !== undefined ? node.renderScale : 1;

            // Skip culled nodes
            if (renderX < -1000) continue;

            const dx = screenX - renderX;
            const dy = screenY - renderY;
            const hitRadius = (node.size * renderScale + 5);
            if (dx * dx + dy * dy < hitRadius * hitRadius) return node;
        }
        return null;
    }

    function getConnectedNodes(node) {
        const connected = new Set();
        connections.forEach(([a, b]) => {
            if (a === node.id) connected.add(b);
            if (b === node.id) connected.add(a);
        });
        return connected;
    }

    // Build connection lookup for fast access
    const connectionMap = new Map();
    connections.forEach(([a, b]) => {
        if (!connectionMap.has(a)) connectionMap.set(a, new Set());
        if (!connectionMap.has(b)) connectionMap.set(b, new Set());
        connectionMap.get(a).add(b);
        connectionMap.get(b).add(a);
    });

    function simulate() {
        if (globalFadeIn < 1 && time > 1.5) globalFadeIn = Math.min(1, (time - 1.5) / 2);
        if (globalFadeIn >= 1) startupPhase = false;

        const minDim = Math.min(width, height);

        // ====== SIMPLE SOLAR SYSTEM ======
        // Get orbital parameters from UI controls
        const speedMult = orbitParams.orbitSpeed;
        // sunSpread, sunSpawnMin/Max are used inside getSunPosition()
        const moonRadiusMult = orbitParams.moonOrbitRadius;
        const moonSpacingMult = orbitParams.moonOrbitSpacing;
        const moonTiltMult = orbitParams.moonOrbitTilt;
        const subMoonRadiusMult = orbitParams.subMoonOrbitRadius;
        const subMoonSpeedMult = orbitParams.subMoonSpeed;
        const baseSpacing = 0.045;  // Base gap between orbits

        // STEP 1: Place suns at fixed positions (affected by sunSpread, sunSpawnMin/Max)
        for (const sunId in sunBasePositions) {
            const node = nodes.find(n => n.id === sunId);
            if (!node || node === dragNode) continue;

            // Get dynamic position based on spawn parameters
            const pos = getSunPosition(sunId);

            // Store world position (sunSpread already applied in getSunPosition)
            node.worldX = pos.x;
            node.worldY = pos.y;
            node.worldZ = pos.z;

            // Convert to screen
            node.x = centerX + node.worldX * minDim;
            node.y = centerY - node.worldY * minDim;
            node.z = pos.z;

            // Mark as sun (no orbit circle for suns since they're fixed)
            node.isSun = true;
        }

        // STEP 2: Moons orbit their parent sun with 3D tilted orbits
        for (const moonId in moonOrbits) {
            const node = nodes.find(n => n.id === moonId);
            if (!node || node === dragNode) continue;

            const config = moonOrbits[moonId];
            const parentSun = nodes.find(n => n.id === config.sun);
            if (!parentSun) continue;

            // Update orbital angle (affected by orbitSpeed)
            node.orbitAngle = (node.orbitAngle || config.phase) + config.speed * speedMult;

            // Calculate radius: baseOrbit + (orbitIndex * spacing)
            // baseOrbit is mapped from config.baseRadius (0-1) to baseOrbitMin-baseOrbitMax range
            const orbitIndex = config.orbitIndex || 0;
            const baseOrbit = orbitParams.baseOrbitMin + config.baseRadius * (orbitParams.baseOrbitMax - orbitParams.baseOrbitMin);
            const radius = (baseOrbit + orbitIndex * baseSpacing * moonSpacingMult) * moonRadiusMult;
            const angle = node.orbitAngle;
            // Get tilt from the solar system (shared by all moons of this sun)
            const systemTilt = solarSystemTilts[config.sun] || { tiltX: 0, tiltY: 0 };
            const tiltX = systemTilt.tiltX * moonTiltMult;
            const tiltY = systemTilt.tiltY * moonTiltMult;

            // Start with circular orbit in XY plane
            let offsetX = Math.cos(angle) * radius;
            let offsetY = Math.sin(angle) * radius;
            let offsetZ = 0;

            // Apply tilt around X axis (pitch)
            const cosT = Math.cos(tiltX);
            const sinT = Math.sin(tiltX);
            const newY = offsetY * cosT - offsetZ * sinT;
            const newZ = offsetY * sinT + offsetZ * cosT;
            offsetY = newY;
            offsetZ = newZ;

            // Apply tilt around Y axis (yaw)
            const cosY = Math.cos(tiltY);
            const sinY = Math.sin(tiltY);
            const newX = offsetX * cosY + offsetZ * sinY;
            offsetZ = -offsetX * sinY + offsetZ * cosY;
            offsetX = newX;

            // Moon position = sun position + tilted orbit offset
            const sunX = parentSun.worldX || 0;
            const sunY = parentSun.worldY || 0;
            const sunZ = parentSun.worldZ || 0;

            node.worldX = sunX + offsetX;
            node.worldY = sunY + offsetY;
            node.worldZ = sunZ + offsetZ;

            // Convert to screen
            node.x = centerX + node.worldX * minDim;
            node.y = centerY - node.worldY * minDim;
            node.z = node.worldZ;

            // Store orbit info for drawing circles (use current scaled values)
            node.orbitCenterWorldX = sunX;
            node.orbitCenterWorldY = sunY;
            node.orbitCenterWorldZ = sunZ;
            node.orbitRadiusWorld = radius;
            node.orbitTiltX = tiltX;
            node.orbitTiltY = tiltY;
            node.parentSunId = config.sun;
            node.isMoon = true;
        }

        // STEP 3: Sub-moons orbit around planets (former free floaters)
        for (const subMoonId in subMoonOrbits) {
            const node = nodes.find(n => n.id === subMoonId);
            if (!node || node === dragNode) continue;

            const config = subMoonOrbits[subMoonId];
            const parentPlanet = nodes.find(n => n.id === config.parent);
            if (!parentPlanet) continue;

            // Update orbital angle (affected by both global speed and sub-moon speed)
            node.orbitAngle = (node.orbitAngle || config.phase) + config.speed * speedMult * subMoonSpeedMult;

            // Apply radius multiplier from UI
            const radius = config.radius * subMoonRadiusMult;
            const angle = node.orbitAngle;
            const tiltX = (config.tiltX || 0) * moonTiltMult;
            const tiltY = (config.tiltY || 0) * moonTiltMult;

            // Start with circular orbit in XY plane
            let offsetX = Math.cos(angle) * radius;
            let offsetY = Math.sin(angle) * radius;
            let offsetZ = 0;

            // Apply tilt around X axis
            const cosT = Math.cos(tiltX);
            const sinT = Math.sin(tiltX);
            const newY = offsetY * cosT - offsetZ * sinT;
            const newZ = offsetY * sinT + offsetZ * cosT;
            offsetY = newY;
            offsetZ = newZ;

            // Apply tilt around Y axis
            const cosY = Math.cos(tiltY);
            const sinY = Math.sin(tiltY);
            const newX = offsetX * cosY + offsetZ * sinY;
            offsetZ = -offsetX * sinY + offsetZ * cosY;
            offsetX = newX;

            // Sub-moon position = parent planet position + tilted orbit offset
            const parentX = parentPlanet.worldX || 0;
            const parentY = parentPlanet.worldY || 0;
            const parentZ = parentPlanet.worldZ || 0;

            node.worldX = parentX + offsetX;
            node.worldY = parentY + offsetY;
            node.worldZ = parentZ + offsetZ;

            // Convert to screen
            node.x = centerX + node.worldX * minDim;
            node.y = centerY - node.worldY * minDim;
            node.z = node.worldZ;

            // Store orbit info for drawing circles
            node.orbitCenterWorldX = parentX;
            node.orbitCenterWorldY = parentY;
            node.orbitCenterWorldZ = parentZ;
            node.orbitRadiusWorld = radius;
            node.orbitTiltX = tiltX;
            node.orbitTiltY = tiltY;
            node.parentSunId = config.parent;  // Used for circle drawing
            node.isSubMoon = true;
            // Apply sub-moon size multiplier
            node.size = node.baseSize * sizeScale * orbitParams.subMoonSize;
        }
    }

    let lastHoveredNode = null, hoverStartTime = 0;

    function draw() {
        ctx.clearRect(0, 0, width, height);
        time += 0.016;

        // Smooth zoom interpolation (slower for smoother feel)
        zoomLevel += (targetZoom - zoomLevel) * 0.05;
        zoomCenterX += (targetZoomCenterX - zoomCenterX) * 0.05;
        zoomCenterY += (targetZoomCenterY - zoomCenterY) * 0.05;

        // Smooth camera rotation interpolation
        cameraRotX += (targetCameraRotX - cameraRotX) * 0.08;
        cameraRotY += (targetCameraRotY - cameraRotY) * 0.08;

        // Update global camera rotation and zoom for background shader
        window.globalCameraRotX = cameraRotX;
        window.globalCameraRotY = cameraRotY;
        window.globalZoom = zoomLevel;

        // 3D perspective camera (matching planet/particle shaders)
        // Fixed orbit distance, zoom applied as scale factor
        const orbitDist = 1.0;
        const screenCenterX = width * 0.5;
        const screenCenterY = height * 0.5;

        // Camera rotation values
        const cosRotX = Math.cos(cameraRotX);
        const sinRotX = Math.sin(cameraRotX);
        const cosRotY = Math.cos(cameraRotY);
        const sinRotY = Math.sin(cameraRotY);

        // Camera position (orbiting at fixed distance)
        const camPosX = orbitDist * sinRotY * cosRotX;
        const camPosY = orbitDist * sinRotX;
        const camPosZ = orbitDist * cosRotY * cosRotX;

        // Camera forward direction (looking at origin)
        const camLen = Math.sqrt(camPosX * camPosX + camPosY * camPosY + camPosZ * camPosZ);
        const camFwdX = -camPosX / camLen;
        const camFwdY = -camPosY / camLen;
        const camFwdZ = -camPosZ / camLen;

        // Camera right vector (cross product of worldUp and forward)
        const worldUpX = 0, worldUpY = 1, worldUpZ = 0;
        let camRightX = worldUpY * camFwdZ - worldUpZ * camFwdY;
        let camRightY = worldUpZ * camFwdX - worldUpX * camFwdZ;
        let camRightZ = worldUpX * camFwdY - worldUpY * camFwdX;
        const rightLen = Math.sqrt(camRightX * camRightX + camRightY * camRightY + camRightZ * camRightZ);
        camRightX /= rightLen; camRightY /= rightLen; camRightZ /= rightLen;

        // Camera up vector (cross product of forward and right)
        const camUpX = camFwdY * camRightZ - camFwdZ * camRightY;
        const camUpY = camFwdZ * camRightX - camFwdX * camRightZ;
        const camUpZ = camFwdX * camRightY - camFwdY * camRightX;

        // No canvas transform - we apply perspective manually to each element
        ctx.save();

        const connectedToHovered = hoveredNode ? getConnectedNodes(hoveredNode) : new Set();
        if (hoveredNode !== lastHoveredNode) { hoverStartTime = time; lastHoveredNode = hoveredNode; }
        const timeSinceHover = time - hoverStartTime;

        nodes.forEach(node => {
            const isHovered = node === hoveredNode;
            const isConnected = connectedToHovered.has(node.id);

            if (isHovered) { node.targetGlowIntensity = 1; node.glowDelay = 0; node.targetShrink = 1; }
            else if (isConnected) { node.targetGlowIntensity = 0.6; node.glowDelay = 0.15; node.targetShrink = 1; }
            else if (hoveredNode) { node.targetGlowIntensity = 0; node.glowDelay = 0; node.targetShrink = 0; }
            else { node.targetGlowIntensity = 0; node.glowDelay = 0; node.targetShrink = 1; }

            const effectiveTime = Math.max(0, timeSinceHover - node.glowDelay);
            if (effectiveTime > 0 || node.targetGlowIntensity === 0) {
                const lerpSpeed = node.targetGlowIntensity > node.glowIntensity ? 0.08 : 0.12;
                node.glowIntensity += (node.targetGlowIntensity - node.glowIntensity) * lerpSpeed;
            }
            node.shrinkProgress += (node.targetShrink - node.shrinkProgress) * (node.targetShrink > node.shrinkProgress ? 0.12 : 0.08);
            if (node.glowIntensity < 0.01) node.glowIntensity = 0;
            if (node.shrinkProgress < 0.01) node.shrinkProgress = 0;
            if (node.shrinkProgress > 0.99) node.shrinkProgress = 1;
        });

        // Update rotation for visual spinning of planets
        nodes.forEach(node => {
            node.rotation += node.rotationSpeed;
        });

        // Apply 3D perspective to canvas elements (matching planet shader)
        // Nodes now have actual Z positions in world space
        const worldScale = 1.0 / width;
        nodes.forEach(node => {
            // Node position in world space (now with actual Z from node.z)
            const offsetX = node.x - screenCenterX;
            const offsetY = node.y - screenCenterY;
            const nodePosX = offsetX * worldScale;
            const nodePosY = -offsetY * worldScale;  // Flip Y
            const nodePosZ = node.z || 0.0;

            // Vector from camera to node
            const toNodeX = nodePosX - camPosX;
            const toNodeY = nodePosY - camPosY;
            const toNodeZ = nodePosZ - camPosZ;

            // Project onto camera's view plane (dot with forward)
            const zDist = toNodeX * camFwdX + toNodeY * camFwdY + toNodeZ * camFwdZ;

            // Store camera distance for sorting/picking
            node.cameraDistance = zDist;

            // Cull if behind camera
            if (zDist < 0.01) {
                node.renderX = -10000;
                node.renderY = -10000;
                node.renderScale = 0;
                node.renderAlpha = 0;
                return;
            }

            // Perspective scale (fixed orbit distance)
            const perspectiveScale = orbitDist / zDist;

            // Project node position onto screen (dot with right and up)
            const projX = (toNodeX * camRightX + toNodeY * camRightY + toNodeZ * camRightZ) * perspectiveScale;
            const projY = (toNodeX * camUpX + toNodeY * camUpY + toNodeZ * camUpZ) * perspectiveScale;

            // Convert back to screen coordinates with zoom applied
            node.renderX = screenCenterX + projX * width * zoomLevel;
            node.renderY = screenCenterY - projY * width * zoomLevel;  // Flip Y back
            node.renderScale = perspectiveScale * zoomLevel;

            // Fade when very close to camera
            node.renderAlpha = zDist < 0.2 ? zDist / 0.2 : 1.0;
        });

        // Helper to project 3D world point to screen
        function projectToScreen(wx, wy, wz) {
            const tx = wx - camPosX, ty = wy - camPosY, tz = wz - camPosZ;
            const zd = tx * camFwdX + ty * camFwdY + tz * camFwdZ;
            if (zd < 0.01) return null;
            const ps = orbitDist / zd;
            const px = (tx * camRightX + ty * camRightY + tz * camRightZ) * ps;
            const py = (tx * camUpX + ty * camUpY + tz * camUpZ) * ps;
            return { x: screenCenterX + px * width * zoomLevel, y: screenCenterY - py * width * zoomLevel };
        }

        // Draw orbit circles for moons (3D tilted circles, projected with camera)
        // Skip if orbits are disabled via UI
        if (orbitParams.showOrbits >= 1) {
        // Scale factor to convert node.worldX/Y to the coordinate system projectToScreen expects
        const minDim = Math.min(width, height);
        const worldToProjectScale = minDim / width;

        nodes.forEach(node => {
            if (node.isSun) return;
            if (!node.orbitRadiusWorld || !node.parentSunId) return;

            // Find parent (sun or planet for sub-moons)
            const parent = nodes.find(n => n.id === node.parentSunId);
            if (!parent || parent.renderX < -1000) return;

            // Use parent's light color if it's a sun, otherwise use a default
            const hexColor = parent.lightColor || '#aabbcc';
            const rCol = parseInt(hexColor.slice(1, 3), 16);
            const gCol = parseInt(hexColor.slice(3, 5), 16);
            const bCol = parseInt(hexColor.slice(5, 7), 16);

            // Sub-moons get fainter circles, affected by UI opacity setting
            const baseAlpha = node.isSubMoon ? 0.15 : 0.25;
            const orbitAlpha = baseAlpha * orbitParams.orbitLineOpacity * 4 * globalFadeIn * (parent.renderAlpha || 1);
            ctx.strokeStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${orbitAlpha})`;
            // Line width affected by UI setting
            const baseWidth = node.isSubMoon ? 0.5 : 1;
            ctx.lineWidth = baseWidth * orbitParams.orbitLineWidth;
            ctx.beginPath();

            // Draw 3D tilted circle centered on parent's world position
            const segments = 48;
            const radius = node.orbitRadiusWorld * worldToProjectScale;
            const centerWX = (parent.worldX || 0) * worldToProjectScale;
            const centerWY = (parent.worldY || 0) * worldToProjectScale;
            const centerWZ = parent.worldZ || 0;

            // Get tilt angles for this orbit
            const tiltX = node.orbitTiltX || 0;
            const tiltY = node.orbitTiltY || 0;
            const cosTX = Math.cos(tiltX), sinTX = Math.sin(tiltX);
            const cosTY = Math.cos(tiltY), sinTY = Math.sin(tiltY);

            let firstPoint = true;
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;

                // Start with circle in XY plane
                let ox = Math.cos(angle) * radius;
                let oy = Math.sin(angle) * radius;
                let oz = 0;

                // Apply tilt around X axis
                const ny = oy * cosTX - oz * sinTX;
                const nz = oy * sinTX + oz * cosTX;
                oy = ny;
                oz = nz;

                // Apply tilt around Y axis
                const nx = ox * cosTY + oz * sinTY;
                oz = -ox * sinTY + oz * cosTY;
                ox = nx;

                const worldX = centerWX + ox;
                const worldY = centerWY + oy;
                const worldZ = centerWZ + oz;

                const projected = projectToScreen(worldX, worldY, worldZ);
                if (!projected) continue;
                if (firstPoint) { ctx.moveTo(projected.x, projected.y); firstPoint = false; }
                else { ctx.lineTo(projected.x, projected.y); }
            }
            ctx.stroke();
        });
        } // End showOrbits check

        // Only draw connections when showConnectionLinks is enabled
        if (showConnectionLinks) {
            // Draw all connections (teal, more visible)
            connections.forEach(([a, b]) => {
                const nodeA = nodes.find(n => n.id === a);
                const nodeB = nodes.find(n => n.id === b);
                if (!nodeA || !nodeB) return;
                if (nodeA.renderX < -1000 || nodeB.renderX < -1000) return; // Skip if culled

                const ax = nodeA.renderX, ay = nodeA.renderY;
                const bx = nodeB.renderX, by = nodeB.renderY;
                const avgScale = ((nodeA.renderScale || 1) + (nodeB.renderScale || 1)) * 0.5;
                const avgAlpha = ((nodeA.renderAlpha || 1) + (nodeB.renderAlpha || 1)) * 0.5;

                ctx.strokeStyle = `rgba(45, 212, 191, ${0.25 * globalFadeIn * avgAlpha})`;
                ctx.lineWidth = 2 * avgScale;
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(bx, by);
                ctx.stroke();
            });

            // Draw highlighted connections on top (yellow opaque)
            if (hoveredNode) {
                connections.forEach(([a, b]) => {
                    const isHighlighted = hoveredNode.id === a || hoveredNode.id === b;
                    if (!isHighlighted) return;

                    const nodeA = nodes.find(n => n.id === a);
                    const nodeB = nodes.find(n => n.id === b);
                    if (!nodeA || !nodeB) return;
                    if (nodeA.renderX < -1000 || nodeB.renderX < -1000) return; // Skip if culled

                    const ax = nodeA.renderX, ay = nodeA.renderY;
                    const bx = nodeB.renderX, by = nodeB.renderY;
                    const avgScale = ((nodeA.renderScale || 1) + (nodeB.renderScale || 1)) * 0.5;
                    const avgAlpha = ((nodeA.renderAlpha || 1) + (nodeB.renderAlpha || 1)) * 0.5;

                    ctx.strokeStyle = `rgba(232, 185, 35, ${globalFadeIn * avgAlpha})`;
                    ctx.lineWidth = 2 * avgScale;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(bx, by);
                    ctx.stroke();
                });
            }
        }

        if (!renderSpheresGL(nodes, hoveredNode, connectedToHovered)) {
            nodes.forEach(node => {
                const fadeAmount = node.shrinkProgress !== undefined ? node.shrinkProgress : 1;
                if (globalFadeIn < 0.01) return;
                const minAlpha = 0.3;
                const alphaMultiplier = minAlpha + fadeAmount * (1 - minAlpha);
                const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
                const displaySize = node.size + pulse * 0.5 + node.glowIntensity * 3;
                let baseColor = node.category === 'primary' ? colors.gold : node.category === 'secondary' ? colors.teal : colors.textMuted;
                // Use parallax-adjusted positions
                drawLitSphere(node.renderX, node.renderY, displaySize, baseColor, alphaMultiplier * globalFadeIn, globalFadeIn * alphaMultiplier, node.glowIntensity);
            });
        }

        // Draw labels only if enabled
        if (showPlanetLabels) {
            nodes.forEach(node => {
                const fadeAmount = node.shrinkProgress !== undefined ? node.shrinkProgress : 1;
                if (globalFadeIn < 0.5) return;
                if (node.renderX < -1000) return; // Skip nodes behind camera
                const minAlpha = 0.3;
                const alphaMultiplier = minAlpha + fadeAmount * (1 - minAlpha);
                const perspectiveAlpha = node.renderAlpha !== undefined ? node.renderAlpha : 1.0;
                const labelAlpha = Math.min(1, (globalFadeIn - 0.5) * 2) * alphaMultiplier * perspectiveAlpha;
                const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
                const displaySize = (node.size + pulse * 0.5 + node.glowIntensity * 3) * (node.renderScale || 1);
                // Use perspective-adjusted positions for labels
                const labelX = node.renderX;
                const labelY = node.renderY + displaySize + (12 * sizeScale + 6) * (node.renderScale || 1);
                const fontWeight = node.glowIntensity > 0.5 ? '600' : '500';
                const fontSize = (9.5 + 2.5 * sizeScale + node.glowIntensity) * (node.renderScale || 1);
                ctx.font = `${fontWeight} ${fontSize}px "JetBrains Mono", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const textWidth = ctx.measureText(node.label).width;
                const paddingX = (3 * sizeScale + 1) * (node.renderScale || 1);
                const paddingY = (5 * sizeScale + 2) * (node.renderScale || 1);
                ctx.globalAlpha = labelAlpha;
                ctx.fillStyle = `rgba(21, 29, 38, ${0.8 * alphaMultiplier * perspectiveAlpha})`;
                ctx.beginPath();
                ctx.roundRect(labelX - textWidth / 2 - paddingX, labelY - paddingY, textWidth + paddingX * 2, paddingY * 2, 3);
                ctx.fill();
                ctx.fillStyle = colors.textPrimary;
                ctx.fillText(node.label, labelX, labelY);
                ctx.globalAlpha = 1;
            });
        }

        drawTooltipConnector();

        // Restore canvas state after zoom transform
        ctx.restore();
    }

    function animate() {
        simulate();
        draw();
        requestAnimationFrame(animate);
    }

    // Convert screen coords to world coords (accounting for 3D perspective camera)
    function screenToWorld(sx, sy) {
        // Fixed orbit distance, zoom applied as scale
        // In the shader: projectedCenter = screenCenter + projection * zoomScale
        // So we reverse: worldPos = (screenPos - screenCenter) / zoomScale + screenCenter
        const screenCenterX = width * 0.5;
        const screenCenterY = height * 0.5;

        // Zoom is a simple scale factor around screen center
        return {
            x: (sx - screenCenterX) / zoomLevel + screenCenterX,
            y: (sy - screenCenterY) / zoomLevel + screenCenterY
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Alt + Right Click: Start camera orbit
        if (e.altKey && e.button === 2) {
            isOrbiting = true;
            orbitStartX = e.clientX;
            orbitStartY = e.clientY;
            orbitStartRotX = targetCameraRotX;
            orbitStartRotY = targetCameraRotY;
            container.style.cursor = 'move';
            e.preventDefault();
            return;
        }

        mouseScreenX = screenX;
        mouseScreenY = screenY;
        const world = screenToWorld(screenX, screenY);
        mouseX = world.x;
        mouseY = world.y;
        dragNode = getNodeAt(screenX, screenY);  // Use screen coords for hit testing
        if (dragNode) {
            isDragging = true;
            settled = false;
            container.style.cursor = 'grabbing';
            if (hoveredNode === dragNode && !tooltipTarget) {
                tooltipTarget = dragNode;
                generateTooltipPosition(dragNode);
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        // Handle camera orbit dragging
        if (isOrbiting) {
            const deltaX = e.clientX - orbitStartX;
            const deltaY = e.clientY - orbitStartY;
            // Sensitivity affected by UI slider
            const sensitivity = 0.005 * orbitParams.cameraRotSpeed;
            targetCameraRotY = orbitStartRotY + deltaX * sensitivity;
            targetCameraRotX = orbitStartRotX + deltaY * sensitivity;
            // Clamp pitch to avoid flipping
            targetCameraRotX = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, targetCameraRotX));
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        mouseScreenX = screenX;
        mouseScreenY = screenY;
        const world = screenToWorld(screenX, screenY);
        mouseX = world.x;
        mouseY = world.y;
        if (isDragging && dragNode) {
            dragNode.x = mouseX; dragNode.y = mouseY;
            dragNode.baseX = mouseX; dragNode.baseY = mouseY;
            dragNode.vx = 0; dragNode.vy = 0;
            settled = false; settleTimer = 0;
            if (tooltipTarget === dragNode) updateTooltipPositionForDrag(dragNode);
        } else {
            hoveredNode = getNodeAt(screenX, screenY);  // Use screen coords for hit testing
            container.style.cursor = hoveredNode ? 'pointer' : 'grab';
            updateTooltip(hoveredNode);
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (isOrbiting) {
            isOrbiting = false;
            container.style.cursor = hoveredNode ? 'pointer' : 'grab';
            return;
        }
        isDragging = false; dragNode = null;
        container.style.cursor = hoveredNode ? 'pointer' : 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false; dragNode = null; hoveredNode = null;
        isOrbiting = false;
        container.style.cursor = 'grab';
        updateTooltip(null);
    });

    // Prevent context menu when using Alt + Right Click for camera orbit
    canvas.addEventListener('contextmenu', (e) => {
        if (e.altKey) {
            e.preventDefault();
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        mouseScreenX = screenX;
        mouseScreenY = screenY;
        const world = screenToWorld(screenX, screenY);
        mouseX = world.x;
        mouseY = world.y;
        dragNode = getNodeAt(screenX, screenY);  // Use screen coords for hit testing
        if (dragNode) {
            isDragging = true; settled = false;
            tooltipTarget = dragNode;
            generateTooltipPosition(dragNode);
            updateTooltip(dragNode);
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDragging || !dragNode) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        const world = screenToWorld(screenX, screenY);
        dragNode.x = world.x;
        dragNode.y = world.y;
        dragNode.baseX = dragNode.x; dragNode.baseY = dragNode.y;
        dragNode.vx = 0; dragNode.vy = 0;
        settled = false;
        if (tooltipTarget === dragNode) updateTooltipPositionForDrag(dragNode);
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isDragging = false; dragNode = null; });

    // Mouse wheel zoom - zooms toward mouse position
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseScreenX = e.clientX - rect.left;
        const mouseScreenY = e.clientY - rect.top;

        const zoomSpeed = 0.0008;
        const delta = -e.deltaY * zoomSpeed;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom + delta * targetZoom));

        // Don't change zoom center if already at max zoom
        if (targetZoom >= MAX_ZOOM && newZoom >= MAX_ZOOM) {
            return;
        }

        // Only update zoom center when zooming in, not when at min zoom
        if (newZoom > MIN_ZOOM) {
            targetZoomCenterX = mouseScreenX;
            targetZoomCenterY = mouseScreenY;
        }
        targetZoom = newZoom;
    }, { passive: false });

    // Spacebar toggles mouse light on planets
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            mouseLightEnabled = !mouseLightEnabled;
        }
    });

    window.addEventListener('resize', resize);
    initSphereGL();
    resize();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            time = 0; globalFadeIn = 0; startupPhase = true;
            tooltip.classList.remove('visible');
            tooltipTarget = null;
        }
    });

    window.addEventListener('skillsTabActivated', () => {
        time = 0; globalFadeIn = 0; startupPhase = true;
        tooltip.classList.remove('visible');
        tooltipTarget = null;
    });

    // ========================================
    // LIGHT CONTROLS UI - Kelvin Temperature
    // ========================================
    const lightControls = document.getElementById('light-controls');
    const lightControlsToggle = document.getElementById('light-controls-toggle');
    const lightResetBtn = document.getElementById('light-reset-btn');
    const kelvinSliders = [
        document.getElementById('kelvin-slider-0'),
        document.getElementById('kelvin-slider-1'),
        document.getElementById('kelvin-slider-2')
    ];
    const kelvinValues = [
        document.getElementById('kelvin-value-0'),
        document.getElementById('kelvin-value-1'),
        document.getElementById('kelvin-value-2')
    ];
    const lightPreviews = [
        document.getElementById('light-preview-0'),
        document.getElementById('light-preview-1'),
        document.getElementById('light-preview-2')
    ];

    // Default Kelvin temperatures (Unity hot, Unreal cold, Graphics medium)
    const defaultKelvinTemps = [15000, 2000, 5000];

    // Get light nodes (primary skill nodes - suns)
    const lightNodeIds = ['unity', 'unreal', 'graphics'];

    // Convert Kelvin temperature to RGB color
    // Enhanced algorithm for more saturated extremes
    function kelvinToRGB(kelvin) {
        const temp = kelvin / 100;
        let r, g, b;

        // Red
        if (temp <= 66) {
            r = 255;
        } else {
            r = temp - 60;
            r = 329.698727446 * Math.pow(r, -0.1332047592);
            r = Math.max(0, Math.min(255, r));
        }

        // Green
        if (temp <= 66) {
            g = temp;
            g = 99.4708025861 * Math.log(g) - 161.1195681661;
            g = Math.max(0, Math.min(255, g));
        } else {
            g = temp - 60;
            g = 288.1221695283 * Math.pow(g, -0.0755148492);
            g = Math.max(0, Math.min(255, g));
        }

        // Blue
        if (temp >= 66) {
            b = 255;
        } else if (temp <= 19) {
            b = 0;
        } else {
            b = temp - 10;
            b = 138.5177312231 * Math.log(b) - 305.0447927307;
            b = Math.max(0, Math.min(255, b));
        }

        // Boost saturation at extremes for more vivid colors
        // Cold stars: boost red, reduce green/blue
        if (kelvin < 4000) {
            const coldFactor = 1 - (kelvin - 2000) / 2000; // 1 at 2000K, 0 at 4000K
            r = Math.min(255, r + coldFactor * 40);
            g = Math.max(0, g * (1 - coldFactor * 0.4));
            b = Math.max(0, b * (1 - coldFactor * 0.6));
        }
        // Hot stars: boost blue, reduce red
        if (kelvin > 8000) {
            const hotFactor = Math.min(1, (kelvin - 8000) / 7000); // 0 at 8000K, 1 at 15000K
            r = Math.max(0, r * (1 - hotFactor * 0.35));
            g = Math.max(0, g * (1 - hotFactor * 0.15));
            b = Math.min(255, b + hotFactor * 30);
        }

        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }

    // Get star classification from Kelvin
    function getStarClass(kelvin) {
        if (kelvin >= 30000) return 'O';
        if (kelvin >= 10000) return 'B';
        if (kelvin >= 7500) return 'A';
        if (kelvin >= 6000) return 'F';
        if (kelvin >= 5200) return 'G';
        if (kelvin >= 3700) return 'K';
        return 'M';
    }

    function updateLightFromKelvin(index, kelvin) {
        const color = kelvinToRGB(kelvin);
        const starClass = getStarClass(kelvin);
        const node = nodes.find(n => n.id === lightNodeIds[index]);

        if (node) {
            node.lightColor = color;
            node.color = color;
        }
        if (lightPreviews[index]) {
            lightPreviews[index].style.backgroundColor = color;
            lightPreviews[index].style.boxShadow = `0 0 8px ${color}`;
        }
        if (kelvinValues[index]) {
            kelvinValues[index].textContent = `${kelvin}K (${starClass})`;
        }
        if (kelvinSliders[index]) {
            kelvinSliders[index].value = kelvin;
        }
    }

    // Initialize from lightParams (which may be loaded from localStorage)
    updateLightFromKelvin(0, lightParams.light0Kelvin);
    updateLightFromKelvin(1, lightParams.light1Kelvin);
    updateLightFromKelvin(2, lightParams.light2Kelvin);

    // Toggle panel
    if (lightControlsToggle) {
        lightControlsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            lightControls.classList.toggle('active');
        });
    }

    // Label toggle button
    const labelToggle = document.getElementById('label-toggle');
    if (labelToggle) {
        labelToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            showPlanetLabels = !showPlanetLabels;
            labelToggle.classList.toggle('active', showPlanetLabels);
        });
    }

    // Links toggle
    const linksToggle = document.getElementById('links-toggle');
    if (linksToggle) {
        linksToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            showConnectionLinks = !showConnectionLinks;
            linksToggle.classList.toggle('active', showConnectionLinks);
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (lightControls && !lightControls.contains(e.target)) {
            lightControls.classList.remove('active');
        }
    });

    // Kelvin slider handlers
    kelvinSliders.forEach((slider, i) => {
        if (slider) {
            slider.addEventListener('input', (e) => {
                const kelvin = parseInt(e.target.value);
                if (i === 0) lightParams.light0Kelvin = kelvin;
                else if (i === 1) lightParams.light1Kelvin = kelvin;
                else if (i === 2) lightParams.light2Kelvin = kelvin;
                updateLightFromKelvin(i, kelvin);
            });
        }
    });

    // Intensity slider handlers
    const intensitySliders = [
        document.getElementById('intensity-slider-0'),
        document.getElementById('intensity-slider-1'),
        document.getElementById('intensity-slider-2')
    ];
    const intensityValues = [
        document.getElementById('intensity-value-0'),
        document.getElementById('intensity-value-1'),
        document.getElementById('intensity-value-2')
    ];

    intensitySliders.forEach((slider, i) => {
        if (slider && intensityValues[i]) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (i === 0) lightParams.light0Intensity = value;
                else if (i === 1) lightParams.light1Intensity = value;
                else if (i === 2) lightParams.light2Intensity = value;
                intensityValues[i].textContent = value.toFixed(1);
            });
        }
    });

    // Attenuation slider handlers
    const attenuationSliders = [
        document.getElementById('attenuation-slider-0'),
        document.getElementById('attenuation-slider-1'),
        document.getElementById('attenuation-slider-2')
    ];
    const attenuationValues = [
        document.getElementById('attenuation-value-0'),
        document.getElementById('attenuation-value-1'),
        document.getElementById('attenuation-value-2')
    ];

    attenuationSliders.forEach((slider, i) => {
        if (slider && attenuationValues[i]) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (i === 0) lightParams.light0Attenuation = value;
                else if (i === 1) lightParams.light1Attenuation = value;
                else if (i === 2) lightParams.light2Attenuation = value;
                attenuationValues[i].textContent = value.toFixed(2);
            });
        }
    });

    // Ambient light slider handler
    const ambientSlider = document.getElementById('ambient-slider');
    const ambientValue = document.getElementById('ambient-value');
    if (ambientSlider && ambientValue) {
        ambientSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            lightParams.ambientIntensity = value;
            ambientValue.textContent = value.toFixed(2);
        });
    }

    // Fog intensity slider handler
    const fogSlider = document.getElementById('fog-slider');
    const fogValue = document.getElementById('fog-value');
    if (fogSlider && fogValue) {
        fogSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            lightParams.fogIntensity = value;
            fogValue.textContent = value.toFixed(2);
        });
    }

    // Reset button
    if (lightResetBtn) {
        lightResetBtn.addEventListener('click', () => {
            defaultKelvinTemps.forEach((temp, i) => {
                updateLightFromKelvin(i, temp);
            });
            // Reset intensity and attenuation to defaults
            const defaultIntensity = 1.0;
            const defaultAttenuation = 0.06;
            [0, 1, 2].forEach(i => {
                if (i === 0) {
                    lightParams.light0Intensity = defaultIntensity;
                    lightParams.light0Attenuation = defaultAttenuation;
                } else if (i === 1) {
                    lightParams.light1Intensity = defaultIntensity;
                    lightParams.light1Attenuation = defaultAttenuation;
                } else if (i === 2) {
                    lightParams.light2Intensity = defaultIntensity;
                    lightParams.light2Attenuation = defaultAttenuation;
                }
                if (intensitySliders[i]) intensitySliders[i].value = defaultIntensity;
                if (intensityValues[i]) intensityValues[i].textContent = defaultIntensity.toFixed(1);
                if (attenuationSliders[i]) attenuationSliders[i].value = defaultAttenuation;
                if (attenuationValues[i]) attenuationValues[i].textContent = defaultAttenuation.toFixed(2);
            });
            // Reset ambient light
            lightParams.ambientIntensity = 0.0;
            if (ambientSlider) ambientSlider.value = 0;
            if (ambientValue) ambientValue.textContent = '0.00';
            // Reset fog intensity
            lightParams.fogIntensity = 0.15;
            if (fogSlider) fogSlider.value = 0.15;
            if (fogValue) fogValue.textContent = '0.15';
        });
    }

    // ========================================
    // PLANET A (OCEANIC) CONTROLS
    // ========================================
    const planetAControls = document.getElementById('planet-a-controls');
    const planetAToggle = document.getElementById('planet-a-toggle');
    const planetAResetBtn = document.getElementById('planet-a-reset-btn');

    const planetASlidersConfig = {
        'a-noise-scale': { param: 'noiseScale', valueEl: 'a-noise-scale-value', default: 1.8, decimals: 1 },
        'a-terrain-height': { param: 'terrainHeight', valueEl: 'a-terrain-height-value', default: 0.6, decimals: 1 },
        'a-atmos-intensity': { param: 'atmosIntensity', valueEl: 'a-atmos-intensity-value', default: 0.6, decimals: 1 },
        'a-atmos-thickness': { param: 'atmosThickness', valueEl: 'a-atmos-thickness-value', default: 2.5, decimals: 2 },
        'a-atmos-power': { param: 'atmosPower', valueEl: 'a-atmos-power-value', default: 37.1, decimals: 1 },
        'a-scatter-scale': { param: 'scatterScale', valueEl: 'a-scatter-scale-value', default: 0.5, decimals: 2 },
        'a-sunset-strength': { param: 'sunsetStrength', valueEl: 'a-sunset-strength-value', default: 1.0, decimals: 2 },
        'a-ocean-roughness': { param: 'oceanRoughness', valueEl: 'a-ocean-roughness-value', default: 0.55, decimals: 2 },
        'a-sss-intensity': { param: 'sssIntensity', valueEl: 'a-sss-intensity-value', default: 1.0, decimals: 1 },
        'a-sea-level': { param: 'seaLevel', valueEl: 'a-sea-level-value', default: 0.0, decimals: 2 },
        'a-land-roughness': { param: 'landRoughness', valueEl: 'a-land-roughness-value', default: 0.65, decimals: 2 },
        'a-normal-strength': { param: 'normalStrength', valueEl: 'a-normal-strength-value', default: 0.15, decimals: 2 }
    };

    // Scatter color picker for Planet A
    const scatterColorA = document.getElementById('a-scatter-color');
    if (scatterColorA) {
        scatterColorA.value = planetParamsA.scatterColor;
        scatterColorA.addEventListener('input', () => {
            planetParamsA.scatterColor = scatterColorA.value;
        });
    }

    // Initialize Planet A sliders
    Object.entries(planetASlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = planetParamsA[config.param];
            valueEl.textContent = planetParamsA[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                planetParamsA[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    if (planetAToggle) {
        planetAToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            planetAControls.classList.toggle('active');
        });
    }

    if (planetAResetBtn) {
        planetAResetBtn.addEventListener('click', () => {
            Object.entries(planetASlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                planetParamsA[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset scatter color picker
            planetParamsA.scatterColor = '#1a40e6';
            if (scatterColorA) scatterColorA.value = '#1a40e6';
        });
    }

    // ========================================
    // PLANET B (LAVA) CONTROLS
    // ========================================
    const planetBControls = document.getElementById('planet-b-controls');
    const planetBToggle = document.getElementById('planet-b-toggle');
    const planetBResetBtn = document.getElementById('planet-b-reset-btn');

    const planetBSlidersConfig = {
        'b-noise-scale': { param: 'noiseScale', valueEl: 'b-noise-scale-value', default: 1.8, decimals: 1 },
        'b-terrain-height': { param: 'terrainHeight', valueEl: 'b-terrain-height-value', default: 0.6, decimals: 1 },
        'b-atmos-intensity': { param: 'atmosIntensity', valueEl: 'b-atmos-intensity-value', default: 0.8, decimals: 1 },
        'b-atmos-thickness': { param: 'atmosThickness', valueEl: 'b-atmos-thickness-value', default: 2.0, decimals: 2 },
        'b-atmos-power': { param: 'atmosPower', valueEl: 'b-atmos-power-value', default: 25.0, decimals: 1 },
        'b-scatter-scale': { param: 'scatterScale', valueEl: 'b-scatter-scale-value', default: 0.8, decimals: 2 },
        'b-sunset-strength': { param: 'sunsetStrength', valueEl: 'b-sunset-strength-value', default: 0.5, decimals: 2 },
        'b-lava-intensity': { param: 'lavaIntensity', valueEl: 'b-lava-intensity-value', default: 3.0, decimals: 1 },
        'b-sea-level': { param: 'seaLevel', valueEl: 'b-sea-level-value', default: 0.0, decimals: 2 },
        'b-land-roughness': { param: 'landRoughness', valueEl: 'b-land-roughness-value', default: 0.75, decimals: 2 },
        'b-normal-strength': { param: 'normalStrength', valueEl: 'b-normal-strength-value', default: 0.2, decimals: 2 }
    };

    // Scatter color picker for Planet B
    const scatterColorB = document.getElementById('b-scatter-color');
    if (scatterColorB) {
        scatterColorB.value = planetParamsB.scatterColor;
        scatterColorB.addEventListener('input', () => {
            planetParamsB.scatterColor = scatterColorB.value;
        });
    }

    // Initialize Planet B sliders
    Object.entries(planetBSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = planetParamsB[config.param];
            valueEl.textContent = planetParamsB[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                planetParamsB[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    if (planetBToggle) {
        planetBToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            planetBControls.classList.toggle('active');
        });
    }

    if (planetBResetBtn) {
        planetBResetBtn.addEventListener('click', () => {
            Object.entries(planetBSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                planetParamsB[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset scatter color picker
            planetParamsB.scatterColor = '#e63319';
            if (scatterColorB) scatterColorB.value = '#e63319';
        });
    }

    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        if (planetAControls && !planetAControls.contains(e.target)) {
            planetAControls.classList.remove('active');
        }
        if (planetBControls && !planetBControls.contains(e.target)) {
            planetBControls.classList.remove('active');
        }
    });

    // ========================================
    // PHYSICS CONTROLS UI
    // ========================================
    const physicsControls = document.getElementById('physics-controls');
    const physicsControlsToggle = document.getElementById('physics-controls-toggle');
    const physicsResetBtn = document.getElementById('physics-reset-btn');

    // Slider elements and their corresponding orbitParams keys
    const physicsSliders = {
        'orbit-speed': { param: 'orbitSpeed', valueEl: 'orbit-speed-value', default: 1.0, decimals: 2 },
        'sun-spread': { param: 'sunSpread', valueEl: 'sun-spread-value', default: 1.0, decimals: 2 },
        'sun-spawn-min': { param: 'sunSpawnMin', valueEl: 'sun-spawn-min-value', default: 0.2, decimals: 2 },
        'sun-spawn-max': { param: 'sunSpawnMax', valueEl: 'sun-spawn-max-value', default: 0.45, decimals: 2 },
        'moon-orbit-radius': { param: 'moonOrbitRadius', valueEl: 'moon-orbit-radius-value', default: 1.0, decimals: 2 },
        'moon-orbit-spacing': { param: 'moonOrbitSpacing', valueEl: 'moon-orbit-spacing-value', default: 1.0, decimals: 2 },
        'moon-orbit-tilt': { param: 'moonOrbitTilt', valueEl: 'moon-orbit-tilt-value', default: 1.0, decimals: 2 },
        'base-orbit-min': { param: 'baseOrbitMin', valueEl: 'base-orbit-min-value', default: 0.04, decimals: 3 },
        'base-orbit-max': { param: 'baseOrbitMax', valueEl: 'base-orbit-max-value', default: 0.08, decimals: 3 },
        'spawn-offset': { param: 'spawnOffset', valueEl: 'spawn-offset-value', default: 0.0, decimals: 2 },
        'submoon-orbit-radius': { param: 'subMoonOrbitRadius', valueEl: 'submoon-orbit-radius-value', default: 1.0, decimals: 2 },
        'submoon-speed': { param: 'subMoonSpeed', valueEl: 'submoon-speed-value', default: 1.0, decimals: 2 },
        'submoon-size': { param: 'subMoonSize', valueEl: 'submoon-size-value', default: 0.5, decimals: 2 },
        'orbit-line-opacity': { param: 'orbitLineOpacity', valueEl: 'orbit-line-opacity-value', default: 0.25, decimals: 2 },
        'orbit-line-width': { param: 'orbitLineWidth', valueEl: 'orbit-line-width-value', default: 1.0, decimals: 2 },
        'camera-rot-speed': { param: 'cameraRotSpeed', valueEl: 'camera-rot-speed-value', default: 1.0, decimals: 2 },
        'show-orbits': { param: 'showOrbits', valueEl: 'show-orbits-value', default: 1.0, decimals: 0, isToggle: true }
    };

    // Initialize orbital sliders
    Object.entries(physicsSliders).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = orbitParams[config.param];
            if (config.isToggle) {
                valueEl.textContent = orbitParams[config.param] >= 1 ? 'ON' : 'OFF';
            } else {
                valueEl.textContent = orbitParams[config.param].toFixed(config.decimals);
            }

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                orbitParams[config.param] = value;
                if (config.isToggle) {
                    valueEl.textContent = value >= 1 ? 'ON' : 'OFF';
                } else {
                    valueEl.textContent = value.toFixed(config.decimals);
                }
            });
        }
    });

    // Toggle physics panel
    if (physicsControlsToggle) {
        physicsControlsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            physicsControls.classList.toggle('active');
        });
    }

    // Close physics panel when clicking outside
    document.addEventListener('click', (e) => {
        if (physicsControls && !physicsControls.contains(e.target)) {
            physicsControls.classList.remove('active');
        }
    });

    // Orbital reset button
    if (physicsResetBtn) {
        physicsResetBtn.addEventListener('click', () => {
            Object.entries(physicsSliders).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                orbitParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (config.isToggle) {
                    if (valueEl) valueEl.textContent = config.default >= 1 ? 'ON' : 'OFF';
                } else {
                    if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
                }
            });
        });
    }

    // ========================================
    // SUN/HALO CONTROLS UI
    // ========================================
    const sunControls = document.getElementById('sun-controls');
    const sunToggle = document.getElementById('sun-toggle');
    const sunResetBtn = document.getElementById('sun-reset-btn');

    const sunSlidersConfig = {
        'sun-core-size': { param: 'coreSize', valueEl: 'sun-core-size-value', default: 0.5, decimals: 2 },
        'sun-glow-size': { param: 'glowSize', valueEl: 'sun-glow-size-value', default: 1.0, decimals: 2 },
        'sun-glow-intensity': { param: 'glowIntensity', valueEl: 'sun-glow-intensity-value', default: 0.6, decimals: 2 },
        'sun-corona-intensity': { param: 'coronaIntensity', valueEl: 'sun-corona-intensity-value', default: 1.0, decimals: 2 },
        'sun-ray-count': { param: 'rayCount', valueEl: 'sun-ray-count-value', default: 12, decimals: 0 },
        'sun-ray-intensity': { param: 'rayIntensity', valueEl: 'sun-ray-intensity-value', default: 1.0, decimals: 2 },
        'sun-ray-length': { param: 'rayLength', valueEl: 'sun-ray-length-value', default: 2.0, decimals: 2 },
        'sun-streamer-count': { param: 'streamerCount', valueEl: 'sun-streamer-count-value', default: 6, decimals: 0 },
        'sun-streamer-intensity': { param: 'streamerIntensity', valueEl: 'sun-streamer-intensity-value', default: 1.0, decimals: 2 },
        'sun-streamer-length': { param: 'streamerLength', valueEl: 'sun-streamer-length-value', default: 1.5, decimals: 2 },
        'sun-halo-ring1-dist': { param: 'haloRing1Dist', valueEl: 'sun-halo-ring1-dist-value', default: 1.2, decimals: 2 },
        'sun-halo-ring1-intensity': { param: 'haloRing1Intensity', valueEl: 'sun-halo-ring1-intensity-value', default: 0.15, decimals: 2 },
        'sun-halo-ring2-dist': { param: 'haloRing2Dist', valueEl: 'sun-halo-ring2-dist-value', default: 1.8, decimals: 2 },
        'sun-halo-ring2-intensity': { param: 'haloRing2Intensity', valueEl: 'sun-halo-ring2-intensity-value', default: 0.08, decimals: 2 },
        'sun-flicker-speed': { param: 'flickerSpeed', valueEl: 'sun-flicker-speed-value', default: 3.0, decimals: 1 },
        'sun-pulse-speed': { param: 'pulseSpeed', valueEl: 'sun-pulse-speed-value', default: 2.0, decimals: 1 },
        'sun-chromatic-shift': { param: 'chromaticShift', valueEl: 'sun-chromatic-shift-value', default: 1.0, decimals: 2 }
    };

    // Initialize sun sliders
    Object.entries(sunSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = sunParams[config.param];
            valueEl.textContent = sunParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                sunParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Toggle sun controls panel
    if (sunToggle) {
        sunToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sunControls.classList.toggle('active');
        });
    }

    // Close sun panel when clicking outside
    document.addEventListener('click', (e) => {
        if (sunControls && !sunControls.contains(e.target)) {
            sunControls.classList.remove('active');
        }
    });

    // Sun reset button
    if (sunResetBtn) {
        sunResetBtn.addEventListener('click', () => {
            Object.entries(sunSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                sunParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
        });
    }

    // ========================================
    // SPACE PARTICLES CONTROLS UI
    // ========================================
    const particlesControls = document.getElementById('particles-controls');
    const particlesToggle = document.getElementById('particles-toggle');
    const particlesResetBtn = document.getElementById('particles-reset-btn');

    const particlesSlidersConfig = {
        // Focus distance settings
        'particles-focus-distance': { param: 'focusDistance', valueEl: 'particles-focus-distance-value', default: 0.7, decimals: 2 },
        'particles-focus-range': { param: 'focusRange', valueEl: 'particles-focus-range-value', default: 0.15, decimals: 2 },
        'particles-near-blur': { param: 'nearBlurDist', valueEl: 'particles-near-blur-value', default: 0.3, decimals: 2 },
        'particles-far-blur': { param: 'farBlurDist', valueEl: 'particles-far-blur-value', default: 1.2, decimals: 2 },
        // Bokeh effect
        'particles-max-blur': { param: 'maxBlurSize', valueEl: 'particles-max-blur-value', default: 25.0, decimals: 1 },
        'particles-aperture': { param: 'apertureSize', valueEl: 'particles-aperture-value', default: 1.0, decimals: 2 },
        'particles-ring-width': { param: 'bokehRingWidth', valueEl: 'particles-ring-width-value', default: 0.5, decimals: 2 },
        'particles-ring-intensity': { param: 'bokehRingIntensity', valueEl: 'particles-ring-intensity-value', default: 0.8, decimals: 2 },
        // Circle quality
        'particles-softness': { param: 'circleSoftness', valueEl: 'particles-softness-value', default: 0.3, decimals: 2 },
        // Appearance
        'particles-size': { param: 'particleSize', valueEl: 'particles-size-value', default: 2.0, decimals: 2 },
        'particles-brightness': { param: 'brightness', valueEl: 'particles-brightness-value', default: 1.0, decimals: 2 },
        'particles-light-falloff': { param: 'lightFalloff', valueEl: 'particles-light-falloff-value', default: 3.0, decimals: 2 }
    };

    // Shooting star sliders config
    const shootingStarSlidersConfig = {
        'shooting-chance': { param: 'chance', valueEl: 'shooting-chance-value', default: 0.0003, decimals: 3 },
        'shooting-speed': { param: 'speed', valueEl: 'shooting-speed-value', default: 0.4, decimals: 2 },
        'shooting-duration': { param: 'duration', valueEl: 'shooting-duration-value', default: 0.8, decimals: 2 }
    };

    // Shooting star color pickers config
    const shootingStarColorConfig = {
        'shooting-gold-color': { param: 'goldColor', default: '#e8b923' },
        'shooting-teal-color': { param: 'tealColor', default: '#2dd4bf' }
    };

    // Initialize particles sliders
    Object.entries(particlesSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = spaceParticleParams[config.param];
            valueEl.textContent = spaceParticleParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                spaceParticleParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Initialize shooting star sliders
    Object.entries(shootingStarSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = shootingStarParams[config.param];
            valueEl.textContent = shootingStarParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                shootingStarParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Initialize shooting star color pickers
    Object.entries(shootingStarColorConfig).forEach(([pickerId, config]) => {
        const picker = document.getElementById(pickerId);
        if (picker) {
            picker.value = shootingStarParams[config.param];
            picker.addEventListener('input', () => {
                shootingStarParams[config.param] = picker.value;
            });
        }
    });

    // Initialize base particle color picker
    const baseColorPicker = document.getElementById('particles-base-color');
    if (baseColorPicker) {
        baseColorPicker.value = spaceParticleParams.baseColor;
        baseColorPicker.addEventListener('input', () => {
            spaceParticleParams.baseColor = baseColorPicker.value;
        });
    }

    // Toggle panel
    if (particlesToggle) {
        particlesToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            particlesControls.classList.toggle('active');
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (particlesControls && !particlesControls.contains(e.target)) {
            particlesControls.classList.remove('active');
        }
    });

    // Reset button
    if (particlesResetBtn) {
        particlesResetBtn.addEventListener('click', () => {
            // Reset particle params
            Object.entries(particlesSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                spaceParticleParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset shooting star sliders
            Object.entries(shootingStarSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                shootingStarParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset shooting star colors
            Object.entries(shootingStarColorConfig).forEach(([pickerId, config]) => {
                const picker = document.getElementById(pickerId);
                shootingStarParams[config.param] = config.default;
                if (picker) picker.value = config.default;
            });
            // Reset base particle color
            spaceParticleParams.baseColor = '#fffaf2';
            if (baseColorPicker) baseColorPicker.value = '#fffaf2';
        });
    }

    // ========================================
    // NEBULA BACKGROUND CONTROLS UI
    // ========================================
    const nebulaControls = document.getElementById('nebula-controls');
    const nebulaToggle = document.getElementById('nebula-toggle');
    const nebulaResetBtn = document.getElementById('nebula-reset-btn');

    const nebulaSlidersConfig = {
        'nebula-intensity': { param: 'intensity', valueEl: 'nebula-intensity-value', default: 0.25, decimals: 2 },
        'nebula-scale': { param: 'scale', valueEl: 'nebula-scale-value', default: 2.0, decimals: 2 },
        'nebula-detail': { param: 'detail', valueEl: 'nebula-detail-value', default: 2.0, decimals: 2 },
        'nebula-speed': { param: 'speed', valueEl: 'nebula-speed-value', default: 0.08, decimals: 2 },
        'nebula-color-variation': { param: 'colorVariation', valueEl: 'nebula-color-variation-value', default: 0.8, decimals: 2 },
        'nebula-dust-density': { param: 'dustDensity', valueEl: 'nebula-dust-density-value', default: 0.4, decimals: 2 },
        'nebula-star-density': { param: 'starDensity', valueEl: 'nebula-star-density-value', default: 0.25, decimals: 2 },
        'nebula-light-influence': { param: 'lightInfluence', valueEl: 'nebula-light-influence-value', default: 0.4, decimals: 2 },
        'nebula-fractal-intensity': { param: 'fractalIntensity', valueEl: 'nebula-fractal-intensity-value', default: 0.15, decimals: 2 },
        'nebula-fractal-scale': { param: 'fractalScale', valueEl: 'nebula-fractal-scale-value', default: 8.0, decimals: 1 },
        'nebula-fractal-speed': { param: 'fractalSpeed', valueEl: 'nebula-fractal-speed-value', default: 0.03, decimals: 3 },
        'nebula-fractal-saturation': { param: 'fractalSaturation', valueEl: 'nebula-fractal-saturation-value', default: 3.0, decimals: 1 },
        'nebula-fractal-falloff': { param: 'fractalFalloff', valueEl: 'nebula-fractal-falloff-value', default: 3.0, decimals: 1 },
        'nebula-vignette': { param: 'vignetteStrength', valueEl: 'nebula-vignette-value', default: 0.3, decimals: 2 }
    };

    // Nebula color picker config
    const nebulaColorConfig = {
        'nebula-color-purple': { param: 'colorPurple', default: [0.12, 0.04, 0.18] },
        'nebula-color-cyan': { param: 'colorCyan', default: [0.04, 0.12, 0.20] },
        'nebula-color-blue': { param: 'colorBlue', default: [0.03, 0.06, 0.15] },
        'nebula-color-gold': { param: 'colorGold', default: [0.15, 0.10, 0.03] }
    };

    // Initialize nebula sliders
    Object.entries(nebulaSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = nebulaParams[config.param];
            valueEl.textContent = nebulaParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                nebulaParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Helper to convert RGB array (0-1) to hex
    function rgbToHex(rgb) {
        const r = Math.round(rgb[0] * 255);
        const g = Math.round(rgb[1] * 255);
        const b = Math.round(rgb[2] * 255);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // Helper to convert hex to RGB array (0-1)
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [0, 0, 0];
    }

    // Initialize nebula color pickers
    Object.entries(nebulaColorConfig).forEach(([pickerId, config]) => {
        const picker = document.getElementById(pickerId);
        if (picker) {
            picker.value = rgbToHex(nebulaParams[config.param]);
            picker.addEventListener('input', () => {
                nebulaParams[config.param] = hexToRgb(picker.value);
            });
        }
    });

    // Toggle panel
    if (nebulaToggle) {
        nebulaToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            nebulaControls.classList.toggle('active');
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (nebulaControls && !nebulaControls.contains(e.target)) {
            nebulaControls.classList.remove('active');
        }
    });

    // Reset button
    if (nebulaResetBtn) {
        nebulaResetBtn.addEventListener('click', () => {
            // Reset sliders
            Object.entries(nebulaSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                nebulaParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset color pickers
            Object.entries(nebulaColorConfig).forEach(([pickerId, config]) => {
                const picker = document.getElementById(pickerId);
                nebulaParams[config.param] = [...config.default];
                if (picker) picker.value = rgbToHex(config.default);
            });
        });
    }

    // ========================================
    // DEBUG QUAD CONTROLS UI
    // ========================================
    const debugControls = document.getElementById('debug-controls');
    const debugToggle = document.getElementById('debug-toggle');
    const debugEnableCheckbox = document.getElementById('debug-quad-enable');

    // Enable checkbox
    if (debugEnableCheckbox) {
        debugEnableCheckbox.checked = showDebugQuads;
        debugEnableCheckbox.addEventListener('change', () => {
            showDebugQuads = debugEnableCheckbox.checked;
        });
    }

    // Toggle panel
    if (debugToggle) {
        debugToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            debugControls.classList.toggle('active');
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (debugControls && !debugControls.contains(e.target)) {
            debugControls.classList.remove('active');
        }
    });

    // ========================================
    // GOD RAYS CONTROLS UI
    // ========================================
    const godraysControls = document.getElementById('godrays-controls');
    const godraysToggle = document.getElementById('godrays-toggle');
    const godraysResetBtn = document.getElementById('godrays-reset-btn');

    const godraysSlidersConfig = {
        'godrays-ray-intensity': { param: 'rayIntensity', valueEl: 'godrays-ray-intensity-value', default: 0.5, decimals: 2 },
        'godrays-ray-falloff': { param: 'rayFalloff', valueEl: 'godrays-ray-falloff-value', default: 4.0, decimals: 2 },
        'godrays-glow-intensity': { param: 'glowIntensity', valueEl: 'godrays-glow-intensity-value', default: 0.5, decimals: 2 },
        'godrays-glow-size': { param: 'glowSize', valueEl: 'godrays-glow-size-value', default: 4.0, decimals: 2 },
        'godrays-fog-density': { param: 'fogDensity', valueEl: 'godrays-fog-density-value', default: 6.0, decimals: 2 },
        'godrays-ambient-fog': { param: 'ambientFog', valueEl: 'godrays-ambient-fog-value', default: 0.08, decimals: 2 },
        'godrays-noise-scale': { param: 'noiseScale', valueEl: 'godrays-noise-scale-value', default: 1.0, decimals: 2 },
        'godrays-noise-octaves': { param: 'noiseOctaves', valueEl: 'godrays-noise-octaves-value', default: 1.0, decimals: 2 },
        'godrays-noise-contrast': { param: 'noiseContrast', valueEl: 'godrays-noise-contrast-value', default: 1.0, decimals: 2 },
        'godrays-anim-speed': { param: 'animSpeed', valueEl: 'godrays-anim-speed-value', default: 1.0, decimals: 2 }
    };

    // Initialize god rays sliders
    Object.entries(godraysSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = godRaysParams[config.param];
            valueEl.textContent = godRaysParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                godRaysParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Toggle panel
    if (godraysToggle) {
        godraysToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            godraysControls.classList.toggle('active');
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (godraysControls && !godraysControls.contains(e.target)) {
            godraysControls.classList.remove('active');
        }
    });

    // Reset button
    if (godraysResetBtn) {
        godraysResetBtn.addEventListener('click', () => {
            Object.entries(godraysSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                godRaysParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
        });
    }

    // ========================================
    // SHADER SETTINGS SAVE/LOAD SYSTEM
    // ========================================
    const SETTINGS_STORAGE_KEY = 'shaderSettings_v1';

    // Collect all current settings
    function getAllSettings() {
        return {
            version: 1,
            timestamp: new Date().toISOString(),
            planetParamsA: { ...planetParamsA },
            planetParamsB: { ...planetParamsB },
            sunParams: { ...sunParams },
            lightParams: { ...lightParams },
            physicsParams: { ...physicsParams },
            spaceParticleParams: { ...spaceParticleParams },
            shootingStarParams: { ...shootingStarParams },
            godRaysParams: { ...godRaysParams },
            nebulaParams: { ...nebulaParams }
        };
    }

    // Apply settings to param objects and update UI
    function applySettings(settings) {
        if (!settings) return;

        // Apply to each param object
        const paramMappings = [
            ['planetParamsA', planetParamsA],
            ['planetParamsB', planetParamsB],
            ['sunParams', sunParams],
            ['lightParams', lightParams],
            ['physicsParams', physicsParams],
            ['spaceParticleParams', spaceParticleParams],
            ['shootingStarParams', shootingStarParams],
            ['godRaysParams', godRaysParams],
            ['nebulaParams', nebulaParams]
        ];

        paramMappings.forEach(([key, paramObj]) => {
            if (settings[key]) {
                Object.keys(settings[key]).forEach(param => {
                    if (param in paramObj) {
                        paramObj[param] = settings[key][param];
                    }
                });
            }
        });

        // Update all sliders to reflect loaded values
        updateAllSliders();
    }

    // Update all slider UI elements to match current param values
    // Uses a mapping approach that doesn't depend on slider config objects
    function updateAllSliders() {
        // Helper to update a slider and its value display
        function updateSlider(sliderId, value, decimals) {
            const slider = document.getElementById(sliderId);
            const valueEl = document.getElementById(sliderId + '-value');
            if (slider && value !== undefined) {
                slider.value = value;
                if (valueEl) {
                    valueEl.textContent = typeof value === 'number' ? value.toFixed(decimals) : value;
                }
            }
        }

        // Planet A sliders
        updateSlider('a-noise-scale', planetParamsA.noiseScale, 1);
        updateSlider('a-terrain-height', planetParamsA.terrainHeight, 1);
        updateSlider('a-atmos-intensity', planetParamsA.atmosIntensity, 1);
        updateSlider('a-atmos-thickness', planetParamsA.atmosThickness, 2);
        updateSlider('a-atmos-power', planetParamsA.atmosPower, 1);
        updateSlider('a-scatter-scale', planetParamsA.scatterScale, 2);
        updateSlider('a-sunset-strength', planetParamsA.sunsetStrength, 2);
        updateSlider('a-ocean-roughness', planetParamsA.oceanRoughness, 2);
        updateSlider('a-sss-intensity', planetParamsA.sssIntensity, 1);
        updateSlider('a-sea-level', planetParamsA.seaLevel, 2);
        updateSlider('a-land-roughness', planetParamsA.landRoughness, 2);
        updateSlider('a-normal-strength', planetParamsA.normalStrength, 2);
        // Scatter color picker
        const scatterColorA = document.getElementById('a-scatter-color');
        if (scatterColorA) scatterColorA.value = planetParamsA.scatterColor;

        // Planet B sliders
        updateSlider('b-noise-scale', planetParamsB.noiseScale, 1);
        updateSlider('b-terrain-height', planetParamsB.terrainHeight, 1);
        updateSlider('b-atmos-intensity', planetParamsB.atmosIntensity, 1);
        updateSlider('b-atmos-thickness', planetParamsB.atmosThickness, 2);
        updateSlider('b-atmos-power', planetParamsB.atmosPower, 1);
        updateSlider('b-scatter-scale', planetParamsB.scatterScale, 2);
        updateSlider('b-sunset-strength', planetParamsB.sunsetStrength, 2);
        updateSlider('b-lava-intensity', planetParamsB.lavaIntensity, 1);
        updateSlider('b-sea-level', planetParamsB.seaLevel, 2);
        updateSlider('b-land-roughness', planetParamsB.landRoughness, 2);
        updateSlider('b-normal-strength', planetParamsB.normalStrength, 2);
        // Scatter color picker
        const scatterColorB = document.getElementById('b-scatter-color');
        if (scatterColorB) scatterColorB.value = planetParamsB.scatterColor;

        // Sun sliders
        updateSlider('sun-core-size', sunParams.coreSize, 2);
        updateSlider('sun-glow-size', sunParams.glowSize, 2);
        updateSlider('sun-glow-intensity', sunParams.glowIntensity, 2);
        updateSlider('sun-corona-intensity', sunParams.coronaIntensity, 2);
        updateSlider('sun-ray-count', sunParams.rayCount, 0);
        updateSlider('sun-ray-intensity', sunParams.rayIntensity, 2);
        updateSlider('sun-ray-length', sunParams.rayLength, 2);
        updateSlider('sun-streamer-count', sunParams.streamerCount, 0);
        updateSlider('sun-streamer-intensity', sunParams.streamerIntensity, 2);
        updateSlider('sun-streamer-length', sunParams.streamerLength, 2);
        updateSlider('sun-halo-ring1-dist', sunParams.haloRing1Dist, 2);
        updateSlider('sun-halo-ring1-intensity', sunParams.haloRing1Intensity, 2);
        updateSlider('sun-halo-ring2-dist', sunParams.haloRing2Dist, 2);
        updateSlider('sun-halo-ring2-intensity', sunParams.haloRing2Intensity, 2);
        updateSlider('sun-flicker-speed', sunParams.flickerSpeed, 1);
        updateSlider('sun-pulse-speed', sunParams.pulseSpeed, 1);
        updateSlider('sun-chromatic-shift', sunParams.chromaticShift, 2);

        // Particles sliders
        updateSlider('particles-focus-distance', spaceParticleParams.focusDistance, 2);
        updateSlider('particles-focus-range', spaceParticleParams.focusRange, 2);
        updateSlider('particles-near-blur', spaceParticleParams.nearBlurDist, 2);
        updateSlider('particles-far-blur', spaceParticleParams.farBlurDist, 2);
        updateSlider('particles-max-blur', spaceParticleParams.maxBlurSize, 1);
        updateSlider('particles-aperture', spaceParticleParams.apertureSize, 2);
        updateSlider('particles-ring-width', spaceParticleParams.bokehRingWidth, 2);
        updateSlider('particles-ring-intensity', spaceParticleParams.bokehRingIntensity, 2);
        updateSlider('particles-softness', spaceParticleParams.circleSoftness, 2);
        updateSlider('particles-size', spaceParticleParams.particleSize, 2);
        updateSlider('particles-brightness', spaceParticleParams.brightness, 2);
        updateSlider('particles-light-falloff', spaceParticleParams.lightFalloff, 2);
        // Particles base color picker
        const particlesBaseColorPicker = document.getElementById('particles-base-color');
        if (particlesBaseColorPicker) particlesBaseColorPicker.value = spaceParticleParams.baseColor;

        // Shooting star sliders
        updateSlider('shooting-chance', shootingStarParams.chance, 3);
        updateSlider('shooting-speed', shootingStarParams.speed, 2);
        updateSlider('shooting-duration', shootingStarParams.duration, 2);
        // Shooting star color pickers
        const shootingGoldPicker = document.getElementById('shooting-gold-color');
        const shootingTealPicker = document.getElementById('shooting-teal-color');
        if (shootingGoldPicker) shootingGoldPicker.value = shootingStarParams.goldColor;
        if (shootingTealPicker) shootingTealPicker.value = shootingStarParams.tealColor;

        // God rays sliders
        updateSlider('godrays-ray-intensity', godRaysParams.rayIntensity, 2);
        updateSlider('godrays-ray-falloff', godRaysParams.rayFalloff, 2);
        updateSlider('godrays-glow-intensity', godRaysParams.glowIntensity, 2);
        updateSlider('godrays-glow-size', godRaysParams.glowSize, 2);
        updateSlider('godrays-fog-density', godRaysParams.fogDensity, 2);
        updateSlider('godrays-ambient-fog', godRaysParams.ambientFog, 2);
        updateSlider('godrays-noise-scale', godRaysParams.noiseScale, 2);
        updateSlider('godrays-noise-octaves', godRaysParams.noiseOctaves, 2);
        updateSlider('godrays-noise-contrast', godRaysParams.noiseContrast, 2);
        updateSlider('godrays-anim-speed', godRaysParams.animSpeed, 2);

        // Nebula sliders
        updateSlider('nebula-intensity', nebulaParams.intensity, 2);
        updateSlider('nebula-scale', nebulaParams.scale, 2);
        updateSlider('nebula-detail', nebulaParams.detail, 2);
        updateSlider('nebula-speed', nebulaParams.speed, 2);
        updateSlider('nebula-color-variation', nebulaParams.colorVariation, 2);
        updateSlider('nebula-dust-density', nebulaParams.dustDensity, 2);
        updateSlider('nebula-star-density', nebulaParams.starDensity, 2);
        updateSlider('nebula-light-influence', nebulaParams.lightInfluence, 2);
        updateSlider('nebula-fractal-intensity', nebulaParams.fractalIntensity, 2);
        updateSlider('nebula-fractal-scale', nebulaParams.fractalScale, 1);
        updateSlider('nebula-fractal-speed', nebulaParams.fractalSpeed, 3);
        updateSlider('nebula-fractal-saturation', nebulaParams.fractalSaturation, 1);
        updateSlider('nebula-fractal-falloff', nebulaParams.fractalFalloff, 1);
        updateSlider('nebula-vignette', nebulaParams.vignetteStrength, 2);

        // Light params sliders (intensity, attenuation, ambient, fog)
        updateSlider('intensity-slider-0', lightParams.light0Intensity, 1);
        updateSlider('intensity-slider-1', lightParams.light1Intensity, 1);
        updateSlider('intensity-slider-2', lightParams.light2Intensity, 1);
        updateSlider('attenuation-slider-0', lightParams.light0Attenuation, 2);
        updateSlider('attenuation-slider-1', lightParams.light1Attenuation, 2);
        updateSlider('attenuation-slider-2', lightParams.light2Attenuation, 2);
        updateSlider('ambient-slider', lightParams.ambientIntensity, 2);
        updateSlider('fog-slider', lightParams.fogIntensity, 2);

        // Orbital system sliders
        updateSlider('orbit-speed', orbitParams.orbitSpeed, 2);
        updateSlider('sun-spread', orbitParams.sunSpread, 2);
        updateSlider('sun-spawn-min', orbitParams.sunSpawnMin, 2);
        updateSlider('sun-spawn-max', orbitParams.sunSpawnMax, 2);
        updateSlider('moon-orbit-radius', orbitParams.moonOrbitRadius, 2);
        updateSlider('moon-orbit-spacing', orbitParams.moonOrbitSpacing, 2);
        updateSlider('moon-orbit-tilt', orbitParams.moonOrbitTilt, 2);
        updateSlider('base-orbit-min', orbitParams.baseOrbitMin, 3);
        updateSlider('base-orbit-max', orbitParams.baseOrbitMax, 3);
        updateSlider('spawn-offset', orbitParams.spawnOffset, 2);
        updateSlider('submoon-orbit-radius', orbitParams.subMoonOrbitRadius, 2);
        updateSlider('submoon-speed', orbitParams.subMoonSpeed, 2);
        updateSlider('submoon-size', orbitParams.subMoonSize, 2);
        updateSlider('orbit-line-opacity', orbitParams.orbitLineOpacity, 2);
        updateSlider('orbit-line-width', orbitParams.orbitLineWidth, 2);
        updateSlider('camera-rot-speed', orbitParams.cameraRotSpeed, 2);
        updateSlider('show-orbits', orbitParams.showOrbits, 0);
        // Show orbits toggle value display
        const showOrbitsValueEl = document.getElementById('show-orbits-value');
        if (showOrbitsValueEl) showOrbitsValueEl.textContent = orbitParams.showOrbits >= 1 ? 'ON' : 'OFF';

        // Kelvin sliders (also update node colors)
        updateLightFromKelvin(0, lightParams.light0Kelvin);
        updateLightFromKelvin(1, lightParams.light1Kelvin);
        updateLightFromKelvin(2, lightParams.light2Kelvin);
    }

    // Save to localStorage
    function saveToLocalStorage() {
        try {
            const settings = getAllSettings();
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }

    // Load from localStorage
    function loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
                applySettings(settings);
                return true;
            }
        } catch (e) {
            console.warn('Failed to load settings from localStorage:', e);
        }
        return false;
    }

    // Export settings to JSON file
    function exportSettings() {
        const settings = getAllSettings();
        const json = JSON.stringify(settings, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shader-preset-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import settings from JSON file
    function importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const settings = JSON.parse(event.target.result);
                    applySettings(settings);
                    saveToLocalStorage(); // Auto-save after import
                    console.log('Settings imported successfully');
                } catch (err) {
                    console.error('Failed to parse settings file:', err);
                    alert('Invalid settings file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // Auto-save on any slider change (debounced)
    let saveTimeout = null;
    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToLocalStorage, 500);
    }

    // Attach auto-save to all sliders (all slider classes)
    document.querySelectorAll('.render-slider, .kelvin-slider, .light-property-slider, .physics-slider').forEach(slider => {
        slider.addEventListener('input', debouncedSave);
    });

    // Attach auto-save to color pickers
    document.querySelectorAll('input[type="color"]').forEach(picker => {
        picker.addEventListener('input', debouncedSave);
    });

    // Create and inject export/import buttons
    function createSettingsButtons() {
        // Find all control panels and add buttons
        const panels = [
            { controls: 'sun-controls', resetBtn: 'sun-reset-btn' },
            { controls: 'godrays-controls', resetBtn: 'godrays-reset-btn' },
            { controls: 'particles-controls', resetBtn: 'particles-reset-btn' },
            { controls: 'nebula-controls', resetBtn: 'nebula-reset-btn' }
        ];

        panels.forEach(panel => {
            const resetBtn = document.getElementById(panel.resetBtn);
            if (resetBtn) {
                // Create button container
                const btnContainer = document.createElement('div');
                btnContainer.className = 'settings-btn-container';
                btnContainer.style.cssText = 'display:flex;gap:6px;margin-top:8px;';

                const exportBtn = document.createElement('button');
                exportBtn.className = 'render-reset-btn';
                exportBtn.textContent = 'Export All';
                exportBtn.style.cssText = 'flex:1;font-size:10px;';
                exportBtn.addEventListener('click', exportSettings);

                const importBtn = document.createElement('button');
                importBtn.className = 'render-reset-btn';
                importBtn.textContent = 'Import';
                importBtn.style.cssText = 'flex:1;font-size:10px;';
                importBtn.addEventListener('click', importSettings);

                btnContainer.appendChild(exportBtn);
                btnContainer.appendChild(importBtn);

                // Insert after reset button
                resetBtn.parentNode.insertBefore(btnContainer, resetBtn.nextSibling);
            }
        });
    }

    // Initialize: load saved settings and create buttons
    loadFromLocalStorage();
    createSettingsButtons();

    animate();
})();

// ============================================
// COUNTING ANIMATION FOR STATS
// ============================================
(function initStats() {
    const stats = document.querySelectorAll('.stat-number[data-target]');
    stats.forEach((stat, index) => {
        const target = parseInt(stat.dataset.target);
        const suffix = stat.dataset.suffix || '';
        let current = 0;
        const duration = 1500;
        const startDelay = 600 + index * 200;
        const stepTime = duration / target;

        setTimeout(() => {
            const interval = setInterval(() => {
                current++;
                stat.textContent = current + (current === target ? suffix : '');
                if (current >= target) clearInterval(interval);
            }, stepTime);
        }, startDelay);
    });
})();

// ============================================
// STAGGERED REVEAL ANIMATIONS
// ============================================
(function initAnimations() {
    document.querySelectorAll('.client-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.08}s`; });
    document.querySelectorAll('.testimonial-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.15}s`; });
    document.querySelectorAll('.project-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.12}s`; });
})();

// ============================================
// 3D CURVED PORTFOLIO CAROUSEL
// ============================================
(function initPortfolio() {
    const items = document.querySelectorAll('.portfolio-item');
    const prevBtn = document.querySelector('.portfolio-nav.prev');
    const nextBtn = document.querySelector('.portfolio-nav.next');
    const titleEl = document.getElementById('portfolio-title');
    const linkEl = document.getElementById('portfolio-link');
    const dotsContainer = document.getElementById('portfolio-dots');
    const scene = document.querySelector('.portfolio-scene');

    if (!items.length) return;

    let currentIndex = 0;
    const totalItems = items.length;
    const visibleItems = 5;

    items.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'portfolio-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('.portfolio-dot');

    function updateCarousel() {
        const isMobile = cachedWindowWidth <= 900;
        if (isMobile) {
            items.forEach((item) => { item.style.transform = ''; item.style.opacity = ''; item.style.zIndex = ''; item.style.pointerEvents = ''; });
            return;
        }

        items.forEach((item, i) => {
            let offset = i - currentIndex;
            if (offset > totalItems / 2) offset -= totalItems;
            if (offset < -totalItems / 2) offset += totalItems;
            const absOffset = Math.abs(offset);

            if (absOffset > Math.floor(visibleItems / 2)) {
                item.style.opacity = '0';
                item.style.pointerEvents = 'none';
                item.style.transform = `translate(-50%, -50%) translateX(${offset * 300}px) translateZ(-500px) scale(0.5)`;
                return;
            }

            const angle = offset * 25;
            const translateX = offset * 180;
            const translateZ = -absOffset * 150;
            const scale = 1 - absOffset * 0.15;
            const opacity = 1 - absOffset * 0.3;

            item.style.transform = `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${-angle}deg) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = visibleItems - absOffset;
            item.style.pointerEvents = offset === 0 ? 'auto' : 'none';
            item.classList.toggle('active', offset === 0);
        });

        const activeItem = items[currentIndex];
        if (titleEl) titleEl.textContent = activeItem.dataset.title;
        if (linkEl) { linkEl.href = activeItem.dataset.url; linkEl.style.display = activeItem.dataset.url ? '' : 'none'; }
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }

    function goToSlide(index) {
        if (index < 0) index = totalItems - 1;
        if (index >= totalItems) index = 0;
        currentIndex = index;
        updateCarousel();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            if (i === currentIndex) window.open(item.dataset.url, '_blank');
            else goToSlide(i);
        });
    });

    document.addEventListener('keydown', (e) => {
        const portfolioPanel = document.getElementById('panel-portfolio');
        if (!portfolioPanel || !portfolioPanel.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    });

    let touchStartX = 0;
    if (scene) {
        scene.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        scene.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) goToSlide(currentIndex + (diff > 0 ? 1 : -1));
        }, { passive: true });
        scene.addEventListener('wheel', (e) => { e.preventDefault(); goToSlide(currentIndex + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    }

    let resizeTimeout;
    window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(updateCarousel, 100); });
    updateCarousel();
})();

// ============================================
// TYPEWRITER EFFECT WITH TYPOS
// ============================================
(function initTypewriter() {
    const container = document.getElementById('typewriter-container');
    const typingIndicator = document.getElementById('typing-indicator');
    const dots = typingIndicator ? typingIndicator.querySelectorAll('.typing-dots span') : [];
    if (!container) return;

    const fullText = [
        { text: 'I run ', highlight: false },
        { text: 'Zylaris Ltd', highlight: true },
        { text: ', a specialized consultancy delivering high-performance graphics solutions for games, VR, and immersive installations. From ', highlight: false },
        { text: 'GPU-based light baking', highlight: true },
        { text: ' using SDFs to ', highlight: false },
        { text: '16K projection-mapped environments', highlight: true },
        { text: ', I help studios push the boundaries of real-time rendering across mobile, desktop, VR, and web platforms. I\'ve shipped graphics systems for studios including ', highlight: false },
        { text: 'Nexus', highlight: true },
        { text: ', ', highlight: false },
        { text: 'Ubisoft', highlight: true },
        { text: ', ', highlight: false },
        { text: '22cans', highlight: true },
        { text: ', and ', highlight: false },
        { text: 'The Sandbox', highlight: true },
        { text: '.', highlight: false }
    ];

    const typos = [
        { pos: 15, wrong: 'x', correct: 'c' },
        { pos: 78, wrong: 'f', correct: 'g' },
        { pos: 142, wrong: 'b', correct: 'p' },
        { pos: 245, wrong: 'r', correct: 't' },
    ];

    let cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    container.appendChild(cursor);

    let globalPos = 0, segmentIndex = 0, charIndex = 0, currentSpan = null;
    let typoQueue = [...typos].sort((a, b) => a.pos - b.pos);
    let isDeleting = false, deleteCount = 0, typoChar = null;
    let dotIndex = 0;

    const dotInterval = setInterval(() => {
        if (!dots.length) return;
        dots.forEach((dot, i) => dot.classList.toggle('visible', i < dotIndex));
        dotIndex = (dotIndex + 1) % 4;
    }, 300);

    function getBaseDelay() { return 12 + Math.random() * 18; }

    function finishTyping() {
        cursor.classList.add('hidden');
        if (typingIndicator) typingIndicator.classList.add('hidden');
        clearInterval(dotInterval);
    }

    function type() {
        if (segmentIndex >= fullText.length) { finishTyping(); return; }

        const segment = fullText[segmentIndex];
        if (!currentSpan) {
            currentSpan = document.createElement('span');
            if (segment.highlight) currentSpan.className = 'highlight-text';
            container.insertBefore(currentSpan, cursor);
        }

        const currentTypo = typoQueue[0];
        if (currentTypo && globalPos === currentTypo.pos && !isDeleting && !typoChar) {
            typoChar = document.createElement('span');
            typoChar.className = 'typo-char';
            typoChar.textContent = currentTypo.wrong;
            currentSpan.appendChild(typoChar);
            globalPos++; charIndex++;
            setTimeout(() => { isDeleting = true; deleteCount = 1; setTimeout(type, 80 + Math.random() * 50); }, 120 + Math.random() * 80);
            return;
        }

        if (isDeleting && deleteCount > 0) {
            if (typoChar) { typoChar.remove(); typoChar = null; }
            globalPos--; charIndex--; deleteCount--;
            isDeleting = false; typoQueue.shift();
            setTimeout(type, 50);
            return;
        }

        if (charIndex < segment.text.length) {
            currentSpan.textContent += segment.text[charIndex];
            charIndex++; globalPos++;
            let delay = getBaseDelay();
            const char = segment.text[charIndex - 1];
            if (['.', ',', '!', '?'].includes(char)) delay += 80 + Math.random() * 60;
            else if (char === ' ') delay += Math.random() * 15;
            setTimeout(type, delay);
        } else {
            segmentIndex++; charIndex = 0; currentSpan = null;
            setTimeout(type, getBaseDelay());
        }
    }

    setTimeout(type, 500);
})();

// ============================================
// PROJECT LIST SCROLL HANDLER
// ============================================
(function initProjectScroll() {
    const wrapper = document.getElementById('project-list-wrapper');
    const list = document.getElementById('project-list');
    const hint = wrapper ? wrapper.querySelector('.scroll-hint') : null;
    if (!wrapper || !list) return;

    function updateScrollState() {
        const scrollPos = list.scrollTop;
        const maxScroll = list.scrollHeight - list.clientHeight;
        wrapper.classList.remove('scrolled-top', 'scrolled-middle', 'scrolled-end');
        if (scrollPos <= 10) { wrapper.classList.add('scrolled-top'); if (hint) hint.style.opacity = '0.7'; }
        else if (scrollPos >= maxScroll - 10) { wrapper.classList.add('scrolled-end'); if (hint) hint.style.opacity = '0'; }
        else { wrapper.classList.add('scrolled-middle'); if (hint) hint.style.opacity = '0.5'; }
    }

    list.addEventListener('scroll', updateScrollState);
    updateScrollState();
})();

// ============================================
// TABBED CAROUSEL
// ============================================
(function initTabs() {
    const tabs = document.querySelectorAll('.carousel-tab');
    const panels = document.querySelectorAll('.carousel-panel');
    if (!tabs.length || !panels.length) return;

    function triggerPanelAnimations(panel) {
        panel.querySelectorAll('.client-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.08}s`; });
        panel.querySelectorAll('.testimonial-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.15}s`; });
        panel.querySelectorAll('.project-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.12}s`; });
        const portfolioCarousel = panel.querySelector('.portfolio-carousel');
        if (portfolioCarousel) { portfolioCarousel.style.animation = 'none'; portfolioCarousel.offsetHeight; portfolioCarousel.style.animation = ''; }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const panelId = tab.dataset.panel;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            panels.forEach(panel => {
                if (panel.id === `panel-${panelId}`) { panel.classList.add('active'); triggerPanelAnimations(panel); }
                else panel.classList.remove('active');
            });
            if (panelId === 'skills') {
                window.dispatchEvent(new Event('skillsTabActivated'));
                window.dispatchEvent(new Event('resize'));
            }
            // Lazy load portfolio videos when Portfolio tab is activated
            if (panelId === 'portfolio') {
                const portfolioPanel = document.getElementById('panel-portfolio');
                if (portfolioPanel) {
                    portfolioPanel.querySelectorAll('video[data-src]').forEach(video => {
                        if (!video.src || video.src === window.location.href) {
                            video.src = video.dataset.src;
                            video.preload = 'auto';
                            video.load();
                            // Wait for enough data before playing
                            video.addEventListener('canplaythrough', () => {
                                video.play().catch(() => {});
                            }, { once: true });
                        }
                    });
                }
            }
        });
    });
})();

// ============================================
// SKILLS VIEW TOGGLE
// ============================================
(function initSkillsToggle() {
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn[data-view]');
    const graphView = document.getElementById('skills-graph-view');
    const listView = document.getElementById('skills-list-view');
    const shaderControls = document.getElementById('shader-controls-container');
    const skillsPanel = document.getElementById('panel-skills');

    if (!viewToggleBtns.length || !graphView || !listView) return;

    // Hide shader controls by default (list view is default)
    if (shaderControls) {
        shaderControls.style.display = 'none';
    }

    // View toggle (graph/list)
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;

            // Update button states
            viewToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle views
            if (view === 'graph') {
                graphView.classList.add('active');
                listView.classList.remove('active');
                // Enable fullscreen mode for graph
                if (skillsPanel) {
                    skillsPanel.classList.add('graph-active');
                }
                // Show shader controls
                if (shaderControls) {
                    shaderControls.style.display = '';
                }
                // Trigger resize for canvas
                window.dispatchEvent(new Event('resize'));
            } else {
                graphView.classList.remove('active');
                listView.classList.add('active');
                // Disable fullscreen mode for list
                if (skillsPanel) {
                    skillsPanel.classList.remove('graph-active');
                }
                // Hide shader controls
                if (shaderControls) {
                    shaderControls.style.display = 'none';
                }
            }
        });
    });
})();

// ============================================
// STATIC FAVICON - STYLIZED "CG" MONOGRAM
// ============================================
(function initFavicon() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const link = document.getElementById('favicon');
    const gold = '#e8b923';
    const darkBg = '#0a0f14';

    // Draw background
    ctx.fillStyle = darkBg;
    ctx.fillRect(0, 0, 32, 32);

    // Draw outer glow
    const glowGradient = ctx.createRadialGradient(16, 16, 8, 16, 16, 16);
    glowGradient.addColorStop(0, 'rgba(232, 185, 35, 0.3)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, 32, 32);

    // Draw hexagon shape
    ctx.beginPath();
    const sides = 6;
    const radius = 12;
    const centerX = 16, centerY = 16;
    for (let i = 0; i < sides; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw "C" letter stylized
    ctx.font = 'bold 14px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = gold;
    ctx.fillText('C', 16, 17);

    // Set favicon
    link.href = canvas.toDataURL('image/png');
})();

// ============================================
// FPS PERFORMANCE COUNTER
// ============================================
(function initFPS() {
    const fpsBadge = document.getElementById('fps-badge');
    const fpsValue = document.getElementById('fps-value');
    if (!fpsBadge || !fpsValue) return;

    let frameCount = 0, lastTime = performance.now(), fps = 60;

    function updateFPS() {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - lastTime;
        if (elapsed >= 500) {
            fps = Math.round((frameCount * 1000) / elapsed);
            frameCount = 0; lastTime = currentTime;
            fpsValue.textContent = fps;
            fpsBadge.classList.remove('good', 'warn', 'bad');
            if (fps >= 50) fpsBadge.classList.add('good');
            else if (fps >= 30) fpsBadge.classList.add('warn');
            else fpsBadge.classList.add('bad');
        }
        requestAnimationFrame(updateFPS);
    }

    requestAnimationFrame(updateFPS);
})();

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

    // Simulation vertex shader - SDF Shape Morphing Particle System
    // Simplified version with 4 shapes for better GPU compatibility
    const simulationVS = `#version 300 es
        precision highp float;

        in vec4 aPosition;
        in float aLife;

        out vec4 vPosition;
        out float vLife;

        uniform float uTime;
        uniform float uDeltaTime;
        uniform vec2 uMouse;
        uniform vec2 uMouseVel;
        uniform float uAttraction;
        uniform float uTurbulence;
        uniform float uSpeed;
        uniform vec2 uResolution;
        uniform float uBurst;
        uniform vec2 uBurstPos;
        uniform int uMode;
        uniform float uMouseDown;

        #define PI 3.14159265359
        #define TAU 6.28318530718

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        // Simple noise
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        vec2 curlNoise(vec2 p, float t) {
            float eps = 0.1;
            float n1 = noise(vec2(p.x, p.y + eps) + t);
            float n2 = noise(vec2(p.x, p.y - eps) + t);
            float n3 = noise(vec2(p.x + eps, p.y) + t);
            float n4 = noise(vec2(p.x - eps, p.y) + t);
            return vec2(n1 - n2, -(n3 - n4));
        }

        // SDF Primitives
        float sdCircle(vec2 p, float r) {
            return length(p) - r;
        }

        float sdBox(vec2 p, vec2 b) {
            vec2 d = abs(p) - b;
            return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        float sdStar(vec2 p, float r) {
            float an = PI / 5.0;
            float en = PI / 2.4;
            vec2 acs = vec2(cos(an), sin(an));
            vec2 ecs = vec2(cos(en), sin(en));
            float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
            p = length(p) * vec2(cos(bn), abs(sin(bn)));
            p -= r * acs;
            p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
            return length(p) * sign(p.x);
        }

        float sdHeart(vec2 p) {
            p.x = abs(p.x);
            if (p.y + p.x > 1.0)
                return length(p - vec2(0.25, 0.75)) - 0.35;
            return length(p - vec2(0.0, 1.0)) * 0.5 - 0.5 + p.y * 0.5;
        }

        vec2 rotate(vec2 p, float a) {
            float c = cos(a), s = sin(a);
            return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        }

        // Get animated SDF - cycles through 4 shapes
        float getSDF(vec2 p, float t) {
            float scale = 0.5 + sin(t * 0.5) * 0.1;
            vec2 rp = rotate(p, t * 0.2);

            float cycleDuration = 6.0;
            float phase = mod(t, cycleDuration * 4.0) / cycleDuration;
            int shape = int(floor(phase));
            float morph = smoothstep(0.7, 1.0, fract(phase));

            float d1, d2;

            if (shape == 0) {
                d1 = sdCircle(p, scale * 0.5);
                d2 = sdStar(rp, scale * 0.5);
            } else if (shape == 1) {
                d1 = sdStar(rp, scale * 0.5);
                d2 = sdHeart(p * 2.0 + vec2(0.0, 0.5)) * 0.3;
            } else if (shape == 2) {
                d1 = sdHeart(p * 2.0 + vec2(0.0, 0.5)) * 0.3;
                d2 = sdBox(rp, vec2(scale * 0.4, scale * 0.4));
            } else {
                d1 = sdBox(rp, vec2(scale * 0.4, scale * 0.4));
                d2 = sdCircle(p, scale * 0.5);
            }

            return mix(d1, d2, morph);
        }

        // Gradient of SDF
        vec2 sdfGradient(vec2 p, float t) {
            float eps = 0.01;
            float d = getSDF(p, t);
            return normalize(vec2(
                getSDF(p + vec2(eps, 0.0), t) - d,
                getSDF(p + vec2(0.0, eps), t) - d
            ) + 0.0001);
        }

        void main() {
            vec2 pos = aPosition.xy;
            vec2 vel = aPosition.zw;
            float life = aLife;

            float dt = uDeltaTime * uSpeed;
            vec2 mousePos = uMouse * 2.0 - 1.0;
            vec2 force = vec2(0.0);

            float particleHash = hash(pos + vec2(life));

            // SDF attraction
            float sdf = getSDF(pos, uTime);
            vec2 grad = sdfGradient(pos, uTime);

            // Attract to surface
            force -= grad * sdf * uAttraction * 1.5;

            // Flow along surface
            vec2 tangent = vec2(-grad.y, grad.x);
            float flowDir = particleHash > 0.5 ? 1.0 : -1.0;
            force += tangent * (0.15 + particleHash * 0.1) * flowDir;

            // Noise
            force += curlNoise(pos * 3.0, uTime * 0.3) * uTurbulence * 0.1;

            // Prevent collapse
            if (abs(sdf) < 0.03) {
                force += grad * 0.1 * sign(sdf);
            }

            // Mouse repulsion
            vec2 toMouse = pos - mousePos;
            float mouseDist = length(toMouse);
            float repelRadius = 0.4 + uMouseDown * 0.3;

            if (mouseDist < repelRadius) {
                float str = (1.0 - mouseDist / repelRadius);
                str = str * str * 2.0;
                force += normalize(toMouse + 0.001) * str * (1.0 + uMouseDown * 2.0);
                force += vec2(-toMouse.y, toMouse.x) * str * 0.5;
            }

            // Burst effect
            if (uBurst > 0.0) {
                vec2 burstCenter = uBurstPos * 2.0 - 1.0;
                vec2 fromBurst = pos - burstCenter;
                float burstDist = length(fromBurst);
                if (burstDist < 0.3) {
                    force += normalize(fromBurst + 0.001) * uBurst * (0.3 - burstDist) * 5.0;
                }
            }

            // Physics
            vel += force * dt;
            vel *= 0.96;

            float speed = length(vel);
            if (speed > 0.6) vel = vel / speed * 0.6;

            pos += vel * dt;

            // Boundary
            if (abs(pos.x) > 1.3 || abs(pos.y) > 1.3) {
                float angle = hash(pos + uTime) * TAU;
                pos = vec2(cos(angle), sin(angle)) * (0.3 + hash(pos.yx) * 0.4);
                vel *= 0.1;
            }

            life = mod(life + dt * 0.1 + speed * 0.1, 1.0);

            vPosition = vec4(pos, vel);
            vLife = life;
        }
    `;

    const simulationFS = `#version 300 es
        precision highp float;
        out vec4 fragColor;
        void main() {
            fragColor = vec4(0.0);
        }
    `;

    // Render vertex shader - displays particles with enhanced visuals
    const renderVS = `#version 300 es
        precision highp float;
        precision highp int;

        in vec4 aPosition;
        in float aLife;

        out float vLife;
        out float vSpeed;
        out vec2 vVelocity;
        out vec2 vPosition;

        uniform vec2 uResolution;
        uniform float uHue;
        uniform int uMode;

        void main() {
            vec2 pos = aPosition.xy;
            vec2 vel = aPosition.zw;

            vLife = aLife;
            vSpeed = length(vel);
            vVelocity = vel;
            vPosition = pos;

            // Adjust for aspect ratio
            float aspect = uResolution.x / uResolution.y;
            vec2 adjusted = pos;
            adjusted.x /= aspect;

            gl_Position = vec4(adjusted, 0.0, 1.0);

            // Size based on velocity - particles on surface are slightly larger
            gl_PointSize = 1.2 + vSpeed * 3.5;
        }
    `;

    const renderFS = `#version 300 es
        precision highp float;
        precision highp int;

        in float vLife;
        in float vSpeed;
        in vec2 vVelocity;
        in vec2 vPosition;

        uniform float uHue;
        uniform float uTime;
        uniform int uMode;

        out vec4 fragColor;

        #define PI 3.14159265359
        #define TAU 6.28318530718

        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        // Beautiful gradient palettes
        vec3 palette1(float t) {
            // Sunset/fire palette
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 0.7, 0.4);
            vec3 d = vec3(0.0, 0.15, 0.2);
            return a + b * cos(TAU * (c * t + d));
        }

        vec3 palette2(float t) {
            // Ocean/aurora palette
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 1.0, 1.0);
            vec3 d = vec3(0.3, 0.2, 0.2);
            return a + b * cos(TAU * (c * t + d));
        }

        vec3 palette3(float t) {
            // Neon cyberpunk palette
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(2.0, 1.0, 0.0);
            vec3 d = vec3(0.5, 0.2, 0.25);
            return a + b * cos(TAU * (c * t + d));
        }

        void main() {
            vec2 coord = gl_PointCoord * 2.0 - 1.0;
            float r = length(coord);
            if (r > 1.0) discard;

            // Soft glowing particle
            float core = 1.0 - smoothstep(0.0, 0.3, r);
            float glow = 1.0 - smoothstep(0.2, 1.0, r);
            float alpha = mix(glow * 0.5, 1.0, core);

            // Position-based coloring
            float posAngle = atan(vPosition.y, vPosition.x) / TAU + 0.5;
            float distFromCenter = length(vPosition);
            float velAngle = atan(vVelocity.y, vVelocity.x) / TAU + 0.5;

            // Time-varying palette cycling
            float cycleDuration = 64.0; // Match shape cycle
            float palettePhase = mod(uTime / cycleDuration, 1.0);

            // Base color from position angle for rainbow flow along shapes
            float baseHue = uHue / 360.0;
            float colorPhase = posAngle + vLife * 0.3 + uTime * 0.05 + baseHue;

            // Mix between palettes based on time
            vec3 col1 = palette1(colorPhase);
            vec3 col2 = palette2(colorPhase + 0.1);
            vec3 col3 = palette3(colorPhase + 0.2);

            float paletteMix = sin(uTime * 0.2) * 0.5 + 0.5;
            float paletteMix2 = sin(uTime * 0.15 + 1.0) * 0.5 + 0.5;

            vec3 col = mix(mix(col1, col2, paletteMix), col3, paletteMix2 * 0.5);

            // Add speed-based brightness and hue shift
            col *= 0.6 + vSpeed * 1.2;

            // Fast particles get white-hot core
            if (vSpeed > 0.2) {
                float heat = (vSpeed - 0.2) * 2.0;
                col = mix(col, vec3(1.0, 0.95, 0.85), heat * core);
            }

            // Subtle shimmer based on velocity direction
            float shimmer = sin(velAngle * TAU * 4.0 + uTime * 5.0) * 0.15 + 0.85;
            col *= shimmer;

            // Distance-based saturation - particles near center are brighter
            col *= 0.8 + (1.0 - min(distFromCenter, 1.0)) * 0.4;

            // Pulsing glow synchronized with shape breathing
            float breathe = sin(uTime * 0.5) * 0.1 + 0.9;
            col *= breathe;

            // Core highlight
            col += vec3(1.0, 0.98, 0.95) * core * 0.3;

            // Alpha based on speed and life
            alpha *= 0.5 + vSpeed * 0.4 + vLife * 0.1;

            fragColor = vec4(col, alpha);
        }
    `;

    // ============================================
    // FULLSCREEN SHADER EFFECTS (WebGL 1/2)
    // ============================================
    const shaderSources = {
        voronoi: `
            precision highp float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            uniform float uSpeed;
            uniform float uScale;
            uniform float uIntensity;
            uniform float uHue;

            vec2 hash2(vec2 p) {
                return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
            }

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / uResolution;
                vec2 p = uv * 8.0 * uScale;
                float t = uTime * uSpeed;

                vec2 n = floor(p);
                vec2 f = fract(p);

                float md = 8.0;
                vec2 mg;

                for (int j = -1; j <= 1; j++) {
                    for (int i = -1; i <= 1; i++) {
                        vec2 g = vec2(float(i), float(j));
                        vec2 o = hash2(n + g);
                        o = 0.5 + 0.5 * sin(t + 6.2831 * o);
                        vec2 r = g + o - f;
                        float d = dot(r, r);
                        if (d < md) {
                            md = d;
                            mg = r;
                        }
                    }
                }

                float cellDist = sqrt(md);

                vec2 m = uMouse;
                float mouseDist = length(uv - m);
                float mouseInfluence = smoothstep(0.3, 0.0, mouseDist);

                float hue = fract(cellDist * uIntensity + t * 0.1 + uHue / 360.0);
                float sat = 0.7 + mouseInfluence * 0.3;
                float val = 0.3 + cellDist * 0.7;

                vec3 col = hsv2rgb(vec3(hue, sat, val));
                col += vec3(0.9, 0.7, 0.1) * mouseInfluence * 0.3;

                gl_FragColor = vec4(col, 1.0);
            }
        `,
        raymarching: `
            precision highp float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            uniform float uSpeed;
            uniform float uScale;
            uniform float uIntensity;
            uniform float uHue;

            float sdSphere(vec3 p, float r) { return length(p) - r; }
            float sdBox(vec3 p, vec3 b) { vec3 d = abs(p) - b; return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0)); }

            mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

            float scene(vec3 p) {
                float t = uTime * uSpeed;
                p.xz *= rot(t * 0.3);
                p.xy *= rot(t * 0.2);

                vec3 q = p;
                q = mod(q + 2.0, 4.0) - 2.0;

                float sphere = sdSphere(q, 0.8 * uScale);
                float box = sdBox(q, vec3(0.5 * uScale));

                return mix(sphere, box, sin(t) * 0.5 + 0.5);
            }

            vec3 getNormal(vec3 p) {
                vec2 e = vec2(0.001, 0.0);
                return normalize(vec3(
                    scene(p + e.xyy) - scene(p - e.xyy),
                    scene(p + e.yxy) - scene(p - e.yxy),
                    scene(p + e.yyx) - scene(p - e.yyx)
                ));
            }

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

                vec2 m = (uMouse - 0.5) * 2.0;

                vec3 ro = vec3(0.0, 0.0, -5.0);
                vec3 rd = normalize(vec3(uv + m * 0.3, 1.0));

                float t = 0.0;
                float d;
                vec3 p;

                for (int i = 0; i < 64; i++) {
                    p = ro + rd * t;
                    d = scene(p);
                    if (d < 0.001 || t > 20.0) break;
                    t += d;
                }

                vec3 col = vec3(0.02, 0.04, 0.06);

                if (d < 0.001) {
                    vec3 n = getNormal(p);
                    vec3 light = normalize(vec3(1.0, 1.0, -1.0));
                    float diff = max(dot(n, light), 0.0);
                    float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 32.0);

                    float hue = fract(t * 0.05 + uHue / 360.0);
                    vec3 baseCol = hsv2rgb(vec3(hue, 0.7, 0.9));

                    col = baseCol * (diff * uIntensity + 0.2) + vec3(1.0) * spec * 0.5;
                    col *= exp(-t * 0.08);
                }

                gl_FragColor = vec4(col, 1.0);
            }
        `,
        fractal: `
            precision highp float;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            uniform float uSpeed;
            uniform float uScale;
            uniform float uIntensity;
            uniform float uHue;

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
                float t = uTime * uSpeed * 0.5;

                vec2 m = (uMouse - 0.5) * 0.5;
                vec2 c = vec2(-0.8 + m.x, 0.156 + m.y + sin(t * 0.3) * 0.1);

                vec2 z = uv * 2.5 / uScale;

                float iter = 0.0;
                const float maxIter = 100.0;

                for (float i = 0.0; i < maxIter; i++) {
                    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
                    if (dot(z, z) > 4.0) break;
                    iter++;
                }

                float smoothIter = iter - log2(log2(dot(z, z)));
                float normalized = smoothIter / maxIter;

                float hue = fract(normalized * uIntensity + t * 0.1 + uHue / 360.0);
                float sat = 0.8;
                float val = iter < maxIter ? 0.9 : 0.0;

                vec3 col = hsv2rgb(vec3(hue, sat, val));

                float glow = exp(-normalized * 3.0) * 0.5;
                col += vec3(0.9, 0.7, 0.1) * glow;

                gl_FragColor = vec4(col, 1.0);
            }
        `
    };

    const fullscreenVS = isWebGL2 ? `#version 300 es
        in vec2 aPosition;
        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    ` : `
        attribute vec2 aPosition;
        void main() {
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `;

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
