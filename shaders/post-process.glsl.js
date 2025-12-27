// ============================================
// POST-PROCESS SHADERS
// Used for screen-space effects: blitting, compositing, post-processing
// ============================================

// Simple blit vertex shader - fullscreen quad
window.BLIT_VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Simple blit fragment shader - copies texture to screen
// Uses gl_FragCoord for UV to match planet shader sampling exactly
window.BLIT_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uTexture;
uniform vec2 uResolution;
void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    gl_FragColor = texture2D(uTexture, uv);
}
`;

// ============================================
// COMPREHENSIVE POST-PROCESS FRAGMENT SHADER
// Features: Edge fade, vignette, color grading, chromatic aberration,
//           film grain, sharpen, bloom approximation, tone mapping
// ============================================
window.POST_PROCESS_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;

// Edge fade
uniform float uEdgeFadeSize;
uniform float uEdgeFadePower;

// Vignette
uniform float uVignetteIntensity;
uniform float uVignetteRadius;
uniform float uVignetteSoftness;

// Color grading
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uGamma;

// Color balance
uniform vec3 uShadowsTint;
uniform vec3 uHighlightsTint;

// Chromatic aberration
uniform float uChromaticAberration;
uniform float uChromaticOffset;

// Film grain
uniform float uGrainIntensity;
uniform float uGrainSize;

// Bloom (multi-pass)
uniform float uBloomThreshold;
uniform float uBloomIntensity;
uniform float uBloomRadius;
uniform sampler2D uBloomTexture;
uniform float uBloomEnabled;  // 1.0 = use multi-pass bloom, 0.0 = use fallback
uniform float uBloomTint;

// Sharpen
uniform float uSharpenIntensity;

// Tone mapping
uniform float uExposure;
uniform int uToneMapping;

// Background color (#0a0f14)
const vec3 bgColor = vec3(0.039, 0.059, 0.078);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Random hash function for grain
float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// Luminance calculation
float luminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// Convert to/from linear space
vec3 toLinear(vec3 color) {
    return pow(color, vec3(2.2));
}

vec3 toGamma(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
}

// ============================================
// TONE MAPPING OPERATORS
// ============================================

// ACES Filmic Tone Mapping
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
    vec3 whiteScale = 1.0 / Uncharted2Tonemap(vec3(11.2));
    return curr * whiteScale;
}

// ============================================
// POST-PROCESS EFFECTS
// ============================================

// Edge fade to background
vec3 applyEdgeFade(vec3 color, vec2 uv) {
    if (uEdgeFadeSize <= 0.0) return color;

    float fadeSize = uEdgeFadeSize;
    float left = smoothstep(0.0, fadeSize, uv.x);
    float right = smoothstep(0.0, fadeSize, 1.0 - uv.x);
    float top = smoothstep(0.0, fadeSize, 1.0 - uv.y);
    float bottom = smoothstep(0.0, fadeSize, uv.y);

    float fade = left * right * top * bottom;
    fade = pow(fade, uEdgeFadePower);

    return mix(bgColor, color, fade);
}

// Vignette effect
vec3 applyVignette(vec3 color, vec2 uv) {
    if (uVignetteIntensity <= 0.0) return color;

    vec2 center = uv - 0.5;
    float dist = length(center);
    float vignette = 1.0 - smoothstep(uVignetteRadius - uVignetteSoftness, uVignetteRadius, dist);
    vignette = mix(1.0, vignette, uVignetteIntensity);

    return color * vignette;
}

// Chromatic aberration
vec3 applyChromaticAberration(vec2 uv) {
    if (uChromaticAberration <= 0.0) {
        return texture2D(uTexture, uv).rgb;
    }

    vec2 center = uv - 0.5;
    float dist = length(center);
    vec2 dir = normalize(center + 0.0001);
    float offset = uChromaticOffset * dist * uChromaticAberration;

    float r = texture2D(uTexture, uv + dir * offset).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - dir * offset).b;

    return vec3(r, g, b);
}

// Color grading: brightness, contrast, saturation
vec3 applyColorGrading(vec3 color) {
    // Brightness
    color *= uBrightness;

    // Contrast (pivot around 0.5)
    color = (color - 0.5) * uContrast + 0.5;

    // Saturation
    float lum = luminance(color);
    color = mix(vec3(lum), color, uSaturation);

    // Gamma correction
    color = pow(max(color, vec3(0.0)), vec3(1.0 / uGamma));

    return color;
}

// Color balance - tint shadows and highlights
vec3 applyColorBalance(vec3 color) {
    float lum = luminance(color);

    // Shadows influence (dark areas)
    float shadowMask = 1.0 - smoothstep(0.0, 0.5, lum);
    color += uShadowsTint * shadowMask * 0.5;

    // Highlights influence (bright areas)
    float highlightMask = smoothstep(0.5, 1.0, lum);
    color += uHighlightsTint * highlightMask * 0.5;

    return color;
}

// Film grain
vec3 applyFilmGrain(vec3 color, vec2 uv) {
    if (uGrainIntensity <= 0.0) return color;

    vec2 grainUV = uv * uResolution / uGrainSize;
    float grain = hash(grainUV + fract(uTime * 100.0)) - 0.5;

    // Reduce grain in bright areas
    float lum = luminance(color);
    float grainMask = 1.0 - lum * 0.5;

    color += grain * uGrainIntensity * grainMask;
    return color;
}

// Simple sharpen using unsharp mask
vec3 applySharpen(vec2 uv) {
    if (uSharpenIntensity <= 0.0) {
        return texture2D(uTexture, uv).rgb;
    }

    vec2 texelSize = 1.0 / uResolution;

    vec3 center = texture2D(uTexture, uv).rgb;
    vec3 blur = vec3(0.0);
    blur += texture2D(uTexture, uv + vec2(-texelSize.x, 0.0)).rgb;
    blur += texture2D(uTexture, uv + vec2(texelSize.x, 0.0)).rgb;
    blur += texture2D(uTexture, uv + vec2(0.0, -texelSize.y)).rgb;
    blur += texture2D(uTexture, uv + vec2(0.0, texelSize.y)).rgb;
    blur *= 0.25;

    vec3 sharpened = center + (center - blur) * uSharpenIntensity;
    return sharpened;
}

// Bloom - uses multi-pass bloom texture when available, falls back to single-pass approximation
vec3 applyBloom(vec3 color, vec2 uv) {
    if (uBloomIntensity <= 0.0) return color;

    // Use multi-pass bloom if enabled
    if (uBloomEnabled > 0.5) {
        vec3 bloom = texture2D(uBloomTexture, uv).rgb;

        // Optional: add slight warm tint to bloom (makes it feel more natural)
        vec3 tintedBloom = mix(bloom, bloom * vec3(1.1, 1.0, 0.9), uBloomTint);

        // Additive blend
        return color + tintedBloom * uBloomIntensity;
    }

    // Fallback: single-pass bloom approximation (for backwards compatibility)
    vec2 texelSize = 1.0 / uResolution;
    vec3 bloom = vec3(0.0);
    float totalWeight = 0.0;

    // Gaussian weights for 13-tap blur (sigma ~2.5)
    float weights[7];
    weights[0] = 0.199471;
    weights[1] = 0.176033;
    weights[2] = 0.120985;
    weights[3] = 0.064759;
    weights[4] = 0.026995;
    weights[5] = 0.008764;
    weights[6] = 0.002216;

    float scale = uBloomRadius * 8.0;

    // Horizontal + Vertical separable blur approximation in single pass
    // Sample in a star pattern for better coverage
    for (int i = 0; i < 7; i++) {
        float fi = float(i);
        float w = weights[i];

        // Horizontal samples
        vec2 offsetH = vec2(fi * scale, 0.0) * texelSize;
        vec3 sampleH1 = texture2D(uTexture, uv + offsetH).rgb;
        vec3 sampleH2 = texture2D(uTexture, uv - offsetH).rgb;

        // Vertical samples
        vec2 offsetV = vec2(0.0, fi * scale) * texelSize;
        vec3 sampleV1 = texture2D(uTexture, uv + offsetV).rgb;
        vec3 sampleV2 = texture2D(uTexture, uv - offsetV).rgb;

        // Diagonal samples for extra softness
        vec2 offsetD1 = vec2(fi, fi) * scale * 0.707 * texelSize;
        vec2 offsetD2 = vec2(fi, -fi) * scale * 0.707 * texelSize;
        vec3 sampleD1 = texture2D(uTexture, uv + offsetD1).rgb;
        vec3 sampleD2 = texture2D(uTexture, uv - offsetD1).rgb;
        vec3 sampleD3 = texture2D(uTexture, uv + offsetD2).rgb;
        vec3 sampleD4 = texture2D(uTexture, uv - offsetD2).rgb;

        // Extract bright parts based on threshold
        float t = uBloomThreshold;
        vec3 brightH1 = max(vec3(0.0), sampleH1 - t) * w;
        vec3 brightH2 = max(vec3(0.0), sampleH2 - t) * w;
        vec3 brightV1 = max(vec3(0.0), sampleV1 - t) * w;
        vec3 brightV2 = max(vec3(0.0), sampleV2 - t) * w;
        vec3 brightD1 = max(vec3(0.0), sampleD1 - t) * w * 0.5;
        vec3 brightD2 = max(vec3(0.0), sampleD2 - t) * w * 0.5;
        vec3 brightD3 = max(vec3(0.0), sampleD3 - t) * w * 0.5;
        vec3 brightD4 = max(vec3(0.0), sampleD4 - t) * w * 0.5;

        bloom += brightH1 + brightH2 + brightV1 + brightV2;
        bloom += brightD1 + brightD2 + brightD3 + brightD4;

        totalWeight += w * 4.0 + w * 2.0; // 4 cardinal + 4 diagonal (at half weight)
    }

    bloom /= totalWeight;

    // Add bloom to original color
    return color + bloom * uBloomIntensity * 3.0;
}

// Tone mapping
vec3 applyToneMapping(vec3 color) {
    // Apply exposure
    color *= uExposure;

    // Select tone mapping operator
    if (uToneMapping == 1) {
        color = ACESFilm(color);
    } else if (uToneMapping == 2) {
        color = Reinhard(color);
    } else if (uToneMapping == 3) {
        color = FilmicToneMapping(color);
    }
    // uToneMapping == 0 means no tone mapping

    return color;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    // Start with base color (with optional chromatic aberration)
    vec3 color;

    // Sharpen first if enabled (samples texture)
    if (uSharpenIntensity > 0.0) {
        color = applySharpen(uv);
    } else if (uChromaticAberration > 0.0) {
        color = applyChromaticAberration(uv);
    } else {
        color = texture2D(uTexture, uv).rgb;
    }

    // Apply bloom (adds glow to bright areas)
    color = applyBloom(color, uv);

    // Tone mapping (HDR to LDR conversion)
    color = applyToneMapping(color);

    // Color grading
    color = applyColorGrading(color);

    // Color balance
    color = applyColorBalance(color);

    // Film grain
    color = applyFilmGrain(color, uv);

    // Vignette
    color = applyVignette(color, uv);

    // Edge fade (always last - fades to background)
    color = applyEdgeFade(color, uv);

    // Clamp final output
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
`;

