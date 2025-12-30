// ============================================
// CORE - Global state, parameters, and utilities
// ============================================

// ============================================
// MOBILE DETECTION (for conditional features)
// ============================================
var isMobileDevice = window.innerWidth <= 900;
window.addEventListener('resize', function() {
    isMobileDevice = window.innerWidth <= 900;
}, { passive: true });

// ============================================
// CACHED WINDOW DIMENSIONS (avoid forced reflow)
// ============================================
var cachedWindowWidth = window.innerWidth;
var cachedWindowHeight = window.innerHeight;

window.addEventListener('resize', function() {
    cachedWindowWidth = window.innerWidth;
    cachedWindowHeight = window.innerHeight;
}, { passive: true });

// ============================================
// GLOBAL RENDER TIMING SYSTEM
// ============================================
window.renderTiming = {
    volumetric: 0,
    planets: 0,
    particles: 0,
    skillGraph: 0,
    total: 0,
    samples: [],
    maxSamples: 30,
    average: 0,
    start: function() {
        return performance.now();
    },
    end: function(system, startTime) {
        this[system] = performance.now() - startTime;
    },
    update: function() {
        this.total = this.volumetric + this.planets + this.particles + this.skillGraph;
        this.samples.push(this.total);
        if (this.samples.length > this.maxSamples) this.samples.shift();
        this.average = this.samples.reduce(function(a, b) { return a + b; }, 0) / this.samples.length;
    }
};

// ============================================
// RENDER PARAMETERS (UI-controllable)
// ============================================

// ============================================
// PLANET PARAMETERS - Clean 2-Material PBR System
// ============================================

// Terrain parameters (shared by all planets)
var terrainParams = {
    noiseScale: 2,           // Terrain noise frequency
    seaLevel: -0.5,          // Height threshold for material split
    normalStrength: 0.1      // Normal map strength from height
};
window.terrainParams = terrainParams;

// Material A - Below sea level (water, lava, etc.)
var materialA = {
    baseColor: '#1a5a7a',    // Base albedo color
    roughness: 0.15,         // PBR roughness (0=mirror, 1=diffuse)
    sssColor: '#00aaff',     // Subsurface scattering color
    sssDistance: 1.5         // SSS penetration distance
};
window.materialA = materialA;

// Material B - Above sea level (land, rock, etc.)
var materialB = {
    baseColor: '#4a6b4a',    // Base albedo color
    roughness: 0.7,          // PBR roughness
    sssColor: '#553322',     // Subsurface scattering color
    sssDistance: 0.3         // SSS penetration distance
};
window.materialB = materialB;

// Atmosphere parameters (unchanged)
var atmosParams = {
    intensity: 1.0,
    thickness: 1.82,
    power: 50,
    scatterColor: '#1d4ad3',
    scatterScale: 20,
    sunsetStrength: 1.0
};
window.atmosParams = atmosParams;

// Light properties
var lightParams = {
    light0Intensity: 2,
    light0Attenuation: 0.32,
    light0Kelvin: 11300,
    light1Intensity: 1,
    light1Attenuation: 0.42,
    light1Kelvin: 2200,
    light2Intensity: 1.5,
    light2Attenuation: 0.37,
    light2Kelvin: 4200,
    ambientIntensity: 0.37,
    fogIntensity: 1.08
};

// Sun/Star parameters (simplified)
var sunParams = {
    coreSize: 0.75,
    glowSize: 1.0,
    glowIntensity: 1.0
};

// Orbital system parameters
var orbitParams = {
    // Speed & Movement
    orbitSpeed: 0.75,
    cameraRotSpeed: 0.1,
    // Sun positioning
    sunSpread: 2,
    sunSpawnMin: 0.27,
    sunSpawnMax: 0.45,
    spawnOffset: -0.06,
    // Moon orbits (planets orbiting suns)
    moonOrbitRadius: 1.5,
    moonOrbitSpacing: 1.3,
    moonOrbitTilt: 0.25,
    baseOrbitMin: 0.045,
    baseOrbitMax: 0.2,
    // Sub-moons (moons orbiting planets)
    subMoonOrbitRadius: 0.65,
    subMoonSpeed: 0.9,
    // Size factors
    sunSizeFactor: 1.45,
    planetSizeFactor: 0.7,
    subMoonSize: 0.15,
    // Orbit display
    orbitLineOpacity: 0.06,
    orbitLineWidth: 1,
    showOrbits: 1
};

