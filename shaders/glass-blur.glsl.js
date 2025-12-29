/**
 * Glass Blur Shaders - Apple LiquidGlass-inspired frosted glass effect
 * WebGL 1 compatible version
 *
 * Multi-pass optimized Gaussian blur with SDF-based light refraction
 * Uses separable blur (horizontal + vertical) at reduced resolution
 */

// ============================================================================
// BLUR SHADERS - Optimized separable Gaussian blur (WebGL 1)
// ============================================================================

// Shared vertex shader for fullscreen quad
window.GLASS_BLUR_VERTEX_SHADER = `
precision highp float;

attribute vec2 aPosition;
varying vec2 vUV;

void main() {
    vUV = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Horizontal blur pass - optimized 9-tap Gaussian kernel with linear sampling
window.GLASS_BLUR_H_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uBlurRadius;

varying vec2 vUV;

void main() {
    // Optimized Gaussian weights using linear sampling
    // This samples between texels to get 2 samples in 1 fetch
    float weights[3];
    weights[0] = 0.227027027;  // center
    weights[1] = 0.316216216;  // combined 1+2
    weights[2] = 0.070270270;  // combined 3+4

    float offsets[3];
    offsets[0] = 0.0;
    offsets[1] = 1.384615385;  // optimized offset
    offsets[2] = 3.230769231;

    vec2 texOffset = uTexelSize * uBlurRadius;

    vec4 result = texture2D(uSource, vUV) * weights[0];

    for (int i = 1; i < 3; i++) {
        vec2 offset = vec2(offsets[i] * texOffset.x, 0.0);
        result += texture2D(uSource, vUV + offset) * weights[i];
        result += texture2D(uSource, vUV - offset) * weights[i];
    }

    gl_FragColor = result;
}
`;

// Vertical blur pass - optimized 9-tap Gaussian kernel
window.GLASS_BLUR_V_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uBlurRadius;

varying vec2 vUV;

void main() {
    float weights[3];
    weights[0] = 0.227027027;
    weights[1] = 0.316216216;
    weights[2] = 0.070270270;

    float offsets[3];
    offsets[0] = 0.0;
    offsets[1] = 1.384615385;
    offsets[2] = 3.230769231;

    vec2 texOffset = uTexelSize * uBlurRadius;

    vec4 result = texture2D(uSource, vUV) * weights[0];

    for (int i = 1; i < 3; i++) {
        vec2 offset = vec2(0.0, offsets[i] * texOffset.y);
        result += texture2D(uSource, vUV + offset) * weights[i];
        result += texture2D(uSource, vUV - offset) * weights[i];
    }

    gl_FragColor = result;
}
`;

// Kawase blur - ultra-fast blur for additional smoothing passes
window.GLASS_KAWASE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uOffset;

varying vec2 vUV;

void main() {
    vec2 off = uTexelSize * uOffset;

    vec4 sum = texture2D(uSource, vUV);
    sum += texture2D(uSource, vUV + vec2(-off.x, -off.y));
    sum += texture2D(uSource, vUV + vec2( off.x, -off.y));
    sum += texture2D(uSource, vUV + vec2(-off.x,  off.y));
    sum += texture2D(uSource, vUV + vec2( off.x,  off.y));

    gl_FragColor = sum * 0.2;
}
`;

// ============================================================================
// GLASS PANEL SHADER - SDF-based refraction with rounded rectangle
// ============================================================================

window.GLASS_PANEL_VERTEX_SHADER = `
precision highp float;

attribute vec2 aPosition;

uniform vec4 uPanelRect;  // x, y, width, height in clip space (-1 to 1)
uniform vec2 uResolution;

varying vec2 vUV;
varying vec2 vLocalUV;
varying vec2 vScreenUV;

void main() {
    // Local UV within panel (0-1)
    vLocalUV = aPosition * 0.5 + 0.5;

    // Transform to panel position in clip space
    vec2 clipPos = uPanelRect.xy + vLocalUV * uPanelRect.zw;

    // Screen UV for sampling blur texture (0-1 range)
    vScreenUV = clipPos * 0.5 + 0.5;

    vUV = vLocalUV;

    gl_Position = vec4(clipPos, 0.0, 1.0);
}
`;

window.GLASS_PANEL_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uBlurredScene;
uniform vec2 uResolution;
uniform vec2 uPanelSize;       // Panel size in pixels

// Glass material properties
uniform float uCornerRadius;
uniform float uEdgeSoftness;
uniform float uRefractStrength;
uniform float uRefractSmoothness;
uniform float uRefractFalloff;
uniform float uGlassOpacity;
uniform vec3 uGlassTint;
uniform float uChromaticAberration;

// Tone mapping (must match post-process)
uniform float uExposure;
uniform int uToneMapping;

varying vec2 vUV;
varying vec2 vLocalUV;
varying vec2 vScreenUV;

// ACES Filmic Tone Mapping (same as post-process.glsl.js)
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Reinhard Tone Mapping
vec3 Reinhard(vec3 x) {
    return x / (1.0 + x);
}