// Legacy alias for backwards compatibility
window.EDGE_FADE_FRAGMENT_SHADER = window.POST_PROCESS_FRAGMENT_SHADER;

// ============================================
// MULTI-PASS BLOOM SHADERS
// High-quality bloom with progressive downsampling/upsampling
// ============================================

// Bloom brightness threshold extraction
// Extracts pixels above threshold with very smooth falloff to avoid hard edges
window.BLOOM_THRESHOLD_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uThreshold;
uniform float uSoftKnee;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 color = texture2D(uTexture, uv).rgb;

    // Calculate luminance
    float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));

    // Very smooth threshold curve - no hard edges
    // Use a wide smoothstep for gradual falloff
    float kneeWidth = uSoftKnee * 0.5 + 0.1;  // Minimum 0.1 knee width
    float lowerBound = uThreshold - kneeWidth;
    float upperBound = uThreshold + kneeWidth;

    // Smooth S-curve from 0 at lowerBound to 1 at upperBound
    float contribution = smoothstep(lowerBound, upperBound, lum);

    // Apply cubic falloff for even softer edges
    contribution = contribution * contribution * (3.0 - 2.0 * contribution);

    // Scale by how much above threshold (preserves HDR intensity)
    float excess = max(0.0, lum - lowerBound);

    // Extract bright parts with smooth falloff
    vec3 bloom = color * contribution * (0.5 + excess);

    gl_FragColor = vec4(bloom, 1.0);
}
`;

// Gaussian blur - separable (run once for horizontal, once for vertical)
// Anamorphic bloom with smooth horizontal streaks
window.BLOOM_BLUR_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uDirection;  // (1,0) for horizontal, (0,1) for vertical
uniform float uBloomRadius;  // Controls blur spread (1.0 = base, higher = wider)
uniform float uAnamorphic;   // 0.0 = normal, 1.0 = full anamorphic (horizontal streaks)

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 texelSize = 1.0 / uResolution;

    // Determine if this is horizontal or vertical pass
    bool isHorizontal = uDirection.x > 0.5;

    // Anamorphic scaling: stretch horizontal, compress vertical
    float anamorphicScale;
    if (isHorizontal) {
        // Horizontal pass - subtle stretch for horizontal streaks
        anamorphicScale = 1.0 + uAnamorphic * 3.0;
    } else {
        // Vertical pass - compress to keep streaks thin
        anamorphicScale = max(0.2, 1.0 - uAnamorphic * 0.8);
    }

    // Tight spread per tap - taps must overlap for smooth result
    // Lower value = smoother but shorter streaks
    float baseSpread = 0.5 * uBloomRadius * anamorphicScale;
    vec2 step = uDirection * texelSize * baseSpread;

    // 25-tap blur with Gaussian weights for smooth falloff
    // Using tighter spacing to avoid visible banding
    vec3 result = vec3(0.0);
    float totalWeight = 0.0;

    // Gaussian kernel (sigma ~4)
    const int TAPS = 12;
    float weights[13];
    weights[0] = 1.0;
    weights[1] = 0.96;
    weights[2] = 0.88;
    weights[3] = 0.77;
    weights[4] = 0.64;
    weights[5] = 0.51;
    weights[6] = 0.38;
    weights[7] = 0.27;
    weights[8] = 0.18;
    weights[9] = 0.11;
    weights[10] = 0.06;
    weights[11] = 0.03;
    weights[12] = 0.01;

    // Center sample
    result += texture2D(uTexture, uv).rgb * weights[0];
    totalWeight += weights[0];

    // Symmetric taps
    for (int i = 1; i <= TAPS; i++) {
        float fi = float(i);
        float w = weights[i];
        vec2 offset = step * fi;

        result += texture2D(uTexture, uv + offset).rgb * w;
        result += texture2D(uTexture, uv - offset).rgb * w;
        totalWeight += w * 2.0;
    }

    result /= totalWeight;

    gl_FragColor = vec4(result, 1.0);
}
`;

