// ============================================
// CORE - Global state, parameters, and utilities
// ============================================

// ============================================
// MOBILE FULLSCREEN SIMULATION MODE
// ============================================
(function initMobileSimulationMode() {
    const isMobile = window.innerWidth <= 900;
    if (isMobile) {
        document.body.classList.add('mobile-simulation-mode');
    }
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
    noiseScale: 1.8,
    terrainHeight: 0.6,
    atmosIntensity: 0.6,
    atmosThickness: 2.5,
    atmosPower: 37.1,
    scatterColor: '#1a40e6',
    scatterScale: 0.5,
    sunsetStrength: 1.0,
    oceanRoughness: 0.55,
    sssIntensity: 1.0,
    sssWrap: 0.3,
    sssBacklight: 0.5,
    sssColor: '#0d578c',
    seaLevel: 0.0,
    landRoughness: 0.65,
    normalStrength: 0.15
};

// Planet B: Lava/Desert planets (volcanic)
var planetParamsB = {
    noiseScale: 1.8,
    terrainHeight: 0.6,
    atmosIntensity: 0.8,
    atmosThickness: 2.0,
    atmosPower: 25.0,
    scatterColor: '#e63319',
    scatterScale: 0.8,
    sunsetStrength: 0.5,
    lavaIntensity: 3.0,
    seaLevel: 0.0,
    landRoughness: 0.75,
    normalStrength: 0.2
};

// Global render params
var renderParams = {
    parallaxStrength: 1.0
};

// Light properties
var lightParams = {
    light0Intensity: 1.0,
    light0Attenuation: 0.06,
    light0Kelvin: 15000,
    light1Intensity: 1.0,
    light1Attenuation: 0.06,
    light1Kelvin: 2000,
    light2Intensity: 1.0,
    light2Attenuation: 0.06,
    light2Kelvin: 5000,
    ambientIntensity: 0.0,
    fogIntensity: 0.15
};

// Sun/Star halo parameters
var sunParams = {
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

// Orbital system parameters
var orbitParams = {
    // Speed & Movement
    orbitSpeed: 1.0,
    cameraRotSpeed: 1.0,
    // Sun positioning
    sunSpread: 1.0,
    sunSpawnMin: 0.2,
    sunSpawnMax: 0.45,
    spawnOffset: 0.0,
    // Moon orbits (planets orbiting suns)
    moonOrbitRadius: 1.0,
    moonOrbitSpacing: 1.0,
    moonOrbitTilt: 1.0,
    baseOrbitMin: 0.04,
    baseOrbitMax: 0.08,
    // Sub-moons (moons orbiting planets)
    subMoonOrbitRadius: 1.0,
    subMoonSpeed: 1.0,
    // Size factors
    sunSizeFactor: 1.0,
    planetSizeFactor: 1.0,
    subMoonSize: 0.5,
    // Orbit display
    orbitLineOpacity: 0.25,
    orbitLineWidth: 1.0,
    showOrbits: 1.0
};

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
    intensity: 0.25,
    scale: 2.0,
    detail: 2.0,
    speed: 0.08,
    colorVariation: 0.8,
    dustDensity: 0.4,
    starDensity: 0.25,
    lightInfluence: 0.4,
    fractalIntensity: 0.15,
    fractalScale: 8.0,
    fractalSpeed: 0.03,
    fractalSaturation: 3.0,
    fractalFalloff: 3.0,
    vignetteStrength: 0.3,
    colorPurple: [0.12, 0.04, 0.18],
    colorCyan: [0.04, 0.12, 0.20],
    colorBlue: [0.03, 0.06, 0.15],
    colorGold: [0.15, 0.10, 0.03]
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
    'spaceParticleParams',
    'godRaysParams',
    'nebulaParams',
    'renderToggles'
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
} else {
    console.log('Planet and Sun shaders loaded');
}

if (!window.NEBULA_BACKGROUND_FRAGMENT_SHADER) {
    console.error('Nebula background shader not loaded!');
} else {
    console.log('Nebula background shader loaded');
}