// Per-solar-system parameters (position and orbital tilt)
var solarSystemParams = {
    unity: {
        posX: -0.79, posY: 0.08, posZ: 0,
        tiltX: -0.25, tiltY: -0.75, tiltZ: 1.05
    },
    unreal: {
        posX: 0.23, posY: -0.1, posZ: 0.26,
        tiltX: -0.9, tiltY: -0.25, tiltZ: 0.05
    },
    graphics: {
        posX: 0, posY: 0.38, posZ: 0,
        tiltX: -0.6, tiltY: 0, tiltZ: -0.45
    }
};
window.solarSystemParams = solarSystemParams;

// Legacy alias
var physicsParams = orbitParams;

// Display settings
var showPlanetLabels = true;

// Global camera rotation
window.globalCameraRotX = 0;
window.globalCameraRotY = 0;
window.globalZoom = 1.0;

// Volumetric light parameters
var volumetricParams = {
    intensity: 0.45,
    falloff: 1.4,
    scale: 7.2,
    saturation: 1.9,
    noiseScale: 3,
    noiseStrength: 1,
    noiseOctaves: 1,
    scatterR: 0,
    scatterG: 0,
    scatterB: 1.9,
    vignetteStrength: 0
};

// Lens ghost parameters (lens flare artifacts)
var lensGhostParams = {
    enabled: true,
    // Appearance
    intensity: 0.03,
    falloff: 0.35,
    anamorphic: 0.0,
    // Shape
    bladeCount: 6,
    roundness: 0.0,
    rotation: 0.0,
    // Color
    tintR: 0.95,
    tintG: 1.0,
    tintB: 1.0,
    // Distribution
    ghostCount: 5,
    ghostSpacing: 0.3,
    ghostSizeBase: 25,
    ghostSizeVariation: 0.4,
    startOffset: 0.5,
    // Edge Fade
    edgeFadeStart: 0.3,
    edgeFadeEnd: 1.0
};

// Post-process parameters
var postProcessParams = {
    // Edge fade
    edgeFadeSize: 0,
    edgeFadePower: 1,
    // Vignette
    vignetteIntensity: 1,
    vignetteRadius: 1.05,
    vignetteSoftness: 0.8,
    // Color grading
    brightness: 1,
    contrast: 1,
    saturation: 1,
    gamma: 1,
    // Color balance (shadows/midtones/highlights)
    shadowsR: 0,
    shadowsG: 0,
    shadowsB: 0,
    highlightsR: 0,
    highlightsG: 0,
    highlightsB: 0,
    // Chromatic aberration
    chromaticAberration: 0.3,
    chromaticOffset: 0.008,
    // Film grain
    grainIntensity: 0,
    grainSize: 0.5,
    // Bloom (multi-pass, anamorphic)
    bloomThreshold: 1,
    bloomIntensity: 0.2,
    bloomRadius: 0.5,
    bloomSoftKnee: 1,
    bloomTint: 0,
    bloomAnamorphic: 1,
    // Sharpen
    sharpenIntensity: 0,
    // Tone mapping
    exposure: 1,
    toneMapping: 1  // 0 = none, 1 = ACES, 2 = Reinhard, 3 = Filmic
};

// Glass panel parameters (Apple LiquidGlass-inspired effect)
var glassParams = {
    // Blur settings
    enabled: true,
    blurRadius: 0.5,           // Blur kernel radius multiplier
    blurPasses: 6,             // Number of blur iterations (more = smoother)
    blurDownscale: 2,          // Downscale factor for blur FBO (2, 4, or 8)

    // Glass material
    cornerRadius: 19,          // Rounded corner radius in pixels
    edgeSoftness: 0.7,         // Edge anti-aliasing
    refractStrength: 20,       // How much edges bend light (lens curvature)
    squircleN: 4,              // Squircle exponent: 2=ellipse, 4=Apple squircle, 8+=more rectangular

    // Glass appearance
    glassOpacity: 0,           // Base glass tint opacity
    glassTintR: 1,             // Glass tint color R
    glassTintG: 1.05,          // Glass tint color G
    glassTintB: 1.05,          // Glass tint color B

    // Effects
    chromaticAberration: 1,    // RGB split amount at edges

    // Edge bevel controls
    edgeWidth: 5,              // How far effects extend from edge (multiplier of corner radius)
    bevelDepth: 1,             // How pronounced the 3D bevel effect is (0-1)

    // Caustics (light focusing through curved edges)
    causticsIntensity: 0.15,   // Brightness of caustic bands (0-2)
    causticsScale: 3,          // Size/width of caustic pattern (0.5-3)

    // Specular highlights (LiquidGlass rim lighting)
    specularIntensity: 0.05,   // Overall specular brightness
    specularSharpness: 128,    // Specular highlight sharpness (higher = tighter highlights)
    fresnelPower: 4.5,         // Fresnel falloff (higher = more edge-focused)

    // Panel padding (pixels added around quad)
    paddingX: 0,
    paddingY: 0,

    // Panel position and scale (centered square quad)
    offsetX: 0,                // Horizontal offset in pixels (negative = left, positive = right)
    offsetY: 0,                // Vertical offset in pixels (negative = up, positive = down)
    scaleX: 1,                 // Horizontal scale multiplier (1 = square base)
    scaleY: 1                  // Vertical scale multiplier (1 = square base)
};

