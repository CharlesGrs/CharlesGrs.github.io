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

// Volumetric light parameters
uniform float uGodRaysIntensity;   // Overall light brightness (default 1.0)
uniform float uGodRaysFalloff;     // Falloff exponent (default 2.0, inverse-square law)
uniform float uGodRaysScale;       // Distance scale factor (default 3.0, controls spread)
uniform float uGodRaysSaturation;  // Color saturation boost (default 1.8)
uniform float uGodRaysNoiseScale;  // Edge noise frequency (default 4.0)
uniform float uGodRaysNoiseStrength; // Edge noise displacement (default 0.12)
uniform float uGodRaysNoiseOctaves; // Noise detail level 0-1 (default 0.5, blends octaves)
uniform float uGodRaysShadow;      // Self-shadowing intensity (default 0.5)
uniform float uGodRaysShadowOffset; // World-space offset away from light (default 0.3)
uniform float uGodRaysScatterR;    // Red channel scatter rate (default 0.3, lower = less scatter)
uniform float uGodRaysScatterG;    // Green channel scatter rate (default 0.5)
uniform float uGodRaysScatterB;    // Blue channel scatter rate (default 1.0, higher = more scatter)

// Screen-space light positions (camera-transformed, in pixels)
uniform vec2 uLight0Screen;
uniform vec2 uLight1Screen;
uniform vec2 uLight2Screen;

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

// Transform world position to screen position
vec2 worldToScreen(vec2 worldPos) {
    return worldPos;  // No zoom transform needed
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
// GOD RAYS / VOLUMETRIC LIGHT
// ========================================

// Simple 3D hash for god rays noise
float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// Value noise for god rays
float godRaysNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash31(i);
    float b = hash31(i + vec3(1.0, 0.0, 0.0));
    float c = hash31(i + vec3(0.0, 1.0, 0.0));
    float d = hash31(i + vec3(1.0, 1.0, 0.0));
    float e = hash31(i + vec3(0.0, 0.0, 1.0));
    float f1 = hash31(i + vec3(1.0, 0.0, 1.0));
    float g = hash31(i + vec3(0.0, 1.0, 1.0));
    float h = hash31(i + vec3(1.0, 1.0, 1.0));

    return mix(
        mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
        mix(mix(e, f1, f.x), mix(g, h, f.x), f.y),
        f.z
    );
}

// FBM for god rays with controllable octaves
float godRaysFBM(vec3 p) {
    float totalAmp = 0.5;
    float v = godRaysNoise3D(p) * 0.5;

    // Second octave (blend in based on uGodRaysNoiseOctaves)
    float oct2 = uGodRaysNoiseOctaves * 2.0;  // 0-1 maps to 0-2, clamp to 0-1
    oct2 = clamp(oct2, 0.0, 1.0);
    v += godRaysNoise3D(p * 2.0) * 0.25 * oct2;
    totalAmp += 0.25 * oct2;

    // Third octave (only when octaves > 0.5)
    float oct3 = (uGodRaysNoiseOctaves - 0.5) * 2.0;  // 0.5-1 maps to 0-1
    oct3 = clamp(oct3, 0.0, 1.0);
    v += godRaysNoise3D(p * 4.0) * 0.125 * oct3;
    totalAmp += 0.125 * oct3;

    return v / totalAmp;  // Normalize
}

// Sample noise at a world position (for consistent noise in 3D space)
float sampleNoiseAt(vec3 worldPos, float lightIndex) {
    vec3 pos = worldPos * uGodRaysNoiseScale + vec3(0.0, 0.0, lightIndex * 50.0 + uTime * 0.02);
    return godRaysFBM(pos);
}

