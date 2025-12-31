/**
 * NOISE LAB - Main Application
 * Orchestrates all modules and handles UI interactions
 */

class NoiseLab {
    constructor() {
        // Core components
        this.canvas = document.getElementById('noiseCanvas');
        this.renderer = null;
        this.layerManager = null;

        // State
        this.resolution = 512;
        this.seamless = true;
        this.exportFormat = 'png';
        this.colorMode = 'grayscale';
        this.zoom = 100;
        this.showTilePreview = false;
        this.globalSeed = Math.floor(Math.random() * 1000);
        this.renderPending = false;

        // Performance tracking
        this.lastRenderTime = 0;

        this.init();
    }

    init() {
        try {
            // Initialize WebGL renderer
            this.renderer = new NoiseRenderer(this.canvas);
            document.getElementById('gpuInfo').textContent = this.renderer.getGPUInfo();

            // Initialize layer manager
            this.layerManager = new LayerManager(
                document.getElementById('layersContainer'),
                () => this.scheduleRender()
            );

            // Bind UI events
            this.bindEvents();

            // Add initial layer
            this.layerManager.createLayer('fbm', 'FBM Base');

            // Initial render
            this.render();
            this.updateStatus('Ready');

        } catch (error) {
            console.error('Initialization failed:', error);
            this.updateStatus('WebGL initialization failed');
        }
    }

    bindEvents() {
        // Add layer button
        document.getElementById('addLayerBtn').addEventListener('click', () => {
            this.showAddLayerMenu();
        });

        // Randomize button
        document.getElementById('randomizeBtn').addEventListener('click', () => {
            this.layerManager.randomizeAll();
            this.globalSeed = Math.floor(Math.random() * 1000);
            document.getElementById('seedValue').textContent = this.globalSeed;
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        // Resolution buttons
        document.querySelectorAll('.res-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.res-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setResolution(parseInt(btn.dataset.res));
            });
        });

