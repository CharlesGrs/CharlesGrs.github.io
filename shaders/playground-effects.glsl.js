// ============================================
// PLAYGROUND FULLSCREEN EFFECT SHADERS
// Voronoi, Raymarching, and Fractal effects
// ============================================

// Fullscreen quad vertex shader (WebGL 2)
window.FULLSCREEN_VS_WEBGL2 = `#version 300 es
    in vec2 aPosition;
    void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`;

// Fullscreen quad vertex shader (WebGL 1)
window.FULLSCREEN_VS_WEBGL1 = `
    attribute vec2 aPosition;
    void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`;

// Voronoi cells shader - animated cellular pattern
window.SHADER_VORONOI = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uIntensity;
    uniform float uHue;

    vec2 hash2(vec2 p) {
        return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
    }

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec2 p = uv * 8.0 * uScale;
        float t = uTime * uSpeed;

        vec2 n = floor(p);
        vec2 f = fract(p);

        float md = 8.0;
        vec2 mg;

        for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
                vec2 g = vec2(float(i), float(j));
                vec2 o = hash2(n + g);
                o = 0.5 + 0.5 * sin(t + 6.2831 * o);
                vec2 r = g + o - f;
                float d = dot(r, r);
                if (d < md) {
                    md = d;
                    mg = r;
                }
            }
        }

        float cellDist = sqrt(md);

        vec2 m = uMouse;
        float mouseDist = length(uv - m);
        float mouseInfluence = smoothstep(0.3, 0.0, mouseDist);

        float hue = fract(cellDist * uIntensity + t * 0.1 + uHue / 360.0);
        float sat = 0.7 + mouseInfluence * 0.3;
        float val = 0.3 + cellDist * 0.7;

        vec3 col = hsv2rgb(vec3(hue, sat, val));
        col += vec3(0.9, 0.7, 0.1) * mouseInfluence * 0.3;

        gl_FragColor = vec4(col, 1.0);
    }
`;

// Raymarching shader - 3D infinite grid with morphing shapes
window.SHADER_RAYMARCHING = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uIntensity;
    uniform float uHue;

    float sdSphere(vec3 p, float r) { return length(p) - r; }
    float sdBox(vec3 p, vec3 b) { vec3 d = abs(p) - b; return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0)); }

    mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

    float scene(vec3 p) {
        float t = uTime * uSpeed;
        p.xz *= rot(t * 0.3);
        p.xy *= rot(t * 0.2);

        vec3 q = p;
        q = mod(q + 2.0, 4.0) - 2.0;

        float sphere = sdSphere(q, 0.8 * uScale);
        float box = sdBox(q, vec3(0.5 * uScale));

        return mix(sphere, box, sin(t) * 0.5 + 0.5);
    }

    vec3 getNormal(vec3 p) {
        vec2 e = vec2(0.001, 0.0);
        return normalize(vec3(
            scene(p + e.xyy) - scene(p - e.xyy),
            scene(p + e.yxy) - scene(p - e.yxy),
            scene(p + e.yyx) - scene(p - e.yyx)
        ));
    }

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

        vec2 m = (uMouse - 0.5) * 2.0;

        vec3 ro = vec3(0.0, 0.0, -5.0);
        vec3 rd = normalize(vec3(uv + m * 0.3, 1.0));

        float t = 0.0;
        float d;
        vec3 p;

        for (int i = 0; i < 64; i++) {
            p = ro + rd * t;
            d = scene(p);
            if (d < 0.001 || t > 20.0) break;
            t += d;
        }

        vec3 col = vec3(0.02, 0.04, 0.06);

        if (d < 0.001) {
            vec3 n = getNormal(p);
            vec3 light = normalize(vec3(1.0, 1.0, -1.0));
            float diff = max(dot(n, light), 0.0);
            float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 32.0);

            float hue = fract(t * 0.05 + uHue / 360.0);
            vec3 baseCol = hsv2rgb(vec3(hue, 0.7, 0.9));

            col = baseCol * (diff * uIntensity + 0.2) + vec3(1.0) * spec * 0.5;
            col *= exp(-t * 0.08);
        }

        gl_FragColor = vec4(col, 1.0);
    }
`;

// Fractal shader - animated Julia set
window.SHADER_FRACTAL = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uIntensity;
    uniform float uHue;

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
        float t = uTime * uSpeed * 0.5;

        vec2 m = (uMouse - 0.5) * 0.5;
        vec2 c = vec2(-0.8 + m.x, 0.156 + m.y + sin(t * 0.3) * 0.1);

        vec2 z = uv * 2.5 / uScale;

        float iter = 0.0;
        const float maxIter = 100.0;

        for (float i = 0.0; i < maxIter; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (dot(z, z) > 4.0) break;
            iter++;
        }

        float smoothIter = iter - log2(log2(dot(z, z)));
        float normalized = smoothIter / maxIter;

        float hue = fract(normalized * uIntensity + t * 0.1 + uHue / 360.0);
        float sat = 0.8;
        float val = iter < maxIter ? 0.9 : 0.0;

        vec3 col = hsv2rgb(vec3(hue, sat, val));

        float glow = exp(-normalized * 3.0) * 0.5;
        col += vec3(0.9, 0.7, 0.1) * glow;

        gl_FragColor = vec4(col, 1.0);
    }
`;