// Bloom downsample - 4x4 box filter with bilinear optimization
// Takes average of 13 samples in pattern for high quality downsampling
window.BLOOM_DOWNSAMPLE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;  // Resolution of SOURCE texture

void main() {
    vec2 uv = gl_FragCoord.xy / (uResolution * 0.5);  // We're rendering at half res
    vec2 texelSize = 1.0 / uResolution;

    // 13-tap downsample pattern (Karis average approximation)
    // Samples arranged to avoid fireflies and preserve energy
    vec3 a = texture2D(uTexture, uv + texelSize * vec2(-1.0, -1.0)).rgb;
    vec3 b = texture2D(uTexture, uv + texelSize * vec2( 0.0, -1.0)).rgb;
    vec3 c = texture2D(uTexture, uv + texelSize * vec2( 1.0, -1.0)).rgb;
    vec3 d = texture2D(uTexture, uv + texelSize * vec2(-0.5, -0.5)).rgb;
    vec3 e = texture2D(uTexture, uv + texelSize * vec2( 0.5, -0.5)).rgb;
    vec3 f = texture2D(uTexture, uv + texelSize * vec2(-1.0,  0.0)).rgb;
    vec3 g = texture2D(uTexture, uv).rgb;
    vec3 h = texture2D(uTexture, uv + texelSize * vec2( 1.0,  0.0)).rgb;
    vec3 i = texture2D(uTexture, uv + texelSize * vec2(-0.5,  0.5)).rgb;
    vec3 j = texture2D(uTexture, uv + texelSize * vec2( 0.5,  0.5)).rgb;
    vec3 k = texture2D(uTexture, uv + texelSize * vec2(-1.0,  1.0)).rgb;
    vec3 l = texture2D(uTexture, uv + texelSize * vec2( 0.0,  1.0)).rgb;
    vec3 m = texture2D(uTexture, uv + texelSize * vec2( 1.0,  1.0)).rgb;

    // Weighted average (center samples weighted more)
    vec3 result = g * 0.125;
    result += (d + e + i + j) * 0.125;
    result += (a + b + f) * 0.0625;
    result += (b + c + h) * 0.0625;
    result += (f + k + l) * 0.0625;
    result += (h + l + m) * 0.0625;

    gl_FragColor = vec4(result, 1.0);
}
`;

// Bloom upsample - bilinear upsample with additive blend from higher mip
// Uses ping-pong: uTexture = lower mip to upsample, uHigherMip = copy of destination content
window.BLOOM_UPSAMPLE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;       // Lower mip (to be upsampled)
uniform sampler2D uHigherMip;     // Copy of destination content for blending
uniform vec2 uResolution;         // Resolution of output
uniform float uBloomRadius;       // Not used in upsample (kept for interface)
uniform float uAnamorphic;        // Not used in upsample (kept for interface)

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    // Sample upsampled lower mip (hardware bilinear does the upscale)
    vec3 upsampled = texture2D(uTexture, uv).rgb;

    // Sample the copy of what was in the destination
    vec3 existing = texture2D(uHigherMip, uv).rgb;

    // Additive blend: combine upsampled with existing
    vec3 result = upsampled + existing;

    gl_FragColor = vec4(result, 1.0);
}
`;

