// Charles Grassi CV - Main JavaScript
// All interactive functionality for the portfolio site

// ============================================
// SHADER DEFINITIONS
// ============================================

// Background Aurora Shaders (Three.js)
const backgroundVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const backgroundFragmentShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;

    varying vec2 vUv;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vec2 uv = vUv;
        float noise1 = snoise(uv * 1.5 + uTime * 0.05);
        float noise2 = snoise(uv * 2.5 - uTime * 0.03 + 100.0);
        float noise3 = snoise(uv * 0.8 + uTime * 0.02 + vec2(noise1 * 0.2));
        float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
        vec3 gold = vec3(0.91, 0.73, 0.14);
        vec3 teal = vec3(0.18, 0.83, 0.75);
        vec3 dark = vec3(0.04, 0.06, 0.08);
        float band1 = smoothstep(-0.3, 0.3, combinedNoise);
        float band2 = smoothstep(0.0, 0.6, combinedNoise);
        vec3 color = mix(dark, gold * 0.15, band1 * 0.4);
        color = mix(color, teal * 0.12, band2 * 0.3);
        float mouseDist = length(uv - uMouse);
        float mouseGlow = exp(-mouseDist * 3.0) * 0.08;
        color += teal * mouseGlow;
        float vignette = 1.0 - length(uv - 0.5) * 0.5;
        color *= vignette;
        float alpha = 0.6;
        gl_FragColor = vec4(color, alpha);
    }
`;

const particleVertexShader = `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute float aScale;
    attribute float aSpeed;
    varying float vAlpha;

    void main() {
        vec3 pos = position;
        pos.x += sin(uTime * aSpeed * 0.5 + position.y * 2.0) * 0.02;
        pos.y += mod(uTime * aSpeed * 0.1, 2.0) - 1.0;
        pos.y = mod(pos.y + 1.0, 2.0) - 1.0;
        gl_Position = vec4(pos, 1.0);
        gl_PointSize = aScale * uPixelRatio * 3.0;
        vAlpha = smoothstep(1.0, 0.7, abs(pos.y)) * 0.4;
    }
`;

const particleFragmentShader = `
    varying float vAlpha;
    void main() {
        float dist = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
        vec3 color = mix(vec3(0.91, 0.73, 0.14), vec3(0.18, 0.83, 0.75), 0.5);
        gl_FragColor = vec4(color, alpha);
    }
`;

// Skill Sphere WebGL Shaders
const sphereVertexShader = `
    attribute vec2 aPos;
    attribute vec2 aCenter;
    attribute float aRadius;
    attribute vec3 aColor;
    attribute float aAlpha;
    attribute float aAppear;
    attribute float aGlow;
    attribute float aIndex;
    attribute float aIsLight;
    varying vec2 vUV;
    varying vec2 vCenter;
    varying float vRadius;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vAppear;
    varying float vGlow;
    varying float vIndex;
    varying float vIsLight;
    uniform vec2 uRes;
    void main() {
        vUV = aPos;
        vCenter = aCenter;
        vRadius = aRadius;
        vColor = aColor;
        vAlpha = aAlpha;
        vAppear = aAppear;
        vGlow = aGlow;
        vIndex = aIndex;
        vIsLight = aIsLight;
        vec2 p = aCenter + aPos * aRadius * 3.0;
        vec2 c = (p / uRes) * 2.0 - 1.0;
        gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
    }
