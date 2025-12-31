/**
 * NOISE LAB - Noise Algorithm Definitions
 * Configuration and parameter schemas for each noise type
 */

const NoiseAlgorithms = {
    // Perlin Gradient Noise
    perlin: {
        id: 'perlin',
        name: 'Perlin',
        icon: '◊',
        description: 'Classic gradient noise with smooth interpolation',
        shader: 'PERLIN_FRAGMENT_SHADER',
        params: {
            scale: { type: 'range', min: 1, max: 64, default: 8, step: 0.5, label: 'Scale' },
            seed: { type: 'range', min: 0, max: 1000, default: 0, step: 1, label: 'Seed' },
            contrast: { type: 'range', min: 0.1, max: 3, default: 1, step: 0.05, label: 'Contrast' },
            brightness: { type: 'range', min: -0.5, max: 0.5, default: 0, step: 0.01, label: 'Brightness' },
            offsetX: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset X' },
            offsetY: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset Y' }
        },
        getUniforms(params) {
            return {
                u_scale: params.scale,
                u_seed: params.seed,
                u_contrast: params.contrast,
                u_brightness: params.brightness,
                u_offset: [params.offsetX, params.offsetY],
                u_seamless: true
            };
        }
    },

    // Worley (Cellular) Noise
    worley: {
        id: 'worley',
        name: 'Worley',
        icon: '⬡',
        description: 'Cellular noise based on distance to random points',
        shader: 'WORLEY_FRAGMENT_SHADER',
        params: {
            scale: { type: 'range', min: 1, max: 32, default: 6, step: 0.5, label: 'Scale' },
            seed: { type: 'range', min: 0, max: 1000, default: 0, step: 1, label: 'Seed' },
            contrast: { type: 'range', min: 0.1, max: 3, default: 1, step: 0.05, label: 'Contrast' },
            brightness: { type: 'range', min: -0.5, max: 0.5, default: 0, step: 0.01, label: 'Brightness' },
            distanceType: { type: 'select', options: ['F1 (Closest)', 'F2 (Second)', 'F2 - F1'], default: 0, label: 'Distance Type' },
            jitter: { type: 'range', min: 0, max: 1, default: 1, step: 0.01, label: 'Jitter' },
            offsetX: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset X' },
            offsetY: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset Y' }
        },
        getUniforms(params) {
            return {
                u_scale: params.scale,
                u_seed: params.seed,
                u_contrast: params.contrast,
                u_brightness: params.brightness,
                u_offset: [params.offsetX, params.offsetY],
                u_distanceType: params.distanceType,
                u_jitter: params.jitter,
                u_seamless: true
            };
        }
    },

    // FBM (Fractal Brownian Motion)
    fbm: {
        id: 'fbm',
        name: 'FBM',
        icon: '≋',
        description: 'Fractal noise with multiple octaves layered together',
        shader: 'FBM_FRAGMENT_SHADER',
        params: {
            scale: { type: 'range', min: 1, max: 32, default: 4, step: 0.5, label: 'Scale' },
            seed: { type: 'range', min: 0, max: 1000, default: 0, step: 1, label: 'Seed' },
            octaves: { type: 'range', min: 1, max: 8, default: 5, step: 1, label: 'Octaves' },
            lacunarity: { type: 'range', min: 1, max: 4, default: 2, step: 0.1, label: 'Lacunarity' },
            gain: { type: 'range', min: 0.1, max: 1, default: 0.5, step: 0.01, label: 'Gain' },
            amplitude: { type: 'range', min: 0.1, max: 2, default: 0.5, step: 0.01, label: 'Amplitude' },
            contrast: { type: 'range', min: 0.1, max: 3, default: 1, step: 0.05, label: 'Contrast' },
            brightness: { type: 'range', min: -0.5, max: 0.5, default: 0, step: 0.01, label: 'Brightness' },
            offsetX: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset X' },
            offsetY: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset Y' }
        },
        getUniforms(params) {
            return {
                u_scale: params.scale,
                u_seed: params.seed,
                u_octaves: params.octaves,
                u_lacunarity: params.lacunarity,
                u_gain: params.gain,
                u_amplitude: params.amplitude,
                u_contrast: params.contrast,
                u_brightness: params.brightness,
                u_offset: [params.offsetX, params.offsetY],
                u_seamless: true
            };
        }
    },

    // Domain Warp Noise
    warp: {
        id: 'warp',
        name: 'Domain Warp',
        icon: '⌇',
        description: 'FBM with recursive domain warping for organic patterns',
        shader: 'WARP_FRAGMENT_SHADER',
        params: {
            scale: { type: 'range', min: 1, max: 16, default: 4, step: 0.5, label: 'Scale' },
            seed: { type: 'range', min: 0, max: 1000, default: 0, step: 1, label: 'Seed' },
            warpStrength: { type: 'range', min: 0, max: 4, default: 1.5, step: 0.05, label: 'Warp Strength' },
            warpIterations: { type: 'range', min: 1, max: 4, default: 2, step: 1, label: 'Warp Iterations' },
            octaves: { type: 'range', min: 1, max: 6, default: 4, step: 1, label: 'Octaves' },
            lacunarity: { type: 'range', min: 1, max: 4, default: 2, step: 0.1, label: 'Lacunarity' },
            gain: { type: 'range', min: 0.1, max: 1, default: 0.5, step: 0.01, label: 'Gain' },
            contrast: { type: 'range', min: 0.1, max: 3, default: 1, step: 0.05, label: 'Contrast' },
            brightness: { type: 'range', min: -0.5, max: 0.5, default: 0, step: 0.01, label: 'Brightness' },
            offsetX: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset X' },
            offsetY: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset Y' }
        },
        getUniforms(params) {
            return {
                u_scale: params.scale,
                u_seed: params.seed,
                u_warpStrength: params.warpStrength,
                u_warpIterations: params.warpIterations,
                u_octaves: params.octaves,
                u_lacunarity: params.lacunarity,
                u_gain: params.gain,
                u_contrast: params.contrast,
                u_brightness: params.brightness,
                u_offset: [params.offsetX, params.offsetY],
                u_seamless: true
            };
        }
    },

    // Simplex Noise
    simplex: {
        id: 'simplex',
        name: 'Simplex',
        icon: '△',
        description: 'Improved gradient noise with fewer directional artifacts',
        shader: 'SIMPLEX_FRAGMENT_SHADER',
        params: {
            scale: { type: 'range', min: 1, max: 64, default: 8, step: 0.5, label: 'Scale' },
            seed: { type: 'range', min: 0, max: 1000, default: 0, step: 1, label: 'Seed' },
            contrast: { type: 'range', min: 0.1, max: 3, default: 1, step: 0.05, label: 'Contrast' },
            brightness: { type: 'range', min: -0.5, max: 0.5, default: 0, step: 0.01, label: 'Brightness' },
            offsetX: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset X' },
            offsetY: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset Y' }
        },
        getUniforms(params) {
            return {
                u_scale: params.scale,
                u_seed: params.seed,
                u_contrast: params.contrast,
                u_brightness: params.brightness,
                u_offset: [params.offsetX, params.offsetY],
                u_seamless: true
            };
        }
    },

    // Voronoi Noise
    voronoi: {
        id: 'voronoi',
        name: 'Voronoi',
        icon: '◉',
        description: 'Cell-based noise with optional edge highlighting',
        shader: 'VORONOI_FRAGMENT_SHADER',
        params: {
            scale: { type: 'range', min: 1, max: 32, default: 6, step: 0.5, label: 'Scale' },
            seed: { type: 'range', min: 0, max: 1000, default: 0, step: 1, label: 'Seed' },
            jitter: { type: 'range', min: 0, max: 1, default: 1, step: 0.01, label: 'Jitter' },
            showEdges: { type: 'toggle', default: false, label: 'Show Edges' },
            edgeWidth: { type: 'range', min: 0.01, max: 0.3, default: 0.05, step: 0.01, label: 'Edge Width' },
            contrast: { type: 'range', min: 0.1, max: 3, default: 1, step: 0.05, label: 'Contrast' },
            brightness: { type: 'range', min: -0.5, max: 0.5, default: 0, step: 0.01, label: 'Brightness' },
            offsetX: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset X' },
            offsetY: { type: 'range', min: -10, max: 10, default: 0, step: 0.1, label: 'Offset Y' }
        },
        getUniforms(params) {
            return {
                u_scale: params.scale,
                u_seed: params.seed,
                u_jitter: params.jitter,
                u_showEdges: params.showEdges,
                u_edgeWidth: params.edgeWidth,
                u_contrast: params.contrast,
                u_brightness: params.brightness,
                u_offset: [params.offsetX, params.offsetY],
                u_seamless: true
            };
        }
    }
};

// Blend modes
const BlendModes = [
    { id: 0, name: 'Normal' },
    { id: 1, name: 'Multiply' },
    { id: 2, name: 'Screen' },
    { id: 3, name: 'Overlay' },
    { id: 4, name: 'Soft Light' },
    { id: 5, name: 'Hard Light' },
    { id: 6, name: 'Difference' },
    { id: 7, name: 'Exclusion' },
    { id: 8, name: 'Add' },
    { id: 9, name: 'Subtract' },
    { id: 10, name: 'Darken' },
    { id: 11, name: 'Lighten' }
];

// Helper to get default params for a noise type
function getDefaultParams(noiseType) {
    const algo = NoiseAlgorithms[noiseType];
    if (!algo) return {};

    const params = {};
    for (const [key, config] of Object.entries(algo.params)) {
        params[key] = config.default;
    }
    return params;
}

// Export
window.NoiseAlgorithms = NoiseAlgorithms;
window.BlendModes = BlendModes;
window.getDefaultParams = getDefaultParams;
