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
    let cameraPosX = 0, cameraPosY = 0, cameraPosZ = 1.0;  // Start at Z=1 looking toward origin
    let targetCameraPosX = 0, targetCameraPosY = 0, targetCameraPosZ = 1.0;
    // Camera rotation (pitch = up/down, yaw = left/right)
    // rotY=π means looking in -Z direction (toward origin from Z=1)
    let cameraRotX = 0, cameraRotY = Math.PI;  // Current rotation (pitch, yaw)
    let targetCameraRotX = 0, targetCameraRotY = Math.PI;  // Target rotation
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
    const focusDuration = 3.0;        // Seconds to complete focus transition (slower)
    const focusDistance = 0.35;       // How close to get to the target (in world units, further away)

    // Solar system navigation - smooth travel to a sun
    let isNavigating = false;         // True while camera is traveling to a solar system
    let navTarget = null;             // The sun node being navigated to
    let navTargetId = null;           // The sun ID for getting orbital tilt
    let navPhase = 'look';            // 'look' = turning to face, 'wait' = pause, 'travel' = moving
    let navPhaseTime = 0;             // Time spent in current phase
    const navLookDuration = 1.5;      // Seconds to turn and look at target
    const navWaitDuration = 0.8;      // Seconds to pause before traveling
    const navTravelDuration = 10.0;   // Seconds to travel to target
    const navDistance = 0.6;          // How far to stop from the sun (further)
    let navStartPosX = 0, navStartPosY = 0, navStartPosZ = 0;  // Starting position for travel

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

    // Nebula background (rendered to FBO for planet fog sampling)
    let nebulaProgram = null;
    let nebulaQuadBuffer = null;
    let nebulaFBO = null;
    let nebulaTexture = null;
    let nebulaFBOWidth = 0, nebulaFBOHeight = 0;
    const nebulaResolutionScale = 0.5; // Render nebula at half resolution for performance

    // Simple blit program (copies texture to screen)
    let blitProgram = null;

    // Final compositing FBO and post-process program (for edge fade)
    let finalFBO = null;
    let finalTexture = null;
    let finalFBOWidth = 0, finalFBOHeight = 0;
    let postProcessProgram = null;

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
    // Property names match settings-panel.js controls
    const spaceParticleParams = {
        // Focus distance settings
        focusDistance: 1.15,
        focusRange: 0.22,
        nearBlur: 0.23,
        farBlur: 1,

        // Bokeh effect
        maxBlur: 60,
        aperture: 0.65,
        ringWidth: 0.75,
        ringIntensity: 0.85,

        // Circle quality
        softness: 1,

        // Appearance
        particleSize: 0.5,
        brightness: 0.05,
        lightFalloff: 5.3,
        baseColor: '#00bfe6',

        // Shooting stars (merged for unified persistence)
        shootingChance: 0.087,
        shootingSpeed: 1.5,
        shootingDuration: 2,
        shootingGoldColor: '#e8b923',
        shootingTealColor: '#2dd4bf',

        // Internal
        sphereRadius: 0.35,
        planetZ: 0
    };

    // God rays parameters (UI-controllable)
    const godRaysParams = {
        // Physically-based light scattering
        lightIntensity: 0,
        lightFalloff: 2.2,
        lightScale: 5.9,
        lightSaturation: 1.7,

        // Edge Noise (organic displacement)
        noiseScale: 4,
        noiseStrength: 1,
        noiseOctaves: 1,

        // Self-shadowing with chromatic scattering
        noiseShadow: 0.4,
        shadowOffset: 0.06,
        scatterR: 0.55,
        scatterG: 0.75,
        scatterB: 1
    };

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
        sunProgram.uTime = gl.getUniformLocation(sunProgram, 'uTime');
        sunProgram.uCameraRotX = gl.getUniformLocation(sunProgram, 'uCameraRotX');
        sunProgram.uCameraRotY = gl.getUniformLocation(sunProgram, 'uCameraRotY');
        sunProgram.uCameraPos = gl.getUniformLocation(sunProgram, 'uCameraPos');

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

        // Nebula background program (renders to FBO, sampled by planets for fog)
        const nebulaVertexShader = window.NEBULA_BACKGROUND_VERTEX_SHADER || window.BACKGROUND_VERTEX_SHADER;
        const nebulaFragmentShader = window.NEBULA_BACKGROUND_FRAGMENT_SHADER;
        if (nebulaVertexShader && nebulaFragmentShader) {
            const nbVs = comp(nebulaVertexShader, gl.VERTEX_SHADER);
            const nbFs = comp(nebulaFragmentShader, gl.FRAGMENT_SHADER);
            if (nbVs && nbFs) {
                nebulaProgram = gl.createProgram();
                gl.attachShader(nebulaProgram, nbVs);
                gl.attachShader(nebulaProgram, nbFs);
                gl.linkProgram(nebulaProgram);

                if (gl.getProgramParameter(nebulaProgram, gl.LINK_STATUS)) {
                    nebulaProgram.aPosition = gl.getAttribLocation(nebulaProgram, 'aPosition');
                    nebulaProgram.uTime = gl.getUniformLocation(nebulaProgram, 'uTime');
                    nebulaProgram.uMouse = gl.getUniformLocation(nebulaProgram, 'uMouse');
                    nebulaProgram.uResolution = gl.getUniformLocation(nebulaProgram, 'uResolution');
                    nebulaProgram.uCameraRotX = gl.getUniformLocation(nebulaProgram, 'uCameraRotX');
                    nebulaProgram.uCameraRotY = gl.getUniformLocation(nebulaProgram, 'uCameraRotY');
                    // Light positions and colors
                    nebulaProgram.uLight0 = gl.getUniformLocation(nebulaProgram, 'uLight0');
                    nebulaProgram.uLight1 = gl.getUniformLocation(nebulaProgram, 'uLight1');
                    nebulaProgram.uLight2 = gl.getUniformLocation(nebulaProgram, 'uLight2');
                    nebulaProgram.uLightColor0 = gl.getUniformLocation(nebulaProgram, 'uLightColor0');
                    nebulaProgram.uLightColor1 = gl.getUniformLocation(nebulaProgram, 'uLightColor1');
                    nebulaProgram.uLightColor2 = gl.getUniformLocation(nebulaProgram, 'uLightColor2');
                    nebulaProgram.uLight0Intensity = gl.getUniformLocation(nebulaProgram, 'uLight0Intensity');
                    nebulaProgram.uLight1Intensity = gl.getUniformLocation(nebulaProgram, 'uLight1Intensity');
                    nebulaProgram.uLight2Intensity = gl.getUniformLocation(nebulaProgram, 'uLight2Intensity');
                    // Screen-space light positions (camera-transformed)
                    nebulaProgram.uLight0Screen = gl.getUniformLocation(nebulaProgram, 'uLight0Screen');
                    nebulaProgram.uLight1Screen = gl.getUniformLocation(nebulaProgram, 'uLight1Screen');
                    nebulaProgram.uLight2Screen = gl.getUniformLocation(nebulaProgram, 'uLight2Screen');
                    // Nebula parameters
                    nebulaProgram.uNebulaIntensity = gl.getUniformLocation(nebulaProgram, 'uNebulaIntensity');
                    nebulaProgram.uNebulaScale = gl.getUniformLocation(nebulaProgram, 'uNebulaScale');
                    nebulaProgram.uNebulaDetail = gl.getUniformLocation(nebulaProgram, 'uNebulaDetail');
                    nebulaProgram.uNebulaSpeed = gl.getUniformLocation(nebulaProgram, 'uNebulaSpeed');
                    nebulaProgram.uLightInfluence = gl.getUniformLocation(nebulaProgram, 'uLightInfluence');
                    nebulaProgram.uColorVariation = gl.getUniformLocation(nebulaProgram, 'uColorVariation');
                    nebulaProgram.uFractalIntensity = gl.getUniformLocation(nebulaProgram, 'uFractalIntensity');
                    nebulaProgram.uFractalScale = gl.getUniformLocation(nebulaProgram, 'uFractalScale');
                    nebulaProgram.uFractalSpeed = gl.getUniformLocation(nebulaProgram, 'uFractalSpeed');
                    nebulaProgram.uFractalSaturation = gl.getUniformLocation(nebulaProgram, 'uFractalSaturation');
                    nebulaProgram.uFractalFalloff = gl.getUniformLocation(nebulaProgram, 'uFractalFalloff');
                    nebulaProgram.uVignetteStrength = gl.getUniformLocation(nebulaProgram, 'uVignetteStrength');
                    // Nebula colors
                    nebulaProgram.uNebulaColorPurple = gl.getUniformLocation(nebulaProgram, 'uNebulaColorPurple');
                    nebulaProgram.uNebulaColorCyan = gl.getUniformLocation(nebulaProgram, 'uNebulaColorCyan');
                    nebulaProgram.uNebulaColorBlue = gl.getUniformLocation(nebulaProgram, 'uNebulaColorBlue');
                    nebulaProgram.uNebulaColorGold = gl.getUniformLocation(nebulaProgram, 'uNebulaColorGold');
                    // God rays parameters
                    nebulaProgram.uGodRaysIntensity = gl.getUniformLocation(nebulaProgram, 'uGodRaysIntensity');
                    nebulaProgram.uGodRaysFalloff = gl.getUniformLocation(nebulaProgram, 'uGodRaysFalloff');
                    nebulaProgram.uGodRaysScale = gl.getUniformLocation(nebulaProgram, 'uGodRaysScale');
                    nebulaProgram.uGodRaysSaturation = gl.getUniformLocation(nebulaProgram, 'uGodRaysSaturation');
                    nebulaProgram.uGodRaysNoiseScale = gl.getUniformLocation(nebulaProgram, 'uGodRaysNoiseScale');
                    nebulaProgram.uGodRaysNoiseStrength = gl.getUniformLocation(nebulaProgram, 'uGodRaysNoiseStrength');
                    nebulaProgram.uGodRaysNoiseOctaves = gl.getUniformLocation(nebulaProgram, 'uGodRaysNoiseOctaves');
                    nebulaProgram.uGodRaysShadow = gl.getUniformLocation(nebulaProgram, 'uGodRaysShadow');
                    nebulaProgram.uGodRaysShadowOffset = gl.getUniformLocation(nebulaProgram, 'uGodRaysShadowOffset');
                    nebulaProgram.uGodRaysScatterR = gl.getUniformLocation(nebulaProgram, 'uGodRaysScatterR');
                    nebulaProgram.uGodRaysScatterG = gl.getUniformLocation(nebulaProgram, 'uGodRaysScatterG');
                    nebulaProgram.uGodRaysScatterB = gl.getUniformLocation(nebulaProgram, 'uGodRaysScatterB');

                    // Fullscreen quad buffer for nebula
                    nebulaQuadBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, nebulaQuadBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                        -1, -1,  1, -1,  1, 1,
                        -1, -1,  1, 1,  -1, 1
                    ]), gl.STATIC_DRAW);

                    // Create FBO for nebula background (texture created/resized in render loop)
                    nebulaFBO = gl.createFramebuffer();
                    nebulaTexture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, nebulaTexture);
                    // Use LINEAR filtering for smooth upscaling from reduced resolution
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    // Don't allocate texture or attach to FBO yet - done in render loop when size is known
                    nebulaFBOWidth = 0;
                    nebulaFBOHeight = 0;

                    // Create simple blit program to copy FBO texture to screen
                    // Uses gl_FragCoord for UV to match planet shader sampling exactly
                    const blitVsSource = `
                        attribute vec2 aPosition;
                        void main() {
                            gl_Position = vec4(aPosition, 0.0, 1.0);
                        }
                    `;
                    const blitFsSource = `
                        precision highp float;
                        uniform sampler2D uTexture;
                        uniform vec2 uResolution;
                        void main() {
                            vec2 uv = gl_FragCoord.xy / uResolution;
                            gl_FragColor = texture2D(uTexture, uv);
                        }
                    `;
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

                    // Create post-process program with edge fade
                    const postProcessFsSource = `
                        precision highp float;
                        uniform sampler2D uTexture;
                        uniform vec2 uResolution;
                        uniform float uEdgeFadeSize;
                        void main() {
                            vec2 uv = gl_FragCoord.xy / uResolution;
                            vec4 color = texture2D(uTexture, uv);

                            // Edge fade to background color (#0a0f14)
                            vec3 bgColor = vec3(0.039, 0.059, 0.078);

                            // Calculate distance from edges (0 at edge, 1 at fadeSize distance)
                            float fadeSize = uEdgeFadeSize;
                            float left = smoothstep(0.0, fadeSize, uv.x);
                            float right = smoothstep(0.0, fadeSize, 1.0 - uv.x);
                            float top = smoothstep(0.0, fadeSize, 1.0 - uv.y);
                            float bottom = smoothstep(0.0, fadeSize, uv.y);

                            // Combine all edges
                            float fade = left * right * top * bottom;

                            // Mix to background color at edges
                            gl_FragColor = vec4(mix(bgColor, color.rgb, fade), 1.0);
                        }
                    `;
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
                            postProcessProgram.uEdgeFadeSize = gl.getUniformLocation(postProcessProgram, 'uEdgeFadeSize');
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

                    console.log('Nebula background program initialized with FBO');
                } else {
                    console.error('Nebula program link error:', gl.getProgramInfoLog(nebulaProgram));
                    nebulaProgram = null;
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

        // Orbit line program - simple 2D lines with color and alpha
        const orbitLineVsSource = `
            attribute vec2 aPosition;
            uniform vec2 uResolution;
            void main() {
                vec2 clipSpace = (aPosition / uResolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
            }
        `;
        const orbitLineFsSource = `
            precision mediump float;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = uColor;
            }
        `;
        const olVs = comp(orbitLineVsSource, gl.VERTEX_SHADER);
        const olFs = comp(orbitLineFsSource, gl.FRAGMENT_SHADER);
        if (olVs && olFs) {
            orbitLineProgram = gl.createProgram();
            gl.attachShader(orbitLineProgram, olVs);
            gl.attachShader(orbitLineProgram, olFs);
            gl.linkProgram(orbitLineProgram);

            if (gl.getProgramParameter(orbitLineProgram, gl.LINK_STATUS)) {
                orbitLineProgram.aPosition = gl.getAttribLocation(orbitLineProgram, 'aPosition');
                orbitLineProgram.uResolution = gl.getUniformLocation(orbitLineProgram, 'uResolution');
                orbitLineProgram.uColor = gl.getUniformLocation(orbitLineProgram, 'uColor');
                orbitLineProgram.buf = gl.createBuffer();
                console.log('Orbit line program initialized');
            } else {
                console.error('Orbit line program link error:', gl.getProgramInfoLog(orbitLineProgram));
                orbitLineProgram = null;
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
                spaceParticleProgram.uCameraPos = gl.getUniformLocation(spaceParticleProgram, 'uCameraPos');

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
                // Particles fill a sphere AROUND THE CAMERA so you can travel through them
                const particleSphereRadius = 0.35;
                // Initial camera position (must match cameraPosX/Y/Z initial values)
                const initCamX = 0, initCamY = 0, initCamZ = 1.0;
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
                    // Scale to particle sphere radius and offset by initial camera position
                    spaceParticleData[idx] = initCamX + x * particleSphereRadius;      // x (world units)
                    spaceParticleData[idx + 1] = initCamY + y * particleSphereRadius;  // y (world units)
                    spaceParticleData[idx + 2] = initCamZ + z * particleSphereRadius;  // z (world units)
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

        glReady = true;
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
        if (toggles && !toggles.planets && !toggles.suns && !toggles.spaceParticles && !toggles.godRays) {
            return true; // Return true so canvas fallback isn't used
        }

        gl.clear(gl.COLOR_BUFFER_BIT);

        // Get light data first (needed for nebula, god rays and spheres)
        const lightNodes = nodes.filter(n => n.isLight);
        const light0 = lightNodes[0] || { x: 0, y: 0, lightColor: '#ffaa33' };
        const light1 = lightNodes[1] || { x: 0, y: 0, lightColor: '#9b4dca' };
        const light2 = lightNodes[2] || { x: 0, y: 0, lightColor: '#33ddff' };
        const lc0 = hex2vec(light0.lightColor || '#ffaa33');
        const lc1 = hex2vec(light1.lightColor || '#9b4dca');
        const lc2 = hex2vec(light2.lightColor || '#33ddff');

        // Compute screen-space light positions (camera-transformed) for nebula god rays
        // Use WebGL canvas dimensions (CSS pixels, not device pixels)
        const glWidth = glCanvas ? (glCanvas.width / (window.devicePixelRatio || 1)) : width;
        const glHeight = glCanvas ? (glCanvas.height / (window.devicePixelRatio || 1)) : height;
        const computeLightScreenPosEarly = (lx, ly, lz) => {
            const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
            const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
            // Free camera: direct position and rotation-based forward
            const cpx = cameraPosX, cpy = cameraPosY, cpz = cameraPosZ;
            const fx = sry * crx, fy = -srx, fz = cry * crx;
            const rx = cry, rz = -sry;
            const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
            const ws = 1.0 / glWidth;
            const scx = glWidth * 0.5;
            const scy = glHeight * 0.5;
            const wx = (lx - scx) * ws, wy = -(ly - scy) * ws, wz = lz || 0;
            const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
            const zd = tx * fx + ty * fy + tz * fz;
            if (zd < 0.01) return { x: scx, y: scy };
            const ps = 1.0 / zd;
            const px = (tx * rx + tz * rz) * ps;
            const py = (tx * ux + ty * uy + tz * uz) * ps;
            return { x: scx + px * glWidth, y: scy - py * glWidth };
        };
        const screenLight0 = computeLightScreenPosEarly(light0.x, light0.y, light0.z);
        const screenLight1 = computeLightScreenPosEarly(light1.x, light1.y, light1.z);
        const screenLight2 = computeLightScreenPosEarly(light2.x, light2.y, light2.z);

        // ========================================
        // RENDER NEBULA BACKGROUND TO FBO
        // ========================================
        const nebulaEnabled = !window.renderToggles || window.renderToggles.nebula !== false;
        // Use actual canvas pixel dimensions (with DPR) for full resolution
        const canvasWidth = glCanvas.width;
        const canvasHeight = glCanvas.height;
        // Nebula FBO uses reduced resolution for performance
        const fboWidth = Math.floor(canvasWidth * nebulaResolutionScale);
        const fboHeight = Math.floor(canvasHeight * nebulaResolutionScale);

        // Resize final FBO if needed (always, even when nebula disabled)
        if (finalFBO && finalTexture && canvasWidth > 0 && canvasHeight > 0) {
            if (finalFBOWidth !== canvasWidth || finalFBOHeight !== canvasHeight) {
                finalFBOWidth = canvasWidth;
                finalFBOHeight = canvasHeight;
                gl.bindTexture(gl.TEXTURE_2D, finalTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasWidth, canvasHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, finalFBO);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, finalTexture, 0);
            }
            // Start rendering to final FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, finalFBO);
            gl.viewport(0, 0, canvasWidth, canvasHeight);
            // Clear with background color
            gl.clearColor(0.039, 0.059, 0.078, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        // Skip if canvas has no valid size yet
        if (nebulaEnabled && nebulaProgram && nebulaFBO && fboWidth > 0 && fboHeight > 0) {
            // Resize FBO if needed (use scaled resolution)
            if (nebulaFBOWidth !== fboWidth || nebulaFBOHeight !== fboHeight) {
                nebulaFBOWidth = fboWidth;
                nebulaFBOHeight = fboHeight;
                // Allocate texture with scaled size
                gl.bindTexture(gl.TEXTURE_2D, nebulaTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fboWidth, fboHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                // Attach texture to FBO
                gl.bindFramebuffer(gl.FRAMEBUFFER, nebulaFBO);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, nebulaTexture, 0);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }

            // Render to FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, nebulaFBO);
            gl.viewport(0, 0, fboWidth, fboHeight);
            gl.disable(gl.BLEND);  // Disable blend so we get raw RGB values, not premultiplied
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.useProgram(nebulaProgram);
            gl.uniform1f(nebulaProgram.uTime, time);
            gl.uniform2f(nebulaProgram.uMouse, mouseScreenX / width, 1.0 - mouseScreenY / height);
            gl.uniform2f(nebulaProgram.uResolution, fboWidth, fboHeight);
            gl.uniform1f(nebulaProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(nebulaProgram.uCameraRotY, cameraRotY);
            // Light positions (world space)
            gl.uniform2f(nebulaProgram.uLight0, light0.x, light0.y);
            gl.uniform2f(nebulaProgram.uLight1, light1.x, light1.y);
            gl.uniform2f(nebulaProgram.uLight2, light2.x, light2.y);
            gl.uniform3f(nebulaProgram.uLightColor0, lc0[0], lc0[1], lc0[2]);
            gl.uniform3f(nebulaProgram.uLightColor1, lc1[0], lc1[1], lc1[2]);
            gl.uniform3f(nebulaProgram.uLightColor2, lc2[0], lc2[1], lc2[2]);
            gl.uniform1f(nebulaProgram.uLight0Intensity, lightParams.light0Intensity);
            gl.uniform1f(nebulaProgram.uLight1Intensity, lightParams.light1Intensity);
            gl.uniform1f(nebulaProgram.uLight2Intensity, lightParams.light2Intensity);
            // Screen-space light positions (for god rays)
            // Multiply by DPR and resolution scale to convert to FBO pixel coordinates
            const dpr = window.devicePixelRatio || 1;
            const lightScale = dpr * nebulaResolutionScale;
            gl.uniform2f(nebulaProgram.uLight0Screen, screenLight0.x * lightScale, screenLight0.y * lightScale);
            gl.uniform2f(nebulaProgram.uLight1Screen, screenLight1.x * lightScale, screenLight1.y * lightScale);
            gl.uniform2f(nebulaProgram.uLight2Screen, screenLight2.x * lightScale, screenLight2.y * lightScale);
            // Nebula parameters
            gl.uniform1f(nebulaProgram.uNebulaIntensity, nebulaParams.intensity);
            gl.uniform1f(nebulaProgram.uNebulaScale, nebulaParams.scale);
            gl.uniform1f(nebulaProgram.uNebulaDetail, nebulaParams.detail);
            gl.uniform1f(nebulaProgram.uNebulaSpeed, nebulaParams.speed);
            gl.uniform1f(nebulaProgram.uLightInfluence, nebulaParams.lightInfluence);
            gl.uniform1f(nebulaProgram.uColorVariation, nebulaParams.colorVariation);
            gl.uniform1f(nebulaProgram.uFractalIntensity, nebulaParams.fractalIntensity);
            gl.uniform1f(nebulaProgram.uFractalScale, nebulaParams.fractalScale);
            gl.uniform1f(nebulaProgram.uFractalSpeed, nebulaParams.fractalSpeed);
            gl.uniform1f(nebulaProgram.uFractalSaturation, nebulaParams.fractalSaturation);
            gl.uniform1f(nebulaProgram.uFractalFalloff, nebulaParams.fractalFalloff);
            gl.uniform1f(nebulaProgram.uVignetteStrength, nebulaParams.vignetteStrength);
            // Nebula colors
            gl.uniform3f(nebulaProgram.uNebulaColorPurple, nebulaParams.colorPurple[0], nebulaParams.colorPurple[1], nebulaParams.colorPurple[2]);
            gl.uniform3f(nebulaProgram.uNebulaColorCyan, nebulaParams.colorCyan[0], nebulaParams.colorCyan[1], nebulaParams.colorCyan[2]);
            gl.uniform3f(nebulaProgram.uNebulaColorBlue, nebulaParams.colorBlue[0], nebulaParams.colorBlue[1], nebulaParams.colorBlue[2]);
            gl.uniform3f(nebulaProgram.uNebulaColorGold, nebulaParams.colorGold[0], nebulaParams.colorGold[1], nebulaParams.colorGold[2]);
            // God rays parameters
            if (window.godRaysParams) {
                gl.uniform1f(nebulaProgram.uGodRaysIntensity, window.godRaysParams.lightIntensity || 1.2);
                gl.uniform1f(nebulaProgram.uGodRaysFalloff, window.godRaysParams.lightFalloff || 2.0);
                gl.uniform1f(nebulaProgram.uGodRaysScale, window.godRaysParams.lightScale || 3.0);
                gl.uniform1f(nebulaProgram.uGodRaysSaturation, window.godRaysParams.lightSaturation || 1.8);
                gl.uniform1f(nebulaProgram.uGodRaysNoiseScale, window.godRaysParams.noiseScale || 4.0);
                gl.uniform1f(nebulaProgram.uGodRaysNoiseStrength, window.godRaysParams.noiseStrength || 0.12);
                gl.uniform1f(nebulaProgram.uGodRaysNoiseOctaves, window.godRaysParams.noiseOctaves || 0.5);
                gl.uniform1f(nebulaProgram.uGodRaysShadow, window.godRaysParams.noiseShadow || 0.5);
                gl.uniform1f(nebulaProgram.uGodRaysShadowOffset, window.godRaysParams.shadowOffset || 0.3);
                gl.uniform1f(nebulaProgram.uGodRaysScatterR, window.godRaysParams.scatterR || 0.3);
                gl.uniform1f(nebulaProgram.uGodRaysScatterG, window.godRaysParams.scatterG || 0.6);
                gl.uniform1f(nebulaProgram.uGodRaysScatterB, window.godRaysParams.scatterB || 1.0);
            }

            // Draw fullscreen quad
            gl.bindBuffer(gl.ARRAY_BUFFER, nebulaQuadBuffer);
            gl.enableVertexAttribArray(nebulaProgram.aPosition);
            gl.vertexAttribPointer(nebulaProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(nebulaProgram.aPosition);

            // Switch back to final FBO at full resolution
            gl.bindFramebuffer(gl.FRAMEBUFFER, finalFBO);
            gl.viewport(0, 0, canvasWidth, canvasHeight);

            // Blit nebula FBO texture to final FBO (upscaled from reduced resolution)
            gl.useProgram(blitProgram);
            gl.uniform2f(blitProgram.uResolution, canvasWidth, canvasHeight);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, nebulaTexture);
            gl.uniform1i(blitProgram.uTexture, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, nebulaQuadBuffer);
            gl.enableVertexAttribArray(blitProgram.aPosition);
            gl.vertexAttribPointer(blitProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(blitProgram.aPosition);
            gl.enable(gl.BLEND);
        }

        // Export light data globally (legacy, for any remaining external uses)
        window.globalLights.light0 = { x: light0.x, y: light0.y, color: lc0, intensity: lightParams.light0Intensity };
        window.globalLights.light1 = { x: light1.x, y: light1.y, color: lc1, intensity: lightParams.light1Intensity };
        window.globalLights.light2 = { x: light2.x, y: light2.y, color: lc2, intensity: lightParams.light2Intensity };
        window.globalLights.resolution = { width: width, height: height };

        // Particle simulation (run once per frame, not per render pass)
        // Particles fill a sphere AROUND THE CAMERA so you can travel through them
        // Skip particle simulation entirely if particles are disabled
        const particleSphereRadius = 0.35;
        const particlesEnabled = !window.renderToggles || window.renderToggles.spaceParticles !== false;
        if (particlesEnabled && spaceParticleProgram && spaceParticleData) {
            const deltaTime = Math.min(time - spaceParticleLastTime, 0.033);
            spaceParticleLastTime = time;

            // Get current camera position
            const camX = cameraPosX;
            const camY = cameraPosY;
            const camZ = cameraPosZ;

            // Update existing shooting stars
            for (let s = shootingStars.length - 1; s >= 0; s--) {
                const star = shootingStars[s];
                star.progress += deltaTime / spaceParticleParams.shootingDuration;

                if (star.progress >= 1.0) {
                    // Shooting star finished - reset particle to random position around camera
                    const idx = star.originalIdx * 4;
                    let rx, ry, rz;
                    do {
                        rx = (Math.random() * 2 - 1);
                        ry = (Math.random() * 2 - 1);
                        rz = (Math.random() * 2 - 1);
                    } while (rx * rx + ry * ry + rz * rz > 1);
                    spaceParticleData[idx] = camX + rx * particleSphereRadius;
                    spaceParticleData[idx + 1] = camY + ry * particleSphereRadius;
                    spaceParticleData[idx + 2] = camZ + rz * particleSphereRadius;
                    spaceParticleData[idx + 3] = Math.random(); // Reset to normal particle
                    shootingStars.splice(s, 1);
                    continue;
                }

                // Move shooting star fast in its direction
                const idx = star.originalIdx * 4;
                const speed = spaceParticleParams.shootingSpeed * deltaTime * (1.0 - star.progress * 0.5); // Slow down as it fades
                spaceParticleData[idx] += star.vx * speed;
                spaceParticleData[idx + 1] += star.vy * speed;
                spaceParticleData[idx + 2] += star.vz * speed;

                // Encode type (1 or 2) + progress as the life value
                // type.progress format (e.g., 1.35 = gold at 35% progress)
                spaceParticleData[idx + 3] = star.type + star.progress;
            }

            // Randomly spawn new shooting stars (very rare)
            if (Math.random() < spaceParticleParams.shootingChance && shootingStars.length < 5) {
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

                // Calculate position relative to camera
                const relX = x - camX;
                const relY = y - camY;
                const relZ = z - camZ;

                // Distance from camera for depth-based effects
                const dist = Math.sqrt(relX * relX + relY * relY + relZ * relZ);
                const distNorm = Math.min(dist / particleSphereRadius, 1.0); // 0 = center, 1 = edge

                // Speed based on distance from camera (edge particles orbit slower)
                const speedFactor = 0.3 + (1 - distNorm) * 0.7;

                // Orbital drift around camera position (creates swirling effect)
                const phase = i * 0.1;
                // Tangential velocity (orbit around camera's Y axis primarily)
                const orbitSpeed = 0.0002 * speedFactor;
                const tangentX = -relZ * orbitSpeed;
                const tangentZ = relX * orbitSpeed;
                // Add some turbulence
                const turbX = Math.sin(time * 0.3 + phase + relY * 10) * 0.00005;
                const turbY = Math.cos(time * 0.25 + phase + relX * 10) * 0.00004;
                const turbZ = Math.sin(time * 0.2 + phase + relZ * 10) * 0.00005;

                // Apply movement
                x += (tangentX + turbX) * 60 * deltaTime;
                y += turbY * 60 * deltaTime;
                z += (tangentZ + turbZ) * 60 * deltaTime;

                // Calculate new distance from camera
                const newRelX = x - camX;
                const newRelY = y - camY;
                const newRelZ = z - camZ;
                const newDist = Math.sqrt(newRelX * newRelX + newRelY * newRelY + newRelZ * newRelZ);

                // Keep particles inside sphere around camera
                // Immediately respawn any particle outside the sphere
                if (newDist > particleSphereRadius) {
                    // Respawn at random position in sphere around camera
                    let rx, ry, rz;
                    do {
                        rx = (Math.random() * 2 - 1);
                        ry = (Math.random() * 2 - 1);
                        rz = (Math.random() * 2 - 1);
                    } while (rx * rx + ry * ry + rz * rz > 1);
                    // Bias toward sphere edges for better depth distribution
                    const edgeBias = 0.3 + Math.random() * 0.7;
                    x = camX + rx * particleSphereRadius * edgeBias;
                    y = camY + ry * particleSphereRadius * edgeBias;
                    z = camZ + rz * particleSphereRadius * edgeBias;
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
            gl.uniform1f(spaceParticleProgram.uTime, time);

            // DoF uniforms
            gl.uniform1f(spaceParticleProgram.uFocusDistance, spaceParticleParams.focusDistance);
            gl.uniform1f(spaceParticleProgram.uFocusRange, spaceParticleParams.focusRange);
            gl.uniform1f(spaceParticleProgram.uNearBlurDist, spaceParticleParams.nearBlur);
            gl.uniform1f(spaceParticleProgram.uFarBlurDist, spaceParticleParams.farBlur);
            gl.uniform1f(spaceParticleProgram.uMaxBlurSize, spaceParticleParams.maxBlur);
            gl.uniform1f(spaceParticleProgram.uApertureSize, spaceParticleParams.aperture);

            // Particle appearance uniforms
            gl.uniform1f(spaceParticleProgram.uParticleSize, spaceParticleParams.particleSize);
            gl.uniform1f(spaceParticleProgram.uBrightness, spaceParticleParams.brightness);
            gl.uniform1f(spaceParticleProgram.uSphereRadius, spaceParticleParams.sphereRadius);

            // Render control uniforms
            gl.uniform1f(spaceParticleProgram.uPlanetZ, spaceParticleParams.planetZ);
            gl.uniform1f(spaceParticleProgram.uRenderPass, pass);
            gl.uniform1f(spaceParticleProgram.uCameraRotX, cameraRotX);
            gl.uniform1f(spaceParticleProgram.uCameraRotY, cameraRotY);
            gl.uniform3f(spaceParticleProgram.uCameraPos, cameraPosX, cameraPosY, cameraPosZ);

            // Fragment shader uniforms
            gl.uniform1f(spaceParticleProgram.uCircleSoftness, spaceParticleParams.softness);
            gl.uniform1f(spaceParticleProgram.uBokehRingWidth, spaceParticleParams.ringWidth);
            gl.uniform1f(spaceParticleProgram.uBokehRingIntensity, spaceParticleParams.ringIntensity);
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
            const goldRGB = hex2vec(spaceParticleParams.shootingGoldColor);
            const tealRGB = hex2vec(spaceParticleParams.shootingTealColor);
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

        // Render orbit lines (behind planets) using WebGL
        if (orbitLineProgram && orbitParams.showOrbits >= 1 && (!window.renderToggles || window.renderToggles.orbits !== false)) {
            gl.useProgram(orbitLineProgram);
            gl.uniform2f(orbitLineProgram.uResolution, glCanvas.width, glCanvas.height);

            // Build orbit line vertices for all moons
            const segments = 96;
            const minDim = Math.min(width, height);
            const worldToProjectScale = minDim / width;
            const dpr = window.devicePixelRatio || 1;

            // Helper to project world coords to screen
            const projectToScreen = (wx, wy, wz) => {
                const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
                const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
                const cpx = cameraPosX, cpy = cameraPosY, cpz = cameraPosZ;
                const fx = sry * crx, fy = -srx, fz = cry * crx;
                const rx = cry, rz = -sry;
                const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
                const screenCenterX = width * 0.5;
                const screenCenterY = height * 0.5;
                const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
                const zd = tx * fx + ty * fy + tz * fz;
                if (zd < 0.01) return null;
                const ps = 1.0 / zd;
                const px = (tx * rx + tz * rz) * ps;
                const py = (tx * ux + ty * uy + tz * uz) * ps;
                return { x: (screenCenterX + px * width) * dpr, y: (screenCenterY - py * width) * dpr };
            };

            // Group orbits by parent color for batched rendering
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

                const radius = node.orbitRadiusWorld * worldToProjectScale;
                const centerWX = (parent.worldX || 0) * worldToProjectScale;
                const centerWY = (parent.worldY || 0) * worldToProjectScale;
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
                        orbitsByColor[hexColor].push(prevPoint.x, prevPoint.y, projected.x, projected.y);
                    }
                    prevPoint = projected;
                }
            });

            // Render each color batch
            const baseAlpha = orbitParams.orbitLineOpacity * globalFadeIn;
            gl.bindBuffer(gl.ARRAY_BUFFER, orbitLineProgram.buf);
            gl.enableVertexAttribArray(orbitLineProgram.aPosition);

            for (const hexColor in orbitsByColor) {
                const verts = orbitsByColor[hexColor];
                if (verts.length === 0) continue;

                // Parse hex color
                const r = parseInt(hexColor.slice(1, 3), 16) / 255;
                const g = parseInt(hexColor.slice(3, 5), 16) / 255;
                const b = parseInt(hexColor.slice(5, 7), 16) / 255;

                gl.uniform4f(orbitLineProgram.uColor, r, g, b, baseAlpha);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
                gl.vertexAttribPointer(orbitLineProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.LINES, 0, verts.length / 2);
            }

            gl.disableVertexAttribArray(orbitLineProgram.aPosition);
        }

        // Compute light screen positions (after camera transform) for god rays
        // Same math as vertex shader for sphere program
        const computeLightScreenPos = (lx, ly, lz) => {
            const crx = Math.cos(cameraRotX), srx = Math.sin(cameraRotX);
            const cry = Math.cos(cameraRotY), sry = Math.sin(cameraRotY);
            // Free camera: direct position and rotation-based forward
            const cpx = cameraPosX, cpy = cameraPosY, cpz = cameraPosZ;
            const fx = sry * crx, fy = -srx, fz = cry * crx;
            const rx = cry, rz = -sry;
            const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
            const ws = 1.0 / width;
            const scx = width * 0.5;
            const scy = height * 0.5;
            const wx = (lx - scx) * ws, wy = -(ly - scy) * ws, wz = lz || 0;
            const tx = wx - cpx, ty = wy - cpy, tz = wz - cpz;
            const zd = tx * fx + ty * fy + tz * fz;
            if (zd < 0.01) return { x: scx, y: scy };
            const ps = 1.0 / zd;
            const px = (tx * rx + tz * rz) * ps;
            const py = (tx * ux + ty * uy + tz * uz) * ps;
            return { x: scx + px * width, y: scy - py * width };
        };
        const godRayLight0 = computeLightScreenPos(light0.x, light0.y, light0.z);
        const godRayLight1 = computeLightScreenPos(light1.x, light1.y, light1.z);
        const godRayLight2 = computeLightScreenPos(light2.x, light2.y, light2.z);

        // Export screen-space light positions for nebula background god rays
        window.globalLights.light0.screenX = godRayLight0.x;
        window.globalLights.light0.screenY = godRayLight0.y;
        window.globalLights.light1.screenX = godRayLight1.x;
        window.globalLights.light1.screenY = godRayLight1.y;
        window.globalLights.light2.screenX = godRayLight2.x;
        window.globalLights.light2.screenY = godRayLight2.y;

        // Use premultiplied alpha blending for planets/suns
        // This properly composites over transparent canvas without darkening
        // RGB: src + dst * (1 - srcAlpha), Alpha: src + dst * (1 - srcAlpha)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // Render spheres (planets and suns)
        gl.useProgram(sphereProgram);
        // uRes in CSS pixels (for vertex calculations), uFBORes in actual pixels (for texture sampling)
        gl.uniform2f(sphereProgram.uRes, width, height);
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
        if (nebulaTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, nebulaTexture);
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
                    gl.uniform1f(sunProgram.uTime, time);
                    gl.uniform1f(sunProgram.uCameraRotX, cameraRotX);
                    gl.uniform1f(sunProgram.uCameraRotY, cameraRotY);
                    gl.uniform3f(sunProgram.uCameraPos, cameraPosX, cameraPosY, cameraPosZ);

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

        // PASS 2: Render NEAR particles (in front of planets, z >= planetZ)
        if (!window.renderToggles || window.renderToggles.spaceParticles !== false) {
            renderParticles(2);
        }

        // FINAL PASS: Blit final FBO to screen with post-process edge fade
        if (finalFBO && postProcessProgram && finalTexture) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvasWidth, canvasHeight);
            gl.disable(gl.BLEND);

            gl.useProgram(postProcessProgram);
            gl.uniform2f(postProcessProgram.uResolution, canvasWidth, canvasHeight);
            gl.uniform1f(postProcessProgram.uEdgeFadeSize, nebulaParams.edgeFadeSize || 0.15);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, finalTexture);
            gl.uniform1i(postProcessProgram.uTexture, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, nebulaQuadBuffer);
            gl.enableVertexAttribArray(postProcessProgram.aPosition);
            gl.vertexAttribPointer(postProcessProgram.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disableVertexAttribArray(postProcessProgram.aPosition);

            gl.enable(gl.BLEND);
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

            // Perspective scale (1/distance)
            const nodeScale = 1.0 / zDist;

            // Project node position onto screen (dot with right and up)
            const projX = (toNodeX * camRightX + toNodeY * camRightY + toNodeZ * camRightZ) * nodeScale;
            const projY = (toNodeX * camUpX + toNodeY * camUpY + toNodeZ * camUpZ) * nodeScale;

            // Convert back to screen coordinates
            node.renderX = screenCenterX + projX * width;
            node.renderY = screenCenterY - projY * width;  // Flip Y back
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
            return { x: screenCenterX + px * width, y: screenCenterY - py * width };
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
        // With camera-distance zoom, screen coords directly map to world coords
        // for objects at Z=0 (the main interaction plane)
        // The zoom effect comes from camera being closer, not from scaling
        return { x: sx, y: sy };
    }

    canvas.addEventListener('mousedown', (e) => {
        // Only handle left click
        if (e.button !== 0) return;

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
            // Clicking on a node: start camera focus transition
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
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        mouseScreenX = screenX;
        mouseScreenY = screenY;

        // Check if tapping on a node - start focus transition
        const tappedNode = getNodeAt(screenX, screenY);
        if (tappedNode) {
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
        'particles-focus-distance': { param: 'focusDistance', valueEl: 'particles-focus-distance-value', default: 0.2, decimals: 2 },
        'particles-focus-range': { param: 'focusRange', valueEl: 'particles-focus-range-value', default: 0.15, decimals: 2 },
        'particles-near-blur': { param: 'nearBlur', valueEl: 'particles-near-blur-value', default: 0.1, decimals: 2 },
        'particles-far-blur': { param: 'farBlur', valueEl: 'particles-far-blur-value', default: 0.4, decimals: 2 },
        // Bokeh effect
        'particles-max-blur': { param: 'maxBlur', valueEl: 'particles-max-blur-value', default: 25.0, decimals: 1 },
        'particles-aperture': { param: 'aperture', valueEl: 'particles-aperture-value', default: 1.0, decimals: 2 },
        'particles-ring-width': { param: 'ringWidth', valueEl: 'particles-ring-width-value', default: 0.5, decimals: 2 },
        'particles-ring-intensity': { param: 'ringIntensity', valueEl: 'particles-ring-intensity-value', default: 0.8, decimals: 2 },
        // Circle quality
        'particles-softness': { param: 'softness', valueEl: 'particles-softness-value', default: 0.3, decimals: 2 },
        // Appearance
        'particles-size': { param: 'particleSize', valueEl: 'particles-size-value', default: 2.0, decimals: 2 },
        'particles-brightness': { param: 'brightness', valueEl: 'particles-brightness-value', default: 1.0, decimals: 2 },
        'particles-light-falloff': { param: 'lightFalloff', valueEl: 'particles-light-falloff-value', default: 3.0, decimals: 2 }
    };

    // Shooting star sliders config (now uses spaceParticleParams)
    const shootingStarSlidersConfig = {
        'shooting-chance': { param: 'shootingChance', valueEl: 'shooting-chance-value', default: 0.0003, decimals: 3 },
        'shooting-speed': { param: 'shootingSpeed', valueEl: 'shooting-speed-value', default: 0.4, decimals: 2 },
        'shooting-duration': { param: 'shootingDuration', valueEl: 'shooting-duration-value', default: 0.8, decimals: 2 }
    };

    // Shooting star color pickers config (now uses spaceParticleParams)
    const shootingStarColorConfig = {
        'shooting-gold-color': { param: 'shootingGoldColor', default: '#e8b923' },
        'shooting-teal-color': { param: 'shootingTealColor', default: '#2dd4bf' }
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

    // Initialize shooting star sliders (now uses spaceParticleParams)
    Object.entries(shootingStarSlidersConfig).forEach(([sliderId, config]) => {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(config.valueEl);
        if (slider && valueEl && spaceParticleParams[config.param] !== undefined) {
            slider.value = spaceParticleParams[config.param];
            valueEl.textContent = spaceParticleParams[config.param].toFixed(config.decimals);

            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                spaceParticleParams[config.param] = value;
                valueEl.textContent = value.toFixed(config.decimals);
            });
        }
    });

    // Initialize shooting star color pickers (now uses spaceParticleParams)
    Object.entries(shootingStarColorConfig).forEach(([pickerId, config]) => {
        const picker = document.getElementById(pickerId);
        if (picker && spaceParticleParams[config.param] !== undefined) {
            picker.value = spaceParticleParams[config.param];
            picker.addEventListener('input', () => {
                spaceParticleParams[config.param] = picker.value;
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
            // Reset shooting star sliders (now uses spaceParticleParams)
            Object.entries(shootingStarSlidersConfig).forEach(([sliderId, config]) => {
                const slider = document.getElementById(sliderId);
                const valueEl = document.getElementById(config.valueEl);
                spaceParticleParams[config.param] = config.default;
                if (slider) slider.value = config.default;
                if (valueEl) valueEl.textContent = config.default.toFixed(config.decimals);
            });
            // Reset shooting star colors (now uses spaceParticleParams)
            Object.entries(shootingStarColorConfig).forEach(([pickerId, config]) => {
                const picker = document.getElementById(pickerId);
                spaceParticleParams[config.param] = config.default;
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
        // Physically-based light scattering
        'godrays-light-intensity': { param: 'lightIntensity', valueEl: 'godrays-light-intensity-value', default: 1.2, decimals: 2 },
        'godrays-light-falloff': { param: 'lightFalloff', valueEl: 'godrays-light-falloff-value', default: 2.0, decimals: 1 },
        'godrays-light-scale': { param: 'lightScale', valueEl: 'godrays-light-scale-value', default: 3.0, decimals: 1 },
        'godrays-light-saturation': { param: 'lightSaturation', valueEl: 'godrays-light-saturation-value', default: 1.8, decimals: 1 },
        // Edge Noise
        'godrays-noise-scale': { param: 'noiseScale', valueEl: 'godrays-noise-scale-value', default: 4.0, decimals: 1 },
        'godrays-noise-strength': { param: 'noiseStrength', valueEl: 'godrays-noise-strength-value', default: 0.12, decimals: 2 },
        'godrays-noise-octaves': { param: 'noiseOctaves', valueEl: 'godrays-noise-octaves-value', default: 0.5, decimals: 2 },
        // Self-shadowing
        'godrays-noise-shadow': { param: 'noiseShadow', valueEl: 'godrays-noise-shadow-value', default: 0.5, decimals: 2 },
        'godrays-shadow-offset': { param: 'shadowOffset', valueEl: 'godrays-shadow-offset-value', default: 0.3, decimals: 2 },
        // Chromatic scattering
        'godrays-scatter-r': { param: 'scatterR', valueEl: 'godrays-scatter-r-value', default: 0.3, decimals: 2 },
        'godrays-scatter-g': { param: 'scatterG', valueEl: 'godrays-scatter-g-value', default: 0.6, decimals: 2 },
        'godrays-scatter-b': { param: 'scatterB', valueEl: 'godrays-scatter-b-value', default: 1.0, decimals: 2 }
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

        // Particles sliders
        updateSlider('particles-focus-distance', spaceParticleParams.focusDistance, 2);
        updateSlider('particles-focus-range', spaceParticleParams.focusRange, 2);
        updateSlider('particles-near-blur', spaceParticleParams.nearBlur, 2);
        updateSlider('particles-far-blur', spaceParticleParams.farBlur, 2);
        updateSlider('particles-max-blur', spaceParticleParams.maxBlur, 0);
        updateSlider('particles-aperture', spaceParticleParams.aperture, 2);
        updateSlider('particles-ring-width', spaceParticleParams.ringWidth, 2);
        updateSlider('particles-ring-intensity', spaceParticleParams.ringIntensity, 2);
        updateSlider('particles-softness', spaceParticleParams.softness, 2);
        updateSlider('particles-size', spaceParticleParams.particleSize, 1);
        updateSlider('particles-brightness', spaceParticleParams.brightness, 2);
        updateSlider('particles-light-falloff', spaceParticleParams.lightFalloff, 1);
        // Particles base color picker
        const particlesBaseColorPicker = document.getElementById('particles-base-color');
        if (particlesBaseColorPicker) particlesBaseColorPicker.value = spaceParticleParams.baseColor;

        // Shooting star sliders
        updateSlider('shooting-chance', spaceParticleParams.shootingChance, 3);
        updateSlider('shooting-speed', spaceParticleParams.shootingSpeed, 2);
        updateSlider('shooting-duration', spaceParticleParams.shootingDuration, 2);
        // Shooting star color pickers
        const shootingGoldPicker = document.getElementById('shooting-gold-color');
        const shootingTealPicker = document.getElementById('shooting-teal-color');
        if (shootingGoldPicker) shootingGoldPicker.value = spaceParticleParams.shootingGoldColor;
        if (shootingTealPicker) shootingTealPicker.value = spaceParticleParams.shootingTealColor;

        // God rays sliders
        updateSlider('godrays-light-intensity', godRaysParams.lightIntensity, 2);
        updateSlider('godrays-light-falloff', godRaysParams.lightFalloff, 1);
        updateSlider('godrays-light-scale', godRaysParams.lightScale, 1);
        updateSlider('godrays-light-saturation', godRaysParams.lightSaturation, 1);
        updateSlider('godrays-noise-scale', godRaysParams.noiseScale, 1);
        updateSlider('godrays-noise-strength', godRaysParams.noiseStrength, 2);
        updateSlider('godrays-noise-octaves', godRaysParams.noiseOctaves, 2);
        updateSlider('godrays-noise-shadow', godRaysParams.noiseShadow, 2);
        updateSlider('godrays-shadow-offset', godRaysParams.shadowOffset, 2);
        updateSlider('godrays-scatter-r', godRaysParams.scatterR, 2);
        updateSlider('godrays-scatter-g', godRaysParams.scatterG, 2);
        updateSlider('godrays-scatter-b', godRaysParams.scatterB, 2);

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

    // Expose parameter objects globally for settings panel BEFORE loading settings
    // This ensures applySettings() can find and update these objects
    window.spaceParticleParams = spaceParticleParams;
    window.shootingStarParams = shootingStarParams;
    window.godRaysParams = godRaysParams;

    // Expose functions globally for settings panel
    window.saveToLocalStorage = saveToLocalStorage;
    window.exportSettings = exportSettings;
    window.exportAsCode = exportAsCode;
    window.importSettings = importSettings;
    window.updateLightFromKelvin = updateLightFromKelvin;

    // Initialize: load saved settings and create buttons
    // Must be called AFTER exposing param objects to window
    loadFromLocalStorage();
    createSettingsButtons();

    animate();
})();