`;

const sphereFragmentShader = `
    precision highp float;
    varying vec2 vUV;
    varying vec2 vCenter;
    varying float vRadius;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vAppear;
    varying float vGlow;
    varying float vIndex;
    varying float vIsLight;
    uniform vec2 uRes;
    uniform vec2 uMouse;
    uniform float uTime;
    uniform vec2 uLight0;
    uniform vec2 uLight1;
    uniform vec2 uLight2;
    uniform vec3 uLightColor0;
    uniform vec3 uLightColor1;
    uniform vec3 uLightColor2;

    #define PI 3.14159265

    void main() {
        vec2 uv = vUV;
        float d = length(uv);
        float animOffset = vIndex * 0.5;
        float t = uTime + animOffset;
        float ap = clamp(vAppear, 0.0, 1.0);
        float scaledD = d / max(ap, 0.001);
        float outerFade = 1.0 - smoothstep(1.2, 1.45, scaledD);
        if (outerFade < 0.001) discard;

        float planetRadius = 0.40;
        float atmosphereThickness = 0.65;
        float atmosphereOuter = planetRadius + atmosphereThickness;

        if (vIsLight > 0.5) {
            float coreMask = 1.0 - smoothstep(0.0, 0.5, d);
            float glowMask = 1.0 - smoothstep(0.0, 1.0, d);
            float outerHalo = 0.03 / (d * d + 0.03);
            float pulse = sin(t * 2.0) * 0.5 + 0.5;
            float breathe = 0.85 + pulse * 0.15;
            vec3 emissive = vColor * 1.5;
            vec3 col = vec3(0.0);
            col += emissive * coreMask * 2.0 * breathe;
            col += emissive * glowMask * 0.8;
            col += emissive * outerHalo * 0.6;
            col += vColor * vGlow * 0.5;
            col = col / (col + vec3(0.5));
            float alpha = coreMask * 0.95 + glowMask * 0.5 + outerHalo * 0.4;
            alpha = clamp(alpha, 0.0, 1.0) * outerFade;
            alpha *= smoothstep(0.0, 0.5, ap) * vAlpha;
            gl_FragColor = vec4(col, alpha);
            return;
        }

        float varSeed = vIndex * 1.618;
        vec3 planetColor = vColor;
        float hueShift = sin(varSeed) * 0.1;
        planetColor.r += hueShift;
        planetColor.g += hueShift;
        planetColor.b -= hueShift;
        float satVar = cos(varSeed * 2.3) * 0.5;
        vec3 gray = vec3(dot(planetColor, vec3(0.299, 0.587, 0.114)));
        planetColor = mix(planetColor, gray, .8);
        planetColor *= 0.9 + sin(varSeed * 3.7) * 0.15;

        float planetMask = 1.0 - smoothstep(planetRadius - 0.0002, planetRadius, d);
        float zSq = planetRadius * planetRadius - d * d;
        float z = zSq > 0.0 ? sqrt(zSq) : 0.0;
        vec3 N = d < planetRadius ? normalize(vec3(uv, z)) : vec3(0.0, 0.0, 1.0);
        vec3 V = vec3(0.0, 0.0, 1.0);

        vec3 totalDiffuse = vec3(0.0);
        vec3 totalSpecular = vec3(0.0);
        float totalAttenuation = 0.0;

        vec2 mouseOffset = (uMouse - vCenter);
        vec3 mouseLightPos = vec3(mouseOffset / uRes.x * 4.0, 0.3);
        vec3 mouseL = normalize(mouseLightPos);
        float mouseDist = length(mouseLightPos);
        float mouseAtten = 0.08 / (mouseDist * mouseDist + 0.01);
        mouseAtten = min(mouseAtten, 2.0);
        float mouseNdL = max(dot(N, mouseL), 0.0);
        vec3 mouseH = normalize(mouseL + V);
        float mouseNdH = max(dot(N, mouseH), 0.0);
        totalDiffuse += vec3(1.0) * mouseNdL * mouseAtten;
        totalSpecular += vec3(1.0) * pow(mouseNdH, 32.0) * mouseAtten;
        totalAttenuation += mouseAtten;

        vec2 light0Offset = (uLight0 - vCenter);
        vec3 light0Pos = vec3(light0Offset / uRes.x * 3.0, 0.1);
        vec3 L0 = normalize(light0Pos);
        float dist0 = length(light0Pos);
        float atten0 = 0.06 / (dist0 * dist0 + 0.02);
        atten0 = min(atten0, 1.5);
        float NdL0 = max(dot(N, L0), 0.0);
        vec3 H0 = normalize(L0 + V);
        float NdH0 = max(dot(N, H0), 0.0);
        totalDiffuse += uLightColor0 * NdL0 * atten0;
        totalSpecular += uLightColor0 * pow(NdH0, 32.0) * atten0;
        totalAttenuation += atten0;

        vec2 light1Offset = (uLight1 - vCenter);
        vec3 light1Pos = vec3(light1Offset / uRes.x * 3.0, 0.1);
        vec3 L1 = normalize(light1Pos);
        float dist1 = length(light1Pos);
        float atten1 = 0.06 / (dist1 * dist1 + 0.02);
        atten1 = min(atten1, 1.5);
        float NdL1 = max(dot(N, L1), 0.0);
        vec3 H1 = normalize(L1 + V);
        float NdH1 = max(dot(N, H1), 0.0);
        totalDiffuse += uLightColor1 * NdL1 * atten1;
        totalSpecular += uLightColor1 * pow(NdH1, 32.0) * atten1;
        totalAttenuation += atten1;

        vec2 light2Offset = (uLight2 - vCenter);
        vec3 light2Pos = vec3(light2Offset / uRes.x * 3.0, 0.1);
        vec3 L2 = normalize(light2Pos);
        float dist2 = length(light2Pos);
        float atten2 = 0.06 / (dist2 * dist2 + 0.02);
        atten2 = min(atten2, 1.5);
        float NdL2 = max(dot(N, L2), 0.0);
        vec3 H2 = normalize(L2 + V);
        float NdH2 = max(dot(N, H2), 0.0);
        totalDiffuse += uLightColor2 * NdL2 * atten2;
        totalSpecular += uLightColor2 * pow(NdH2, 32.0) * atten2;
        totalAttenuation += atten2;

        float atmosDist = d - planetRadius;
        float atmosMask = smoothstep(atmosphereOuter, planetRadius, d);
        float atmosDensity = atmosMask * (1.0 - planetMask);
        vec3 atmosColor = planetColor * 1.2 + vec3(0.05, 0.08, 0.15);

        float NdV = max(dot(N, V), 0.0);
        float limbAngle = 1.0 - abs(dot(N, V));
        float limbGlow = pow(limbAngle, 2.0) * atmosMask;
        float ringDist = abs(d - planetRadius);
        float atmosRing = exp(-ringDist * 8.0) * 0.6;

        float outerGlow = 0.0;
        if (d > planetRadius) {
            float glowDist = d - planetRadius;
            outerGlow = exp(-glowDist * 4.0) * 0.5;
            outerGlow += 0.015 / (glowDist + 0.02);
        }

        vec3 col = vec3(0.0);
        vec3 surfaceColor = planetColor * 0.85;
        col += surfaceColor * totalDiffuse * 1.5 * planetMask;
        col += planetColor * totalSpecular * 0.3 * planetMask;
        col += surfaceColor * 0.02 * planetMask;
        col += atmosColor * limbGlow * totalAttenuation * 0.3 * planetMask;
        col += planetColor * atmosRing * totalAttenuation * 0.2;
        col += planetColor * outerGlow * totalAttenuation * 0.4;

        float fresnel = pow(1.0 - NdV, 4.0) * planetMask;
        col += planetColor * fresnel * totalAttenuation * 0.2;
        col += planetColor * vGlow * (0.15 + fresnel * 0.3);

        col = col / (col + vec3(0.7));
        col = pow(col, vec3(0.95));

        float alpha = 0.0;
        alpha += planetMask * 0.98;
        alpha += atmosDensity * 0.4;
        alpha += atmosRing * 0.2;
        alpha += outerGlow * 0.3;
        alpha = clamp(alpha, 0.0, 1.0);
        alpha *= outerFade;
        alpha *= smoothstep(0.0, 0.5, ap);
        alpha *= vAlpha;

        gl_FragColor = vec4(col, alpha);
    }