// Bloom composite - combines scene with bloom texture
window.BLOOM_COMPOSITE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexture;       // Original scene
uniform sampler2D uBloomTexture;  // Blurred bloom
uniform vec2 uResolution;
uniform float uBloomIntensity;
uniform float uBloomTint;         // 0 = no tint, 1 = full tint

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 scene = texture2D(uTexture, uv).rgb;
    vec3 bloom = texture2D(uBloomTexture, uv).rgb;

    // Optional: add slight warm tint to bloom (makes it feel more natural)
    vec3 tintedBloom = mix(bloom, bloom * vec3(1.1, 1.0, 0.9), uBloomTint);

    // Additive blend
    vec3 result = scene + tintedBloom * uBloomIntensity;

    gl_FragColor = vec4(result, 1.0);
}
`;

// Orbit line vertex shader - 2D lines with anti-aliasing support
// Draws lines as screen-aligned quads for proper AA
// Each line segment becomes 2 triangles (6 vertices)
window.ORBIT_LINE_VERTEX_SHADER = `
precision highp float;
attribute vec2 aPosition;      // Line endpoint position (screen pixels)
attribute vec2 aDirection;     // Direction along the line (normalized)
attribute float aSide;         // -1 or +1 for which side of the line center
uniform vec2 uResolution;
uniform float uLineWidth;      // Line width in pixels

