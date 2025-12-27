// Screen-Space Volumetric Light Shader
// Renders volumetric light scattering from scene light sources
// Uses screen-space positions with camera-aware visibility

window.VOLUMETRIC_LIGHT_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUV;

void main() {
    vUV = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

window.VOLUMETRIC_LIGHT_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;

uniform vec2 uResolution;
uniform float uTime;
uniform float uCameraRotX;  // Camera pitch
uniform float uCameraRotY;  // Camera yaw

// Light sources (world space positions - vec3 with z depth)
uniform vec3 uLight0WorldPos;
uniform vec3 uLight1WorldPos;
uniform vec3 uLight2WorldPos;
uniform vec3 uLightColor0;
uniform vec3 uLightColor1;
uniform vec3 uLightColor2;
uniform float uLight0Intensity;
uniform float uLight1Intensity;
uniform float uLight2Intensity;

// Volumetric light parameters
uniform float uVolumetricIntensity;     // Overall light brightness (default 1.0)
uniform float uVolumetricFalloff;       // Falloff exponent (default 2.0, inverse-square law)
uniform float uVolumetricScale;         // Distance scale factor (default 3.0, controls spread)
uniform float uVolumetricSaturation;    // Color saturation boost (default 1.8)
uniform float uVolumetricNoiseScale;    // Edge noise frequency (default 4.0)
uniform float uVolumetricNoiseStrength; // Edge noise displacement (default 0.12)
uniform float uVolumetricNoiseOctaves;  // Noise detail level 0-1 (default 0.5, blends octaves)
uniform float uVolumetricScatterR;      // Red channel scatter rate (default 0.3, lower = less scatter)
uniform float uVolumetricScatterG;      // Green channel scatter rate (default 0.5)
uniform float uVolumetricScatterB;      // Blue channel scatter rate (default 1.0, higher = more scatter)
uniform float uVignetteStrength;        // Vignette darkness (default 0.3)

// Screen-space light positions (camera-transformed, in pixels)
uniform vec2 uLight0Screen;
uniform vec2 uLight1Screen;
uniform vec2 uLight2Screen;

// Light visibility (0.0 = behind camera, 1.0 = visible)
uniform float uLight0Visible;
uniform float uLight1Visible;
uniform float uLight2Visible;

// Camera position (world space)
uniform vec3 uCameraPos;

// ========================================
// UTILITY FUNCTIONS
// ========================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// ========================================
// 3D SIMPLEX NOISE
// ========================================

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
// SKYBOX RAY DIRECTION (for 3D noise sampling)
// ========================================

vec3 getSkyboxDirection(vec2 screenPos) {
    float fov = 0.8;
    vec3 rayDir = normalize(vec3(screenPos.x * fov, screenPos.y * fov, 1.0));

    float cosRotX = cos(uCameraRotX);
    float sinRotX = sin(uCameraRotX);
    float cosRotY = cos(uCameraRotY);
    float sinRotY = sin(uCameraRotY);

    // Rotate around X axis (pitch)
    float ry = rayDir.y * cosRotX - rayDir.z * sinRotX;
    float rz = rayDir.y * sinRotX + rayDir.z * cosRotX;
    rayDir.y = ry;
    rayDir.z = rz;

    // Rotate around Y axis (yaw)
    float rx = rayDir.x * cosRotY + rayDir.z * sinRotY;
    rz = -rayDir.x * sinRotY + rayDir.z * cosRotY;
    rayDir.x = rx;
    rayDir.z = rz;

    return rayDir;
}

// ========================================
// VOLUMETRIC LIGHT NOISE
// ========================================

float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float volumetricNoise3D(vec3 p) {
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

// FBM with controllable octaves
float volumetricFBM(vec3 p) {
    float totalAmp = 0.5;
    float v = volumetricNoise3D(p) * 0.5;

    // Second octave
    float oct2 = uVolumetricNoiseOctaves * 2.0;
    oct2 = clamp(oct2, 0.0, 1.0);
    v += volumetricNoise3D(p * 2.0) * 0.25 * oct2;
    totalAmp += 0.25 * oct2;

    // Third octave (only when octaves > 0.5)
    float oct3 = (uVolumetricNoiseOctaves - 0.5) * 2.0;
    oct3 = clamp(oct3, 0.0, 1.0);
    v += volumetricNoise3D(p * 4.0) * 0.125 * oct3;
    totalAmp += 0.125 * oct3;

    return v / totalAmp;
}

// Sample noise at a world position
float sampleNoiseAt(vec3 worldPos, float lightIndex) {
    vec3 pos = worldPos * uVolumetricNoiseScale + vec3(0.0, 0.0, lightIndex * 50.0 + uTime * 0.02);
    return volumetricFBM(pos);
}

// ========================================
// VOLUMETRIC LIGHT
// ========================================

// Single light volumetric contribution
// Uses physically-based inverse-power falloff: I / d^n
// lightWorldPos is the 3D world position of the light for perspective-correct falloff
vec3 volumetricLight(vec2 uv, vec2 lightScreenPos, vec3 lightColor, float lightIndex, vec3 skyDir, float lightIntensity, float lightVisible, vec3 lightWorldPos) {
    // Skip lights that are behind the camera
    if (lightVisible < 0.01) return vec3(0.0);

    vec2 lightUV = lightScreenPos / uResolution;
    lightUV.y = 1.0 - lightUV.y;

    // Aspect-corrected distance in screen space
    vec2 delta = uv - lightUV;
    delta.x *= uResolution.x / uResolution.y;
    float screenDist = length(delta);

    // Compute camera-to-light distance for perspective correction
    // This makes the falloff radius appear constant regardless of camera distance
    float lightDepth = length(lightWorldPos - uCameraPos);

    // Normalize perspective scale against a reference distance (typical viewing distance ~1.0)
    // This preserves the current look at normal zoom while making it perspective-correct
    float referenceDepth = 1.0;
    float perspectiveScale = max(lightDepth, 0.1) / referenceDepth;

    // Scale screen distance by depth ratio to get perspective-correct distance
    // At reference distance: perspectiveScale = 1.0, no change
    // Farther away: perspectiveScale > 1.0, shrinks apparent radius
    // Closer: perspectiveScale < 1.0, grows apparent radius
    float dist = screenDist * perspectiveScale;

    // Early out for distant pixels (adjusted for perspective)
    if (screenDist > 2.0) return vec3(0.0);

    // Sample fog density at current position
    float density = sampleNoiseAt(skyDir, lightIndex);

    // Base light falloff (inverse-power law)
    float light = 1.0 / (1.0 + pow(dist * uVolumetricScale, uVolumetricFalloff));

    // Modulate by local fog density
    light *= 1.0 + (density - 0.5) * uVolumetricNoiseStrength;

    // Apply intensity
    light *= uVolumetricIntensity * lightIntensity;

    // Saturate color for more vivid appearance
    float luma = dot(lightColor, vec3(0.299, 0.587, 0.114));
    vec3 saturatedColor = mix(vec3(luma), lightColor, uVolumetricSaturation);

    // Apply visibility
    return saturatedColor * light * lightVisible;
}

// Combined volumetric light from all sources
vec3 volumetricLightContribution(vec2 uv, vec3 skyDir) {
    vec3 result = vec3(0.0);
    result += volumetricLight(uv, uLight0Screen, uLightColor0, 0.0, skyDir, uLight0Intensity, uLight0Visible, uLight0WorldPos);
    result += volumetricLight(uv, uLight1Screen, uLightColor1, 1.0, skyDir, uLight1Intensity, uLight1Visible, uLight1WorldPos);
    result += volumetricLight(uv, uLight2Screen, uLightColor2, 2.0, skyDir, uLight2Intensity, uLight2Visible, uLight2WorldPos);
    return result;
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

    // Compute volumetric light
    vec3 finalColor = volumetricLightContribution(uv, skyDir);

    // Vignette (subtle darkening at edges)
    float vignette = 1.0 - length(uv - 0.5) * uVignetteStrength;
    finalColor *= vignette;

    // Soft tone mapping
    finalColor = finalColor / (finalColor + vec3(0.6));

    // Base background color matching website's --bg-primary: #0a0f14
    vec3 bgColor = vec3(0.039, 0.059, 0.078);
    finalColor = max(finalColor, bgColor);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;