`;

// ============================================
// BACKGROUND AURORA EFFECT (Three.js)
// ============================================
(function initBackground() {
    const canvas = document.getElementById('gpu-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    document.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX / window.innerWidth;
        mouse.targetY = 1.0 - e.clientY / window.innerHeight;
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        vertexShader: backgroundVertexShader,
        fragmentShader: backgroundFragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        transparent: true,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const PARTICLE_COUNT = 60;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 2] = 0;
        scales[i] = Math.random() * 1.5 + 0.5;
        speeds[i] = Math.random() * 0.5 + 0.2;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    particleGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const particleMaterial = new THREE.ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;
        mouse.x += (mouse.targetX - mouse.x) * 0.02;
        mouse.y += (mouse.targetY - mouse.y) * 0.02;
        material.uniforms.uTime.value = time;
        material.uniforms.uMouse.value.set(mouse.x, mouse.y);
        particleMaterial.uniforms.uTime.value = time;
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });
})();

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

    const skills = [
        { id: 'unity', label: 'Unity', category: 'primary', baseSize: 34, isLight: true, lightColor: '#ffaa33',
          desc: 'Primary game engine', usage: 'Daily since 2017 - shipped 12+ titles across mobile, PC, and VR platforms' },
        { id: 'csharp', label: 'C#', category: 'primary', baseSize: 33, isLight: true, lightColor: '#9b4dca',
          desc: 'Main programming language', usage: '7+ years - gameplay systems, editor tools, and performance-critical code' },
        { id: 'hlsl', label: 'HLSL/GLSL', category: 'primary', baseSize: 31, isLight: true, lightColor: '#33ddff',
          desc: 'Shader programming', usage: 'Custom rendering pipelines, VFX, post-processing, and compute shaders' },
        { id: 'directx', label: 'DirectX', category: 'secondary', baseSize: 15,
          desc: 'Graphics API', usage: 'DX11/DX12 for Windows and Xbox development' },
        { id: 'arvr', label: 'AR/VR', category: 'secondary', baseSize: 13,
          desc: 'Immersive experiences', usage: 'Meta Quest, HoloLens, and mobile AR projects' },
        { id: 'urp', label: 'URP/HDRP', category: 'secondary', baseSize: 13,
          desc: 'Unity render pipelines', usage: 'Custom render features, shader graphs, and pipeline extensions' },
        { id: 'opengl', label: 'OpenGL', category: 'secondary', baseSize: 14,
          desc: 'Cross-platform graphics', usage: 'Mobile and Linux rendering targets' },
        { id: 'unreal', label: 'Unreal', category: 'secondary', baseSize: 16,
          desc: 'Secondary engine', usage: 'Blueprint systems and material editor for specific projects' },
        { id: 'vulkan', label: 'Vulkan', category: 'secondary', baseSize: 15,
          desc: 'Low-level graphics API', usage: 'Performance optimization on Android and Linux' },
        { id: 'python', label: 'Python', category: 'secondary', baseSize: 14,
          desc: 'Scripting & tools', usage: 'Build automation, asset pipelines, and data processing' },
        { id: 'cpp', label: 'C++', category: 'secondary', baseSize: 8,
          desc: 'Systems programming', usage: 'Native plugins, engine modifications, and Unreal development' },
        { id: 'wpf', label: 'WPF', category: 'secondary', baseSize: 12,
          desc: 'Desktop UI framework', usage: 'Internal tools and editors for game development' },
        { id: 'compute', label: 'Compute', category: 'secondary', baseSize: 17,
          desc: 'GPU compute shaders', usage: 'Particle simulations, procedural generation, and physics' },
        { id: 'vfx', label: 'VFX Graph', category: 'secondary', baseSize: 12,
          desc: 'Unity visual effects', usage: 'GPU-driven particle systems and real-time simulations' },
        { id: 'niagara', label: 'Niagara', category: 'secondary', baseSize: 17,
          desc: 'Unreal VFX system', usage: 'Complex particle effects for Unreal projects' },
        { id: 'threejs', label: 'Three.js', category: 'secondary', baseSize: 8,
          desc: 'WebGL framework', usage: 'Interactive 3D web experiences and visualizations' },
        { id: 'webgl', label: 'WebGL', category: 'secondary', baseSize: 6,
          desc: 'Browser graphics', usage: 'Custom shaders and real-time web graphics' },
        { id: 'renderdoc', label: 'RenderDoc', category: 'tool', baseSize: 16,
          desc: 'Graphics debugger', usage: 'Frame analysis and shader debugging' },
        { id: 'nsight', label: 'NSight', category: 'tool', baseSize: 14,
          desc: 'NVIDIA profiler', usage: 'GPU performance analysis and optimization' },
        { id: 'pix', label: 'PIX', category: 'tool', baseSize: 6,
          desc: 'DirectX debugger', usage: 'Windows and Xbox graphics debugging' }
    ];

    const BASE_DIMENSION = 400;
    let sizeScale = 1;

    const connections = [
        ['unity', 'csharp'], ['unity', 'hlsl'], ['unity', 'urp'], ['unity', 'arvr'],
        ['unity', 'vfx'], ['unity', 'compute'],
        ['csharp', 'wpf'], ['csharp', 'compute'],
        ['hlsl', 'directx'], ['hlsl', 'opengl'], ['hlsl', 'vulkan'], ['hlsl', 'urp'],
        ['directx', 'renderdoc'], ['directx', 'pix'], ['directx', 'nsight'],
        ['opengl', 'vulkan'], ['opengl', 'webgl'],
        ['unreal', 'cpp'], ['unreal', 'niagara'], ['unreal', 'hlsl'],
        ['cpp', 'directx'], ['cpp', 'vulkan'],
        ['compute', 'vfx'], ['compute', 'hlsl'],
        ['threejs', 'webgl'], ['threejs', 'hlsl'],
        ['arvr', 'urp'], ['arvr', 'compute'],
        ['vfx', 'niagara'],
        ['python', 'unity']
    ];

    let nodes = skills.map((skill, i) => {
        return {
            ...skill,
            size: skill.baseSize,
            x: 0, y: 0, vx: 0, vy: 0, baseX: 0, baseY: 0,
            floatSpeed: 0.03 + Math.random() * 0.03,
            floatRadius: 2 + Math.random() * 3,
            floatPhase: Math.random() * Math.PI * 2,
            floatSpeed2: 0.02 + Math.random() * 0.02,
            floatRadius2: 1 + Math.random() * 2,
            pulseSpeed: 0.05 + Math.random() * 0.1,
            pulsePhase: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.001,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitSpeed: 0.02 + Math.random() * 0.02,
            orbitRadius: 2 + Math.random() * 4,
            glowIntensity: 0, targetGlowIntensity: 0, glowDelay: 0,
            shrinkProgress: 1, targetShrink: 1
        };
    });

    let width, height, centerX, centerY;
    let isDragging = false, dragNode = null, hoveredNode = null;
    let mouseX = 0, mouseY = 0;
    let settled = false, settleTimer = 0;
    let startupPhase = true, globalFadeIn = 0;

    const tooltip = document.getElementById('skill-tooltip');
    const tooltipTitle = tooltip.querySelector('.skill-tooltip-title');
    const tooltipDesc = tooltip.querySelector('.skill-tooltip-desc');
    const tooltipUsage = tooltip.querySelector('.skill-tooltip-usage');

    let tooltipTarget = null, tooltipPos = { x: 0, y: 0 }, tooltipConnectPoint = { x: 0, y: 0 };
    let lineAnimProgress = 0, lineAnimStartTime = 0;
    const lineAnimDuration = 300;
    let tooltipSide = 'right';

    let showcaseNode = null, showcaseActive = false, lastShowcaseTime = 0;
    const showcaseInterval = 2000, showcaseDuration = 4000;

    function startRandomShowcase() {
        if (hoveredNode || isDragging || startupPhase) return;
        const availableNodes = nodes.filter(n => n !== showcaseNode);
        if (availableNodes.length === 0) return;
        showcaseNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
        showcaseActive = true;
        generateTooltipPosition(showcaseNode);
        tooltipTarget = showcaseNode;
        tooltipTitle.textContent = showcaseNode.label;
        tooltipDesc.textContent = showcaseNode.desc || '';
        tooltipUsage.textContent = showcaseNode.usage || '';
        tooltip.className = 'skill-tooltip ' + showcaseNode.category;
        tooltip.style.left = tooltipPos.x + 'px';
        tooltip.style.top = tooltipPos.y + 'px';
        lastShowcaseTime = performance.now();
    }

    function updateShowcase() {
        const now = performance.now();
        if (startupPhase) { lastShowcaseTime = now; return; }
        if (hoveredNode || isDragging) {
            if (showcaseActive && tooltipTarget === showcaseNode) {
                showcaseActive = false; showcaseNode = null;
            }
            lastShowcaseTime = now; return;
        }
        if (showcaseActive) {
            if (now - lastShowcaseTime > showcaseDuration) {
                showcaseActive = false;
                tooltip.classList.remove('visible');
                tooltipTarget = null;
                lineAnimProgress = 0;
                lastShowcaseTime = now;
            }
            return;
        }
        if (now - lastShowcaseTime > showcaseInterval) startRandomShowcase();
    }

    let tooltipOffset = { x: 0, y: 0 };
    const tooltipWidth = 260, tooltipHeight = 120;

    function generateTooltipPosition(node) {
        const margin = 20;
        tooltipSide = Math.random() > 0.5 ? 'right' : 'left';
        let tx = tooltipSide === 'right' ? width - tooltipWidth - margin : margin;
        const minY = margin, maxY = height - tooltipHeight - margin;
        let ty = node.y - tooltipHeight / 2 + (Math.random() - 0.5) * 100;
        ty = Math.max(minY, Math.min(maxY, ty));
        tooltipPos = { x: tx, y: ty };
        tooltipOffset = { x: tx - node.x, y: ty - node.y };
        tooltipConnectPoint = tooltipSide === 'right'
            ? { x: tx, y: ty + tooltipHeight / 2 }
            : { x: tx + tooltipWidth, y: ty + tooltipHeight / 2 };
        lineAnimProgress = 0;
        lineAnimStartTime = performance.now();
    }

    function updateTooltipPositionForDrag(node) {
        const margin = 20;
        let tx = Math.max(margin, Math.min(width - tooltipWidth - margin, node.x + tooltipOffset.x));
        let ty = Math.max(margin, Math.min(height - tooltipHeight - margin, node.y + tooltipOffset.y));
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
        let lineColor = node.category === 'primary' ? colors.gold : node.category === 'secondary' ? colors.teal : colors.textMuted;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;

        const cornerX = node.x, cornerY = tooltipConnectPoint.y;
        const verticalDist = Math.abs(cornerY - node.y);
        const horizontalDist = Math.abs(tooltipConnectPoint.x - cornerX);
        const totalDist = verticalDist + horizontalDist;
        const drawDist = totalDist * lineAnimProgress;

        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        if (drawDist <= verticalDist) {
            ctx.lineTo(node.x, node.y + (cornerY - node.y) * (drawDist / verticalDist));
        } else {
            ctx.lineTo(cornerX, cornerY);
            const hProgress = (drawDist - verticalDist) / horizontalDist;
            ctx.lineTo(cornerX + (tooltipConnectPoint.x - cornerX) * hProgress, cornerY);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
    }

    // WebGL sphere renderer
    let gl, glCanvas, sphereProgram, glReady = false;

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
        sphereProgram.uRes = gl.getUniformLocation(sphereProgram, 'uRes');
        sphereProgram.uMouse = gl.getUniformLocation(sphereProgram, 'uMouse');
        sphereProgram.uTime = gl.getUniformLocation(sphereProgram, 'uTime');
        sphereProgram.uLight0 = gl.getUniformLocation(sphereProgram, 'uLight0');
        sphereProgram.uLight1 = gl.getUniformLocation(sphereProgram, 'uLight1');
        sphereProgram.uLight2 = gl.getUniformLocation(sphereProgram, 'uLight2');
        sphereProgram.uLightColor0 = gl.getUniformLocation(sphereProgram, 'uLightColor0');
        sphereProgram.uLightColor1 = gl.getUniformLocation(sphereProgram, 'uLightColor1');
        sphereProgram.uLightColor2 = gl.getUniformLocation(sphereProgram, 'uLightColor2');
        sphereProgram.buf = gl.createBuffer();

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

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(sphereProgram);
        gl.uniform2f(sphereProgram.uRes, width, height);
        gl.uniform2f(sphereProgram.uMouse, mouseX, mouseY);
        gl.uniform1f(sphereProgram.uTime, time);

        const lightNodes = nodes.filter(n => n.isLight);
        const light0 = lightNodes[0] || { x: 0, y: 0, lightColor: '#ffaa33' };
        const light1 = lightNodes[1] || { x: 0, y: 0, lightColor: '#9b4dca' };
        const light2 = lightNodes[2] || { x: 0, y: 0, lightColor: '#33ddff' };
        gl.uniform2f(sphereProgram.uLight0, light0.x, light0.y);
        gl.uniform2f(sphereProgram.uLight1, light1.x, light1.y);
        gl.uniform2f(sphereProgram.uLight2, light2.x, light2.y);
        const lc0 = hex2vec(light0.lightColor || '#ffaa33');
        const lc1 = hex2vec(light1.lightColor || '#9b4dca');
        const lc2 = hex2vec(light2.lightColor || '#33ddff');
        gl.uniform3f(sphereProgram.uLightColor0, lc0[0], lc0[1], lc0[2]);
        gl.uniform3f(sphereProgram.uLightColor1, lc1[0], lc1[1], lc1[2]);
        gl.uniform3f(sphereProgram.uLightColor2, lc2[0], lc2[1], lc2[2]);

        const v = [];
        const q = [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];

        nodes.forEach((n, idx) => {
            const shrink = n.shrinkProgress !== undefined ? n.shrinkProgress : 1;
            if (shrink < 0.01) return;

            let c;
            if (n.isLight && n.lightColor) c = hex2vec(n.lightColor);
            else if (n.category === 'primary') c = hex2vec(colors.gold);
            else if (n.category === 'secondary') c = hex2vec(colors.teal);
            else c = hex2vec(colors.textMuted);

            const g = n.glowIntensity || 0;
            const p = Math.sin(time * n.pulseSpeed + n.pulsePhase);
            const r = (n.size + p * 0.5 + g * 3) * shrink;
            const ap = globalFadeIn * shrink;
            const a = shrink * globalFadeIn;
            const isLight = n.isLight ? 1.0 : 0.0;

            q.forEach(([qx,qy]) => {
                v.push(qx, qy, n.x, n.y, r, c[0], c[1], c[2], a, ap, g, idx, isLight);
            });
        });

        const d = new Float32Array(v);
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereProgram.buf);
        gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW);

        const st = 13 * 4;
        gl.enableVertexAttribArray(sphereProgram.aPos);
        gl.vertexAttribPointer(sphereProgram.aPos, 2, gl.FLOAT, false, st, 0);
        gl.enableVertexAttribArray(sphereProgram.aCenter);
        gl.vertexAttribPointer(sphereProgram.aCenter, 2, gl.FLOAT, false, st, 8);
        gl.enableVertexAttribArray(sphereProgram.aRadius);
        gl.vertexAttribPointer(sphereProgram.aRadius, 1, gl.FLOAT, false, st, 16);
        gl.enableVertexAttribArray(sphereProgram.aColor);
        gl.vertexAttribPointer(sphereProgram.aColor, 3, gl.FLOAT, false, st, 20);
        gl.enableVertexAttribArray(sphereProgram.aAlpha);
        gl.vertexAttribPointer(sphereProgram.aAlpha, 1, gl.FLOAT, false, st, 32);
        gl.enableVertexAttribArray(sphereProgram.aAppear);
        gl.vertexAttribPointer(sphereProgram.aAppear, 1, gl.FLOAT, false, st, 36);
        gl.enableVertexAttribArray(sphereProgram.aGlow);
        gl.vertexAttribPointer(sphereProgram.aGlow, 1, gl.FLOAT, false, st, 40);
        gl.enableVertexAttribArray(sphereProgram.aIndex);
        gl.vertexAttribPointer(sphereProgram.aIndex, 1, gl.FLOAT, false, st, 44);
        gl.enableVertexAttribArray(sphereProgram.aIsLight);
        gl.vertexAttribPointer(sphereProgram.aIsLight, 1, gl.FLOAT, false, st, 48);

        gl.drawArrays(gl.TRIANGLES, 0, v.length / 13);
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
        settled = false;
        settleTimer = 0;

        const minDim = Math.min(width, height);
        sizeScale = Math.max(0.5, Math.min(1.2, minDim / BASE_DIMENSION));

        nodes.forEach((node, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 + Math.PI / 4;
            const radius = Math.min(width, height) * 0.35;
            node.x = centerX + Math.cos(angle) * radius * (0.6 + Math.random() * 0.4);
            node.y = centerY + Math.sin(angle) * radius * (0.6 + Math.random() * 0.4);
            node.baseX = node.x;
            node.baseY = node.y;
            node.vx = 0;
            node.vy = 0;
            node.size = node.baseSize * sizeScale;
        });

        resizeSphereGL();
    }

    function getNodeAt(x, y) {
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const dx = x - node.x, dy = y - node.y;
            if (dx * dx + dy * dy < (node.size + 5) * (node.size + 5)) return node;
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

    function simulate() {
        if (globalFadeIn < 1 && time > 1.5) globalFadeIn = Math.min(1, (time - 1.5) / 2);
        if (globalFadeIn >= 1) startupPhase = false;

        const scaleSquared = sizeScale * sizeScale;
        const repulsion = (dragNode ? 5000 : 3000) * scaleSquared;
        const attraction = dragNode ? 0.0015 : 0.003;
        const damping = 0.95;
        const centerPull = 0.002;
        let totalMovement = 0;

        nodes.forEach((nodeA, idxA) => {
            if (nodeA === dragNode) return;
            let fx = 0, fy = 0;

            nodes.forEach((nodeB) => {
                if (nodeA === nodeB) return;
                const dx = nodeA.x - nodeB.x, dy = nodeA.y - nodeB.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = repulsion / (dist * dist + 100);
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
            });

            connections.forEach(([a, b]) => {
                let other = null;
                if (a === nodeA.id) other = nodes.find(n => n.id === b);
                if (b === nodeA.id) other = nodes.find(n => n.id === a);
                if (other) {
                    const dx = other.x - nodeA.x, dy = other.y - nodeA.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const idealDist = 180 * sizeScale;
                    const isDragConnected = dragNode && (other === dragNode || nodeA === dragNode);
                    const mult = isDragConnected ? 15 : 1;
                    if (dist > idealDist || isDragConnected) {
                        const str = Math.max((dist - idealDist) * attraction, isDragConnected ? 0.05 : 0) * mult;
                        fx += (dx / dist) * str;
                        fy += (dy / dist) * str;
                    }
                }
            });

            if (nodeA.isLight) {
                const orbitRadius = 80 * sizeScale;
                const orbitSpeed = 0.06 + idxA * 0.01;
                const orbitPhase = idxA * (Math.PI * 2 / 3);
                fx += (centerX + Math.cos(time * orbitSpeed + orbitPhase) * orbitRadius - nodeA.x) * 0.02;
                fy += (centerY + Math.sin(time * orbitSpeed + orbitPhase) * orbitRadius - nodeA.y) * 0.02;
            }

            fx += (centerX - nodeA.x) * centerPull;
            fy += (centerY - nodeA.y) * centerPull;

            const mDx = mouseX - nodeA.x, mDy = mouseY - nodeA.y;
            const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
            if (mDist < 200 * sizeScale && mDist > 30) {
                const mForce = 0.5 / (mDist * 0.1 + 1);
                fx -= (mDx / mDist) * mForce;
                fy -= (mDy / mDist) * mForce;
            }

            nodeA.vx = (nodeA.vx + fx * 0.08) * damping;
            nodeA.vy = (nodeA.vy + fy * 0.08) * damping;
            nodeA.x += nodeA.vx;
            nodeA.y += nodeA.vy;
            totalMovement += Math.abs(nodeA.vx) + Math.abs(nodeA.vy);

            const padding = 60;
            if (nodeA.x < padding) { nodeA.x = padding; nodeA.vx *= -0.5; }
            if (nodeA.x > width - padding) { nodeA.x = width - padding; nodeA.vx *= -0.5; }
            if (nodeA.y < padding) { nodeA.y = padding; nodeA.vy *= -0.5; }
            if (nodeA.y > height - padding) { nodeA.y = height - padding; nodeA.vy *= -0.5; }

            nodeA.baseX = nodeA.x;
            nodeA.baseY = nodeA.y;
        });

        if (totalMovement < 0.5) { settleTimer++; if (settleTimer > 60) settled = true; }
        else { settleTimer = 0; settled = false; }
    }

    let lastHoveredNode = null, hoverStartTime = 0;

    function draw() {
        ctx.clearRect(0, 0, width, height);
        time += 0.016;

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

        nodes.forEach(node => {
            if (node === dragNode) return;
            const floatX = Math.sin(time * node.floatSpeed + node.floatPhase) * node.floatRadius;
            const floatY = Math.cos(time * node.floatSpeed * 0.7 + node.floatPhase) * node.floatRadius * 0.8;
            const wobbleX = Math.sin(time * node.floatSpeed2 + node.floatPhase * 2.0) * node.floatRadius2;
            const wobbleY = Math.cos(time * node.floatSpeed2 * 1.3 + node.floatPhase * 2.0) * node.floatRadius2;
            node.orbitAngle += node.orbitSpeed * 0.016;
            const orbitX = Math.cos(node.orbitAngle) * node.orbitRadius;
            const orbitY = Math.sin(node.orbitAngle) * node.orbitRadius * 0.6;

            if (settled) { node.x = node.baseX + floatX + wobbleX + orbitX; node.y = node.baseY + floatY + wobbleY + orbitY; }
            else { node.x += (floatX + wobbleX) * 0.02; node.y += (floatY + wobbleY) * 0.02; }
            node.rotation += node.rotationSpeed;
        });

        const primaryNodes = new Set(['unity', 'csharp', 'hlsl']);
        connections.forEach(([a, b]) => {
            const nodeA = nodes.find(n => n.id === a);
            const nodeB = nodes.find(n => n.id === b);
            if (!nodeA || !nodeB) return;

            const isHighlighted = hoveredNode && (hoveredNode.id === a || hoveredNode.id === b);
            const shrinkA = nodeA.shrinkProgress !== undefined ? nodeA.shrinkProgress : 1;
            const shrinkB = nodeB.shrinkProgress !== undefined ? nodeB.shrinkProgress : 1;
            const connectionFade = Math.min(shrinkA, shrinkB) * globalFadeIn;
            if (connectionFade < 0.01) return;

            if (isHighlighted) {
                const gradient = ctx.createLinearGradient(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
                const alpha = 0.8 * connectionFade;
                gradient.addColorStop(0, `rgba(255, 170, 50, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 220, 100, ${alpha})`);
                gradient.addColorStop(1, `rgba(255, 170, 50, ${alpha})`);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
            } else {
                if (hoveredNode) return;
                if (!primaryNodes.has(a) && !primaryNodes.has(b)) return;
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.055 * connectionFade})`;
                ctx.lineWidth = 0.5;
            }

            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
        });

        if (!renderSpheresGL(nodes, hoveredNode, connectedToHovered)) {
            nodes.forEach(node => {
                const shrink = node.shrinkProgress !== undefined ? node.shrinkProgress : 1;
                if (shrink < 0.01 || globalFadeIn < 0.01) return;
                const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
                const displaySize = (node.size + pulse * 0.5 + node.glowIntensity * 3) * shrink;
                let baseColor = node.category === 'primary' ? colors.gold : node.category === 'secondary' ? colors.teal : colors.textMuted;
                drawLitSphere(node.x, node.y, displaySize, baseColor, shrink * globalFadeIn, globalFadeIn * shrink, node.glowIntensity);
            });
        }

        nodes.forEach(node => {
            const shrink = node.shrinkProgress !== undefined ? node.shrinkProgress : 1;
            if (shrink < 0.1 || globalFadeIn < 0.5) return;
            const labelAlpha = Math.min(1, (globalFadeIn - 0.5) * 2) * shrink;
            const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
            const displaySize = (node.size + pulse * 0.5 + node.glowIntensity * 3) * shrink;
            const labelY = node.y + displaySize + 12 * sizeScale + 6;
            const fontWeight = node.glowIntensity > 0.5 ? '600' : '500';
            const fontSize = (9.5 + 2.5 * sizeScale + node.glowIntensity) * (0.7 + shrink * 0.3);
            ctx.font = `${fontWeight} ${fontSize}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textWidth = ctx.measureText(node.label).width;
            const paddingX = 3 * sizeScale + 1, paddingY = 5 * sizeScale + 2;
            ctx.globalAlpha = labelAlpha;
            ctx.fillStyle = `rgba(21, 29, 38, ${0.8 * shrink})`;
            ctx.beginPath();
            ctx.roundRect(node.x - textWidth / 2 - paddingX, labelY - paddingY, textWidth + paddingX * 2, paddingY * 2, 3);
            ctx.fill();
            ctx.fillStyle = colors.textPrimary;
            ctx.fillText(node.label, node.x, labelY);
            ctx.globalAlpha = 1;
        });

        drawTooltipConnector();
    }

    function animate() {
        simulate();
        draw();
        updateShowcase();
        requestAnimationFrame(animate);
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        dragNode = getNodeAt(mouseX, mouseY);
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
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        if (isDragging && dragNode) {
            dragNode.x = mouseX; dragNode.y = mouseY;
            dragNode.baseX = mouseX; dragNode.baseY = mouseY;
            dragNode.vx = 0; dragNode.vy = 0;
            settled = false; settleTimer = 0;
            if (tooltipTarget === dragNode) updateTooltipPositionForDrag(dragNode);
        } else {
            hoveredNode = getNodeAt(mouseX, mouseY);
            container.style.cursor = hoveredNode ? 'pointer' : 'grab';
            updateTooltip(hoveredNode);
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false; dragNode = null;
        container.style.cursor = hoveredNode ? 'pointer' : 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false; dragNode = null; hoveredNode = null;
        container.style.cursor = 'grab';
        updateTooltip(null);
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
        dragNode = getNodeAt(mouseX, mouseY);
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
        dragNode.x = touch.clientX - rect.left;
        dragNode.y = touch.clientY - rect.top;
        dragNode.baseX = dragNode.x; dragNode.baseY = dragNode.y;
        dragNode.vx = 0; dragNode.vy = 0;
        settled = false;
        if (tooltipTarget === dragNode) updateTooltipPositionForDrag(dragNode);
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isDragging = false; dragNode = null; });

    window.addEventListener('resize', resize);
    initSphereGL();
    resize();
    lastShowcaseTime = performance.now();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            time = 0; globalFadeIn = 0; startupPhase = true;
            lastShowcaseTime = performance.now();
            tooltip.classList.remove('visible');
            tooltipTarget = null; showcaseActive = false; showcaseNode = null;
        }
    });

    window.addEventListener('skillsTabActivated', () => {
        time = 0; globalFadeIn = 0; startupPhase = true;
        lastShowcaseTime = performance.now();
        tooltip.classList.remove('visible');
        tooltipTarget = null; showcaseActive = false; showcaseNode = null;
    });

    animate();
})();

// ============================================
// COUNTING ANIMATION FOR STATS
// ============================================
(function initStats() {
    const stats = document.querySelectorAll('.stat-number[data-target]');
    stats.forEach((stat, index) => {
        const target = parseInt(stat.dataset.target);
        const suffix = stat.dataset.suffix || '';
        let current = 0;
        const duration = 1500;
        const startDelay = 600 + index * 200;
        const stepTime = duration / target;

        setTimeout(() => {
            const interval = setInterval(() => {
                current++;
                stat.textContent = current + (current === target ? suffix : '');
                if (current >= target) clearInterval(interval);
            }, stepTime);
        }, startDelay);
    });
})();

// ============================================
// STAGGERED REVEAL ANIMATIONS
// ============================================
(function initAnimations() {
    document.querySelectorAll('.client-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.08}s`; });
    document.querySelectorAll('.testimonial-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.15}s`; });
    document.querySelectorAll('.project-card').forEach((card, i) => { card.style.animationDelay = `${0.6 + i * 0.12}s`; });
})();

