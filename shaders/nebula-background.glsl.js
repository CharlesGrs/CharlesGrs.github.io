// Nebula Background Shader - procedural space nebula skybox
// Uses distant sphere sampling technique matching god rays for consistent camera rotation
// Integrates light sources from the skill graph for subtle illumination

window.NEBULA_BACKGROUND_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUV;

void main() {
    vUV = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

window.NEBULA_BACKGROUND_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;

uniform vec2 uResolution;
uniform float uTime;
uniform float uCameraRotX;  // Camera pitch
uniform float uCameraRotY;  // Camera yaw
uniform vec2 uMouse;        // Mouse position (0-1)

// Light sources from skill graph (world space positions)
uniform vec2 uLight0;
uniform vec2 uLight1;
uniform vec2 uLight2;
uniform vec3 uLightColor0;
uniform vec3 uLightColor1;
uniform vec3 uLightColor2;
uniform float uLight0Intensity;
uniform float uLight1Intensity;
uniform float uLight2Intensity;

// Zoom/camera parameters (for screen-space light positioning)
uniform float uZoom;
uniform vec2 uZoomCenter;

// Nebula parameters
uniform float uNebulaIntensity;    // Overall nebula brightness (default 0.3)
uniform float uNebulaScale;        // Noise scale (default 2.0)
uniform float uNebulaDetail;       // Detail/octaves (default 1.0)
uniform float uNebulaSpeed;        // Animation speed (default 0.1)
uniform float uLightInfluence;     // How much lights affect nebula (default 0.3)
uniform float uColorVariation;     // Color variation amount (default 1.0)
// uDustDensity and uStarDensity removed for performance
uniform float uFractalIntensity;   // Fractal pattern intensity in lit areas (default 0.15)
uniform float uFractalScale;       // Fractal pattern scale (default 8.0)
uniform float uFractalSpeed;       // Fractal animation speed (default 0.03)
uniform float uFractalSaturation;  // Fractal color saturation (default 3.0)
uniform float uFractalFalloff;     // Fractal light falloff (default 3.0)
uniform float uVignetteStrength;   // Vignette darkness (default 0.3)

// Nebula colors (customizable)
uniform vec3 uNebulaColorPurple;   // Purple nebula tint (default 0.12, 0.04, 0.18)
uniform vec3 uNebulaColorCyan;     // Cyan nebula tint (default 0.04, 0.12, 0.20)
uniform vec3 uNebulaColorBlue;     // Blue nebula tint (default 0.03, 0.06, 0.15)
uniform vec3 uNebulaColorGold;     // Gold nebula tint (default 0.15, 0.10, 0.03)

// ========================================
// 3D SIMPLEX NOISE
// ========================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise3D(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// ========================================
// SKYBOX RAY DIRECTION (looking outward at infinite distance)
// ========================================

vec3 getSkyboxDirection(vec2 screenPos) {
    // Create ray direction looking outward (like a skybox)
    // Use a wide FOV to fill the screen
    float fov = 0.8;  // Smaller = more zoomed in on the skybox

    // Ray starts looking forward (+Z) and fans out based on screen position
    vec3 rayDir = normalize(vec3(screenPos.x * fov, screenPos.y * fov, 1.0));

    // Apply camera rotation to look around the skybox
    float cosRotX = cos(uCameraRotX);
    float sinRotX = sin(uCameraRotX);
    float cosRotY = cos(uCameraRotY);
    float sinRotY = sin(uCameraRotY);

    // Rotate around X axis (pitch) - looking up/down
    float ry = rayDir.y * cosRotX - rayDir.z * sinRotX;
    float rz = rayDir.y * sinRotX + rayDir.z * cosRotX;
    rayDir.y = ry;
    rayDir.z = rz;

    // Rotate around Y axis (yaw) - looking left/right
    float rx = rayDir.x * cosRotY + rayDir.z * sinRotY;
    rz = -rayDir.x * sinRotY + rayDir.z * cosRotY;
    rayDir.x = rx;
    rayDir.z = rz;

    return rayDir;
}

// ========================================
// FBM (Fractal Brownian Motion) for nebula clouds
// ========================================

float nebulaNoise(vec3 p, float detail) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    // 4 octaves for detail (reduced from 8)
    for (int i = 0; i < 4; i++) {
        value += snoise3D(p * frequency) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value * detail;
}

// Wispy turbulence for gas clouds (reduced to 2 iterations)
float turbulence(vec3 p, float detail) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 2; i++) {
        value += abs(snoise3D(p * frequency)) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.1;
    }

    return value * detail;
}

// ========================================
// CHEAP FRACTAL PATTERN (only visible in light)
// ========================================

