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
    nebula: 0,
    planets: 0,
    particles: 0,
    skillGraph: 0,
    godRays: 0,
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
        this.total = this.nebula + this.planets + this.particles + this.skillGraph + this.godRays;
        this.samples.push(this.total);
        if (this.samples.length > this.maxSamples) this.samples.shift();
        this.average = this.samples.reduce(function(a, b) { return a + b; }, 0) / this.samples.length;
    }
};

// ============================================
// RENDER PARAMETERS (UI-controllable)
// ============================================

// Planet A: Oceanic/Mountain planets (blue/green, water)
var planetParamsA = {
    noiseScale: 2.5,
    terrainHeight: 0,
    atmosIntensity: 0.4,
    atmosThickness: 1.59,
    atmosPower: 42.2,
    scatterColor: '#1d4ad3',
    scatterScale: 20,
    sunsetStrength: 1,
    oceanRoughness: 0.15,
    sssIntensity: 0.3,
    sssWrap: 0.2,
    sssBacklight: 1.4,
    sssColor: '#0d8c7d',
    seaLevel: 0.08,
    landRoughness: 1,
    normalStrength: 0.12
};

// Planet B: Lava/Desert planets (volcanic)
var planetParamsB = {
    noiseScale: 2.3,
    terrainHeight: 0,
    atmosIntensity: 1.2,
    atmosThickness: 1.09,
    atmosPower: 48.2,
    scatterColor: '#8238cc',
    scatterScale: 20,
    sunsetStrength: 0.66,
    lavaIntensity: 2,
    seaLevel: 0.16,
    landRoughness: 1,
    normalStrength: 0.33
};

// Global render params
var renderParams = {
    parallaxStrength: 1.0
};

// Light properties
var lightParams = {
    light0Intensity: 1.4,
    light0Attenuation: 0.03,
    light0Kelvin: 11300,
    light1Intensity: 1,
    light1Attenuation: 0.14,
    light1Kelvin: 2000,
    light2Intensity: 0.8,
    light2Attenuation: 0.04,
    light2Kelvin: 4200,
    ambientIntensity: 0.38,
    fogIntensity: 1.35
};

// Sun/Star halo parameters
var sunParams = {
    coreSize: 0.56,
    glowSize: 0.55,
    glowIntensity: 2,
    coronaIntensity: 0.8,
    rayCount: 24,
    rayIntensity: 1,
    rayLength: 3,
    streamerCount: 11,
    streamerIntensity: 1,
    streamerLength: 3,
    haloRing1Dist: 1.4,
    haloRing1Intensity: 0.15,
    haloRing2Dist: 2.45,
    haloRing2Intensity: 0.15,
    flickerSpeed: 5,
    pulseSpeed: 4,
    chromaticShift: 0
};

// Orbital system parameters
var orbitParams = {
    // Speed & Movement
    orbitSpeed: 0.25,
    cameraRotSpeed: 0.45,
    // Sun positioning
    sunSpread: 0.95,
    sunSpawnMin: 0.27,
    sunSpawnMax: 0.45,
    spawnOffset: -0.06,
    // Moon orbits (planets orbiting suns)
    moonOrbitRadius: 1.5,
    moonOrbitSpacing: 0.85,
    moonOrbitTilt: 0,
    baseOrbitMin: 0.02,
    baseOrbitMax: 0.1,
    // Sub-moons (moons orbiting planets)
    subMoonOrbitRadius: 1,
    subMoonSpeed: 0.9,
    // Size factors
    sunSizeFactor: 1.05,
    planetSizeFactor: 0.3,
    subMoonSize: 0.15,
    // Orbit display
    orbitLineOpacity: 0.08,
    orbitLineWidth: 0.7,
    showOrbits: 1
};

// Per-solar-system parameters (position and orbital tilt)
var solarSystemParams = {
    unity: {
        posX: -0.79, posY: 0.08, posZ: 0,
        tiltX: -0.3, tiltY: -0.4, tiltZ: -0.4
    },
    unreal: {
        posX: 0.35, posY: -0.28, posZ: 0,
        tiltX: -0.4, tiltY: 0.1, tiltZ: 0.05
    },
    graphics: {
        posX: 0, posY: 0.38, posZ: 0,
        tiltX: -0.1, tiltY: 0.25, tiltZ: 0.75
    }
};
window.solarSystemParams = solarSystemParams;

// Legacy alias
var physicsParams = orbitParams;

// Display settings
var showPlanetLabels = true;
var showConnectionLinks = false;

// Global camera rotation
window.globalCameraRotX = 0;
window.globalCameraRotY = 0;
window.globalZoom = 1.0;

// Nebula background parameters
var nebulaParams = {
    intensity: 0.77,
    scale: 0.5,
    detail: 1.1,
    speed: 0.5,
    colorVariation: 2,
    dustDensity: 0,
    starDensity: 0,
    lightInfluence: 0,
    fractalIntensity: 0,
    fractalScale: 13,
    fractalSpeed: 0,
    fractalSaturation: 3.9,
    fractalFalloff: 1,
    vignetteStrength: 0.91,
    edgeFadeSize: 0.15,
    colorPurple: [0.12, 0.04, 0.18],
    colorCyan: [0.04, 0.12, 0.2],
    colorBlue: [0.03, 0.06, 0.15],
    colorGold: [0.15, 0.1, 0.03]
};

// Expose parameter objects globally for settings panel
window.planetParamsA = planetParamsA;
window.planetParamsB = planetParamsB;
window.lightParams = lightParams;
window.sunParams = sunParams;
window.nebulaParams = nebulaParams;
window.orbitParams = orbitParams;

// Render feature toggles (enable/disable individual renderers)
window.renderToggles = {
    nebula: true,           // Nebula background (Three.js)
    planets: true,          // Planet/moon spheres
    suns: true,             // Sun/star rendering
    spaceParticles: true,   // Space dust particles
    godRays: true,          // God rays post-process
    orbits: true            // Orbital path lines
};

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
    'planetParamsA',
    'planetParamsB',
    'sunParams',
    'lightParams',
    'orbitParams',
    'solarSystemParams',
    'spaceParticleParams',
    'godRaysParams',
    'nebulaParams',
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

// Background Nebula Shaders
var backgroundVertexShader = window.BACKGROUND_VERTEX_SHADER;

// Nebula fragment shader (convert vUV to vUv for Three.js)
var nebulaFragmentShaderRaw = window.NEBULA_BACKGROUND_FRAGMENT_SHADER || '';
var backgroundFragmentShader = nebulaFragmentShaderRaw.replace(/vUV/g, 'vUv');

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

if (!window.NEBULA_BACKGROUND_FRAGMENT_SHADER) {
    console.error('Nebula background shader not loaded!');
}