// ============================================
// 3D CURVED PORTFOLIO CAROUSEL
// ============================================
(function initPortfolio() {
    const items = document.querySelectorAll('.portfolio-item');
    const prevBtn = document.querySelector('.portfolio-nav.prev');
    const nextBtn = document.querySelector('.portfolio-nav.next');
    const titleEl = document.getElementById('portfolio-title');
    const linkEl = document.getElementById('portfolio-link');
    const dotsContainer = document.getElementById('portfolio-dots');
    const scene = document.querySelector('.portfolio-scene');

    if (!items.length) return;

    let currentIndex = 0;
    const totalItems = items.length;
    const visibleItems = 5;

    items.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'portfolio-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('.portfolio-dot');

    function updateCarousel() {
        const isMobile = window.innerWidth <= 900;
        if (isMobile) {
            items.forEach((item) => { item.style.transform = ''; item.style.opacity = ''; item.style.zIndex = ''; item.style.pointerEvents = ''; });
            return;
        }

        items.forEach((item, i) => {
            let offset = i - currentIndex;
            if (offset > totalItems / 2) offset -= totalItems;
            if (offset < -totalItems / 2) offset += totalItems;
            const absOffset = Math.abs(offset);

            if (absOffset > Math.floor(visibleItems / 2)) {
                item.style.opacity = '0';
                item.style.pointerEvents = 'none';
                item.style.transform = `translate(-50%, -50%) translateX(${offset * 300}px) translateZ(-500px) scale(0.5)`;
                return;
            }

            const angle = offset * 25;
            const translateX = offset * 180;
            const translateZ = -absOffset * 150;
            const scale = 1 - absOffset * 0.15;
            const opacity = 1 - absOffset * 0.3;

            item.style.transform = `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${-angle}deg) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = visibleItems - absOffset;
            item.style.pointerEvents = offset === 0 ? 'auto' : 'none';
            item.classList.toggle('active', offset === 0);
        });

        const activeItem = items[currentIndex];
        if (titleEl) titleEl.textContent = activeItem.dataset.title;
        if (linkEl) { linkEl.href = activeItem.dataset.url; linkEl.style.display = activeItem.dataset.url ? '' : 'none'; }
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }

    function goToSlide(index) {
        if (index < 0) index = totalItems - 1;
        if (index >= totalItems) index = 0;
        currentIndex = index;
        updateCarousel();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    items.forEach((item, i) => {
        item.addEventListener('click', () => {
            if (i === currentIndex) window.open(item.dataset.url, '_blank');
            else goToSlide(i);
        });
    });

    document.addEventListener('keydown', (e) => {
        const portfolioPanel = document.getElementById('panel-portfolio');
        if (!portfolioPanel || !portfolioPanel.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    });

    let touchStartX = 0;
    if (scene) {
        scene.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        scene.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) goToSlide(currentIndex + (diff > 0 ? 1 : -1));
        }, { passive: true });
        scene.addEventListener('wheel', (e) => { e.preventDefault(); goToSlide(currentIndex + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
    }

    let resizeTimeout;
    window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(updateCarousel, 100); });
    updateCarousel();
})();

// ============================================
// TYPEWRITER EFFECT WITH TYPOS
// ============================================
(function initTypewriter() {
    const container = document.getElementById('typewriter-container');
    const typingIndicator = document.getElementById('typing-indicator');
    const dots = typingIndicator ? typingIndicator.querySelectorAll('.typing-dots span') : [];
    if (!container) return;

    const fullText = [
        { text: 'I run ', highlight: false },
        { text: 'Zylaris Ltd', highlight: true },
        { text: ', a specialized consultancy delivering high-performance graphics solutions for games, VR, and immersive installations. From ', highlight: false },
        { text: 'GPU-based light baking', highlight: true },
        { text: ' using SDFs to ', highlight: false },
        { text: '16K projection-mapped environments', highlight: true },
        { text: ', I help studios push the boundaries of real-time rendering across mobile, desktop, VR, and web platforms. I\'ve shipped graphics systems for studios including ', highlight: false },
        { text: 'Nexus', highlight: true },
        { text: ', ', highlight: false },
        { text: 'Ubisoft', highlight: true },
        { text: ', ', highlight: false },
        { text: '22cans', highlight: true },
        { text: ', and ', highlight: false },
        { text: 'The Sandbox', highlight: true },
        { text: '.', highlight: false }
    ];

    const typos = [
        { pos: 15, wrong: 'x', correct: 'c' },
        { pos: 78, wrong: 'f', correct: 'g' },
        { pos: 142, wrong: 'b', correct: 'p' },
        { pos: 245, wrong: 'r', correct: 't' },
    ];

    let cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    container.appendChild(cursor);

    let globalPos = 0, segmentIndex = 0, charIndex = 0, currentSpan = null;
    let typoQueue = [...typos].sort((a, b) => a.pos - b.pos);
    let isDeleting = false, deleteCount = 0, typoChar = null;
    let dotIndex = 0;

    const dotInterval = setInterval(() => {
        if (!dots.length) return;
        dots.forEach((dot, i) => dot.classList.toggle('visible', i < dotIndex));
        dotIndex = (dotIndex + 1) % 4;
    }, 300);

    function getBaseDelay() { return 12 + Math.random() * 18; }

    function finishTyping() {
        cursor.classList.add('hidden');
        if (typingIndicator) typingIndicator.classList.add('hidden');
        clearInterval(dotInterval);
    }

    function type() {
        if (segmentIndex >= fullText.length) { finishTyping(); return; }

        const segment = fullText[segmentIndex];
        if (!currentSpan) {
            currentSpan = document.createElement('span');
            if (segment.highlight) currentSpan.className = 'highlight-text';
            container.insertBefore(currentSpan, cursor);
        }

        const currentTypo = typoQueue[0];
        if (currentTypo && globalPos === currentTypo.pos && !isDeleting && !typoChar) {
            typoChar = document.createElement('span');
            typoChar.className = 'typo-char';
            typoChar.textContent = currentTypo.wrong;
            currentSpan.appendChild(typoChar);
            globalPos++; charIndex++;
            setTimeout(() => { isDeleting = true; deleteCount = 1; setTimeout(type, 80 + Math.random() * 50); }, 120 + Math.random() * 80);
            return;
        }

        if (isDeleting && deleteCount > 0) {
            if (typoChar) { typoChar.remove(); typoChar = null; }
            globalPos--; charIndex--; deleteCount--;
            isDeleting = false; typoQueue.shift();
            setTimeout(type, 50);
            return;
        }

        if (charIndex < segment.text.length) {
            currentSpan.textContent += segment.text[charIndex];
            charIndex++; globalPos++;
            let delay = getBaseDelay();
            const char = segment.text[charIndex - 1];
            if (['.', ',', '!', '?'].includes(char)) delay += 80 + Math.random() * 60;
            else if (char === ' ') delay += Math.random() * 15;
            setTimeout(type, delay);
        } else {
            segmentIndex++; charIndex = 0; currentSpan = null;
            setTimeout(type, getBaseDelay());
        }
    }

    setTimeout(type, 500);
})();

// ============================================
// PROJECT LIST SCROLL HANDLER
// ============================================
(function initProjectScroll() {
    const wrapper = document.getElementById('project-list-wrapper');
    const list = document.getElementById('project-list');
    const hint = wrapper ? wrapper.querySelector('.scroll-hint') : null;
    if (!wrapper || !list) return;

    function updateScrollState() {
        const scrollPos = list.scrollTop;
        const maxScroll = list.scrollHeight - list.clientHeight;
        wrapper.classList.remove('scrolled-top', 'scrolled-middle', 'scrolled-end');
        if (scrollPos <= 10) { wrapper.classList.add('scrolled-top'); if (hint) hint.style.opacity = '0.7'; }
        else if (scrollPos >= maxScroll - 10) { wrapper.classList.add('scrolled-end'); if (hint) hint.style.opacity = '0'; }
        else { wrapper.classList.add('scrolled-middle'); if (hint) hint.style.opacity = '0.5'; }
    }

    list.addEventListener('scroll', updateScrollState);
    updateScrollState();
})();

// ============================================
// TABBED CAROUSEL
// ============================================
(function initTabs() {
    const tabs = document.querySelectorAll('.carousel-tab');
    const panels = document.querySelectorAll('.carousel-panel');
    if (!tabs.length || !panels.length) return;

    function triggerPanelAnimations(panel) {
        panel.querySelectorAll('.client-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.08}s`; });
        panel.querySelectorAll('.testimonial-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.15}s`; });
        panel.querySelectorAll('.project-card').forEach((card, i) => { card.style.animation = 'none'; card.offsetHeight; card.style.animation = ''; card.style.animationDelay = `${i * 0.12}s`; });
        const portfolioCarousel = panel.querySelector('.portfolio-carousel');
        if (portfolioCarousel) { portfolioCarousel.style.animation = 'none'; portfolioCarousel.offsetHeight; portfolioCarousel.style.animation = ''; }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const panelId = tab.dataset.panel;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            panels.forEach(panel => {
                if (panel.id === `panel-${panelId}`) { panel.classList.add('active'); triggerPanelAnimations(panel); }
                else panel.classList.remove('active');
            });
            if (panelId === 'skills') {
                window.dispatchEvent(new Event('skillsTabActivated'));
                window.dispatchEvent(new Event('resize'));
            }
        });
    });
})();

