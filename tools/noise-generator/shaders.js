/**
 * NOISE LAB - GLSL Shader Library
 * Collection of noise generation shaders with seamless tiling support
 */

// Common vertex shader for fullscreen quad
const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Common noise functions shared by all fragment shaders
const NOISE_COMMON = `
// Hash functions for procedural generation
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

vec3 hash3(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yxx) * p3.zyx);
}

float hash1(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth interpolation
vec2 smoothstepDeriv(vec2 t) {
    return 6.0 * t * (1.0 - t);
}

vec2 quintic(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Gradient rotation for domain warping
mat2 rot2(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}
`;

// Perlin Noise Shader
const PERLIN_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_scale;
uniform float u_seed;
uniform float u_contrast;
uniform float u_brightness;
uniform vec2 u_offset;
uniform bool u_seamless;
uniform float u_time;

${NOISE_COMMON}

// Classic Perlin gradient noise
float gradientNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = quintic(f);

    vec2 ga = hash2(i + vec2(0.0, 0.0)) * 2.0 - 1.0;
    vec2 gb = hash2(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
    vec2 gc = hash2(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
    vec2 gd = hash2(i + vec2(1.0, 1.0)) * 2.0 - 1.0;

    float va = dot(ga, f - vec2(0.0, 0.0));
    float vb = dot(gb, f - vec2(1.0, 0.0));
    float vc = dot(gc, f - vec2(0.0, 1.0));
    float vd = dot(gd, f - vec2(1.0, 1.0));

    return mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y);
}

// Seamless tiling version using domain repetition
float seamlessNoise(vec2 uv, float scale) {
    vec2 p = uv * scale;

    if (u_seamless) {
        // Toroidal mapping for seamless tiling
        float s = scale;
        vec2 p1 = vec2(gradientNoise(p), gradientNoise(p + vec2(5.2, 1.3)));
        vec2 p2 = vec2(gradientNoise(p + vec2(s, 0.0)), gradientNoise(p + vec2(s + 5.2, 1.3)));
        vec2 p3 = vec2(gradientNoise(p + vec2(0.0, s)), gradientNoise(p + vec2(5.2, s + 1.3)));
        vec2 p4 = vec2(gradientNoise(p + vec2(s, s)), gradientNoise(p + vec2(s + 5.2, s + 1.3)));

        vec2 f = uv;
        float nx = mix(p1.x, p2.x, f.x);
        float ny = mix(p3.x, p4.x, f.x);
        return mix(nx, ny, f.y);
    }

    return gradientNoise(p);
}

void main() {
    vec2 uv = v_uv + u_offset;
    float n = seamlessNoise(uv + u_seed * 0.1, u_scale);

    // Normalize from [-1, 1] to [0, 1]
    n = n * 0.5 + 0.5;

    // Apply contrast and brightness
    n = (n - 0.5) * u_contrast + 0.5 + u_brightness;
    n = clamp(n, 0.0, 1.0);

    fragColor = vec4(vec3(n), 1.0);
}`;

// Worley (Cellular) Noise Shader
const WORLEY_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_scale;
uniform float u_seed;
uniform float u_contrast;
uniform float u_brightness;
uniform vec2 u_offset;
uniform bool u_seamless;
uniform int u_distanceType; // 0: F1, 1: F2, 2: F2-F1
uniform float u_jitter;

${NOISE_COMMON}

vec2 worley(vec2 p, out float f1, out float f2) {
    vec2 n = floor(p);
    vec2 f = fract(p);

    f1 = 1.0;
    f2 = 1.0;
    vec2 closestPoint = vec2(0.0);

    for (int j = -2; j <= 2; j++) {
        for (int i = -2; i <= 2; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g) * u_jitter;
            vec2 delta = g + o - f;
            float d = dot(delta, delta);

            if (d < f1) {
                f2 = f1;
                f1 = d;
                closestPoint = n + g + o;
            } else if (d < f2) {
                f2 = d;
            }
        }
    }

    f1 = sqrt(f1);
    f2 = sqrt(f2);
    return closestPoint;
}

float seamlessWorley(vec2 uv, float scale) {
    vec2 p = uv * scale;
    float f1, f2;

    if (u_seamless) {
        // Sample at corners for seamless blending
        float s = scale;
        float f1a, f2a, f1b, f2b, f1c, f2c, f1d, f2d;

        worley(p, f1a, f2a);
        worley(p + vec2(s, 0.0), f1b, f2b);
        worley(p + vec2(0.0, s), f1c, f2c);
        worley(p + vec2(s, s), f1d, f2d);

        vec2 f = uv;
        // Cosine interpolation for smoother seams
        vec2 t = (1.0 - cos(f * 3.14159)) * 0.5;

        f1 = mix(mix(f1a, f1b, t.x), mix(f1c, f1d, t.x), t.y);
        f2 = mix(mix(f2a, f2b, t.x), mix(f2c, f2d, t.x), t.y);
    } else {
        worley(p, f1, f2);
    }

    // Select distance type
    if (u_distanceType == 0) return f1;
    if (u_distanceType == 1) return f2;
    return f2 - f1;
}

void main() {
    vec2 uv = v_uv + u_offset;
    float n = seamlessWorley(uv + u_seed * 0.1, u_scale);

    // Normalize
    n = clamp(n, 0.0, 1.0);

    // Apply contrast and brightness
    n = (n - 0.5) * u_contrast + 0.5 + u_brightness;
    n = clamp(n, 0.0, 1.0);

    fragColor = vec4(vec3(n), 1.0);
}`;