float cheapFractal(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    vec3 offset = vec3(1.7, 2.3, 1.9);
    // Reduced from 5 to 3 iterations
    for (int i = 0; i < 3; i++) {
        // Twisted domain for organic look
        vec3 q = vec3(
            sin(p.y * 1.3 + p.z * 0.7),
            sin(p.z * 1.1 + p.x * 0.9),
            sin(p.x * 1.5 + p.y * 0.6)
        );
        v += abs(dot(sin(p + q * 0.5), vec3(0.33))) * a;
        p = p * 2.0 + offset;
        offset = offset.yzx * 1.1;
        a *= 0.55;
    }
    return v;
}

// Saturate color (increase saturation by factor)
vec3 saturate(vec3 color, float amount) {
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(luma), color, amount);
}

// Transform world position to screen position (matching god rays)
vec2 worldToScreen(vec2 worldPos) {
    vec2 screenCenter = uResolution * 0.5;
    vec2 offsetFromCenter = worldPos - screenCenter;
    vec2 scaledOffset = offsetFromCenter * uZoom;
    return screenCenter + scaledOffset;
}

// ========================================
// LIGHT INFLUENCE FROM SCENE
// ========================================

vec3 lightContribution(vec2 uv, vec3 skyDir, out float totalFalloff) {
    vec3 totalLight = vec3(0.0);
    totalFalloff = 0.0;

    // Transform light positions from world to screen space with zoom
    vec2 light0Screen = worldToScreen(uLight0);
    vec2 light1Screen = worldToScreen(uLight1);
    vec2 light2Screen = worldToScreen(uLight2);

    // Convert to UV space
    vec2 light0UV = light0Screen / uResolution;
    vec2 light1UV = light1Screen / uResolution;
    vec2 light2UV = light2Screen / uResolution;
    light0UV.y = 1.0 - light0UV.y;
    light1UV.y = 1.0 - light1UV.y;
    light2UV.y = 1.0 - light2UV.y;

    // Soft, wide falloff for subtle influence
    float dist0 = length(uv - light0UV);
    float dist1 = length(uv - light1UV);
    float dist2 = length(uv - light2UV);

    // Very soft exponential falloff
    float falloff0 = exp(-dist0 * 2.0) * uLight0Intensity;
    float falloff1 = exp(-dist1 * 2.0) * uLight1Intensity;
    float falloff2 = exp(-dist2 * 2.0) * uLight2Intensity;

    // Saturate light colors x1.5 for more vivid appearance
    totalLight += saturate(uLightColor0, 1.5) * falloff0;
    totalLight += saturate(uLightColor1, 1.5) * falloff1;
    totalLight += saturate(uLightColor2, 1.5) * falloff2;

    totalFalloff = falloff0 + falloff1 + falloff2;

    return totalLight;
}

// ========================================
// MAIN
// ========================================

