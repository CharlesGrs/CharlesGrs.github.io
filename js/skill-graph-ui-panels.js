// ============================================
// SKILL GRAPH UI PANELS - Control panel setup and handlers
// ============================================

(function() {
    'use strict';

    // Callback to get nodes array from skill-graph.js
    var getNodesCallback = null;

    // Light node IDs for Kelvin color updates
    var lightNodeIds = ['unity', 'unreal', 'graphics'];

    // Default Kelvin temperatures (Unity hot, Unreal cold, Graphics medium)
    var defaultKelvinTemps = [15000, 2000, 5000];

    // DOM element references (cached during init)
    var lightControls, lightControlsToggle, lightResetBtn;
    var kelvinSliders = [];
    var kelvinValues = [];
    var lightPreviews = [];
    var intensitySliders = [];
    var intensityValues = [];
    var attenuationSliders = [];
    var attenuationValues = [];
    var ambientSlider, ambientValue;
    var fogSlider, fogValue;

    // Convert Kelvin temperature to RGB color
    // Enhanced algorithm for more saturated extremes
    function kelvinToRGB(kelvin) {
        var temp = kelvin / 100;
        var r, g, b;

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
            var coldFactor = 1 - (kelvin - 2000) / 2000; // 1 at 2000K, 0 at 4000K
            r = Math.min(255, r + coldFactor * 40);
            g = Math.max(0, g * (1 - coldFactor * 0.4));
            b = Math.max(0, b * (1 - coldFactor * 0.6));
        }
        // Hot stars: boost blue, reduce red
        if (kelvin > 8000) {
            var hotFactor = Math.min(1, (kelvin - 8000) / 7000); // 0 at 8000K, 1 at 15000K
            r = Math.max(0, r * (1 - hotFactor * 0.35));
            g = Math.max(0, g * (1 - hotFactor * 0.15));
            b = Math.min(255, b + hotFactor * 30);
        }

        var rHex = Math.round(r).toString(16).padStart(2, '0');
        var gHex = Math.round(g).toString(16).padStart(2, '0');
        var bHex = Math.round(b).toString(16).padStart(2, '0');
        return '#' + rHex + gHex + bHex;
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

    // Update light color from Kelvin temperature
    function updateLightFromKelvin(index, kelvin) {
        var color = kelvinToRGB(kelvin);
        var starClass = getStarClass(kelvin);

        // Update node color if we have access to nodes
        if (getNodesCallback) {
            var nodes = getNodesCallback();
            var node = nodes.find(function(n) { return n.id === lightNodeIds[index]; });
            if (node) {
                node.lightColor = color;
                node.color = color;
            }
        }

        if (lightPreviews[index]) {
            lightPreviews[index].style.backgroundColor = color;
            lightPreviews[index].style.boxShadow = '0 0 8px ' + color;
        }
        if (kelvinValues[index]) {
            kelvinValues[index].textContent = kelvin + 'K (' + starClass + ')';
        }
        if (kelvinSliders[index]) {
            kelvinSliders[index].value = kelvin;
        }
    }

    // Initialize Light Controls UI
    function initLightControls() {
        lightControls = document.getElementById('light-controls');
        lightControlsToggle = document.getElementById('light-controls-toggle');
        lightResetBtn = document.getElementById('light-reset-btn');

        kelvinSliders = [
            document.getElementById('kelvin-slider-0'),
            document.getElementById('kelvin-slider-1'),
            document.getElementById('kelvin-slider-2')
        ];
        kelvinValues = [
            document.getElementById('kelvin-value-0'),
            document.getElementById('kelvin-value-1'),
            document.getElementById('kelvin-value-2')
        ];
        lightPreviews = [
            document.getElementById('light-preview-0'),
            document.getElementById('light-preview-1'),
            document.getElementById('light-preview-2')
        ];

        // Initialize from lightParams
        updateLightFromKelvin(0, lightParams.light0Kelvin);
        updateLightFromKelvin(1, lightParams.light1Kelvin);
        updateLightFromKelvin(2, lightParams.light2Kelvin);

        // Toggle panel
        if (lightControlsToggle) {
            lightControlsToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                lightControls.classList.toggle('active');
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', function(e) {
            if (lightControls && !lightControls.contains(e.target)) {
                lightControls.classList.remove('active');
            }
        });

        // Kelvin slider handlers
        kelvinSliders.forEach(function(slider, i) {
            if (slider) {
                slider.addEventListener('input', function(e) {
                    var kelvin = parseInt(e.target.value);
                    if (i === 0) lightParams.light0Kelvin = kelvin;
                    else if (i === 1) lightParams.light1Kelvin = kelvin;
                    else if (i === 2) lightParams.light2Kelvin = kelvin;
                    updateLightFromKelvin(i, kelvin);
                });
            }
        });

        // Intensity slider handlers
        intensitySliders = [
            document.getElementById('intensity-slider-0'),
            document.getElementById('intensity-slider-1'),
            document.getElementById('intensity-slider-2')
        ];
        intensityValues = [
            document.getElementById('intensity-value-0'),
            document.getElementById('intensity-value-1'),
            document.getElementById('intensity-value-2')
        ];

        intensitySliders.forEach(function(slider, i) {
            if (slider && intensityValues[i]) {
                slider.addEventListener('input', function(e) {
                    var value = parseFloat(e.target.value);
                    if (i === 0) lightParams.light0Intensity = value;
                    else if (i === 1) lightParams.light1Intensity = value;
                    else if (i === 2) lightParams.light2Intensity = value;
                    intensityValues[i].textContent = value.toFixed(1);
                });
            }
        });

        // Attenuation slider handlers
        attenuationSliders = [
            document.getElementById('attenuation-slider-0'),
            document.getElementById('attenuation-slider-1'),
            document.getElementById('attenuation-slider-2')
        ];
        attenuationValues = [
            document.getElementById('attenuation-value-0'),
            document.getElementById('attenuation-value-1'),
            document.getElementById('attenuation-value-2')
        ];

        attenuationSliders.forEach(function(slider, i) {
            if (slider && attenuationValues[i]) {
                slider.addEventListener('input', function(e) {
                    var value = parseFloat(e.target.value);
                    if (i === 0) lightParams.light0Attenuation = value;
                    else if (i === 1) lightParams.light1Attenuation = value;
                    else if (i === 2) lightParams.light2Attenuation = value;
                    attenuationValues[i].textContent = value.toFixed(2);
                });
            }
        });

        // Ambient light slider handler
        ambientSlider = document.getElementById('ambient-slider');
        ambientValue = document.getElementById('ambient-value');
        if (ambientSlider && ambientValue) {
            ambientSlider.addEventListener('input', function(e) {
                var value = parseFloat(e.target.value);
                lightParams.ambientIntensity = value;
                ambientValue.textContent = value.toFixed(2);
            });
        }

        // Fog intensity slider handler
        fogSlider = document.getElementById('fog-slider');
        fogValue = document.getElementById('fog-value');
        if (fogSlider && fogValue) {
            fogSlider.addEventListener('input', function(e) {
                var value = parseFloat(e.target.value);
                lightParams.fogIntensity = value;
                fogValue.textContent = value.toFixed(2);
            });
        }

        // Reset button
        if (lightResetBtn) {
            lightResetBtn.addEventListener('click', function() {
                defaultKelvinTemps.forEach(function(temp, i) {
                    updateLightFromKelvin(i, temp);
                });
                // Reset intensity and attenuation to defaults
                var defaultIntensity = 1.0;
                var defaultAttenuation = 0.06;
                [0, 1, 2].forEach(function(i) {
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
    }

    // Initialize Physics/Orbit Controls UI
    function initPhysicsControls() {
        var physicsControls = document.getElementById('physics-controls');
        var physicsControlsToggle = document.getElementById('physics-controls-toggle');
        var physicsResetBtn = document.getElementById('physics-reset-btn');

        // Slider elements and their corresponding orbitParams keys
        var physicsSliders = {
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
        Object.keys(physicsSliders).forEach(function(sliderId) {
            var config = physicsSliders[sliderId];
            var slider = document.getElementById(sliderId);
            var valueEl = document.getElementById(config.valueEl);
            if (slider && valueEl) {
                slider.value = orbitParams[config.param];
                if (config.isToggle) {
                    valueEl.textContent = orbitParams[config.param] >= 1 ? 'ON' : 'OFF';
                } else {
                    valueEl.textContent = orbitParams[config.param].toFixed(config.decimals);
                }

                slider.addEventListener('input', function() {
                    var value = parseFloat(slider.value);
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
            physicsControlsToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                physicsControls.classList.toggle('active');
            });
        }

        // Close physics panel when clicking outside
        document.addEventListener('click', function(e) {
            if (physicsControls && !physicsControls.contains(e.target)) {
                physicsControls.classList.remove('active');
            }
        });

        // Orbital reset button
        if (physicsResetBtn) {
            physicsResetBtn.addEventListener('click', function() {
                Object.keys(physicsSliders).forEach(function(sliderId) {
                    var config = physicsSliders[sliderId];
                    var slider = document.getElementById(sliderId);
                    var valueEl = document.getElementById(config.valueEl);
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
    }

    // Initialize Sun/Halo Controls UI
    function initSunControls() {
        var sunControls = document.getElementById('sun-controls');
        var sunToggle = document.getElementById('sun-toggle');
        var sunResetBtn = document.getElementById('sun-reset-btn');

        var sunSlidersConfig = {
            'sun-core-size': { param: 'coreSize', valueEl: 'sun-core-size-value', default: 0.5, decimals: 2 },
            'sun-glow-size': { param: 'glowSize', valueEl: 'sun-glow-size-value', default: 1.0, decimals: 2 },
            'sun-glow-intensity': { param: 'glowIntensity', valueEl: 'sun-glow-intensity-value', default: 1.5, decimals: 2 }
        };

        // Initialize sun sliders
        Object.keys(sunSlidersConfig).forEach(function(sliderId) {
            var config = sunSlidersConfig[sliderId];
            var slider = document.getElementById(sliderId);
            var valueEl = document.getElementById(config.valueEl);
            if (slider && valueEl) {
                slider.value = sunParams[config.param];
                valueEl.textContent = sunParams[config.param].toFixed(config.decimals);

                slider.addEventListener('input', function() {
                    var value = parseFloat(slider.value);
                    sunParams[config.param] = value;
                    valueEl.textContent = value.toFixed(config.decimals);
                });
            }
        });

        // Toggle sun controls panel
        if (sunToggle) {
            sunToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                sunControls.classList.toggle('active');
            });
        }

        // Close sun panel when clicking outside
        document.addEventListener('click', function(e) {
            if (sunControls && !sunControls.contains(e.target)) {
                sunControls.classList.remove('active');
            }
        });

        // Sun reset button
        if (sunResetBtn) {
            sunResetBtn.addEventListener('click', function() {
                Object.keys(sunSlidersConfig).forEach(function(sliderId) {
                    var config = sunSlidersConfig[sliderId];
                    var slider = document.getElementById(sliderId);
                    var valueEl = document.getElementById(config.valueEl);
                    sunParams[config.param] = config.default;
                    if (slider) slider.value = config.default;
                    if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
                });
            });
        }
    }

    // Initialize Space Particles Controls UI
    function initParticlesControls() {
        var particlesControls = document.getElementById('particles-controls');
        var particlesToggle = document.getElementById('particles-toggle');
        var particlesResetBtn = document.getElementById('particles-reset-btn');

        var starsSlidersConfig = {
            'stars-start-distance': { param: 'startDistance', valueEl: 'stars-start-distance-value', default: 0.5, decimals: 1 },
            'stars-end-distance': { param: 'endDistance', valueEl: 'stars-end-distance-value', default: 5.0, decimals: 1 },
            'particles-size': { param: 'particleSize', valueEl: 'particles-size-value', default: 3.0, decimals: 1 },
            'particles-brightness': { param: 'brightness', valueEl: 'particles-brightness-value', default: 1.0, decimals: 1 }
        };

        var starsColorConfig = {
            'star-color-cool': { param: 'starColorCool', default: '#aaccff' },
            'star-color-warm': { param: 'starColorWarm', default: '#ffe4b5' },
            'star-color-hot': { param: 'starColorHot', default: '#ffffff' }
        };

        // Initialize star sliders
        Object.keys(starsSlidersConfig).forEach(function(sliderId) {
            var config = starsSlidersConfig[sliderId];
            var slider = document.getElementById(sliderId);
            var valueEl = document.getElementById(config.valueEl);
            if (slider && valueEl) {
                slider.value = spaceParticleParams[config.param];
                valueEl.textContent = spaceParticleParams[config.param].toFixed(config.decimals);

                slider.addEventListener('input', function() {
                    var value = parseFloat(slider.value);
                    spaceParticleParams[config.param] = value;
                    valueEl.textContent = value.toFixed(config.decimals);
                });
            }
        });

        // Initialize star color pickers
        Object.keys(starsColorConfig).forEach(function(pickerId) {
            var config = starsColorConfig[pickerId];
            var picker = document.getElementById(pickerId);
            if (picker && spaceParticleParams[config.param] !== undefined) {
                picker.value = spaceParticleParams[config.param];
                picker.addEventListener('input', function() {
                    spaceParticleParams[config.param] = picker.value;
                });
            }
        });

        // Toggle panel
        if (particlesToggle) {
            particlesToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                particlesControls.classList.toggle('active');
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', function(e) {
            if (particlesControls && !particlesControls.contains(e.target)) {
                particlesControls.classList.remove('active');
            }
        });

        // Reset button
        if (particlesResetBtn) {
            particlesResetBtn.addEventListener('click', function() {
                // Reset star params
                Object.keys(starsSlidersConfig).forEach(function(sliderId) {
                    var config = starsSlidersConfig[sliderId];
                    var slider = document.getElementById(sliderId);
                    var valueEl = document.getElementById(config.valueEl);
                    spaceParticleParams[config.param] = config.default;
                    if (slider) slider.value = config.default;
                    if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
                });
                // Reset star colors
                Object.keys(starsColorConfig).forEach(function(pickerId) {
                    var config = starsColorConfig[pickerId];
                    var picker = document.getElementById(pickerId);
                    spaceParticleParams[config.param] = config.default;
                    if (picker) picker.value = config.default;
                });
            });
        }
    }

    // Initialize Debug Controls UI
    function initDebugControls() {
        var debugControls = document.getElementById('debug-controls');
        var debugToggle = document.getElementById('debug-toggle');
        var debugEnableCheckbox = document.getElementById('debug-quad-enable');

        // Enable checkbox
        if (debugEnableCheckbox) {
            debugEnableCheckbox.checked = window.showDebugQuads || false;
            debugEnableCheckbox.addEventListener('change', function() {
                window.showDebugQuads = debugEnableCheckbox.checked;
            });
        }

        // Toggle panel
        if (debugToggle) {
            debugToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                debugControls.classList.toggle('active');
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', function(e) {
            if (debugControls && !debugControls.contains(e.target)) {
                debugControls.classList.remove('active');
            }
        });
    }

    // Initialize all control panels
    function initAllPanels() {
        initLightControls();
        initPhysicsControls();
        initSunControls();
        initParticlesControls();
        initDebugControls();
    }

    // Expose module to window
    window.skillGraphUI = {
        // Initialization
        initAllPanels: initAllPanels,
        initLightControls: initLightControls,
        initPhysicsControls: initPhysicsControls,
        initSunControls: initSunControls,
        initParticlesControls: initParticlesControls,
        initDebugControls: initDebugControls,

        // Utility functions
        kelvinToRGB: kelvinToRGB,
        getStarClass: getStarClass,
        updateLightFromKelvin: updateLightFromKelvin,

        // Callback setter
        setGetNodesCallback: function(fn) { getNodesCallback = fn; }
    };

    // Also expose updateLightFromKelvin for backward compatibility
    window.updateLightFromKelvin = updateLightFromKelvin;
})();