// ============================================
// ANIMATED FAVICON - BREATHING DOT
// ============================================
(function initFavicon() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const link = document.getElementById('favicon');
    let time = 0;
    const gold = '#e8b923';

    function draw() {
        ctx.clearRect(0, 0, 32, 32);
        const pulse = Math.sin(time) * 0.2 + 0.8;
        const radius = 9 * pulse;
        const gradient = ctx.createRadialGradient(16, 16, radius * 0.5, 16, 16, radius + 3);
        gradient.addColorStop(0, gold);
        gradient.addColorStop(0.7, 'rgba(232, 185, 35, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(16, 16, radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(16, 16, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = gold;
        ctx.fill();
        link.href = canvas.toDataURL('image/png');
    }

    function animate() { time += 0.04; draw(); requestAnimationFrame(animate); }
    animate();
})();

// ============================================
// FPS PERFORMANCE COUNTER
// ============================================
(function initFPS() {
    const fpsBadge = document.getElementById('fps-badge');
    const fpsValue = document.getElementById('fps-value');
    if (!fpsBadge || !fpsValue) return;

    let frameCount = 0, lastTime = performance.now(), fps = 60;

    function updateFPS() {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - lastTime;
        if (elapsed >= 500) {
            fps = Math.round((frameCount * 1000) / elapsed);
            frameCount = 0; lastTime = currentTime;
            fpsValue.textContent = fps;
            fpsBadge.classList.remove('good', 'warn', 'bad');
            if (fps >= 50) fpsBadge.classList.add('good');
            else if (fps >= 30) fpsBadge.classList.add('warn');
            else fpsBadge.classList.add('bad');
        }
        requestAnimationFrame(updateFPS);
    }

    requestAnimationFrame(updateFPS);
})();
