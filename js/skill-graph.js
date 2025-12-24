// ============================================
// SKILL NETWORK GRAPH
// ============================================
(function initSkillGraph() {
    const canvas = document.getElementById('skill-graph-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    let time = 0;

    const colors = {
        gold: '#e8b923',
        goldDim: '#c49a1a',
        teal: '#2dd4bf',
        tealDim: '#1a9a87',
        textPrimary: '#e8eaed',
        textMuted: '#6b7280',
        border: '#1f2937',
        bgCard: '#151d26'
    };

    // Color palette - brighter, more saturated for visibility:
    // - Graphics APIs: Blue/purple family (distinct shades)
    // - Unity ecosystem: Brighter teal variations
    // - Unreal ecosystem: Vibrant orange/coral
    // - Tools: Purple with good contrast
    const skills = [
        // === SUNS (3 main hubs) - Kelvin temperature colors ===
        { id: 'unity', label: 'Unity', category: 'primary', baseSize: 45, isLight: true, lightColor: '#aaccff',
          desc: 'Primary game engine', usage: 'Daily since 2017 - shipped 12+ titles across mobile, PC, and VR platforms' },
        { id: 'unreal', label: 'Unreal', category: 'primary', baseSize: 35, isLight: true, lightColor: '#ff6030',
          desc: 'Secondary engine', usage: 'Blueprint systems and material editor for specific projects' },
        { id: 'graphics', label: 'Graphics APIs', category: 'primary', baseSize: 40, isLight: true, lightColor: '#ffcc66',
          desc: 'Low-level rendering', usage: 'DirectX, OpenGL, Vulkan for engine and tools development' },

        // === Unity ecosystem ===
        { id: 'csharp', label: 'C#', category: 'secondary', baseSize: 16, color: '#2dd4bf',
          desc: 'Main programming language', usage: '7+ years - gameplay systems, editor tools, and performance-critical code' },
        { id: 'hdrp', label: 'HDRP', category: 'secondary', baseSize: 12, color: '#f472b6',
          desc: 'High Definition Render Pipeline', usage: 'AAA-quality visuals for high-end platforms' },
        { id: 'urp', label: 'URP', category: 'secondary', baseSize: 11, color: '#fb923c',
          desc: 'Universal Render Pipeline', usage: 'Optimized rendering for mobile and cross-platform' },
        { id: 'vfx', label: 'VFX Graph', category: 'secondary', baseSize: 10, color: '#3bc9a5',
          desc: 'Unity visual effects', usage: 'GPU-driven particle systems and real-time simulations' },
        { id: 'arvr', label: 'AR/VR', category: 'secondary', baseSize: 10, color: '#00d9b5',
          desc: 'Immersive experiences', usage: 'Meta Quest, HoloLens, and mobile AR projects' },

        // === Unreal ecosystem ===
        { id: 'cpp', label: 'C++', category: 'secondary', baseSize: 10, color: '#6c8ebf',
          desc: 'Systems programming', usage: 'Native plugins, engine modifications, and Unreal development' },
        { id: 'niagara', label: 'Niagara', category: 'secondary', baseSize: 10, color: '#ffa066',
          desc: 'Unreal VFX system', usage: 'Complex particle effects for Unreal projects' },

        // === Graphics ecosystem ===
        { id: 'hlsl', label: 'HLSL', category: 'secondary', baseSize: 13, color: '#c850c0',
          desc: 'DirectX shader language', usage: 'Custom rendering pipelines, VFX, and compute shaders' },
        { id: 'glsl', label: 'GLSL', category: 'secondary', baseSize: 12, color: '#a855f7',
          desc: 'OpenGL shader language', usage: 'Cross-platform shaders and WebGL effects' },
        { id: 'directx', label: 'DirectX', category: 'secondary', baseSize: 13, color: '#5090e0',
          desc: 'Graphics API', usage: 'DX11/DX12 for Windows and Xbox development' },
        { id: 'opengl', label: 'OpenGL', category: 'secondary', baseSize: 10, color: '#5c7cfa',
          desc: 'Cross-platform graphics', usage: 'Mobile and desktop rendering' },
        { id: 'compute', label: 'Compute', category: 'secondary', baseSize: 10, color: '#38d9a9',
          desc: 'GPU compute shaders', usage: 'Particle simulations, procedural generation, and physics' },

        // === Tools & other ===
        { id: 'threejs', label: 'Three.js', category: 'secondary', baseSize: 8, color: '#66d9ef',
          desc: 'WebGL framework', usage: 'Interactive 3D web experiences and visualizations' },
        { id: 'python', label: 'Python', category: 'secondary', baseSize: 10, color: '#ffd43b',
          desc: 'Scripting & tools', usage: 'Build automation, asset pipelines, and data processing' },
        { id: 'renderdoc', label: 'RenderDoc', category: 'tool', baseSize: 10, color: '#b87fd8',
          desc: 'Graphics debugger', usage: 'Frame analysis and shader debugging' },
        { id: 'nsight', label: 'NSight', category: 'tool', baseSize: 9, color: '#76b900',
          desc: 'NVIDIA profiler', usage: 'GPU performance analysis and optimization' }
    ];

    const BASE_DIMENSION = 400;
    let sizeScale = 1;

    // Meaningful connections between related skills
    const connections = [
        // Unity ecosystem
        ['unity', 'csharp'],
        ['unity', 'hdrp'],
        ['unity', 'urp'],
        ['unity', 'vfx'],
        ['unity', 'arvr'],
        ['hdrp', 'vfx'],
        ['urp', 'vfx'],
        ['csharp', 'vfx'],

        // Unreal ecosystem
        ['unreal', 'cpp'],
        ['unreal', 'niagara'],
        ['cpp', 'niagara'],

        // Graphics APIs ecosystem
        ['graphics', 'hlsl'],
        ['graphics', 'glsl'],
        ['graphics', 'directx'],
        ['graphics', 'opengl'],
        ['graphics', 'compute'],
        ['hlsl', 'directx'],
        ['glsl', 'opengl'],
        ['hlsl', 'compute'],

        // Cross-system connections (engines use graphics)
        ['unity', 'graphics'],
        ['unreal', 'graphics'],

        // Tools connect to graphics
        ['graphics', 'renderdoc'],
        ['graphics', 'nsight'],
        ['renderdoc', 'nsight'],

        // Three.js uses WebGL/OpenGL
        ['glsl', 'threejs'],
        ['opengl', 'threejs'],

        // Python for tooling
        ['python', 'unity'],
        ['python', 'unreal']
    ];

    // Simple solar system: 3 suns at fixed positions, moons orbit around them
    // Positions in world units (will be multiplied by minDim to get screen pixels)
    // Spread them out more for better visibility
    const sunBasePositions = {
        unity:    { dirX: -0.92, dirY:  0.40, dist: 0.38 },   // Left-top direction
        unreal:   { dirX:  0.87, dirY: -0.50, dist: 0.40 },   // Right-bottom direction
        graphics: { dirX:  0.0,  dirY:  1.0,  dist: 0.38 }    // Top-center direction
    };

    // Dynamic sun position calculation
    function getSunPosition(sunId) {
        const base = sunBasePositions[sunId];
        const minDist = orbitParams.sunSpawnMin;
        const maxDist = orbitParams.sunSpawnMax;
        const spread = orbitParams.sunSpread;
        const offset = orbitParams.spawnOffset;
        // Map base distance (0-1) to min-max range, then apply spread
        const actualDist = (minDist + base.dist * (maxDist - minDist)) * spread;
        // Apply rotation offset to the direction
        const cosOff = Math.cos(offset);
        const sinOff = Math.sin(offset);
        const rotX = base.dirX * cosOff - base.dirY * sinOff;
        const rotY = base.dirX * sinOff + base.dirY * cosOff;
        return {
            x: rotX * actualDist,
            y: rotY * actualDist,
            z: 0
        };
    }

    // Per-solar-system orbital plane tilt (random axis for each sun's entire system)
    // All moons of the same sun share the same orbital plane
    const solarSystemTilts = {
        unity:    { tiltX: 0.4, tiltY: 0.3 },    // Unity system tilted one way
        unreal:   { tiltX: -0.5, tiltY: 0.2 },   // Unreal system tilted differently
        graphics: { tiltX: 0.2, tiltY: -0.4 }    // Graphics system with its own tilt
    };

    // Moon orbit configurations - baseRadius is normalized 0-1 (mapped to baseOrbitMin-Max)
    // All moons of the same sun share the solar system's orbital plane tilt
    // Final radius = (baseOrbitMin + baseRadius * (baseOrbitMax - baseOrbitMin)) + (orbitIndex * spacing)
    const moonOrbits = {
        // Unity moons (all share unity's orbital plane)
        csharp:   { baseRadius: 0.5, orbitIndex: 0, speed: 0.008, phase: 0, sun: 'unity' },
        vfx:      { baseRadius: 0.5, orbitIndex: 1, speed: -0.006, phase: Math.PI * 0.66, sun: 'unity' },
        arvr:     { baseRadius: 0.5, orbitIndex: 2, speed: 0.005, phase: Math.PI * 1.33, sun: 'unity' },
        // Unreal moons (all share unreal's orbital plane)
        cpp:      { baseRadius: 0.5, orbitIndex: 0, speed: 0.007, phase: 0, sun: 'unreal' },
        niagara:  { baseRadius: 0.5, orbitIndex: 1, speed: -0.005, phase: Math.PI, sun: 'unreal' },
        // Graphics moons (all share graphics' orbital plane)
        hlsl:     { baseRadius: 0.25, orbitIndex: 0, speed: 0.009, phase: 0, sun: 'graphics' },
        glsl:     { baseRadius: 0.25, orbitIndex: 1, speed: -0.007, phase: Math.PI * 0.4, sun: 'graphics' },
        directx:  { baseRadius: 0.25, orbitIndex: 2, speed: 0.006, phase: Math.PI * 0.8, sun: 'graphics' },
        opengl:   { baseRadius: 0.25, orbitIndex: 3, speed: -0.005, phase: Math.PI * 1.2, sun: 'graphics' },
        compute:  { baseRadius: 0.25, orbitIndex: 4, speed: 0.004, phase: Math.PI * 1.6, sun: 'graphics' }
    };

    // Sub-moons: former free floaters now orbit around planets (not suns)
    // They orbit at 1/3 the size/radius of their parent moon
    const subMoonOrbits = {
        renderdoc: { radius: 0.035, speed: 0.015, phase: 0, parent: 'directx', tiltX: 0.3, tiltY: -0.2 },
        nsight:    { radius: 0.03, speed: -0.012, phase: Math.PI * 0.5, parent: 'hlsl', tiltX: -0.4, tiltY: 0.35 },
        python:    { radius: 0.04, speed: 0.01, phase: Math.PI, parent: 'niagara', tiltX: 0.2, tiltY: 0.5 },
        threejs:   { radius: 0.038, speed: -0.014, phase: Math.PI * 1.5, parent: 'glsl', tiltX: -0.25, tiltY: -0.4 }
    };

    // Find parent sun for each planet based on connections
    function findParentSun(skillId) {
        const suns = ['unity', 'unreal', 'graphics'];
        if (suns.includes(skillId)) return null; // Suns have no parent

        // Check direct connections first
        for (const [a, b] of connections) {
            if (a === skillId && suns.includes(b)) return b;
            if (b === skillId && suns.includes(a)) return a;
        }

        // Check indirect connections (connected to something connected to a sun)
        for (const [a, b] of connections) {
            const connectedId = a === skillId ? b : (b === skillId ? a : null);
            if (!connectedId) continue;
            for (const [c, d] of connections) {
                if (c === connectedId && suns.includes(d)) return d;
                if (d === connectedId && suns.includes(c)) return c;
            }
        }
        return null;
    }

    let nodes = skills.map((skill) => {
        // Compute depth based on size: larger = closer (depth 1), smaller = farther (depth 0)
        // This is used for visual layering, NOT for perspective Z position
        const depth = Math.min(1.0, Math.max(0.0, (skill.baseSize - 6) / 28));

        // Orbital parameters for planets
        const parentSun = findParentSun(skill.id);

        // Random but not perpendicular orbital plane tilt (max ~45 degrees from XY plane)
        const orbitTiltX = (Math.random() - 0.5) * 0.8; // Tilt around X axis
        const orbitTiltZ = (Math.random() - 0.5) * 0.8; // Tilt around Z axis

        return {
            ...skill,
            size: skill.baseSize,
            x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, // Added z and vz for 3D positioning
            renderX: 0, renderY: 0, // Parallax-adjusted render positions
            depth: depth, // Depth for parallax (0=far, 1=near)
            // Orbital parameters
            parentSun: parentSun,
            orbitAngle: Math.random() * Math.PI * 2, // Starting angle in orbit
            orbitRadius: 0, // Will be assigned based on distance from sun
            orbitSpeed: 0.0005 + Math.random() * 0.001, // Orbital speed (radians per frame)
            orbitTiltX: orbitTiltX,
            orbitTiltZ: orbitTiltZ,
            // Visual effects
            pulseSpeed: 0.05 + Math.random() * 0.1,
            pulsePhase: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.001,
            glowIntensity: 0, targetGlowIntensity: 0, glowDelay: 0,
            shrinkProgress: 1, targetShrink: 1
        };
    });

    let width, height, centerX, centerY;
    let isDragging = false, dragNode = null, hoveredNode = null;
    let mouseX = 0, mouseY = 0;  // World coordinates (for dragging nodes)
    let mouseScreenX = 0, mouseScreenY = 0;  // Screen coordinates (for hit testing)
    let settled = false, settleTimer = 0;
    let startupPhase = true, globalFadeIn = 0;
    let zoomLevel = 1.0, targetZoom = 1.0;
    let zoomCenterX = 0, zoomCenterY = 0;
    let targetZoomCenterX = 0, targetZoomCenterY = 0;
    const MIN_ZOOM = 1.0, MAX_ZOOM = 3.0;
    let mouseLightEnabled = false; // Toggle with spacebar

    // Camera rotation (Alt + Right Click orbit)
    let cameraRotX = 0, cameraRotY = 0;  // Current rotation
    let targetCameraRotX = 0, targetCameraRotY = 0;  // Target rotation
    let isOrbiting = false;  // Alt + Right Click dragging
    let orbitStartX = 0, orbitStartY = 0;  // Mouse position when orbit started
    let orbitStartRotX = 0, orbitStartRotY = 0;  // Camera rotation when orbit started

    const tooltip = document.getElementById('skill-tooltip');
    const tooltipTitle = tooltip.querySelector('.skill-tooltip-title');
    const tooltipDesc = tooltip.querySelector('.skill-tooltip-desc');
    const tooltipUsage = tooltip.querySelector('.skill-tooltip-usage');

    let tooltipTarget = null, tooltipPos = { x: 0, y: 0 }, tooltipConnectPoint = { x: 0, y: 0 };
    let lineAnimProgress = 0, lineAnimStartTime = 0;
    const lineAnimDuration = 300;
    let tooltipSide = 'right';


    let tooltipOffset = { x: 0, y: 0 };
    const tooltipWidth = 260, tooltipHeight = 120;

    function generateTooltipPosition(node) {
        const margin = 20;
        // Use screen-space coordinates (renderX/renderY) for tooltip positioning
        const nodeScreenX = node.renderX !== undefined ? node.renderX : node.x;
        const nodeScreenY = node.renderY !== undefined ? node.renderY : node.y;

        tooltipSide = Math.random() > 0.5 ? 'right' : 'left';
        let tx = tooltipSide === 'right' ? width - tooltipWidth - margin : margin;
        const minY = margin, maxY = height - tooltipHeight - margin;
        let ty = nodeScreenY - tooltipHeight / 2 + (Math.random() - 0.5) * 100;
        ty = Math.max(minY, Math.min(maxY, ty));
        tooltipPos = { x: tx, y: ty };
        tooltipOffset = { x: tx - nodeScreenX, y: ty - nodeScreenY };
        tooltipConnectPoint = tooltipSide === 'right'
            ? { x: tx, y: ty + tooltipHeight / 2 }
            : { x: tx + tooltipWidth, y: ty + tooltipHeight / 2 };
        lineAnimProgress = 0;
        lineAnimStartTime = performance.now();
    }

    function updateTooltipPositionForDrag(node) {
        const margin = 20;
        // Use screen-space coordinates (renderX/renderY) for tooltip positioning
        const nodeScreenX = node.renderX !== undefined ? node.renderX : node.x;
        const nodeScreenY = node.renderY !== undefined ? node.renderY : node.y;

        let tx = Math.max(margin, Math.min(width - tooltipWidth - margin, nodeScreenX + tooltipOffset.x));
        let ty = Math.max(margin, Math.min(height - tooltipHeight - margin, nodeScreenY + tooltipOffset.y));
        tooltipPos = { x: tx, y: ty };
        tooltipConnectPoint = tooltipSide === 'right'
            ? { x: tx, y: ty + tooltipHeight / 2 }
            : { x: tx + tooltipWidth, y: ty + tooltipHeight / 2 };
        tooltip.style.left = tooltipPos.x + 'px';
        tooltip.style.top = tooltipPos.y + 'px';
    }

    function updateTooltip(node, forceKeep = false) {
        if (node) {
            if (tooltipTarget !== node && !isDragging) {
                tooltipTarget = node;
                generateTooltipPosition(node);
                tooltip.classList.remove('visible');
            }
            tooltipTitle.textContent = node.label;
            tooltipDesc.textContent = node.desc || '';
            tooltipUsage.textContent = node.usage || '';
            tooltip.className = 'skill-tooltip ' + node.category + (lineAnimProgress >= 1 ? ' visible' : '');
            tooltip.style.left = tooltipPos.x + 'px';
            tooltip.style.top = tooltipPos.y + 'px';
        } else if (!forceKeep) {
            tooltip.classList.remove('visible');
            tooltipTarget = null;
            lineAnimProgress = 0;
        }
    }

    function drawTooltipConnector() {
        if (!tooltipTarget) return;
        const elapsed = performance.now() - lineAnimStartTime;
        lineAnimProgress = Math.min(1, elapsed / lineAnimDuration);
        if (lineAnimProgress >= 1 && !tooltip.classList.contains('visible')) tooltip.classList.add('visible');

        const node = tooltipTarget;
        // Use screen-space coordinates (renderX/renderY) for connector drawing
        const nodeScreenX = node.renderX !== undefined ? node.renderX : node.x;
        const nodeScreenY = node.renderY !== undefined ? node.renderY : node.y;

        let lineColor = node.category === 'primary' ? colors.gold : node.category === 'secondary' ? colors.teal : colors.textMuted;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;

        const cornerX = nodeScreenX, cornerY = tooltipConnectPoint.y;
        const verticalDist = Math.abs(cornerY - nodeScreenY);
        const horizontalDist = Math.abs(tooltipConnectPoint.x - cornerX);
        const totalDist = verticalDist + horizontalDist;
        const drawDist = totalDist * lineAnimProgress;

        ctx.beginPath();
        ctx.moveTo(nodeScreenX, nodeScreenY);
        if (drawDist <= verticalDist) {
            ctx.lineTo(nodeScreenX, nodeScreenY + (cornerY - nodeScreenY) * (drawDist / verticalDist));
        } else {
            ctx.lineTo(cornerX, cornerY);
            const hProgress = (drawDist - verticalDist) / horizontalDist;
            ctx.lineTo(cornerX + (tooltipConnectPoint.x - cornerX) * hProgress, cornerY);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(nodeScreenX, nodeScreenY, 3, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
    }

    // WebGL sphere renderer
    let gl, glCanvas, sphereProgram, sunProgram, godRaysProgram, debugQuadProgram, glReady = false;
    let godRaysQuadBuffer, debugQuadBuffer;
    let showDebugQuads = false; // Toggle for debug quad overlay

    // Space particles system
    let spaceParticleProgram = null;
    let spaceParticleBuffer = null;
    const SPACE_PARTICLE_COUNT = 25000;  // 25k particles for good density
    let spaceParticleData = null;  // Float32Array for particle positions
    let spaceParticleLastTime = 0;

    // Shooting star data (separate from main particle buffer)
    // Each entry: { active: bool, type: 1=gold/2=teal, progress: 0-1, vx, vy, vz, originalIdx }
    let shootingStars = [];

    // Shooting star parameters (UI-controllable)
    const shootingStarParams = {
        chance: 0.1,              // DEBUG: Very frequent (normal: 0.0003)
        duration: 0.8,            // Duration in seconds
        speed: 0.4,               // Speed multiplier
        maxActive: 5,             // Maximum concurrent shooting stars
        goldColor: '#e8b923',     // Gold color (accent-gold)
        tealColor: '#2dd4bf'      // Teal color (accent-teal)
    };

    // Space particle DoF parameters (UI-controllable)
    const spaceParticleParams = {
        // Focus distance settings
        focusDistance: 0.7,     // Distance from camera where particles are in focus
        focusRange: 0.15,       // Range around focus distance that's sharp
        nearBlurDist: 0.3,      // Distance where near blur starts
        farBlurDist: 1.2,       // Distance where far blur starts

        // Bokeh effect
        maxBlurSize: 25.0,      // Maximum blur circle size in pixels
        apertureSize: 1.0,      // Affects bokeh intensity (f-stop simulation)
        bokehRingWidth: 0.5,    // Width of bokeh ring (0 = filled, 1 = thin ring)
        bokehRingIntensity: 0.8, // Brightness of ring edge

        // Circle quality
        circleSoftness: 0.3,    // Edge softness (0 = hard, 1 = very soft)

        // Appearance
        particleSize: 2.0,      // Base particle size
        brightness: 1.0,        // Overall particle brightness
        lightFalloff: 3.0,      // How quickly light falls off with distance
        baseColor: '#fffaf2',   // Default warm white particle color

        // Internal
        sphereRadius: 0.35,     // Particle distribution sphere radius
        planetZ: 0.0            // Z depth where planets live (for depth sorting)
    };

    // God rays parameters (UI-controllable)
    const godRaysParams = {
        rayIntensity: 0.5,    // Light ray intensity (0-2)
        rayFalloff: 4.0,      // Ray falloff exponent (1-10)
        glowIntensity: 0.5,   // Glow intensity (0-2)
        glowSize: 4.0,        // Glow size/falloff (1-12)
        fogDensity: 6.0,      // Fog noise density (1-15)
        ambientFog: 0.08,     // Ambient fog intensity (0-0.3)
        animSpeed: 1.0,       // Animation speed multiplier (0-3)
        noiseScale: 1.0,      // Noise frequency scale (0.1-3)
        noiseOctaves: 1.0,    // Noise detail/octaves blend (0-2)
        noiseContrast: 1.0    // Noise contrast/sharpness (0.2-3)
    };

    function initSphereGL() {
        glCanvas = document.createElement('canvas');
        glCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
        container.insertBefore(glCanvas, container.firstChild);

        gl = glCanvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
        if (!gl) return false;

        function comp(s, t) {
            const sh = gl.createShader(t);
            gl.shaderSource(sh, s);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(sh));
                return null;
            }
            return sh;
        }

        const vs = comp(sphereVertexShader, gl.VERTEX_SHADER);
        const fs = comp(sphereFragmentShader, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return false;

        sphereProgram = gl.createProgram();
        gl.attachShader(sphereProgram, vs);
        gl.attachShader(sphereProgram, fs);
        gl.linkProgram(sphereProgram);

        if (!gl.getProgramParameter(sphereProgram, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(sphereProgram));
            return false;
        }

        sphereProgram.aPos = gl.getAttribLocation(sphereProgram, 'aPos');
        sphereProgram.aCenter = gl.getAttribLocation(sphereProgram, 'aCenter');
        sphereProgram.aRadius = gl.getAttribLocation(sphereProgram, 'aRadius');
        sphereProgram.aColor = gl.getAttribLocation(sphereProgram, 'aColor');
        sphereProgram.aAlpha = gl.getAttribLocation(sphereProgram, 'aAlpha');
        sphereProgram.aAppear = gl.getAttribLocation(sphereProgram, 'aAppear');
        sphereProgram.aGlow = gl.getAttribLocation(sphereProgram, 'aGlow');
        sphereProgram.aIndex = gl.getAttribLocation(sphereProgram, 'aIndex');
        sphereProgram.aIsLight = gl.getAttribLocation(sphereProgram, 'aIsLight');
        sphereProgram.aDepth = gl.getAttribLocation(sphereProgram, 'aDepth');
        sphereProgram.aZ = gl.getAttribLocation(sphereProgram, 'aZ');
        sphereProgram.uRes = gl.getUniformLocation(sphereProgram, 'uRes');
        sphereProgram.uMouse = gl.getUniformLocation(sphereProgram, 'uMouse');
        sphereProgram.uTime = gl.getUniformLocation(sphereProgram, 'uTime');
        sphereProgram.uLight0 = gl.getUniformLocation(sphereProgram, 'uLight0');
        sphereProgram.uLight1 = gl.getUniformLocation(sphereProgram, 'uLight1');
        sphereProgram.uLight2 = gl.getUniformLocation(sphereProgram, 'uLight2');
        sphereProgram.uLightColor0 = gl.getUniformLocation(sphereProgram, 'uLightColor0');
        sphereProgram.uLightColor1 = gl.getUniformLocation(sphereProgram, 'uLightColor1');
        sphereProgram.uLightColor2 = gl.getUniformLocation(sphereProgram, 'uLightColor2');
        sphereProgram.uLight0Intensity = gl.getUniformLocation(sphereProgram, 'uLight0Intensity');
        sphereProgram.uLight1Intensity = gl.getUniformLocation(sphereProgram, 'uLight1Intensity');
        sphereProgram.uLight2Intensity = gl.getUniformLocation(sphereProgram, 'uLight2Intensity');
        sphereProgram.uLight0Atten = gl.getUniformLocation(sphereProgram, 'uLight0Atten');
        sphereProgram.uLight1Atten = gl.getUniformLocation(sphereProgram, 'uLight1Atten');
        sphereProgram.uLight2Atten = gl.getUniformLocation(sphereProgram, 'uLight2Atten');
        sphereProgram.uLight0Z = gl.getUniformLocation(sphereProgram, 'uLight0Z');
        sphereProgram.uLight1Z = gl.getUniformLocation(sphereProgram, 'uLight1Z');
        sphereProgram.uLight2Z = gl.getUniformLocation(sphereProgram, 'uLight2Z');
        sphereProgram.uLight0WorldPos = gl.getUniformLocation(sphereProgram, 'uLight0WorldPos');
        sphereProgram.uLight1WorldPos = gl.getUniformLocation(sphereProgram, 'uLight1WorldPos');
        sphereProgram.uLight2WorldPos = gl.getUniformLocation(sphereProgram, 'uLight2WorldPos');
        sphereProgram.uLight0ScreenPos = gl.getUniformLocation(sphereProgram, 'uLight0ScreenPos');
        sphereProgram.uLight1ScreenPos = gl.getUniformLocation(sphereProgram, 'uLight1ScreenPos');
        sphereProgram.uLight2ScreenPos = gl.getUniformLocation(sphereProgram, 'uLight2ScreenPos');
        sphereProgram.uMouseLightEnabled = gl.getUniformLocation(sphereProgram, 'uMouseLightEnabled');
        sphereProgram.uAmbientIntensity = gl.getUniformLocation(sphereProgram, 'uAmbientIntensity');
        sphereProgram.uFogIntensity = gl.getUniformLocation(sphereProgram, 'uFogIntensity');
        sphereProgram.uZoom = gl.getUniformLocation(sphereProgram, 'uZoom');
        sphereProgram.uZoomCenter = gl.getUniformLocation(sphereProgram, 'uZoomCenter');
        sphereProgram.uCameraRotX = gl.getUniformLocation(sphereProgram, 'uCameraRotX');
        sphereProgram.uCameraRotY = gl.getUniformLocation(sphereProgram, 'uCameraRotY');

        // Planet A (Oceanic/Mountain) uniforms
        sphereProgram.uNoiseScaleA = gl.getUniformLocation(sphereProgram, 'uNoiseScaleA');
        sphereProgram.uTerrainHeightA = gl.getUniformLocation(sphereProgram, 'uTerrainHeightA');
        sphereProgram.uAtmosIntensityA = gl.getUniformLocation(sphereProgram, 'uAtmosIntensityA');
        sphereProgram.uAtmosThicknessA = gl.getUniformLocation(sphereProgram, 'uAtmosThicknessA');
        sphereProgram.uAtmosPowerA = gl.getUniformLocation(sphereProgram, 'uAtmosPowerA');
        sphereProgram.uScatterRA = gl.getUniformLocation(sphereProgram, 'uScatterRA');
        sphereProgram.uScatterGA = gl.getUniformLocation(sphereProgram, 'uScatterGA');
        sphereProgram.uScatterBA = gl.getUniformLocation(sphereProgram, 'uScatterBA');
        sphereProgram.uScatterScaleA = gl.getUniformLocation(sphereProgram, 'uScatterScaleA');
        sphereProgram.uSunsetStrengthA = gl.getUniformLocation(sphereProgram, 'uSunsetStrengthA');
        sphereProgram.uOceanRoughnessA = gl.getUniformLocation(sphereProgram, 'uOceanRoughnessA');
        sphereProgram.uSSSIntensityA = gl.getUniformLocation(sphereProgram, 'uSSSIntensityA');
        sphereProgram.uSeaLevelA = gl.getUniformLocation(sphereProgram, 'uSeaLevelA');
        sphereProgram.uLandRoughnessA = gl.getUniformLocation(sphereProgram, 'uLandRoughnessA');
        sphereProgram.uNormalStrengthA = gl.getUniformLocation(sphereProgram, 'uNormalStrengthA');

        // Planet B (Lava/Desert) uniforms
        sphereProgram.uNoiseScaleB = gl.getUniformLocation(sphereProgram, 'uNoiseScaleB');
        sphereProgram.uTerrainHeightB = gl.getUniformLocation(sphereProgram, 'uTerrainHeightB');
        sphereProgram.uAtmosIntensityB = gl.getUniformLocation(sphereProgram, 'uAtmosIntensityB');
        sphereProgram.uAtmosThicknessB = gl.getUniformLocation(sphereProgram, 'uAtmosThicknessB');
        sphereProgram.uAtmosPowerB = gl.getUniformLocation(sphereProgram, 'uAtmosPowerB');
        sphereProgram.uScatterRB = gl.getUniformLocation(sphereProgram, 'uScatterRB');
        sphereProgram.uScatterGB = gl.getUniformLocation(sphereProgram, 'uScatterGB');
        sphereProgram.uScatterBB = gl.getUniformLocation(sphereProgram, 'uScatterBB');
        sphereProgram.uScatterScaleB = gl.getUniformLocation(sphereProgram, 'uScatterScaleB');
        sphereProgram.uSunsetStrengthB = gl.getUniformLocation(sphereProgram, 'uSunsetStrengthB');
        sphereProgram.uLavaIntensityB = gl.getUniformLocation(sphereProgram, 'uLavaIntensityB');
        sphereProgram.uSeaLevelB = gl.getUniformLocation(sphereProgram, 'uSeaLevelB');
        sphereProgram.uLandRoughnessB = gl.getUniformLocation(sphereProgram, 'uLandRoughnessB');
        sphereProgram.uNormalStrengthB = gl.getUniformLocation(sphereProgram, 'uNormalStrengthB');

        sphereProgram.buf = gl.createBuffer();

        // Sun program (separate shader for suns with halo effects)
        const sunFs = comp(sunFragmentShader, gl.FRAGMENT_SHADER);
        if (!sunFs) {
            console.error('Sun fragment shader compilation failed');
            return false;
        }

        sunProgram = gl.createProgram();
        gl.attachShader(sunProgram, vs); // Reuse vertex shader
        gl.attachShader(sunProgram, sunFs);
        gl.linkProgram(sunProgram);

        if (!gl.getProgramParameter(sunProgram, gl.LINK_STATUS)) {
            console.error('Sun program link error:', gl.getProgramInfoLog(sunProgram));
            return false;
        }

        // Sun program attributes (same as planet)
        sunProgram.aPos = gl.getAttribLocation(sunProgram, 'aPos');
        sunProgram.aCenter = gl.getAttribLocation(sunProgram, 'aCenter');
        sunProgram.aRadius = gl.getAttribLocation(sunProgram, 'aRadius');
        sunProgram.aColor = gl.getAttribLocation(sunProgram, 'aColor');
        sunProgram.aAlpha = gl.getAttribLocation(sunProgram, 'aAlpha');
        sunProgram.aAppear = gl.getAttribLocation(sunProgram, 'aAppear');
        sunProgram.aGlow = gl.getAttribLocation(sunProgram, 'aGlow');
        sunProgram.aIndex = gl.getAttribLocation(sunProgram, 'aIndex');
        sunProgram.aIsLight = gl.getAttribLocation(sunProgram, 'aIsLight');
        sunProgram.aDepth = gl.getAttribLocation(sunProgram, 'aDepth');
        sunProgram.aZ = gl.getAttribLocation(sunProgram, 'aZ');

        // Sun program uniforms
        sunProgram.uRes = gl.getUniformLocation(sunProgram, 'uRes');
        sunProgram.uTime = gl.getUniformLocation(sunProgram, 'uTime');
        sunProgram.uZoom = gl.getUniformLocation(sunProgram, 'uZoom');
        sunProgram.uZoomCenter = gl.getUniformLocation(sunProgram, 'uZoomCenter');
        sunProgram.uCameraRotX = gl.getUniformLocation(sunProgram, 'uCameraRotX');
        sunProgram.uCameraRotY = gl.getUniformLocation(sunProgram, 'uCameraRotY');

        // Sun halo parameter uniforms
        sunProgram.uSunCoreSize = gl.getUniformLocation(sunProgram, 'uSunCoreSize');
        sunProgram.uSunGlowSize = gl.getUniformLocation(sunProgram, 'uSunGlowSize');
        sunProgram.uSunGlowIntensity = gl.getUniformLocation(sunProgram, 'uSunGlowIntensity');
        sunProgram.uSunCoronaIntensity = gl.getUniformLocation(sunProgram, 'uSunCoronaIntensity');
        sunProgram.uSunRayCount = gl.getUniformLocation(sunProgram, 'uSunRayCount');
        sunProgram.uSunRayIntensity = gl.getUniformLocation(sunProgram, 'uSunRayIntensity');
        sunProgram.uSunRayLength = gl.getUniformLocation(sunProgram, 'uSunRayLength');
        sunProgram.uSunStreamerCount = gl.getUniformLocation(sunProgram, 'uSunStreamerCount');
        sunProgram.uSunStreamerIntensity = gl.getUniformLocation(sunProgram, 'uSunStreamerIntensity');
        sunProgram.uSunStreamerLength = gl.getUniformLocation(sunProgram, 'uSunStreamerLength');
        sunProgram.uSunHaloRing1Dist = gl.getUniformLocation(sunProgram, 'uSunHaloRing1Dist');
        sunProgram.uSunHaloRing1Intensity = gl.getUniformLocation(sunProgram, 'uSunHaloRing1Intensity');
        sunProgram.uSunHaloRing2Dist = gl.getUniformLocation(sunProgram, 'uSunHaloRing2Dist');
        sunProgram.uSunHaloRing2Intensity = gl.getUniformLocation(sunProgram, 'uSunHaloRing2Intensity');
        sunProgram.uSunFlickerSpeed = gl.getUniformLocation(sunProgram, 'uSunFlickerSpeed');
        sunProgram.uSunPulseSpeed = gl.getUniformLocation(sunProgram, 'uSunPulseSpeed');
        sunProgram.uSunChromaticShift = gl.getUniformLocation(sunProgram, 'uSunChromaticShift');

        sunProgram.buf = gl.createBuffer();

        // God rays program
        const grVs = comp(godRaysVertexShader, gl.VERTEX_SHADER);
        const grFs = comp(godRaysFragmentShader, gl.FRAGMENT_SHADER);
        if (grVs && grFs) {
            godRaysProgram = gl.createProgram();
            gl.attachShader(godRaysProgram, grVs);
            gl.attachShader(godRaysProgram, grFs);
            gl.linkProgram(godRaysProgram);

            if (gl.getProgramParameter(godRaysProgram, gl.LINK_STATUS)) {
                godRaysProgram.aPosition = gl.getAttribLocation(godRaysProgram, 'aPosition');
                godRaysProgram.uResolution = gl.getUniformLocation(godRaysProgram, 'uResolution');
                godRaysProgram.uTime = gl.getUniformLocation(godRaysProgram, 'uTime');
                godRaysProgram.uMouse = gl.getUniformLocation(godRaysProgram, 'uMouse');
                godRaysProgram.uLight0 = gl.getUniformLocation(godRaysProgram, 'uLight0');
                godRaysProgram.uLight1 = gl.getUniformLocation(godRaysProgram, 'uLight1');
                godRaysProgram.uLight2 = gl.getUniformLocation(godRaysProgram, 'uLight2');
                godRaysProgram.uLightColor0 = gl.getUniformLocation(godRaysProgram, 'uLightColor0');
                godRaysProgram.uLightColor1 = gl.getUniformLocation(godRaysProgram, 'uLightColor1');
                godRaysProgram.uLightColor2 = gl.getUniformLocation(godRaysProgram, 'uLightColor2');
                godRaysProgram.uZoom = gl.getUniformLocation(godRaysProgram, 'uZoom');
                godRaysProgram.uZoomCenter = gl.getUniformLocation(godRaysProgram, 'uZoomCenter');
                godRaysProgram.uCameraRotX = gl.getUniformLocation(godRaysProgram, 'uCameraRotX');
                godRaysProgram.uCameraRotY = gl.getUniformLocation(godRaysProgram, 'uCameraRotY');
                // Controllable parameters
                godRaysProgram.uRayIntensity = gl.getUniformLocation(godRaysProgram, 'uRayIntensity');
                godRaysProgram.uRayFalloff = gl.getUniformLocation(godRaysProgram, 'uRayFalloff');
                godRaysProgram.uGlowIntensity = gl.getUniformLocation(godRaysProgram, 'uGlowIntensity');
                godRaysProgram.uGlowSize = gl.getUniformLocation(godRaysProgram, 'uGlowSize');
                godRaysProgram.uFogDensity = gl.getUniformLocation(godRaysProgram, 'uFogDensity');
                godRaysProgram.uAmbientFog = gl.getUniformLocation(godRaysProgram, 'uAmbientFog');
                godRaysProgram.uAnimSpeed = gl.getUniformLocation(godRaysProgram, 'uAnimSpeed');
                godRaysProgram.uNoiseScale = gl.getUniformLocation(godRaysProgram, 'uNoiseScale');
                godRaysProgram.uNoiseOctaves = gl.getUniformLocation(godRaysProgram, 'uNoiseOctaves');
                godRaysProgram.uNoiseContrast = gl.getUniformLocation(godRaysProgram, 'uNoiseContrast');

                // Fullscreen quad buffer
                godRaysQuadBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, godRaysQuadBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                    -1, -1,  1, -1,  1, 1,
                    -1, -1,  1, 1,  -1, 1
                ]), gl.STATIC_DRAW);
            } else {
                console.error('God rays program link error:', gl.getProgramInfoLog(godRaysProgram));
                godRaysProgram = null;
            }
        }

        // Debug quad program
        if (debugQuadVertexShader && debugQuadFragmentShader) {
            const dqVs = comp(debugQuadVertexShader, gl.VERTEX_SHADER);
            const dqFs = comp(debugQuadFragmentShader, gl.FRAGMENT_SHADER);
            if (dqVs && dqFs) {
                debugQuadProgram = gl.createProgram();
                gl.attachShader(debugQuadProgram, dqVs);
                gl.attachShader(debugQuadProgram, dqFs);
                gl.linkProgram(debugQuadProgram);

                if (gl.getProgramParameter(debugQuadProgram, gl.LINK_STATUS)) {
                    debugQuadProgram.aPosition = gl.getAttribLocation(debugQuadProgram, 'aPosition');
                    debugQuadProgram.uCenter = gl.getUniformLocation(debugQuadProgram, 'uCenter');
                    debugQuadProgram.uSize = gl.getUniformLocation(debugQuadProgram, 'uSize');
                    debugQuadProgram.uResolution = gl.getUniformLocation(debugQuadProgram, 'uResolution');
                    debugQuadProgram.uZoom = gl.getUniformLocation(debugQuadProgram, 'uZoom');
                    debugQuadProgram.uCameraRotX = gl.getUniformLocation(debugQuadProgram, 'uCameraRotX');
                    debugQuadProgram.uCameraRotY = gl.getUniformLocation(debugQuadProgram, 'uCameraRotY');
                    debugQuadProgram.uWorldZ = gl.getUniformLocation(debugQuadProgram, 'uWorldZ');

                    // Quad buffer (2 triangles)
                    debugQuadBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, debugQuadBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                        -1, -1,  1, -1,  1, 1,
                        -1, -1,  1, 1,  -1, 1
                    ]), gl.STATIC_DRAW);
                    console.log('Debug quad shader loaded');
                } else {
                    console.error('Debug quad program link error:', gl.getProgramInfoLog(debugQuadProgram));
                    debugQuadProgram = null;
                }
            }
        }

        // Space particles program
        const spVs = comp(spaceParticleVertexShader, gl.VERTEX_SHADER);
        const spFs = comp(spaceParticleFragmentShader, gl.FRAGMENT_SHADER);
        if (spVs && spFs) {
            spaceParticleProgram = gl.createProgram();
            gl.attachShader(spaceParticleProgram, spVs);
            gl.attachShader(spaceParticleProgram, spFs);
            gl.linkProgram(spaceParticleProgram);

            if (gl.getProgramParameter(spaceParticleProgram, gl.LINK_STATUS)) {
                spaceParticleProgram.aPosition = gl.getAttribLocation(spaceParticleProgram, 'aPosition');
                spaceParticleProgram.aLife = gl.getAttribLocation(spaceParticleProgram, 'aLife');
                spaceParticleProgram.uResolution = gl.getUniformLocation(spaceParticleProgram, 'uResolution');
                spaceParticleProgram.uZoom = gl.getUniformLocation(spaceParticleProgram, 'uZoom');
                spaceParticleProgram.uZoomCenter = gl.getUniformLocation(spaceParticleProgram, 'uZoomCenter');
                spaceParticleProgram.uTime = gl.getUniformLocation(spaceParticleProgram, 'uTime');

                // DoF uniforms
                spaceParticleProgram.uFocusDistance = gl.getUniformLocation(spaceParticleProgram, 'uFocusDistance');
                spaceParticleProgram.uFocusRange = gl.getUniformLocation(spaceParticleProgram, 'uFocusRange');
                spaceParticleProgram.uNearBlurDist = gl.getUniformLocation(spaceParticleProgram, 'uNearBlurDist');
                spaceParticleProgram.uFarBlurDist = gl.getUniformLocation(spaceParticleProgram, 'uFarBlurDist');
                spaceParticleProgram.uMaxBlurSize = gl.getUniformLocation(spaceParticleProgram, 'uMaxBlurSize');
                spaceParticleProgram.uApertureSize = gl.getUniformLocation(spaceParticleProgram, 'uApertureSize');

                // Particle appearance uniforms
                spaceParticleProgram.uParticleSize = gl.getUniformLocation(spaceParticleProgram, 'uParticleSize');
                spaceParticleProgram.uBrightness = gl.getUniformLocation(spaceParticleProgram, 'uBrightness');
                spaceParticleProgram.uSphereRadius = gl.getUniformLocation(spaceParticleProgram, 'uSphereRadius');

                // Render control uniforms
                spaceParticleProgram.uPlanetZ = gl.getUniformLocation(spaceParticleProgram, 'uPlanetZ');
                spaceParticleProgram.uRenderPass = gl.getUniformLocation(spaceParticleProgram, 'uRenderPass');
                spaceParticleProgram.uCameraRotX = gl.getUniformLocation(spaceParticleProgram, 'uCameraRotX');
                spaceParticleProgram.uCameraRotY = gl.getUniformLocation(spaceParticleProgram, 'uCameraRotY');

                // Fragment shader uniforms
                spaceParticleProgram.uCircleSoftness = gl.getUniformLocation(spaceParticleProgram, 'uCircleSoftness');
                spaceParticleProgram.uBokehRingWidth = gl.getUniformLocation(spaceParticleProgram, 'uBokehRingWidth');
                spaceParticleProgram.uBokehRingIntensity = gl.getUniformLocation(spaceParticleProgram, 'uBokehRingIntensity');
                spaceParticleProgram.uLightFalloff = gl.getUniformLocation(spaceParticleProgram, 'uLightFalloff');

                // Sun light uniforms for particle coloring
                spaceParticleProgram.uLight0 = gl.getUniformLocation(spaceParticleProgram, 'uLight0');
                spaceParticleProgram.uLight1 = gl.getUniformLocation(spaceParticleProgram, 'uLight1');
                spaceParticleProgram.uLight2 = gl.getUniformLocation(spaceParticleProgram, 'uLight2');
                spaceParticleProgram.uLightColor0 = gl.getUniformLocation(spaceParticleProgram, 'uLightColor0');
                spaceParticleProgram.uLightColor1 = gl.getUniformLocation(spaceParticleProgram, 'uLightColor1');
                spaceParticleProgram.uLightColor2 = gl.getUniformLocation(spaceParticleProgram, 'uLightColor2');
                spaceParticleProgram.uLight0Intensity = gl.getUniformLocation(spaceParticleProgram, 'uLight0Intensity');
                spaceParticleProgram.uLight1Intensity = gl.getUniformLocation(spaceParticleProgram, 'uLight1Intensity');
                spaceParticleProgram.uLight2Intensity = gl.getUniformLocation(spaceParticleProgram, 'uLight2Intensity');

                // Shooting star color uniforms
                spaceParticleProgram.uShootingGoldColor = gl.getUniformLocation(spaceParticleProgram, 'uShootingGoldColor');
                spaceParticleProgram.uShootingTealColor = gl.getUniformLocation(spaceParticleProgram, 'uShootingTealColor');

                // Base particle color uniform
                spaceParticleProgram.uBaseParticleColor = gl.getUniformLocation(spaceParticleProgram, 'uBaseParticleColor');

                // Initialize particle data: x, y, z (world space), life
                // Particles fill a larger sphere encompassing all planet positions
                const particleSphereRadius = 0.35; // Much larger to surround all planets
                spaceParticleData = new Float32Array(SPACE_PARTICLE_COUNT * 4);
                for (let i = 0; i < SPACE_PARTICLE_COUNT; i++) {
                    const idx = i * 4;
                    // Random positions in a sphere using rejection sampling
                    let x, y, z;
                    do {
                        x = (Math.random() * 2 - 1);
                        y = (Math.random() * 2 - 1);
                        z = (Math.random() * 2 - 1);
                    } while (x * x + y * y + z * z > 1);
                    // Scale to particle sphere radius (in world units)
                    spaceParticleData[idx] = x * particleSphereRadius;      // x (world units)
                    spaceParticleData[idx + 1] = y * particleSphereRadius;  // y (world units)
                    spaceParticleData[idx + 2] = z * particleSphereRadius;  // z (world units)
                    spaceParticleData[idx + 3] = Math.random();              // life (0-1)
                }

                spaceParticleBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, spaceParticleData, gl.DYNAMIC_DRAW);

                console.log('Space particles initialized: ' + SPACE_PARTICLE_COUNT + ' particles');
            } else {
                console.error('Space particle program link error:', gl.getProgramInfoLog(spaceParticleProgram));
                spaceParticleProgram = null;
            }
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        glReady = true;
        return true;
    }

    function resizeSphereGL() {
        if (!glReady) return;
        glCanvas.width = width * (window.devicePixelRatio || 1);
        glCanvas.height = height * (window.devicePixelRatio || 1);
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    }

    function hex2vec(h) {
        return [parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255];
    }

    function renderSpheresGL(nodes, hovered, connected) {
        if (!glReady) return false;

        // Early exit if all WebGL features are disabled
        const toggles = window.renderToggles;
        if (toggles && !toggles.planets && !toggles.suns && !toggles.spaceParticles && !toggles.godRays) {
            return true; // Return true so canvas fallback isn't used
        }

        gl.clear(gl.COLOR_BUFFER_BIT);

        // Get light data first (needed for both god rays and spheres)
        const lightNodes = nodes.filter(n => n.isLight);
        const light0 = lightNodes[0] || { x: 0, y: 0, lightColor: '#ffaa33' };
        const light1 = lightNodes[1] || { x: 0, y: 0, lightColor: '#9b4dca' };
        const light2 = lightNodes[2] || { x: 0, y: 0, lightColor: '#33ddff' };
        const lc0 = hex2vec(light0.lightColor || '#ffaa33');
        const lc1 = hex2vec(light1.lightColor || '#9b4dca');
        const lc2 = hex2vec(light2.lightColor || '#33ddff');

        // Export light data globally for background nebula shader
        window.globalLights.light0 = { x: light0.x, y: light0.y, color: lc0, intensity: lightParams.light0Intensity };
        window.globalLights.light1 = { x: light1.x, y: light1.y, color: lc1, intensity: lightParams.light1Intensity };
        window.globalLights.light2 = { x: light2.x, y: light2.y, color: lc2, intensity: lightParams.light2Intensity };
        window.globalLights.resolution = { width: width, height: height };

        // Particle simulation (run once per frame, not per render pass)
        // Particles fill larger sphere surrounding all planets
        // Skip particle simulation entirely if particles are disabled
        const particleSphereRadius = 0.35;
        const particlesEnabled = !window.renderToggles || window.renderToggles.spaceParticles !== false;
        if (particlesEnabled && spaceParticleProgram && spaceParticleData) {
            const deltaTime = Math.min(time - spaceParticleLastTime, 0.033);
            spaceParticleLastTime = time;

            // Update existing shooting stars
            for (let s = shootingStars.length - 1; s >= 0; s--) {
                const star = shootingStars[s];
                star.progress += deltaTime / shootingStarParams.duration;

                if (star.progress >= 1.0) {
                    // Shooting star finished - reset particle to random position
                    const idx = star.originalIdx * 4;
                    let rx, ry, rz;
                    do {
                        rx = (Math.random() * 2 - 1);
                        ry = (Math.random() * 2 - 1);
                        rz = (Math.random() * 2 - 1);
                    } while (rx * rx + ry * ry + rz * rz > 1);
                    spaceParticleData[idx] = rx * particleSphereRadius;
                    spaceParticleData[idx + 1] = ry * particleSphereRadius;
                    spaceParticleData[idx + 2] = rz * particleSphereRadius;
                    spaceParticleData[idx + 3] = Math.random(); // Reset to normal particle
                    shootingStars.splice(s, 1);
                    continue;
                }

                // Move shooting star fast in its direction
                const idx = star.originalIdx * 4;
                const speed = shootingStarParams.speed * deltaTime * (1.0 - star.progress * 0.5); // Slow down as it fades
                spaceParticleData[idx] += star.vx * speed;
                spaceParticleData[idx + 1] += star.vy * speed;
                spaceParticleData[idx + 2] += star.vz * speed;

                // Encode type (1 or 2) + progress as the life value
                // type.progress format (e.g., 1.35 = gold at 35% progress)
                spaceParticleData[idx + 3] = star.type + star.progress;
            }

            // Randomly spawn new shooting stars (very rare)
            if (Math.random() < shootingStarParams.chance && shootingStars.length < shootingStarParams.maxActive) {
                // Pick a random particle that's not already a shooting star
                const candidateIdx = Math.floor(Math.random() * SPACE_PARTICLE_COUNT);
                const isAlreadyShooting = shootingStars.some(s => s.originalIdx === candidateIdx);

                if (!isAlreadyShooting) {
                    // Random chaotic direction
                    const angle1 = Math.random() * Math.PI * 2;
                    const angle2 = (Math.random() - 0.5) * Math.PI;
                    const vx = Math.cos(angle1) * Math.cos(angle2);
                    const vy = Math.sin(angle2);
                    const vz = Math.sin(angle1) * Math.cos(angle2);

                    shootingStars.push({
                        originalIdx: candidateIdx,
                        type: Math.random() < 0.5 ? 1 : 2, // 1 = gold, 2 = teal
                        progress: 0,
                        vx: vx,
                        vy: vy,
                        vz: vz
                    });
                }
            }

            for (let i = 0; i < SPACE_PARTICLE_COUNT; i++) {
                // Skip particles that are shooting stars (they're handled above)
                const isShooting = shootingStars.some(s => s.originalIdx === i);
                if (isShooting) continue;

                const idx = i * 4;
                let x = spaceParticleData[idx];
                let y = spaceParticleData[idx + 1];
                let z = spaceParticleData[idx + 2];
                let life = spaceParticleData[idx + 3];

                // Ensure normal particles have life < 1 (fractional only)
                if (life >= 1.0) life = life % 1.0;

                // Distance from origin for depth-based effects
                const dist = Math.sqrt(x * x + y * y + z * z);
                const distNorm = dist / particleSphereRadius; // 0 = center, 1 = edge

                // Speed based on distance from center (edge particles orbit slower)
                const speedFactor = 0.3 + (1 - distNorm) * 0.7;

                // Orbital drift around origin (creates swirling effect)
                const phase = i * 0.1;
                // Tangential velocity (orbit around Y axis primarily)
                const orbitSpeed = 0.0002 * speedFactor;
                const tangentX = -z * orbitSpeed;
                const tangentZ = x * orbitSpeed;
                // Add some turbulence
                const turbX = Math.sin(time * 0.3 + phase + y * 10) * 0.00005;
                const turbY = Math.cos(time * 0.25 + phase + x * 10) * 0.00004;
                const turbZ = Math.sin(time * 0.2 + phase + z * 10) * 0.00005;

                // Apply movement
                x += (tangentX + turbX) * 60 * deltaTime;
                y += turbY * 60 * deltaTime;
                z += (tangentZ + turbZ) * 60 * deltaTime;

                // Keep particles inside sphere (soft boundary)
                const newDist = Math.sqrt(x * x + y * y + z * z);
                if (newDist > particleSphereRadius) {
                    const scale = particleSphereRadius / newDist;
                    x *= scale * 0.99; // Slight inward push
                    y *= scale * 0.99;
                    z *= scale * 0.99;
                }

                spaceParticleData[idx] = x;
                spaceParticleData[idx + 1] = y;
                spaceParticleData[idx + 2] = z;

                // Cycle life for twinkling (keep in 0-1 range for normal particles)
                life = (life + deltaTime * 0.1) % 1.0;
                spaceParticleData[idx + 3] = life;
            }

            // Upload updated particle data
            gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, spaceParticleData);
        }

        // Helper function to render particles with a specific pass
        // pass: 0 = all, 1 = far only (z < planetZ), 2 = near only (z >= planetZ)
        function renderParticles(pass) {
            if (!spaceParticleProgram || !spaceParticleData) return;

            gl.useProgram(spaceParticleProgram);
            gl.uniform2f(spaceParticleProgram.uResolution, width, height);
            gl.uniform1f(spaceParticleProgram.uZoom, zoomLevel);
            gl.uniform2f(spaceParticleProgram.uZoomCenter, zoomCenterX, zoomCenterY);
            gl.uniform1f(spaceParticleProgram.uTime, time);

            // DoF uniforms
            gl.uniform1f(spaceParticleProgram.uFocusDistance, spaceParticleParams.focusDistance);
            gl.uniform1f(spaceParticleProgram.uFocusRange, spaceParticleParams.focusRange);
            gl.uniform1f(spaceParticleProgram.uNearBlurDist, spaceParticleParams.nearBlurDist);
            gl.uniform1f(spaceParticleProgram.uFarBlurDist, spaceParticleParams.farBlurDist);
            gl.uniform1f(spaceParticleProgram.uMaxBlurSize, spaceParticleParams.maxBlurSize);
            gl.uniform1f(spaceParticleProgram.uApertureSize, spaceParticleParams.apertureSize);

            // Particle appearance uniforms
            gl.uniform1f(spaceParticleProgram.uParticleSize, spaceParticleParams.particleSize);
            gl.uniform1f(spaceParticleProgram.uBrightness, spaceParticleParams.brightness);
            gl.uniform1f(spaceParticleProgram.uSphereRadius, spaceParticleParams.sphereRadius);

            // Render control uniforms
            gl.uniform1f(spaceParticleProgram.uPlanetZ, spaceParticleParams.planetZ);
            gl.uniform1f(spaceParticleProgram.uRenderPass, pass);
            gl.uniform1f(spaceParticleProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(spaceParticleProgram.uCameraRotY, cameraRotY);

            // Fragment shader uniforms
            gl.uniform1f(spaceParticleProgram.uCircleSoftness, spaceParticleParams.circleSoftness);
            gl.uniform1f(spaceParticleProgram.uBokehRingWidth, spaceParticleParams.bokehRingWidth);
            gl.uniform1f(spaceParticleProgram.uBokehRingIntensity, spaceParticleParams.bokehRingIntensity);
            gl.uniform1f(spaceParticleProgram.uLightFalloff, spaceParticleParams.lightFalloff);

            // Sun light uniforms for particle coloring
            gl.uniform2f(spaceParticleProgram.uLight0, light0.x, light0.y);
            gl.uniform2f(spaceParticleProgram.uLight1, light1.x, light1.y);
            gl.uniform2f(spaceParticleProgram.uLight2, light2.x, light2.y);
            gl.uniform3f(spaceParticleProgram.uLightColor0, lc0.r, lc0.g, lc0.b);
            gl.uniform3f(spaceParticleProgram.uLightColor1, lc1.r, lc1.g, lc1.b);
            gl.uniform3f(spaceParticleProgram.uLightColor2, lc2.r, lc2.g, lc2.b);
            gl.uniform1f(spaceParticleProgram.uLight0Intensity, lightParams.light0Intensity);
            gl.uniform1f(spaceParticleProgram.uLight1Intensity, lightParams.light1Intensity);
            gl.uniform1f(spaceParticleProgram.uLight2Intensity, lightParams.light2Intensity);

            // Shooting star colors
            const goldRGB = hex2vec(shootingStarParams.goldColor);
            const tealRGB = hex2vec(shootingStarParams.tealColor);
            gl.uniform3f(spaceParticleProgram.uShootingGoldColor, goldRGB[0], goldRGB[1], goldRGB[2]);
            gl.uniform3f(spaceParticleProgram.uShootingTealColor, tealRGB[0], tealRGB[1], tealRGB[2]);

            // Base particle color
            const baseRGB = hex2vec(spaceParticleParams.baseColor);
            gl.uniform3f(spaceParticleProgram.uBaseParticleColor, baseRGB[0], baseRGB[1], baseRGB[2]);

            // Use additive blending for glowing particles
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
            gl.enableVertexAttribArray(spaceParticleProgram.aPosition);
            gl.vertexAttribPointer(spaceParticleProgram.aPosition, 3, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(spaceParticleProgram.aLife);
            gl.vertexAttribPointer(spaceParticleProgram.aLife, 1, gl.FLOAT, false, 16, 12);

            gl.drawArrays(gl.POINTS, 0, SPACE_PARTICLE_COUNT);

            gl.disableVertexAttribArray(spaceParticleProgram.aPosition);
            gl.disableVertexAttribArray(spaceParticleProgram.aLife);

            // Restore normal blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        // PASS 1: Render FAR particles (behind planets, z < planetZ)
        if (!window.renderToggles || window.renderToggles.spaceParticles !== false) {
            renderParticles(1);
        }

        // Compute light screen positions (after camera transform) for god rays
        // Same math as vertex shader for sphere program
        const computeLightScreenPos = (lx, ly, lz) => {
            const od = 1.0;
            const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
            const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
            const cpx = od * sry * crx, cpy = od * srx, cpz = od * cry * crx;
            const cfLen = Math.sqrt(cpx*cpx + cpy*cpy + cpz*cpz);
            const fx = -cpx/cfLen, fy = -cpy/cfLen, fz = -cpz/cfLen;
            const rxLen = Math.sqrt(fz*fz + fx*fx) || 1;
            const rx = fz/rxLen, rz = -fx/rxLen;
            const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
            const ws = 1.0 / width;
            const scx = width * 0.5;
            const scy = height * 0.5;
            const wx = (lx - scx) * ws, wy = -(ly - scy) * ws, wz = lz || 0;
            const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
            const zd = tx * fx + ty * fy + tz * fz;
            if (zd < 0.01) return { x: scx, y: scy };
            const ps = od / zd;
            const px = (tx * rx + tz * rz) * ps;
            const py = (tx * ux + ty * uy + tz * uz) * ps;
            return { x: scx + px * width * zoomLevel, y: scy - py * width * zoomLevel };
        };
        const godRayLight0 = computeLightScreenPos(light0.x, light0.y, light0.z);
        const godRayLight1 = computeLightScreenPos(light1.x, light1.y, light1.z);
        const godRayLight2 = computeLightScreenPos(light2.x, light2.y, light2.z);

        // Render god rays (background layer, after particles)
        if (godRaysProgram && (!window.renderToggles || window.renderToggles.godRays !== false)) {
            gl.useProgram(godRaysProgram);
            gl.uniform2f(godRaysProgram.uResolution, width, height);
            gl.uniform1f(godRaysProgram.uTime, time);
            gl.uniform2f(godRaysProgram.uMouse, mouseScreenX, mouseScreenY);
            gl.uniform2f(godRaysProgram.uLight0, godRayLight0.x, godRayLight0.y);
            gl.uniform2f(godRaysProgram.uLight1, godRayLight1.x, godRayLight1.y);
            gl.uniform2f(godRaysProgram.uLight2, godRayLight2.x, godRayLight2.y);
            gl.uniform3f(godRaysProgram.uLightColor0, lc0[0], lc0[1], lc0[2]);
            gl.uniform3f(godRaysProgram.uLightColor1, lc1[0], lc1[1], lc1[2]);
            gl.uniform3f(godRaysProgram.uLightColor2, lc2[0], lc2[1], lc2[2]);
            gl.uniform1f(godRaysProgram.uZoom, zoomLevel);
            gl.uniform2f(godRaysProgram.uZoomCenter, zoomCenterX, zoomCenterY);
            gl.uniform1f(godRaysProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(godRaysProgram.uCameraRotY, cameraRotY);
            // Controllable parameters
            gl.uniform1f(godRaysProgram.uRayIntensity, godRaysParams.rayIntensity);
            gl.uniform1f(godRaysProgram.uRayFalloff, godRaysParams.rayFalloff);
            gl.uniform1f(godRaysProgram.uGlowIntensity, godRaysParams.glowIntensity);
            gl.uniform1f(godRaysProgram.uGlowSize, godRaysParams.glowSize);
            gl.uniform1f(godRaysProgram.uFogDensity, godRaysParams.fogDensity);
            gl.uniform1f(godRaysProgram.uAmbientFog, godRaysParams.ambientFog);
            gl.uniform1f(godRaysProgram.uAnimSpeed, godRaysParams.animSpeed);
            gl.uniform1f(godRaysProgram.uNoiseScale, godRaysParams.noiseScale);
            gl.uniform1f(godRaysProgram.uNoiseOctaves, godRaysParams.noiseOctaves);
            gl.uniform1f(godRaysProgram.uNoiseContrast, godRaysParams.noiseContrast);

            gl.bindBuffer(gl.ARRAY_BUFFER, godRaysQuadBuffer);
            gl.enableVertexAttribArray(godRaysProgram.aPosition);
            gl.vertexAttribPointer(godRaysProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(godRaysProgram.aPosition);
        }

        // Render spheres on top
        gl.useProgram(sphereProgram);
        gl.uniform2f(sphereProgram.uRes, width, height);
        gl.uniform2f(sphereProgram.uMouse, mouseScreenX, mouseScreenY);
        gl.uniform1f(sphereProgram.uTime, time);
        gl.uniform2f(sphereProgram.uLight0, light0.x, light0.y);
        gl.uniform2f(sphereProgram.uLight1, light1.x, light1.y);
        gl.uniform2f(sphereProgram.uLight2, light2.x, light2.y);
        gl.uniform3f(sphereProgram.uLightColor0, lc0[0], lc0[1], lc0[2]);
        gl.uniform3f(sphereProgram.uLightColor1, lc1[0], lc1[1], lc1[2]);
        gl.uniform3f(sphereProgram.uLightColor2, lc2[0], lc2[1], lc2[2]);
        gl.uniform1f(sphereProgram.uLight0Intensity, lightParams.light0Intensity);
        gl.uniform1f(sphereProgram.uLight1Intensity, lightParams.light1Intensity);
        gl.uniform1f(sphereProgram.uLight2Intensity, lightParams.light2Intensity);
        gl.uniform1f(sphereProgram.uLight0Atten, lightParams.light0Attenuation);
        gl.uniform1f(sphereProgram.uLight1Atten, lightParams.light1Attenuation);
        gl.uniform1f(sphereProgram.uLight2Atten, lightParams.light2Attenuation);
        gl.uniform1f(sphereProgram.uLight0Z, light0.z || 0);
        gl.uniform1f(sphereProgram.uLight1Z, light1.z || 0);
        gl.uniform1f(sphereProgram.uLight2Z, light2.z || 0);
        // Compute and pass world-space light positions
        const ws = 1.0 / width;
        const scx = width * 0.5;
        const scy = height * 0.5;
        gl.uniform3f(sphereProgram.uLight0WorldPos, (light0.x - scx) * ws, -(light0.y - scy) * ws, light0.z || 0);
        gl.uniform3f(sphereProgram.uLight1WorldPos, (light1.x - scx) * ws, -(light1.y - scy) * ws, light1.z || 0);
        gl.uniform3f(sphereProgram.uLight2WorldPos, (light2.x - scx) * ws, -(light2.y - scy) * ws, light2.z || 0);

        // Compute light screen positions (after camera transform) - same math as vertex shader
        {
            const od = 1.0;
            const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
            const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
            const cpx = od * sry * crx, cpy = od * srx, cpz = od * cry * crx;
            const cfLen = Math.sqrt(cpx*cpx + cpy*cpy + cpz*cpz);
            const fx = -cpx/cfLen, fy = -cpy/cfLen, fz = -cpz/cfLen;
            const rxLen = Math.sqrt(fz*fz + fx*fx) || 1;
            const rx = fz/rxLen, rz = -fx/rxLen;
            const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;

            const proj = (lx, ly, lz) => {
                const wx = (lx - scx) * ws, wy = -(ly - scy) * ws, wz = lz || 0;
                const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
                const zd = tx * fx + ty * fy + tz * fz;
                if (zd < 0.01) return { x: scx, y: scy };
                const ps = od / zd;
                const px = (tx * rx + tz * rz) * ps;
                const py = (tx * ux + ty * uy + tz * uz) * ps;
                return { x: scx + px * width * zoomLevel, y: scy - py * width * zoomLevel };
            };
            const l0s = proj(light0.x, light0.y, light0.z);
            const l1s = proj(light1.x, light1.y, light1.z);
            const l2s = proj(light2.x, light2.y, light2.z);
            gl.uniform2f(sphereProgram.uLight0ScreenPos, l0s.x, l0s.y);
            gl.uniform2f(sphereProgram.uLight1ScreenPos, l1s.x, l1s.y);
            gl.uniform2f(sphereProgram.uLight2ScreenPos, l2s.x, l2s.y);
        }
        gl.uniform1f(sphereProgram.uMouseLightEnabled, mouseLightEnabled ? 1.0 : 0.0);
        gl.uniform1f(sphereProgram.uAmbientIntensity, lightParams.ambientIntensity);
        gl.uniform1f(sphereProgram.uFogIntensity, lightParams.fogIntensity);
        gl.uniform1f(sphereProgram.uZoom, zoomLevel);
        gl.uniform2f(sphereProgram.uZoomCenter, zoomCenterX, zoomCenterY);
        gl.uniform1f(sphereProgram.uCameraRotX, cameraRotX);
        gl.uniform1f(sphereProgram.uCameraRotY, cameraRotY);

        // Planet A (Oceanic/Mountain) uniforms
        gl.uniform1f(sphereProgram.uNoiseScaleA, planetParamsA.noiseScale);
        gl.uniform1f(sphereProgram.uTerrainHeightA, planetParamsA.terrainHeight);
        gl.uniform1f(sphereProgram.uAtmosIntensityA, planetParamsA.atmosIntensity);
        gl.uniform1f(sphereProgram.uAtmosThicknessA, planetParamsA.atmosThickness);
        gl.uniform1f(sphereProgram.uAtmosPowerA, planetParamsA.atmosPower);
        // Convert scatter color hex to RGB beta values
        const scatterA = hex2vec(planetParamsA.scatterColor);
        gl.uniform1f(sphereProgram.uScatterRA, scatterA[0]);
        gl.uniform1f(sphereProgram.uScatterGA, scatterA[1]);
        gl.uniform1f(sphereProgram.uScatterBA, scatterA[2]);
        gl.uniform1f(sphereProgram.uScatterScaleA, planetParamsA.scatterScale);
        gl.uniform1f(sphereProgram.uSunsetStrengthA, planetParamsA.sunsetStrength);
        gl.uniform1f(sphereProgram.uOceanRoughnessA, planetParamsA.oceanRoughness);
        gl.uniform1f(sphereProgram.uSSSIntensityA, planetParamsA.sssIntensity);
        gl.uniform1f(sphereProgram.uSeaLevelA, planetParamsA.seaLevel);
        gl.uniform1f(sphereProgram.uLandRoughnessA, planetParamsA.landRoughness);
        gl.uniform1f(sphereProgram.uNormalStrengthA, planetParamsA.normalStrength);

        // Planet B (Lava/Desert) uniforms
        gl.uniform1f(sphereProgram.uNoiseScaleB, planetParamsB.noiseScale);
        gl.uniform1f(sphereProgram.uTerrainHeightB, planetParamsB.terrainHeight);
        gl.uniform1f(sphereProgram.uAtmosIntensityB, planetParamsB.atmosIntensity);
        gl.uniform1f(sphereProgram.uAtmosThicknessB, planetParamsB.atmosThickness);
        gl.uniform1f(sphereProgram.uAtmosPowerB, planetParamsB.atmosPower);
        // Convert scatter color hex to RGB beta values
        const scatterB = hex2vec(planetParamsB.scatterColor);
        gl.uniform1f(sphereProgram.uScatterRB, scatterB[0]);
        gl.uniform1f(sphereProgram.uScatterGB, scatterB[1]);
        gl.uniform1f(sphereProgram.uScatterBB, scatterB[2]);
        gl.uniform1f(sphereProgram.uScatterScaleB, planetParamsB.scatterScale);
        gl.uniform1f(sphereProgram.uSunsetStrengthB, planetParamsB.sunsetStrength);
        gl.uniform1f(sphereProgram.uLavaIntensityB, planetParamsB.lavaIntensity);
        gl.uniform1f(sphereProgram.uSeaLevelB, planetParamsB.seaLevel);
        gl.uniform1f(sphereProgram.uLandRoughnessB, planetParamsB.landRoughness);
        gl.uniform1f(sphereProgram.uNormalStrengthB, planetParamsB.normalStrength);

        const q = [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];

        // Helper to build vertex data for a node
        function buildNodeVertices(n, idx) {
            const fadeAmount = n.shrinkProgress !== undefined ? n.shrinkProgress : 1;
            const minAlpha = 0.3;
            const alphaMultiplier = minAlpha + fadeAmount * (1 - minAlpha);

            let c;
            if (n.isLight && n.lightColor) c = hex2vec(n.lightColor);
            else if (n.color) c = hex2vec(n.color);
            else if (n.category === 'primary') c = hex2vec(colors.gold);
            else if (n.category === 'secondary') c = hex2vec(colors.teal);
            else c = hex2vec(colors.textMuted);

            const g = n.glowIntensity || 0;
            const p = Math.sin(time * n.pulseSpeed + n.pulsePhase);
            const r = n.size + p * 0.5 + g * 3;
            const ap = globalFadeIn * alphaMultiplier;
            const a = alphaMultiplier * globalFadeIn;
            const isLight = n.isLight ? 1.0 : 0.0;
            // Depth for visual layering (separate from 3D position)
            const depth = n.depth !== undefined ? n.depth : 0.0;
            // World Z position (for 3D sphere distribution)
            const worldZ = n.z !== undefined ? n.z : 0.0;

            const verts = [];
            q.forEach(([qx,qy]) => {
                // 15 floats per vertex: aPos(2), aCenter(2), aRadius(1), aColor(3), aAlpha(1), aAppear(1), aGlow(1), aIndex(1), aIsLight(1), aDepth(1), aZ(1)
                // Pass world positions (n.x, n.y, n.z) - shader applies perspective
                verts.push(qx, qy, n.x, n.y, r, c[0], c[1], c[2], a, ap, g, idx, isLight, depth, worldZ);
            });
            return verts;
        }

        // Separate planets and suns
        const planetNodes = nodes.filter(n => !n.isLight);
        const sunNodes = nodes.filter(n => n.isLight);

        // Sort nodes by distance from camera (back to front for proper alpha blending)
        // Compute camera position and forward direction (same as vertex shader)
        const orbitDist = 1.0;
        const cosRotX = Math.cos(cameraRotX);
        const sinRotX = Math.sin(cameraRotX);
        const cosRotY = Math.cos(cameraRotY);
        const sinRotY = Math.sin(cameraRotY);

        const camX = orbitDist * sinRotY * cosRotX;
        const camY = orbitDist * sinRotX;
        const camZ = orbitDist * cosRotY * cosRotX;

        // Camera forward = -cameraPos normalized (looking at origin)
        const camLen = Math.sqrt(camX * camX + camY * camY + camZ * camZ);
        const fwdX = -camX / camLen;
        const fwdY = -camY / camLen;
        const fwdZ = -camZ / camLen;

        // World scale (same as vertex shader)
        const worldScale = 1.0 / width;
        const screenCenterX = width * 0.5;
        const screenCenterY = height * 0.5;

        // Function to compute camera distance for a node
        function getCameraDistance(n) {
            // Convert screen position to world position (now with 3D Z position)
            const worldX = (n.x - screenCenterX) * worldScale;
            const worldY = -(n.y - screenCenterY) * worldScale;
            const worldZ = (n.z !== undefined && !isNaN(n.z)) ? n.z : 0.0;

            // Vector from camera to node
            const toNodeX = worldX - camX;
            const toNodeY = worldY - camY;
            const toNodeZ = worldZ - camZ;

            // Distance along camera forward (z-depth in view space)
            const dist = toNodeX * fwdX + toNodeY * fwdY + toNodeZ * fwdZ;
            return isNaN(dist) ? 0 : dist;
        }

        // Combine all nodes and sort by camera distance (back to front)
        const allNodes = [...planetNodes, ...sunNodes];
        allNodes.forEach(n => { n.cameraDistance = getCameraDistance(n); });
        // Sort back to front: larger distance (further) renders first
        allNodes.sort((a, b) => b.cameraDistance - a.cameraDistance);

        const st = 15 * 4; // 15 floats per vertex (added aZ for 3D position)

        // Helper to set up vertex attributes for a program
        function setupVertexAttribs(program) {
            gl.enableVertexAttribArray(program.aPos);
            gl.vertexAttribPointer(program.aPos, 2, gl.FLOAT, false, st, 0);
            gl.enableVertexAttribArray(program.aCenter);
            gl.vertexAttribPointer(program.aCenter, 2, gl.FLOAT, false, st, 8);
            gl.enableVertexAttribArray(program.aRadius);
            gl.vertexAttribPointer(program.aRadius, 1, gl.FLOAT, false, st, 16);
            gl.enableVertexAttribArray(program.aColor);
            gl.vertexAttribPointer(program.aColor, 3, gl.FLOAT, false, st, 20);
            gl.enableVertexAttribArray(program.aAlpha);
            gl.vertexAttribPointer(program.aAlpha, 1, gl.FLOAT, false, st, 32);
            gl.enableVertexAttribArray(program.aAppear);
            gl.vertexAttribPointer(program.aAppear, 1, gl.FLOAT, false, st, 36);
            gl.enableVertexAttribArray(program.aGlow);
            gl.vertexAttribPointer(program.aGlow, 1, gl.FLOAT, false, st, 40);
            gl.enableVertexAttribArray(program.aIndex);
            gl.vertexAttribPointer(program.aIndex, 1, gl.FLOAT, false, st, 44);
            gl.enableVertexAttribArray(program.aIsLight);
            gl.vertexAttribPointer(program.aIsLight, 1, gl.FLOAT, false, st, 48);
            gl.enableVertexAttribArray(program.aDepth);
            gl.vertexAttribPointer(program.aDepth, 1, gl.FLOAT, false, st, 52);
            gl.enableVertexAttribArray(program.aZ);
            gl.vertexAttribPointer(program.aZ, 1, gl.FLOAT, false, st, 56);
        }

        // Track current shader type and blend mode to minimize state changes
        let currentIsSun = null;
        let currentBlendAdditive = null;

        // Render all nodes in depth order, switching shaders and blend modes as needed
        for (const n of allNodes) {
            const isSun = n.isLight;

            // Skip rendering based on render toggles
            if (window.renderToggles) {
                if (isSun && window.renderToggles.suns === false) continue;
                if (!isSun && window.renderToggles.planets === false) continue;
            }

            const nodeIdx = nodes.indexOf(n);
            const verts = buildNodeVertices(n, nodeIdx);
            const vertData = new Float32Array(verts);

            if (isSun) {
                // Suns use additive blending for nice glow stacking
                if (currentBlendAdditive !== true) {
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                    currentBlendAdditive = true;
                }

                // Switch to sun shader if not already
                if (currentIsSun !== true) {
                    gl.useProgram(sunProgram);
                    gl.uniform2f(sunProgram.uRes, width, height);
                    gl.uniform1f(sunProgram.uTime, time);
                    gl.uniform1f(sunProgram.uZoom, zoomLevel);
                    gl.uniform2f(sunProgram.uZoomCenter, zoomCenterX, zoomCenterY);
                    gl.uniform1f(sunProgram.uCameraRotX, cameraRotX);
                    gl.uniform1f(sunProgram.uCameraRotY, cameraRotY);

                    // Sun halo uniforms
                    gl.uniform1f(sunProgram.uSunCoreSize, sunParams.coreSize);
                    gl.uniform1f(sunProgram.uSunGlowSize, sunParams.glowSize);
                    gl.uniform1f(sunProgram.uSunGlowIntensity, sunParams.glowIntensity);
                    gl.uniform1f(sunProgram.uSunCoronaIntensity, sunParams.coronaIntensity);
                    gl.uniform1f(sunProgram.uSunRayCount, sunParams.rayCount);
                    gl.uniform1f(sunProgram.uSunRayIntensity, sunParams.rayIntensity);
                    gl.uniform1f(sunProgram.uSunRayLength, sunParams.rayLength);
                    gl.uniform1f(sunProgram.uSunStreamerCount, sunParams.streamerCount);
                    gl.uniform1f(sunProgram.uSunStreamerIntensity, sunParams.streamerIntensity);
                    gl.uniform1f(sunProgram.uSunStreamerLength, sunParams.streamerLength);
                    gl.uniform1f(sunProgram.uSunHaloRing1Dist, sunParams.haloRing1Dist);
                    gl.uniform1f(sunProgram.uSunHaloRing1Intensity, sunParams.haloRing1Intensity);
                    gl.uniform1f(sunProgram.uSunHaloRing2Dist, sunParams.haloRing2Dist);
                    gl.uniform1f(sunProgram.uSunHaloRing2Intensity, sunParams.haloRing2Intensity);
                    gl.uniform1f(sunProgram.uSunFlickerSpeed, sunParams.flickerSpeed);
                    gl.uniform1f(sunProgram.uSunPulseSpeed, sunParams.pulseSpeed);
                    gl.uniform1f(sunProgram.uSunChromaticShift, sunParams.chromaticShift);

                    currentIsSun = true;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, sunProgram.buf);
                gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
                setupVertexAttribs(sunProgram);
                gl.drawArrays(gl.TRIANGLES, 0, verts.length / 15);
            } else {
                // Planets use premultiplied alpha blending
                // This allows the opaque core to occlude while edges blend nicely
                if (currentBlendAdditive !== false) {
                    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                    currentBlendAdditive = false;
                }

                // Switch to planet shader if not already
                if (currentIsSun !== false) {
                    gl.useProgram(sphereProgram);
                    // Planet uniforms already set above
                    currentIsSun = false;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, sphereProgram.buf);
                gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
                setupVertexAttribs(sphereProgram);
                gl.drawArrays(gl.TRIANGLES, 0, verts.length / 15);
            }
        }

        // Restore normal alpha blending after rendering all nodes
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Render debug quads if enabled
        if (showDebugQuads && debugQuadProgram) {
            gl.useProgram(debugQuadProgram);
            gl.uniform2f(debugQuadProgram.uResolution, width, height);
            gl.uniform1f(debugQuadProgram.uZoom, zoomLevel);
            gl.uniform1f(debugQuadProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(debugQuadProgram.uCameraRotY, cameraRotY);

            gl.bindBuffer(gl.ARRAY_BUFFER, debugQuadBuffer);
            gl.enableVertexAttribArray(debugQuadProgram.aPosition);
            gl.vertexAttribPointer(debugQuadProgram.aPosition, 2, gl.FLOAT, false, 0, 0);

            for (const n of nodes) {
                gl.uniform2f(debugQuadProgram.uCenter, n.x, n.y);
                gl.uniform1f(debugQuadProgram.uSize, n.size);
                gl.uniform1f(debugQuadProgram.uWorldZ, n.z || 0.0);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }

            gl.disableVertexAttribArray(debugQuadProgram.aPosition);
        }

        // PASS 2: Render NEAR particles (in front of planets, z >= planetZ)
        if (!window.renderToggles || window.renderToggles.spaceParticles !== false) {
            renderParticles(2);
        }

        return true;
    }

    function drawLitSphere(x, y, radius, baseColor, alpha, appearProgress, glow) {
        if (appearProgress < 0.01) return;
        const r = radius * appearProgress;
        if (r < 1) return;

        const cr = parseInt(baseColor.slice(1,3), 16);
        const cg = parseInt(baseColor.slice(3,5), 16);
        const cb = parseInt(baseColor.slice(5,7), 16);

        const lx = (mouseX - x) / (width || 1);
        const ly = (mouseY - y) / (height || 1);
        const ld = Math.sqrt(lx*lx + ly*ly) || 1;
        const hx = x - (lx/ld) * r * 0.35;
        const hy = y - (ly/ld) * r * 0.35;

        const grad = ctx.createRadialGradient(hx, hy, 0, x, y, r);
        grad.addColorStop(0, `rgba(${Math.min(255,cr+70)},${Math.min(255,cg+70)},${Math.min(255,cb+70)},${alpha})`);
        grad.addColorStop(0.35, `rgba(${cr},${cg},${cb},${alpha})`);
        grad.addColorStop(0.8, `rgba(${cr*0.55|0},${cg*0.55|0},${cb*0.55|0},${alpha})`);
        grad.addColorStop(1, `rgba(${cr*0.25|0},${cg*0.25|0},${cb*0.25|0},${alpha*0.85})`);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        const sg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r*0.28);
        sg.addColorStop(0, `rgba(255,255,255,${alpha*0.75})`);
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(hx, hy, r*0.28, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${alpha*0.18 + (glow||0)*0.35})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function resize() {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        centerX = width / 2;
        centerY = height / 2;
        // Initialize zoom center to canvas center
        if (zoomCenterX === 0 && zoomCenterY === 0) {
            zoomCenterX = centerX;
            zoomCenterY = centerY;
            targetZoomCenterX = centerX;
            targetZoomCenterY = centerY;
        }
        settled = false;
        settleTimer = 0;

        const minDim = Math.min(width, height);
        sizeScale = Math.max(0.5, Math.min(1.2, minDim / BASE_DIMENSION));

        // Initialize node sizes and velocities
        nodes.forEach((node, i) => {
            node.size = node.baseSize * sizeScale;
            node.vx = (Math.random() - 0.5) * 0.5;
            node.vy = (Math.random() - 0.5) * 0.5;
            node.vz = (Math.random() - 0.5) * 0.0001; // Small Z velocity
            node.x = 0;
            node.y = 0;
            node.z = 0;
            node.placed = false;
        });

        // Sphere radius in world units (camera orbits at distance 1.0)
        // Smaller radius = tighter cluster, better for 3D perspective viewing
        const sphereRadius = 0.15; // World units - compact cluster for better 3D visibility

        // Place suns first, spread around in 3D sphere
        const suns = nodes.filter(n => n.isLight);
        suns.forEach((sun, i) => {
            // Distribute suns evenly around sphere using golden spiral
            const phi = Math.acos(1 - 2 * (i + 0.5) / suns.length);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i + Math.random() * 0.3;
            const r = sphereRadius * (0.7 + Math.random() * 0.3); // Vary radius slightly

            // Convert spherical to Cartesian (in world units)
            const worldX = r * Math.sin(phi) * Math.cos(theta);
            const worldY = r * Math.sin(phi) * Math.sin(theta);
            const worldZ = r * Math.cos(phi);

            // Convert world X/Y to screen coordinates
            sun.x = centerX + worldX * width;
            sun.y = centerY - worldY * width; // Flip Y for screen coords
            sun.z = worldZ; // Z stays in world units
            sun.placed = true;
        });

        // Place other nodes near their connected suns in 3D
        const maxIterations = 10;
        for (let iter = 0; iter < maxIterations; iter++) {
            nodes.forEach(node => {
                if (node.placed) return;

                // Find placed connected nodes
                const connectedIds = connectionMap.get(node.id);
                if (!connectedIds) return;

                const placedConnections = nodes.filter(n => n.placed && connectedIds.has(n.id));
                if (placedConnections.length === 0) return;

                // Average position of connected nodes (in world coords)
                let avgWorldX = 0, avgWorldY = 0, avgWorldZ = 0;
                placedConnections.forEach(n => {
                    avgWorldX += (n.x - centerX) / width;
                    avgWorldY += -(n.y - centerY) / width;
                    avgWorldZ += n.z;
                });
                avgWorldX /= placedConnections.length;
                avgWorldY /= placedConnections.length;
                avgWorldZ /= placedConnections.length;

                // Direction away from origin (outward)
                const dist = Math.sqrt(avgWorldX * avgWorldX + avgWorldY * avgWorldY + avgWorldZ * avgWorldZ) || 0.01;
                const outX = avgWorldX / dist;
                const outY = avgWorldY / dist;
                const outZ = avgWorldZ / dist;

                // Random direction on sphere
                const randPhi = Math.random() * Math.PI;
                const randTheta = Math.random() * Math.PI * 2;
                const randX = Math.sin(randPhi) * Math.cos(randTheta);
                const randY = Math.sin(randPhi) * Math.sin(randTheta);
                const randZ = Math.cos(randPhi);

                // Combine outward direction with randomness
                const outwardBias = 0.5;
                const dirX = outX * outwardBias + randX * (1 - outwardBias);
                const dirY = outY * outwardBias + randY * (1 - outwardBias);
                const dirZ = outZ * outwardBias + randZ * (1 - outwardBias);

                // Offset distance in world units
                const offset = (node.size * 0.0015 + Math.random() * 0.03);

                const newWorldX = avgWorldX + dirX * offset;
                const newWorldY = avgWorldY + dirY * offset;
                const newWorldZ = avgWorldZ + dirZ * offset;

                // Convert back to screen coordinates
                node.x = centerX + newWorldX * width;
                node.y = centerY - newWorldY * width;
                node.z = newWorldZ;
                node.placed = true;
            });
        }

        // Place any remaining unplaced nodes randomly in sphere
        nodes.forEach(node => {
            if (!node.placed) {
                // Random point in sphere using rejection sampling
                let worldX, worldY, worldZ;
                do {
                    worldX = (Math.random() - 0.5) * 2 * sphereRadius;
                    worldY = (Math.random() - 0.5) * 2 * sphereRadius;
                    worldZ = (Math.random() - 0.5) * 2 * sphereRadius;
                } while (worldX * worldX + worldY * worldY + worldZ * worldZ > sphereRadius * sphereRadius);

                node.x = centerX + worldX * width;
                node.y = centerY - worldY * width;
                node.z = worldZ;
            }
            delete node.placed;
        });

        resizeSphereGL();
    }

    function getNodeAt(screenX, screenY) {
        // Pick nodes based on their projected screen position (renderX, renderY)
        // screenX, screenY are in screen/pixel coordinates
        // Sort by camera distance (closest first) for proper picking
        const sortedNodes = [...nodes].sort((a, b) => {
            const distA = a.cameraDistance !== undefined ? a.cameraDistance : 0;
            const distB = b.cameraDistance !== undefined ? b.cameraDistance : 0;
            return distA - distB; // Closest first
        });

        for (let i = 0; i < sortedNodes.length; i++) {
            const node = sortedNodes[i];
            // Use projected screen position for hit testing
            const renderX = node.renderX !== undefined ? node.renderX : node.x;
            const renderY = node.renderY !== undefined ? node.renderY : node.y;
            const renderScale = node.renderScale !== undefined ? node.renderScale : 1;

            // Skip culled nodes
            if (renderX < -1000) continue;

            const dx = screenX - renderX;
            const dy = screenY - renderY;
            const hitRadius = (node.size * renderScale + 5);
            if (dx * dx + dy * dy < hitRadius * hitRadius) return node;
        }
        return null;
    }

    function getConnectedNodes(node) {
        const connected = new Set();
        connections.forEach(([a, b]) => {
            if (a === node.id) connected.add(b);
            if (b === node.id) connected.add(a);
        });
        return connected;
    }

    // Build connection lookup for fast access
    const connectionMap = new Map();
    connections.forEach(([a, b]) => {
        if (!connectionMap.has(a)) connectionMap.set(a, new Set());
        if (!connectionMap.has(b)) connectionMap.set(b, new Set());
        connectionMap.get(a).add(b);
        connectionMap.get(b).add(a);
    });

    function simulate() {
        if (globalFadeIn < 1 && time > 1.5) globalFadeIn = Math.min(1, (time - 1.5) / 2);
        if (globalFadeIn >= 1) startupPhase = false;

        const minDim = Math.min(width, height);

        // ====== SIMPLE SOLAR SYSTEM ======
        // Get orbital parameters from UI controls
        const speedMult = orbitParams.orbitSpeed;
        // sunSpread, sunSpawnMin/Max are used inside getSunPosition()
        const moonRadiusMult = orbitParams.moonOrbitRadius;
        const moonSpacingMult = orbitParams.moonOrbitSpacing;
        const moonTiltMult = orbitParams.moonOrbitTilt;
        const subMoonRadiusMult = orbitParams.subMoonOrbitRadius;
        const subMoonSpeedMult = orbitParams.subMoonSpeed;
        const baseSpacing = 0.045;  // Base gap between orbits

        // STEP 1: Place suns at fixed positions (affected by sunSpread, sunSpawnMin/Max)
        for (const sunId in sunBasePositions) {
            const node = nodes.find(n => n.id === sunId);
            if (!node || node === dragNode) continue;

            // Get dynamic position based on spawn parameters
            const pos = getSunPosition(sunId);

            // Store world position (sunSpread already applied in getSunPosition)
            node.worldX = pos.x;
            node.worldY = pos.y;
            node.worldZ = pos.z;

            // Convert to screen
            node.x = centerX + node.worldX * minDim;
            node.y = centerY - node.worldY * minDim;
            node.z = pos.z;

            // Mark as sun (no orbit circle for suns since they're fixed)
            node.isSun = true;
        }

        // STEP 2: Moons orbit their parent sun with 3D tilted orbits
        for (const moonId in moonOrbits) {
            const node = nodes.find(n => n.id === moonId);
            if (!node || node === dragNode) continue;

            const config = moonOrbits[moonId];
            const parentSun = nodes.find(n => n.id === config.sun);
            if (!parentSun) continue;

            // Update orbital angle (affected by orbitSpeed)
            node.orbitAngle = (node.orbitAngle || config.phase) + config.speed * speedMult;

            // Calculate radius: baseOrbit + (orbitIndex * spacing)
            // baseOrbit is mapped from config.baseRadius (0-1) to baseOrbitMin-baseOrbitMax range
            const orbitIndex = config.orbitIndex || 0;
            const baseOrbit = orbitParams.baseOrbitMin + config.baseRadius * (orbitParams.baseOrbitMax - orbitParams.baseOrbitMin);
            const radius = (baseOrbit + orbitIndex * baseSpacing * moonSpacingMult) * moonRadiusMult;
            const angle = node.orbitAngle;
            // Get tilt from the solar system (shared by all moons of this sun)
            const systemTilt = solarSystemTilts[config.sun] || { tiltX: 0, tiltY: 0 };
            const tiltX = systemTilt.tiltX * moonTiltMult;
            const tiltY = systemTilt.tiltY * moonTiltMult;

            // Start with circular orbit in XY plane
            let offsetX = Math.cos(angle) * radius;
            let offsetY = Math.sin(angle) * radius;
            let offsetZ = 0;

            // Apply tilt around X axis (pitch)
            const cosT = Math.cos(tiltX);
            const sinT = Math.sin(tiltX);
            const newY = offsetY * cosT - offsetZ * sinT;
            const newZ = offsetY * sinT + offsetZ * cosT;
            offsetY = newY;
            offsetZ = newZ;

            // Apply tilt around Y axis (yaw)
            const cosY = Math.cos(tiltY);
            const sinY = Math.sin(tiltY);
            const newX = offsetX * cosY + offsetZ * sinY;
            offsetZ = -offsetX * sinY + offsetZ * cosY;
            offsetX = newX;

            // Moon position = sun position + tilted orbit offset
            const sunX = parentSun.worldX || 0;
            const sunY = parentSun.worldY || 0;
            const sunZ = parentSun.worldZ || 0;

            node.worldX = sunX + offsetX;
            node.worldY = sunY + offsetY;
            node.worldZ = sunZ + offsetZ;

            // Convert to screen
            node.x = centerX + node.worldX * minDim;
            node.y = centerY - node.worldY * minDim;
            node.z = node.worldZ;

            // Store orbit info for drawing circles (use current scaled values)
            node.orbitCenterWorldX = sunX;
            node.orbitCenterWorldY = sunY;
            node.orbitCenterWorldZ = sunZ;
            node.orbitRadiusWorld = radius;
            node.orbitTiltX = tiltX;
            node.orbitTiltY = tiltY;
            node.parentSunId = config.sun;
            node.isMoon = true;
        }

        // STEP 3: Sub-moons orbit around planets (former free floaters)
        for (const subMoonId in subMoonOrbits) {
            const node = nodes.find(n => n.id === subMoonId);
            if (!node || node === dragNode) continue;

            const config = subMoonOrbits[subMoonId];
            const parentPlanet = nodes.find(n => n.id === config.parent);
            if (!parentPlanet) continue;

            // Update orbital angle (affected by both global speed and sub-moon speed)
            node.orbitAngle = (node.orbitAngle || config.phase) + config.speed * speedMult * subMoonSpeedMult;

            // Apply radius multiplier from UI
            const radius = config.radius * subMoonRadiusMult;
            const angle = node.orbitAngle;
            const tiltX = (config.tiltX || 0) * moonTiltMult;
            const tiltY = (config.tiltY || 0) * moonTiltMult;

            // Start with circular orbit in XY plane
            let offsetX = Math.cos(angle) * radius;
            let offsetY = Math.sin(angle) * radius;
            let offsetZ = 0;

            // Apply tilt around X axis
            const cosT = Math.cos(tiltX);
            const sinT = Math.sin(tiltX);
            const newY = offsetY * cosT - offsetZ * sinT;
            const newZ = offsetY * sinT + offsetZ * cosT;
            offsetY = newY;
            offsetZ = newZ;

            // Apply tilt around Y axis
            const cosY = Math.cos(tiltY);
            const sinY = Math.sin(tiltY);
            const newX = offsetX * cosY + offsetZ * sinY;
            offsetZ = -offsetX * sinY + offsetZ * cosY;
            offsetX = newX;

            // Sub-moon position = parent planet position + tilted orbit offset
            const parentX = parentPlanet.worldX || 0;
            const parentY = parentPlanet.worldY || 0;
            const parentZ = parentPlanet.worldZ || 0;

            node.worldX = parentX + offsetX;
            node.worldY = parentY + offsetY;
            node.worldZ = parentZ + offsetZ;

            // Convert to screen
            node.x = centerX + node.worldX * minDim;
            node.y = centerY - node.worldY * minDim;
            node.z = node.worldZ;

            // Store orbit info for drawing circles
            node.orbitCenterWorldX = parentX;
            node.orbitCenterWorldY = parentY;
            node.orbitCenterWorldZ = parentZ;
            node.orbitRadiusWorld = radius;
            node.orbitTiltX = tiltX;
            node.orbitTiltY = tiltY;
            node.parentSunId = config.parent;  // Used for circle drawing
            node.isSubMoon = true;
            // Apply sub-moon size multiplier
            node.size = node.baseSize * sizeScale * orbitParams.subMoonSize;
        }
    }

    let lastHoveredNode = null, hoverStartTime = 0;

    function draw() {
        ctx.clearRect(0, 0, width, height);
        time += 0.016;

        // Smooth zoom interpolation (slower for smoother feel)
        zoomLevel += (targetZoom - zoomLevel) * 0.05;
        zoomCenterX += (targetZoomCenterX - zoomCenterX) * 0.05;
        zoomCenterY += (targetZoomCenterY - zoomCenterY) * 0.05;

        // Smooth camera rotation interpolation
        cameraRotX += (targetCameraRotX - cameraRotX) * 0.08;
        cameraRotY += (targetCameraRotY - cameraRotY) * 0.08;

        // Update global camera rotation and zoom for background shader
        window.globalCameraRotX = cameraRotX;
        window.globalCameraRotY = cameraRotY;
        window.globalZoom = zoomLevel;

        // 3D perspective camera (matching planet/particle shaders)
        // Fixed orbit distance, zoom applied as scale factor
        const orbitDist = 1.0;
        const screenCenterX = width * 0.5;
        const screenCenterY = height * 0.5;

        // Camera rotation values
        const cosRotX = Math.cos(cameraRotX);
        const sinRotX = Math.sin(cameraRotX);
        const cosRotY = Math.cos(cameraRotY);
        const sinRotY = Math.sin(cameraRotY);

        // Camera position (orbiting at fixed distance)
        const camPosX = orbitDist * sinRotY * cosRotX;
        const camPosY = orbitDist * sinRotX;
        const camPosZ = orbitDist * cosRotY * cosRotX;

        // Camera forward direction (looking at origin)
        const camLen = Math.sqrt(camPosX * camPosX + camPosY * camPosY + camPosZ * camPosZ);
        const camFwdX = -camPosX / camLen;
        const camFwdY = -camPosY / camLen;
        const camFwdZ = -camPosZ / camLen;

        // Camera right vector (cross product of worldUp and forward)
        const worldUpX = 0, worldUpY = 1, worldUpZ = 0;
        let camRightX = worldUpY * camFwdZ - worldUpZ * camFwdY;
        let camRightY = worldUpZ * camFwdX - worldUpX * camFwdZ;
        let camRightZ = worldUpX * camFwdY - worldUpY * camFwdX;
        const rightLen = Math.sqrt(camRightX * camRightX + camRightY * camRightY + camRightZ * camRightZ);
        camRightX /= rightLen; camRightY /= rightLen; camRightZ /= rightLen;

        // Camera up vector (cross product of forward and right)
        const camUpX = camFwdY * camRightZ - camFwdZ * camRightY;
        const camUpY = camFwdZ * camRightX - camFwdX * camRightZ;
        const camUpZ = camFwdX * camRightY - camFwdY * camRightX;

        // No canvas transform - we apply perspective manually to each element
        ctx.save();

        const connectedToHovered = hoveredNode ? getConnectedNodes(hoveredNode) : new Set();
        if (hoveredNode !== lastHoveredNode) { hoverStartTime = time; lastHoveredNode = hoveredNode; }
        const timeSinceHover = time - hoverStartTime;

        nodes.forEach(node => {
            const isHovered = node === hoveredNode;
            const isConnected = connectedToHovered.has(node.id);

            if (isHovered) { node.targetGlowIntensity = 1; node.glowDelay = 0; node.targetShrink = 1; }
            else if (isConnected) { node.targetGlowIntensity = 0.6; node.glowDelay = 0.15; node.targetShrink = 1; }
            else if (hoveredNode) { node.targetGlowIntensity = 0; node.glowDelay = 0; node.targetShrink = 0; }
            else { node.targetGlowIntensity = 0; node.glowDelay = 0; node.targetShrink = 1; }

            const effectiveTime = Math.max(0, timeSinceHover - node.glowDelay);
            if (effectiveTime > 0 || node.targetGlowIntensity === 0) {
                const lerpSpeed = node.targetGlowIntensity > node.glowIntensity ? 0.08 : 0.12;
                node.glowIntensity += (node.targetGlowIntensity - node.glowIntensity) * lerpSpeed;
            }
            node.shrinkProgress += (node.targetShrink - node.shrinkProgress) * (node.targetShrink > node.shrinkProgress ? 0.12 : 0.08);
            if (node.glowIntensity < 0.01) node.glowIntensity = 0;
            if (node.shrinkProgress < 0.01) node.shrinkProgress = 0;
            if (node.shrinkProgress > 0.99) node.shrinkProgress = 1;
        });

        // Update rotation for visual spinning of planets
        nodes.forEach(node => {
            node.rotation += node.rotationSpeed;
        });

        // Apply 3D perspective to canvas elements (matching planet shader)
        // Nodes now have actual Z positions in world space
        const worldScale = 1.0 / width;
        nodes.forEach(node => {
            // Node position in world space (now with actual Z from node.z)
            const offsetX = node.x - screenCenterX;
            const offsetY = node.y - screenCenterY;
            const nodePosX = offsetX * worldScale;
            const nodePosY = -offsetY * worldScale;  // Flip Y
            const nodePosZ = node.z || 0.0;

            // Vector from camera to node
            const toNodeX = nodePosX - camPosX;
            const toNodeY = nodePosY - camPosY;
            const toNodeZ = nodePosZ - camPosZ;

            // Project onto camera's view plane (dot with forward)
            const zDist = toNodeX * camFwdX + toNodeY * camFwdY + toNodeZ * camFwdZ;

            // Store camera distance for sorting/picking
            node.cameraDistance = zDist;

            // Cull if behind camera
            if (zDist < 0.01) {
                node.renderX = -10000;
                node.renderY = -10000;
                node.renderScale = 0;
                node.renderAlpha = 0;
                return;
            }

            // Perspective scale (fixed orbit distance)
            const perspectiveScale = orbitDist / zDist;

            // Project node position onto screen (dot with right and up)
            const projX = (toNodeX * camRightX + toNodeY * camRightY + toNodeZ * camRightZ) * perspectiveScale;
            const projY = (toNodeX * camUpX + toNodeY * camUpY + toNodeZ * camUpZ) * perspectiveScale;

            // Convert back to screen coordinates with zoom applied
            node.renderX = screenCenterX + projX * width * zoomLevel;
            node.renderY = screenCenterY - projY * width * zoomLevel;  // Flip Y back
            node.renderScale = perspectiveScale * zoomLevel;

            // Fade when very close to camera
            node.renderAlpha = zDist < 0.2 ? zDist / 0.2 : 1.0;
        });

        // Helper to project 3D world point to screen
        function projectToScreen(wx, wy, wz) {
            const tx = wx - camPosX, ty = wy - camPosY, tz = wz - camPosZ;
            const zd = tx * camFwdX + ty * camFwdY + tz * camFwdZ;
            if (zd < 0.01) return null;
            const ps = orbitDist / zd;
            const px = (tx * camRightX + ty * camRightY + tz * camRightZ) * ps;
            const py = (tx * camUpX + ty * camUpY + tz * camUpZ) * ps;
            return { x: screenCenterX + px * width * zoomLevel, y: screenCenterY - py * width * zoomLevel };
        }

        // Draw orbit circles for moons (3D tilted circles, projected with camera)
        // Skip if orbits are disabled via UI or render toggle
        if (orbitParams.showOrbits >= 1 && (!window.renderToggles || window.renderToggles.orbits !== false)) {
        // Scale factor to convert node.worldX/Y to the coordinate system projectToScreen expects
        const minDim = Math.min(width, height);
        const worldToProjectScale = minDim / width;

        nodes.forEach(node => {
            if (node.isSun) return;
            if (!node.orbitRadiusWorld || !node.parentSunId) return;

            // Find parent (sun or planet for sub-moons)
            const parent = nodes.find(n => n.id === node.parentSunId);
            if (!parent || parent.renderX < -1000) return;

            // Use parent's light color if it's a sun, otherwise use a default
            const hexColor = parent.lightColor || '#aabbcc';
            const rCol = parseInt(hexColor.slice(1, 3), 16);
            const gCol = parseInt(hexColor.slice(3, 5), 16);
            const bCol = parseInt(hexColor.slice(5, 7), 16);

            // Sub-moons get fainter circles, affected by UI opacity setting
            const baseAlpha = node.isSubMoon ? 0.15 : 0.25;
            const orbitAlpha = baseAlpha * orbitParams.orbitLineOpacity * 4 * globalFadeIn * (parent.renderAlpha || 1);
            ctx.strokeStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${orbitAlpha})`;
            // Line width affected by UI setting
            const baseWidth = node.isSubMoon ? 0.5 : 1;
            ctx.lineWidth = baseWidth * orbitParams.orbitLineWidth;
            ctx.beginPath();

            // Draw 3D tilted circle centered on parent's world position
            const segments = 48;
            const radius = node.orbitRadiusWorld * worldToProjectScale;
            const centerWX = (parent.worldX || 0) * worldToProjectScale;
            const centerWY = (parent.worldY || 0) * worldToProjectScale;
            const centerWZ = parent.worldZ || 0;

            // Get tilt angles for this orbit
            const tiltX = node.orbitTiltX || 0;
            const tiltY = node.orbitTiltY || 0;
            const cosTX = Math.cos(tiltX), sinTX = Math.sin(tiltX);
            const cosTY = Math.cos(tiltY), sinTY = Math.sin(tiltY);

            let firstPoint = true;
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;

                // Start with circle in XY plane
                let ox = Math.cos(angle) * radius;
                let oy = Math.sin(angle) * radius;
                let oz = 0;

                // Apply tilt around X axis
                const ny = oy * cosTX - oz * sinTX;
                const nz = oy * sinTX + oz * cosTX;
                oy = ny;
                oz = nz;

                // Apply tilt around Y axis
                const nx = ox * cosTY + oz * sinTY;
                oz = -ox * sinTY + oz * cosTY;
                ox = nx;

                const worldX = centerWX + ox;
                const worldY = centerWY + oy;
                const worldZ = centerWZ + oz;

                const projected = projectToScreen(worldX, worldY, worldZ);
                if (!projected) continue;
                if (firstPoint) { ctx.moveTo(projected.x, projected.y); firstPoint = false; }
                else { ctx.lineTo(projected.x, projected.y); }
            }
            ctx.stroke();
        });
        } // End showOrbits check

        // Only draw connections when showConnectionLinks is enabled
        if (showConnectionLinks) {
            // Draw all connections (teal, more visible)
            connections.forEach(([a, b]) => {
                const nodeA = nodes.find(n => n.id === a);
                const nodeB = nodes.find(n => n.id === b);
                if (!nodeA || !nodeB) return;
                if (nodeA.renderX < -1000 || nodeB.renderX < -1000) return; // Skip if culled

                const ax = nodeA.renderX, ay = nodeA.renderY;
                const bx = nodeB.renderX, by = nodeB.renderY;
                const avgScale = ((nodeA.renderScale || 1) + (nodeB.renderScale || 1)) * 0.5;
                const avgAlpha = ((nodeA.renderAlpha || 1) + (nodeB.renderAlpha || 1)) * 0.5;

                ctx.strokeStyle = `rgba(45, 212, 191, ${0.25 * globalFadeIn * avgAlpha})`;
                ctx.lineWidth = 2 * avgScale;
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(bx, by);
                ctx.stroke();
            });

            // Draw highlighted connections on top (yellow opaque)
            if (hoveredNode) {
                connections.forEach(([a, b]) => {
                    const isHighlighted = hoveredNode.id === a || hoveredNode.id === b;
                    if (!isHighlighted) return;

                    const nodeA = nodes.find(n => n.id === a);
                    const nodeB = nodes.find(n => n.id === b);
                    if (!nodeA || !nodeB) return;
                    if (nodeA.renderX < -1000 || nodeB.renderX < -1000) return; // Skip if culled

                    const ax = nodeA.renderX, ay = nodeA.renderY;
                    const bx = nodeB.renderX, by = nodeB.renderY;
                    const avgScale = ((nodeA.renderScale || 1) + (nodeB.renderScale || 1)) * 0.5;
                    const avgAlpha = ((nodeA.renderAlpha || 1) + (nodeB.renderAlpha || 1)) * 0.5;

                    ctx.strokeStyle = `rgba(232, 185, 35, ${globalFadeIn * avgAlpha})`;
                    ctx.lineWidth = 2 * avgScale;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(bx, by);
                    ctx.stroke();
                });
            }
        }

        if (!renderSpheresGL(nodes, hoveredNode, connectedToHovered)) {
            nodes.forEach(node => {
                const fadeAmount = node.shrinkProgress !== undefined ? node.shrinkProgress : 1;
                if (globalFadeIn < 0.01) return;
                const minAlpha = 0.3;
                const alphaMultiplier = minAlpha + fadeAmount * (1 - minAlpha);
                const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
                const displaySize = node.size + pulse * 0.5 + node.glowIntensity * 3;
                let baseColor = node.category === 'primary' ? colors.gold : node.category === 'secondary' ? colors.teal : colors.textMuted;
                // Use parallax-adjusted positions
                drawLitSphere(node.renderX, node.renderY, displaySize, baseColor, alphaMultiplier * globalFadeIn, globalFadeIn * alphaMultiplier, node.glowIntensity);
            });
        }

        // Draw labels only if enabled
        if (showPlanetLabels) {
            nodes.forEach(node => {
                const fadeAmount = node.shrinkProgress !== undefined ? node.shrinkProgress : 1;
                if (globalFadeIn < 0.5) return;
                if (node.renderX < -1000) return; // Skip nodes behind camera
                const minAlpha = 0.3;
                const alphaMultiplier = minAlpha + fadeAmount * (1 - minAlpha);
                const perspectiveAlpha = node.renderAlpha !== undefined ? node.renderAlpha : 1.0;
                const labelAlpha = Math.min(1, (globalFadeIn - 0.5) * 2) * alphaMultiplier * perspectiveAlpha;
                const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
                const displaySize = (node.size + pulse * 0.5 + node.glowIntensity * 3) * (node.renderScale || 1);
                // Use perspective-adjusted positions for labels
                const labelX = node.renderX;
                const labelY = node.renderY + displaySize + (12 * sizeScale + 6) * (node.renderScale || 1);
                const fontWeight = node.glowIntensity > 0.5 ? '600' : '500';
                const fontSize = (9.5 + 2.5 * sizeScale + node.glowIntensity) * (node.renderScale || 1);
                ctx.font = `${fontWeight} ${fontSize}px "JetBrains Mono", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const textWidth = ctx.measureText(node.label).width;
                const paddingX = (3 * sizeScale + 1) * (node.renderScale || 1);
                const paddingY = (5 * sizeScale + 2) * (node.renderScale || 1);
                ctx.globalAlpha = labelAlpha;
                ctx.fillStyle = `rgba(21, 29, 38, ${0.8 * alphaMultiplier * perspectiveAlpha})`;
                ctx.beginPath();
                ctx.roundRect(labelX - textWidth / 2 - paddingX, labelY - paddingY, textWidth + paddingX * 2, paddingY * 2, 3);
                ctx.fill();
                ctx.fillStyle = colors.textPrimary;
                ctx.fillText(node.label, labelX, labelY);
                ctx.globalAlpha = 1;
            });
        }

        drawTooltipConnector();

        // Restore canvas state after zoom transform
        ctx.restore();
    }

    function animate() {
        simulate();
        var t0 = window.renderTiming.start();
        draw();
        window.renderTiming.end('planets', t0);
        // Update timing aggregation (this is the "main" loop)
        window.renderTiming.update();
        requestAnimationFrame(animate);
    }

    // Convert screen coords to world coords (accounting for 3D perspective camera)
    function screenToWorld(sx, sy) {
        // Fixed orbit distance, zoom applied as scale
        // In the shader: projectedCenter = screenCenter + projection * zoomScale
        // So we reverse: worldPos = (screenPos - screenCenter) / zoomScale + screenCenter
        const screenCenterX = width * 0.5;
        const screenCenterY = height * 0.5;

        // Zoom is a simple scale factor around screen center
        return {
            x: (sx - screenCenterX) / zoomLevel + screenCenterX,
            y: (sy - screenCenterY) / zoomLevel + screenCenterY
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Alt + Right Click: Start camera orbit
        if (e.altKey && e.button === 2) {
            isOrbiting = true;
            orbitStartX = e.clientX;
            orbitStartY = e.clientY;
            orbitStartRotX = targetCameraRotX;
            orbitStartRotY = targetCameraRotY;
            container.style.cursor = 'move';
            e.preventDefault();
            return;
        }

        mouseScreenX = screenX;
        mouseScreenY = screenY;
        const world = screenToWorld(screenX, screenY);
        mouseX = world.x;
        mouseY = world.y;
        dragNode = getNodeAt(screenX, screenY);  // Use screen coords for hit testing
        if (dragNode) {
            isDragging = true;
            settled = false;
            container.style.cursor = 'grabbing';
            if (hoveredNode === dragNode && !tooltipTarget) {
                tooltipTarget = dragNode;
                generateTooltipPosition(dragNode);
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        // Handle camera orbit dragging
        if (isOrbiting) {
            const deltaX = e.clientX - orbitStartX;
            const deltaY = e.clientY - orbitStartY;
            // Sensitivity affected by UI slider
            const sensitivity = 0.005 * orbitParams.cameraRotSpeed;
            targetCameraRotY = orbitStartRotY + deltaX * sensitivity;
            targetCameraRotX = orbitStartRotX + deltaY * sensitivity;
            // Clamp pitch to avoid flipping
            targetCameraRotX = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, targetCameraRotX));
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        mouseScreenX = screenX;
        mouseScreenY = screenY;
        const world = screenToWorld(screenX, screenY);
        mouseX = world.x;
        mouseY = world.y;
        if (isDragging && dragNode) {
            dragNode.x = mouseX; dragNode.y = mouseY;
            dragNode.baseX = mouseX; dragNode.baseY = mouseY;
            dragNode.vx = 0; dragNode.vy = 0;
            settled = false; settleTimer = 0;
            if (tooltipTarget === dragNode) updateTooltipPositionForDrag(dragNode);
        } else {
            hoveredNode = getNodeAt(screenX, screenY);  // Use screen coords for hit testing
            container.style.cursor = hoveredNode ? 'pointer' : 'grab';
            updateTooltip(hoveredNode);
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (isOrbiting) {
            isOrbiting = false;
            container.style.cursor = hoveredNode ? 'pointer' : 'grab';
            return;
        }
        isDragging = false; dragNode = null;
        container.style.cursor = hoveredNode ? 'pointer' : 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false; dragNode = null; hoveredNode = null;
        isOrbiting = false;
        container.style.cursor = 'grab';
        updateTooltip(null);
    });

    // Prevent context menu when using Alt + Right Click for camera orbit
    canvas.addEventListener('contextmenu', (e) => {
        if (e.altKey) {
            e.preventDefault();
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        mouseScreenX = screenX;
        mouseScreenY = screenY;
        const world = screenToWorld(screenX, screenY);
        mouseX = world.x;
        mouseY = world.y;
        dragNode = getNodeAt(screenX, screenY);  // Use screen coords for hit testing
        if (dragNode) {
            isDragging = true; settled = false;
            tooltipTarget = dragNode;
            generateTooltipPosition(dragNode);
            updateTooltip(dragNode);
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDragging || !dragNode) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        const world = screenToWorld(screenX, screenY);
        dragNode.x = world.x;
        dragNode.y = world.y;
        dragNode.baseX = dragNode.x; dragNode.baseY = dragNode.y;
        dragNode.vx = 0; dragNode.vy = 0;
        settled = false;
        if (tooltipTarget === dragNode) updateTooltipPositionForDrag(dragNode);
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isDragging = false; dragNode = null; });

    // Mouse wheel zoom - zooms toward mouse position
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseScreenX = e.clientX - rect.left;
        const mouseScreenY = e.clientY - rect.top;

        const zoomSpeed = 0.0008;
        const delta = -e.deltaY * zoomSpeed;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom + delta * targetZoom));

        // Don't change zoom center if already at max zoom
        if (targetZoom >= MAX_ZOOM && newZoom >= MAX_ZOOM) {
            return;
        }

        // Only update zoom center when zooming in, not when at min zoom
        if (newZoom > MIN_ZOOM) {
            targetZoomCenterX = mouseScreenX;
            targetZoomCenterY = mouseScreenY;
        }
        targetZoom = newZoom;
    }, { passive: false });

    // Spacebar toggles mouse light on planets
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            mouseLightEnabled = !mouseLightEnabled;
        }
    });

    window.addEventListener('resize', resize);
    initSphereGL();
    resize();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            time = 0; globalFadeIn = 0; startupPhase = true;
            tooltip.classList.remove('visible');
            tooltipTarget = null;
        }
    });

    window.addEventListener('skillsTabActivated', () => {
        time = 0; globalFadeIn = 0; startupPhase = true;
        tooltip.classList.remove('visible');
        tooltipTarget = null;
    });

    // ========================================
    // LIGHT CONTROLS UI - Kelvin Temperature
    // ========================================
    const lightControls = document.getElementById('light-controls');
    const lightControlsToggle = document.getElementById('light-controls-toggle');
    const lightResetBtn = document.getElementById('light-reset-btn');
    const kelvinSliders = [
        document.getElementById('kelvin-slider-0'),
        document.getElementById('kelvin-slider-1'),
        document.getElementById('kelvin-slider-2')
    ];
    const kelvinValues = [
        document.getElementById('kelvin-value-0'),
        document.getElementById('kelvin-value-1'),
        document.getElementById('kelvin-value-2')
    ];
    const lightPreviews = [
        document.getElementById('light-preview-0'),
        document.getElementById('light-preview-1'),
        document.getElementById('light-preview-2')
    ];

    // Default Kelvin temperatures (Unity hot, Unreal cold, Graphics medium)
    const defaultKelvinTemps = [15000, 2000, 5000];

    // Get light nodes (primary skill nodes - suns)
    const lightNodeIds = ['unity', 'unreal', 'graphics'];

    // Convert Kelvin temperature to RGB color
    // Enhanced algorithm for more saturated extremes
    function kelvinToRGB(kelvin) {
        const temp = kelvin / 100;
        let r, g, b;

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
            const coldFactor = 1 - (kelvin - 2000) / 2000; // 1 at 2000K, 0 at 4000K
            r = Math.min(255, r + coldFactor * 40);
            g = Math.max(0, g * (1 - coldFactor * 0.4));
            b = Math.max(0, b * (1 - coldFactor * 0.6));
        }
        // Hot stars: boost blue, reduce red
        if (kelvin > 8000) {
            const hotFactor = Math.min(1, (kelvin - 8000) / 7000); // 0 at 8000K, 1 at 15000K
            r = Math.max(0, r * (1 - hotFactor * 0.35));
            g = Math.max(0, g * (1 - hotFactor * 0.15));
            b = Math.min(255, b + hotFactor * 30);
        }

        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
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

    function updateLightFromKelvin(index, kelvin) {
        const color = kelvinToRGB(kelvin);
        const starClass = getStarClass(kelvin);
        const node = nodes.find(n => n.id === lightNodeIds[index]);

        if (node) {
            node.lightColor = color;
            node.color = color;
        }
        if (lightPreviews[index]) {
            lightPreviews[index].style.backgroundColor = color;
            lightPreviews[index].style.boxShadow = `0 0 8px ${color}`;
        }
        if (kelvinValues[index]) {
            kelvinValues[index].textContent = `${kelvin}K (${starClass})`;
        }
        if (kelvinSliders[index]) {
            kelvinSliders[index].value = kelvin;
        }
    }

    // Initialize from lightParams (which may be loaded from localStorage)
    updateLightFromKelvin(0, lightParams.light0Kelvin);
    updateLightFromKelvin(1, lightParams.light1Kelvin);
    updateLightFromKelvin(2, lightParams.light2Kelvin);

    // Toggle panel
    if (lightControlsToggle) {
        lightControlsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            lightControls.classList.toggle('active');
        });
    }

    // Label toggle button
    const labelToggle = document.getElementById('label-toggle');
    if (labelToggle) {
        labelToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            showPlanetLabels = !showPlanetLabels;
            labelToggle.classList.toggle('active', showPlanetLabels);
        });
    }

    // Links toggle
    const linksToggle = document.getElementById('links-toggle');
    if (linksToggle) {
        linksToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            showConnectionLinks = !showConnectionLinks;
            linksToggle.classList.toggle('active', showConnectionLinks);
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (lightControls && !lightControls.contains(e.target)) {
            lightControls.classList.remove('active');
        }
    });

    // Kelvin slider handlers
    kelvinSliders.forEach((slider, i) => {
        if (slider) {
            slider.addEventListener('input', (e) => {
                const kelvin = parseInt(e.target.value);
                if (i === 0) lightParams.light0Kelvin = kelvin;
                else if (i === 1) lightParams.light1Kelvin = kelvin;
                else if (i === 2) lightParams.light2Kelvin = kelvin;
                updateLightFromKelvin(i, kelvin);
            });
        }
    });

    // Intensity slider handlers
    const intensitySliders = [
        document.getElementById('intensity-slider-0'),
        document.getElementById('intensity-slider-1'),
        document.getElementById('intensity-slider-2')
    ];
    const intensityValues = [
        document.getElementById('intensity-value-0'),
        document.getElementById('intensity-value-1'),
        document.getElementById('intensity-value-2')
    ];

    intensitySliders.forEach((slider, i) => {
        if (slider && intensityValues[i]) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (i === 0) lightParams.light0Intensity = value;
                else if (i === 1) lightParams.light1Intensity = value;
                else if (i === 2) lightParams.light2Intensity = value;
                intensityValues[i].textContent = value.toFixed(1);
            });
        }
    });

    // Attenuation slider handlers
    const attenuationSliders = [
        document.getElementById('attenuation-slider-0'),
        document.getElementById('attenuation-slider-1'),
        document.getElementById('attenuation-slider-2')
    ];
    const attenuationValues = [
        document.getElementById('attenuation-value-0'),
        document.getElementById('attenuation-value-1'),
        document.getElementById('attenuation-value-2')
    ];

    attenuationSliders.forEach((slider, i) => {
        if (slider && attenuationValues[i]) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (i === 0) lightParams.light0Attenuation = value;
                else if (i === 1) lightParams.light1Attenuation = value;
                else if (i === 2) lightParams.light2Attenuation = value;
                attenuationValues[i].textContent = value.toFixed(2);
            });
        }
    });

    // Ambient light slider handler
    const ambientSlider = document.getElementById('ambient-slider');
    const ambientValue = document.getElementById('ambient-value');
    if (ambientSlider && ambientValue) {
        ambientSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            lightParams.ambientIntensity = value;
            ambientValue.textContent = value.toFixed(2);
        });
    }

    // Fog intensity slider handler
    const fogSlider = document.getElementById('fog-slider');
    const fogValue = document.getElementById('fog-value');
    if (fogSlider && fogValue) {
        fogSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            lightParams.fogIntensity = value;
            fogValue.textContent = value.toFixed(2);
        });
    }

    // Reset button
    if (lightResetBtn) {
        lightResetBtn.addEventListener('click', () => {
            defaultKelvinTemps.forEach((temp, i) => {
                updateLightFromKelvin(i, temp);
            });
            // Reset intensity and attenuation to defaults
            const defaultIntensity = 1.0;
            const defaultAttenuation = 0.06;
            [0, 1, 2].forEach(i => {
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

    // ========================================
    // PLANET A (OCEANIC) CONTROLS
    // ========================================
    const planetAControls = document.getElementById('planet-a-controls');
    const planetAToggle = document.getElementById('planet-a-toggle');
    const planetAResetBtn = document.getElementById('planet-a-reset-btn');

    const planetASlidersConfig = {
        'a-noise-scale': { param: 'noiseScale', valueEl: 'a-noise-scale-value', default: 1.8, decimals: 1 },
        'a-terrain-height': { param: 'terrainHeight', valueEl: 'a-terrain-height-value', default: 0.6, decimals: 1 },
        'a-atmos-intensity': { param: 'atmosIntensity', valueEl: 'a-atmos-intensity-value', default: 0.6, decimals: 1 },
        'a-atmos-thickness': { param: 'atmosThickness', valueEl: 'a-atmos-thickness-value', default: 2.5, decimals: 2 },
        'a-atmos-power': { param: 'atmosPower', valueEl: 'a-atmos-power-value', default: 37.1, decimals: 1 },
        'a-scatter-scale': { param: 'scatterScale', valueEl: 'a-scatter-scale-value', default: 0.5, decimals: 2 },
        'a-sunset-strength': { param: 'sunsetStrength', valueEl: 'a-sunset-strength-value', default: 1.0, decimals: 2 },
        'a-ocean-roughness': { param: 'oceanRoughness', valueEl: 'a-ocean-roughness-value', default: 0.55, decimals: 2 },
        'a-sss-intensity': { param: 'sssIntensity', valueEl: 'a-sss-intensity-value', default: 1.0, decimals: 1 },
        'a-sea-level': { param: 'seaLevel', valueEl: 'a-sea-level-value', default: 0.0, decimals: 2 },
        'a-land-roughness': { param: 'landRoughness', valueEl: 'a-land-roughness-value', default: 0.65, decimals: 2 },
        'a-normal-strength': { param: 'normalStrength', valueEl: 'a-normal-strength-value', default: 0.15, decimals: 2 }
    };

    // Scatter color picker for Planet A
    const scatterColorA = document.getElementById('a-scatter-color');
    if (scatterColorA) {
        scatterColorA.value = planetParamsA.scatterColor;
        scatterColorA.addEventListener('input', () => {
            planetParamsA.scatterColor = scatterColorA.value;
        });
    }

    // Initialize Planet A sliders
    Object.entries(planetASlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = planetParamsA[config.param];
            valueEl.textContent = planetParamsA[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                planetParamsA[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    if (planetAToggle) {
        planetAToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            planetAControls.classList.toggle('active');
        });
    }

    if (planetAResetBtn) {
        planetAResetBtn.addEventListener('click', () => {
            Object.entries(planetASlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                planetParamsA[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset scatter color picker
            planetParamsA.scatterColor = '#1a40e6';
            if (scatterColorA) scatterColorA.value = '#1a40e6';
        });
    }

    // ========================================
    // PLANET B (LAVA) CONTROLS
    // ========================================
    const planetBControls = document.getElementById('planet-b-controls');
    const planetBToggle = document.getElementById('planet-b-toggle');
    const planetBResetBtn = document.getElementById('planet-b-reset-btn');

    const planetBSlidersConfig = {
        'b-noise-scale': { param: 'noiseScale', valueEl: 'b-noise-scale-value', default: 1.8, decimals: 1 },
        'b-terrain-height': { param: 'terrainHeight', valueEl: 'b-terrain-height-value', default: 0.6, decimals: 1 },
        'b-atmos-intensity': { param: 'atmosIntensity', valueEl: 'b-atmos-intensity-value', default: 0.8, decimals: 1 },
        'b-atmos-thickness': { param: 'atmosThickness', valueEl: 'b-atmos-thickness-value', default: 2.0, decimals: 2 },
        'b-atmos-power': { param: 'atmosPower', valueEl: 'b-atmos-power-value', default: 25.0, decimals: 1 },
        'b-scatter-scale': { param: 'scatterScale', valueEl: 'b-scatter-scale-value', default: 0.8, decimals: 2 },
        'b-sunset-strength': { param: 'sunsetStrength', valueEl: 'b-sunset-strength-value', default: 0.5, decimals: 2 },
        'b-lava-intensity': { param: 'lavaIntensity', valueEl: 'b-lava-intensity-value', default: 3.0, decimals: 1 },
        'b-sea-level': { param: 'seaLevel', valueEl: 'b-sea-level-value', default: 0.0, decimals: 2 },
        'b-land-roughness': { param: 'landRoughness', valueEl: 'b-land-roughness-value', default: 0.75, decimals: 2 },
        'b-normal-strength': { param: 'normalStrength', valueEl: 'b-normal-strength-value', default: 0.2, decimals: 2 }
    };

    // Scatter color picker for Planet B
    const scatterColorB = document.getElementById('b-scatter-color');
    if (scatterColorB) {
        scatterColorB.value = planetParamsB.scatterColor;
        scatterColorB.addEventListener('input', () => {
            planetParamsB.scatterColor = scatterColorB.value;
        });
    }

    // Initialize Planet B sliders
    Object.entries(planetBSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = planetParamsB[config.param];
            valueEl.textContent = planetParamsB[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                planetParamsB[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    if (planetBToggle) {
        planetBToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            planetBControls.classList.toggle('active');
        });
    }

    if (planetBResetBtn) {
        planetBResetBtn.addEventListener('click', () => {
            Object.entries(planetBSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                planetParamsB[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset scatter color picker
            planetParamsB.scatterColor = '#e63319';
            if (scatterColorB) scatterColorB.value = '#e63319';
        });
    }

    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        if (planetAControls && !planetAControls.contains(e.target)) {
            planetAControls.classList.remove('active');
        }
        if (planetBControls && !planetBControls.contains(e.target)) {
            planetBControls.classList.remove('active');
        }
    });

    // ========================================
    // PHYSICS CONTROLS UI
    // ========================================
    const physicsControls = document.getElementById('physics-controls');
    const physicsControlsToggle = document.getElementById('physics-controls-toggle');
    const physicsResetBtn = document.getElementById('physics-reset-btn');

    // Slider elements and their corresponding orbitParams keys
    const physicsSliders = {
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
    Object.entries(physicsSliders).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = orbitParams[config.param];
            if (config.isToggle) {
                valueEl.textContent = orbitParams[config.param] >= 1 ? 'ON' : 'OFF';
            } else {
                valueEl.textContent = orbitParams[config.param].toFixed(config.decimals);
            }

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
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
        physicsControlsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            physicsControls.classList.toggle('active');
        });
    }

    // Close physics panel when clicking outside
    document.addEventListener('click', (e) => {
        if (physicsControls && !physicsControls.contains(e.target)) {
            physicsControls.classList.remove('active');
        }
    });

    // Orbital reset button
    if (physicsResetBtn) {
        physicsResetBtn.addEventListener('click', () => {
            Object.entries(physicsSliders).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
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

    // ========================================
    // SUN/HALO CONTROLS UI
    // ========================================
    const sunControls = document.getElementById('sun-controls');
    const sunToggle = document.getElementById('sun-toggle');
    const sunResetBtn = document.getElementById('sun-reset-btn');

    const sunSlidersConfig = {
        'sun-core-size': { param: 'coreSize', valueEl: 'sun-core-size-value', default: 0.5, decimals: 2 },
        'sun-glow-size': { param: 'glowSize', valueEl: 'sun-glow-size-value', default: 1.0, decimals: 2 },
        'sun-glow-intensity': { param: 'glowIntensity', valueEl: 'sun-glow-intensity-value', default: 0.6, decimals: 2 },
        'sun-corona-intensity': { param: 'coronaIntensity', valueEl: 'sun-corona-intensity-value', default: 1.0, decimals: 2 },
        'sun-ray-count': { param: 'rayCount', valueEl: 'sun-ray-count-value', default: 12, decimals: 0 },
        'sun-ray-intensity': { param: 'rayIntensity', valueEl: 'sun-ray-intensity-value', default: 1.0, decimals: 2 },
        'sun-ray-length': { param: 'rayLength', valueEl: 'sun-ray-length-value', default: 2.0, decimals: 2 },
        'sun-streamer-count': { param: 'streamerCount', valueEl: 'sun-streamer-count-value', default: 6, decimals: 0 },
        'sun-streamer-intensity': { param: 'streamerIntensity', valueEl: 'sun-streamer-intensity-value', default: 1.0, decimals: 2 },
        'sun-streamer-length': { param: 'streamerLength', valueEl: 'sun-streamer-length-value', default: 1.5, decimals: 2 },
        'sun-halo-ring1-dist': { param: 'haloRing1Dist', valueEl: 'sun-halo-ring1-dist-value', default: 1.2, decimals: 2 },
        'sun-halo-ring1-intensity': { param: 'haloRing1Intensity', valueEl: 'sun-halo-ring1-intensity-value', default: 0.15, decimals: 2 },
        'sun-halo-ring2-dist': { param: 'haloRing2Dist', valueEl: 'sun-halo-ring2-dist-value', default: 1.8, decimals: 2 },
        'sun-halo-ring2-intensity': { param: 'haloRing2Intensity', valueEl: 'sun-halo-ring2-intensity-value', default: 0.08, decimals: 2 },
        'sun-flicker-speed': { param: 'flickerSpeed', valueEl: 'sun-flicker-speed-value', default: 3.0, decimals: 1 },
        'sun-pulse-speed': { param: 'pulseSpeed', valueEl: 'sun-pulse-speed-value', default: 2.0, decimals: 1 },
        'sun-chromatic-shift': { param: 'chromaticShift', valueEl: 'sun-chromatic-shift-value', default: 1.0, decimals: 2 }
    };

    // Initialize sun sliders
    Object.entries(sunSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = sunParams[config.param];
            valueEl.textContent = sunParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                sunParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Toggle sun controls panel
    if (sunToggle) {
        sunToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sunControls.classList.toggle('active');
        });
    }

    // Close sun panel when clicking outside
    document.addEventListener('click', (e) => {
        if (sunControls && !sunControls.contains(e.target)) {
            sunControls.classList.remove('active');
        }
    });

    // Sun reset button
    if (sunResetBtn) {
        sunResetBtn.addEventListener('click', () => {
            Object.entries(sunSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                sunParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
        });
    }

    // ========================================
    // SPACE PARTICLES CONTROLS UI
    // ========================================
    const particlesControls = document.getElementById('particles-controls');
    const particlesToggle = document.getElementById('particles-toggle');
    const particlesResetBtn = document.getElementById('particles-reset-btn');

    const particlesSlidersConfig = {
        // Focus distance settings
        'particles-focus-distance': { param: 'focusDistance', valueEl: 'particles-focus-distance-value', default: 0.7, decimals: 2 },
        'particles-focus-range': { param: 'focusRange', valueEl: 'particles-focus-range-value', default: 0.15, decimals: 2 },
        'particles-near-blur': { param: 'nearBlurDist', valueEl: 'particles-near-blur-value', default: 0.3, decimals: 2 },
        'particles-far-blur': { param: 'farBlurDist', valueEl: 'particles-far-blur-value', default: 1.2, decimals: 2 },
        // Bokeh effect
        'particles-max-blur': { param: 'maxBlurSize', valueEl: 'particles-max-blur-value', default: 25.0, decimals: 1 },
        'particles-aperture': { param: 'apertureSize', valueEl: 'particles-aperture-value', default: 1.0, decimals: 2 },
        'particles-ring-width': { param: 'bokehRingWidth', valueEl: 'particles-ring-width-value', default: 0.5, decimals: 2 },
        'particles-ring-intensity': { param: 'bokehRingIntensity', valueEl: 'particles-ring-intensity-value', default: 0.8, decimals: 2 },
        // Circle quality
        'particles-softness': { param: 'circleSoftness', valueEl: 'particles-softness-value', default: 0.3, decimals: 2 },
        // Appearance
        'particles-size': { param: 'particleSize', valueEl: 'particles-size-value', default: 2.0, decimals: 2 },
        'particles-brightness': { param: 'brightness', valueEl: 'particles-brightness-value', default: 1.0, decimals: 2 },
        'particles-light-falloff': { param: 'lightFalloff', valueEl: 'particles-light-falloff-value', default: 3.0, decimals: 2 }
    };

    // Shooting star sliders config
    const shootingStarSlidersConfig = {
        'shooting-chance': { param: 'chance', valueEl: 'shooting-chance-value', default: 0.0003, decimals: 3 },
        'shooting-speed': { param: 'speed', valueEl: 'shooting-speed-value', default: 0.4, decimals: 2 },
        'shooting-duration': { param: 'duration', valueEl: 'shooting-duration-value', default: 0.8, decimals: 2 }
    };

    // Shooting star color pickers config
    const shootingStarColorConfig = {
        'shooting-gold-color': { param: 'goldColor', default: '#e8b923' },
        'shooting-teal-color': { param: 'tealColor', default: '#2dd4bf' }
    };

    // Initialize particles sliders
    Object.entries(particlesSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = spaceParticleParams[config.param];
            valueEl.textContent = spaceParticleParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                spaceParticleParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Initialize shooting star sliders
    Object.entries(shootingStarSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = shootingStarParams[config.param];
            valueEl.textContent = shootingStarParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                shootingStarParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Initialize shooting star color pickers
    Object.entries(shootingStarColorConfig).forEach(([pickerId, config]) => {
        const picker = document.getElementById(pickerId);
        if (picker) {
            picker.value = shootingStarParams[config.param];
            picker.addEventListener('input', () => {
                shootingStarParams[config.param] = picker.value;
            });
        }
    });

    // Initialize base particle color picker
    const baseColorPicker = document.getElementById('particles-base-color');
    if (baseColorPicker) {
        baseColorPicker.value = spaceParticleParams.baseColor;
        baseColorPicker.addEventListener('input', () => {
            spaceParticleParams.baseColor = baseColorPicker.value;
        });
    }

    // Toggle panel
    if (particlesToggle) {
        particlesToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            particlesControls.classList.toggle('active');
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (particlesControls && !particlesControls.contains(e.target)) {
            particlesControls.classList.remove('active');
        }
    });

    // Reset button
    if (particlesResetBtn) {
        particlesResetBtn.addEventListener('click', () => {
            // Reset particle params
            Object.entries(particlesSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                spaceParticleParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset shooting star sliders
            Object.entries(shootingStarSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                shootingStarParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset shooting star colors
            Object.entries(shootingStarColorConfig).forEach(([pickerId, config]) => {
                const picker = document.getElementById(pickerId);
                shootingStarParams[config.param] = config.default;
                if (picker) picker.value = config.default;
            });
            // Reset base particle color
            spaceParticleParams.baseColor = '#fffaf2';
            if (baseColorPicker) baseColorPicker.value = '#fffaf2';
        });
    }

    // ========================================
    // NEBULA BACKGROUND CONTROLS UI
    // ========================================
    const nebulaControls = document.getElementById('nebula-controls');
    const nebulaToggle = document.getElementById('nebula-toggle');
    const nebulaResetBtn = document.getElementById('nebula-reset-btn');

    const nebulaSlidersConfig = {
        'nebula-intensity': { param: 'intensity', valueEl: 'nebula-intensity-value', default: 0.25, decimals: 2 },
        'nebula-scale': { param: 'scale', valueEl: 'nebula-scale-value', default: 2.0, decimals: 2 },
        'nebula-detail': { param: 'detail', valueEl: 'nebula-detail-value', default: 2.0, decimals: 2 },
        'nebula-speed': { param: 'speed', valueEl: 'nebula-speed-value', default: 0.08, decimals: 2 },
        'nebula-color-variation': { param: 'colorVariation', valueEl: 'nebula-color-variation-value', default: 0.8, decimals: 2 },
        'nebula-dust-density': { param: 'dustDensity', valueEl: 'nebula-dust-density-value', default: 0.4, decimals: 2 },
        'nebula-star-density': { param: 'starDensity', valueEl: 'nebula-star-density-value', default: 0.25, decimals: 2 },
        'nebula-light-influence': { param: 'lightInfluence', valueEl: 'nebula-light-influence-value', default: 0.4, decimals: 2 },
        'nebula-fractal-intensity': { param: 'fractalIntensity', valueEl: 'nebula-fractal-intensity-value', default: 0.15, decimals: 2 },
        'nebula-fractal-scale': { param: 'fractalScale', valueEl: 'nebula-fractal-scale-value', default: 8.0, decimals: 1 },
        'nebula-fractal-speed': { param: 'fractalSpeed', valueEl: 'nebula-fractal-speed-value', default: 0.03, decimals: 3 },
        'nebula-fractal-saturation': { param: 'fractalSaturation', valueEl: 'nebula-fractal-saturation-value', default: 3.0, decimals: 1 },
        'nebula-fractal-falloff': { param: 'fractalFalloff', valueEl: 'nebula-fractal-falloff-value', default: 3.0, decimals: 1 },
        'nebula-vignette': { param: 'vignetteStrength', valueEl: 'nebula-vignette-value', default: 0.3, decimals: 2 }
    };

    // Nebula color picker config
    const nebulaColorConfig = {
        'nebula-color-purple': { param: 'colorPurple', default: [0.12, 0.04, 0.18] },
        'nebula-color-cyan': { param: 'colorCyan', default: [0.04, 0.12, 0.20] },
        'nebula-color-blue': { param: 'colorBlue', default: [0.03, 0.06, 0.15] },
        'nebula-color-gold': { param: 'colorGold', default: [0.15, 0.10, 0.03] }
    };

    // Initialize nebula sliders
    Object.entries(nebulaSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = nebulaParams[config.param];
            valueEl.textContent = nebulaParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                nebulaParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Helper to convert RGB array (0-1) to hex
    function rgbToHex(rgb) {
        const r = Math.round(rgb[0] * 255);
        const g = Math.round(rgb[1] * 255);
        const b = Math.round(rgb[2] * 255);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // Helper to convert hex to RGB array (0-1)
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [0, 0, 0];
    }

    // Initialize nebula color pickers
    Object.entries(nebulaColorConfig).forEach(([pickerId, config]) => {
        const picker = document.getElementById(pickerId);
        if (picker) {
            picker.value = rgbToHex(nebulaParams[config.param]);
            picker.addEventListener('input', () => {
                nebulaParams[config.param] = hexToRgb(picker.value);
            });
        }
    });

    // Toggle panel
    if (nebulaToggle) {
        nebulaToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            nebulaControls.classList.toggle('active');
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (nebulaControls && !nebulaControls.contains(e.target)) {
            nebulaControls.classList.remove('active');
        }
    });

    // Reset button
    if (nebulaResetBtn) {
        nebulaResetBtn.addEventListener('click', () => {
            // Reset sliders
            Object.entries(nebulaSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                nebulaParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset color pickers
            Object.entries(nebulaColorConfig).forEach(([pickerId, config]) => {
                const picker = document.getElementById(pickerId);
                nebulaParams[config.param] = [...config.default];
                if (picker) picker.value = rgbToHex(config.default);
            });
        });
    }

    // ========================================
    // DEBUG QUAD CONTROLS UI
    // ========================================
    const debugControls = document.getElementById('debug-controls');
    const debugToggle = document.getElementById('debug-toggle');
    const debugEnableCheckbox = document.getElementById('debug-quad-enable');

    // Enable checkbox
    if (debugEnableCheckbox) {
        debugEnableCheckbox.checked = showDebugQuads;
        debugEnableCheckbox.addEventListener('change', () => {
            showDebugQuads = debugEnableCheckbox.checked;
        });
    }

    // Toggle panel
    if (debugToggle) {
        debugToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            debugControls.classList.toggle('active');
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (debugControls && !debugControls.contains(e.target)) {
            debugControls.classList.remove('active');
        }
    });

    // ========================================
    // GOD RAYS CONTROLS UI
    // ========================================
    const godraysControls = document.getElementById('godrays-controls');
    const godraysToggle = document.getElementById('godrays-toggle');
    const godraysResetBtn = document.getElementById('godrays-reset-btn');

    const godraysSlidersConfig = {
        'godrays-ray-intensity': { param: 'rayIntensity', valueEl: 'godrays-ray-intensity-value', default: 0.5, decimals: 2 },
        'godrays-ray-falloff': { param: 'rayFalloff', valueEl: 'godrays-ray-falloff-value', default: 4.0, decimals: 2 },
        'godrays-glow-intensity': { param: 'glowIntensity', valueEl: 'godrays-glow-intensity-value', default: 0.5, decimals: 2 },
        'godrays-glow-size': { param: 'glowSize', valueEl: 'godrays-glow-size-value', default: 4.0, decimals: 2 },
        'godrays-fog-density': { param: 'fogDensity', valueEl: 'godrays-fog-density-value', default: 6.0, decimals: 2 },
        'godrays-ambient-fog': { param: 'ambientFog', valueEl: 'godrays-ambient-fog-value', default: 0.08, decimals: 2 },
        'godrays-noise-scale': { param: 'noiseScale', valueEl: 'godrays-noise-scale-value', default: 1.0, decimals: 2 },
        'godrays-noise-octaves': { param: 'noiseOctaves', valueEl: 'godrays-noise-octaves-value', default: 1.0, decimals: 2 },
        'godrays-noise-contrast': { param: 'noiseContrast', valueEl: 'godrays-noise-contrast-value', default: 1.0, decimals: 2 },
        'godrays-anim-speed': { param: 'animSpeed', valueEl: 'godrays-anim-speed-value', default: 1.0, decimals: 2 }
    };

    // Initialize god rays sliders
    Object.entries(godraysSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl) {
            slider.value = godRaysParams[config.param];
            valueEl.textContent = godRaysParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                godRaysParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Toggle panel
    if (godraysToggle) {
        godraysToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            godraysControls.classList.toggle('active');
        });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (godraysControls && !godraysControls.contains(e.target)) {
            godraysControls.classList.remove('active');
        }
    });

    // Reset button
    if (godraysResetBtn) {
        godraysResetBtn.addEventListener('click', () => {
            Object.entries(godraysSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                godRaysParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
        });
    }

    // ========================================
    // SHADER SETTINGS SAVE/LOAD SYSTEM
    // ========================================
    const SETTINGS_STORAGE_KEY = 'shaderSettings_v1';

    // Collect all current settings
    function getAllSettings() {
        return {
            version: 1,
            timestamp: new Date().toISOString(),
            planetParamsA: { ...planetParamsA },
            planetParamsB: { ...planetParamsB },
            sunParams: { ...sunParams },
            lightParams: { ...lightParams },
            physicsParams: { ...physicsParams },
            spaceParticleParams: { ...spaceParticleParams },
            shootingStarParams: { ...shootingStarParams },
            godRaysParams: { ...godRaysParams },
            nebulaParams: { ...nebulaParams }
        };
    }

    // Apply settings to param objects and update UI
    function applySettings(settings) {
        if (!settings) return;

        // Apply to each param object
        const paramMappings = [
            ['planetParamsA', planetParamsA],
            ['planetParamsB', planetParamsB],
            ['sunParams', sunParams],
            ['lightParams', lightParams],
            ['physicsParams', physicsParams],
            ['spaceParticleParams', spaceParticleParams],
            ['shootingStarParams', shootingStarParams],
            ['godRaysParams', godRaysParams],
            ['nebulaParams', nebulaParams]
        ];

        paramMappings.forEach(([key, paramObj]) => {
            if (settings[key]) {
                Object.keys(settings[key]).forEach(param => {
                    if (param in paramObj) {
                        paramObj[param] = settings[key][param];
                    }
                });
            }
        });

        // Update all sliders to reflect loaded values
        updateAllSliders();
    }

    // Update all slider UI elements to match current param values
    // Uses a mapping approach that doesn't depend on slider config objects
    function updateAllSliders() {
        // Helper to update a slider and its value display
        function updateSlider(sliderId, value, decimals) {
            const slider = document.getElementById(sliderId);
            const valueEl = document.getElementById(sliderId + '-value');
            if (slider && value !== undefined) {
                slider.value = value;
                if (valueEl) {
                    valueEl.textContent = typeof value === 'number' ? value.toFixed(decimals) : value;
                }
            }
        }

        // Planet A sliders
        updateSlider('a-noise-scale', planetParamsA.noiseScale, 1);
        updateSlider('a-terrain-height', planetParamsA.terrainHeight, 1);
        updateSlider('a-atmos-intensity', planetParamsA.atmosIntensity, 1);
        updateSlider('a-atmos-thickness', planetParamsA.atmosThickness, 2);
        updateSlider('a-atmos-power', planetParamsA.atmosPower, 1);
        updateSlider('a-scatter-scale', planetParamsA.scatterScale, 2);
        updateSlider('a-sunset-strength', planetParamsA.sunsetStrength, 2);
        updateSlider('a-ocean-roughness', planetParamsA.oceanRoughness, 2);
        updateSlider('a-sss-intensity', planetParamsA.sssIntensity, 1);
        updateSlider('a-sea-level', planetParamsA.seaLevel, 2);
        updateSlider('a-land-roughness', planetParamsA.landRoughness, 2);
        updateSlider('a-normal-strength', planetParamsA.normalStrength, 2);
        // Scatter color picker
        const scatterColorA = document.getElementById('a-scatter-color');
        if (scatterColorA) scatterColorA.value = planetParamsA.scatterColor;

        // Planet B sliders
        updateSlider('b-noise-scale', planetParamsB.noiseScale, 1);
        updateSlider('b-terrain-height', planetParamsB.terrainHeight, 1);
        updateSlider('b-atmos-intensity', planetParamsB.atmosIntensity, 1);
        updateSlider('b-atmos-thickness', planetParamsB.atmosThickness, 2);
        updateSlider('b-atmos-power', planetParamsB.atmosPower, 1);
        updateSlider('b-scatter-scale', planetParamsB.scatterScale, 2);
        updateSlider('b-sunset-strength', planetParamsB.sunsetStrength, 2);
        updateSlider('b-lava-intensity', planetParamsB.lavaIntensity, 1);
        updateSlider('b-sea-level', planetParamsB.seaLevel, 2);
        updateSlider('b-land-roughness', planetParamsB.landRoughness, 2);
        updateSlider('b-normal-strength', planetParamsB.normalStrength, 2);
        // Scatter color picker
        const scatterColorB = document.getElementById('b-scatter-color');
        if (scatterColorB) scatterColorB.value = planetParamsB.scatterColor;

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

        // Particles sliders
        updateSlider('particles-focus-distance', spaceParticleParams.focusDistance, 2);
        updateSlider('particles-focus-range', spaceParticleParams.focusRange, 2);
        updateSlider('particles-near-blur', spaceParticleParams.nearBlurDist, 2);
        updateSlider('particles-far-blur', spaceParticleParams.farBlurDist, 2);
        updateSlider('particles-max-blur', spaceParticleParams.maxBlurSize, 1);
        updateSlider('particles-aperture', spaceParticleParams.apertureSize, 2);
        updateSlider('particles-ring-width', spaceParticleParams.bokehRingWidth, 2);
        updateSlider('particles-ring-intensity', spaceParticleParams.bokehRingIntensity, 2);
        updateSlider('particles-softness', spaceParticleParams.circleSoftness, 2);
        updateSlider('particles-size', spaceParticleParams.particleSize, 2);
        updateSlider('particles-brightness', spaceParticleParams.brightness, 2);
        updateSlider('particles-light-falloff', spaceParticleParams.lightFalloff, 2);
        // Particles base color picker
        const particlesBaseColorPicker = document.getElementById('particles-base-color');
        if (particlesBaseColorPicker) particlesBaseColorPicker.value = spaceParticleParams.baseColor;

        // Shooting star sliders
        updateSlider('shooting-chance', shootingStarParams.chance, 3);
        updateSlider('shooting-speed', shootingStarParams.speed, 2);
        updateSlider('shooting-duration', shootingStarParams.duration, 2);
        // Shooting star color pickers
        const shootingGoldPicker = document.getElementById('shooting-gold-color');
        const shootingTealPicker = document.getElementById('shooting-teal-color');
        if (shootingGoldPicker) shootingGoldPicker.value = shootingStarParams.goldColor;
        if (shootingTealPicker) shootingTealPicker.value = shootingStarParams.tealColor;

        // God rays sliders
        updateSlider('godrays-ray-intensity', godRaysParams.rayIntensity, 2);
        updateSlider('godrays-ray-falloff', godRaysParams.rayFalloff, 2);
        updateSlider('godrays-glow-intensity', godRaysParams.glowIntensity, 2);
        updateSlider('godrays-glow-size', godRaysParams.glowSize, 2);
        updateSlider('godrays-fog-density', godRaysParams.fogDensity, 2);
        updateSlider('godrays-ambient-fog', godRaysParams.ambientFog, 2);
        updateSlider('godrays-noise-scale', godRaysParams.noiseScale, 2);
        updateSlider('godrays-noise-octaves', godRaysParams.noiseOctaves, 2);
        updateSlider('godrays-noise-contrast', godRaysParams.noiseContrast, 2);
        updateSlider('godrays-anim-speed', godRaysParams.animSpeed, 2);

        // Nebula sliders
        updateSlider('nebula-intensity', nebulaParams.intensity, 2);
        updateSlider('nebula-scale', nebulaParams.scale, 2);
        updateSlider('nebula-detail', nebulaParams.detail, 2);
        updateSlider('nebula-speed', nebulaParams.speed, 2);
        updateSlider('nebula-color-variation', nebulaParams.colorVariation, 2);
        updateSlider('nebula-dust-density', nebulaParams.dustDensity, 2);
        updateSlider('nebula-star-density', nebulaParams.starDensity, 2);
        updateSlider('nebula-light-influence', nebulaParams.lightInfluence, 2);
        updateSlider('nebula-fractal-intensity', nebulaParams.fractalIntensity, 2);
        updateSlider('nebula-fractal-scale', nebulaParams.fractalScale, 1);
        updateSlider('nebula-fractal-speed', nebulaParams.fractalSpeed, 3);
        updateSlider('nebula-fractal-saturation', nebulaParams.fractalSaturation, 1);
        updateSlider('nebula-fractal-falloff', nebulaParams.fractalFalloff, 1);
        updateSlider('nebula-vignette', nebulaParams.vignetteStrength, 2);

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
        const showOrbitsValueEl = document.getElementById('show-orbits-value');
        if (showOrbitsValueEl) showOrbitsValueEl.textContent = orbitParams.showOrbits >= 1 ? 'ON' : 'OFF';

        // Kelvin sliders (also update node colors)
        updateLightFromKelvin(0, lightParams.light0Kelvin);
        updateLightFromKelvin(1, lightParams.light1Kelvin);
        updateLightFromKelvin(2, lightParams.light2Kelvin);
    }

    // Save to localStorage
    function saveToLocalStorage() {
        try {
            const settings = getAllSettings();
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }

    // Load from localStorage
    function loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
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
        const settings = getAllSettings();
        const json = JSON.stringify(settings, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shader-preset-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Export settings as JavaScript code (for embedding in source)
    function exportAsCode() {
        const settings = getAllSettings();

        // Generate JavaScript code that can be pasted into main.js
        const code = `// ============================================
// EXPORTED SHADER SETTINGS - Generated ${new Date().toISOString()}
// Paste this at the top of main.js (replace the existing param objects)
// ============================================

// Planet A: Oceanic/Mountain planets (blue/green, water)
const planetParamsA = ${JSON.stringify(settings.planetParamsA, null, 4)};

// Planet B: Lava/Desert planets (volcanic)
const planetParamsB = ${JSON.stringify(settings.planetParamsB, null, 4)};

// Sun/Star halo parameters
const sunParams = ${JSON.stringify(settings.sunParams, null, 4)};

// Light properties (shared across all planet types)
const lightParams = ${JSON.stringify(settings.lightParams, null, 4)};

// God rays parameters
const godRaysParams = ${JSON.stringify(settings.godRaysParams, null, 4)};

// Space particles parameters
const spaceParticleParams = ${JSON.stringify(settings.spaceParticleParams, null, 4)};

// Nebula background parameters
const nebulaParams = ${JSON.stringify(settings.nebulaParams, null, 4)};

// Orbital system parameters
const orbitParams = ${JSON.stringify(settings.orbitParams, null, 4)};
`;

        // Copy to clipboard
        navigator.clipboard.writeText(code).then(() => {
            showCodeExportModal(code, true);
        }).catch(() => {
            showCodeExportModal(code, false);
        });
    }

    // Show modal with exported code
    function showCodeExportModal(code, copied) {
        // Remove existing modal if any
        const existing = document.getElementById('code-export-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'code-export-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

        const content = document.createElement('div');
        content.style.cssText = 'background:#1a1f2e;border:1px solid #e8b923;border-radius:8px;max-width:800px;max-height:80vh;width:100%;display:flex;flex-direction:column;overflow:hidden;';

        const header = document.createElement('div');
        header.style.cssText = 'padding:12px 16px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;';

        const statusColor = copied ? '#2dd4bf' : '#ff6b6b';
        const statusText = copied ? 'Copied to clipboard!' : 'Could not copy - select and copy manually';
        header.innerHTML = '<div><strong style="color:#e8b923;">Export as JavaScript Code</strong><span style="color:' + statusColor + ';margin-left:12px;font-size:12px;">' + statusText + '</span></div><button id="close-code-modal" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;">&times;</button>';

        const instructions = document.createElement('div');
        instructions.style.cssText = 'padding:12px 16px;background:#0d1117;font-size:12px;color:#8b949e;border-bottom:1px solid #333;';
        instructions.innerHTML = '<strong>Instructions:</strong> Replace the parameter objects at the top of <code style="color:#e8b923;">js/main.js</code> (lines ~32-103) with this code.';

        const codeArea = document.createElement('textarea');
        codeArea.value = code;
        codeArea.readOnly = true;
        codeArea.style.cssText = 'flex:1;background:#0d1117;color:#c9d1d9;border:none;padding:16px;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.5;resize:none;overflow:auto;min-height:300px;';

        const footer = document.createElement('div');
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
            const blob = new Blob([code], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
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
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const settings = JSON.parse(event.target.result);
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
    let saveTimeout = null;
    function debouncedSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToLocalStorage, 500);
    }

    // Attach auto-save to all sliders (all slider classes)
    document.querySelectorAll('.render-slider, .kelvin-slider, .light-property-slider, .physics-slider').forEach(slider => {
        slider.addEventListener('input', debouncedSave);
    });

    // Attach auto-save to color pickers
    document.querySelectorAll('input[type="color"]').forEach(picker => {
        picker.addEventListener('input', debouncedSave);
    });

    // Create and inject export/import buttons
    function createSettingsButtons() {
        // Find all control panels and add buttons
        const panels = [
            { controls: 'sun-controls', resetBtn: 'sun-reset-btn' },
            { controls: 'godrays-controls', resetBtn: 'godrays-reset-btn' },
            { controls: 'particles-controls', resetBtn: 'particles-reset-btn' },
            { controls: 'nebula-controls', resetBtn: 'nebula-reset-btn' }
        ];

        panels.forEach(panel => {
            const resetBtn = document.getElementById(panel.resetBtn);
            if (resetBtn) {
                // Create button container
                const btnContainer = document.createElement('div');
                btnContainer.className = 'settings-btn-container';
                btnContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;';

                const exportBtn = document.createElement('button');
                exportBtn.className = 'render-reset-btn';
                exportBtn.textContent = 'Export JSON';
                exportBtn.style.cssText = 'flex:1;font-size:10px;min-width:70px;';
                exportBtn.addEventListener('click', exportSettings);

                const importBtn = document.createElement('button');
                importBtn.className = 'render-reset-btn';
                importBtn.textContent = 'Import';
                importBtn.style.cssText = 'flex:1;font-size:10px;min-width:70px;';
                importBtn.addEventListener('click', importSettings);

                const exportCodeBtn = document.createElement('button');
                exportCodeBtn.className = 'render-reset-btn';
                exportCodeBtn.textContent = 'Export as Code';
                exportCodeBtn.style.cssText = 'flex:2;font-size:10px;min-width:100px;background:#e8b923;color:#000;';
                exportCodeBtn.title = 'Export settings as JavaScript code to embed in main.js';
                exportCodeBtn.addEventListener('click', exportAsCode);

                btnContainer.appendChild(exportBtn);
                btnContainer.appendChild(importBtn);
                btnContainer.appendChild(exportCodeBtn);

                // Insert after reset button
                resetBtn.parentNode.insertBefore(btnContainer, resetBtn.nextSibling);
            }
        });
    }

    // Initialize: load saved settings and create buttons
    loadFromLocalStorage();
    createSettingsButtons();

    // Expose functions globally for settings panel
    window.saveToLocalStorage = saveToLocalStorage;
    window.exportSettings = exportSettings;
    window.exportAsCode = exportAsCode;
    window.importSettings = importSettings;
    window.updateLightFromKelvin = updateLightFromKelvin;

    // Expose parameter objects globally for settings panel
    window.spaceParticleParams = spaceParticleParams;
    window.godRaysParams = godRaysParams;

    animate();
})();
