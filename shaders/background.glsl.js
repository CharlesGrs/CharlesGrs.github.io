// Background Aurora Shaders - Charles Grassi CV
// Three.js fullscreen shader for subtle animated background

export const backgroundVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

export const backgroundFragmentShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;

    varying vec2 vUv;

    // Simplex noise
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

        // Slow flowing noise
        float noise1 = snoise(uv * 3.5 + uTime * 0.05);
        float noise2 = snoise(uv * 2.5 - uTime * 0.03 + 100.0);
        float noise3 = snoise(uv * 5.8 + uTime * 0.02 + vec2(noise1 * 0.2));

        float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

        // Colors
        vec3 gold = vec3(0.91, 0.73, 0.14);
        vec3 teal = vec3(0.18, 0.83, 0.75);
        vec3 dark = vec3(1.0, 1.0, 1.0);

        // Subtle color bands
        float band1 = smoothstep(-0.3, 0.3, combinedNoise);
        float band2 = smoothstep(0.0, 0.6, combinedNoise);

        vec3 color = mix(dark, gold * 0.15, band1 * 0.4);
        color = mix(color, teal * 0.12, band2 * 0.3);

        // Very subtle mouse glow
        float mouseDist = length(uv - uMouse);
        float mouseGlow = exp(-mouseDist * 3.0) * 0.08;
        color += teal * mouseGlow;

        // Vignette
        float vignette = 1.0 - length(uv - 0.5) * 0.5;
        color *= vignette;

        // Keep it very subtle
        float alpha = 1;

        gl_FragColor = vec4(color, alpha);
    }
`;

// Particle shaders for floating dots
export const particleVertexShader = `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute float aScale;
    attribute float aSpeed;
    varying float vAlpha;

    void main() {
        vec3 pos = position;

        // Gentle drift
        pos.x += sin(uTime * aSpeed * 0.5 + position.y * 2.0) * 0.02;
        pos.y += mod(uTime * aSpeed * 0.1, 2.0) - 1.0;
        pos.y = mod(pos.y + 1.0, 2.0) - 1.0;

        gl_Position = vec4(pos, 1.0);
        gl_PointSize = aScale * uPixelRatio * 3.0;

        // Fade at edges
        vAlpha = smoothstep(1.0, 0.7, abs(pos.y)) * 0.4;
    }
`;

export const particleFragmentShader = `
    varying float vAlpha;

    void main() {
        float dist = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
        vec3 color = mix(vec3(0.91, 0.73, 0.14), vec3(0.18, 0.83, 0.75), 0.5);
        gl_FragColor = vec4(color, alpha);
    }
`;
