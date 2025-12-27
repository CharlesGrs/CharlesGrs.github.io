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
    vec2 uv = vUV * 0.4;
    float d = length(uv);
    float ap = clamp(vAppear, 0.0, 1.0);

    // Discard outside quad
    if (d > 0.4) discard;

    // Core size
    float coreSize = uSunCoreSize * 0.1;

    // Bright core
    float core = 1.0 - smoothstep(0.0, coreSize, d);

    // Soft glow falloff
    float glowSize = uSunGlowSize * 0.15;
    float glow = exp(-d * d / (glowSize * glowSize));

    // Outer halo
    float halo = 0.02 / (d + 0.02);

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
