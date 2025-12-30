// Sun Fragment Shader - Simple bright star with glow
window.SUN_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;
varying vec3 vColor;
varying float vAlpha;
varying float vAppear;
varying float vIndex;
uniform float uTime;

// Simple sun parameters
uniform float uSunCoreSize;
uniform float uSunGlowSize;
uniform float uSunGlowIntensity;

void main() {
    vec2 uv = vUV;
    float d = length(uv);
    float ap = clamp(vAppear, 0.0, 1.0);

    // Discard outside circular bounds (corners of quad)
    if (d > 1.42) discard;

    // Core fills center of quad
    float coreSize = uSunCoreSize * 0.5;

    // Bright core with smooth falloff
    float core = 1.0 - smoothstep(0.0, coreSize, d);

    // Glow extends to edge of quad
    float glowSize = uSunGlowSize * 0.8;
    float glow = exp(-d * d / (glowSize * glowSize));

    // Outer halo for soft edge
    float halo = 0.15 / (d + 0.15);

    // Subtle pulse
    float pulse = sin(uTime * 0.5 + vIndex) * 0.05 + 1.0;

    // Combine - HDR output for bloom
    float intensity = core * 4.0 + glow * uSunGlowIntensity + halo * 0.3;
    intensity *= pulse;

    vec3 col = vColor * intensity;

    // Alpha
    float alpha = core + glow * 0.6 + halo * 0.2;
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= smoothstep(0.0, 0.3, ap) * vAlpha;

    gl_FragColor = vec4(col * alpha, alpha);
}
`;