varying float vDistance;       // Distance from line center for AA

void main() {
    // Perpendicular to line direction
    vec2 perpendicular = vec2(-aDirection.y, aDirection.x);

    // Offset position by half line width + 0.5 for AA margin
    float halfWidth = (uLineWidth * 0.5) + 0.5;
    vec2 offset = perpendicular * aSide * halfWidth;
    vec2 screenPos = aPosition + offset;

    // Pass distance from center to fragment shader (in pixels)
    vDistance = aSide * halfWidth;

    // Convert to clip space
    vec2 clipSpace = (screenPos / uResolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
}
`;

// Orbit line fragment shader - anti-aliased colored lines
// Uses distance from line center for smooth alpha falloff
window.ORBIT_LINE_FRAGMENT_SHADER = `
precision highp float;
uniform vec4 uColor;
uniform float uLineWidth;

varying float vDistance;  // Distance from line center (in pixels)

void main() {
    // Smooth falloff at edges using smoothstep
    // Line is solid up to half width, then fades over ~1 pixel at edges
    float halfWidth = uLineWidth * 0.5;
    float edgeDist = abs(vDistance);

    // Smoothstep creates anti-aliased edge
    // Solid from 0 to (halfWidth - 0.5), fade from there to (halfWidth + 0.5)
    float alpha = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, edgeDist);

    gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
}
`;

// ============================================
// LENS GHOST SHADERS
// Screen-space quads for lens flare ghost artifacts
// ============================================

// Lens ghost vertex shader - positions quad in screen space
window.LENS_GHOST_VERTEX_SHADER = `
precision highp float;
attribute vec2 aPosition;  // Quad vertex (-1 to 1)
uniform vec2 uResolution;
uniform vec2 uGhostPos;    // Screen position (pixels)
uniform float uGhostSize;  // Size in pixels

