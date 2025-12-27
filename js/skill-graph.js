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
        teal: '#2dd4bf',
        textPrimary: '#e8eaed',
        textMuted: '#6b7280'
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

    // Simple solar system: 3 suns at positions defined in solarSystemParams
    // Positions are now directly controlled via settings panel (X, Y, Z)

    // Dynamic sun position calculation - uses solarSystemParams from core.js
    function getSunPosition(sunId) {
        const params = window.solarSystemParams[sunId];
        if (!params) return { x: 0, y: 0, z: 0 };

        const spread = orbitParams.sunSpread;
        return {
            x: params.posX * spread,
            y: params.posY * spread,
            z: params.posZ * spread
        };
    }

    // Get orbital tilt for a solar system - uses solarSystemParams from core.js
    function getSolarSystemTilt(sunId) {
        const params = window.solarSystemParams[sunId];
        if (!params) return { tiltX: 0, tiltY: 0, tiltZ: 0 };
        return {
            tiltX: params.tiltX,
            tiltY: params.tiltY,
            tiltZ: params.tiltZ
        };
    }

    // Moon orbit configurations - baseRadius is normalized 0-1 (mapped to baseOrbitMin-Max)
    // All moons of the same sun share the solar system's orbital plane tilt
    // Final radius = (baseOrbitMin + baseRadius * (baseOrbitMax - baseOrbitMin)) + (orbitIndex * spacing)
    const moonOrbits = {
        // Unity moons (all share unity's orbital plane)
        csharp:   { baseRadius: 0.5, orbitIndex: 0, speed: 0.008, phase: 0, sun: 'unity' },
        hdrp:     { baseRadius: 0.5, orbitIndex: 1, speed: -0.007, phase: Math.PI * 0.5, sun: 'unity' },
        urp:      { baseRadius: 0.5, orbitIndex: 2, speed: 0.006, phase: Math.PI, sun: 'unity' },
        vfx:      { baseRadius: 0.5, orbitIndex: 3, speed: -0.006, phase: Math.PI * 1.25, sun: 'unity' },
        arvr:     { baseRadius: 0.5, orbitIndex: 4, speed: 0.005, phase: Math.PI * 1.6, sun: 'unity' },
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

    let nodes = skills.map((skill) => {
        // Compute depth based on size: larger = closer (depth 1), smaller = farther (depth 0)
        const depth = Math.min(1.0, Math.max(0.0, (skill.baseSize - 6) / 28));

        return {
            ...skill,
            size: skill.baseSize,
            x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
            renderX: 0, renderY: 0,
            depth: depth,
            orbitAngle: Math.random() * Math.PI * 2,
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
    let hoveredNode = null;
    let mouseX = 0, mouseY = 0;  // World coordinates
    let mouseScreenX = 0, mouseScreenY = 0;  // Screen coordinates (for hit testing)
    let globalFadeIn = 0;
    let mouseLightEnabled = false; // Toggle with spacebar

    // Free camera system - position + rotation (FPS-style)
    // Camera position in world space
    let cameraPosX = -2, cameraPosY = 0, cameraPosZ = 3.5;  // Start at (-2, 0, 3.5)
    let targetCameraPosX = -2, targetCameraPosY = 0, targetCameraPosZ = 3.5;
    // Camera rotation (pitch = up/down, yaw = left/right)
    // Calculate yaw to look at origin from (-2, 0, 3.5): atan2(2, -3.5)
    let cameraRotX = 0, cameraRotY = Math.atan2(2, -3.5);  // Current rotation (pitch, yaw)
    let targetCameraRotX = 0, targetCameraRotY = Math.atan2(2, -3.5);  // Target rotation
    let isOrbiting = false;  // Left click dragging on empty space
    let orbitStartX = 0, orbitStartY = 0;  // Mouse position when drag started
    let orbitStartRotX = 0, orbitStartRotY = 0;  // Camera rotation when drag started
    const keysPressed = {};  // Track which keys are currently held

    // Camera parameters (exposed for settings panel)
    window.cameraParams = {
        moveSpeed: 0.005,        // Movement speed per frame (WASD)
        rotationSpeed: 0.003,    // Mouse rotation sensitivity
        smoothing: 0.08          // Camera movement smoothing (0-1)
    };

    // Camera focus system - smooth transition to look at and approach a node
    let isFocusing = false;           // True while camera is transitioning to focus target
    let focusTarget = null;           // The node being focused on
    let focusProgress = 0;            // 0 to 1 progress of the focus transition
    const focusDuration = 1.5;        // Seconds to complete focus transition
    const focusDistance = 0.35;       // How close to get to the target (in world units, further away)

    // Solar system navigation - smooth travel to a sun
    let isNavigating = false;         // True while camera is traveling to a solar system
    let navTarget = null;             // The sun node being navigated to
    let navTargetId = null;           // The sun ID for getting orbital tilt
    let navPhase = 'look';            // 'look' = turning to face, 'wait' = pause, 'travel' = moving
    let navPhaseTime = 0;             // Time spent in current phase
    const navLookDuration = 1.0;      // Seconds to turn and look at target
    const navWaitDuration = 0.2;      // Seconds to pause before traveling
    const navTravelDuration = 10.0;   // Seconds to travel to target
    const navDistance = 0.6;          // How far to stop from the sun (further)
    let navStartPosX = 0, navStartPosY = 0, navStartPosZ = 0;  // Starting position for travel

    // Track which solar system the camera is currently at (after navigation completes)
    let currentSolarSystem = null;

    // Navigate to a solar system by sun ID
    function navigateToSolarSystem(sunId) {
        const sunNode = nodes.find(n => n.id === sunId);
        if (!sunNode) {
            console.warn('navigateToSolarSystem: sun node not found:', sunId);
            return;
        }

        // Ensure worldX/Y/Z are set (they're populated by simulate())
        if (sunNode.worldX === undefined) {
            // Force update node positions if not yet initialized
            console.log('navigateToSolarSystem: forcing position update for', sunId);
            simulate();
        }

        // Don't restart if already navigating to this sun
        if (isNavigating && navTarget === sunNode) return;

        // Don't re-navigate if already at this solar system
        if (currentSolarSystem === sunId) return;

        // Clear current solar system since we're navigating away
        currentSolarSystem = null;

        isNavigating = true;
        isFocusing = false;  // Cancel any node focus
        focusTarget = null;
        navTarget = sunNode;
        navTargetId = sunId;
        navPhase = 'look';
        navPhaseTime = 0;
        // Store starting position for smooth travel interpolation
        navStartPosX = cameraPosX;
        navStartPosY = cameraPosY;
        navStartPosZ = cameraPosZ;

        // Update button states
        updateNavButtonStates(sunId);
    }

    // Update nav button active states
    function updateNavButtonStates(activeSunId) {
        const buttons = document.querySelectorAll('.solar-nav-btn');
        buttons.forEach(btn => {
            if (btn.dataset.sun === activeSunId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Expose navigation function globally
    window.navigateToSolarSystem = navigateToSolarSystem;

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

    function updateTooltip(node, forceKeep = false) {
        if (node) {
            if (tooltipTarget !== node) {
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
    let gl, glCanvas, sphereProgram, sunProgram, debugQuadProgram, orbitLineProgram, glReady = false;
    let debugQuadBuffer;
    let showDebugQuads = false; // Toggle for debug quad overlay

    // Volumetric light background (rendered to FBO for planet fog sampling)
    let volumetricProgram = null;
    let volumetricQuadBuffer = null;
    let volumetricFBO = null;
    let volumetricTexture = null;
    let volumetricFBOWidth = 0, volumetricFBOHeight = 0;
    const volumetricResolutionScale = 0.5; // Render volumetric at half resolution for performance

    // Simple blit program (copies texture to screen)
    let blitProgram = null;

    // Final compositing FBO and post-process program (for edge fade)
    let finalFBO = null;
    let finalTexture = null;
    let finalFBOWidth = 0, finalFBOHeight = 0;
    let postProcessProgram = null;

    // Multi-pass bloom system
    const BLOOM_MIP_LEVELS = 5;  // Number of mip levels for bloom pyramid
    let bloomEnabled = true;
    let bloomThresholdProgram = null;
    let bloomBlurProgram = null;
    let bloomUpsampleProgram = null;
    let bloomCompositeProgram = null;
    let bloomFBOs = [];      // Array of {fbo, texture, width, height} for each mip level
    let bloomTempFBO = null; // Temp FBO for blur ping-pong
    let bloomTempTexture = null;
    let bloomCurrentWidth = 0, bloomCurrentHeight = 0;

    // HDR rendering configuration (set in initSphereGL)
    let hdrConfig = {
        supported: false,
        type: null,  // gl.UNSIGNED_BYTE, HALF_FLOAT_OES, or gl.FLOAT
        internalFormat: null,
        hasLinearFiltering: false
    };

    // Space particles system (static star field)
    let spaceParticleProgram = null;
    let spaceParticleBuffer = null;
    let spaceParticleCount = 25000;  // Current active star count
    let spaceParticleData = null;  // Float32Array for particle positions + star data

    // Space particle parameters (UI-controllable)
    const spaceParticleParams = {
        // Star count
        starCount: 97000,

        // Spawning distance from center (world units)
        startDistance: 4.1,
        endDistance: 71,

        // Appearance
        particleSize: 5,
        brightness: 0.5,

        // Star colors (hex)
        starColorCool: '#91f7f2',
        starColorWarm: '#fef3e1',
        starColorHot: '#febaa9'
    };

    // Reference volumetricParams from core.js (window.volumetricParams)

    // Lens ghost rendering (lens flare artifacts)
    let lensGhostProgram = null;
    let lensGhostQuadBuffer = null;

    // Initialize multi-pass bloom pipeline
    function initBloomPipeline(comp) {
        if (!window.BLOOM_THRESHOLD_FRAGMENT_SHADER) {
            console.log('Bloom shaders not found, skipping bloom initialization');
            return;
        }

        const blitVsSource = window.BLIT_VERTEX_SHADER;

        // Bloom threshold program
        const thresholdFs = comp(window.BLOOM_THRESHOLD_FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
        const thresholdVs = comp(blitVsSource, gl.VERTEX_SHADER);
        if (thresholdVs && thresholdFs) {
            bloomThresholdProgram = gl.createProgram();
            gl.attachShader(bloomThresholdProgram, thresholdVs);
            gl.attachShader(bloomThresholdProgram, thresholdFs);
            gl.linkProgram(bloomThresholdProgram);
            if (gl.getProgramParameter(bloomThresholdProgram, gl.LINK_STATUS)) {
                bloomThresholdProgram.aPosition = gl.getAttribLocation(bloomThresholdProgram, 'aPosition');
                bloomThresholdProgram.uTexture = gl.getUniformLocation(bloomThresholdProgram, 'uTexture');
                bloomThresholdProgram.uResolution = gl.getUniformLocation(bloomThresholdProgram, 'uResolution');
                bloomThresholdProgram.uThreshold = gl.getUniformLocation(bloomThresholdProgram, 'uThreshold');
                bloomThresholdProgram.uSoftKnee = gl.getUniformLocation(bloomThresholdProgram, 'uSoftKnee');
            } else {
                console.error('Bloom threshold program link error:', gl.getProgramInfoLog(bloomThresholdProgram));
                bloomThresholdProgram = null;
            }
        }

        // Bloom blur program (separable Gaussian)
        const blurFs = comp(window.BLOOM_BLUR_FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
        const blurVs = comp(blitVsSource, gl.VERTEX_SHADER);
        if (blurVs && blurFs) {
            bloomBlurProgram = gl.createProgram();
            gl.attachShader(bloomBlurProgram, blurVs);
            gl.attachShader(bloomBlurProgram, blurFs);
            gl.linkProgram(bloomBlurProgram);
            if (gl.getProgramParameter(bloomBlurProgram, gl.LINK_STATUS)) {
                bloomBlurProgram.aPosition = gl.getAttribLocation(bloomBlurProgram, 'aPosition');
                bloomBlurProgram.uTexture = gl.getUniformLocation(bloomBlurProgram, 'uTexture');
                bloomBlurProgram.uResolution = gl.getUniformLocation(bloomBlurProgram, 'uResolution');
                bloomBlurProgram.uDirection = gl.getUniformLocation(bloomBlurProgram, 'uDirection');
                bloomBlurProgram.uBloomRadius = gl.getUniformLocation(bloomBlurProgram, 'uBloomRadius');
                bloomBlurProgram.uAnamorphic = gl.getUniformLocation(bloomBlurProgram, 'uAnamorphic');
            } else {
                console.error('Bloom blur program link error:', gl.getProgramInfoLog(bloomBlurProgram));
                bloomBlurProgram = null;
            }
        }

        // Bloom upsample program
        const upsampleFs = comp(window.BLOOM_UPSAMPLE_FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
        const upsampleVs = comp(blitVsSource, gl.VERTEX_SHADER);
        if (upsampleVs && upsampleFs) {
            bloomUpsampleProgram = gl.createProgram();
            gl.attachShader(bloomUpsampleProgram, upsampleVs);
            gl.attachShader(bloomUpsampleProgram, upsampleFs);
            gl.linkProgram(bloomUpsampleProgram);
            if (gl.getProgramParameter(bloomUpsampleProgram, gl.LINK_STATUS)) {
                bloomUpsampleProgram.aPosition = gl.getAttribLocation(bloomUpsampleProgram, 'aPosition');
                bloomUpsampleProgram.uTexture = gl.getUniformLocation(bloomUpsampleProgram, 'uTexture');
                bloomUpsampleProgram.uHigherMip = gl.getUniformLocation(bloomUpsampleProgram, 'uHigherMip');
                bloomUpsampleProgram.uResolution = gl.getUniformLocation(bloomUpsampleProgram, 'uResolution');
                bloomUpsampleProgram.uBloomRadius = gl.getUniformLocation(bloomUpsampleProgram, 'uBloomRadius');
                bloomUpsampleProgram.uAnamorphic = gl.getUniformLocation(bloomUpsampleProgram, 'uAnamorphic');
            } else {
                console.error('Bloom upsample program link error:', gl.getProgramInfoLog(bloomUpsampleProgram));
                bloomUpsampleProgram = null;
            }
        }

        // Bloom composite program
        const compositeFs = comp(window.BLOOM_COMPOSITE_FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
        const compositeVs = comp(blitVsSource, gl.VERTEX_SHADER);
        if (compositeVs && compositeFs) {
            bloomCompositeProgram = gl.createProgram();
            gl.attachShader(bloomCompositeProgram, compositeVs);
            gl.attachShader(bloomCompositeProgram, compositeFs);
            gl.linkProgram(bloomCompositeProgram);
            if (gl.getProgramParameter(bloomCompositeProgram, gl.LINK_STATUS)) {
                bloomCompositeProgram.aPosition = gl.getAttribLocation(bloomCompositeProgram, 'aPosition');
                bloomCompositeProgram.uTexture = gl.getUniformLocation(bloomCompositeProgram, 'uTexture');
                bloomCompositeProgram.uBloomTexture = gl.getUniformLocation(bloomCompositeProgram, 'uBloomTexture');
                bloomCompositeProgram.uResolution = gl.getUniformLocation(bloomCompositeProgram, 'uResolution');
                bloomCompositeProgram.uBloomIntensity = gl.getUniformLocation(bloomCompositeProgram, 'uBloomIntensity');
                bloomCompositeProgram.uBloomTint = gl.getUniformLocation(bloomCompositeProgram, 'uBloomTint');
            } else {
                console.error('Bloom composite program link error:', gl.getProgramInfoLog(bloomCompositeProgram));
                bloomCompositeProgram = null;
            }
        }

        // Create bloom FBO mip chain (textures created/resized in render loop)
        for (let i = 0; i < BLOOM_MIP_LEVELS; i++) {
            const fbo = gl.createFramebuffer();
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            bloomFBOs.push({ fbo: fbo, texture: texture, width: 0, height: 0 });
        }

        // Temp FBO for blur ping-pong
        bloomTempFBO = gl.createFramebuffer();
        bloomTempTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, bloomTempTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        console.log('Multi-pass bloom pipeline initialized with ' + BLOOM_MIP_LEVELS + ' mip levels');
    }

    // Resize bloom FBOs to match current canvas size
    function resizeBloomFBOs(width, height) {
        if (!bloomFBOs.length || width <= 0 || height <= 0) return;
        if (bloomCurrentWidth === width && bloomCurrentHeight === height) return;

        bloomCurrentWidth = width;
        bloomCurrentHeight = height;

        let w = width;
        let h = height;

        for (let i = 0; i < BLOOM_MIP_LEVELS; i++) {
            // Each mip is half the size of the previous
            w = Math.max(1, Math.floor(w / 2));
            h = Math.max(1, Math.floor(h / 2));

            const mip = bloomFBOs[i];
            mip.width = w;
            mip.height = h;

            gl.bindTexture(gl.TEXTURE_2D, mip.texture);
            // Use HDR format for bloom FBOs to preserve bright values through blur
            var bloomTexType = hdrConfig.supported ? hdrConfig.type : gl.UNSIGNED_BYTE;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, bloomTexType, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, mip.fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mip.texture, 0);
        }

        // Resize temp FBO to largest mip size (first level)
        const largestMip = bloomFBOs[0];
        gl.bindTexture(gl.TEXTURE_2D, bloomTempTexture);
        var bloomTexType = hdrConfig.supported ? hdrConfig.type : gl.UNSIGNED_BYTE;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, largestMip.width, largestMip.height, 0, gl.RGBA, bloomTexType, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomTempFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bloomTempTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // Render multi-pass bloom
    function renderBloom(sourceTexture, canvasWidth, canvasHeight) {
        if (!bloomThresholdProgram || !bloomBlurProgram || !bloomUpsampleProgram || !bloomFBOs.length) {
            // Debug: log why bloom failed
            if (!window._bloomFailLog || Date.now() - window._bloomFailLog > 5000) {
                console.log('Bloom pipeline not ready:', {
                    threshold: !!bloomThresholdProgram,
                    blur: !!bloomBlurProgram,
                    upsample: !!bloomUpsampleProgram,
                    fbos: bloomFBOs.length
                });
                window._bloomFailLog = Date.now();
            }
            return null;
        }

        const pp = window.postProcessParams || {};
        const threshold = pp.bloomThreshold !== undefined ? pp.bloomThreshold : 0.8;
        const intensity = pp.bloomIntensity !== undefined ? pp.bloomIntensity : 0.5;
        const radius = pp.bloomRadius !== undefined ? pp.bloomRadius : 1.0;
        const softKnee = pp.bloomSoftKnee !== undefined ? pp.bloomSoftKnee : 0.5;
        const anamorphic = pp.bloomAnamorphic !== undefined ? pp.bloomAnamorphic : 0.7;

        // Skip if bloom is disabled
        if (intensity <= 0) return null;

        // Resize FBOs if needed
        resizeBloomFBOs(canvasWidth, canvasHeight);

        gl.disable(gl.BLEND);

        // ========================================
        // PASS 1: Threshold extraction -> mip[0]
        // ========================================
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomFBOs[0].fbo);
        gl.viewport(0, 0, bloomFBOs[0].width, bloomFBOs[0].height);

        gl.useProgram(bloomThresholdProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.uniform1i(bloomThresholdProgram.uTexture, 0);
        gl.uniform2f(bloomThresholdProgram.uResolution, bloomFBOs[0].width, bloomFBOs[0].height);
        gl.uniform1f(bloomThresholdProgram.uThreshold, threshold);
        gl.uniform1f(bloomThresholdProgram.uSoftKnee, softKnee);

        gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
        gl.enableVertexAttribArray(bloomThresholdProgram.aPosition);
        gl.vertexAttribPointer(bloomThresholdProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(bloomThresholdProgram.aPosition);

        // ========================================
        // PASS 2: Progressive downsampling with blur
        // ========================================
        // Determine texture type for temp FBO (used in both downsample and upsample)
        var tempTexType = hdrConfig.supported ? hdrConfig.type : gl.UNSIGNED_BYTE;

        for (let i = 0; i < BLOOM_MIP_LEVELS - 1; i++) {
            const srcMip = bloomFBOs[i];
            const dstMip = bloomFBOs[i + 1];

            // Horizontal blur: srcMip -> tempFBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, bloomTempFBO);
            // Resize temp to destination size for this level
            gl.bindTexture(gl.TEXTURE_2D, bloomTempTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, dstMip.width, dstMip.height, 0, gl.RGBA, tempTexType, null);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bloomTempTexture, 0);
            gl.viewport(0, 0, dstMip.width, dstMip.height);

            gl.useProgram(bloomBlurProgram);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, srcMip.texture);
            gl.uniform1i(bloomBlurProgram.uTexture, 0);
            gl.uniform2f(bloomBlurProgram.uResolution, dstMip.width, dstMip.height);
            gl.uniform1f(bloomBlurProgram.uBloomRadius, radius);
            gl.uniform1f(bloomBlurProgram.uAnamorphic, anamorphic);
            gl.uniform2f(bloomBlurProgram.uDirection, 1.0, 0.0);  // Horizontal

            gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
            gl.enableVertexAttribArray(bloomBlurProgram.aPosition);
            gl.vertexAttribPointer(bloomBlurProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(bloomBlurProgram.aPosition);

            // Vertical blur: tempFBO -> dstMip
            gl.bindFramebuffer(gl.FRAMEBUFFER, dstMip.fbo);
            gl.viewport(0, 0, dstMip.width, dstMip.height);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, bloomTempTexture);
            gl.uniform2f(bloomBlurProgram.uDirection, 0.0, 1.0);  // Vertical

            gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
            gl.enableVertexAttribArray(bloomBlurProgram.aPosition);
            gl.vertexAttribPointer(bloomBlurProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(bloomBlurProgram.aPosition);
        }

        // ========================================
        // PASS 3: Progressive upsampling with ping-pong
        // For each level, we need to blend upsampled lower mip with existing content
        // To avoid feedback loop: copy dstMip to temp first, then blend
        // ========================================
        for (let i = BLOOM_MIP_LEVELS - 1; i > 0; i--) {
            const srcMip = bloomFBOs[i];      // Lower res (to upsample)
            const dstMip = bloomFBOs[i - 1];  // Higher res (target, has content from downsample)

            // Step 1: Copy dstMip content to temp FBO (to avoid feedback)
            gl.bindTexture(gl.TEXTURE_2D, bloomTempTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, dstMip.width, dstMip.height, 0, gl.RGBA, tempTexType, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, bloomTempFBO);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bloomTempTexture, 0);
            gl.viewport(0, 0, dstMip.width, dstMip.height);

            // Simple blit copy using blur program with zero direction (just copies)
            gl.useProgram(bloomBlurProgram);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, dstMip.texture);
            gl.uniform1i(bloomBlurProgram.uTexture, 0);
            gl.uniform2f(bloomBlurProgram.uResolution, dstMip.width, dstMip.height);
            gl.uniform1f(bloomBlurProgram.uBloomRadius, 0.0);  // Zero radius = no blur = copy
            gl.uniform1f(bloomBlurProgram.uAnamorphic, 0.0);
            gl.uniform2f(bloomBlurProgram.uDirection, 0.0, 0.0);  // Zero direction = no offset

            gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
            gl.enableVertexAttribArray(bloomBlurProgram.aPosition);
            gl.vertexAttribPointer(bloomBlurProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(bloomBlurProgram.aPosition);

            // Step 2: Upsample srcMip and blend with temp copy, render to dstMip
            gl.bindFramebuffer(gl.FRAMEBUFFER, dstMip.fbo);
            gl.viewport(0, 0, dstMip.width, dstMip.height);

            gl.useProgram(bloomUpsampleProgram);

            // Texture unit 0: lower mip to upsample
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, srcMip.texture);
            gl.uniform1i(bloomUpsampleProgram.uTexture, 0);

            // Texture unit 1: copy of destination content (from temp)
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, bloomTempTexture);
            gl.uniform1i(bloomUpsampleProgram.uHigherMip, 1);

            gl.uniform2f(bloomUpsampleProgram.uResolution, dstMip.width, dstMip.height);
            gl.uniform1f(bloomUpsampleProgram.uBloomRadius, radius);
            gl.uniform1f(bloomUpsampleProgram.uAnamorphic, anamorphic);

            gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
            gl.enableVertexAttribArray(bloomUpsampleProgram.aPosition);
            gl.vertexAttribPointer(bloomUpsampleProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(bloomUpsampleProgram.aPosition);

            // Reset active texture to unit 0
            gl.activeTexture(gl.TEXTURE0);
        }

        gl.enable(gl.BLEND);

        // Return the final bloom texture (mip[0])
        return bloomFBOs[0].texture;
    }

    function initSphereGL() {
        // Use the gpu-canvas element from the HTML (inside canvas-section)
        glCanvas = document.getElementById('gpu-canvas');
        if (!glCanvas) {
            // Fallback: create canvas dynamically if gpu-canvas doesn't exist
            glCanvas = document.createElement('canvas');
            glCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
            container.insertBefore(glCanvas, container.firstChild);
        }

        gl = glCanvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
        if (!gl) return false;

        // Enable HDR rendering extensions
        var halfFloatExt = gl.getExtension('OES_texture_half_float');
        var halfFloatLinearExt = gl.getExtension('OES_texture_half_float_linear');
        var floatExt = gl.getExtension('OES_texture_float');
        var floatLinearExt = gl.getExtension('OES_texture_float_linear');
        var colorBufferHalfFloat = gl.getExtension('EXT_color_buffer_half_float');

        // Determine best available HDR format and update module-level hdrConfig
        hdrConfig.internalFormat = gl.RGBA;
        hdrConfig.type = gl.UNSIGNED_BYTE;

        if (halfFloatExt && colorBufferHalfFloat) {
            hdrConfig.supported = true;
            hdrConfig.type = halfFloatExt.HALF_FLOAT_OES;
            hdrConfig.hasLinearFiltering = !!halfFloatLinearExt;
            console.log('HDR rendering enabled (half-float)');
        } else if (floatExt) {
            // Full float as fallback (less compatible but works on some devices)
            hdrConfig.supported = true;
            hdrConfig.type = gl.FLOAT;
            hdrConfig.hasLinearFiltering = !!floatLinearExt;
            console.log('HDR rendering enabled (full-float)');
        } else {
            hdrConfig.supported = false;
            console.log('HDR rendering not supported, bloom will use LDR fallback');
        }

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
        sphereProgram.uMinDim = gl.getUniformLocation(sphereProgram, 'uMinDim');
        sphereProgram.uFBORes = gl.getUniformLocation(sphereProgram, 'uFBORes');
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
        sphereProgram.uCameraRotX = gl.getUniformLocation(sphereProgram, 'uCameraRotX');
        sphereProgram.uCameraRotY = gl.getUniformLocation(sphereProgram, 'uCameraRotY');
        sphereProgram.uCameraPos = gl.getUniformLocation(sphereProgram, 'uCameraPos');
        // Background texture for fog sampling
        sphereProgram.uBackgroundTexture = gl.getUniformLocation(sphereProgram, 'uBackgroundTexture');
        sphereProgram.uUseBackgroundTexture = gl.getUniformLocation(sphereProgram, 'uUseBackgroundTexture');

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
        sphereProgram.uSSSWrapA = gl.getUniformLocation(sphereProgram, 'uSSSWrapA');
        sphereProgram.uSSSBacklightA = gl.getUniformLocation(sphereProgram, 'uSSSBacklightA');
        sphereProgram.uSSSColorA = gl.getUniformLocation(sphereProgram, 'uSSSColorA');
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
        sunProgram.uMinDim = gl.getUniformLocation(sunProgram, 'uMinDim');
        sunProgram.uTime = gl.getUniformLocation(sunProgram, 'uTime');
        sunProgram.uCameraRotX = gl.getUniformLocation(sunProgram, 'uCameraRotX');
        sunProgram.uCameraRotY = gl.getUniformLocation(sunProgram, 'uCameraRotY');
        sunProgram.uCameraPos = gl.getUniformLocation(sunProgram, 'uCameraPos');

        // Sun parameter uniforms (simplified)
        sunProgram.uSunCoreSize = gl.getUniformLocation(sunProgram, 'uSunCoreSize');
        sunProgram.uSunGlowSize = gl.getUniformLocation(sunProgram, 'uSunGlowSize');
        sunProgram.uSunGlowIntensity = gl.getUniformLocation(sunProgram, 'uSunGlowIntensity');

        sunProgram.buf = gl.createBuffer();

        // Volumetric light program (renders to FBO, sampled by planets for fog)
        const volumetricVertexShader = window.VOLUMETRIC_LIGHT_VERTEX_SHADER || window.BACKGROUND_VERTEX_SHADER;
        const volumetricFragmentShader = window.VOLUMETRIC_LIGHT_FRAGMENT_SHADER;
        if (volumetricVertexShader && volumetricFragmentShader) {
            const nbVs = comp(volumetricVertexShader, gl.VERTEX_SHADER);
            const nbFs = comp(volumetricFragmentShader, gl.FRAGMENT_SHADER);
            if (nbVs && nbFs) {
                volumetricProgram = gl.createProgram();
                gl.attachShader(volumetricProgram, nbVs);
                gl.attachShader(volumetricProgram, nbFs);
                gl.linkProgram(volumetricProgram);

                if (gl.getProgramParameter(volumetricProgram, gl.LINK_STATUS)) {
                    volumetricProgram.aPosition = gl.getAttribLocation(volumetricProgram, 'aPosition');
                    volumetricProgram.uTime = gl.getUniformLocation(volumetricProgram, 'uTime');
                    volumetricProgram.uMouse = gl.getUniformLocation(volumetricProgram, 'uMouse');
                    volumetricProgram.uResolution = gl.getUniformLocation(volumetricProgram, 'uResolution');
                    volumetricProgram.uCameraRotX = gl.getUniformLocation(volumetricProgram, 'uCameraRotX');
                    volumetricProgram.uCameraRotY = gl.getUniformLocation(volumetricProgram, 'uCameraRotY');
                    // Light world positions (3D for perspective-correct falloff)
                    volumetricProgram.uLight0WorldPos = gl.getUniformLocation(volumetricProgram, 'uLight0WorldPos');
                    volumetricProgram.uLight1WorldPos = gl.getUniformLocation(volumetricProgram, 'uLight1WorldPos');
                    volumetricProgram.uLight2WorldPos = gl.getUniformLocation(volumetricProgram, 'uLight2WorldPos');
                    // Camera position (world space)
                    volumetricProgram.uCameraPos = gl.getUniformLocation(volumetricProgram, 'uCameraPos');
                    // Light colors
                    volumetricProgram.uLightColor0 = gl.getUniformLocation(volumetricProgram, 'uLightColor0');
                    volumetricProgram.uLightColor1 = gl.getUniformLocation(volumetricProgram, 'uLightColor1');
                    volumetricProgram.uLightColor2 = gl.getUniformLocation(volumetricProgram, 'uLightColor2');
                    volumetricProgram.uLight0Intensity = gl.getUniformLocation(volumetricProgram, 'uLight0Intensity');
                    volumetricProgram.uLight1Intensity = gl.getUniformLocation(volumetricProgram, 'uLight1Intensity');
                    volumetricProgram.uLight2Intensity = gl.getUniformLocation(volumetricProgram, 'uLight2Intensity');
                    // Screen-space light positions (camera-transformed)
                    volumetricProgram.uLight0Screen = gl.getUniformLocation(volumetricProgram, 'uLight0Screen');
                    volumetricProgram.uLight1Screen = gl.getUniformLocation(volumetricProgram, 'uLight1Screen');
                    volumetricProgram.uLight2Screen = gl.getUniformLocation(volumetricProgram, 'uLight2Screen');
                    // Light visibility (0.0 = behind camera, 1.0 = visible)
                    volumetricProgram.uLight0Visible = gl.getUniformLocation(volumetricProgram, 'uLight0Visible');
                    volumetricProgram.uLight1Visible = gl.getUniformLocation(volumetricProgram, 'uLight1Visible');
                    volumetricProgram.uLight2Visible = gl.getUniformLocation(volumetricProgram, 'uLight2Visible');
                    // Volumetric light parameters
                    volumetricProgram.uVolumetricIntensity = gl.getUniformLocation(volumetricProgram, 'uVolumetricIntensity');
                    volumetricProgram.uVolumetricFalloff = gl.getUniformLocation(volumetricProgram, 'uVolumetricFalloff');
                    volumetricProgram.uVolumetricScale = gl.getUniformLocation(volumetricProgram, 'uVolumetricScale');
                    volumetricProgram.uVolumetricSaturation = gl.getUniformLocation(volumetricProgram, 'uVolumetricSaturation');
                    volumetricProgram.uVolumetricNoiseScale = gl.getUniformLocation(volumetricProgram, 'uVolumetricNoiseScale');
                    volumetricProgram.uVolumetricNoiseStrength = gl.getUniformLocation(volumetricProgram, 'uVolumetricNoiseStrength');
                    volumetricProgram.uVolumetricNoiseOctaves = gl.getUniformLocation(volumetricProgram, 'uVolumetricNoiseOctaves');
                    volumetricProgram.uVolumetricScatterR = gl.getUniformLocation(volumetricProgram, 'uVolumetricScatterR');
                    volumetricProgram.uVolumetricScatterG = gl.getUniformLocation(volumetricProgram, 'uVolumetricScatterG');
                    volumetricProgram.uVolumetricScatterB = gl.getUniformLocation(volumetricProgram, 'uVolumetricScatterB');
                    volumetricProgram.uVignetteStrength = gl.getUniformLocation(volumetricProgram, 'uVignetteStrength');

                    // Fullscreen quad buffer for volumetric
                    volumetricQuadBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                        -1, -1,  1, -1,  1, 1,
                        -1, -1,  1, 1,  -1, 1
                    ]), gl.STATIC_DRAW);

                    // Create FBO for volumetric light (texture created/resized in render loop)
                    volumetricFBO = gl.createFramebuffer();
                    volumetricTexture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, volumetricTexture);
                    // Use LINEAR filtering for smooth upscaling from reduced resolution
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    // Don't allocate texture or attach to FBO yet - done in render loop when size is known
                    volumetricFBOWidth = 0;
                    volumetricFBOHeight = 0;

                    // Create simple blit program to copy FBO texture to screen
                    const blitVsSource = window.BLIT_VERTEX_SHADER;
                    const blitFsSource = window.BLIT_FRAGMENT_SHADER;
                    const blitVs = comp(blitVsSource, gl.VERTEX_SHADER);
                    const blitFs = comp(blitFsSource, gl.FRAGMENT_SHADER);
                    if (blitVs && blitFs) {
                        blitProgram = gl.createProgram();
                        gl.attachShader(blitProgram, blitVs);
                        gl.attachShader(blitProgram, blitFs);
                        gl.linkProgram(blitProgram);
                        if (gl.getProgramParameter(blitProgram, gl.LINK_STATUS)) {
                            blitProgram.aPosition = gl.getAttribLocation(blitProgram, 'aPosition');
                            blitProgram.uTexture = gl.getUniformLocation(blitProgram, 'uTexture');
                            blitProgram.uResolution = gl.getUniformLocation(blitProgram, 'uResolution');
                        }
                    }

                    // Create post-process program with comprehensive effects
                    const postProcessFsSource = window.POST_PROCESS_FRAGMENT_SHADER || window.EDGE_FADE_FRAGMENT_SHADER;
                    const postProcessVs = comp(blitVsSource, gl.VERTEX_SHADER);
                    const postProcessFs = comp(postProcessFsSource, gl.FRAGMENT_SHADER);
                    if (postProcessVs && postProcessFs) {
                        postProcessProgram = gl.createProgram();
                        gl.attachShader(postProcessProgram, postProcessVs);
                        gl.attachShader(postProcessProgram, postProcessFs);
                        gl.linkProgram(postProcessProgram);
                        if (gl.getProgramParameter(postProcessProgram, gl.LINK_STATUS)) {
                            postProcessProgram.aPosition = gl.getAttribLocation(postProcessProgram, 'aPosition');
                            postProcessProgram.uTexture = gl.getUniformLocation(postProcessProgram, 'uTexture');
                            postProcessProgram.uResolution = gl.getUniformLocation(postProcessProgram, 'uResolution');
                            postProcessProgram.uTime = gl.getUniformLocation(postProcessProgram, 'uTime');
                            // Edge fade
                            postProcessProgram.uEdgeFadeSize = gl.getUniformLocation(postProcessProgram, 'uEdgeFadeSize');
                            postProcessProgram.uEdgeFadePower = gl.getUniformLocation(postProcessProgram, 'uEdgeFadePower');
                            // Vignette
                            postProcessProgram.uVignetteIntensity = gl.getUniformLocation(postProcessProgram, 'uVignetteIntensity');
                            postProcessProgram.uVignetteRadius = gl.getUniformLocation(postProcessProgram, 'uVignetteRadius');
                            postProcessProgram.uVignetteSoftness = gl.getUniformLocation(postProcessProgram, 'uVignetteSoftness');
                            // Color grading
                            postProcessProgram.uBrightness = gl.getUniformLocation(postProcessProgram, 'uBrightness');
                            postProcessProgram.uContrast = gl.getUniformLocation(postProcessProgram, 'uContrast');
                            postProcessProgram.uSaturation = gl.getUniformLocation(postProcessProgram, 'uSaturation');
                            postProcessProgram.uGamma = gl.getUniformLocation(postProcessProgram, 'uGamma');
                            // Color balance
                            postProcessProgram.uShadowsTint = gl.getUniformLocation(postProcessProgram, 'uShadowsTint');
                            postProcessProgram.uHighlightsTint = gl.getUniformLocation(postProcessProgram, 'uHighlightsTint');
                            // Chromatic aberration
                            postProcessProgram.uChromaticAberration = gl.getUniformLocation(postProcessProgram, 'uChromaticAberration');
                            postProcessProgram.uChromaticOffset = gl.getUniformLocation(postProcessProgram, 'uChromaticOffset');
                            // Film grain
                            postProcessProgram.uGrainIntensity = gl.getUniformLocation(postProcessProgram, 'uGrainIntensity');
                            postProcessProgram.uGrainSize = gl.getUniformLocation(postProcessProgram, 'uGrainSize');
                            // Bloom (multi-pass)
                            postProcessProgram.uBloomThreshold = gl.getUniformLocation(postProcessProgram, 'uBloomThreshold');
                            postProcessProgram.uBloomIntensity = gl.getUniformLocation(postProcessProgram, 'uBloomIntensity');
                            postProcessProgram.uBloomRadius = gl.getUniformLocation(postProcessProgram, 'uBloomRadius');
                            postProcessProgram.uBloomTexture = gl.getUniformLocation(postProcessProgram, 'uBloomTexture');
                            postProcessProgram.uBloomEnabled = gl.getUniformLocation(postProcessProgram, 'uBloomEnabled');
                            postProcessProgram.uBloomTint = gl.getUniformLocation(postProcessProgram, 'uBloomTint');
                            // Sharpen
                            postProcessProgram.uSharpenIntensity = gl.getUniformLocation(postProcessProgram, 'uSharpenIntensity');
                            // Tone mapping
                            postProcessProgram.uExposure = gl.getUniformLocation(postProcessProgram, 'uExposure');
                            postProcessProgram.uToneMapping = gl.getUniformLocation(postProcessProgram, 'uToneMapping');
                        }
                    }

                    // Create final compositing FBO
                    finalFBO = gl.createFramebuffer();
                    finalTexture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, finalTexture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    // ========================================
                    // MULTI-PASS BLOOM INITIALIZATION
                    // ========================================
                    initBloomPipeline(comp);

                    console.log('Volumetric light program initialized with FBO');
                } else {
                    console.error('Volumetric program link error:', gl.getProgramInfoLog(volumetricProgram));
                    volumetricProgram = null;
                }
            }
        }

        // Debug quad program
        const debugQuadVertexShader = window.DEBUG_QUAD_VERTEX_SHADER;
        const debugQuadFragmentShader = window.DEBUG_QUAD_FRAGMENT_SHADER;
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
                    debugQuadProgram.uCameraRotX = gl.getUniformLocation(debugQuadProgram, 'uCameraRotX');
                    debugQuadProgram.uCameraRotY = gl.getUniformLocation(debugQuadProgram, 'uCameraRotY');
                    debugQuadProgram.uCameraPos = gl.getUniformLocation(debugQuadProgram, 'uCameraPos');
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

        // Orbit line program - anti-aliased 2D lines rendered as quads
        const orbitLineVsSource = window.ORBIT_LINE_VERTEX_SHADER;
        const orbitLineFsSource = window.ORBIT_LINE_FRAGMENT_SHADER;
        const olVs = comp(orbitLineVsSource, gl.VERTEX_SHADER);
        const olFs = comp(orbitLineFsSource, gl.FRAGMENT_SHADER);
        if (olVs && olFs) {
            orbitLineProgram = gl.createProgram();
            gl.attachShader(orbitLineProgram, olVs);
            gl.attachShader(orbitLineProgram, olFs);
            gl.linkProgram(orbitLineProgram);

            if (gl.getProgramParameter(orbitLineProgram, gl.LINK_STATUS)) {
                // Vertex attributes for AA line quads
                orbitLineProgram.aPosition = gl.getAttribLocation(orbitLineProgram, 'aPosition');
                orbitLineProgram.aDirection = gl.getAttribLocation(orbitLineProgram, 'aDirection');
                orbitLineProgram.aSide = gl.getAttribLocation(orbitLineProgram, 'aSide');
                // Uniforms
                orbitLineProgram.uResolution = gl.getUniformLocation(orbitLineProgram, 'uResolution');
                orbitLineProgram.uColor = gl.getUniformLocation(orbitLineProgram, 'uColor');
                orbitLineProgram.uLineWidth = gl.getUniformLocation(orbitLineProgram, 'uLineWidth');
                orbitLineProgram.buf = gl.createBuffer();
                console.log('Orbit line program initialized (AA quads)');
            } else {
                console.error('Orbit line program link error:', gl.getProgramInfoLog(orbitLineProgram));
                orbitLineProgram = null;
            }
        }

        // Lens ghost program (lens flare artifacts)
        const lgVsSource = window.LENS_GHOST_VERTEX_SHADER;
        const lgFsSource = window.LENS_GHOST_FRAGMENT_SHADER;
        if (lgVsSource && lgFsSource) {
            const lgVs = comp(lgVsSource, gl.VERTEX_SHADER);
            const lgFs = comp(lgFsSource, gl.FRAGMENT_SHADER);
            if (lgVs && lgFs) {
                lensGhostProgram = gl.createProgram();
                gl.attachShader(lensGhostProgram, lgVs);
                gl.attachShader(lensGhostProgram, lgFs);
                gl.linkProgram(lensGhostProgram);

                if (gl.getProgramParameter(lensGhostProgram, gl.LINK_STATUS)) {
                    lensGhostProgram.aPosition = gl.getAttribLocation(lensGhostProgram, 'aPosition');
                    lensGhostProgram.uResolution = gl.getUniformLocation(lensGhostProgram, 'uResolution');
                    lensGhostProgram.uGhostPos = gl.getUniformLocation(lensGhostProgram, 'uGhostPos');
                    lensGhostProgram.uGhostSize = gl.getUniformLocation(lensGhostProgram, 'uGhostSize');
                    lensGhostProgram.uGhostColor = gl.getUniformLocation(lensGhostProgram, 'uGhostColor');
                    lensGhostProgram.uGhostIntensity = gl.getUniformLocation(lensGhostProgram, 'uGhostIntensity');
                    lensGhostProgram.uGhostFalloff = gl.getUniformLocation(lensGhostProgram, 'uGhostFalloff');
                    lensGhostProgram.uChromaticShift = gl.getUniformLocation(lensGhostProgram, 'uChromaticShift');
                    lensGhostProgram.uRoundness = gl.getUniformLocation(lensGhostProgram, 'uRoundness');
                    lensGhostProgram.uBladeCount = gl.getUniformLocation(lensGhostProgram, 'uBladeCount');
                    lensGhostProgram.uRotation = gl.getUniformLocation(lensGhostProgram, 'uRotation');
                    lensGhostProgram.uAnamorphic = gl.getUniformLocation(lensGhostProgram, 'uAnamorphic');
                    lensGhostProgram.uTint = gl.getUniformLocation(lensGhostProgram, 'uTint');

                    // Quad buffer (unit quad from -1 to 1)
                    lensGhostQuadBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, lensGhostQuadBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                        -1, -1,  1, -1,  1, 1,
                        -1, -1,  1, 1,  -1, 1
                    ]), gl.STATIC_DRAW);

                    console.log('Lens ghost program initialized');
                } else {
                    console.error('Lens ghost program link error:', gl.getProgramInfoLog(lensGhostProgram));
                    lensGhostProgram = null;
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
                // Vertex attributes
                spaceParticleProgram.aPosition = gl.getAttribLocation(spaceParticleProgram, 'aPosition');
                spaceParticleProgram.aStarData = gl.getAttribLocation(spaceParticleProgram, 'aStarData');

                // Common uniforms
                spaceParticleProgram.uResolution = gl.getUniformLocation(spaceParticleProgram, 'uResolution');
                spaceParticleProgram.uTime = gl.getUniformLocation(spaceParticleProgram, 'uTime');

                // Particle appearance uniforms
                spaceParticleProgram.uParticleSize = gl.getUniformLocation(spaceParticleProgram, 'uParticleSize');
                spaceParticleProgram.uBrightness = gl.getUniformLocation(spaceParticleProgram, 'uBrightness');

                // Camera uniforms
                spaceParticleProgram.uCameraRotX = gl.getUniformLocation(spaceParticleProgram, 'uCameraRotX');
                spaceParticleProgram.uCameraRotY = gl.getUniformLocation(spaceParticleProgram, 'uCameraRotY');
                spaceParticleProgram.uCameraPos = gl.getUniformLocation(spaceParticleProgram, 'uCameraPos');

                // Star color uniforms
                spaceParticleProgram.uStarColorCool = gl.getUniformLocation(spaceParticleProgram, 'uStarColorCool');
                spaceParticleProgram.uStarColorWarm = gl.getUniformLocation(spaceParticleProgram, 'uStarColorWarm');
                spaceParticleProgram.uStarColorHot = gl.getUniformLocation(spaceParticleProgram, 'uStarColorHot');

                // Initialize particle data: x, y, z (world space), brightness, colorVariation
                // Stars spawn in a spherical shell around the origin (center of world)
                spaceParticleCount = spaceParticleParams.starCount;
                const startDist = spaceParticleParams.startDistance;
                const endDist = spaceParticleParams.endDistance;

                // 5 floats per particle: x, y, z, brightness, colorVar
                spaceParticleData = new Float32Array(spaceParticleCount * 5);
                for (let i = 0; i < spaceParticleCount; i++) {
                    const idx = i * 5;

                    // Random direction (uniform on sphere)
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const x = Math.sin(phi) * Math.cos(theta);
                    const y = Math.sin(phi) * Math.sin(theta);
                    const z = Math.cos(phi);

                    // Random distance between startDistance and endDistance
                    const dist = startDist + Math.random() * (endDist - startDist);

                    spaceParticleData[idx] = x * dist;      // x (world units)
                    spaceParticleData[idx + 1] = y * dist;  // y (world units)
                    spaceParticleData[idx + 2] = z * dist;  // z (world units)

                    // Star brightness (exponential distribution for realistic star field)
                    // Most stars are dim, few are bright
                    const brightnessRand = Math.random();
                    spaceParticleData[idx + 3] = 0.1 + Math.pow(brightnessRand, 3) * 0.9;

                    // Color variation (0-1, determines warm/cool/hot)
                    spaceParticleData[idx + 4] = Math.random();
                }

                spaceParticleBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, spaceParticleData, gl.STATIC_DRAW);

                console.log('Space particles initialized: ' + spaceParticleCount + ' static stars');
            } else {
                console.error('Space particle program link error:', gl.getProgramInfoLog(spaceParticleProgram));
                spaceParticleProgram = null;
            }
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        // Add mouse event handlers to glCanvas for camera rotation
        glCanvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            isOrbiting = true;
            orbitStartX = e.clientX;
            orbitStartY = e.clientY;
            orbitStartRotX = targetCameraRotX;
            orbitStartRotY = targetCameraRotY;
            glCanvas.style.cursor = 'grabbing';
        });

        glCanvas.addEventListener('mousemove', (e) => {
            if (!isOrbiting) return;
            const deltaX = e.clientX - orbitStartX;
            const deltaY = e.clientY - orbitStartY;
            const sensitivity = window.cameraParams ? window.cameraParams.rotationSpeed : 0.005;
            targetCameraRotY = orbitStartRotY + deltaX * sensitivity;
            targetCameraRotX = orbitStartRotX + deltaY * sensitivity;
            targetCameraRotX = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, targetCameraRotX));
        });

        glCanvas.addEventListener('mouseup', () => {
            if (isOrbiting) {
                isOrbiting = false;
                glCanvas.style.cursor = 'grab';
            }
        });

        glCanvas.addEventListener('mouseleave', () => {
            if (isOrbiting) {
                isOrbiting = false;
                glCanvas.style.cursor = 'grab';
            }
        });

        // Touch support for camera rotation on mobile
        var touchStartX = 0, touchStartY = 0;
        var touchStartRotX = 0, touchStartRotY = 0;
        var isTouchOrbiting = false;

        glCanvas.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                e.preventDefault();
                isTouchOrbiting = true;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartRotX = targetCameraRotX;
                touchStartRotY = targetCameraRotY;
            }
        }, { passive: false });

        glCanvas.addEventListener('touchmove', function(e) {
            if (!isTouchOrbiting || e.touches.length !== 1) return;
            e.preventDefault();
            var deltaX = e.touches[0].clientX - touchStartX;
            var deltaY = e.touches[0].clientY - touchStartY;
            var sensitivity = window.cameraParams ? window.cameraParams.rotationSpeed : 0.005;
            targetCameraRotY = touchStartRotY + deltaX * sensitivity;
            targetCameraRotX = touchStartRotX + deltaY * sensitivity;
            targetCameraRotX = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, targetCameraRotX));
        }, { passive: false });

        glCanvas.addEventListener('touchend', function() {
            isTouchOrbiting = false;
        });

        glCanvas.addEventListener('touchcancel', function() {
            isTouchOrbiting = false;
        });

        glReady = true;

        // Hide the loading indicator now that shaders are compiled
        var loader = document.getElementById('canvas-loader');
        if (loader) {
            loader.classList.add('hidden');
            // Remove from DOM after fade animation
            setTimeout(function() {
                if (loader.parentNode) {
                    loader.style.display = 'none';
                }
            }, 500);
        }

        return true;
    }

    function resizeSphereGL() {
        if (!glReady || !glCanvas) return;
        // Get dimensions from the canvas's parent (canvas-section) for proper sizing
        const canvasSection = glCanvas.parentElement;
        if (canvasSection) {
            const rect = canvasSection.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            glCanvas.width = rect.width * dpr;
            glCanvas.height = rect.height * dpr;
        } else {
            glCanvas.width = width * (window.devicePixelRatio || 1);
            glCanvas.height = height * (window.devicePixelRatio || 1);
        }
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    }

    function hex2vec(h) {
        if (!h || typeof h !== 'string') return [1, 1, 1]; // Default to white if invalid
        return [parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255];
    }

    function renderSpheresGL(nodes, hovered, connected) {
        if (!glReady) return false;

        // Early exit if all WebGL features are disabled
        const toggles = window.renderToggles;
        if (toggles && !toggles.planets && !toggles.suns && !toggles.spaceParticles && !toggles.volumetric) {
            return true; // Return true so canvas fallback isn't used
        }

        gl.clear(gl.COLOR_BUFFER_BIT);

        // Get light data first (needed for volumetric light and spheres)
        const lightNodes = nodes.filter(n => n.isLight);
        const light0 = lightNodes[0] || { x: 0, y: 0, lightColor: '#ffaa33' };
        const light1 = lightNodes[1] || { x: 0, y: 0, lightColor: '#9b4dca' };
        const light2 = lightNodes[2] || { x: 0, y: 0, lightColor: '#33ddff' };
        const lc0 = hex2vec(light0.lightColor || '#ffaa33');
        const lc1 = hex2vec(light1.lightColor || '#9b4dca');
        const lc2 = hex2vec(light2.lightColor || '#33ddff');

        // Compute screen-space light positions (camera-transformed) for volumetric light
        // Use WebGL canvas dimensions (CSS pixels, not device pixels)
        const glWidth = glCanvas ? (glCanvas.width / (window.devicePixelRatio || 1)) : width;
        const glHeight = glCanvas ? (glCanvas.height / (window.devicePixelRatio || 1)) : height;
        const computeLightScreenPosFromWorld = (lightNode) => {
            // Use world coordinates if available, otherwise fall back to screen conversion
            const wx = lightNode.worldX !== undefined ? lightNode.worldX : 0;
            const wy = lightNode.worldY !== undefined ? lightNode.worldY : 0;
            const wz = lightNode.worldZ !== undefined ? lightNode.worldZ : 0;

            const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
            const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
            const cpx = cameraPosX, cpy = cameraPosY, cpz = cameraPosZ;
            const fx = sry * crx, fy = -srx, fz = cry * crx;
            const rx = cry, rz = -sry;
            const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
            const scx = glWidth * 0.5;
            const scy = glHeight * 0.5;

            // Vector from camera to light
            const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
            const zd = tx * fx + ty * fy + tz * fz;

            // Track visibility - smooth fade when behind camera
            const visible = zd >= 0.01 ? 1.0 : Math.max(0.0, zd / 0.01);

            // If light is behind or very close to camera, clamp to screen edge
            // This prevents wild off-screen projections during navigation
            if (zd < 0.1) {
                // Project at a minimum distance to keep on/near screen
                const ps = 1.0 / 0.1;
                const px = (tx * rx + tz * rz) * ps;
                const py = (tx * ux + ty * uy + tz * uz) * ps;

                // Clamp to screen bounds with margin
                const margin = Math.min(glWidth, glHeight) * 0.4;
                const clampedX = Math.max(-margin, Math.min(glWidth + margin, scx + px * glWidth));
                const clampedY = Math.max(-margin, Math.min(glHeight + margin, scy - py * glHeight));

                return { x: clampedX, y: clampedY, visible: visible };
            }

            // Normal projection for lights in front of camera
            const ps = 1.0 / zd;
            const px = (tx * rx + tz * rz) * ps;
            const py = (tx * ux + ty * uy + tz * uz) * ps;

            return {
                x: scx + px * glWidth,
                y: scy - py * glHeight,
                visible: visible
            };
        };
        const targetLight0 = computeLightScreenPosFromWorld(light0);
        const targetLight1 = computeLightScreenPosFromWorld(light1);
        const targetLight2 = computeLightScreenPosFromWorld(light2);

        // Update globalLights with camera-transformed screen positions (for lens ghosts)
        // These use actual world coordinates and proper camera projection
        window.globalLights.light0.screenX = targetLight0.x;
        window.globalLights.light0.screenY = targetLight0.y;
        window.globalLights.light1.screenX = targetLight1.x;
        window.globalLights.light1.screenY = targetLight1.y;
        window.globalLights.light2.screenX = targetLight2.x;
        window.globalLights.light2.screenY = targetLight2.y;

        // Debug: verify screen positions are set
        if (!window._screenPosDebugLogged) {
            window._screenPosDebugLogged = true;
            console.log('Screen positions set:', {
                local: { x: targetLight0.x, y: targetLight0.y },
                globalAfterAssign: { x: window.globalLights.light0.screenX, y: window.globalLights.light0.screenY },
                glWidth, glHeight
            });
        }

        // Check if light positions are valid (worldX/Y/Z have been set by simulate())
        // This prevents the first-frame flash when lights are at (0,0,0) before initialization
        const lightsInitialized = light0.worldX !== undefined &&
                                   light1.worldX !== undefined &&
                                   light2.worldX !== undefined;

        // ========================================
        // RENDER VOLUMETRIC LIGHT TO FBO
        // ========================================
        const volumetricEnabled = !window.renderToggles || window.renderToggles.volumetric !== false;
        // Use actual canvas pixel dimensions (with DPR) for full resolution
        const canvasWidth = glCanvas.width;
        const canvasHeight = glCanvas.height;
        // Volumetric FBO uses reduced resolution for performance
        const fboWidth = Math.floor(canvasWidth * volumetricResolutionScale);
        const fboHeight = Math.floor(canvasHeight * volumetricResolutionScale);

        // Resize final FBO if needed (always, even when volumetric disabled)
        // Use HDR format if supported for proper bloom extraction
        if (finalFBO && finalTexture && canvasWidth > 0 && canvasHeight > 0) {
            if (finalFBOWidth !== canvasWidth || finalFBOHeight !== canvasHeight) {
                finalFBOWidth = canvasWidth;
                finalFBOHeight = canvasHeight;
                gl.bindTexture(gl.TEXTURE_2D, finalTexture);
                // Use HDR format if available, otherwise fall back to UNSIGNED_BYTE
                var texType = hdrConfig.supported ? hdrConfig.type : gl.UNSIGNED_BYTE;
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasWidth, canvasHeight, 0, gl.RGBA, texType, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, finalFBO);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, finalTexture, 0);

                // Verify FBO is complete (HDR may fail on some devices)
                var fboStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (fboStatus !== gl.FRAMEBUFFER_COMPLETE && hdrConfig.supported) {
                    console.warn('HDR FBO incomplete, falling back to LDR');
                    hdrConfig.supported = false;
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasWidth, canvasHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                }
            }
            // Start rendering to final FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, finalFBO);
            gl.viewport(0, 0, canvasWidth, canvasHeight);
            // Clear with background color
            gl.clearColor(0.039, 0.059, 0.078, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        // Skip if canvas has no valid size yet, or if lights aren't initialized yet
        if (volumetricEnabled && volumetricProgram && volumetricFBO && fboWidth > 0 && fboHeight > 0 && lightsInitialized) {
            // Resize FBO if needed (use scaled resolution)
            if (volumetricFBOWidth !== fboWidth || volumetricFBOHeight !== fboHeight) {
                volumetricFBOWidth = fboWidth;
                volumetricFBOHeight = fboHeight;
                // Allocate texture with scaled size
                gl.bindTexture(gl.TEXTURE_2D, volumetricTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fboWidth, fboHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                // Attach texture to FBO
                gl.bindFramebuffer(gl.FRAMEBUFFER, volumetricFBO);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, volumetricTexture, 0);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            // Render to FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, volumetricFBO);
            gl.viewport(0, 0, fboWidth, fboHeight);
            gl.disable(gl.BLEND);  // Disable blend so we get raw RGB values, not premultiplied
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(volumetricProgram);
            gl.uniform1f(volumetricProgram.uTime, time);
            gl.uniform2f(volumetricProgram.uMouse, mouseScreenX / width, 1.0 - mouseScreenY / height);
            gl.uniform2f(volumetricProgram.uResolution, fboWidth, fboHeight);
            gl.uniform1f(volumetricProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(volumetricProgram.uCameraRotY, cameraRotY);
            // Light world positions (3D for perspective-correct falloff)
            // Use actual world coordinates directly (set by simulate())
            gl.uniform3f(volumetricProgram.uLight0WorldPos, light0.worldX, light0.worldY, light0.worldZ || 0);
            gl.uniform3f(volumetricProgram.uLight1WorldPos, light1.worldX, light1.worldY, light1.worldZ || 0);
            gl.uniform3f(volumetricProgram.uLight2WorldPos, light2.worldX, light2.worldY, light2.worldZ || 0);
            // Camera position (world space)
            gl.uniform3f(volumetricProgram.uCameraPos, cameraPosX, cameraPosY, cameraPosZ);
            gl.uniform3f(volumetricProgram.uLightColor0, lc0[0], lc0[1], lc0[2]);
            gl.uniform3f(volumetricProgram.uLightColor1, lc1[0], lc1[1], lc1[2]);
            gl.uniform3f(volumetricProgram.uLightColor2, lc2[0], lc2[1], lc2[2]);
            // Use full intensity - smoothing handles transitions
            gl.uniform1f(volumetricProgram.uLight0Intensity, lightParams.light0Intensity);
            gl.uniform1f(volumetricProgram.uLight1Intensity, lightParams.light1Intensity);
            gl.uniform1f(volumetricProgram.uLight2Intensity, lightParams.light2Intensity);
            // Screen-space light positions (for god rays)
            // Use target (current frame) positions directly - no smoothing delay
            // Multiply by DPR and resolution scale to convert to FBO pixel coordinates
            const dpr = window.devicePixelRatio || 1;
            const lightScale = dpr * volumetricResolutionScale;
            gl.uniform2f(volumetricProgram.uLight0Screen, targetLight0.x * lightScale, targetLight0.y * lightScale);
            gl.uniform2f(volumetricProgram.uLight1Screen, targetLight1.x * lightScale, targetLight1.y * lightScale);
            gl.uniform2f(volumetricProgram.uLight2Screen, targetLight2.x * lightScale, targetLight2.y * lightScale);
            // Light visibility (from current frame, computed based on camera z-depth)
            gl.uniform1f(volumetricProgram.uLight0Visible, targetLight0.visible !== undefined ? targetLight0.visible : 1.0);
            gl.uniform1f(volumetricProgram.uLight1Visible, targetLight1.visible !== undefined ? targetLight1.visible : 1.0);
            gl.uniform1f(volumetricProgram.uLight2Visible, targetLight2.visible !== undefined ? targetLight2.visible : 1.0);
            // Volumetric light parameters
            const vp = window.volumetricParams || {};
            gl.uniform1f(volumetricProgram.uVolumetricIntensity, vp.intensity !== undefined ? vp.intensity : 1.2);
            gl.uniform1f(volumetricProgram.uVolumetricFalloff, vp.falloff !== undefined ? vp.falloff : 2.0);
            gl.uniform1f(volumetricProgram.uVolumetricScale, vp.scale !== undefined ? vp.scale : 3.0);
            gl.uniform1f(volumetricProgram.uVolumetricSaturation, vp.saturation !== undefined ? vp.saturation : 1.8);
            gl.uniform1f(volumetricProgram.uVolumetricNoiseScale, vp.noiseScale !== undefined ? vp.noiseScale : 4.0);
            gl.uniform1f(volumetricProgram.uVolumetricNoiseStrength, vp.noiseStrength !== undefined ? vp.noiseStrength : 0.12);
            gl.uniform1f(volumetricProgram.uVolumetricNoiseOctaves, vp.noiseOctaves !== undefined ? vp.noiseOctaves : 0.5);
            gl.uniform1f(volumetricProgram.uVolumetricScatterR, vp.scatterR !== undefined ? vp.scatterR : 0.3);
            gl.uniform1f(volumetricProgram.uVolumetricScatterG, vp.scatterG !== undefined ? vp.scatterG : 0.6);
            gl.uniform1f(volumetricProgram.uVolumetricScatterB, vp.scatterB !== undefined ? vp.scatterB : 1.0);
            gl.uniform1f(volumetricProgram.uVignetteStrength, vp.vignetteStrength !== undefined ? vp.vignetteStrength : 0.91);

            // Draw fullscreen quad
            gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
            gl.enableVertexAttribArray(volumetricProgram.aPosition);
            gl.vertexAttribPointer(volumetricProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(volumetricProgram.aPosition);

            // Switch back to final FBO at full resolution
            gl.bindFramebuffer(gl.FRAMEBUFFER, finalFBO);
            gl.viewport(0, 0, canvasWidth, canvasHeight);

            // Blit volumetric FBO texture to final FBO (upscaled from reduced resolution)
            gl.useProgram(blitProgram);
            gl.uniform2f(blitProgram.uResolution, canvasWidth, canvasHeight);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, volumetricTexture);
            gl.uniform1i(blitProgram.uTexture, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
            gl.enableVertexAttribArray(blitProgram.aPosition);
            gl.vertexAttribPointer(blitProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(blitProgram.aPosition);
            gl.enable(gl.BLEND);
        }

        // Export light data globally (legacy, for any remaining external uses)
        // Update individual properties instead of replacing object to preserve screenX/screenY
        window.globalLights.light0.x = light0.x;
        window.globalLights.light0.y = light0.y;
        window.globalLights.light0.color = lc0;
        window.globalLights.light0.intensity = lightParams.light0Intensity;
        window.globalLights.light1.x = light1.x;
        window.globalLights.light1.y = light1.y;
        window.globalLights.light1.color = lc1;
        window.globalLights.light1.intensity = lightParams.light1Intensity;
        window.globalLights.light2.x = light2.x;
        window.globalLights.light2.y = light2.y;
        window.globalLights.light2.color = lc2;
        window.globalLights.light2.intensity = lightParams.light2Intensity;
        window.globalLights.resolution = { width: width, height: height };

        // Helper function to render static star particles
        function renderParticles() {
            if (!spaceParticleProgram || !spaceParticleData) return;

            gl.useProgram(spaceParticleProgram);
            gl.uniform2f(spaceParticleProgram.uResolution, width, height);
            gl.uniform1f(spaceParticleProgram.uTime, time);

            // Particle appearance uniforms
            gl.uniform1f(spaceParticleProgram.uParticleSize, spaceParticleParams.particleSize);
            gl.uniform1f(spaceParticleProgram.uBrightness, spaceParticleParams.brightness);

            // Camera uniforms
            gl.uniform1f(spaceParticleProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(spaceParticleProgram.uCameraRotY, cameraRotY);
            gl.uniform3f(spaceParticleProgram.uCameraPos, cameraPosX, cameraPosY, cameraPosZ);

            // Star color uniforms
            const coolRGB = hex2vec(spaceParticleParams.starColorCool);
            const warmRGB = hex2vec(spaceParticleParams.starColorWarm);
            const hotRGB = hex2vec(spaceParticleParams.starColorHot);
            gl.uniform3f(spaceParticleProgram.uStarColorCool, coolRGB[0], coolRGB[1], coolRGB[2]);
            gl.uniform3f(spaceParticleProgram.uStarColorWarm, warmRGB[0], warmRGB[1], warmRGB[2]);
            gl.uniform3f(spaceParticleProgram.uStarColorHot, hotRGB[0], hotRGB[1], hotRGB[2]);

            // Use additive blending for glowing stars
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            // Bind buffer and set up attributes (5 floats per particle: x, y, z, brightness, colorVar)
            gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
            gl.enableVertexAttribArray(spaceParticleProgram.aPosition);
            gl.vertexAttribPointer(spaceParticleProgram.aPosition, 3, gl.FLOAT, false, 20, 0);
            gl.enableVertexAttribArray(spaceParticleProgram.aStarData);
            gl.vertexAttribPointer(spaceParticleProgram.aStarData, 2, gl.FLOAT, false, 20, 12);

            gl.drawArrays(gl.POINTS, 0, spaceParticleCount);

            gl.disableVertexAttribArray(spaceParticleProgram.aPosition);
            gl.disableVertexAttribArray(spaceParticleProgram.aStarData);

            // Restore normal blending
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        // Render star particles (static background stars)
        if (!window.renderToggles || window.renderToggles.spaceParticles !== false) {
            renderParticles();
        }

        // Render orbit lines (behind planets) using WebGL with anti-aliasing
        if (orbitLineProgram && orbitParams.showOrbits >= 1 && (!window.renderToggles || window.renderToggles.orbits !== false)) {
            gl.useProgram(orbitLineProgram);
            gl.uniform2f(orbitLineProgram.uResolution, glCanvas.width, glCanvas.height);

            // Line width for AA lines (in pixels)
            const lineWidth = orbitParams.orbitLineWidth || 1.0;
            gl.uniform1f(orbitLineProgram.uLineWidth, lineWidth);

            // Build orbit line vertices for all moons
            const segments = 96;
            const dpr = window.devicePixelRatio || 1;

            // Helper to project world coords to screen (matches planet vertex shader logic)
            const projectToScreen = (wx, wy, wz) => {
                const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
                const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
                const cpx = cameraPosX, cpy = cameraPosY, cpz = cameraPosZ;
                // Camera basis vectors (same as shader)
                const fx = sry * crx, fy = -srx, fz = cry * crx;  // forward
                const rx = cry, rz = -sry;  // right (ry = 0)
                const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;  // up = cross(forward, right)
                const screenCenterX = width * 0.5;
                const screenCenterY = height * 0.5;
                // Vector from camera to point (world coords already scaled)
                const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
                const zd = tx * fx + ty * fy + tz * fz;
                if (zd < 0.01) return null;
                const ps = 1.0 / zd;
                // Project onto camera plane
                const projX = (tx * rx + tz * rz) * ps;
                const projY = (tx * ux + ty * uy + tz * uz) * ps;
                // Convert to screen coords (matching shader: projX * uRes.x, -projY * uRes.y)
                return { x: (screenCenterX + projX * width) * dpr, y: (screenCenterY - projY * height) * dpr };
            };

            // Group orbits by parent color for batched rendering
            // Each line segment becomes a quad (6 vertices as 2 triangles)
            // Vertex format: [x, y, dirX, dirY, side] (5 floats per vertex)
            const orbitsByColor = {};

            nodes.forEach(node => {
                if (node.isSun || !node.orbitRadiusWorld || !node.parentSunId) return;
                const parent = nodes.find(n => n.id === node.parentSunId);
                if (!parent) return;

                // Get parent's light color
                const hexColor = parent.lightColor || '#aabbcc';
                if (!orbitsByColor[hexColor]) {
                    orbitsByColor[hexColor] = [];
                }

                // Use world coordinates directly (same coordinate system as planets)
                const radius = node.orbitRadiusWorld;
                const centerWX = parent.worldX || 0;
                const centerWY = parent.worldY || 0;
                const centerWZ = parent.worldZ || 0;

                const tiltX = node.orbitTiltX || 0;
                const tiltY = node.orbitTiltY || 0;
                const tiltZ = node.orbitTiltZ || 0;
                const cosTX = Math.cos(tiltX), sinTX = Math.sin(tiltX);
                const cosTY = Math.cos(tiltY), sinTY = Math.sin(tiltY);
                const cosTZ = Math.cos(tiltZ), sinTZ = Math.sin(tiltZ);

                let prevPoint = null;
                for (let i = 0; i <= segments; i++) {
                    const angle = (i / segments) * Math.PI * 2;
                    let ox = Math.cos(angle) * radius;
                    let oy = Math.sin(angle) * radius;
                    let oz = 0;

                    // Apply tilts
                    let ny = oy * cosTX - oz * sinTX;
                    let nz = oy * sinTX + oz * cosTX;
                    oy = ny; oz = nz;

                    let nx = ox * cosTY + oz * sinTY;
                    oz = -ox * sinTY + oz * cosTY;
                    ox = nx;

                    const nx2 = ox * cosTZ - oy * sinTZ;
                    const ny2 = ox * sinTZ + oy * cosTZ;
                    ox = nx2; oy = ny2;

                    const projected = projectToScreen(centerWX + ox, centerWY + oy, centerWZ + oz);
                    if (projected && prevPoint) {
                        // Build a quad for this line segment
                        // Calculate direction from prevPoint to projected
                        const dx = projected.x - prevPoint.x;
                        const dy = projected.y - prevPoint.y;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        if (len > 0.001) {
                            const dirX = dx / len;
                            const dirY = dy / len;

                            // 6 vertices for 2 triangles forming a quad
                            // Triangle 1: p0-bottom, p0-top, p1-top
                            // Triangle 2: p0-bottom, p1-top, p1-bottom
                            const verts = orbitsByColor[hexColor];
                            // Vertex: x, y, dirX, dirY, side
                            // p0-bottom
                            verts.push(prevPoint.x, prevPoint.y, dirX, dirY, -1);
                            // p0-top
                            verts.push(prevPoint.x, prevPoint.y, dirX, dirY, 1);
                            // p1-top
                            verts.push(projected.x, projected.y, dirX, dirY, 1);

                            // p0-bottom
                            verts.push(prevPoint.x, prevPoint.y, dirX, dirY, -1);
                            // p1-top
                            verts.push(projected.x, projected.y, dirX, dirY, 1);
                            // p1-bottom
                            verts.push(projected.x, projected.y, dirX, dirY, -1);
                        }
                    }
                    prevPoint = projected;
                }
            });

            // Render each color batch
            const baseAlpha = orbitParams.orbitLineOpacity * globalFadeIn;
            gl.bindBuffer(gl.ARRAY_BUFFER, orbitLineProgram.buf);

            // Enable all vertex attributes
            gl.enableVertexAttribArray(orbitLineProgram.aPosition);
            gl.enableVertexAttribArray(orbitLineProgram.aDirection);
            gl.enableVertexAttribArray(orbitLineProgram.aSide);

            // Stride: 5 floats per vertex (x, y, dirX, dirY, side)
            const stride = 5 * 4; // 5 floats * 4 bytes

            for (const hexColor in orbitsByColor) {
                const verts = orbitsByColor[hexColor];
                if (verts.length === 0) continue;

                // Parse hex color
                const r = parseInt(hexColor.slice(1, 3), 16) / 255;
                const g = parseInt(hexColor.slice(3, 5), 16) / 255;
                const b = parseInt(hexColor.slice(5, 7), 16) / 255;

                gl.uniform4f(orbitLineProgram.uColor, r, g, b, baseAlpha);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);

                // Set up vertex attribute pointers
                gl.vertexAttribPointer(orbitLineProgram.aPosition, 2, gl.FLOAT, false, stride, 0);
                gl.vertexAttribPointer(orbitLineProgram.aDirection, 2, gl.FLOAT, false, stride, 8);
                gl.vertexAttribPointer(orbitLineProgram.aSide, 1, gl.FLOAT, false, stride, 16);

                // Draw as triangles (6 vertices per line segment = 2 triangles)
                gl.drawArrays(gl.TRIANGLES, 0, verts.length / 5);
            }

            gl.disableVertexAttribArray(orbitLineProgram.aPosition);
            gl.disableVertexAttribArray(orbitLineProgram.aDirection);
            gl.disableVertexAttribArray(orbitLineProgram.aSide);
        }

        // Use premultiplied alpha blending for planets/suns
        // This properly composites over transparent canvas without darkening
        // RGB: src + dst * (1 - srcAlpha), Alpha: src + dst * (1 - srcAlpha)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // Render spheres (planets and suns)
        gl.useProgram(sphereProgram);
        // uRes in CSS pixels (for vertex calculations), uFBORes in actual pixels (for texture sampling)
        const minDim = Math.min(width, height);
        gl.uniform2f(sphereProgram.uRes, width, height);
        gl.uniform1f(sphereProgram.uMinDim, minDim);
        gl.uniform2f(sphereProgram.uFBORes, glCanvas.width, glCanvas.height);
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
            const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
            const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
            // Free camera: direct position and rotation-based forward
            const cpx = cameraPosX, cpy = cameraPosY, cpz = cameraPosZ;
            const fx = sry * crx, fy = -srx, fz = cry * crx;
            const rx = cry, rz = -sry;
            const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;

            const proj = (lx, ly, lz) => {
                const wx = (lx - scx) * ws, wy = -(ly - scy) * ws, wz = lz || 0;
                const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
                const zd = tx * fx + ty * fy + tz * fz;
                if (zd < 0.01) return { x: scx, y: scy };
                const ps = 1.0 / zd;
                const px = (tx * rx + tz * rz) * ps;
                const py = (tx * ux + ty * uy + tz * uz) * ps;
                return { x: scx + px * width, y: scy - py * width };
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
        gl.uniform1f(sphereProgram.uCameraRotX, cameraRotX);
        gl.uniform1f(sphereProgram.uCameraRotY, cameraRotY);
        gl.uniform3f(sphereProgram.uCameraPos, cameraPosX, cameraPosY, cameraPosZ);

        // Bind background texture for fog sampling
        if (volumetricTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, volumetricTexture);
            gl.uniform1i(sphereProgram.uBackgroundTexture, 0);
            gl.uniform1f(sphereProgram.uUseBackgroundTexture, 1.0);
        } else {
            gl.uniform1f(sphereProgram.uUseBackgroundTexture, 0.0);
        }

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
        gl.uniform1f(sphereProgram.uSSSWrapA, planetParamsA.sssWrap);
        gl.uniform1f(sphereProgram.uSSSBacklightA, planetParamsA.sssBacklight);
        const sssColorA = hex2vec(planetParamsA.sssColor);
        gl.uniform3f(sphereProgram.uSSSColorA, sssColorA[0], sssColorA[1], sssColorA[2]);
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
        // Compute camera position and forward direction (free camera)
        const cosRotX = Math.cos(cameraRotX);
        const sinRotX = Math.sin(cameraRotX);
        const cosRotY = Math.cos(cameraRotY);
        const sinRotY = Math.sin(cameraRotY);

        // Free camera: direct position
        const camX = cameraPosX;
        const camY = cameraPosY;
        const camZ = cameraPosZ;

        // Camera forward from rotation angles
        const fwdX = sinRotY * cosRotX;
        const fwdY = -sinRotX;
        const fwdZ = cosRotY * cosRotX;

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
            // Helper to safely enable attribute (skip if optimized out by compiler, returns -1)
            function enableAttr(loc, size, offset) {
                if (loc >= 0) {
                    gl.enableVertexAttribArray(loc);
                    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, st, offset);
                }
            }
            enableAttr(program.aPos, 2, 0);
            enableAttr(program.aCenter, 2, 8);
            enableAttr(program.aRadius, 1, 16);
            enableAttr(program.aColor, 3, 20);
            enableAttr(program.aAlpha, 1, 32);
            enableAttr(program.aAppear, 1, 36);
            enableAttr(program.aGlow, 1, 40);
            enableAttr(program.aIndex, 1, 44);
            enableAttr(program.aIsLight, 1, 48);
            enableAttr(program.aDepth, 1, 52);
            enableAttr(program.aZ, 1, 56);
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
                    gl.uniform1f(sunProgram.uMinDim, minDim);
                    gl.uniform1f(sunProgram.uTime, time);
                    gl.uniform1f(sunProgram.uCameraRotX, cameraRotX);
                    gl.uniform1f(sunProgram.uCameraRotY, cameraRotY);
                    gl.uniform3f(sunProgram.uCameraPos, cameraPosX, cameraPosY, cameraPosZ);

                    // Sun uniforms (simplified)
                    gl.uniform1f(sunProgram.uSunCoreSize, sunParams.coreSize);
                    gl.uniform1f(sunProgram.uSunGlowSize, sunParams.glowSize);
                    gl.uniform1f(sunProgram.uSunGlowIntensity, sunParams.glowIntensity);

                    currentIsSun = true;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, sunProgram.buf);
                gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
                setupVertexAttribs(sunProgram);
                gl.drawArrays(gl.TRIANGLES, 0, verts.length / 15);
            } else {
                // Planets use premultiplied alpha blending
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
            gl.uniform1f(debugQuadProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(debugQuadProgram.uCameraRotY, cameraRotY);
            gl.uniform3f(debugQuadProgram.uCameraPos, cameraPosX, cameraPosY, cameraPosZ);

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

        // FINAL PASS: Blit final FBO to screen with comprehensive post-processing
        if (finalFBO && postProcessProgram && finalTexture) {
            // Render multi-pass bloom before post-processing
            var bloomTexture = renderBloom(finalTexture, canvasWidth, canvasHeight);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvasWidth, canvasHeight);
            gl.disable(gl.BLEND);

            gl.useProgram(postProcessProgram);

            // Get post-process params (with defaults for backwards compatibility)
            var pp = window.postProcessParams || {};

            // Base uniforms
            gl.uniform2f(postProcessProgram.uResolution, canvasWidth, canvasHeight);
            gl.uniform1f(postProcessProgram.uTime, performance.now() * 0.001);

            // Edge fade
            gl.uniform1f(postProcessProgram.uEdgeFadeSize, pp.edgeFadeSize !== undefined ? pp.edgeFadeSize : 0.15);
            gl.uniform1f(postProcessProgram.uEdgeFadePower, pp.edgeFadePower !== undefined ? pp.edgeFadePower : 1.0);

            // Vignette
            gl.uniform1f(postProcessProgram.uVignetteIntensity, pp.vignetteIntensity !== undefined ? pp.vignetteIntensity : 0.3);
            gl.uniform1f(postProcessProgram.uVignetteRadius, pp.vignetteRadius !== undefined ? pp.vignetteRadius : 0.8);
            gl.uniform1f(postProcessProgram.uVignetteSoftness, pp.vignetteSoftness !== undefined ? pp.vignetteSoftness : 0.5);

            // Color grading
            gl.uniform1f(postProcessProgram.uBrightness, pp.brightness !== undefined ? pp.brightness : 1.0);
            gl.uniform1f(postProcessProgram.uContrast, pp.contrast !== undefined ? pp.contrast : 1.0);
            gl.uniform1f(postProcessProgram.uSaturation, pp.saturation !== undefined ? pp.saturation : 1.0);
            gl.uniform1f(postProcessProgram.uGamma, pp.gamma !== undefined ? pp.gamma : 1.0);

            // Color balance
            gl.uniform3f(postProcessProgram.uShadowsTint,
                pp.shadowsR !== undefined ? pp.shadowsR : 0.0,
                pp.shadowsG !== undefined ? pp.shadowsG : 0.0,
                pp.shadowsB !== undefined ? pp.shadowsB : 0.0);
            gl.uniform3f(postProcessProgram.uHighlightsTint,
                pp.highlightsR !== undefined ? pp.highlightsR : 0.0,
                pp.highlightsG !== undefined ? pp.highlightsG : 0.0,
                pp.highlightsB !== undefined ? pp.highlightsB : 0.0);

            // Chromatic aberration
            gl.uniform1f(postProcessProgram.uChromaticAberration, pp.chromaticAberration !== undefined ? pp.chromaticAberration : 0.0);
            gl.uniform1f(postProcessProgram.uChromaticOffset, pp.chromaticOffset !== undefined ? pp.chromaticOffset : 0.003);

            // Film grain
            gl.uniform1f(postProcessProgram.uGrainIntensity, pp.grainIntensity !== undefined ? pp.grainIntensity : 0.0);
            gl.uniform1f(postProcessProgram.uGrainSize, pp.grainSize !== undefined ? pp.grainSize : 1.0);

            // Bloom (multi-pass)
            gl.uniform1f(postProcessProgram.uBloomThreshold, pp.bloomThreshold !== undefined ? pp.bloomThreshold : 0.8);
            gl.uniform1f(postProcessProgram.uBloomIntensity, pp.bloomIntensity !== undefined ? pp.bloomIntensity : 0.5);
            gl.uniform1f(postProcessProgram.uBloomRadius, pp.bloomRadius !== undefined ? pp.bloomRadius : 1.0);
            gl.uniform1f(postProcessProgram.uBloomTint, pp.bloomTint !== undefined ? pp.bloomTint : 0.0);
            gl.uniform1f(postProcessProgram.uBloomEnabled, bloomTexture ? 1.0 : 0.0);

            // Sharpen
            gl.uniform1f(postProcessProgram.uSharpenIntensity, pp.sharpenIntensity !== undefined ? pp.sharpenIntensity : 0.0);

            // Tone mapping
            gl.uniform1f(postProcessProgram.uExposure, pp.exposure !== undefined ? pp.exposure : 1.0);
            gl.uniform1i(postProcessProgram.uToneMapping, pp.toneMapping !== undefined ? Math.floor(pp.toneMapping) : 0);

            // Textures
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, finalTexture);
            gl.uniform1i(postProcessProgram.uTexture, 0);

            // Bloom texture (multi-pass bloom result)
            gl.activeTexture(gl.TEXTURE1);
            if (bloomTexture) {
                gl.bindTexture(gl.TEXTURE_2D, bloomTexture);
            } else {
                gl.bindTexture(gl.TEXTURE_2D, finalTexture);  // Fallback
            }
            gl.uniform1i(postProcessProgram.uBloomTexture, 1);

            // Draw quad
            gl.bindBuffer(gl.ARRAY_BUFFER, volumetricQuadBuffer);
            gl.enableVertexAttribArray(postProcessProgram.aPosition);
            gl.vertexAttribPointer(postProcessProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(postProcessProgram.aPosition);

            gl.enable(gl.BLEND);
        }

        // ========================================
        // LENS GHOST RENDERING
        // ========================================
        if (lensGhostProgram && lensGhostQuadBuffer && window.lensGhostParams && window.lensGhostParams.enabled) {
            const lgp = window.lensGhostParams;
            const lights = window.globalLights;

            if (lights.light0.screenX !== undefined) {
                const dpr = window.devicePixelRatio || 1;
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;

                gl.useProgram(lensGhostProgram);
                gl.uniform2f(lensGhostProgram.uResolution, canvasWidth, canvasHeight);
                gl.uniform1f(lensGhostProgram.uGhostFalloff, lgp.falloff);
                gl.uniform1f(lensGhostProgram.uBladeCount, lgp.bladeCount || 6);
                gl.uniform1f(lensGhostProgram.uRotation, (lgp.rotation || 0) * Math.PI / 180);
                gl.uniform1f(lensGhostProgram.uAnamorphic, lgp.anamorphic || 0);
                gl.uniform3f(lensGhostProgram.uTint, lgp.tintR || 1, lgp.tintG || 1, lgp.tintB || 1);

                gl.bindBuffer(gl.ARRAY_BUFFER, lensGhostQuadBuffer);
                gl.enableVertexAttribArray(lensGhostProgram.aPosition);
                gl.vertexAttribPointer(lensGhostProgram.aPosition, 2, gl.FLOAT, false, 0, 0);

                // Additive blending for lens ghosts
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);

                // Render ghosts for each light (scale CSS pixels to device pixels)
                const lightData = [
                    { screen: { x: lights.light0.screenX * dpr, y: lights.light0.screenY * dpr }, color: lights.light0.color, intensity: lights.light0.intensity },
                    { screen: { x: lights.light1.screenX * dpr, y: lights.light1.screenY * dpr }, color: lights.light1.color, intensity: lights.light1.intensity },
                    { screen: { x: lights.light2.screenX * dpr, y: lights.light2.screenY * dpr }, color: lights.light2.color, intensity: lights.light2.intensity }
                ];

                for (let li = 0; li < lightData.length; li++) {
                    const light = lightData[li];
                    const lightX = light.screen.x;
                    const lightY = light.screen.y;

                    // Calculate distance from screen center (normalized 0-1)
                    const nx = Math.abs(lightX - centerX) / centerX;
                    const ny = Math.abs(lightY - centerY) / centerY;
                    const distFromCenter = Math.max(nx, ny);

                    // Edge fade - reduce intensity when light is near screen edge
                    let edgeFade = 1.0;
                    if (distFromCenter > lgp.edgeFadeStart) {
                        edgeFade = 1.0 - smoothstep(lgp.edgeFadeStart, lgp.edgeFadeEnd, distFromCenter);
                    }

                    // Skip if fully faded or light is off-screen
                    if (edgeFade < 0.01 || distFromCenter > 1.5) continue;

                    // Direction from light to center
                    const dirX = centerX - lightX;
                    const dirY = centerY - lightY;

                    // Render multiple ghosts along the reflection axis
                    const startOffset = lgp.startOffset !== undefined ? lgp.startOffset : 1.2;
                    for (let gi = 0; gi < lgp.ghostCount; gi++) {
                        // Ghosts appear on OPPOSITE side of screen center from light
                        const distMult = startOffset + gi * lgp.ghostSpacing;
                        const ghostX = lightX + dirX * distMult;
                        const ghostY = lightY + dirY * distMult;

                        // Size variation per ghost (alternating larger/smaller, decreasing with distance)
                        const sizeVar = 1.0 + (gi % 2 === 0 ? lgp.ghostSizeVariation : -lgp.ghostSizeVariation * 0.5);
                        const ghostSize = lgp.ghostSizeBase * dpr * sizeVar * Math.max(0.3, 1.0 - gi * 0.12);

                        // Intensity falls off with distance from light
                        const distanceFalloff = 1.0 / (1.0 + gi * 0.4);
                        const ghostIntensity = lgp.intensity * edgeFade * distanceFalloff * light.intensity;

                        // Vary roundness per ghost for visual interest
                        const roundnessBase = lgp.roundness !== undefined ? lgp.roundness : 0;
                        const roundnessVar = roundnessBase + (gi % 3) * 0.15;

                        // Chromatic variation per ghost
                        const chromaticVar = (gi % 3 - 1) * 0.3;

                        gl.uniform2f(lensGhostProgram.uGhostPos, ghostX, ghostY);
                        gl.uniform1f(lensGhostProgram.uGhostSize, ghostSize);
                        gl.uniform3f(lensGhostProgram.uGhostColor, light.color[0], light.color[1], light.color[2]);
                        gl.uniform1f(lensGhostProgram.uGhostIntensity, ghostIntensity);
                        gl.uniform1f(lensGhostProgram.uChromaticShift, lgp.chromaticShift + chromaticVar);
                        gl.uniform1f(lensGhostProgram.uRoundness, Math.min(1, roundnessVar));

                        gl.drawArrays(gl.TRIANGLES, 0, 6);
                    }
                }

                gl.disableVertexAttribArray(lensGhostProgram.aPosition);

                // Restore normal blending
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            }
        }

        return true;
    }

    // Smoothstep helper for lens ghost edge fade
    function smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
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
        // Always prefer canvas-section dimensions (the visible WebGL canvas container)
        // The old skills-graph-view container is now just an overlay for labels
        const canvasSection = document.getElementById('canvas-section');
        let rect = canvasSection ? canvasSection.getBoundingClientRect() : { width: 0, height: 0 };

        // Fallback to old container if canvas-section has no dimensions
        if (rect.width === 0 || rect.height === 0) {
            rect = container.getBoundingClientRect();
        }
        // Final fallback to window dimensions if still 0
        if (rect.width === 0 || rect.height === 0) {
            rect = { width: window.innerWidth, height: window.innerHeight };
        }
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

        // STEP 1: Place suns at positions from solarSystemParams
        const sunIds = ['unity', 'unreal', 'graphics'];
        for (const sunId of sunIds) {
            const node = nodes.find(n => n.id === sunId);
            if (!node) continue;

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
            if (!node) continue;

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
            // Tilt values are used directly from solarSystemParams
            // moonTiltMult adds additional global tilt on top (0 = no extra, 1 = double)
            const systemTilt = getSolarSystemTilt(config.sun);
            const tiltX = systemTilt.tiltX * (1 + moonTiltMult);
            const tiltY = systemTilt.tiltY * (1 + moonTiltMult);
            const tiltZ = systemTilt.tiltZ * (1 + moonTiltMult);

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
            let newX = offsetX * cosY + offsetZ * sinY;
            offsetZ = -offsetX * sinY + offsetZ * cosY;
            offsetX = newX;

            // Apply tilt around Z axis (roll)
            const cosZ = Math.cos(tiltZ);
            const sinZ = Math.sin(tiltZ);
            const newX2 = offsetX * cosZ - offsetY * sinZ;
            const newY2 = offsetX * sinZ + offsetY * cosZ;
            offsetX = newX2;
            offsetY = newY2;

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
            node.orbitTiltZ = tiltZ;
            node.parentSunId = config.sun;
            node.isMoon = true;
        }

        // STEP 3: Sub-moons orbit around planets (former free floaters)
        for (const subMoonId in subMoonOrbits) {
            const node = nodes.find(n => n.id === subMoonId);
            if (!node) continue;

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
            node.orbitTiltZ = 0;  // Sub-moons don't have Z tilt
            node.parentSunId = config.parent;  // Used for circle drawing
            node.isSubMoon = true;
        }

        // Apply size factors to all nodes based on their type
        const sunSizeFactor = orbitParams.sunSizeFactor || 1.0;
        const planetSizeFactor = orbitParams.planetSizeFactor || 1.0;
        const subMoonSizeFactor = orbitParams.subMoonSize || 0.5;

        nodes.forEach(node => {
            if (node.isSun || node.isLight) {
                // Suns use sunSizeFactor
                node.size = node.baseSize * sizeScale * sunSizeFactor;
            } else if (node.isSubMoon) {
                // Sub-moons use subMoonSize
                node.size = node.baseSize * sizeScale * subMoonSizeFactor;
            } else {
                // Regular moons/planets use planetSizeFactor
                node.size = node.baseSize * sizeScale * planetSizeFactor;
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        time += 0.016;

        // Camera focus transition - smooth look-at and approach a node
        if (isFocusing && focusTarget) {
            // Get target world position
            const targetWorldX = focusTarget.worldX || 0;
            const targetWorldY = focusTarget.worldY || 0;
            const targetWorldZ = focusTarget.worldZ || 0;

            // Calculate direction from camera to target
            const dx = targetWorldX - cameraPosX;
            const dy = targetWorldY - cameraPosY;
            const dz = targetWorldZ - cameraPosZ;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Calculate target rotation to look at the node
            // Yaw: angle in XZ plane
            const targetYaw = Math.atan2(dx, dz);
            // Pitch: angle up/down
            const horizontalDist = Math.sqrt(dx * dx + dz * dz);
            const targetPitch = -Math.atan2(dy, horizontalDist);

            // Calculate target position (approach but stop at focusDistance)
            const stopDist = focusDistance + (focusTarget.size || focusTarget.baseSize || 20) * 0.0003;
            const approachT = Math.max(0, 1 - stopDist / dist);
            const targetPosX = cameraPosX + dx * approachT;
            const targetPosY = cameraPosY + dy * approachT;
            const targetPosZ = cameraPosZ + dz * approachT;

            // Smooth easing (ease-out cubic)
            focusProgress += 0.016 / focusDuration;
            const t = Math.min(1, focusProgress);
            const ease = 1 - Math.pow(1 - t, 3);

            // Interpolate rotation toward target
            // Handle angle wrapping for yaw
            let yawDiff = targetYaw - cameraRotY;
            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            cameraRotY += yawDiff * ease * 0.1;
            cameraRotX += (targetPitch - cameraRotX) * ease * 0.1;

            // Interpolate position toward target
            cameraPosX += (targetPosX - cameraPosX) * ease * 0.05;
            cameraPosY += (targetPosY - cameraPosY) * ease * 0.05;
            cameraPosZ += (targetPosZ - cameraPosZ) * ease * 0.05;

            // Update targets to match current (prevents snapping when focus ends)
            targetCameraPosX = cameraPosX;
            targetCameraPosY = cameraPosY;
            targetCameraPosZ = cameraPosZ;
            targetCameraRotX = cameraRotX;
            targetCameraRotY = cameraRotY;

            // Check if focus transition is complete
            if (t >= 1 && dist < stopDist * 1.5) {
                isFocusing = false;
                focusTarget = null;
                focusProgress = 0;
                container.style.cursor = 'grab';
            }
        } else if (isNavigating && navTarget) {
            // Solar system navigation - phased: look, wait, then travel
            const targetWorldX = navTarget.worldX || 0;
            const targetWorldY = navTarget.worldY || 0;
            const targetWorldZ = navTarget.worldZ || 0;

            // Get the orbital tilt of this solar system
            const systemTilt = getSolarSystemTilt(navTargetId);
            const tiltX = systemTilt.tiltX;
            const tiltY = systemTilt.tiltY;

            // Calculate camera position: offset from sun, perpendicular to orbital plane
            let normalX = 0, normalY = 0, normalZ = 1;

            // Apply tilt around X axis
            const cosTX = Math.cos(tiltX), sinTX = Math.sin(tiltX);
            let ny = normalY * cosTX - normalZ * sinTX;
            let nz = normalY * sinTX + normalZ * cosTX;
            normalY = ny; normalZ = nz;

            // Apply tilt around Y axis
            const cosTY = Math.cos(tiltY), sinTY = Math.sin(tiltY);
            let nx = normalX * cosTY + normalZ * sinTY;
            nz = -normalX * sinTY + normalZ * cosTY;
            normalX = nx; normalZ = nz;

            // Final position: sun position + normal * navDistance
            const finalPosX = targetWorldX + normalX * navDistance;
            const finalPosY = targetWorldY + normalY * navDistance;
            const finalPosZ = targetWorldZ + normalZ * navDistance;

            // Calculate target rotation to look at the sun from current position
            const lookFromX = navPhase === 'travel' ? finalPosX : cameraPosX;
            const lookFromY = navPhase === 'travel' ? finalPosY : cameraPosY;
            const lookFromZ = navPhase === 'travel' ? finalPosZ : cameraPosZ;
            const lookDx = targetWorldX - lookFromX;
            const lookDy = targetWorldY - lookFromY;
            const lookDz = targetWorldZ - lookFromZ;
            const targetYaw = Math.atan2(lookDx, lookDz);
            const horizontalDist = Math.sqrt(lookDx * lookDx + lookDz * lookDz);
            const targetPitch = -Math.atan2(lookDy, horizontalDist);

            // Update phase time
            navPhaseTime += 0.016;

            if (navPhase === 'look') {
                // Phase 1: Turn to look at target (ease-out for smooth stop)
                const t = Math.min(1, navPhaseTime / navLookDuration);
                const ease = 1 - Math.pow(1 - t, 3);  // ease-out cubic

                // Interpolate rotation toward target
                let yawDiff = targetYaw - cameraRotY;
                while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                cameraRotY += yawDiff * ease * 0.12;
                cameraRotX += (targetPitch - cameraRotX) * ease * 0.12;

                // Transition to wait phase
                if (navPhaseTime >= navLookDuration) {
                    navPhase = 'wait';
                    navPhaseTime = 0;
                    // Update start position for travel phase
                    navStartPosX = cameraPosX;
                    navStartPosY = cameraPosY;
                    navStartPosZ = cameraPosZ;
                }
            } else if (navPhase === 'wait') {
                // Phase 2: Brief pause while looking at target
                // Keep looking at target during wait
                let yawDiff = targetYaw - cameraRotY;
                while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                cameraRotY += yawDiff * 0.1;
                cameraRotX += (targetPitch - cameraRotX) * 0.1;

                // Transition to travel phase
                if (navPhaseTime >= navWaitDuration) {
                    navPhase = 'travel';
                    navPhaseTime = 0;
                }
            } else if (navPhase === 'travel') {
                // Phase 3: Travel to destination with smooth acceleration/deceleration
                const t = Math.min(1, navPhaseTime / navTravelDuration);
                // Smooth ease-in-out (quintic for very smooth accel/decel)
                const ease = t < 0.5
                    ? 16 * t * t * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 5) / 2;

                // Interpolate position from start to final
                cameraPosX = navStartPosX + (finalPosX - navStartPosX) * ease;
                cameraPosY = navStartPosY + (finalPosY - navStartPosY) * ease;
                cameraPosZ = navStartPosZ + (finalPosZ - navStartPosZ) * ease;

                // Keep looking at target during travel
                const currentLookDx = targetWorldX - cameraPosX;
                const currentLookDy = targetWorldY - cameraPosY;
                const currentLookDz = targetWorldZ - cameraPosZ;
                const currentTargetYaw = Math.atan2(currentLookDx, currentLookDz);
                const currentHorizDist = Math.sqrt(currentLookDx * currentLookDx + currentLookDz * currentLookDz);
                const currentTargetPitch = -Math.atan2(currentLookDy, currentHorizDist);

                let yawDiff = currentTargetYaw - cameraRotY;
                while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
                while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
                cameraRotY += yawDiff * 0.15;
                cameraRotX += (currentTargetPitch - cameraRotX) * 0.15;

                // Check if travel is complete
                if (t >= 1) {
                    currentSolarSystem = navTargetId;  // Mark as arrived at this solar system
                    isNavigating = false;
                    navTarget = null;
                    navTargetId = null;
                    navPhase = 'look';
                    navPhaseTime = 0;
                    container.style.cursor = 'grab';
                }
            }

            // Update targets to match current
            targetCameraPosX = cameraPosX;
            targetCameraPosY = cameraPosY;
            targetCameraPosZ = cameraPosZ;
            targetCameraRotX = cameraRotX;
            targetCameraRotY = cameraRotY;
        } else {
            // Normal camera controls (only when not focusing or navigating)

            // Smooth camera rotation interpolation
            cameraRotX += (targetCameraRotX - cameraRotX) * 0.08;
            cameraRotY += (targetCameraRotY - cameraRotY) * 0.08;

            // Process WASD/ZQSD keyboard input for free camera movement
            // Movement is in the direction the camera is facing
            // Can move while rotating (FPS-style controls)
            let moveForward = 0, moveRight = 0, moveUp = 0;
            // Forward/backward: W or Z (French AZERTY)
            if (keysPressed['keyw'] || keysPressed['keyz']) moveForward = 1;
            // Backward: S
            if (keysPressed['keys']) moveForward = -1;
            // Left: A or Q (French AZERTY)
            if (keysPressed['keya'] || keysPressed['keyq']) moveRight = -1;
            // Right: D
            if (keysPressed['keyd']) moveRight = 1;
            // Up: Space / Down: Shift (optional vertical movement)
            if (keysPressed['space']) moveUp = 1;
            if (keysPressed['shiftleft'] || keysPressed['shiftright']) moveUp = -1;

            // Apply movement in camera's local coordinate system (FPS-style)
            if (moveForward !== 0 || moveRight !== 0 || moveUp !== 0) {
                // Clear current solar system when user manually moves
                currentSolarSystem = null;

                const cosRotX = Math.cos(cameraRotX);
                const sinRotX = Math.sin(cameraRotX);
                const sinRotY = Math.sin(cameraRotY);
                const cosRotY = Math.cos(cameraRotY);

                // Forward vector (direction camera is looking)
                const fwdX = sinRotY * cosRotX;
                const fwdY = -sinRotX;
                const fwdZ = cosRotY * cosRotX;

                // Right vector (perpendicular to forward, in XZ plane)
                const rightX = cosRotY;
                const rightZ = -sinRotY;

                // Combine movement vectors
                const speed = window.cameraParams.moveSpeed;
                targetCameraPosX += (fwdX * moveForward + rightX * moveRight) * speed;
                targetCameraPosY += (fwdY * moveForward + moveUp) * speed;
                targetCameraPosZ += (fwdZ * moveForward + rightZ * moveRight) * speed;
            }

            // Smooth camera position interpolation (always runs for FPS-style movement)
            const smooth = window.cameraParams.smoothing;
            cameraPosX += (targetCameraPosX - cameraPosX) * smooth;
            cameraPosY += (targetCameraPosY - cameraPosY) * smooth;
            cameraPosZ += (targetCameraPosZ - cameraPosZ) * smooth;
        }

        // Update global camera state for shaders
        window.globalCameraRotX = cameraRotX;
        window.globalCameraRotY = cameraRotY;
        window.globalCameraPosX = cameraPosX;
        window.globalCameraPosY = cameraPosY;
        window.globalCameraPosZ = cameraPosZ;

        // Update camera position label (throttled to avoid layout thrashing)
        if (!window._lastCameraLabelUpdate || Date.now() - window._lastCameraLabelUpdate > 100) {
            const camLabel = document.getElementById('camera-coords');
            if (camLabel) {
                camLabel.textContent = cameraPosX.toFixed(2) + ', ' + cameraPosY.toFixed(2) + ', ' + cameraPosZ.toFixed(2);
            }
            window._lastCameraLabelUpdate = Date.now();
        }

        // 3D perspective camera (FPS-style free camera)
        const screenCenterX = width * 0.5;
        const screenCenterY = height * 0.5;

        // Camera rotation values
        const cosRotX = Math.cos(cameraRotX);
        const sinRotX = Math.sin(cameraRotX);
        const cosRotY = Math.cos(cameraRotY);
        const sinRotY = Math.sin(cameraRotY);

        // Camera position (free camera - direct position)
        const camPosX = cameraPosX;
        const camPosY = cameraPosY;
        const camPosZ = cameraPosZ;

        // Camera forward direction (from rotation angles, not looking at origin)
        const camFwdX = sinRotY * cosRotX;
        const camFwdY = -sinRotX;
        const camFwdZ = cosRotY * cosRotX;

        // Camera right vector (perpendicular to forward in XZ plane)
        const camRightX = cosRotY;
        const camRightY = 0;
        const camRightZ = -sinRotY;

        // Camera up vector (cross product of forward and right)
        const camUpX = camFwdY * camRightZ - camFwdZ * camRightY;
        const camUpY = camFwdZ * camRightX - camFwdX * camRightZ;
        const camUpZ = camFwdX * camRightY - camFwdY * camRightX;

        // No canvas transform - we apply perspective manually to each element
        ctx.save();

        // No hover effects - all nodes stay at normal state
        nodes.forEach(node => {
            node.targetGlowIntensity = 0;
            node.targetShrink = 1;
            node.glowDelay = 0;

            const lerpSpeed = node.targetGlowIntensity > node.glowIntensity ? 0.08 : 0.12;
            node.glowIntensity += (node.targetGlowIntensity - node.glowIntensity) * lerpSpeed;
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
            // Node position in world space - use worldX/Y/Z if available (more accurate)
            // Otherwise fall back to converting from screen space
            const nodePosX = node.worldX !== undefined ? node.worldX : (node.x - screenCenterX) * worldScale;
            const nodePosY = node.worldY !== undefined ? node.worldY : -(node.y - screenCenterY) * worldScale;
            const nodePosZ = node.worldZ !== undefined ? node.worldZ : (node.z || 0.0);

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

            // Perspective scale (1/distance)
            const nodeScale = 1.0 / zDist;

            // Project node position onto screen (dot with right and up)
            const projX = (toNodeX * camRightX + toNodeY * camRightY + toNodeZ * camRightZ) * nodeScale;
            const projY = (toNodeX * camUpX + toNodeY * camUpY + toNodeZ * camUpZ) * nodeScale;

            // Convert back to screen coordinates
            // Use width for X (as in shader), but use height for Y to match screen space
            node.renderX = screenCenterX + projX * width;
            node.renderY = screenCenterY - projY * height;  // Use height for proper aspect ratio
            node.renderScale = nodeScale;

            // Fade when very close to camera
            node.renderAlpha = zDist < 0.2 ? zDist / 0.2 : 1.0;
        });

        // Helper to project 3D world point to screen
        function projectToScreen(wx, wy, wz) {
            const tx = wx - camPosX, ty = wy - camPosY, tz = wz - camPosZ;
            const zd = tx * camFwdX + ty * camFwdY + tz * camFwdZ;
            if (zd < 0.01) return null;
            const ps = 1.0 / zd;
            const px = (tx * camRightX + ty * camRightY + tz * camRightZ) * ps;
            const py = (tx * camUpX + ty * camUpY + tz * camUpZ) * ps;
            return { x: screenCenterX + px * width, y: screenCenterY - py * height };
        }

        // Draw orbit circles for moons (3D tilted circles, projected with camera)
        // DISABLED: Orbits are now rendered in WebGL (behind planets) - see renderWebGL function
        // This 2D canvas version would draw orbits on top of planets
        if (false && orbitParams.showOrbits >= 1 && (!window.renderToggles || window.renderToggles.orbits !== false)) {
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
            const segments = 96;  // Double vertices for smoother circles
            const radius = node.orbitRadiusWorld * worldToProjectScale;
            const centerWX = (parent.worldX || 0) * worldToProjectScale;
            const centerWY = (parent.worldY || 0) * worldToProjectScale;
            const centerWZ = parent.worldZ || 0;

            // Get tilt angles for this orbit
            const tiltX = node.orbitTiltX || 0;
            const tiltY = node.orbitTiltY || 0;
            const tiltZ = node.orbitTiltZ || 0;
            const cosTX = Math.cos(tiltX), sinTX = Math.sin(tiltX);
            const cosTY = Math.cos(tiltY), sinTY = Math.sin(tiltY);
            const cosTZ = Math.cos(tiltZ), sinTZ = Math.sin(tiltZ);

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
                let nx = ox * cosTY + oz * sinTY;
                oz = -ox * sinTY + oz * cosTY;
                ox = nx;

                // Apply tilt around Z axis
                const nx2 = ox * cosTZ - oy * sinTZ;
                const ny2 = ox * sinTZ + oy * cosTZ;
                ox = nx2;
                oy = ny2;

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
        }

        if (!renderSpheresGL(nodes, hoveredNode, null)) {
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

    // Track animation state for visibility-based pausing
    var isAnimating = false;
    var animationFrameId = null;

    function isCanvasVisible() {
        // Check if page is hidden (tab in background)
        if (document.hidden) return false;

        // Check if skills panel is active
        var skillsPanel = document.getElementById('panel-skills');
        if (!skillsPanel || !skillsPanel.classList.contains('active')) return false;

        // Check if canvas section is active (graph view, not list view)
        var canvasSection = document.getElementById('canvas-section');
        if (!canvasSection || !canvasSection.classList.contains('active')) return false;

        return true;
    }

    function animate() {
        if (!isCanvasVisible()) {
            // Canvas not visible - pause animation loop
            isAnimating = false;
            animationFrameId = null;
            return;
        }

        simulate();
        var t0 = window.renderTiming.start();
        draw();
        window.renderTiming.end('planets', t0);
        // Update timing aggregation (this is the "main" loop)
        window.renderTiming.update();
        animationFrameId = requestAnimationFrame(animate);
    }

    function startAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        animationFrameId = requestAnimationFrame(animate);
    }

    function stopAnimation() {
        isAnimating = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopAnimation();
        } else if (isCanvasVisible()) {
            startAnimation();
        }
    });

    // Listen for skills tab activation
    window.addEventListener('skillsTabActivated', function() {
        if (isCanvasVisible()) {
            startAnimation();
        }
    });

    // Listen for view toggle (graph/list)
    var viewToggleBtns = document.querySelectorAll('.view-toggle-btn[data-view]');
    viewToggleBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Small delay to let DOM update
            setTimeout(function() {
                if (isCanvasVisible()) {
                    startAnimation();
                } else {
                    stopAnimation();
                }
            }, 50);
        });
    });

    // Listen for tab changes (when leaving skills tab)
    var allTabs = document.querySelectorAll('.carousel-tab');
    allTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            setTimeout(function() {
                if (!isCanvasVisible()) {
                    stopAnimation();
                }
            }, 50);
        });
    });

    // Convert screen coords to world coords (accounting for 3D perspective camera)
    function screenToWorld(sx, sy) {
        // With camera-distance zoom, screen coords directly map to world coords
        // for objects at Z=0 (the main interaction plane)
        // The zoom effect comes from camera being closer, not from scaling
        return { x: sx, y: sy };
    }

    canvas.addEventListener('mousedown', (e) => {
        // Only handle left click
        if (e.button !== 0) return;

        // Block clicks during navigation (camera is auto-traveling to a solar system)
        if (isNavigating) return;

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        mouseScreenX = screenX;
        mouseScreenY = screenY;
        const world = screenToWorld(screenX, screenY);
        mouseX = world.x;
        mouseY = world.y;

        // Check if clicking on a node
        const clickedNode = getNodeAt(screenX, screenY);

        if (clickedNode) {
            // Clicking on a sun: navigate to that solar system (don't focus)
            if (clickedNode.isSun) {
                navigateToSolarSystem(clickedNode.id);
                return;
            }

            // Clicking on a planet/moon: start camera focus transition
            // Don't start if already focusing on this node
            if (isFocusing && focusTarget === clickedNode) return;

            isFocusing = true;
            focusTarget = clickedNode;
            focusProgress = 0;
            container.style.cursor = 'default';

            // Show tooltip for the focused node
            if (!tooltipTarget || tooltipTarget !== clickedNode) {
                tooltipTarget = clickedNode;
                generateTooltipPosition(clickedNode);
            }
        } else if (!isFocusing) {
            // Clicking on empty space: start camera rotation (only if not focusing)
            isOrbiting = true;
            orbitStartX = e.clientX;
            orbitStartY = e.clientY;
            orbitStartRotX = targetCameraRotX;
            orbitStartRotY = targetCameraRotY;
            container.style.cursor = 'move';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        // Block all mouse look controls during focus/navigation transition
        if (isFocusing || isNavigating) {
            // Still update mouse position for hover detection
            const rect = canvas.getBoundingClientRect();
            mouseScreenX = e.clientX - rect.left;
            mouseScreenY = e.clientY - rect.top;
            return;
        }

        // Handle camera orbit dragging
        if (isOrbiting) {
            const deltaX = e.clientX - orbitStartX;
            const deltaY = e.clientY - orbitStartY;
            // Sensitivity from camera params
            const sensitivity = window.cameraParams.rotationSpeed;
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

        // Update hover state (no more dragging)
        hoveredNode = getNodeAt(screenX, screenY);
        container.style.cursor = hoveredNode ? 'pointer' : 'grab';
        updateTooltip(hoveredNode);
    });

    canvas.addEventListener('mouseup', () => {
        if (isOrbiting) {
            isOrbiting = false;
            container.style.cursor = hoveredNode ? 'pointer' : 'grab';
            return;
        }
        // No more dragging - just reset cursor
        if (!isFocusing) {
            container.style.cursor = hoveredNode ? 'pointer' : 'grab';
        }
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredNode = null;
        isOrbiting = false;
        if (!isFocusing) {
            container.style.cursor = 'grab';
        }
        updateTooltip(null);
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();

        // Block touches during navigation
        if (isNavigating) return;

        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        mouseScreenX = screenX;
        mouseScreenY = screenY;

        // Check if tapping on a node
        const tappedNode = getNodeAt(screenX, screenY);
        if (tappedNode) {
            // Tapping on a sun: navigate to that solar system (don't focus)
            if (tappedNode.isSun) {
                navigateToSolarSystem(tappedNode.id);
                return;
            }

            // Tapping on a planet/moon: start focus transition
            // Don't start if already focusing on this node
            if (isFocusing && focusTarget === tappedNode) return;

            isFocusing = true;
            focusTarget = tappedNode;
            focusProgress = 0;

            // Show tooltip for the focused node
            if (!tooltipTarget || tooltipTarget !== tappedNode) {
                tooltipTarget = tappedNode;
                generateTooltipPosition(tappedNode);
            }
            updateTooltip(tappedNode);
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        // Block touch interactions during focus/navigation
        if (isFocusing || isNavigating) return;

        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouseScreenX = touch.clientX - rect.left;
        mouseScreenY = touch.clientY - rect.top;
    }, { passive: false });

    canvas.addEventListener('touchend', () => { /* Touch end - focus continues automatically */ });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;

        // Spacebar toggles mouse light on planets
        if (e.code === 'Space') {
            e.preventDefault();
            mouseLightEnabled = !mouseLightEnabled;
            return;
        }

        // Track WASD/ZQSD keys for camera movement
        const key = e.code.toLowerCase();
        if (['keyw', 'keyz', 'keys', 'keya', 'keyd', 'keyq'].includes(key)) {
            keysPressed[key] = true;
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.code.toLowerCase();
        if (['keyw', 'keyz', 'keys', 'keya', 'keyd', 'keyq'].includes(key)) {
            keysPressed[key] = false;
        }
    });

    window.addEventListener('resize', resize);
    initSphereGL();
    resize();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            time = 0; globalFadeIn = 0;
            tooltip.classList.remove('visible');
            tooltipTarget = null;
        }
    });

    window.addEventListener('skillsTabActivated', () => {
        time = 0; globalFadeIn = 0;
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
        'a-sss-wrap': { param: 'sssWrap', valueEl: 'a-sss-wrap-value', default: 0.3, decimals: 2 },
        'a-sss-backlight': { param: 'sssBacklight', valueEl: 'a-sss-backlight-value', default: 0.5, decimals: 2 },
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

    // SSS color picker for Planet A
    const sssColorA = document.getElementById('a-sss-color');
    if (sssColorA) {
        sssColorA.value = planetParamsA.sssColor;
        sssColorA.addEventListener('input', () => {
            planetParamsA.sssColor = sssColorA.value;
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
            // Reset SSS color picker
            planetParamsA.sssColor = '#0d578c';
            const sssColorReset = document.getElementById('a-sss-color');
            if (sssColorReset) sssColorReset.value = '#0d578c';
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
        'sun-glow-intensity': { param: 'glowIntensity', valueEl: 'sun-glow-intensity-value', default: 1.5, decimals: 2 }
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

    const starsSlidersConfig = {
        // Distribution
        'stars-start-distance': { param: 'startDistance', valueEl: 'stars-start-distance-value', default: 0.5, decimals: 1 },
        'stars-end-distance': { param: 'endDistance', valueEl: 'stars-end-distance-value', default: 5.0, decimals: 1 },
        // Appearance
        'particles-size': { param: 'particleSize', valueEl: 'particles-size-value', default: 3.0, decimals: 1 },
        'particles-brightness': { param: 'brightness', valueEl: 'particles-brightness-value', default: 1.0, decimals: 1 }
    };

    // Star color pickers config
    const starsColorConfig = {
        'star-color-cool': { param: 'starColorCool', default: '#aaccff' },
        'star-color-warm': { param: 'starColorWarm', default: '#ffe4b5' },
        'star-color-hot': { param: 'starColorHot', default: '#ffffff' }
    };

    // Initialize star sliders
    Object.entries(starsSlidersConfig).forEach(([sliderId, config]) => {
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

    // Initialize star color pickers
    Object.entries(starsColorConfig).forEach(([pickerId, config]) => {
        const picker = document.getElementById(pickerId);
        if (picker && spaceParticleParams[config.param] !== undefined) {
            picker.value = spaceParticleParams[config.param];
            picker.addEventListener('input', () => {
                spaceParticleParams[config.param] = picker.value;
            });
        }
    });

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
            // Reset star params
            Object.entries(starsSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                spaceParticleParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset star colors
            Object.entries(starsColorConfig).forEach(([pickerId, config]) => {
                const picker = document.getElementById(pickerId);
                spaceParticleParams[config.param] = config.default;
                if (picker) picker.value = config.default;
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
    // SHADER SETTINGS SAVE/LOAD SYSTEM
    // ========================================
    const SETTINGS_STORAGE_KEY = 'shaderSettings_v1';

    // Collect all current settings
    // Uses the PERSISTED_PARAM_OBJECTS registry from core.js
    // To add a new param object to persistence, add its name to window.PERSISTED_PARAM_OBJECTS in core.js
    function getAllSettings() {
        const settings = {
            version: 2,
            timestamp: new Date().toISOString()
        };

        // Use the centralized registry from core.js
        const paramObjects = window.PERSISTED_PARAM_OBJECTS || [];

        // Copy each param object
        paramObjects.forEach(name => {
            const obj = window[name];
            if (obj && typeof obj === 'object') {
                settings[name] = { ...obj };
            }
        });

        return settings;
    }

    // Apply settings to param objects and update UI
    // Uses the PERSISTED_PARAM_OBJECTS registry from core.js
    function applySettings(settings) {
        if (!settings) return;

        // Use the centralized registry from core.js
        const paramObjects = window.PERSISTED_PARAM_OBJECTS || [];

        // Apply each saved object to its corresponding window object
        paramObjects.forEach(name => {
            const savedObj = settings[name];
            const targetObj = window[name];
            if (savedObj && targetObj && typeof targetObj === 'object') {
                Object.keys(savedObj).forEach(key => {
                    if (key in targetObj) {
                        targetObj[key] = savedObj[key];
                    }
                });
            }
        });

        // Legacy support: apply physicsParams if present (maps to orbitParams)
        if (settings.physicsParams && window.orbitParams) {
            Object.keys(settings.physicsParams).forEach(key => {
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
        if (spaceParticleBuffer && gl) {
            respawnStars();
        }
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
        // SSS controls
        updateSlider('a-sss-wrap', planetParamsA.sssWrap, 2);
        updateSlider('a-sss-backlight', planetParamsA.sssBacklight, 1);
        const sssColorAEl = document.getElementById('a-sss-color');
        if (sssColorAEl) sssColorAEl.value = planetParamsA.sssColor;

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

        // Stars sliders
        updateSlider('stars-start-distance', spaceParticleParams.startDistance, 1);
        updateSlider('stars-end-distance', spaceParticleParams.endDistance, 1);
        updateSlider('particles-size', spaceParticleParams.particleSize, 1);
        updateSlider('particles-brightness', spaceParticleParams.brightness, 1);
        // Star color pickers
        const starCoolPicker = document.getElementById('star-color-cool');
        const starWarmPicker = document.getElementById('star-color-warm');
        const starHotPicker = document.getElementById('star-color-hot');
        if (starCoolPicker) starCoolPicker.value = spaceParticleParams.starColorCool;
        if (starWarmPicker) starWarmPicker.value = spaceParticleParams.starColorWarm;
        if (starHotPicker) starHotPicker.value = spaceParticleParams.starColorHot;

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

    // Check if running on dev machine (localhost or file://)
    function isDevMachine() {
        const host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
    }

    // Save to localStorage (only on dev machine)
    function saveToLocalStorage() {
        if (!isDevMachine()) return;
        try {
            const settings = getAllSettings();
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings to localStorage:', e);
        }
    }

    // Load from localStorage (only on dev machine)
    function loadFromLocalStorage() {
        if (!isDevMachine()) return false;
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

// Volumetric light parameters
const volumetricParams = ${JSON.stringify(settings.volumetricParams, null, 4)};

// Space particles parameters
const spaceParticleParams = ${JSON.stringify(settings.spaceParticleParams, null, 4)};

// Orbital system parameters
const orbitParams = ${JSON.stringify(settings.orbitParams, null, 4)};

// Render feature toggles (enable/disable individual renderers)
window.renderToggles = ${JSON.stringify(settings.renderToggles, null, 4)};
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
            { controls: 'particles-controls', resetBtn: 'particles-reset-btn' }
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

    // Respawn stars with current parameters (count, distance)
    function respawnStars() {
        if (!spaceParticleBuffer || !gl) return;

        const newCount = Math.floor(spaceParticleParams.starCount);
        const startDist = spaceParticleParams.startDistance;
        const endDist = spaceParticleParams.endDistance;

        // Reallocate buffer if count changed
        spaceParticleCount = newCount;
        spaceParticleData = new Float32Array(spaceParticleCount * 5);

        for (let i = 0; i < spaceParticleCount; i++) {
            const idx = i * 5;

            // Random direction (uniform on sphere)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);

            // Random distance between startDistance and endDistance
            const dist = startDist + Math.random() * (endDist - startDist);

            spaceParticleData[idx] = x * dist;
            spaceParticleData[idx + 1] = y * dist;
            spaceParticleData[idx + 2] = z * dist;

            // Star brightness (exponential distribution)
            const brightnessRand = Math.random();
            spaceParticleData[idx + 3] = 0.1 + Math.pow(brightnessRand, 3) * 0.9;

            // Color variation
            spaceParticleData[idx + 4] = Math.random();
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, spaceParticleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, spaceParticleData, gl.STATIC_DRAW);

        console.log('Stars respawned: ' + spaceParticleCount + ' stars, distance ' + startDist.toFixed(1) + ' - ' + endDist.toFixed(1));
    }

    // Expose parameter objects globally for settings panel BEFORE loading settings
    // This ensures applySettings() can find and update these objects
    window.spaceParticleParams = spaceParticleParams;
    window.volumetricParams = volumetricParams;

    // Expose functions globally for settings panel
    window.respawnStars = respawnStars;
    window.saveToLocalStorage = saveToLocalStorage;
    window.exportSettings = exportSettings;
    window.exportAsCode = exportAsCode;
    window.importSettings = importSettings;
    window.updateLightFromKelvin = updateLightFromKelvin;

    // Initialize: load saved settings and create buttons
    // Must be called AFTER exposing param objects to window
    loadFromLocalStorage();
    createSettingsButtons();

    // Only start animation if skills graph is visible (battery optimization)
    // Otherwise, event listeners will start it when user navigates to Skills tab
    if (isCanvasVisible()) {
        startAnimation();
    }
})();
