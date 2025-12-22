// Skill Sphere WebGL Shaders - Charles Grassi CV
// PBR-style lit sphere rendering with multiple point lights

export const sphereVertexShader = `
    attribute vec2 aPos;
    attribute vec2 aCenter;
    attribute float aRadius;
    attribute vec3 aColor;
    attribute float aAlpha;
    attribute float aAppear;
    attribute float aGlow;
    attribute float aIndex;
    attribute float aIsLight;
    varying vec2 vUV;
    varying vec2 vCenter;
    varying float vRadius;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vAppear;
    varying float vGlow;
    varying float vIndex;
    varying float vIsLight;
    uniform vec2 uRes;
    void main() {
        vUV = aPos;
        vCenter = aCenter;
        vRadius = aRadius;
        vColor = aColor;
        vAlpha = aAlpha;
        vAppear = aAppear;
        vGlow = aGlow;
        vIndex = aIndex;
        vIsLight = aIsLight;
        vec2 p = aCenter + aPos * aRadius * 3.0;
        vec2 c = (p / uRes) * 2.0 - 1.0;
        gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
    }
`;

export const sphereFragmentShader = `
    precision highp float;
    varying vec2 vUV;
    varying vec2 vCenter;
    varying float vRadius;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vAppear;
    varying float vGlow;
    varying float vIndex;
    varying float vIsLight;
    uniform vec2 uRes;
    uniform vec2 uMouse;
    uniform float uTime;
    uniform vec2 uLight0;
    uniform vec2 uLight1;
    uniform vec2 uLight2;
    uniform vec3 uLightColor0;
    uniform vec3 uLightColor1;
    uniform vec3 uLightColor2;

    #define PI 3.14159265

    void main() {
        vec2 uv = vUV;
        float d = length(uv);

        // Index-based animation offset
        float animOffset = vIndex * 0.5;
        float t = uTime + animOffset;

        // Appear animation
        float ap = clamp(vAppear, 0.0, 1.0);
        float scaledD = d / max(ap, 0.001);

        // Soft outer fade to avoid hard edge artifacts
        float outerFade = 1.0 - smoothstep(1.2, 1.45, scaledD);
        if (outerFade < 0.001) discard;

        // --- PLANET PARAMETERS ---
        float planetRadius = 0.40;
        float atmosphereThickness = 0.65;
        float atmosphereOuter = planetRadius + atmosphereThickness;

        // --- CHECK IF THIS IS A LIGHT SOURCE ---
        if (vIsLight > 0.5) {
            // Render as glowing emissive orb
            float coreMask = 1.0 - smoothstep(0.0, 0.5, d);
            float glowMask = 1.0 - smoothstep(0.0, 1.0, d);
            float outerHalo = 0.03 / (d * d + 0.03);

            // Pulsing animation
            float pulse = sin(t * 2.0) * 0.5 + 0.5;
            float breathe = 0.85 + pulse * 0.15;

            // Emissive color (brighter than base)
            vec3 emissive = vColor * 1.5;
            vec3 col = vec3(0.0);

            // Bright core
            col += emissive * coreMask * 2.0 * breathe;

            // Inner glow
            col += emissive * glowMask * 0.8;

            // Outer halo
            col += emissive * outerHalo * 0.6;

            // Hover boost
            col += vColor * vGlow * 0.5;

            // Tone mapping
            col = col / (col + vec3(0.5));

            float alpha = coreMask * 0.95 + glowMask * 0.5 + outerHalo * 0.4;
            alpha = clamp(alpha, 0.0, 1.0) * outerFade;
            alpha *= smoothstep(0.0, 0.5, ap) * vAlpha;

            gl_FragColor = vec4(col, alpha);
            return;
        }

        // --- PLANET COLOR VARIATION based on index ---
        float varSeed = vIndex * 1.618;
        vec3 planetColor = vColor;
        // Hue shift
        float hueShift = sin(varSeed) * 0.1;
        planetColor.r += hueShift;
        planetColor.g += hueShift;
        planetColor.b -= hueShift;
        // Saturation variation
        float satVar = cos(varSeed * 2.3) * 0.5;
        vec3 gray = vec3(dot(planetColor, vec3(0.299, 0.587, 0.114)));
        planetColor = mix(planetColor, gray, .8);
        // Brightness variation
        planetColor *= 0.9 + sin(varSeed * 3.7) * 0.15;

        // --- PLANET SURFACE ---
        float planetMask = 1.0 - smoothstep(planetRadius - 0.0002, planetRadius, d);

        // Sphere normal
        float zSq = planetRadius * planetRadius - d * d;
        float z = zSq > 0.0 ? sqrt(zSq) : 0.0;
        vec3 N = d < planetRadius ? normalize(vec3(uv, z)) : vec3(0.0, 0.0, 1.0);
        vec3 V = vec3(0.0, 0.0, 1.0);

        // --- ACCUMULATE LIGHTING FROM ALL SOURCES ---
        vec3 totalDiffuse = vec3(0.0);
        vec3 totalSpecular = vec3(0.0);
        float totalAttenuation = 0.0;

        // Mouse light (white)
        vec2 mouseOffset = (uMouse - vCenter);
        vec3 mouseLightPos = vec3(mouseOffset / uRes.x * 4.0, 0.3);
        vec3 mouseL = normalize(mouseLightPos);
        float mouseDist = length(mouseLightPos);
        float mouseAtten = 0.08 / (mouseDist * mouseDist + 0.01);
        mouseAtten = min(mouseAtten, 2.0);

        float mouseNdL = max(dot(N, mouseL), 0.0);
        vec3 mouseH = normalize(mouseL + V);
        float mouseNdH = max(dot(N, mouseH), 0.0);
        totalDiffuse += vec3(1.0) * mouseNdL * mouseAtten;
        totalSpecular += vec3(1.0) * pow(mouseNdH, 32.0) * mouseAtten;
        totalAttenuation += mouseAtten;

        // Point light 0 (Unity - orange)
        vec2 light0Offset = (uLight0 - vCenter);
        vec3 light0Pos = vec3(light0Offset / uRes.x * 3.0, 0.1);
        vec3 L0 = normalize(light0Pos);
        float dist0 = length(light0Pos);
        float atten0 = 0.06 / (dist0 * dist0 + 0.02);
        atten0 = min(atten0, 1.5);

        float NdL0 = max(dot(N, L0), 0.0);
        vec3 H0 = normalize(L0 + V);
        float NdH0 = max(dot(N, H0), 0.0);
        totalDiffuse += uLightColor0 * NdL0 * atten0;
        totalSpecular += uLightColor0 * pow(NdH0, 32.0) * atten0;
        totalAttenuation += atten0;

        // Point light 1 (C# - purple)
        vec2 light1Offset = (uLight1 - vCenter);
        vec3 light1Pos = vec3(light1Offset / uRes.x * 3.0, 0.1);
        vec3 L1 = normalize(light1Pos);
        float dist1 = length(light1Pos);
        float atten1 = 0.06 / (dist1 * dist1 + 0.02);
        atten1 = min(atten1, 1.5);

        float NdL1 = max(dot(N, L1), 0.0);
        vec3 H1 = normalize(L1 + V);
        float NdH1 = max(dot(N, H1), 0.0);
        totalDiffuse += uLightColor1 * NdL1 * atten1;
        totalSpecular += uLightColor1 * pow(NdH1, 32.0) * atten1;
        totalAttenuation += atten1;

        // Point light 2 (HLSL - cyan)
        vec2 light2Offset = (uLight2 - vCenter);
        vec3 light2Pos = vec3(light2Offset / uRes.x * 3.0, 0.1);
        vec3 L2 = normalize(light2Pos);
        float dist2 = length(light2Pos);
        float atten2 = 0.06 / (dist2 * dist2 + 0.02);
        atten2 = min(atten2, 1.5);

        float NdL2 = max(dot(N, L2), 0.0);
        vec3 H2 = normalize(L2 + V);
        float NdH2 = max(dot(N, H2), 0.0);
        totalDiffuse += uLightColor2 * NdL2 * atten2;
        totalSpecular += uLightColor2 * pow(NdH2, 32.0) * atten2;
        totalAttenuation += atten2;

        // --- ATMOSPHERE ---
        float atmosDist = d - planetRadius;
        float atmosMask = smoothstep(atmosphereOuter, planetRadius, d);
        float atmosDensity = atmosMask * (1.0 - planetMask);
        vec3 atmosColor = planetColor * 1.2 + vec3(0.05, 0.08, 0.15);

        float NdV = max(dot(N, V), 0.0);
        float limbAngle = 1.0 - abs(dot(N, V));
        float limbGlow = pow(limbAngle, 2.0) * atmosMask;

        float ringDist = abs(d - planetRadius);
        float atmosRing = exp(-ringDist * 8.0) * 0.6;

        float outerGlow = 0.0;
        if (d > planetRadius) {
            float glowDist = d - planetRadius;
            outerGlow = exp(-glowDist * 4.0) * 0.5;
            outerGlow += 0.015 / (glowDist + 0.02);
        }

        // --- COMPOSE FINAL COLOR ---
        vec3 col = vec3(0.0);
        vec3 surfaceColor = planetColor * 0.85;

        // Lit surface
        col += surfaceColor * totalDiffuse * 1.5 * planetMask;
        col += planetColor * totalSpecular * 0.3 * planetMask;

        // Ambient for dark side
        col += surfaceColor * 0.02 * planetMask;

        // Atmosphere effects
        col += atmosColor * limbGlow * totalAttenuation * 0.3 * planetMask;
        col += planetColor * atmosRing * totalAttenuation * 0.2;
        col += planetColor * outerGlow * totalAttenuation * 0.4;

        // Fresnel
        float fresnel = pow(1.0 - NdV, 4.0) * planetMask;
        col += planetColor * fresnel * totalAttenuation * 0.2;

        // Hover
        col += planetColor * vGlow * (0.15 + fresnel * 0.3);

        // Tone mapping
        col = col / (col + vec3(0.7));
        col = pow(col, vec3(0.95));

        // Alpha
        float alpha = 0.0;
        alpha += planetMask * 0.98;
        alpha += atmosDensity * 0.4;
        alpha += atmosRing * 0.2;
        alpha += outerGlow * 0.3;
        alpha = clamp(alpha, 0.0, 1.0);
        alpha *= outerFade;
        alpha *= smoothstep(0.0, 0.5, ap);
        alpha *= vAlpha;

        gl_FragColor = vec4(col, alpha);
    }
`;
