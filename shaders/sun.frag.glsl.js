// Sun Fragment Shader - Separate shader for sun/star rendering with halo effects
// The GLSL code is inside the template literal string below
window.SUN_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;
varying vec2 vCenter;
varying vec2 vOriginalCenter;  // Original screen-space center (unused in sun shader)
varying float vRadius;
varying float vOriginalRadius; // Original radius (unused in sun shader)
varying vec3 vColor;
varying float vAlpha;
varying float vAppear;
varying float vGlow;
varying float vIndex;
varying float vIsLight;
varying float vWorldZ;  // World Z position for 3D sphere distribution
uniform vec2 uRes;
uniform float uTime;

// Sun halo parameters (per-sun controllable)
uniform float uSunCoreSize;         // Size of the solid sun core (0.3-0.7)
uniform float uSunGlowSize;         // Size of the soft glow (0.5-1.5)
uniform float uSunGlowIntensity;    // Intensity of the glow (0.0-2.0)
uniform float uSunCoronaIntensity;  // Overall corona intensity (0.0-3.0)
uniform float uSunRayCount;         // Number of radial rays (4-24)
uniform float uSunRayIntensity;     // Intensity of rays (0.0-1.0)
uniform float uSunRayLength;        // Length of rays (0.5-3.0)
uniform float uSunStreamerCount;    // Number of streamers (0-12)
uniform float uSunStreamerIntensity;// Intensity of streamers (0.0-1.0)
uniform float uSunStreamerLength;   // Length of streamers (1.0-3.0)
uniform float uSunHaloRing1Dist;    // Distance of first halo ring (0.8-2.0)
uniform float uSunHaloRing1Intensity;// Intensity of first ring (0.0-0.5)
uniform float uSunHaloRing2Dist;    // Distance of second halo ring (1.5-3.0)
uniform float uSunHaloRing2Intensity;// Intensity of second ring (0.0-0.3)
uniform float uSunFlickerSpeed;     // Speed of flicker animation (0.0-5.0)
uniform float uSunPulseSpeed;       // Speed of pulse animation (0.0-5.0)
uniform float uSunChromaticShift;   // Amount of chromatic dispersion (0.0-3.0)

#define PI 3.14159265