void main() {
    vec2 uv = vUV;
    vec2 screenPos = (uv - 0.5) * 2.0;

    // Aspect ratio correction
    float aspect = uResolution.x / uResolution.y;
    screenPos.x *= aspect;

    // Get skybox direction for this pixel
    vec3 skyDir = getSkyboxDirection(screenPos);

    // Slow animation
    float animTime = uTime * uNebulaSpeed * 0.5;

    // ========================================
    // NEBULA LAYERS (at infinity - use direction, not position)
    // Scale is high to make features appear distant
    // ========================================

    float skyboxScale = uNebulaScale * 3.0;  // Multiply to push features "further away"

    // Large-scale nebula clouds
    vec3 p1 = skyDir * skyboxScale + vec3(animTime * 0.02, animTime * 0.01, 0.0);
    float nebula1 = nebulaNoise(p1, uNebulaDetail);
    nebula1 = smoothstep(-0.1, 0.5, nebula1);

    // Medium wisps
    vec3 p2 = skyDir * skyboxScale * 1.7 + vec3(0.0, animTime * 0.015, animTime * 0.01);
    float nebula2 = turbulence(p2, 1.0);
    nebula2 = smoothstep(0.3, 0.9, nebula2);

    // Fine filaments
    vec3 p3 = skyDir * skyboxScale * 3.0 + vec3(animTime * 0.01, 0.0, animTime * 0.02);
    float nebula3 = abs(snoise3D(p3)) * abs(snoise3D(p3 * 1.3 + 50.0));
    nebula3 = smoothstep(0.15, 0.6, nebula3);

    // Combine with falloff toward edges (makes it feel like looking through a window)
    float nebulaDensity = nebula1 * 0.5 + nebula2 * 0.3 + nebula3 * 0.2;
    nebulaDensity = pow(nebulaDensity, 1.3);

    // ========================================
    // NEBULA COLORING
    // ========================================

    // Deep space colors - use uniform colors
    vec3 deepSpace = vec3(0.01, 0.012, 0.02);

    // Color variation based on direction
    float colorVar1 = snoise3D(skyDir * 2.0 + vec3(200.0, 0.0, 0.0)) * 0.5 + 0.5;
    float colorVar2 = snoise3D(skyDir * 1.5 + vec3(0.0, 200.0, 0.0)) * 0.5 + 0.5;

    vec3 nebulaColor = mix(uNebulaColorBlue, uNebulaColorPurple, colorVar1 * uColorVariation);
    nebulaColor = mix(nebulaColor, uNebulaColorCyan, colorVar2 * 0.5 * uColorVariation);

    // Warm accents in bright regions
    float warmZone = smoothstep(0.4, 0.7, nebulaDensity);
    nebulaColor = mix(nebulaColor, uNebulaColorGold, warmZone * 0.25 * uColorVariation);

    // Final nebula contribution
    vec3 nebulaCol = nebulaColor * nebulaDensity * uNebulaIntensity;

    // ========================================
    // LIGHT INFLUENCE FROM SCENE LIGHTS
    // ========================================

    float totalFalloff;
    vec3 lightInfluence = lightContribution(uv, skyDir, totalFalloff) * uLightInfluence;

    // Lights subtly enhance nebula colors nearby
    nebulaCol += nebulaCol * lightInfluence * 1.5;

    // Lights add subtle glow to dark regions
    float darkRegion = 1.0 - smoothstep(0.0, 0.2, nebulaDensity);
    nebulaCol += lightInfluence * darkRegion * 0.03;

    // ========================================
    // FRACTAL PATTERN (screen space, radiating from each light)
    // ========================================

    vec3 fractalColor = vec3(0.0);

    // Transform light positions from world to screen space with zoom
    vec2 light0Screen = worldToScreen(uLight0);
    vec2 light1Screen = worldToScreen(uLight1);
    vec2 light2Screen = worldToScreen(uLight2);

    // Convert to UV space
    vec2 fracLight0UV = light0Screen / uResolution;
    vec2 fracLight1UV = light1Screen / uResolution;
    vec2 fracLight2UV = light2Screen / uResolution;
    fracLight0UV.y = 1.0 - fracLight0UV.y;
    fracLight1UV.y = 1.0 - fracLight1UV.y;
    fracLight2UV.y = 1.0 - fracLight2UV.y;

    // Detail nebula multiplier (adds texture variation to the fractal)
    float detailNebula = turbulence(skyDir * 12.0 + uTime * 0.01, 2.0);
    detailNebula = smoothstep(0.2, 0.8, detailNebula) * 0.7 + 0.3;

    // For each light: sample fractal on skybox (rotates with camera)
    // Use skyDir for consistent rotation with nebula
    vec3 fractalPos = skyDir * uFractalScale + vec3(uTime * uFractalSpeed);
    float fractal = cheapFractal(fractalPos);
    fractal = smoothstep(0.2, 0.7, fractal);

    // Light 0
    vec2 toLight0 = uv - fracLight0UV;
    float fdist0 = length(toLight0);
    float ffalloff0 = exp(-fdist0 * uFractalFalloff) * uLight0Intensity;
    float vignette0 = smoothstep(0.6, 0.1, fdist0);
    fractalColor += saturate(uLightColor0, uFractalSaturation) * fractal * ffalloff0 * vignette0 * detailNebula;

    // Light 1
    vec2 toLight1 = uv - fracLight1UV;
    float fdist1 = length(toLight1);
    float ffalloff1 = exp(-fdist1 * uFractalFalloff) * uLight1Intensity;
    float vignette1 = smoothstep(0.6, 0.1, fdist1);
    fractalColor += saturate(uLightColor1, uFractalSaturation) * fractal * ffalloff1 * vignette1 * detailNebula;

    // Light 2
    vec2 toLight2 = uv - fracLight2UV;
    float fdist2 = length(toLight2);
    float ffalloff2 = exp(-fdist2 * uFractalFalloff) * uLight2Intensity;
    float vignette2 = smoothstep(0.6, 0.1, fdist2);
    fractalColor += saturate(uLightColor2, uFractalSaturation) * fractal * ffalloff2 * vignette2 * detailNebula;

    fractalColor *= uFractalIntensity;

    // ========================================
    // FINAL COMPOSITION
    // ========================================

    vec3 finalColor = deepSpace;
    finalColor += nebulaCol;
    finalColor += fractalColor;

    // Subtle mouse interaction glow
    float mouseDist = length(uv - uMouse);
    float mouseGlow = exp(-mouseDist * 5.0) * 0.02;
    finalColor += vec3(0.05, 0.08, 0.12) * mouseGlow;

    // Vignette (subtle darkening at edges)
    float vignette = 1.0 - length(uv - 0.5) * uVignetteStrength;
    finalColor *= vignette;

    // Soft tone mapping
    finalColor = finalColor / (finalColor + vec3(0.6));

    gl_FragColor = vec4(finalColor, 0.95);
}
`;