// Single light volumetric contribution with self-shadowing
// Uses physically-based inverse-power falloff: I / d^n
// where n=2 gives inverse-square law (physically accurate for point lights)
vec3 godRaysLight(vec2 uv, vec2 lightPos, vec3 lightColor, float lightIndex, vec3 skyDir, float lightIntensity) {
    vec2 lightUV = lightPos / uResolution;
    lightUV.y = 1.0 - lightUV.y;

    // Aspect-corrected distance
    vec2 delta = uv - lightUV;
    delta.x *= uResolution.x / uResolution.y;
    float dist = length(delta);

    // Early out for distant pixels
    if (dist > 2.0) return vec3(0.0);

    // Sample fog density at current position (noise = density field)
    // High density = more light scattered toward camera = brighter volumetric
    float density = sampleNoiseAt(skyDir, lightIndex);

    // Self-shadowing with chromatic absorption (Beer-Lambert style)
    // Sample fog density between us and the light, apply wavelength-dependent absorption
    vec3 shadow = vec3(1.0);
    if (uGodRaysShadow > 0.001 && uGodRaysShadowOffset > 0.001) {
        // Get light's world direction using the same method as skyDir
        vec2 lightScreen = (lightUV - 0.5) * 2.0;
        lightScreen.x *= uResolution.x / uResolution.y;
        vec3 lightWorldDir = getSkyboxDirection(lightScreen);

        // Direction from current pixel toward light
        vec3 towardLight = normalize(lightWorldDir - skyDir);

        // Sample fog density at offset position (between us and light)
        vec3 offsetPos = normalize(skyDir + towardLight * uGodRaysShadowOffset);
        float fogDensityThere = sampleNoiseAt(offsetPos, lightIndex);

        // Optical depth from two components:
        // 1. Density at offset position (toward light)
        // 2. Gradient: if density increases toward light, extra shadow
        float gradient = max(0.0, fogDensityThere - density);
        float opticalDepth = (fogDensityThere + gradient) * uGodRaysShadow;

        // Absorption coefficients per channel (Rayleigh-like: blue scatters/absorbs most)
        vec3 absorption = vec3(uGodRaysScatterR, uGodRaysScatterG, uGodRaysScatterB);

        // Beer-Lambert transmittance: T = exp(-optical_depth * absorption)
        shadow = exp(-opticalDepth * absorption * 3.0);
    }

    // Base light falloff (inverse-power law)
    float light = 1.0 / (1.0 + pow(dist * uGodRaysScale, uGodRaysFalloff));

    // Modulate by local fog density - dense fog adds brightness, sparse is baseline
    // density centered around 0.5, so (density - 0.5) gives -0.5 to +0.5 range
    light *= 1.0 + (density - 0.5) * uGodRaysNoiseStrength;

    // Apply intensity
    light *= uGodRaysIntensity * lightIntensity;

    // Saturate color for more vivid appearance
    float luma = dot(lightColor, vec3(0.299, 0.587, 0.114));
    vec3 saturatedColor = mix(vec3(luma), lightColor, uGodRaysSaturation);

    // Apply chromatic shadow (each channel affected differently)
    return saturatedColor * light * shadow;
}

// Combined god rays from all lights (includes core scattering + noisy halo)
vec3 godRaysContribution(vec2 uv, vec3 skyDir) {
    // Use pre-computed screen-space positions (already camera-transformed in JS)
    vec3 rays = vec3(0.0);
    rays += godRaysLight(uv, uLight0Screen, uLightColor0, 0.0, skyDir, uLight0Intensity);
    rays += godRaysLight(uv, uLight1Screen, uLightColor1, 1.0, skyDir, uLight1Intensity);
    rays += godRaysLight(uv, uLight2Screen, uLightColor2, 2.0, skyDir, uLight2Intensity);

    return rays;
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

    // ========================================
    // VOLUMETRIC LIGHT (Core scattering + Noisy halo)
    // ========================================

    vec3 godRays = godRaysContribution(uv, skyDir);

    // ========================================

    vec3 finalColor = godRays;

    // Vignette (subtle darkening at edges)
    float vignette = 1.0 - length(uv - 0.5) * uVignetteStrength;
    finalColor *= vignette;

    // Soft tone mapping
    finalColor = finalColor / (finalColor + vec3(0.6));

    gl_FragColor = vec4(max(vec3(0.0), finalColor), 1.0);
}
`;