// FBM (Fractal Brownian Motion) Shader
const FBM_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_scale;
uniform float u_seed;
uniform float u_contrast;
uniform float u_brightness;
uniform vec2 u_offset;
uniform bool u_seamless;
uniform int u_octaves;
uniform float u_lacunarity;
uniform float u_gain;
uniform float u_amplitude;

${NOISE_COMMON}

float gradientNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = quintic(f);

    vec2 ga = hash2(i + vec2(0.0, 0.0)) * 2.0 - 1.0;
    vec2 gb = hash2(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
    vec2 gc = hash2(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
    vec2 gd = hash2(i + vec2(1.0, 1.0)) * 2.0 - 1.0;

    float va = dot(ga, f - vec2(0.0, 0.0));
    float vb = dot(gb, f - vec2(1.0, 0.0));
    float vc = dot(gc, f - vec2(0.0, 1.0));
    float vd = dot(gd, f - vec2(1.0, 1.0));

    return mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = u_amplitude;
    float frequency = 1.0;
    float maxValue = 0.0;

    for (int i = 0; i < 8; i++) {
        if (i >= u_octaves) break;

        value += amplitude * gradientNoise(p * frequency);
        maxValue += amplitude;
        amplitude *= u_gain;
        frequency *= u_lacunarity;
    }

    return value / maxValue;
}

float seamlessFbm(vec2 uv, float scale) {
    vec2 p = uv * scale + u_seed * 0.1;

    if (u_seamless) {
        float s = scale;
        vec2 f = uv;
        vec2 t = (1.0 - cos(f * 3.14159)) * 0.5;

        float n1 = fbm(p);
        float n2 = fbm(p + vec2(s, 0.0));
        float n3 = fbm(p + vec2(0.0, s));
        float n4 = fbm(p + vec2(s, s));

        return mix(mix(n1, n2, t.x), mix(n3, n4, t.x), t.y);
    }

    return fbm(p);
}

void main() {
    vec2 uv = v_uv + u_offset;
    float n = seamlessFbm(uv, u_scale);

    // Normalize
    n = n * 0.5 + 0.5;

    // Apply contrast and brightness
    n = (n - 0.5) * u_contrast + 0.5 + u_brightness;
    n = clamp(n, 0.0, 1.0);

    fragColor = vec4(vec3(n), 1.0);
}`;

// Domain Warp Noise Shader
const WARP_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_scale;
uniform float u_seed;
uniform float u_contrast;
uniform float u_brightness;
uniform vec2 u_offset;
uniform bool u_seamless;
uniform float u_warpStrength;
uniform int u_warpIterations;
uniform int u_octaves;
uniform float u_lacunarity;
uniform float u_gain;

${NOISE_COMMON}

float gradientNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = quintic(f);

    vec2 ga = hash2(i + vec2(0.0, 0.0)) * 2.0 - 1.0;
    vec2 gb = hash2(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
    vec2 gc = hash2(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
    vec2 gd = hash2(i + vec2(1.0, 1.0)) * 2.0 - 1.0;

    float va = dot(ga, f - vec2(0.0, 0.0));
    float vb = dot(gb, f - vec2(1.0, 0.0));
    float vc = dot(gc, f - vec2(0.0, 1.0));
    float vd = dot(gd, f - vec2(1.0, 1.0));

    return mix(mix(va, vb, u.x), mix(vc, vd, u.x), u.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        if (i >= u_octaves) break;
        value += amplitude * gradientNoise(p * frequency);
        amplitude *= u_gain;
        frequency *= u_lacunarity;
    }

    return value;
}

float domainWarp(vec2 p) {
    vec2 q = p;

    for (int i = 0; i < 4; i++) {
        if (i >= u_warpIterations) break;

        vec2 warp = vec2(
            fbm(q + vec2(0.0, 0.0)),
            fbm(q + vec2(5.2, 1.3))
        );

        q = p + u_warpStrength * warp;
    }

    return fbm(q);
}

float seamlessWarp(vec2 uv, float scale) {
    vec2 p = uv * scale + u_seed * 0.1;

    if (u_seamless) {
        float s = scale;
        vec2 f = uv;
        vec2 t = (1.0 - cos(f * 3.14159)) * 0.5;

        float n1 = domainWarp(p);
        float n2 = domainWarp(p + vec2(s, 0.0));
        float n3 = domainWarp(p + vec2(0.0, s));
        float n4 = domainWarp(p + vec2(s, s));

        return mix(mix(n1, n2, t.x), mix(n3, n4, t.x), t.y);
    }

    return domainWarp(p);
}

void main() {
    vec2 uv = v_uv + u_offset;
    float n = seamlessWarp(uv, u_scale);

    // Normalize
    n = n * 0.5 + 0.5;

    // Apply contrast and brightness
    n = (n - 0.5) * u_contrast + 0.5 + u_brightness;
    n = clamp(n, 0.0, 1.0);

    fragColor = vec4(vec3(n), 1.0);
}`;

// Simplex Noise Shader
const SIMPLEX_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_scale;
uniform float u_seed;
uniform float u_contrast;
uniform float u_brightness;
uniform vec2 u_offset;
uniform bool u_seamless;

${NOISE_COMMON}

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
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
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float seamlessSimplex(vec2 uv, float scale) {
    vec2 p = uv * scale + u_seed * 0.1;

    if (u_seamless) {
        float s = scale;
        vec2 f = uv;
        vec2 t = (1.0 - cos(f * 3.14159)) * 0.5;

        float n1 = snoise(p);
        float n2 = snoise(p + vec2(s, 0.0));
        float n3 = snoise(p + vec2(0.0, s));
        float n4 = snoise(p + vec2(s, s));

        return mix(mix(n1, n2, t.x), mix(n3, n4, t.x), t.y);
    }

    return snoise(p);
}

void main() {
    vec2 uv = v_uv + u_offset;
    float n = seamlessSimplex(uv, u_scale);

    n = n * 0.5 + 0.5;
    n = (n - 0.5) * u_contrast + 0.5 + u_brightness;
    n = clamp(n, 0.0, 1.0);

    fragColor = vec4(vec3(n), 1.0);
}`;

// Voronoi Noise Shader (different from Worley - returns cell colors)
const VORONOI_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_scale;
uniform float u_seed;
uniform float u_contrast;
uniform float u_brightness;
uniform vec2 u_offset;
uniform bool u_seamless;
uniform float u_jitter;
uniform bool u_showEdges;
uniform float u_edgeWidth;

${NOISE_COMMON}

void main() {
    vec2 uv = v_uv + u_offset;
    vec2 p = uv * u_scale + u_seed * 0.1;
    vec2 n = floor(p);
    vec2 f = fract(p);

    float minDist = 1.0;
    float secondDist = 1.0;
    vec2 closestCell = vec2(0.0);

    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g) * u_jitter;
            vec2 delta = g + o - f;
            float d = dot(delta, delta);

            if (d < minDist) {
                secondDist = minDist;
                minDist = d;
                closestCell = n + g;
            } else if (d < secondDist) {
                secondDist = d;
            }
        }
    }

    // Get cell color from hash
    vec3 cellColor = hash3(closestCell);
    float value = (cellColor.r + cellColor.g + cellColor.b) / 3.0;

    // Edge detection
    if (u_showEdges) {
        float edge = smoothstep(u_edgeWidth - 0.01, u_edgeWidth + 0.01, sqrt(secondDist) - sqrt(minDist));
        value = mix(0.0, value, edge);
    }

    // Apply contrast and brightness
    value = (value - 0.5) * u_contrast + 0.5 + u_brightness;
    value = clamp(value, 0.0, 1.0);

    fragColor = vec4(vec3(value), 1.0);
}`;

// Layer blending shader
const BLEND_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_baseTexture;
uniform sampler2D u_blendTexture;
uniform int u_blendMode;
uniform float u_opacity;

// Blend modes
vec3 blendNormal(vec3 base, vec3 blend) {
    return blend;
}

vec3 blendMultiply(vec3 base, vec3 blend) {
    return base * blend;
}

vec3 blendScreen(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendOverlay(vec3 base, vec3 blend) {
    return mix(
        2.0 * base * blend,
        1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
        step(0.5, base)
    );
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
    return mix(
        2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
        sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
        step(0.5, blend)
    );
}

vec3 blendHardLight(vec3 base, vec3 blend) {
    return blendOverlay(blend, base);
}

vec3 blendDifference(vec3 base, vec3 blend) {
    return abs(base - blend);
}

vec3 blendExclusion(vec3 base, vec3 blend) {
    return base + blend - 2.0 * base * blend;
}

vec3 blendAdd(vec3 base, vec3 blend) {
    return min(base + blend, vec3(1.0));
}

vec3 blendSubtract(vec3 base, vec3 blend) {
    return max(base - blend, vec3(0.0));
}

vec3 blendDarken(vec3 base, vec3 blend) {
    return min(base, blend);
}

vec3 blendLighten(vec3 base, vec3 blend) {
    return max(base, blend);
}

void main() {
    vec3 base = texture(u_baseTexture, v_uv).rgb;
    vec3 blend = texture(u_blendTexture, v_uv).rgb;

    vec3 result;

    if (u_blendMode == 0) result = blendNormal(base, blend);
    else if (u_blendMode == 1) result = blendMultiply(base, blend);
    else if (u_blendMode == 2) result = blendScreen(base, blend);
    else if (u_blendMode == 3) result = blendOverlay(base, blend);
    else if (u_blendMode == 4) result = blendSoftLight(base, blend);
    else if (u_blendMode == 5) result = blendHardLight(base, blend);
    else if (u_blendMode == 6) result = blendDifference(base, blend);
    else if (u_blendMode == 7) result = blendExclusion(base, blend);
    else if (u_blendMode == 8) result = blendAdd(base, blend);
    else if (u_blendMode == 9) result = blendSubtract(base, blend);
    else if (u_blendMode == 10) result = blendDarken(base, blend);
    else if (u_blendMode == 11) result = blendLighten(base, blend);
    else result = blend;

    fragColor = vec4(mix(base, result, u_opacity), 1.0);
}`;

// Export shaders
window.NoiseShaders = {
    VERTEX_SHADER,
    PERLIN_FRAGMENT_SHADER,
    WORLEY_FRAGMENT_SHADER,
    FBM_FRAGMENT_SHADER,
    WARP_FRAGMENT_SHADER,
    SIMPLEX_FRAGMENT_SHADER,
    VORONOI_FRAGMENT_SHADER,
    BLEND_FRAGMENT_SHADER
};