// Uncharted 2 / Filmic Tone Mapping
vec3 Uncharted2Tonemap(vec3 x) {
    float A = 0.15;
    float B = 0.50;
    float C = 0.10;
    float D = 0.20;
    float E = 0.02;
    float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 FilmicToneMapping(vec3 color) {
    vec3 curr = Uncharted2Tonemap(color * 2.0);
    vec3 whiteScale = vec3(1.0) / Uncharted2Tonemap(vec3(11.2));
    return curr * whiteScale;
}

vec3 applyToneMapping(vec3 color) {
    color *= uExposure;
    if (uToneMapping == 1) {
        color = ACESFilm(color);
    } else if (uToneMapping == 2) {
        color = Reinhard(color);
    } else if (uToneMapping == 3) {
        color = FilmicToneMapping(color);
    }
    return color;
}

// Rounded rectangle SDF
float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// Compute edge refraction using finite differences with controllable smoothness
vec2 computeEdgeRefraction(vec2 uv, vec2 size, float radius, float smoothness, float falloff) {
    vec2 p = (uv - 0.5) * size;
    vec2 b = size * 0.5;

    float d = sdRoundedBox(p, b, radius);

    // Smoothness controls gradient sampling distance (higher = smoother transitions)
    float eps = max(1.0, smoothness);

    float dx = sdRoundedBox(p + vec2(eps, 0.0), b, radius) - sdRoundedBox(p - vec2(eps, 0.0), b, radius);
    float dy = sdRoundedBox(p + vec2(0.0, eps), b, radius) - sdRoundedBox(p - vec2(0.0, eps), b, radius);

    vec2 grad = vec2(dx, dy) / (2.0 * eps);

    // Falloff controls how far refraction extends into the panel interior
    float edgeDist = -d;  // positive inside
    float edgeFade = 1.0 - smoothstep(0.0, radius * falloff, edgeDist);

    // Additional smoothing: reduce gradient magnitude smoothly
    float gradLen = length(grad);
    if (gradLen > 0.001) {
        grad = grad / gradLen * smoothstep(0.0, 0.5, gradLen);
    }

    return grad * edgeFade;
}

void main() {
    vec2 pixelSize = uPanelSize;
    vec2 p = (vLocalUV - 0.5) * pixelSize;
    vec2 b = pixelSize * 0.5;

    // Compute SDF and mask
    float d = sdRoundedBox(p, b, uCornerRadius);
    float mask = 1.0 - smoothstep(-uEdgeSoftness, uEdgeSoftness, d);

    if (mask < 0.001) {
        discard;
    }

    // Compute edge refraction (only near rounded corners, flat in center)
    vec2 edgeRefract = computeEdgeRefraction(vLocalUV, pixelSize, uCornerRadius, uRefractSmoothness, uRefractFalloff);
    vec2 refractOffset = -edgeRefract * uRefractStrength * 0.01;

    // Sample blurred background with optional chromatic aberration at edges
    vec2 baseUV = vScreenUV + refractOffset;

    vec3 blurredColor;
    if (uChromaticAberration > 0.001) {
        // Chromatic aberration scales with edge refraction strength
        float aberrationAmount = length(edgeRefract) * uChromaticAberration * 0.003;
        vec2 aberrationDir = length(edgeRefract) > 0.001 ? normalize(edgeRefract) : vec2(1.0, 0.0);

        blurredColor.r = texture2D(uBlurredScene, baseUV + aberrationDir * aberrationAmount).r;
        blurredColor.g = texture2D(uBlurredScene, baseUV).g;
        blurredColor.b = texture2D(uBlurredScene, baseUV - aberrationDir * aberrationAmount).b;
    } else {
        blurredColor = texture2D(uBlurredScene, baseUV).rgb;
    }

    // Apply tone mapping to match the post-processed background
    vec3 color = applyToneMapping(blurredColor);

    // Apply glass tint
    color = mix(color, color * uGlassTint, uGlassOpacity);

    // Alpha: fully opaque with soft edges from SDF mask
    float alpha = mask;

    gl_FragColor = vec4(color, alpha);
}
`;

// ============================================================================
// DOWNSAMPLE SHADER - Bilinear 4-tap downsample
// ============================================================================

window.GLASS_DOWNSAMPLE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexelSize;

varying vec2 vUV;

void main() {
    vec2 off = uTexelSize * 0.5;

    vec4 sum = texture2D(uSource, vUV + vec2(-off.x, -off.y));
    sum += texture2D(uSource, vUV + vec2( off.x, -off.y));
    sum += texture2D(uSource, vUV + vec2(-off.x,  off.y));
    sum += texture2D(uSource, vUV + vec2( off.x,  off.y));

    gl_FragColor = sum * 0.25;
}
`;

// ============================================================================
// BLIT SHADER - Simple copy
// ============================================================================

window.GLASS_BLIT_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;

varying vec2 vUV;

void main() {
    gl_FragColor = texture2D(uSource, vUV);
}
`;
