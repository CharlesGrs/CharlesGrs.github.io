// ============================================
// SKILL GRAPH DATA - Skills and orbital configurations
// ============================================

// Skills array - defines all skill nodes with their properties
window.skillGraphData = {
    skills: [
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
    ],

    // Moon orbit configurations - baseRadius is normalized 0-1 (mapped to baseOrbitMin-Max)
    // All moons of the same sun share the solar system's orbital plane tilt
    // Final radius = (baseOrbitMin + baseRadius * (baseOrbitMax - baseOrbitMin)) + (orbitIndex * spacing)
    moonOrbits: {
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
    },

    // Sub-moons: former free floaters now orbit around planets (not suns)
    // They orbit at 1/3 the size/radius of their parent moon
    subMoonOrbits: {
        renderdoc: { radius: 0.035, speed: 0.015, phase: 0, parent: 'directx', tiltX: 0.3, tiltY: -0.2 },
        nsight:    { radius: 0.03, speed: -0.012, phase: Math.PI * 0.5, parent: 'hlsl', tiltX: -0.4, tiltY: 0.35 },
        python:    { radius: 0.04, speed: 0.01, phase: Math.PI, parent: 'niagara', tiltX: 0.2, tiltY: 0.5 },
        threejs:   { radius: 0.038, speed: -0.014, phase: Math.PI * 1.5, parent: 'glsl', tiltX: -0.25, tiltY: -0.4 }
    }
};

// Helper function: Get sun position from solarSystemParams
window.skillGraphData.getSunPosition = function(sunId) {
    var params = window.solarSystemParams[sunId];
    if (!params) return { x: 0, y: 0, z: 0 };

    var spread = orbitParams.sunSpread;
    return {
        x: params.posX * spread,
        y: params.posY * spread,
        z: params.posZ * spread
    };
};

// Helper function: Get orbital tilt for a solar system
window.skillGraphData.getSolarSystemTilt = function(sunId) {
    var params = window.solarSystemParams[sunId];
    if (!params) return { tiltX: 0, tiltY: 0, tiltZ: 0 };
    return {
        tiltX: params.tiltX,
        tiltY: params.tiltY,
        tiltZ: params.tiltZ
    };
};