varying vec2 vUV;

void main() {
    // Pass UV for fragment shader (0-1 range)
    vUV = aPosition * 0.5 + 0.5;

    // Scale and position the quad
    vec2 screenPos = uGhostPos + aPosition * uGhostSize;

    // Convert to clip space
    vec2 clipPos = (screenPos / uResolution) * 2.0 - 1.0;
    clipPos.y = -clipPos.y;  // Flip Y for WebGL

    gl_Position = vec4(clipPos, 0.0, 1.0);
}
`;

// Lens ghost fragment shader - configurable aperture shape with chromatic aberration
window.LENS_GHOST_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUV;

uniform vec3 uGhostColor;      // Base color from light
uniform float uGhostIntensity; // Overall intensity
uniform float uGhostFalloff;   // Edge softness (0 = hard, 1 = very soft)
uniform float uRoundness;      // 0 = polygon, 1 = circle
uniform float uBladeCount;     // Aperture blade count (5-8)
uniform float uRotation;       // Shape rotation in radians
uniform float uAnamorphic;     // Horizontal stretch (-1 to 1)
uniform vec3 uTint;            // Color tint multiplier

#define PI 3.14159265359

// N-sided polygon distance function
float polygonDist(vec2 p, float sides) {
    float angle = atan(p.y, p.x);
    float slice = PI * 2.0 / sides;

    // Distance to edge of polygon
    float d = cos(floor(0.5 + angle / slice) * slice - angle) * length(p);
    return d;
}

// Rotate 2D point
vec2 rotate2D(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
    vec2 centered = vUV - 0.5;

    // Apply anamorphic stretch (negative = vertical, positive = horizontal)
    float stretchX = 1.0 + max(0.0, uAnamorphic) * 0.5;
    float stretchY = 1.0 + max(0.0, -uAnamorphic) * 0.5;
    vec2 stretched = centered * vec2(stretchX, stretchY);

    // Apply rotation
    vec2 rotated = rotate2D(stretched, uRotation);

    // Polygon shape (configurable blade count)
    float polyDist = polygonDist(rotated, uBladeCount) * 2.0;
    float circleDist = length(stretched) * 2.0;

    // Mix between polygon and circle based on roundness
    float dist = mix(polyDist, circleDist, uRoundness);

    // Softness controls where the fade starts (0 = hard edge at boundary, 1 = fade from center)
    float fadeStart = 1.0 - uGhostFalloff;
    float alpha = 1.0 - smoothstep(fadeStart, 1.0, dist);

    // Apply color tint
    vec3 color = uGhostColor * uTint;
    vec3 finalColor = color * alpha;

    gl_FragColor = vec4(finalColor * uGhostIntensity, alpha * uGhostIntensity);
}
`;