// Space particle parameters
var spaceParticleParams = {
    // Star count
    starCount: 68000,

    // Spawning distance from center (world units)
    startDistance: 4.1,
    endDistance: 71,

    // Appearance
    particleSize: 7,
    brightness: 0.5,

    // Star colors (hex)
    starColorCool: '#91f7f2',
    starColorWarm: '#fef3e1',
    starColorHot: '#febaa9'
};

// Expose parameter objects globally for settings panel
window.lightParams = lightParams;
window.sunParams = sunParams;
window.volumetricParams = volumetricParams;
window.lensGhostParams = lensGhostParams;
window.postProcessParams = postProcessParams;
window.orbitParams = orbitParams;
window.glassParams = glassParams;
window.spaceParticleParams = spaceParticleParams;

// Render feature toggles (enable/disable individual renderers)
window.renderToggles = {
    volumetric: true,       // Volumetric light (screen-space)
    planets: true,          // Planet/moon spheres
    suns: true,             // Sun/star rendering
    spaceParticles: true,   // Space dust particles
    orbits: true            // Orbital path lines
};

// Camera parameters
var cameraParams = {
    moveSpeed: 50,
    orbitSpeed: 0.4,
    rotationSpeed: 0.003,
    smoothing: 12
};
window.cameraParams = cameraParams;

// ============================================
// PERSISTED SETTINGS REGISTRY
// ============================================
// All param objects in this list will be automatically saved/loaded from localStorage
//
// AUTOMATIC PERSISTENCE BY DESIGN:
// The settings panel (settings-panel.js) automatically extracts all param objects
// from its CONTROLS configuration and adds them to this list on init.
// This means adding any new param to the settings panel will automatically persist it.
//
// To manually add persistence for a param object NOT in settings panel:
// 1. Define the object (e.g., var myNewParams = { ... })
// 2. Expose it on window (e.g., window.myNewParams = myNewParams)
// 3. Add its name to this list
window.PERSISTED_PARAM_OBJECTS = [
    'terrainParams',
    'materialA',
    'materialB',
    'atmosParams',
    'sunParams',
    'lightParams',
    'orbitParams',
    'solarSystemParams',
    'spaceParticleParams',
    'volumetricParams',
    'lensGhostParams',
    'postProcessParams',
    'glassParams',
    'renderToggles',
    'cameraParams'
];

// Global light data (shared between skill network and background)
window.globalLights = {
    light0: { x: 0, y: 0, color: [1.0, 0.67, 0.2], intensity: 1.0 },
    light1: { x: 0, y: 0, color: [0.6, 0.3, 0.8], intensity: 1.0 },
    light2: { x: 0, y: 0, color: [0.2, 0.87, 1.0], intensity: 1.0 },
    resolution: { width: 1920, height: 1080 }
};

// ============================================
// SHADER REFERENCES (loaded from external files)
// ============================================

// Background/Volumetric Shaders
var backgroundVertexShader = window.BACKGROUND_VERTEX_SHADER;

// Volumetric light shader (convert vUV to vUv for Three.js if needed)
var volumetricFragmentShaderRaw = window.VOLUMETRIC_LIGHT_FRAGMENT_SHADER || '';
var backgroundFragmentShader = volumetricFragmentShaderRaw.replace(/vUV/g, 'vUv');

// Planet/Sphere WebGL Shaders
var sphereVertexShader = window.PLANET_VERTEX_SHADER;
var sphereFragmentShader = window.PLANET_FRAGMENT_SHADER;
var sunFragmentShader = window.SUN_FRAGMENT_SHADER;

// Debug quad shaders
var debugQuadVertexShader = window.DEBUG_QUAD_VERTEX_SHADER;
var debugQuadFragmentShader = window.DEBUG_QUAD_FRAGMENT_SHADER;

// Space particles shaders
var spaceParticleVertexShader = window.SPACE_PARTICLE_VERTEX_SHADER;
var spaceParticleFragmentShader = window.SPACE_PARTICLE_FRAGMENT_SHADER;

// Verify shaders loaded
if (!sphereVertexShader || !sphereFragmentShader || !sunFragmentShader) {
    console.error('Shaders not loaded! Make sure shader script tags are before main.js');
}

if (!window.VOLUMETRIC_LIGHT_FRAGMENT_SHADER) {
    console.error('Volumetric light shader not loaded!');
}
