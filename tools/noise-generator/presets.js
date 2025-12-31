/**
 * NOISE LAB - Preset Library
 * Curated noise configurations for common use cases
 */

const NoisePresets = {
    clouds: {
        name: 'Clouds',
        description: 'Soft, fluffy cloud patterns',
        layers: [
            {
                type: 'fbm',
                name: 'Cloud Base',
                params: {
                    scale: 3,
                    seed: 42,
                    octaves: 6,
                    lacunarity: 2.0,
                    gain: 0.5,
                    amplitude: 0.6,
                    contrast: 1.2,
                    brightness: 0.1,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 0,
                opacity: 1.0,
                visible: true
            },
            {
                type: 'perlin',
                name: 'Cloud Detail',
                params: {
                    scale: 12,
                    seed: 123,
                    contrast: 0.8,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 4, // Soft Light
                opacity: 0.4,
                visible: true
            }
        ]
    },

    marble: {
        name: 'Marble',
        description: 'Veined marble stone texture',
        layers: [
            {
                type: 'warp',
                name: 'Marble Veins',
                params: {
                    scale: 3,
                    seed: 77,
                    warpStrength: 2.5,
                    warpIterations: 3,
                    octaves: 5,
                    lacunarity: 2.2,
                    gain: 0.45,
                    contrast: 1.8,
                    brightness: 0.05,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 0,
                opacity: 1.0,
                visible: true
            },
            {
                type: 'fbm',
                name: 'Surface Variation',
                params: {
                    scale: 8,
                    seed: 200,
                    octaves: 4,
                    lacunarity: 2.0,
                    gain: 0.5,
                    amplitude: 0.3,
                    contrast: 0.6,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 3, // Overlay
                opacity: 0.3,
                visible: true
            }
        ]
    },

    cellular: {
        name: 'Cellular',
        description: 'Organic cell-like patterns',
        layers: [
            {
                type: 'worley',
                name: 'Cells',
                params: {
                    scale: 8,
                    seed: 55,
                    contrast: 1.5,
                    brightness: 0,
                    distanceType: 2, // F2 - F1
                    jitter: 1.0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 0,
                opacity: 1.0,
                visible: true
            },
            {
                type: 'voronoi',
                name: 'Cell Shading',
                params: {
                    scale: 8,
                    seed: 55,
                    jitter: 1.0,
                    showEdges: false,
                    edgeWidth: 0.05,
                    contrast: 0.8,
                    brightness: 0.1,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 4, // Soft Light
                opacity: 0.5,
                visible: true
            }
        ]
    },

    turbulence: {
        name: 'Turbulence',
        description: 'Chaotic fluid-like motion',
        layers: [
            {
                type: 'warp',
                name: 'Turbulent Flow',
                params: {
                    scale: 4,
                    seed: 99,
                    warpStrength: 3.0,
                    warpIterations: 4,
                    octaves: 6,
                    lacunarity: 2.0,
                    gain: 0.5,
                    contrast: 1.4,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 0,
                opacity: 1.0,
                visible: true
            },
            {
                type: 'simplex',
                name: 'Fine Detail',
                params: {
                    scale: 16,
                    seed: 150,
                    contrast: 0.7,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 3, // Overlay
                opacity: 0.35,
                visible: true
            }
        ]
    },

    wood: {
        name: 'Wood',
        description: 'Wood grain rings pattern',
        layers: [
            {
                type: 'warp',
                name: 'Wood Grain',
                params: {
                    scale: 2,
                    seed: 33,
                    warpStrength: 1.0,
                    warpIterations: 2,
                    octaves: 3,
                    lacunarity: 2.5,
                    gain: 0.4,
                    contrast: 2.0,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 0,
                opacity: 1.0,
                visible: true
            },
            {
                type: 'fbm',
                name: 'Grain Variation',
                params: {
                    scale: 20,
                    seed: 88,
                    octaves: 3,
                    lacunarity: 2.0,
                    gain: 0.5,
                    amplitude: 0.4,
                    contrast: 0.5,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 1, // Multiply
                opacity: 0.25,
                visible: true
            }
        ]
    },

    lava: {
        name: 'Lava',
        description: 'Molten volcanic patterns',
        layers: [
            {
                type: 'voronoi',
                name: 'Lava Cracks',
                params: {
                    scale: 5,
                    seed: 666,
                    jitter: 0.9,
                    showEdges: true,
                    edgeWidth: 0.08,
                    contrast: 1.8,
                    brightness: -0.1,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 0,
                opacity: 1.0,
                visible: true
            },
            {
                type: 'warp',
                name: 'Flow Distortion',
                params: {
                    scale: 3,
                    seed: 777,
                    warpStrength: 1.5,
                    warpIterations: 2,
                    octaves: 4,
                    lacunarity: 2.0,
                    gain: 0.5,
                    contrast: 1.0,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 3, // Overlay
                opacity: 0.6,
                visible: true
            },
            {
                type: 'fbm',
                name: 'Heat Shimmer',
                params: {
                    scale: 6,
                    seed: 888,
                    octaves: 5,
                    lacunarity: 2.0,
                    gain: 0.5,
                    amplitude: 0.5,
                    contrast: 0.8,
                    brightness: 0.1,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 2, // Screen
                opacity: 0.3,
                visible: true
            }
        ]
    },

    // Additional presets
    terrain: {
        name: 'Terrain',
        description: 'Heightmap for terrain generation',
        layers: [
            {
                type: 'fbm',
                name: 'Base Terrain',
                params: {
                    scale: 4,
                    seed: 100,
                    octaves: 7,
                    lacunarity: 2.0,
                    gain: 0.5,
                    amplitude: 0.5,
                    contrast: 1.0,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 0,
                opacity: 1.0,
                visible: true
            },
            {
                type: 'worley',
                name: 'Erosion',
                params: {
                    scale: 12,
                    seed: 200,
                    contrast: 0.8,
                    brightness: 0,
                    distanceType: 0,
                    jitter: 0.8,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 1, // Multiply
                opacity: 0.2,
                visible: true
            }
        ]
    },

    fabric: {
        name: 'Fabric',
        description: 'Woven textile texture',
        layers: [
            {
                type: 'perlin',
                name: 'Weave Base',
                params: {
                    scale: 32,
                    seed: 50,
                    contrast: 1.5,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 0,
                opacity: 1.0,
                visible: true
            },
            {
                type: 'fbm',
                name: 'Thread Variation',
                params: {
                    scale: 64,
                    seed: 60,
                    octaves: 3,
                    lacunarity: 2.0,
                    gain: 0.5,
                    amplitude: 0.3,
                    contrast: 0.6,
                    brightness: 0,
                    offsetX: 0,
                    offsetY: 0
                },
                blendMode: 3, // Overlay
                opacity: 0.4,
                visible: true
            }
        ]
    }
};

window.NoisePresets = NoisePresets;
