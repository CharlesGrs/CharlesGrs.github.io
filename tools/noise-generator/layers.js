/**
 * NOISE LAB - Layer Management System
 * Handles layer creation, editing, reordering, and UI
 */

class LayerManager {
    constructor(container, onUpdate) {
        this.container = container;
        this.onUpdate = onUpdate;
        this.layers = [];
        this.activeLayerId = null;
        this.nextId = 1;
        this.previewCanvases = new Map();
    }

    createLayer(type = 'perlin', name = null) {
        const algo = NoiseAlgorithms[type];
        if (!algo) return null;

        const layer = {
            id: this.nextId++,
            name: name || `${algo.name} ${this.layers.length + 1}`,
            type: type,
            params: getDefaultParams(type),
            blendMode: 0,
            opacity: 1.0,
            visible: true
        };

        this.layers.push(layer);
        this.activeLayerId = layer.id;
        this.renderLayerList();
        this.onUpdate();

        return layer;
    }

    deleteLayer(id) {
        const index = this.layers.findIndex(l => l.id === id);
        if (index === -1) return;

        this.layers.splice(index, 1);

        // Update active layer
        if (this.activeLayerId === id) {
            this.activeLayerId = this.layers.length > 0 ? this.layers[this.layers.length - 1].id : null;
        }

        this.renderLayerList();
        this.onUpdate();
    }

    duplicateLayer(id) {
        const layer = this.getLayer(id);
        if (!layer) return;

        const newLayer = {
            id: this.nextId++,
            name: `${layer.name} Copy`,
            type: layer.type,
            params: { ...layer.params },
            blendMode: layer.blendMode,
            opacity: layer.opacity,
            visible: true
        };

        const index = this.layers.findIndex(l => l.id === id);
        this.layers.splice(index + 1, 0, newLayer);
        this.activeLayerId = newLayer.id;

        this.renderLayerList();
        this.onUpdate();
    }

    moveLayer(id, direction) {
        const index = this.layers.findIndex(l => l.id === id);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.layers.length) return;

        const layer = this.layers.splice(index, 1)[0];
        this.layers.splice(newIndex, 0, layer);

        this.renderLayerList();
        this.onUpdate();
    }

    toggleVisibility(id) {
        const layer = this.getLayer(id);
        if (!layer) return;

        layer.visible = !layer.visible;
        this.renderLayerList();
        this.onUpdate();
    }

    setActive(id) {
        this.activeLayerId = id;
        this.renderLayerList();
        this.onUpdate();
    }

    getLayer(id) {
        return this.layers.find(l => l.id === id);
    }

    getActiveLayer() {
        return this.getLayer(this.activeLayerId);
    }

    updateLayerParam(id, paramName, value) {
        const layer = this.getLayer(id);
        if (!layer) return;

        layer.params[paramName] = value;
        this.onUpdate();
    }

    updateLayerBlend(id, blendMode, opacity) {
        const layer = this.getLayer(id);
        if (!layer) return;

        if (blendMode !== undefined) layer.blendMode = blendMode;
        if (opacity !== undefined) layer.opacity = opacity;
        this.onUpdate();
    }

    changeLayerType(id, newType) {
        const layer = this.getLayer(id);
        if (!layer) return;

        const algo = NoiseAlgorithms[newType];
        if (!algo) return;

        layer.type = newType;
        layer.params = getDefaultParams(newType);
        this.renderLayerList();
        this.onUpdate();
    }

    randomizeLayer(id) {
        const layer = this.getLayer(id);
        if (!layer) return;

        const algo = NoiseAlgorithms[layer.type];
        for (const [key, config] of Object.entries(algo.params)) {
            if (key === 'seed') {
                layer.params[key] = Math.floor(Math.random() * 1000);
            } else if (config.type === 'range') {
                const range = config.max - config.min;
                layer.params[key] = config.min + Math.random() * range;
                // Round to step
                layer.params[key] = Math.round(layer.params[key] / config.step) * config.step;
            }
        }

        this.onUpdate();
    }

    randomizeAll() {
        for (const layer of this.layers) {
            this.randomizeLayer(layer.id);
        }
    }

    clear() {
        this.layers = [];
        this.activeLayerId = null;
        this.renderLayerList();
        this.onUpdate();
    }

    toJSON() {
        return {
            layers: this.layers.map(l => ({
                type: l.type,
                name: l.name,
                params: { ...l.params },
                blendMode: l.blendMode,
                opacity: l.opacity,
                visible: l.visible
            }))
        };
    }

    fromJSON(data) {
        this.clear();
        for (const layerData of data.layers) {
            const layer = this.createLayer(layerData.type, layerData.name);
            if (layer) {
                layer.params = { ...layerData.params };
                layer.blendMode = layerData.blendMode;
                layer.opacity = layerData.opacity;
                layer.visible = layerData.visible;
            }
        }
    }

    renderLayerList() {
        this.container.innerHTML = '';

        if (this.layers.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        <polyline points="2 17 12 22 22 17"/>
                        <polyline points="2 12 12 17 22 12"/>
                    </svg>
                    <p>No layers yet</p>
                </div>
            `;
            return;
        }

        // Render layers in reverse order (top layer first in UI)
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const algo = NoiseAlgorithms[layer.type];
            const isActive = layer.id === this.activeLayerId;

            const el = document.createElement('div');
            el.className = `layer-item${isActive ? ' active' : ''}${!layer.visible ? ' hidden' : ''}`;
            el.dataset.id = layer.id;

            el.innerHTML = `
                <div class="layer-preview">
                    <canvas width="36" height="36"></canvas>
                </div>
                <div class="layer-info">
                    <div class="layer-name">${this.escapeHtml(layer.name)}</div>
                    <div class="layer-type">${algo.icon} ${algo.name}</div>
                </div>
                <div class="layer-actions">
                    <button class="layer-action-btn" data-action="visibility" title="${layer.visible ? 'Hide' : 'Show'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${layer.visible ?
                                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' :
                                '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                            }
                        </svg>
                    </button>
                    <button class="layer-action-btn" data-action="duplicate" title="Duplicate">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    <button class="layer-action-btn danger" data-action="delete" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;

            // Store canvas reference for preview updates
            const canvas = el.querySelector('canvas');
            this.previewCanvases.set(layer.id, canvas);

            // Click to select
            el.addEventListener('click', (e) => {
                if (!e.target.closest('.layer-action-btn')) {
                    this.setActive(layer.id);
                }
            });

            // Action buttons
            el.querySelectorAll('.layer-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    if (action === 'delete') this.deleteLayer(layer.id);
                    else if (action === 'duplicate') this.duplicateLayer(layer.id);
                    else if (action === 'visibility') this.toggleVisibility(layer.id);
                });
            });

            this.container.appendChild(el);
        }

        // Update layer count in status bar
        const countEl = document.getElementById('layerCount');
        if (countEl) countEl.textContent = this.layers.length;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPreviewCanvas(id) {
        return this.previewCanvases.get(id);
    }
}

window.LayerManager = LayerManager;