void main() {
    vec2 uv = vUV;
    // Scale UV to fit halos within quad - UV goes from -1 to 1, scale to -0.5 to 0.5
    // This gives us room for halos up to radius ~0.45 in UV space
    vec2 scaledUV = uv * 0.35;
    float d = length(scaledUV);

    float animOffset = vIndex * 0.5;
    float t = uTime + animOffset;
    float ap = clamp(vAppear, 0.0, 1.0);

    // Fade out at edges of quad
    float edgeFade = 1.0 - smoothstep(0.3, 0.35, d);
    if (edgeFade < 0.001) discard;

    // Scale parameters to fit in UV space
    float coreSize = uSunCoreSize * 0.15;
    float glowSize = uSunGlowSize * 0.15;

    // Core and glow masks
    float coreMask = 1.0 - smoothstep(0.0, coreSize, d);
    float glowMask = 1.0 - smoothstep(0.0, glowSize, d);
    float outerHalo = 0.002 / (d * d + 0.002);

    // Angle for radial effects
    float angle = atan(scaledUV.y, scaledUV.x);

    // ========================================
    // SOFT CORONA GLOW
    // ========================================
    float coronaBase = 1.0 / (d * 8.0 + 0.1);
    coronaBase *= smoothstep(coreSize, coreSize + 0.02, d);

    // Subtle radial variation
    float subtleVar = sin(angle * 3.0 + t * 0.2) * 0.1 +
                      sin(angle * 5.0 - t * 0.15) * 0.05;
    coronaBase *= (1.0 + subtleVar * uSunRayIntensity);

    // ========================================
    // RGB CHROMATIC ABERRATION
    // ========================================
    // Sample the scene at offset positions for R, G, B channels
    // This creates the RGB split/fringing effect

    float chromatic = uSunChromaticShift;

    // RGB channel offsets - red shifts inward, blue shifts outward
    float rgbOffset = chromatic * 0.012;
    float dR = length(scaledUV * (1.0 - rgbOffset));  // Red closer to center
    float dG = d;                                       // Green at center
    float dB = length(scaledUV * (1.0 + rgbOffset));  // Blue further out

    // Apply chromatic aberration to glow
    float glowR = 1.0 - smoothstep(0.0, glowSize * 1.1, dR);
    float glowG = 1.0 - smoothstep(0.0, glowSize, dG);
    float glowB = 1.0 - smoothstep(0.0, glowSize * 0.9, dB);
    vec3 chromaticGlow = vec3(glowR, glowG, glowB);

    // ========================================
    // SPECTRAL HALO RINGS WITH RGB OFFSET
    // ========================================
    // Scale ring distances to fit in UV space (divide by ~3 to map 0.8-2.0 to 0.25-0.65)
    float ring1Dist = uSunHaloRing1Dist * 0.12;
    float ring2Dist = uSunHaloRing2Dist * 0.12;

    // Ring 1 with RGB separation
    float ring1Width = 0.015;
    float ring1R = exp(-pow((dR - ring1Dist * 0.95) / ring1Width, 2.0));
    float ring1G = exp(-pow((dG - ring1Dist) / ring1Width, 2.0));
    float ring1B = exp(-pow((dB - ring1Dist * 1.05) / ring1Width, 2.0));
    vec3 haloRing1 = vec3(ring1R, ring1G, ring1B) * uSunHaloRing1Intensity;

    // Add chromatic spread to ring based on chromatic shift
    float spreadR1 = exp(-pow((d - ring1Dist + chromatic * 0.02) / (ring1Width * 1.5), 2.0));
    float spreadB1 = exp(-pow((d - ring1Dist - chromatic * 0.02) / (ring1Width * 1.5), 2.0));
    haloRing1.r += spreadR1 * uSunHaloRing1Intensity * chromatic * 0.5;
    haloRing1.b += spreadB1 * uSunHaloRing1Intensity * chromatic * 0.5;

    // Ring 2 with stronger RGB separation
    float ring2Width = 0.02;
    float ring2R = exp(-pow((dR - ring2Dist * 0.92) / ring2Width, 2.0));
    float ring2G = exp(-pow((dG - ring2Dist) / ring2Width, 2.0));
    float ring2B = exp(-pow((dB - ring2Dist * 1.08) / ring2Width, 2.0));
    vec3 haloRing2 = vec3(ring2R, ring2G, ring2B) * uSunHaloRing2Intensity;

    // Add chromatic spread to ring 2
    float spreadR2 = exp(-pow((d - ring2Dist + chromatic * 0.03) / (ring2Width * 1.5), 2.0));
    float spreadB2 = exp(-pow((d - ring2Dist - chromatic * 0.03) / (ring2Width * 1.5), 2.0));
    haloRing2.r += spreadR2 * uSunHaloRing2Intensity * chromatic * 0.5;
    haloRing2.b += spreadB2 * uSunHaloRing2Intensity * chromatic * 0.5;

    // Fade rings outside core
    haloRing1 *= smoothstep(coreSize, coreSize + 0.03, d);
    haloRing2 *= smoothstep(coreSize, coreSize + 0.03, d);

    // ========================================
    // OUTER RGB FRINGE
    // ========================================
    // Additional chromatic fringe around the whole sun
    float fringeR = exp(-pow((d - glowSize * 1.2) / 0.03, 2.0)) * chromatic * 0.3;
    float fringeB = exp(-pow((d - glowSize * 1.4) / 0.03, 2.0)) * chromatic * 0.3;
    vec3 rgbFringe = vec3(fringeR, 0.0, fringeB);

    // ========================================
    // SOFT STREAMERS
    // ========================================
    float streamers = 0.0;
    int streamerCount = int(uSunStreamerCount);
    float streamerSpacing = PI * 2.0 / max(uSunStreamerCount, 1.0);

    for (int i = 0; i < 12; i++) {
        if (i >= streamerCount) break;
        float fi = float(i);
        float streamerAngle = fi * streamerSpacing + vIndex * 0.5;
        float angleDiff = abs(mod(angle - streamerAngle + PI, PI * 2.0) - PI);

        float streamerWidth = 0.3 + sin(t * 0.5 + fi) * 0.1;
        float streamer = exp(-angleDiff * angleDiff / (streamerWidth * streamerWidth));
        float streamerLen = uSunStreamerLength * 0.1;
        streamer *= smoothstep(streamerLen, coreSize + 0.02, d);
        streamers += streamer * uSunStreamerIntensity * 0.15;
    }

    // Combine corona effects
    float corona = coronaBase * 0.4 + streamers;
    corona *= 1.0 / (d * 2.0 + 0.5);
    corona *= uSunCoronaIntensity;

    // ========================================
    // SUN SURFACE (molten liquid look)
    // ========================================
    float zSq = coreSize * coreSize - d * d;
    float z = zSq > 0.0 ? sqrt(zSq) : 0.0;
    vec3 sphereNormal = d < coreSize ? normalize(vec3(scaledUV, z)) : vec3(0.0, 0.0, 1.0);

    float flowT = t * 0.4;
    vec2 flowUV = scaledUV * 15.0;

    float n1 = sin(flowUV.x * 2.3 + flowUV.y * 1.7 + flowT) * cos(flowUV.y * 3.1 - flowT * 0.7);
    float n2 = sin(flowUV.x * 1.1 - flowUV.y * 2.9 + flowT * 1.3 + 2.0) * cos(flowUV.x * 2.7 + flowT * 0.5);
    float n3 = sin((flowUV.x + flowUV.y) * 1.9 + flowT * 0.9) * cos((flowUV.x - flowUV.y) * 2.3 - flowT * 0.6);

    float flowNoise = n1 * 0.4 + n2 * 0.35 + n3 * 0.25;
    flowNoise = flowNoise * 0.5 + 0.5;

    float veins = pow(abs(sin(flowNoise * 6.28 + flowT)), 2.0);
    float hotSpots = pow(flowNoise, 3.0);

    float drift = sin(scaledUV.x * 20.0 + flowT * 0.3) * 0.5 + 0.5;
    drift *= smoothstep(-0.1, 0.05, -scaledUV.y);

    float liquid = flowNoise * 0.5 + veins * 0.3 + hotSpots * 0.2;
    liquid = liquid + drift * 0.15;
    liquid = clamp(liquid, 0.0, 1.0);

    // Pulsing
    float pulse = sin(t * uSunPulseSpeed) * 0.5 + 0.5;
    float breathe = 0.85 + pulse * 0.15;

    // Color
    vec3 darkCol = vColor * 0.2;
    vec3 glowCol = vColor * 1.4;
    vec3 hotCol = vColor + vec3(0.4, 0.25, 0.1);
    hotCol = min(hotCol, vec3(1.4));

    vec3 emissive = mix(darkCol, glowCol, liquid);
    emissive = mix(emissive, hotCol, hotSpots * 0.7);
    emissive *= breathe;

    // Fresnel rim
    float NdV = max(dot(sphereNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    float rim = pow(1.0 - NdV, 2.5) * coreMask;
    emissive += vColor * rim * 0.4;

    // ========================================
    // FINAL COMPOSITION
    // ========================================
    vec3 col = vec3(0.0);

    // Sun core
    col += emissive * coreMask * 1.8;

    // Chromatic glow (RGB split)
    col += vColor * chromaticGlow * uSunGlowIntensity * (1.0 - coreMask * 0.8);

    // Standard glow fallback
    col += vColor * outerHalo * 0.5;
    col += vColor * vGlow * 0.4;

    // Corona glow with color
    col += vColor * corona;

    // RGB halo rings
    col += haloRing1 * 2.0;
    col += haloRing2 * 2.0;

    // RGB fringe
    col += rgbFringe;

    // Tone mapping
    col = col / (col + vec3(0.5));

    // Alpha calculation
    float haloAlpha = (haloRing1.r + haloRing1.g + haloRing1.b +
                       haloRing2.r + haloRing2.g + haloRing2.b) * 0.5;
    float fringeAlpha = (rgbFringe.r + rgbFringe.b) * 0.5;
    float coronaAlpha = corona * 0.6 + haloAlpha + fringeAlpha;
    float alpha = coreMask * 0.95 + glowMask * 0.5 + outerHalo * 0.4 + coronaAlpha;
    alpha = clamp(alpha, 0.0, 1.0) * edgeFade;
    alpha *= smoothstep(0.0, 0.5, ap) * vAlpha;

    // Output for additive blending
    gl_FragColor = vec4(col * alpha, alpha);
}
`;