        // Format buttons
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.exportFormat = btn.dataset.format;
            });
        });

        // Channel buttons
        document.querySelectorAll('.channel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.channel-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.colorMode = btn.dataset.channel;
            });
        });

        // Seamless toggle
        document.getElementById('seamlessToggle').addEventListener('change', (e) => {
            this.seamless = e.target.checked;
            this.renderer.setSeamless(this.seamless);
            this.scheduleRender();
        });

        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.setZoom(this.zoom + 25));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.setZoom(this.zoom - 25));

        // Tile preview toggle
        document.getElementById('tilePreviewBtn').addEventListener('click', () => {
            this.toggleTilePreview();
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadPreset(btn.dataset.preset);
            });
        });

        // Export modal
        document.getElementById('closeModal').addEventListener('click', () => this.hideExportModal());
        document.getElementById('cancelExport').addEventListener('click', () => this.hideExportModal());
        document.getElementById('confirmExport').addEventListener('click', () => this.doExport());
        document.querySelector('.modal-backdrop').addEventListener('click', () => this.hideExportModal());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            if (e.key === 'n' && e.ctrlKey) {
                e.preventDefault();
                this.showAddLayerMenu();
            } else if (e.key === 'e' && e.ctrlKey) {
                e.preventDefault();
                this.showExportModal();
            } else if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                this.layerManager.randomizeAll();
            }
        });

        // Watch for active layer changes to update params panel
        const observer = new MutationObserver(() => {
            this.updateParamsPanel();
        });
        observer.observe(document.getElementById('layersContainer'), {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    showAddLayerMenu() {
        // Create inline menu for adding layers
        const types = Object.keys(NoiseAlgorithms);
        const menu = document.createElement('div');
        menu.className = 'add-layer-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-panel);
            border: 1px solid var(--border-default);
            border-radius: var(--radius-lg);
            padding: var(--space-4);
            z-index: 2000;
            min-width: 300px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        `;

        menu.innerHTML = `
            <div style="margin-bottom: var(--space-3); font-weight: 600;">Add Noise Layer</div>
            <div class="noise-type-selector">
                ${types.map(type => {
                    const algo = NoiseAlgorithms[type];
                    return `
                        <button class="noise-type-btn" data-type="${type}">
                            <span class="noise-type-icon">${algo.icon}</span>
                            <span class="noise-type-name">${algo.name}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1999;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(menu);

        // Handle selection
        menu.querySelectorAll('.noise-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.layerManager.createLayer(btn.dataset.type);
                document.body.removeChild(menu);
                document.body.removeChild(backdrop);
            });
        });

        // Close on backdrop click
        backdrop.addEventListener('click', () => {
            document.body.removeChild(menu);
            document.body.removeChild(backdrop);
        });
    }

    updateParamsPanel() {
        const container = document.getElementById('paramsContainer');
        const layer = this.layerManager.getActiveLayer();

        if (!layer) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        <polyline points="2 17 12 22 22 17"/>
                        <polyline points="2 12 12 17 22 12"/>
                    </svg>
                    <p>Select a layer to edit</p>
                </div>
            `;
            return;
        }

        const algo = NoiseAlgorithms[layer.type];
        let html = '';

        // Noise type selector
        html += `
            <div class="param-group">
                <label class="param-label">Noise Type</label>
                <div class="param-select">
                    <select id="layerTypeSelect">
                        ${Object.keys(NoiseAlgorithms).map(type => {
                            const a = NoiseAlgorithms[type];
                            return `<option value="${type}" ${type === layer.type ? 'selected' : ''}>${a.icon} ${a.name}</option>`;
                        }).join('')}
                    </select>
                </div>
            </div>
        `;

        // Noise-specific parameters
        for (const [key, config] of Object.entries(algo.params)) {
            const value = layer.params[key];

            if (config.type === 'range') {
                html += `
                    <div class="param-group">
                        <div class="param-slider">
                            <div class="slider-header">
                                <label class="param-label">${config.label}</label>
                                <span class="slider-value" id="value_${key}">${this.formatValue(value, config)}</span>
                            </div>
                            <input type="range"
                                id="param_${key}"
                                min="${config.min}"
                                max="${config.max}"
                                step="${config.step}"
                                value="${value}"
                                data-param="${key}">
                        </div>
                    </div>
                `;
            } else if (config.type === 'select') {
                html += `
                    <div class="param-group">
                        <label class="param-label">${config.label}</label>
                        <div class="param-select">
                            <select id="param_${key}" data-param="${key}">
                                ${config.options.map((opt, i) =>
                                    `<option value="${i}" ${i === value ? 'selected' : ''}>${opt}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                `;
            } else if (config.type === 'toggle') {
                html += `
                    <div class="param-group">
                        <label class="param-label">${config.label}</label>
                        <div class="toggle-row">
                            <label class="toggle">
                                <input type="checkbox" id="param_${key}" data-param="${key}" ${value ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                `;
            }
        }

        // Blend mode (for non-first layers)
        const layerIndex = this.layerManager.layers.findIndex(l => l.id === layer.id);
        if (layerIndex > 0) {
            html += `
                <div class="blend-mode-select">
                    <div class="param-group">
                        <label class="param-label">Blend Mode</label>
                        <div class="param-select">
                            <select id="blendModeSelect">
                                ${BlendModes.map(mode =>
                                    `<option value="${mode.id}" ${mode.id === layer.blendMode ? 'selected' : ''}>${mode.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="param-group">
                        <div class="param-slider">
                            <div class="slider-header">
                                <label class="param-label">Opacity</label>
                                <span class="slider-value" id="opacityValue">${Math.round(layer.opacity * 100)}%</span>
                            </div>
                            <input type="range" id="opacitySlider" min="0" max="1" step="0.01" value="${layer.opacity}">
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Bind parameter events
        container.querySelectorAll('input[type="range"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const param = e.target.dataset.param;
                const value = parseFloat(e.target.value);

                if (param) {
                    this.layerManager.updateLayerParam(layer.id, param, value);
                    const valueEl = document.getElementById(`value_${param}`);
                    if (valueEl) {
                        valueEl.textContent = this.formatValue(value, algo.params[param]);
                    }
                }
            });
        });

        container.querySelectorAll('select[data-param]').forEach(select => {
            select.addEventListener('change', (e) => {
                const param = e.target.dataset.param;
                const value = parseInt(e.target.value);
                this.layerManager.updateLayerParam(layer.id, param, value);
            });
        });

        container.querySelectorAll('input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const param = e.target.dataset.param;
                this.layerManager.updateLayerParam(layer.id, param, e.target.checked);
            });
        });

        // Layer type change
        const typeSelect = document.getElementById('layerTypeSelect');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.layerManager.changeLayerType(layer.id, e.target.value);
                this.updateParamsPanel();
            });
        }

        // Blend mode change
        const blendSelect = document.getElementById('blendModeSelect');
        if (blendSelect) {
            blendSelect.addEventListener('change', (e) => {
                this.layerManager.updateLayerBlend(layer.id, parseInt(e.target.value), undefined);
            });
        }

        // Opacity change
        const opacitySlider = document.getElementById('opacitySlider');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.layerManager.updateLayerBlend(layer.id, undefined, value);
                document.getElementById('opacityValue').textContent = `${Math.round(value * 100)}%`;
            });
        }
    }

    formatValue(value, config) {
        if (config.step >= 1) return Math.round(value).toString();
        if (config.step >= 0.1) return value.toFixed(1);
        return value.toFixed(2);
    }

    setResolution(res) {
        this.resolution = res;
        this.renderer.setResolution(res);
        document.getElementById('resolutionValue').textContent = `${res} × ${res}`;
        this.scheduleRender();
    }

    setZoom(zoom) {
        this.zoom = Math.max(25, Math.min(400, zoom));
        document.getElementById('zoomLevel').textContent = `${this.zoom}%`;

        const scale = this.zoom / 100;
        this.canvas.style.transform = `scale(${scale})`;
    }

    toggleTilePreview() {
        this.showTilePreview = !this.showTilePreview;
        const btn = document.getElementById('tilePreviewBtn');
        const grid = document.getElementById('tileGrid');

        btn.classList.toggle('active', this.showTilePreview);

        if (this.showTilePreview) {
            this.updateTilePreview();
            grid.classList.add('active');
        } else {
            grid.classList.remove('active');
        }
    }

    updateTilePreview() {
        if (!this.showTilePreview) return;

        const grid = document.getElementById('tileGrid');
        grid.innerHTML = '';

        const size = Math.min(this.resolution, 256);

        for (let i = 0; i < 9; i++) {
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = size;
            tileCanvas.height = size;
            const ctx = tileCanvas.getContext('2d');
            ctx.drawImage(this.canvas, 0, 0, size, size);
            grid.appendChild(tileCanvas);
        }
    }

    loadPreset(presetName) {
        const preset = NoisePresets[presetName];
        if (!preset) return;

        this.layerManager.fromJSON(preset);
        this.updateStatus(`Loaded preset: ${preset.name}`);
    }

    scheduleRender() {
        if (this.renderPending) return;
        this.renderPending = true;

        requestAnimationFrame(() => {
            this.render();
            this.renderPending = false;
        });
    }

    render() {
        const startTime = performance.now();

        this.renderer.renderLayers(this.layerManager.layers);

        this.lastRenderTime = performance.now() - startTime;
        document.getElementById('renderTime').textContent = `${this.lastRenderTime.toFixed(1)}ms`;

        // Update histogram
        this.updateHistogram();

        // Update tile preview if active
        this.updateTilePreview();

        // Update layer previews
        this.updateLayerPreviews();
    }

    updateLayerPreviews() {
        // Mini preview for each layer in the sidebar
        for (const layer of this.layerManager.layers) {
            const previewCanvas = this.layerManager.getPreviewCanvas(layer.id);
            if (!previewCanvas) continue;

            // Create a small offscreen canvas for preview
            const offscreen = document.createElement('canvas');
            offscreen.width = 36;
            offscreen.height = 36;

            // Render just this layer at small resolution
            const tempRes = this.renderer.resolution;
            this.renderer.setResolution(36);
            this.renderer.renderNoise(layer.type, layer.params);
            this.renderer.setResolution(tempRes);

            // Copy to preview
            const ctx = previewCanvas.getContext('2d');
            ctx.drawImage(this.renderer.canvas, 0, 0, 36, 36);
        }

        // Re-render full composite
        this.renderer.renderLayers(this.layerManager.layers);
    }

    updateHistogram() {
        const { histogram, min, max, avg } = this.renderer.getHistogram();

        document.getElementById('histMin').textContent = min;
        document.getElementById('histMax').textContent = max;
        document.getElementById('histAvg').textContent = avg;

        const canvas = document.getElementById('histogramCanvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#0c0f12';
        ctx.fillRect(0, 0, width, height);

        // Find max for normalization
        const maxCount = Math.max(...histogram);

        // Draw histogram bars
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        for (let i = 0; i < 256; i++) {
            const h = (histogram[i] / maxCount) * height;
            ctx.fillRect(i, height - h, 1, h);
        }
    }

    showExportModal() {
        const modal = document.getElementById('exportModal');
        modal.classList.add('active');

        // Update preview
        const previewCanvas = document.getElementById('exportPreviewCanvas');
        previewCanvas.width = 200;
        previewCanvas.height = 200;
        const ctx = previewCanvas.getContext('2d');
        ctx.drawImage(this.canvas, 0, 0, 200, 200);

        // Update info
        document.getElementById('exportSize').textContent = `${this.resolution} × ${this.resolution}`;
        document.getElementById('exportFormat').textContent = this.exportFormat.toUpperCase();
        document.getElementById('exportSeamless').textContent = this.seamless ? 'Yes' : 'No';
    }

    hideExportModal() {
        document.getElementById('exportModal').classList.remove('active');
    }

    doExport() {
        const filename = document.getElementById('exportFilename').value || 'noise_texture';
        const dataUrl = this.renderer.exportImage(this.exportFormat);

        // Create download link
        const link = document.createElement('a');
        link.download = `${filename}.${this.exportFormat}`;
        link.href = dataUrl;
        link.click();

        this.hideExportModal();
        this.updateStatus(`Exported: ${filename}.${this.exportFormat}`);
    }

    updateStatus(message) {
        document.getElementById('statusMessage').textContent = message;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.noiseLab = new NoiseLab();
});
