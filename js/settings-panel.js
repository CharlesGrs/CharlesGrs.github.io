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
                    label: 'Sun / Corona',
                    icon: 'sun',
                    color: '#fbbf24',
                    toggle: 'suns',
                    controls: [
                        { type: 'subheader', label: 'Core & Glow' },
                        { type: 'slider', id: 'sun-core-size', label: 'Core Size', param: 'sunParams.coreSize', min: 0.3, max: 0.7, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'sun-glow-size', label: 'Glow Size', param: 'sunParams.glowSize', min: 0.5, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'sun-glow-intensity', label: 'Glow Intensity', param: 'sunParams.glowIntensity', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Corona' },
                        { type: 'slider', id: 'sun-corona-intensity', label: 'Corona Intensity', param: 'sunParams.coronaIntensity', min: 0, max: 3, step: 0.1, decimals: 2 },
                        { type: 'slider', id: 'sun-chromatic-shift', label: 'Chromatic Shift', param: 'sunParams.chromaticShift', min: 0, max: 3, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Rays' },
                        { type: 'slider', id: 'sun-ray-count', label: 'Ray Count', param: 'sunParams.rayCount', min: 4, max: 24, step: 1, decimals: 0 },
                        { type: 'slider', id: 'sun-ray-intensity', label: 'Ray Intensity', param: 'sunParams.rayIntensity', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'sun-ray-length', label: 'Ray Length', param: 'sunParams.rayLength', min: 0.5, max: 3, step: 0.1, decimals: 2 },
                        { type: 'subheader', label: 'Streamers' },
                        { type: 'slider', id: 'sun-streamer-count', label: 'Streamer Count', param: 'sunParams.streamerCount', min: 0, max: 12, step: 1, decimals: 0 },
                        { type: 'slider', id: 'sun-streamer-intensity', label: 'Streamer Intensity', param: 'sunParams.streamerIntensity', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'sun-streamer-length', label: 'Streamer Length', param: 'sunParams.streamerLength', min: 1, max: 3, step: 0.1, decimals: 2 },
                        { type: 'subheader', label: 'Halo Rings' },
                        { type: 'slider', id: 'sun-halo-ring1-dist', label: 'Ring 1 Distance', param: 'sunParams.haloRing1Dist', min: 0.8, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'sun-halo-ring1-intensity', label: 'Ring 1 Intensity', param: 'sunParams.haloRing1Intensity', min: 0, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'sun-halo-ring2-dist', label: 'Ring 2 Distance', param: 'sunParams.haloRing2Dist', min: 1.5, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'sun-halo-ring2-intensity', label: 'Ring 2 Intensity', param: 'sunParams.haloRing2Intensity', min: 0, max: 0.3, step: 0.01, decimals: 2 },
                        { type: 'subheader', label: 'Animation' },
                        { type: 'slider', id: 'sun-flicker-speed', label: 'Flicker Speed', param: 'sunParams.flickerSpeed', min: 0, max: 5, step: 0.1, decimals: 2 },
                        { type: 'slider', id: 'sun-pulse-speed', label: 'Pulse Speed', param: 'sunParams.pulseSpeed', min: 0, max: 5, step: 0.1, decimals: 2 }
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
                    label: 'Space Particles',
                    icon: 'stars',
                    color: '#a78bfa',
                    toggle: 'spaceParticles',
                    controls: [
                        { type: 'subheader', label: 'Depth of Field' },
                        { type: 'slider', id: 'particles-focus-distance', label: 'Focus Distance', param: 'spaceParticleParams.focusDistance', min: 0.05, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'particles-focus-range', label: 'Focus Range', param: 'spaceParticleParams.focusRange', min: 0.01, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'particles-near-blur', label: 'Near Blur', param: 'spaceParticleParams.nearBlur', min: 0.01, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'particles-far-blur', label: 'Far Blur', param: 'spaceParticleParams.farBlur', min: 0.1, max: 1.0, step: 0.01, decimals: 2 },
                        { type: 'subheader', label: 'Bokeh' },
                        { type: 'slider', id: 'particles-max-blur', label: 'Max Blur', param: 'spaceParticleParams.maxBlur', min: 5, max: 60, step: 1, decimals: 0 },
                        { type: 'slider', id: 'particles-aperture', label: 'Aperture', param: 'spaceParticleParams.aperture', min: 0.1, max: 2.0, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'particles-ring-width', label: 'Ring Width', param: 'spaceParticleParams.ringWidth', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'particles-ring-intensity', label: 'Ring Intensity', param: 'spaceParticleParams.ringIntensity', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'particles-softness', label: 'Edge Softness', param: 'spaceParticleParams.softness', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Appearance' },
                        { type: 'slider', id: 'particles-size', label: 'Particle Size', param: 'spaceParticleParams.particleSize', min: 0.5, max: 8, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'particles-brightness', label: 'Brightness', param: 'spaceParticleParams.brightness', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'particles-light-falloff', label: 'Light Falloff', param: 'spaceParticleParams.lightFalloff', min: 0.5, max: 10, step: 0.1, decimals: 1 },
                        { type: 'color', id: 'particles-base-color', label: 'Base Color', param: 'spaceParticleParams.baseColor' },
                        { type: 'subheader', label: 'Shooting Stars' },
                        { type: 'slider', id: 'shooting-chance', label: 'Chance', param: 'spaceParticleParams.shootingChance', min: 0, max: 0.2, step: 0.001, decimals: 3 },
                        { type: 'slider', id: 'shooting-speed', label: 'Speed', param: 'spaceParticleParams.shootingSpeed', min: 0.1, max: 1.5, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'shooting-duration', label: 'Duration', param: 'spaceParticleParams.shootingDuration', min: 0.2, max: 2.0, step: 0.05, decimals: 2 },
                        { type: 'color', id: 'shooting-gold-color', label: 'Gold Color', param: 'spaceParticleParams.shootingGoldColor' },
                        { type: 'color', id: 'shooting-teal-color', label: 'Teal Color', param: 'spaceParticleParams.shootingTealColor' }
                    ]
                },
                {
                    id: 'nebula',
                    label: 'Nebula Background',
                    icon: 'cloud',
                    color: '#8b5cf6',
                    toggle: 'nebula',
                    controls: [
                        { type: 'slider', id: 'nebula-intensity', label: 'Intensity', param: 'nebulaParams.intensity', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'nebula-scale', label: 'Scale', param: 'nebulaParams.scale', min: 0.5, max: 10, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'nebula-detail', label: 'Detail', param: 'nebulaParams.detail', min: 0, max: 4, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'nebula-speed', label: 'Speed', param: 'nebulaParams.speed', min: 0, max: 0.5, step: 0.01, decimals: 2 },
                        { type: 'subheader', label: 'Colors' },
                        { type: 'slider', id: 'nebula-color-variation', label: 'Variation', param: 'nebulaParams.colorVariation', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'nebula-dust-density', label: 'Dust Density', param: 'nebulaParams.dustDensity', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'nebula-star-density', label: 'Star Density', param: 'nebulaParams.starDensity', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'subheader', label: 'Fractal Lighting' },
                        { type: 'slider', id: 'nebula-light-influence', label: 'Light Influence', param: 'nebulaParams.lightInfluence', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'nebula-fractal-intensity', label: 'Intensity', param: 'nebulaParams.fractalIntensity', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'nebula-fractal-scale', label: 'Scale', param: 'nebulaParams.fractalScale', min: 1, max: 20, step: 0.5, decimals: 1 },
                        { type: 'slider', id: 'nebula-fractal-speed', label: 'Speed', param: 'nebulaParams.fractalSpeed', min: 0, max: 0.1, step: 0.005, decimals: 3 },
                        { type: 'slider', id: 'nebula-fractal-saturation', label: 'Saturation', param: 'nebulaParams.fractalSaturation', min: 1, max: 5, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'nebula-fractal-falloff', label: 'Falloff', param: 'nebulaParams.fractalFalloff', min: 1, max: 10, step: 0.5, decimals: 1 },
                        { type: 'subheader', label: 'Nebula Colors' },
                        { type: 'color', id: 'nebula-color-purple', label: 'Purple', param: 'nebulaParams.colorPurple', isRGB: true },
                        { type: 'color', id: 'nebula-color-cyan', label: 'Cyan', param: 'nebulaParams.colorCyan', isRGB: true },
                        { type: 'color', id: 'nebula-color-blue', label: 'Blue', param: 'nebulaParams.colorBlue', isRGB: true },
                        { type: 'color', id: 'nebula-color-gold', label: 'Gold', param: 'nebulaParams.colorGold', isRGB: true }
                    ]
                }
            ]
        },
        post: {
            sections: [
                {
                    id: 'godrays',
                    label: 'Volumetric Light',
                    icon: 'rays',
                    color: '#fcd34d',
                    toggle: 'godRays',
                    controls: [
                        { type: 'slider', id: 'godrays-light-intensity', label: 'Intensity', param: 'godRaysParams.lightIntensity', min: 0, max: 3, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'godrays-light-falloff', label: 'Falloff', param: 'godRaysParams.lightFalloff', min: 0.5, max: 5, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'godrays-light-scale', label: 'Scale', param: 'godRaysParams.lightScale', min: 0.5, max: 10, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'godrays-light-saturation', label: 'Saturation', param: 'godRaysParams.lightSaturation', min: 0, max: 3, step: 0.1, decimals: 1 },
                        { type: 'subheader', label: 'Edge Noise' },
                        { type: 'slider', id: 'godrays-noise-scale', label: 'Scale', param: 'godRaysParams.noiseScale', min: 0.5, max: 12, step: 0.1, decimals: 1 },
                        { type: 'slider', id: 'godrays-noise-strength', label: 'Strength', param: 'godRaysParams.noiseStrength', min: 0, max: 1, step: 0.01, decimals: 2 },
                        { type: 'slider', id: 'godrays-noise-octaves', label: 'Octaves', param: 'godRaysParams.noiseOctaves', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'subheader', label: 'Self Shadow' },
                        { type: 'slider', id: 'godrays-noise-shadow', label: 'Intensity', param: 'godRaysParams.noiseShadow', min: 0, max: 1, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'godrays-shadow-offset', label: 'Offset', param: 'godRaysParams.shadowOffset', min: 0, max: 1, step: 0.001, decimals: 3 },
                        { type: 'subheader', label: 'Chromatic Scatter' },
                        { type: 'slider', id: 'godrays-scatter-r', label: 'Red', param: 'godRaysParams.scatterR', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'godrays-scatter-g', label: 'Green', param: 'godRaysParams.scatterG', min: 0, max: 2, step: 0.05, decimals: 2 },
                        { type: 'slider', id: 'godrays-scatter-b', label: 'Blue', param: 'godRaysParams.scatterB', min: 0, max: 2, step: 0.05, decimals: 2 }
                    ]
                },
                {
                    id: 'post-fx',
                    label: 'Post Processing',
                    icon: 'sliders',
                    color: '#94a3b8',
                    controls: [
                        { type: 'slider', id: 'nebula-vignette', label: 'Vignette', param: 'nebulaParams.vignetteStrength', min: 0, max: 1, step: 0.01, decimals: 2 }
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
        camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
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
        const displayValue = value !== undefined ? value.toFixed(ctrl.decimals) : '0';

        return '<div class="sp-control-row">' +
            '<span class="sp-control-label">' + ctrl.label + '</span>' +
            '<div class="sp-control-input">' +
                '<input type="range" class="sp-slider" id="sp-' + ctrl.id + '" ' +
                    'min="' + ctrl.min + '" max="' + ctrl.max + '" step="' + ctrl.step + '" ' +
                    'value="' + (value || ctrl.min) + '" data-param="' + ctrl.param + '" data-decimals="' + ctrl.decimals + '">' +
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

    function createLightControl(ctrl) {
        const kelvin = getParamValue('lightParams.light' + ctrl.id + 'Kelvin') || 5000;
        const intensity = getParamValue('lightParams.light' + ctrl.id + 'Intensity') || 1.0;
        const attenuation = getParamValue('lightParams.light' + ctrl.id + 'Attenuation') || 0.06;

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
        // godRaysParams and spaceParticleParams are exposed at the end of skill-graph.js
        if (!window.planetParamsA || !window.sunParams || !window.godRaysParams || !window.spaceParticleParams) {
            setTimeout(init, 100);
            return;
        }

        panel = createPanel();
        document.body.appendChild(panel);
        bindEvents();

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
