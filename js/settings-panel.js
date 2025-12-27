// ============================================
// UNIFIED SETTINGS PANEL - Blender-style tabbed UI
// ============================================
// Refactored shader controls into a single panel with collapsible sections

(function initSettingsPanel() {
    'use strict';

    // ============================================
    // PANEL CONFIGURATION
    // ============================================
    const TABS = [
        { id: 'planets', label: 'Planets', icon: 'planet' },
        { id: 'lighting', label: 'Lighting', icon: 'sun' },
        { id: 'effects', label: 'Effects', icon: 'sparkle' },
        { id: 'post', label: 'Post', icon: 'layers' },
        { id: 'settings', label: 'Settings', icon: 'settings' }
    ];

    // Control definitions - maps param objects to UI controls
    const CONTROLS = {
        planets: {
            sections: [
                {
                    id: 'planet-a',
                    label: 'Oceanic Planet (A)',
                    icon: 'water',
                    color: '#2dd4bf',
                    toggle: 'planets',  // Links to renderToggles.planets
                    controls: [
                        { type: 'slider', id: 'a-noise-scale', label: 'Noise Scale', param: 'planetParamsA.noiseScale', min: 0.5, max: 4, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'a-terrain-height', label: 'Terrain Height', param: 'planetParamsA.terrainHeight', min: 0, max: 3, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'a-land-roughness', label: 'Land Roughness', param: 'planetParamsA.landRoughness', min: 0.1, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'a-normal-strength', label: 'Normal Strength', param: 'planetParamsA.normalStrength', min: 0, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'a-ocean-roughness', label: 'Ocean Roughness', param: 'planetParamsA.oceanRoughness', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'a-sea-level', label: 'Sea Level', param: 'planetParamsA.seaLevel', min: -0.5, max: 0.5, step: 0.02, decimals: 2 },
                        { type: 'subheader', label: 'Water SSS' },
                        { type: 'slider', id: 'a-sss-intensity', label: 'Intensity', param: 'planetParamsA.sssIntensity', min: 0, max: 3, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'a-sss-wrap', label: 'Wrap', param: 'planetParamsA.sssWrap', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'a-sss-backlight', label: 'Backlight', param: 'planetParamsA.sssBacklight', min: 0, max: 2, step: 0.1, decimals: 1 },
                        { type: 'color', id: 'a-sss-color', label: 'Color', param: 'planetParamsA.sssColor' },
                        { type: 'subheader', label: 'Atmosphere' },
                        { type: 'slider', id: 'a-atmos-intensity', label: 'Brightness', param: 'planetParamsA.atmosIntensity', min: 0, max: 10, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'a-atmos-thickness', label: 'Radius', param: 'planetParamsA.atmosThickness', min: 1, max: 3, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'a-atmos-power', label: 'Density', param: 'planetParamsA.atmosPower', min: 0.1, max: 50, step: 0.1, decimals: 1 },
                        { type: 'color', id: 'a-scatter-color', label: 'Scatter Color', param: 'planetParamsA.scatterColor' },
                        { type: 'slider', id: 'a-scatter-scale', label: 'Scatter Scale', param: 'planetParamsA.scatterScale', min: 0, max: 20, step: 0.1, decimals: 2 },
                        { type: 'slider', id: 'a-sunset-strength', label: 'Sunset', param: 'planetParamsA.sunsetStrength', min: 0, max: 1, step: 0.01, decimals: 2 }
                    ]
                },
                {
                    id: 'planet-b',
                    label: 'Lava Planet (B)',
                    icon: 'fire',
                    color: '#f97316',
                    toggle: 'planets',  // Same toggle as planet-a
                    controls: [
                        { type: 'slider', id: 'b-noise-scale', label: 'Noise Scale', param: 'planetParamsB.noiseScale', min: 0.5, max: 4, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'b-terrain-height', label: 'Terrain Height', param: 'planetParamsB.terrainHeight', min: 0, max: 3, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'b-land-roughness', label: 'Rock Roughness', param: 'planetParamsB.landRoughness', min: 0.1, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'b-normal-strength', label: 'Normal Strength', param: 'planetParamsB.normalStrength', min: 0, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'b-lava-intensity', label: 'Lava Glow', param: 'planetParamsB.lavaIntensity', min: 0, max: 5, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'b-sea-level', label: 'Lava Level', param: 'planetParamsB.seaLevel', min: -0.5, max: 0.5, step: 0.02, decimals: 2 },
                        { type: 'subheader', label: 'Atmosphere' },
                        { type: 'slider', id: 'b-atmos-intensity', label: 'Brightness', param: 'planetParamsB.atmosIntensity', min: 0, max: 10, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'b-atmos-thickness', label: 'Radius', param: 'planetParamsB.atmosThickness', min: 1, max: 3, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'b-atmos-power', label: 'Density', param: 'planetParamsB.atmosPower', min: 0.1, max: 50, step: 0.1, decimals: 1 },
                        { type: 'color', id: 'b-scatter-color', label: 'Scatter Color', param: 'planetParamsB.scatterColor' },
                        { type: 'slider', id: 'b-scatter-scale', label: 'Scatter Scale', param: 'planetParamsB.scatterScale', min: 0, max: 20, step: 0.1, decimals: 2 },
                        { type: 'slider', id: 'b-sunset-strength', label: 'Sunset', param: 'planetParamsB.sunsetStrength', min: 0, max: 1, step: 0.01, decimals: 2 }
                    ]
                }
            ]
        },
        lighting: {
            sections: [
                {
                    id: 'sun-corona',
                    label: 'Stars (Suns)',
                    icon: 'sun',
                    color: '#fbbf24',
                    toggle: 'suns',
                    controls: [
                        { type: 'slider', id: 'sun-core-size', label: 'Core Size', param: 'sunParams.coreSize', min: 0.2, max: 1.0, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'sun-glow-size', label: 'Glow Size', param: 'sunParams.glowSize', min: 0.5, max: 2.0, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'sun-glow-intensity', label: 'Glow Intensity', param: 'sunParams.glowIntensity', min: 0, max: 3, step: 0.1, decimals: 1 }
                    ]
                },
                {
                    id: 'star-lights',
                    label: 'Star Lights',
                    icon: 'lightbulb',
                    color: '#fef3c7',
                    controls: [
                        { type: 'light', id: 0, label: 'Unity', param: 'lightParams' },
                        { type: 'light', id: 1, label: 'Unreal', param: 'lightParams' },
                        { type: 'light', id: 2, label: 'Graphics', param: 'lightParams' },
                        { type: 'subheader', label: 'Global Lighting' },
                        { type: 'slider', id: 'ambient-intensity', label: 'Ambient', param: 'lightParams.ambientIntensity', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'fog-intensity', label: 'Fog', param: 'lightParams.fogIntensity', min: 0, max: 3, step: 0.01, decimals: 2 }
                    ]
                },
                {
                    id: 'orbits',
                    label: 'Orbital Paths',
                    icon: 'orbit',
                    color: '#60a5fa',
                    toggle: 'orbits',
                    controls: [
                        { type: 'slider', id: 'orbit-line-opacity', label: 'Opacity', param: 'orbitParams.orbitLineOpacity', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'orbit-line-width', label: 'Line Width', param: 'orbitParams.orbitLineWidth', min: 0.5, max: 3, step: 0.1, decimals: 1 }
                    ]
                }
            ]
        },
        effects: {
            sections: [
                {
                    id: 'particles',
                    label: 'Stars',
                    icon: 'stars',
                    color: '#a78bfa',
                    toggle: 'spaceParticles',
                    controls: [
                        { type: 'subheader', label: 'Distribution' },
                        { type: 'slider', id: 'stars-count', label: 'Star Count', param: 'spaceParticleParams.starCount', min: 1000, max: 500000, step: 1000, decimals: 0 },
                        { type: 'slider', id: 'stars-start-distance', label: 'Start Distance', param: 'spaceParticleParams.startDistance', min: 0.1, max: 100.0, step: 0.5, decimals: 1 },
                        { type: 'slider', id: 'stars-end-distance', label: 'End Distance', param: 'spaceParticleParams.endDistance', min: 1.0, max: 500.0, step: 1.0, decimals: 1 },
                        { type: 'button', id: 'stars-respawn-btn', label: 'Respawn Stars', action: 'respawnStars' },
                        { type: 'subheader', label: 'Appearance' },
                        { type: 'slider', id: 'particles-size', label: 'Star Size', param: 'spaceParticleParams.particleSize', min: 1, max: 10, step: 0.5, decimals: 1 },
                        { type: 'slider', id: 'particles-brightness', label: 'Brightness', param: 'spaceParticleParams.brightness', min: 0.1, max: 3, step: 0.1, decimals: 1 },
                        { type: 'subheader', label: 'Star Colors' },
                        { type: 'color', id: 'star-color-cool', label: 'Cool Stars', param: 'spaceParticleParams.starColorCool' },
                        { type: 'color', id: 'star-color-warm', label: 'Warm Stars', param: 'spaceParticleParams.starColorWarm' },
                        { type: 'color', id: 'star-color-hot', label: 'Hot Stars', param: 'spaceParticleParams.starColorHot' }
                    ]
                },
                {
                    id: 'volumetric',
                    label: 'Volumetric Light',
                    icon: 'rays',
                    color: '#fcd34d',
                    toggle: 'volumetric',
                    controls: [
                        { type: 'slider', id: 'volumetric-intensity', label: 'Intensity', param: 'volumetricParams.intensity', min: 0, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'volumetric-falloff', label: 'Falloff', param: 'volumetricParams.falloff', min: 0.5, max: 5, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'volumetric-scale', label: 'Scale', param: 'volumetricParams.scale', min: 0.5, max: 10, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'volumetric-saturation', label: 'Saturation', param: 'volumetricParams.saturation', min: 0, max: 3, step: 0.1, decimals: 1 },
                        { type: 'subheader', label: 'Edge Noise' },
                        { type: 'slider', id: 'volumetric-noise-scale', label: 'Scale', param: 'volumetricParams.noiseScale', min: 0.5, max: 12, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'volumetric-noise-strength', label: 'Strength', param: 'volumetricParams.noiseStrength', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'volumetric-noise-octaves', label: 'Octaves', param: 'volumetricParams.noiseOctaves', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Chromatic Scatter' },
                        { type: 'slider', id: 'volumetric-scatter-r', label: 'Red', param: 'volumetricParams.scatterR', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'volumetric-scatter-g', label: 'Green', param: 'volumetricParams.scatterG', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'volumetric-scatter-b', label: 'Blue', param: 'volumetricParams.scatterB', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Post Processing' },
                        { type: 'slider', id: 'volumetric-vignette', label: 'Vignette', param: 'volumetricParams.vignetteStrength', min: 0, max: 1, step: 0.01, decimals: 2 }
                    ]
                },
                {
                    id: 'lens-ghost',
                    label: 'Lens Ghosts',
                    icon: 'sparkle',
                    color: '#f472b6',
                    controls: [
                        { type: 'checkbox', id: 'lens-ghost-enabled', label: 'Enabled', param: 'lensGhostParams.enabled' },
                        { type: 'slider', id: 'lens-ghost-intensity', label: 'Intensity', param: 'lensGhostParams.intensity', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'lens-ghost-falloff', label: 'Softness', param: 'lensGhostParams.falloff', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Aperture Shape' },
                        { type: 'slider', id: 'lens-ghost-blades', label: 'Blade Count', param: 'lensGhostParams.bladeCount', min: 5, max: 8, step: 1, decimals: 0 },
                        { type: 'slider', id: 'lens-ghost-roundness', label: 'Roundness', param: 'lensGhostParams.roundness', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'lens-ghost-rotation', label: 'Rotation', param: 'lensGhostParams.rotation', min: 0, max: 60, step: 5, decimals: 0 },
                        { type: 'slider', id: 'lens-ghost-anamorphic', label: 'Anamorphic', param: 'lensGhostParams.anamorphic', min: -1, max: 1, step: 0.1, decimals: 1 },
                        { type: 'subheader', label: 'Color Tint' },
                        { type: 'slider', id: 'lens-ghost-tint-r', label: 'Tint Red', param: 'lensGhostParams.tintR', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'lens-ghost-tint-g', label: 'Tint Green', param: 'lensGhostParams.tintG', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'lens-ghost-tint-b', label: 'Tint Blue', param: 'lensGhostParams.tintB', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Distribution' },
                        { type: 'slider', id: 'lens-ghost-count', label: 'Ghost Count', param: 'lensGhostParams.ghostCount', min: 1, max: 12, step: 1, decimals: 0 },
                        { type: 'slider', id: 'lens-ghost-spacing', label: 'Spacing', param: 'lensGhostParams.ghostSpacing', min: 0.1, max: 0.6, step: 0.02, decimals: 2 },
                        { type: 'slider', id: 'lens-ghost-offset', label: 'Start Offset', param: 'lensGhostParams.startOffset', min: 0, max: 2, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'lens-ghost-size', label: 'Base Size', param: 'lensGhostParams.ghostSizeBase', min: 10, max: 150, step: 5, decimals: 0 },
                        { type: 'slider', id: 'lens-ghost-size-var', label: 'Size Variation', param: 'lensGhostParams.ghostSizeVariation', min: 0, max: 1, step: 0.1, decimals: 1 },
                        { type: 'subheader', label: 'Edge Fade' },
                        { type: 'slider', id: 'lens-ghost-fade-start', label: 'Fade Start', param: 'lensGhostParams.edgeFadeStart', min: 0.3, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'lens-ghost-fade-end', label: 'Fade End', param: 'lensGhostParams.edgeFadeEnd', min: 0.5, max: 1.5, step: 0.05, decimals: 2 }
                    ]
                }
            ]
        },
        post: {
            sections: [
                {
                    id: 'edge-fade',
                    label: 'Edge Fade',
                    icon: 'layers',
                    color: '#94a3b8',
                    controls: [
                        { type: 'slider', id: 'edge-fade-size', label: 'Fade Size', param: 'postProcessParams.edgeFadeSize', min: 0, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'edge-fade-power', label: 'Fade Power', param: 'postProcessParams.edgeFadePower', min: 0.1, max: 3, step: 0.1, decimals: 1 }
                    ]
                },
                {
                    id: 'vignette',
                    label: 'Vignette',
                    icon: 'sparkle',
                    color: '#6366f1',
                    controls: [
                        { type: 'slider', id: 'vignette-intensity', label: 'Intensity', param: 'postProcessParams.vignetteIntensity', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'vignette-radius', label: 'Radius', param: 'postProcessParams.vignetteRadius', min: 0.2, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'vignette-softness', label: 'Softness', param: 'postProcessParams.vignetteSoftness', min: 0.1, max: 1, step: 0.05, decimals: 2 }
                    ]
                },
                {
                    id: 'color-grading',
                    label: 'Color Grading',
                    icon: 'sliders',
                    color: '#ec4899',
                    controls: [
                        { type: 'slider', id: 'pp-brightness', label: 'Brightness', param: 'postProcessParams.brightness', min: 0.5, max: 2, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'pp-contrast', label: 'Contrast', param: 'postProcessParams.contrast', min: 0.5, max: 2, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'pp-saturation', label: 'Saturation', param: 'postProcessParams.saturation', min: 0, max: 2, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'pp-gamma', label: 'Gamma', param: 'postProcessParams.gamma', min: 0.5, max: 2, step: 0.01, decimals: 2 }
                    ]
                },
                {
                    id: 'color-balance',
                    label: 'Color Balance',
                    icon: 'sun',
                    color: '#f59e0b',
                    controls: [
                        { type: 'subheader', label: 'Shadows Tint' },
                        { type: 'slider', id: 'shadows-r', label: 'Red', param: 'postProcessParams.shadowsR', min: -0.5, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'shadows-g', label: 'Green', param: 'postProcessParams.shadowsG', min: -0.5, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'shadows-b', label: 'Blue', param: 'postProcessParams.shadowsB', min: -0.5, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'subheader', label: 'Highlights Tint' },
                        { type: 'slider', id: 'highlights-r', label: 'Red', param: 'postProcessParams.highlightsR', min: -0.5, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'highlights-g', label: 'Green', param: 'postProcessParams.highlightsG', min: -0.5, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'highlights-b', label: 'Blue', param: 'postProcessParams.highlightsB', min: -0.5, max: 0.5, step: 0.01, decimals: 2 }
                    ]
                },
                {
                    id: 'chromatic-aberration',
                    label: 'Chromatic Aberration',
                    icon: 'sparkle',
                    color: '#8b5cf6',
                    controls: [
                        { type: 'slider', id: 'chromatic-amount', label: 'Amount', param: 'postProcessParams.chromaticAberration', min: 0, max: 3, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'chromatic-offset', label: 'Offset', param: 'postProcessParams.chromaticOffset', min: 0.001, max: 0.02, step: 0.001, decimals: 3 }
                    ]
                },
                {
                    id: 'film-effects',
                    label: 'Film Effects',
                    icon: 'camera',
                    color: '#78716c',
                    controls: [
                        { type: 'subheader', label: 'Film Grain' },
                        { type: 'slider', id: 'grain-intensity', label: 'Intensity', param: 'postProcessParams.grainIntensity', min: 0, max: 0.3, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'grain-size', label: 'Size', param: 'postProcessParams.grainSize', min: 0.5, max: 4, step: 0.1, decimals: 1 },
                        { type: 'subheader', label: 'Sharpen' },
                        { type: 'slider', id: 'sharpen-intensity', label: 'Intensity', param: 'postProcessParams.sharpenIntensity', min: 0, max: 2, step: 0.1, decimals: 1 }
                    ]
                },
                {
                    id: 'bloom',
                    label: 'Bloom',
                    icon: 'rays',
                    color: '#fcd34d',
                    controls: [
                        { type: 'slider', id: 'bloom-intensity', label: 'Intensity', param: 'postProcessParams.bloomIntensity', min: 0, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'bloom-threshold', label: 'Threshold', param: 'postProcessParams.bloomThreshold', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'bloom-radius', label: 'Streak Length', param: 'postProcessParams.bloomRadius', min: 0.5, max: 5, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'bloom-anamorphic', label: 'Anamorphic', param: 'postProcessParams.bloomAnamorphic', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'bloom-soft-knee', label: 'Soft Knee', param: 'postProcessParams.bloomSoftKnee', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'bloom-tint', label: 'Warm Tint', param: 'postProcessParams.bloomTint', min: 0, max: 1, step: 0.05, decimals: 2 }
                    ]
                },
                {
                    id: 'tone-mapping',
                    label: 'Tone Mapping',
                    icon: 'sun',
                    color: '#fb923c',
                    controls: [
                        { type: 'slider', id: 'exposure', label: 'Exposure', param: 'postProcessParams.exposure', min: 0.1, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'tone-mapping', label: 'Mode (0=Off, 1=ACES, 2=Reinhard, 3=Filmic)', param: 'postProcessParams.toneMapping', min: 0, max: 3, step: 1, decimals: 0 }
                    ]
                }
            ]
        },
        settings: {
            sections: [
                {
                    id: 'orbital-physics',
                    label: 'Orbital Physics',
                    icon: 'orbit',
                    color: '#60a5fa',
                    controls: [
                        { type: 'subheader', label: 'Speed & Movement' },
                        { type: 'slider', id: 'orbit-speed', label: 'Orbit Speed', param: 'orbitParams.orbitSpeed', min: 0, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'camera-rot-speed', label: 'Camera Speed', param: 'orbitParams.cameraRotSpeed', min: 0, max: 3, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Global Scale' },
                        { type: 'slider', id: 'sun-spread', label: 'Sun Spread', param: 'orbitParams.sunSpread', min: 0.5, max: 2, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Moon Orbits' },
                        { type: 'slider', id: 'moon-orbit-radius', label: 'Orbit Radius', param: 'orbitParams.moonOrbitRadius', min: 0.3, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'moon-orbit-spacing', label: 'Orbit Spacing', param: 'orbitParams.moonOrbitSpacing', min: 0.3, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'moon-orbit-tilt', label: 'Orbit Tilt', param: 'orbitParams.moonOrbitTilt', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'base-orbit-min', label: 'Base Orbit Min', param: 'orbitParams.baseOrbitMin', min: 0.02, max: 0.15, step: 0.005, decimals: 3 },
                        { type: 'slider', id: 'base-orbit-max', label: 'Base Orbit Max', param: 'orbitParams.baseOrbitMax', min: 0.04, max: 0.2, step: 0.005, decimals: 3 },
                        { type: 'subheader', label: 'Sub-Moons' },
                        { type: 'slider', id: 'submoon-orbit-radius', label: 'Orbit Radius', param: 'orbitParams.subMoonOrbitRadius', min: 0.3, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'submoon-speed', label: 'Orbit Speed', param: 'orbitParams.subMoonSpeed', min: 0.1, max: 3, step: 0.05, decimals: 2 }
                    ]
                },
                {
                    id: 'size-factors',
                    label: 'Size Factors',
                    icon: 'sliders',
                    color: '#f472b6',
                    controls: [
                        { type: 'slider', id: 'sun-size-factor', label: 'Sun Size', param: 'orbitParams.sunSizeFactor', min: 0.3, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'planet-size-factor', label: 'Planet Size', param: 'orbitParams.planetSizeFactor', min: 0.3, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'submoon-size', label: 'Sub-Moon Size', param: 'orbitParams.subMoonSize', min: 0.1, max: 1.5, step: 0.05, decimals: 2 }
                    ]
                },
                {
                    id: 'camera-controls',
                    label: 'Camera',
                    icon: 'camera',
                    color: '#a78bfa',
                    controls: [
                        { type: 'slider', id: 'camera-move-speed', label: 'Move Speed', param: 'cameraParams.moveSpeed', min: 0.001, max: 0.05, step: 0.001, decimals: 3 },
                        { type: 'slider', id: 'camera-rot-speed', label: 'Look Speed', param: 'cameraParams.rotationSpeed', min: 0.001, max: 0.01, step: 0.0005, decimals: 4 },
                        { type: 'slider', id: 'camera-smoothing', label: 'Smoothing', param: 'cameraParams.smoothing', min: 0.01, max: 0.3, step: 0.01, decimals: 2 }
                    ]
                },
                {
                    id: 'display',
                    label: 'Display',
                    icon: 'eye',
                    color: '#22d3ee',
                    controls: [
                        { type: 'checkbox', id: 'show-labels', label: 'Show Labels', global: 'showPlanetLabels' }
                    ]
                },
                {
                    id: 'solar-unity',
                    label: 'Unity System',
                    icon: 'orbit',
                    color: '#aaccff',
                    controls: [
                        { type: 'subheader', label: 'Position' },
                        { type: 'slider', id: 'unity-pos-x', label: 'X', param: 'solarSystemParams.unity.posX', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'unity-pos-y', label: 'Y', param: 'solarSystemParams.unity.posY', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'unity-pos-z', label: 'Z', param: 'solarSystemParams.unity.posZ', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'subheader', label: 'Orbital Tilt' },
                        { type: 'slider', id: 'unity-tilt-x', label: 'Tilt X', param: 'solarSystemParams.unity.tiltX', min: -1.5, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'unity-tilt-y', label: 'Tilt Y', param: 'solarSystemParams.unity.tiltY', min: -1.5, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'unity-tilt-z', label: 'Tilt Z', param: 'solarSystemParams.unity.tiltZ', min: -1.5, max: 1.5, step: 0.05, decimals: 2 }
                    ]
                },
                {
                    id: 'solar-unreal',
                    label: 'Unreal System',
                    icon: 'orbit',
                    color: '#ff6030',
                    controls: [
                        { type: 'subheader', label: 'Position' },
                        { type: 'slider', id: 'unreal-pos-x', label: 'X', param: 'solarSystemParams.unreal.posX', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'unreal-pos-y', label: 'Y', param: 'solarSystemParams.unreal.posY', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'unreal-pos-z', label: 'Z', param: 'solarSystemParams.unreal.posZ', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'subheader', label: 'Orbital Tilt' },
                        { type: 'slider', id: 'unreal-tilt-x', label: 'Tilt X', param: 'solarSystemParams.unreal.tiltX', min: -1.5, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'unreal-tilt-y', label: 'Tilt Y', param: 'solarSystemParams.unreal.tiltY', min: -1.5, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'unreal-tilt-z', label: 'Tilt Z', param: 'solarSystemParams.unreal.tiltZ', min: -1.5, max: 1.5, step: 0.05, decimals: 2 }
                    ]
                },
                {
                    id: 'solar-graphics',
                    label: 'Graphics System',
                    icon: 'orbit',
                    color: '#ffcc66',
                    controls: [
                        { type: 'subheader', label: 'Position' },
                        { type: 'slider', id: 'graphics-pos-x', label: 'X', param: 'solarSystemParams.graphics.posX', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'graphics-pos-y', label: 'Y', param: 'solarSystemParams.graphics.posY', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'graphics-pos-z', label: 'Z', param: 'solarSystemParams.graphics.posZ', min: -1, max: 1, step: 0.01, decimals: 2 },
                        { type: 'subheader', label: 'Orbital Tilt' },
                        { type: 'slider', id: 'graphics-tilt-x', label: 'Tilt X', param: 'solarSystemParams.graphics.tiltX', min: -1.5, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'graphics-tilt-y', label: 'Tilt Y', param: 'solarSystemParams.graphics.tiltY', min: -1.5, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'graphics-tilt-z', label: 'Tilt Z', param: 'solarSystemParams.graphics.tiltZ', min: -1.5, max: 1.5, step: 0.05, decimals: 2 }
                    ]
                }
            ]
        }
    };

    // ============================================
    // SVG ICONS
    // ============================================
    const ICONS = {
        planet: '<circle cx="12" cy="12" r="8"/><path d="M8 14c1-2 3-2 4 0s3 2 4 0" stroke-linecap="round"/>',
        sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>',
        sparkle: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
        layers: '<polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/>',
        water: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
        fire: '<path d="M12 22c-4.97 0-9-4.03-9-9 0-4 4-8 4-8s1 2 2 2c1.5 0 2-2 2-2s2 2 5 4c2.5 1.67 3 4 3 5 0 4.97-3.03 8-7 8z"/>',
        lightbulb: '<path d="M9 18h6M10 22h4M12 2v1"/><path d="M12 6a5 5 0 0 1 3.54 8.54L14 16H10l-1.54-1.46A5 5 0 0 1 12 6z"/>',
        stars: '<circle cx="4" cy="4" r="1.5"/><circle cx="20" cy="4" r="2"/><circle cx="10" cy="20" r="2"/><circle cx="16" cy="18" r="1.5"/>',
        cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
        rays: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/>',
        sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/>',
        orbit: '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="3"/>',
        chevron: '<polyline points="6,9 12,15 18,9"/>',
        settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
        camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    };

    function icon(name) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
    }

    // ============================================
    // STATE
    // ============================================
    let isOpen = false;
    let activeTab = 'planets';
    let expandedSections = {};
    let panel = null;

    // ============================================
    // PARAMETER ACCESS
    // ============================================
    function getParamValue(paramPath) {
        const parts = paramPath.split('.');
        let obj = window;
        for (let i = 0; i < parts.length; i++) {
            obj = obj[parts[i]];
            if (obj === undefined) return undefined;
        }
        return obj;
    }

    function setParamValue(paramPath, value) {
        const parts = paramPath.split('.');
        let obj = window;
        for (let i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
            if (obj === undefined) return;
        }
        obj[parts[parts.length - 1]] = value;
    }

    // ============================================
    // UI BUILDERS
    // ============================================
    function createSlider(ctrl) {
        const value = getParamValue(ctrl.param);
        const sliderValue = (value !== undefined && value !== null) ? value : ctrl.min;
        const displayValue = (value !== undefined && value !== null) ? value.toFixed(ctrl.decimals) : ctrl.min.toFixed(ctrl.decimals);

        return '<div class="sp-control-row">' +
            '<span class="sp-control-label">' + ctrl.label + '</span>' +
            '<div class="sp-control-input">' +
                '<input type="range" class="sp-slider" id="sp-' + ctrl.id + '" ' +
                    'min="' + ctrl.min + '" max="' + ctrl.max + '" step="' + ctrl.step + '" ' +
                    'value="' + sliderValue + '" data-param="' + ctrl.param + '" data-decimals="' + ctrl.decimals + '">' +
                '<span class="sp-value" id="sp-' + ctrl.id + '-value">' + displayValue + '</span>' +
            '</div>' +
        '</div>';
    }

    function createColor(ctrl) {
        let value = getParamValue(ctrl.param);
        if (ctrl.isRGB && Array.isArray(value)) {
            value = rgbToHex(value[0], value[1], value[2]);
        }
        return '<div class="sp-control-row sp-color-row">' +
            '<span class="sp-control-label">' + ctrl.label + '</span>' +
            '<input type="color" class="sp-color" id="sp-' + ctrl.id + '" value="' + (value || '#ffffff') + '" ' +
                'data-param="' + ctrl.param + '"' + (ctrl.isRGB ? ' data-rgb="true"' : '') + '>' +
        '</div>';
    }

    function createSubheader(ctrl) {
        return '<div class="sp-subheader">' + ctrl.label + '</div>';
    }

    function createButton(ctrl) {
        return '<div class="sp-control-row sp-button-row">' +
            '<button class="sp-button" id="sp-' + ctrl.id + '" data-action="' + ctrl.action + '">' + ctrl.label + '</button>' +
        '</div>';
    }

    function createCheckbox(ctrl) {
        const value = ctrl.global ? window[ctrl.global] : getParamValue(ctrl.param);
        const isChecked = value === true || value === 1;
        return '<div class="sp-control-row sp-checkbox-row">' +
            '<span class="sp-control-label">' + ctrl.label + '</span>' +
            '<label class="sp-checkbox-switch">' +
                '<input type="checkbox" class="sp-checkbox-input" id="sp-' + ctrl.id + '"' +
                    (ctrl.global ? ' data-global="' + ctrl.global + '"' : ' data-param="' + ctrl.param + '"') +
                    (isChecked ? ' checked' : '') + '>' +
                '<span class="sp-checkbox-slider"></span>' +
            '</label>' +
        '</div>';
    }

    function createLightControl(ctrl) {
        const kelvinVal = getParamValue('lightParams.light' + ctrl.id + 'Kelvin');
        const intensityVal = getParamValue('lightParams.light' + ctrl.id + 'Intensity');
        const attenuationVal = getParamValue('lightParams.light' + ctrl.id + 'Attenuation');
        const kelvin = (kelvinVal !== undefined && kelvinVal !== null) ? kelvinVal : 5000;
        const intensity = (intensityVal !== undefined && intensityVal !== null) ? intensityVal : 1.0;
        const attenuation = (attenuationVal !== undefined && attenuationVal !== null) ? attenuationVal : 0.06;

        return '<div class="sp-light-block">' +
            '<div class="sp-light-header">' +
                '<span class="sp-light-preview" id="sp-light-preview-' + ctrl.id + '"></span>' +
                '<span class="sp-light-name">' + ctrl.label + '</span>' +
                '<span class="sp-light-kelvin" id="sp-kelvin-display-' + ctrl.id + '">' + kelvin + 'K</span>' +
            '</div>' +
            '<div class="sp-control-row">' +
                '<span class="sp-control-label">Temperature</span>' +
                '<div class="sp-control-input">' +
                    '<span class="sp-kelvin-label cold">M</span>' +
                    '<input type="range" class="sp-slider sp-kelvin" id="sp-kelvin-' + ctrl.id + '" ' +
                        'min="2000" max="15000" step="100" value="' + kelvin + '" data-light="' + ctrl.id + '">' +
                    '<span class="sp-kelvin-label hot">O</span>' +
                '</div>' +
            '</div>' +
            '<div class="sp-control-row">' +
                '<span class="sp-control-label">Intensity</span>' +
                '<div class="sp-control-input">' +
                    '<input type="range" class="sp-slider" id="sp-intensity-' + ctrl.id + '" ' +
                        'min="0" max="3" step="0.1" value="' + intensity + '" data-param="lightParams.light' + ctrl.id + 'Intensity" data-decimals="1">' +
                    '<span class="sp-value" id="sp-intensity-' + ctrl.id + '-value">' + intensity.toFixed(1) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="sp-control-row">' +
                '<span class="sp-control-label">Falloff</span>' +
                '<div class="sp-control-input">' +
                    '<input type="range" class="sp-slider" id="sp-atten-' + ctrl.id + '" ' +
                        'min="0" max="1" step="0.01" value="' + attenuation + '" data-param="lightParams.light' + ctrl.id + 'Attenuation" data-decimals="2">' +
                    '<span class="sp-value" id="sp-atten-' + ctrl.id + '-value">' + attenuation.toFixed(2) + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function createSection(section) {
        const isExpanded = expandedSections[section.id] !== false;
        let controlsHtml = '';

        section.controls.forEach(function(ctrl) {
            if (ctrl.type === 'slider') {
                controlsHtml += createSlider(ctrl);
            } else if (ctrl.type === 'color') {
                controlsHtml += createColor(ctrl);
            } else if (ctrl.type === 'subheader') {
                controlsHtml += createSubheader(ctrl);
            } else if (ctrl.type === 'light') {
                controlsHtml += createLightControl(ctrl);
            } else if (ctrl.type === 'button') {
                controlsHtml += createButton(ctrl);
            } else if (ctrl.type === 'checkbox') {
                controlsHtml += createCheckbox(ctrl);
            }
        });

        // Build toggle switch if section has a toggle
        let toggleHtml = '';
        if (section.toggle) {
            const isEnabled = window.renderToggles && window.renderToggles[section.toggle] !== false;
            toggleHtml = '<label class="sp-toggle-switch" title="Enable/Disable Renderer">' +
                '<input type="checkbox" class="sp-toggle-input" data-toggle="' + section.toggle + '"' + (isEnabled ? ' checked' : '') + '>' +
                '<span class="sp-toggle-slider"></span>' +
            '</label>';
        }

        const disabledClass = section.toggle && window.renderToggles && !window.renderToggles[section.toggle] ? ' disabled' : '';

        return '<div class="sp-section' + (isExpanded ? ' expanded' : '') + disabledClass + '" data-section="' + section.id + '">' +
            '<div class="sp-section-header" style="--section-color: ' + section.color + '">' +
                '<span class="sp-section-icon">' + icon(section.icon) + '</span>' +
                '<span class="sp-section-label">' + section.label + '</span>' +
                toggleHtml +
                '<span class="sp-section-chevron">' + icon('chevron') + '</span>' +
            '</div>' +
            '<div class="sp-section-content">' + controlsHtml + '</div>' +
        '</div>';
    }

    function createTabContent(tabId) {
        const tabConfig = CONTROLS[tabId];
        if (!tabConfig) return '';

        let html = '';
        tabConfig.sections.forEach(function(section) {
            html += createSection(section);
        });
        return html;
    }

    function createPanel() {
        const html = '<div class="settings-panel" id="settings-panel">' +
            '<div class="sp-toggle" id="sp-toggle" title="Shader Settings">' +
                icon('settings') +
            '</div>' +
            '<div class="sp-container">' +
                '<div class="sp-header">' +
                    '<span class="sp-title">Shader Settings</span>' +
                    '<div class="sp-header-actions">' +
                        '<button class="sp-action-btn" id="sp-export-code" title="Export as Code">Code</button>' +
                        '<button class="sp-action-btn" id="sp-export-json" title="Export JSON">JSON</button>' +
                        '<button class="sp-action-btn" id="sp-import" title="Import">Import</button>' +
                    '</div>' +
                '</div>' +
                '<div class="sp-tabs">' +
                    TABS.map(function(tab) {
                        return '<button class="sp-tab' + (tab.id === activeTab ? ' active' : '') + '" data-tab="' + tab.id + '">' +
                            '<span class="sp-tab-icon">' + icon(tab.icon) + '</span>' +
                            '<span class="sp-tab-label">' + tab.label + '</span>' +
                        '</button>';
                    }).join('') +
                '</div>' +
                '<div class="sp-content" id="sp-content">' +
                    createTabContent(activeTab) +
                '</div>' +
            '</div>' +
        '</div>';

        const container = document.createElement('div');
        container.innerHTML = html;
        return container.firstChild;
    }

    // ============================================
    // COLOR UTILITIES
    // ============================================
    function rgbToHex(r, g, b) {
        const toHex = function(c) {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [1, 1, 1];
    }

    function kelvinToRgb(kelvin) {
        const temp = kelvin / 100;
        let r, g, b;

        if (temp <= 66) {
            r = 255;
            g = Math.max(0, Math.min(255, 99.4708025861 * Math.log(temp) - 161.1195681661));
        } else {
            r = Math.max(0, Math.min(255, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
            g = Math.max(0, Math.min(255, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
        }

        if (temp >= 66) {
            b = 255;
        } else if (temp <= 19) {
            b = 0;
        } else {
            b = Math.max(0, Math.min(255, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
        }

        return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================
    function bindEvents() {
        // Toggle panel
        panel.querySelector('#sp-toggle').addEventListener('click', function() {
            isOpen = !isOpen;
            panel.classList.toggle('open', isOpen);
        });

        // Tab switching
        panel.querySelectorAll('.sp-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                activeTab = this.dataset.tab;
                panel.querySelectorAll('.sp-tab').forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                document.getElementById('sp-content').innerHTML = createTabContent(activeTab);
                bindControlEvents();
            });
        });

        // Export/Import buttons
        panel.querySelector('#sp-export-code').addEventListener('click', function() {
            if (window.exportAsCode) window.exportAsCode();
        });
        panel.querySelector('#sp-export-json').addEventListener('click', function() {
            if (window.exportSettings) window.exportSettings();
        });
        panel.querySelector('#sp-import').addEventListener('click', function() {
            if (window.importSettings) window.importSettings();
        });

        bindControlEvents();
    }

    function bindControlEvents() {
        // Section expand/collapse (click on header but not on toggle)
        panel.querySelectorAll('.sp-section-header').forEach(function(header) {
            header.addEventListener('click', function(e) {
                // Don't toggle section if clicking the enable/disable switch
                if (e.target.closest('.sp-toggle-switch')) return;
                const section = this.parentElement;
                const sectionId = section.dataset.section;
                const isExpanded = section.classList.toggle('expanded');
                expandedSections[sectionId] = isExpanded;
            });
        });

        // Render toggle switches
        panel.querySelectorAll('.sp-toggle-input').forEach(function(toggle) {
            toggle.addEventListener('change', function(e) {
                e.stopPropagation();
                const toggleKey = this.dataset.toggle;
                const isEnabled = this.checked;

                // Update global render toggles
                if (window.renderToggles) {
                    window.renderToggles[toggleKey] = isEnabled;
                }

                // Update all sections using this toggle
                panel.querySelectorAll('.sp-toggle-input[data-toggle="' + toggleKey + '"]').forEach(function(t) {
                    t.checked = isEnabled;
                    const section = t.closest('.sp-section');
                    if (section) {
                        section.classList.toggle('disabled', !isEnabled);
                    }
                });

                triggerSave();
            });
        });

        // Sliders
        panel.querySelectorAll('.sp-slider:not(.sp-kelvin)').forEach(function(slider) {
            slider.addEventListener('input', function() {
                const value = parseFloat(this.value);
                const decimals = parseInt(this.dataset.decimals) || 2;
                const valueEl = document.getElementById(this.id + '-value');
                if (valueEl) valueEl.textContent = value.toFixed(decimals);
                if (this.dataset.param) {
                    setParamValue(this.dataset.param, value);
                    triggerSave();
                }
            });
        });

        // Kelvin sliders
        panel.querySelectorAll('.sp-kelvin').forEach(function(slider) {
            slider.addEventListener('input', function() {
                const lightId = this.dataset.light;
                const kelvin = parseInt(this.value);
                const displayEl = document.getElementById('sp-kelvin-display-' + lightId);
                const previewEl = document.getElementById('sp-light-preview-' + lightId);

                if (displayEl) displayEl.textContent = kelvin + 'K';
                if (previewEl) previewEl.style.background = kelvinToRgb(kelvin);

                setParamValue('lightParams.light' + lightId + 'Kelvin', kelvin);
                if (window.updateLightFromKelvin) {
                    window.updateLightFromKelvin(parseInt(lightId), kelvin);
                }
                triggerSave();
            });
        });

        // Action buttons
        panel.querySelectorAll('.sp-button').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                if (action && window[action]) {
                    window[action]();
                }
            });
        });

        // Color pickers
        panel.querySelectorAll('.sp-color').forEach(function(picker) {
            picker.addEventListener('input', function() {
                const param = this.dataset.param;
                const isRgb = this.dataset.rgb === 'true';

                if (isRgb) {
                    setParamValue(param, hexToRgb(this.value));
                } else {
                    setParamValue(param, this.value);
                }
                triggerSave();
            });
        });

        // Checkboxes
        panel.querySelectorAll('.sp-checkbox-input').forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                const isChecked = this.checked;
                if (this.dataset.global) {
                    window[this.dataset.global] = isChecked;
                    // Update the label toggle button if it exists
                    const labelToggle = document.getElementById('label-toggle');
                    if (this.dataset.global === 'showPlanetLabels' && labelToggle) {
                        labelToggle.classList.toggle('active', isChecked);
                    }
                } else if (this.dataset.param) {
                    setParamValue(this.dataset.param, isChecked);
                }
                triggerSave();
            });
        });

        // Update light previews
        updateLightPreviews();
    }

    function updateLightPreviews() {
        [0, 1, 2].forEach(function(i) {
            const kelvin = getParamValue('lightParams.light' + i + 'Kelvin') || 5000;
            const preview = document.getElementById('sp-light-preview-' + i);
            if (preview) {
                preview.style.background = kelvinToRgb(kelvin);
            }
        });
    }

    // ============================================
    // SAVE DEBOUNCING
    // ============================================
    let saveTimeout = null;
    function triggerSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            if (window.saveToLocalStorage) window.saveToLocalStorage();
        }, 500);
    }

    // ============================================
    // AUTO-DISCOVER PARAM OBJECTS FROM CONTROLS
    // ============================================
    // Extracts all unique param object names from CONTROLS configuration
    // This ensures any new params added to the settings panel are automatically persisted
    function extractParamObjects() {
        const paramObjects = new Set();

        // Always include renderToggles for feature toggles
        paramObjects.add('renderToggles');

        Object.keys(CONTROLS).forEach(function(tabId) {
            const tab = CONTROLS[tabId];
            if (!tab.sections) return;

            tab.sections.forEach(function(section) {
                if (!section.controls) return;

                section.controls.forEach(function(ctrl) {
                    if (ctrl.param) {
                        // Extract the param object name (e.g., 'planetParamsA' from 'planetParamsA.noiseScale')
                        const objName = ctrl.param.split('.')[0];
                        paramObjects.add(objName);
                    }
                    // Handle light controls which use lightParams
                    if (ctrl.type === 'light' && ctrl.param) {
                        paramObjects.add(ctrl.param);
                    }
                });
            });
        });

        return Array.from(paramObjects);
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Wait for DOM and ALL param objects to be ready
        // volumetricParams, spaceParticleParams, and postProcessParams are exposed in core.js
        if (!window.planetParamsA || !window.sunParams || !window.volumetricParams || !window.spaceParticleParams || !window.postProcessParams) {
            setTimeout(init, 100);
            return;
        }

        panel = createPanel();
        document.body.appendChild(panel);
        bindEvents();

        // Hide settings panel by default - only show in Skills tab with graph view
        var skillsTab = document.querySelector('.carousel-tab[data-panel="skills"]');
        var graphBtn = document.querySelector('.view-toggle-btn[data-view="graph"]');
        var isSkillsActive = skillsTab && skillsTab.classList.contains('active');
        var isGraphView = graphBtn && graphBtn.classList.contains('active');
        if (!isSkillsActive || !isGraphView) {
            panel.style.display = 'none';
        }

        // Initialize all sections as expanded
        Object.keys(CONTROLS).forEach(function(tabId) {
            CONTROLS[tabId].sections.forEach(function(section) {
                expandedSections[section.id] = true;
            });
        });

        // Auto-register all param objects used in settings panel for persistence
        // This ensures any new params added to CONTROLS are automatically saved/loaded
        const discoveredParams = extractParamObjects();
        window.SETTINGS_PANEL_PARAMS = discoveredParams;

        // Merge with existing PERSISTED_PARAM_OBJECTS if it exists
        if (window.PERSISTED_PARAM_OBJECTS) {
            discoveredParams.forEach(function(param) {
                if (window.PERSISTED_PARAM_OBJECTS.indexOf(param) === -1) {
                    window.PERSISTED_PARAM_OBJECTS.push(param);
                }
            });
        } else {
            window.PERSISTED_PARAM_OBJECTS = discoveredParams;
        }

        console.log('Settings panel initialized with auto-persistence for:', discoveredParams);
    }

    // Refresh all toggle switches to match current renderToggles state
    function refreshToggles() {
        if (!panel) return;

        panel.querySelectorAll('.sp-toggle-input').forEach(function(toggle) {
            const toggleKey = toggle.dataset.toggle;
            const isEnabled = window.renderToggles && window.renderToggles[toggleKey] !== false;
            toggle.checked = isEnabled;

            const section = toggle.closest('.sp-section');
            if (section) {
                section.classList.toggle('disabled', !isEnabled);
            }
        });
    }

    // Refresh all slider values from current param objects
    function refreshSliders() {
        if (!panel) return;

        // Update all sliders
        panel.querySelectorAll('.sp-slider').forEach(function(slider) {
            const param = slider.dataset.param;
            const decimals = parseInt(slider.dataset.decimals) || 2;
            if (param) {
                const value = getParamValue(param);
                if (value !== undefined) {
                    slider.value = value;
                    const valueEl = document.getElementById(slider.id + '-value');
                    if (valueEl) {
                        valueEl.textContent = value.toFixed(decimals);
                    }
                }
            }
        });

        // Update color pickers
        panel.querySelectorAll('.sp-color').forEach(function(picker) {
            const param = picker.dataset.param;
            const isRgb = picker.dataset.rgb === 'true';
            if (param) {
                let value = getParamValue(param);
                if (value !== undefined) {
                    if (isRgb && Array.isArray(value)) {
                        value = rgbToHex(value[0], value[1], value[2]);
                    }
                    picker.value = value;
                }
            }
        });

        // Update light controls (kelvin, intensity, attenuation)
        [0, 1, 2].forEach(function(i) {
            const kelvin = getParamValue('lightParams.light' + i + 'Kelvin');
            const intensity = getParamValue('lightParams.light' + i + 'Intensity');
            const attenuation = getParamValue('lightParams.light' + i + 'Attenuation');

            const kelvinSlider = document.getElementById('sp-kelvin-' + i);
            const kelvinDisplay = document.getElementById('sp-kelvin-display-' + i);
            const intensitySlider = document.getElementById('sp-intensity-' + i);
            const intensityValue = document.getElementById('sp-intensity-' + i + '-value');
            const attenSlider = document.getElementById('sp-atten-' + i);
            const attenValue = document.getElementById('sp-atten-' + i + '-value');
            const preview = document.getElementById('sp-light-preview-' + i);

            if (kelvinSlider && kelvin !== undefined) {
                kelvinSlider.value = kelvin;
                if (kelvinDisplay) kelvinDisplay.textContent = kelvin + 'K';
                if (preview) preview.style.background = kelvinToRgb(kelvin);
            }
            if (intensitySlider && intensity !== undefined) {
                intensitySlider.value = intensity;
                if (intensityValue) intensityValue.textContent = intensity.toFixed(1);
            }
            if (attenSlider && attenuation !== undefined) {
                attenSlider.value = attenuation;
                if (attenValue) attenValue.textContent = attenuation.toFixed(3);
            }
        });
    }

    // Full refresh - toggles and sliders
    // Called after loading settings from localStorage
    function refreshAll() {
        refreshToggles();
        refreshSliders();
    }

    // Expose refresh function globally so it can be called after loading settings
    window.refreshSettingsPanel = refreshAll;

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
