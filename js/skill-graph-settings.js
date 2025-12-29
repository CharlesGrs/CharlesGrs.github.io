// ============================================
// SKILL GRAPH SETTINGS - Save/Load/Export/Import system
// ============================================

(function() {
    'use strict';

    var SETTINGS_STORAGE_KEY = 'shaderSettings_v1';

    // Callbacks set by skill-graph.js for WebGL-dependent operations
    var respawnStarsCallback = null;
    var updateLightFromKelvinCallback = null;

    // Collect all current settings
    // Uses the PERSISTED_PARAM_OBJECTS registry from core.js
    function getAllSettings() {
        var settings = {
            version: 2,
            timestamp: new Date().toISOString()
        };

        // Use the centralized registry from core.js
        var paramObjects = window.PERSISTED_PARAM_OBJECTS || [];

        // Copy each param object
        paramObjects.forEach(function(name) {
            var obj = window[name];
            if (obj && typeof obj === 'object') {
                settings[name] = Object.assign({}, obj);
            }
        });

        return settings;
    }

    // Apply settings to param objects and update UI
    function applySettings(settings) {
        if (!settings) return;

        // Use the centralized registry from core.js
        var paramObjects = window.PERSISTED_PARAM_OBJECTS || [];

        // Apply each saved object to its corresponding window object
        paramObjects.forEach(function(name) {
            var savedObj = settings[name];
            var targetObj = window[name];
            if (savedObj && targetObj && typeof targetObj === 'object') {
                Object.keys(savedObj).forEach(function(key) {
                    if (key in targetObj) {
                        targetObj[key] = savedObj[key];
                    }
                });
            }
        });

        // Legacy support: apply physicsParams if present (maps to orbitParams)
        if (settings.physicsParams && window.orbitParams) {
            Object.keys(settings.physicsParams).forEach(function(key) {
                if (key in window.orbitParams) {
                    window.orbitParams[key] = settings.physicsParams[key];
                }
            });
        }

        // Update all sliders to reflect loaded values
        updateAllSliders();

        // Refresh settings panel toggles if available
        if (window.refreshSettingsPanel) {
            window.refreshSettingsPanel();
        }

        // Respawn stars with loaded settings (they were initialized before settings were loaded)
        if (respawnStarsCallback) {
            respawnStarsCallback();
        }
    }

    // Update all slider UI elements to match current param values
    function updateAllSliders() {
        // Helper to update a slider and its value display
        function updateSlider(sliderId, value, decimals) {
            var slider = document.getElementById(sliderId);
            var valueEl = document.getElementById(sliderId + '-value');
            if (slider && value !== undefined) {
                slider.value = value;
                if (valueEl) {
                    valueEl.textContent = typeof value === 'number' ? value.toFixed(decimals) : value;
                }
            }
        }

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

        // Stars sliders
        updateSlider('stars-start-distance', spaceParticleParams.startDistance, 1);
        updateSlider('stars-end-distance', spaceParticleParams.endDistance, 1);
        updateSlider('particles-size', spaceParticleParams.particleSize, 1);
        updateSlider('particles-brightness', spaceParticleParams.brightness, 1);
        // Star color pickers
        var starCoolPicker = document.getElementById('star-color-cool');
        var starWarmPicker = document.getElementById('star-color-warm');
        var starHotPicker = document.getElementById('star-color-hot');
        if (starCoolPicker && spaceParticleParams.starColorCool) starCoolPicker.value = spaceParticleParams.starColorCool;
        if (starWarmPicker && spaceParticleParams.starColorWarm) starWarmPicker.value = spaceParticleParams.starColorWarm;
        if (starHotPicker && spaceParticleParams.starColorHot) starHotPicker.value = spaceParticleParams.starColorHot;

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
        var showOrbitsValueEl = document.getElementById('show-orbits-value');
        if (showOrbitsValueEl) showOrbitsValueEl.textContent = orbitParams.showOrbits >= 1 ? 'ON' : 'OFF';

        // Kelvin sliders (also update node colors)
        if (updateLightFromKelvinCallback) {
            updateLightFromKelvinCallback(0, lightParams.light0Kelvin);
            updateLightFromKelvinCallback(1, lightParams.light1Kelvin);
            updateLightFromKelvinCallback(2, lightParams.light2Kelvin);
        }
    }

    // Check if running on dev machine (localhost or file://)
    function isDevMachine() {
        var host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
    }

    // Save to localStorage (only on dev machine)
    function saveToLocalStorage() {
        if (!isDevMachine()) return;
        try {
            var settings = getAllSettings();
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }

    // Load from localStorage (only on dev machine)
    function loadFromLocalStorage() {
        if (!isDevMachine()) return false;
        try {
            var stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (stored) {
                var settings = JSON.parse(stored);
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
        var settings = getAllSettings();
        var json = JSON.stringify(settings, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'shader-preset-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Export settings as JavaScript code (for embedding in source)
    function exportAsCode() {
        var settings = getAllSettings();

        // Generate JavaScript code that can be pasted into core.js
        var code = '// ============================================\n' +
'// EXPORTED SHADER SETTINGS - Generated ' + new Date().toISOString() + '\n' +
'// Paste this in core.js (replace the existing param objects)\n' +
'// ============================================\n\n' +
'// Terrain parameters\n' +
'const terrainParams = ' + JSON.stringify(settings.terrainParams, null, 4) + ';\n\n' +
'// Material A (Below sea level)\n' +
'const materialA = ' + JSON.stringify(settings.materialA, null, 4) + ';\n\n' +
'// Material B (Above sea level)\n' +
'const materialB = ' + JSON.stringify(settings.materialB, null, 4) + ';\n\n' +
'// Atmosphere parameters\n' +
'const atmosParams = ' + JSON.stringify(settings.atmosParams, null, 4) + ';\n\n' +
'// Sun/Star halo parameters\n' +
'const sunParams = ' + JSON.stringify(settings.sunParams, null, 4) + ';\n\n' +
'// Light properties\n' +
'const lightParams = ' + JSON.stringify(settings.lightParams, null, 4) + ';\n\n' +
'// Volumetric light parameters\n' +
'const volumetricParams = ' + JSON.stringify(settings.volumetricParams, null, 4) + ';\n\n' +
'// Space particles parameters\n' +
'const spaceParticleParams = ' + JSON.stringify(settings.spaceParticleParams, null, 4) + ';\n\n' +
'// Orbital system parameters\n' +
'const orbitParams = ' + JSON.stringify(settings.orbitParams, null, 4) + ';\n\n' +
'// Render feature toggles\n' +
'window.renderToggles = ' + JSON.stringify(settings.renderToggles, null, 4) + ';\n';

        // Copy to clipboard
        navigator.clipboard.writeText(code).then(function() {
            showCodeExportModal(code, true);
        }).catch(function() {
            showCodeExportModal(code, false);
        });
    }

    // Show modal with exported code
    function showCodeExportModal(code, copied) {
        // Remove existing modal if any
        var existing = document.getElementById('code-export-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'code-export-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

        var content = document.createElement('div');
        content.style.cssText = 'background:#1a1f2e;border:1px solid #e8b923;border-radius:8px;max-width:800px;max-height:80vh;width:100%;display:flex;flex-direction:column;overflow:hidden;';

        var header = document.createElement('div');
        header.style.cssText = 'padding:12px 16px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;';

        var statusColor = copied ? '#2dd4bf' : '#ff6b6b';
        var statusText = copied ? 'Copied to clipboard!' : 'Could not copy - select and copy manually';
        header.innerHTML = '<div><strong style="color:#e8b923;">Export as JavaScript Code</strong><span style="color:' + statusColor + ';margin-left:12px;font-size:12px;">' + statusText + '</span></div><button id="close-code-modal" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;">&times;</button>';

        var instructions = document.createElement('div');
        instructions.style.cssText = 'padding:12px 16px;background:#0d1117;font-size:12px;color:#8b949e;border-bottom:1px solid #333;';
        instructions.innerHTML = '<strong>Instructions:</strong> Replace the parameter objects at the top of <code style="color:#e8b923;">js/core.js</code> with this code.';

        var codeArea = document.createElement('textarea');
        codeArea.value = code;
        codeArea.readOnly = true;
        codeArea.style.cssText = 'flex:1;background:#0d1117;color:#c9d1d9;border:none;padding:16px;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.5;resize:none;overflow:auto;min-height:300px;';

        var footer = document.createElement('div');
        footer.style.cssText = 'padding:12px 16px;border-top:1px solid #333;display:flex;gap:8px;justify-content:flex-end;';
        footer.innerHTML = '<button id="copy-code-btn" style="background:#2dd4bf;color:#000;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:12px;">Copy Code</button><button id="download-code-btn" style="background:#e8b923;color:#000;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:12px;">Download .js</button>';

        content.appendChild(header);
        content.appendChild(instructions);
        content.appendChild(codeArea);
        content.appendChild(footer);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('close-code-modal').addEventListener('click', function() { modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });

        document.getElementById('copy-code-btn').addEventListener('click', function() {
            codeArea.select();
            navigator.clipboard.writeText(code).then(function() {
                document.getElementById('copy-code-btn').textContent = 'Copied!';
                setTimeout(function() {
                    document.getElementById('copy-code-btn').textContent = 'Copy Code';
                }, 2000);
            });
        });

        document.getElementById('download-code-btn').addEventListener('click', function() {
            var blob = new Blob([code], { type: 'text/javascript' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'shader-params-' + new Date().toISOString().slice(0, 10) + '.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Import settings from JSON file
    function importSettings() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(event) {
                try {
                    var settings = JSON.parse(event.target.result);
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
    var saveTimeout = null;
    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToLocalStorage, 500);
    }

    // Create and inject export/import buttons
    function createSettingsButtons() {
        // Find all control panels and add buttons
        var panels = [
            { controls: 'sun-controls', resetBtn: 'sun-reset-btn' },
            { controls: 'particles-controls', resetBtn: 'particles-reset-btn' }
        ];

        panels.forEach(function(panel) {
            var resetBtn = document.getElementById(panel.resetBtn);
            if (resetBtn) {
                // Create button container
                var btnContainer = document.createElement('div');
                btnContainer.className = 'settings-btn-container';
                btnContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;';

                var exportBtn = document.createElement('button');
                exportBtn.className = 'render-reset-btn';
                exportBtn.textContent = 'Export JSON';
                exportBtn.style.cssText = 'flex:1;font-size:10px;min-width:70px;';
                exportBtn.addEventListener('click', exportSettings);

                var importBtn = document.createElement('button');
                importBtn.className = 'render-reset-btn';
                importBtn.textContent = 'Import';
                importBtn.style.cssText = 'flex:1;font-size:10px;min-width:70px;';
                importBtn.addEventListener('click', importSettings);

                var exportCodeBtn = document.createElement('button');
                exportCodeBtn.className = 'render-reset-btn';
                exportCodeBtn.textContent = 'Export as Code';
                exportCodeBtn.style.cssText = 'flex:2;font-size:10px;min-width:100px;background:#e8b923;color:#000;';
                exportCodeBtn.title = 'Export settings as JavaScript code to embed in core.js';
                exportCodeBtn.addEventListener('click', exportAsCode);

                btnContainer.appendChild(exportBtn);
                btnContainer.appendChild(importBtn);
                btnContainer.appendChild(exportCodeBtn);

                // Insert after reset button
                resetBtn.parentNode.insertBefore(btnContainer, resetBtn.nextSibling);
            }
        });
    }

    // Initialize auto-save listeners
    function initAutoSave() {
        // Attach auto-save to all sliders (all slider classes)
        document.querySelectorAll('.render-slider, .kelvin-slider, .light-property-slider, .physics-slider').forEach(function(slider) {
            slider.addEventListener('input', debouncedSave);
        });

        // Attach auto-save to color pickers
        document.querySelectorAll('input[type="color"]').forEach(function(picker) {
            picker.addEventListener('input', debouncedSave);
        });
    }

    // Expose module to window
    window.skillGraphSettings = {
        // Core functions
        getAllSettings: getAllSettings,
        applySettings: applySettings,
        updateAllSliders: updateAllSliders,

        // Persistence
        save: saveToLocalStorage,
        load: loadFromLocalStorage,
        exportJSON: exportSettings,
        importJSON: importSettings,
        exportAsCode: exportAsCode,
        debouncedSave: debouncedSave,

        // Initialization
        createSettingsButtons: createSettingsButtons,
        initAutoSave: initAutoSave,

        // Callback setters (called by skill-graph.js after WebGL init)
        setRespawnStarsCallback: function(fn) { respawnStarsCallback = fn; },
        setUpdateLightFromKelvinCallback: function(fn) { updateLightFromKelvinCallback = fn; }
    };

    // Also expose individual functions for backward compatibility
    window.saveToLocalStorage = saveToLocalStorage;
    window.exportSettings = exportSettings;
    window.exportAsCode = exportAsCode;
    window.importSettings = importSettings;
})();
