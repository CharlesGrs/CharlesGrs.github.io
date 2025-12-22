// Planet Fragment Shader - Edit this file for IDE syntax highlighting
// The GLSL code is inside the template literal string below
window.PLANET_FRAGMENT_SHADER = `
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
// Controllable rendering parameters
uniform float uNoiseScale;      // Terrain noise scale (default 1.8)
uniform float uTerrainHeight;   // Terrain displacement strength (default 1.0)
uniform float uAtmosIntensity;  // Atmosphere brightness (default 1.0)
uniform float uAtmosThickness;  // Atmosphere thickness/falloff (default 1.0)
uniform float uAtmosPower;      // Atmosphere density power/falloff curve (default 1.0)
uniform float uScatterR;        // Red channel scattering coefficient (default 1.0)
uniform float uScatterG;        // Green channel scattering coefficient (default 2.5)
uniform float uScatterB;        // Blue channel scattering coefficient (default 5.5)
uniform float uScatterScale;    // Optical depth multiplier (default 1.0)
uniform float uSunsetStrength;  // How much shadow affects scattering (default 1.0)
uniform float uLavaIntensity;   // Lava emission intensity (default 1.0)
uniform float uOceanRoughness;  // Ocean roughness 0=mirror, 1=matte (default 0.3)
uniform float uSSSIntensity;    // Subsurface scattering intensity (default 1.0)
uniform float uSeaLevel;        // Sea level offset (default 0.0)

#define PI 3.14159265

// ========================================
// PBR FUNCTIONS (Non-metallic)
// ========================================

// GGX/Trowbridge-Reitz Normal Distribution Function
// Models the distribution of microfacet normals
float distributionGGX(float NdH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdH2 = NdH * NdH;
    float denom = NdH2 * (a2 - 1.0) + 1.0;
    return a2 / (PI * denom * denom);
}

// Schlick-GGX Geometry Function (single direction)
// Models microfacet self-shadowing
float geometrySchlickGGX(float NdV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;  // k for direct lighting
    return NdV / (NdV * (1.0 - k) + k);
}

// Smith's method for geometry - combines view and light directions
float geometrySmith(float NdV, float NdL, float roughness) {
    float ggx1 = geometrySchlickGGX(NdV, roughness);
    float ggx2 = geometrySchlickGGX(NdL, roughness);
    return ggx1 * ggx2;
}

// Fresnel-Schlick approximation
// F0 = 0.04 for dielectrics (non-metals)
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Full Cook-Torrance BRDF for a single light
// Returns vec4: xyz = specular, w = fresnel factor for energy conservation
vec4 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, float roughness, vec3 F0) {
    vec3 H = normalize(V + L);
    float NdV = max(dot(N, V), 0.001);
    float NdL = max(dot(N, L), 0.0);
    float NdH = max(dot(N, H), 0.0);
    float HdV = max(dot(H, V), 0.0);

    // D, G, F terms
    float D = distributionGGX(NdH, roughness);
    float G = geometrySmith(NdV, NdL, roughness);
    vec3 F = fresnelSchlick(HdV, F0);

    // Cook-Torrance specular BRDF
    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdV * NdL + 0.0001;
    vec3 specular = numerator / denominator;

    // Return specular and average fresnel for energy conservation
    float avgF = (F.r + F.g + F.b) / 3.0;
    return vec4(specular * NdL, avgF);
}

// Simplex noise for rocky texture
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
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
    vec2 uv = vUV;
    float d = length(uv);
    float animOffset = vIndex * 0.5;
    float t = uTime + animOffset;
    float ap = clamp(vAppear, 0.0, 1.0);
    float scaledD = d / max(ap, 0.001);
    float outerFade = 1.0 - smoothstep(1.2, 1.45, scaledD);
    if (outerFade < 0.001) discard;

    float planetRadius = 0.40;
    float atmosphereThickness = 0.65;
    float atmosphereOuter = planetRadius + atmosphereThickness;

    if (vIsLight > 0.5) {
        // Original sizing with flowing liquid effect
        float coreMask = 1.0 - smoothstep(0.0, 0.5, d);
        float glowMask = 1.0 - smoothstep(0.0, 1.0, d);
        float outerHalo = 0.03 / (d * d + 0.03);

        // Spherical coordinates for flow
        float zSq = 0.25 - d * d; // 0.5^2 = 0.25
        float z = zSq > 0.0 ? sqrt(zSq) : 0.0;
        vec3 sphereNormal = d < 0.5 ? normalize(vec3(uv, z)) : vec3(0.0, 0.0, 1.0);

        // Simplex-like noise for organic flow
        float flowT = t * 0.4;
        vec2 flowUV = uv * 4.0;

        // Organic noise layers (not regular sine patterns)
        float n1 = sin(flowUV.x * 2.3 + flowUV.y * 1.7 + flowT) * cos(flowUV.y * 3.1 - flowT * 0.7);
        float n2 = sin(flowUV.x * 1.1 - flowUV.y * 2.9 + flowT * 1.3 + 2.0) * cos(flowUV.x * 2.7 + flowT * 0.5);
        float n3 = sin((flowUV.x + flowUV.y) * 1.9 + flowT * 0.9) * cos((flowUV.x - flowUV.y) * 2.3 - flowT * 0.6);

        // Combine with varied weights for organic look
        float flowNoise = n1 * 0.4 + n2 * 0.35 + n3 * 0.25;
        flowNoise = flowNoise * 0.5 + 0.5; // Normalize to 0-1

        // Create veins/channels of flowing liquid
        float veins = pow(abs(sin(flowNoise * 6.28 + flowT)), 2.0);

        // Hot spots where flow concentrates
        float hotSpots = pow(flowNoise, 3.0);

        // Slow vertical drift for gravity effect
        float drift = sin(uv.x * 5.0 + flowT * 0.3) * 0.5 + 0.5;
        drift *= smoothstep(-0.5, 0.3, -uv.y); // Stronger at bottom

        // Combined liquid pattern
        float liquid = flowNoise * 0.5 + veins * 0.3 + hotSpots * 0.2;
        liquid = liquid + drift * 0.15;
        liquid = clamp(liquid, 0.0, 1.0);

        // Pulsing
        float pulse = sin(t * 2.0) * 0.5 + 0.5;
        float breathe = 0.85 + pulse * 0.15;

        // Color: dark cracks -> glowing -> white hot
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

        // Final composition
        vec3 col = vec3(0.0);
        col += emissive * coreMask * 1.8;
        col += vColor * glowMask * 0.6 * (1.0 - coreMask * 0.8);
        col += vColor * outerHalo * 0.5;
        col += vColor * vGlow * 0.4;

        // Tone mapping
        col = col / (col + vec3(0.5));

        // Full alpha including glow for proper blending
        float alpha = coreMask * 0.95 + glowMask * 0.5 + outerHalo * 0.4;
        alpha = clamp(alpha, 0.0, 1.0) * outerFade;
        alpha *= smoothstep(0.0, 0.5, ap) * vAlpha;

        // Standard alpha blending output (not premultiplied)
        gl_FragColor = vec4(col, alpha);
        return;
    }

    float varSeed = vIndex * 1.618;
    vec3 planetColor = vColor;
    float hueShift = sin(varSeed) * 0.1;
    planetColor.r += hueShift;
    planetColor.g += hueShift;
    planetColor.b -= hueShift;
    float satVar = cos(varSeed * 2.3) * 0.5;
    vec3 gray = vec3(dot(planetColor, vec3(0.299, 0.587, 0.114)));
    planetColor = mix(planetColor, gray, .8);
    planetColor *= 0.9 + sin(varSeed * 3.7) * 0.15;

    // ========================================
    // TERRAIN HEIGHTMAP - computed first to deform planet shape
    // ========================================
    vec2 heightCoord = uv * uNoiseScale + vIndex * 10.0;
    float eps = 0.06;

    // Biome type based on planet index (cycles through 3 types)
    // 0 = Oceanic (lots of water, green land)
    // 1 = Desert (little water, sand everywhere)
    // 2 = Mountain/Ice (moderate water, ice on peaks)
    float biomeSelector = mod(vIndex, 3.0);
    float isOceanic = step(0.5, 1.0 - abs(biomeSelector - 0.0));
    float isDesert = step(0.5, 1.0 - abs(biomeSelector - 1.0));
    float isMountain = step(0.5, 1.0 - abs(biomeSelector - 2.0));

    // Multi-octave height for terrain - large continental shapes + detail (4 octaves)
    float heightC = snoise(heightCoord) * 0.5
                  + snoise(heightCoord * 2.0 + 1.5) * 0.25
                  + snoise(heightCoord * 4.0 + 3.0) * 0.15
                  + snoise(heightCoord * 8.0 + 5.5) * 0.1;
    float heightX = snoise(heightCoord + vec2(eps, 0.0)) * 0.5
                  + snoise((heightCoord + vec2(eps, 0.0)) * 2.0 + 1.5) * 0.25
                  + snoise((heightCoord + vec2(eps, 0.0)) * 4.0 + 3.0) * 0.15
                  + snoise((heightCoord + vec2(eps, 0.0)) * 8.0 + 5.5) * 0.1;
    float heightY = snoise(heightCoord + vec2(0.0, eps)) * 0.5
                  + snoise((heightCoord + vec2(0.0, eps)) * 2.0 + 1.5) * 0.25
                  + snoise((heightCoord + vec2(0.0, eps)) * 4.0 + 3.0) * 0.15
                  + snoise((heightCoord + vec2(0.0, eps)) * 8.0 + 5.5) * 0.1;

    // Sea level varies per biome
    // Oceanic: low sea level = more water
    // Desert: very low sea level = almost no water (just oases)
    // Mountain: medium sea level = moderate water
    float seaLevel = -0.05 * isOceanic + -0.45 * isDesert + 0.0 * isMountain + uSeaLevel;
    float oceanMask = smoothstep(seaLevel + 0.08, seaLevel - 0.02, heightC);

    // Deform planet radius based on terrain height
    // Higher terrain = larger radius (mountains bulge out)
    // Clamp land height to positive values for displacement
    float landHeight = max(heightC - seaLevel, 0.0);

    // Mountain biome: apply power function for sharper peaks but clamped to stay within bounds
    float mountainHeight = pow(min(landHeight, 0.6) * 1.2, 1.8) * 0.08; // Clamped exponential for sharp but contained peaks
    float normalHeight = landHeight * 0.04;
    float terrainDisplacement = (normalHeight * (1.0 - isMountain) + mountainHeight * isMountain) * uTerrainHeight;
    // Clamp maximum displacement to 15% of planet radius
    terrainDisplacement = min(terrainDisplacement, planetRadius * 0.15 * uTerrainHeight);
    float deformedRadius = planetRadius + terrainDisplacement;

    // Planet mask with height-deformed edge
    float planetMask = 1.0 - smoothstep(deformedRadius - 0.003, deformedRadius + 0.001, d);
    float zSq = planetRadius * planetRadius - d * d;
    float z = zSq > 0.0 ? sqrt(zSq) : 0.0;
    vec3 baseN = d < deformedRadius ? normalize(vec3(uv, z)) : vec3(0.0, 0.0, 1.0);
    vec3 V = vec3(0.0, 0.0, 1.0);

    // Compute terrain normals from heightmap gradient
    // Flip sign so higher terrain creates outward-facing normals
    // Mountain biome gets stronger normals for dramatic peaks
    float normalStrength = 0.12 * (1.0 - isMountain) + 0.35 * isMountain;
    float terrainNx = -(heightX - heightC) / eps * normalStrength;
    float terrainNy = -(heightY - heightC) / eps * normalStrength;

    // Ocean wave normal deformation - subtle animated ripples
    vec2 waveCoord = uv * 12.0 + vIndex * 5.0;
    float waveSpeed = t * 0.2;
    float wave1 = snoise(waveCoord + vec2(waveSpeed, waveSpeed * 0.7));
    float wave2 = snoise(waveCoord * 1.3 - vec2(waveSpeed * 0.6, waveSpeed * 0.9) + 2.5);
    float waveEps = 0.03;
    float waveC = (wave1 + wave2 * 0.6);
    float waveX = snoise(waveCoord + vec2(waveEps, 0.0) + vec2(waveSpeed, waveSpeed * 0.7))
                + snoise((waveCoord + vec2(waveEps, 0.0)) * 1.3 - vec2(waveSpeed * 0.6, waveSpeed * 0.9) + 2.5) * 0.6;
    float waveY = snoise(waveCoord + vec2(0.0, waveEps) + vec2(waveSpeed, waveSpeed * 0.7))
                + snoise((waveCoord + vec2(0.0, waveEps)) * 1.3 - vec2(waveSpeed * 0.6, waveSpeed * 0.9) + 2.5) * 0.6;
    float waveNx = (waveX - waveC) / waveEps * 0.012;
    float waveNy = (waveY - waveC) / waveEps * 0.012;

    // Use pure spherical normal for all lighting - terrain deformation is visual only
    // This keeps the planet looking like a perfect sphere regardless of height displacement
    vec3 N = baseN;

    // ========================================
    // PBR LIGHTING SETUP
    // ========================================
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);
    vec3 oceanSpecular = vec3(0.0);  // Separate specular for ocean with different roughness
    float totalAttenuation = 0.0;
    float totalFresnel = 0.0;       // Average fresnel for energy conservation
    float oceanFresnel = 0.0;

    // PBR material properties for non-metallic surfaces
    // F0 = 0.04 for dielectrics, slightly higher for water
    vec3 landF0 = vec3(0.04);
    vec3 oceanF0 = vec3(0.02, 0.02, 0.025);  // Water has slight blue tint at glancing angles
    float landRoughness = 0.65;  // Land is fairly rough
    float oceanRoughness = max(0.02, uOceanRoughness);  // Ocean roughness from UI, minimum for stability

    // ---- MOUSE LIGHT ----
    vec2 mouseOffset = (uMouse - vCenter);
    vec3 mouseLightPos = vec3(mouseOffset / uRes.x * 4.0, 0.3);
    vec3 mouseL = normalize(mouseLightPos);
    float mouseDist = length(mouseLightPos);
    float mouseAtten = 0.08 / (mouseDist * mouseDist + 0.01);
    mouseAtten = min(mouseAtten, 2.0);
    float mouseNdL = max(dot(N, mouseL), 0.0);

    // PBR specular for land
    vec4 mousePBR = cookTorranceBRDF(N, V, mouseL, landRoughness, landF0);
    totalSpecular += vec3(1.0) * mousePBR.xyz * mouseAtten;
    totalFresnel += mousePBR.w * mouseAtten;
    // PBR specular for ocean
    vec4 mouseOceanPBR = cookTorranceBRDF(N, V, mouseL, oceanRoughness, oceanF0);
    oceanSpecular += vec3(1.0) * mouseOceanPBR.xyz * mouseAtten;
    oceanFresnel += mouseOceanPBR.w * mouseAtten;
    // Diffuse (energy conserving: reduced by fresnel)
    float mouseDiffuseWeight = (1.0 - mousePBR.w) / PI;
    totalDiffuse += vec3(1.0) * mouseNdL * mouseAtten * mouseDiffuseWeight;
    totalAttenuation += mouseAtten;

    // ---- LIGHT 0 ----
    vec2 light0Offset = (uLight0 - vCenter);
    vec3 light0Pos = vec3(light0Offset / uRes.x * 3.0, 0.1);
    vec3 L0 = normalize(light0Pos);
    float dist0 = length(light0Pos);
    float atten0 = 0.06 / (dist0 * dist0 + 0.02);
    atten0 = min(atten0, 1.5);
    float NdL0 = max(dot(N, L0), 0.0);

    vec4 pbr0 = cookTorranceBRDF(N, V, L0, landRoughness, landF0);
    totalSpecular += uLightColor0 * pbr0.xyz * atten0;
    totalFresnel += pbr0.w * atten0;
    vec4 oceanPBR0 = cookTorranceBRDF(N, V, L0, oceanRoughness, oceanF0);
    oceanSpecular += uLightColor0 * oceanPBR0.xyz * atten0;
    oceanFresnel += oceanPBR0.w * atten0;
    float diffuseWeight0 = (1.0 - pbr0.w) / PI;
    totalDiffuse += uLightColor0 * NdL0 * atten0 * diffuseWeight0;
    totalAttenuation += atten0;

    // ---- LIGHT 1 ----
    vec2 light1Offset = (uLight1 - vCenter);
    vec3 light1Pos = vec3(light1Offset / uRes.x * 3.0, 0.1);
    vec3 L1 = normalize(light1Pos);
    float dist1 = length(light1Pos);
    float atten1 = 0.06 / (dist1 * dist1 + 0.02);
    atten1 = min(atten1, 1.5);
    float NdL1 = max(dot(N, L1), 0.0);

    vec4 pbr1 = cookTorranceBRDF(N, V, L1, landRoughness, landF0);
    totalSpecular += uLightColor1 * pbr1.xyz * atten1;
    totalFresnel += pbr1.w * atten1;
    vec4 oceanPBR1 = cookTorranceBRDF(N, V, L1, oceanRoughness, oceanF0);
    oceanSpecular += uLightColor1 * oceanPBR1.xyz * atten1;
    oceanFresnel += oceanPBR1.w * atten1;
    float diffuseWeight1 = (1.0 - pbr1.w) / PI;
    totalDiffuse += uLightColor1 * NdL1 * atten1 * diffuseWeight1;
    totalAttenuation += atten1;

    // ---- LIGHT 2 ----
    vec2 light2Offset = (uLight2 - vCenter);
    vec3 light2Pos = vec3(light2Offset / uRes.x * 3.0, 0.1);
    vec3 L2 = normalize(light2Pos);
    float dist2 = length(light2Pos);
    float atten2 = 0.06 / (dist2 * dist2 + 0.02);
    atten2 = min(atten2, 1.5);
    float NdL2 = max(dot(N, L2), 0.0);

    vec4 pbr2 = cookTorranceBRDF(N, V, L2, landRoughness, landF0);
    totalSpecular += uLightColor2 * pbr2.xyz * atten2;
    totalFresnel += pbr2.w * atten2;
    vec4 oceanPBR2 = cookTorranceBRDF(N, V, L2, oceanRoughness, oceanF0);
    oceanSpecular += uLightColor2 * oceanPBR2.xyz * atten2;
    oceanFresnel += oceanPBR2.w * atten2;
    float diffuseWeight2 = (1.0 - pbr2.w) / PI;
    totalDiffuse += uLightColor2 * NdL2 * atten2 * diffuseWeight2;
    totalAttenuation += atten2;

    float NdV = max(dot(N, V), 0.001);

    // ========================================
    // PHYSICALLY-BASED ATMOSPHERIC SCATTERING
    // ========================================
    // Treating the 2D quad as a 3D sphere viewed from front
    // Atmosphere shell extends from planetRadius to atmosRadius

    float atmosRadius = planetRadius + 0.4 * uAtmosThickness;
    float atmosThickness = atmosRadius - planetRadius;
     

    // Reconstruct 3D sphere normal from 2D UV (sphere is centered, viewed from front)
    // For a sphere: z = sqrt(r^2 - x^2 - y^2)
    vec3 sphereNormal = vec3(0.0, 0.0, 1.0);
    float sphereZ = 0.0;
    if (d < planetRadius) {
        float zSq = planetRadius * planetRadius - d * d;
        sphereZ = sqrt(max(0.0, zSq));
        sphereNormal = normalize(vec3(uv, sphereZ));
    }

    // View direction (looking straight at screen)
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    // Calculate primary light direction in 3D (from planet center toward light)
    // Reuse existing light offsets from surface lighting
    vec3 lightDir0 = normalize(vec3(light0Offset * 0.003, 0.5));
    vec3 lightDir1 = normalize(vec3(light1Offset * 0.003, 0.5));
    vec3 lightDir2 = normalize(vec3(light2Offset * 0.003, 0.5));
    vec3 mouseLightDir = normalize(vec3(mouseOffset * 0.003, 0.4));

    // Combined light direction (weighted average of all lights)
    vec3 combinedLightDir = normalize(
        lightDir0 * atten0 +
        lightDir1 * atten1 +
        lightDir2 * atten2 +
        mouseLightDir * mouseAtten * 0.5
    );

    // ---- LIGHT/SHADOW CALCULATION ----
    // How much this point on the sphere faces the light
    float lightDot = d < planetRadius ? max(0.0, dot(sphereNormal, combinedLightDir)) : 0.5;

    // Shadow: areas facing away from light are in shadow
    // Soft shadow transition at terminator
    float shadowFactor = smoothstep(-0.1, 0.3, lightDot);

    // ---- PER-LIGHT ATMOSPHERE SHADOWS ----
    // Inside planet: use NdL (surface shading)
    // Outside planet: ray-circle intersection test for each light
    float atmosShadow0 = 1.0;
    float atmosShadow1 = 1.0;
    float atmosShadow2 = 1.0;
    float atmosShadowMouse = 1.0;

    if (d < planetRadius) {
        // Inside planet - use surface NdL for atmosphere shadow
        atmosShadow0 = smoothstep(0.0, 0.5, NdL0);
        atmosShadow1 = smoothstep(0.0, 0.5, NdL1);
        atmosShadow2 = smoothstep(0.0, 0.5, NdL2);
        atmosShadowMouse = smoothstep(0.0, 0.5, mouseNdL);

        atmosShadow0 = max(atmosShadow0, 0.1);
        atmosShadow1 = max(atmosShadow1, 0.1);
        atmosShadow2 = max(atmosShadow2, 0.1);
        atmosShadowMouse = max(atmosShadowMouse, 0.1);
    } else if (d < atmosRadius) {
        // Outside planet - ray-circle intersection from this point toward each light
        // Use perpendicular distance to light ray for soft penumbra
        float r = planetRadius;

        // Light 0
        vec2 D0 = normalize(L0.xy);
        float perpDist0 = abs(uv.x * D0.y - uv.y * D0.x);  // Perpendicular distance to ray
        float alongRay0 = dot(uv, D0);  // Position along ray (negative = light is ahead)
        if (alongRay0 < 0.0) {
            // Light is ahead - check if ray passes through planet
            float penumbraWidth = r * 0.4;  // Soft penumbra
            atmosShadow0 = smoothstep(r - penumbraWidth, r + penumbraWidth, perpDist0);
        }

        // Light 1
        vec2 D1 = normalize(L1.xy);
        float perpDist1 = abs(uv.x * D1.y - uv.y * D1.x);
        float alongRay1 = dot(uv, D1);
        if (alongRay1 < 0.0) {
            float penumbraWidth = r * 0.4;
            atmosShadow1 = smoothstep(r - penumbraWidth, r + penumbraWidth, perpDist1);
        }

        // Light 2
        vec2 D2 = normalize(L2.xy);
        float perpDist2 = abs(uv.x * D2.y - uv.y * D2.x);
        float alongRay2 = dot(uv, D2);
        if (alongRay2 < 0.0) {
            float penumbraWidth = r * 0.4;
            atmosShadow2 = smoothstep(r - penumbraWidth, r + penumbraWidth, perpDist2);
        }

        // Mouse light
        vec2 DM = normalize(mouseL.xy);
        float perpDistM = abs(uv.x * DM.y - uv.y * DM.x);
        float alongRayM = dot(uv, DM);
        if (alongRayM < 0.0) {
            float penumbraWidth = r * 0.4;
            atmosShadowMouse = smoothstep(r - penumbraWidth, r + penumbraWidth, perpDistM);
        }

        atmosShadow0 = max(atmosShadow0, 0.05);
        atmosShadow1 = max(atmosShadow1, 0.05);
        atmosShadow2 = max(atmosShadow2, 0.05);
        atmosShadowMouse = max(atmosShadowMouse, 0.05);
    }

    // ========================================
    // RAYLEIGH SCATTERING (based on Dimas Leenman's atmosphere shader)
    // ========================================
    // For a 2D quad faking a sphere:
    // - Center (d=0) = looking straight down through thin atmosphere = low optical depth
    // - Edge (d=planetRadius) = grazing angle through thick atmosphere = high optical depth
    // - Beyond planet = in the atmosphere shell itself
    //
    // Rayleigh scattering: beta coefficients determine color
    // Real Earth values ratio: R:G:B ≈ 1 : 2.4 : 4.1 (from 5.5e-6, 13.0e-6, 22.4e-6)
    // Higher coefficient = scatters MORE = disappears faster from transmitted light

    // Scattering coefficients (UI controlled, default to Rayleigh ratios)
    // Higher values = more absorption of that channel
    vec3 beta = vec3(uScatterR, uScatterG, uScatterB);

    // ========================================
    // PHYSICALLY-BASED ATMOSPHERIC SCATTERING
    // Based on Sebastian Lague's atmosphere shader
    // Adapted for 2D quad rendering
    // ========================================

    float densityFalloff = uAtmosPower;

    // For a 2D quad faking a 3D sphere, we need to compute the optical depth
    // (integral of density along the view ray through the atmosphere)
    //
    // The view ray goes from camera (at +Z infinity) through the pixel toward -Z
    // For a sphere centered at origin with radius R:
    // - At pixel (x,y), the ray enters/exits the sphere at z = ±sqrt(R² - x² - y²)
    // - The path length through the sphere depends on d = length(uv)

    float opticalDepth = 0.0;

    if (d < atmosRadius) {
        // Ray intersects atmosphere sphere
        // Compute entry and exit points of ray through atmosphere

        // For atmosphere shell (outer sphere)
        float atmosZ = sqrt(max(0.0, atmosRadius * atmosRadius - d * d));
        // Ray travels from +atmosZ to -atmosZ (total = 2 * atmosZ) through atmosphere

        if (d < planetRadius) {
            // Ray hits planet surface
            // Entry: atmosZ, Exit: planetZ (blocked by planet on the way back)
            float planetZ = sqrt(max(0.0, planetRadius * planetRadius - d * d));

            // Path through atmosphere = (atmosZ - planetZ) on entry side only
            // (light coming from behind the planet is blocked)
            float pathLength = atmosZ - planetZ;

            // Integrate density along this path
            // Sample at a few heights and average
            float numSamples = 4.0;
            for (float i = 0.0; i < 4.0; i++) {
                float t = (i + 0.5) / numSamples;
                float sampleZ = planetZ + t * (atmosZ - planetZ);
                float sampleR = sqrt(d * d + sampleZ * sampleZ);
                float sampleHeight01 = (sampleR - planetRadius) / atmosThickness;
                float sampleDensity = exp(-sampleHeight01 * densityFalloff) * (1.0 - sampleHeight01);
                opticalDepth += sampleDensity * (pathLength / numSamples);
            }
        } else {
            // Ray passes through atmosphere only (above planet surface)
            // Full path through atmosphere at this distance

            // Entry at +atmosZ, exit at -atmosZ
            float pathLength = 2.0 * atmosZ;

            // Integrate density along this path
            float numSamples = 6.0;
            for (float i = 0.0; i < 6.0; i++) {
                float t = (i + 0.5) / numSamples;
                float sampleZ = atmosZ * (1.0 - 2.0 * t);  // +atmosZ to -atmosZ
                float sampleR = sqrt(d * d + sampleZ * sampleZ);
                float sampleHeight01 = (sampleR - planetRadius) / atmosThickness;
                sampleHeight01 = clamp(sampleHeight01, 0.0, 1.0);
                float sampleDensity = exp(-sampleHeight01 * densityFalloff) * (1.0 - sampleHeight01);
                opticalDepth += sampleDensity * (pathLength / numSamples);
            }
        }
    }

    // Scale by user control
    opticalDepth *= uScatterScale;

    // ========================================
    // ATMOSPHERE DENSITY (visibility/alpha)
    // ========================================
    float atmosDensity = 0.0;

    if (d < atmosRadius) {
        float normalizedDist = d / atmosRadius;
        atmosDensity = exp(-normalizedDist * normalizedDist * densityFalloff * 0.1) * (1.0 - normalizedDist);
        atmosDensity *= uAtmosThickness;
    }

    // Quad edge fade
    float quadEdgeFade = 1.0 - smoothstep(0.85, 1.4, scaledD);
    atmosDensity *= quadEdgeFade;

    // Apply surface shadow factor (terminator)
    atmosDensity *= mix(0.3, 1.0, shadowFactor);

    // ========================================
    // PHYSICALLY-BASED RAYLEIGH SCATTERING
    // ========================================
    // The INCOMING LIGHT is what gets scattered by the atmosphere.
    // Beta coefficients determine how much each wavelength scatters.
    // Higher beta = scatters more = that color appears in the glow

    // Gather incoming light from all sources (with shadows)
    vec3 incomingLight = vec3(0.0);
    incomingLight += uLightColor0 * atten0 * atmosShadow0;
    incomingLight += uLightColor1 * atten1 * atmosShadow1;
    incomingLight += uLightColor2 * atten2 * atmosShadow2;
    incomingLight += vec3(1.0) * mouseAtten * 0.3 * atmosShadowMouse;
    // No ambient light in space - only direct light sources

    // TRANSMITTANCE-BASED SCATTERING for sunset colors
    // Transmittance = what passes through: exp(-beta * depth)
    // Blue has highest beta, so it gets removed first = red/orange remains at high depth
    vec3 transmittance = exp(-beta * opticalDepth);

    // Normalize transmittance to get the hue (what color remains after scattering)
    vec3 transmitColor = transmittance;
    float maxT = max(transmittance.r, max(transmittance.g, transmittance.b));
    if (maxT > 0.001) {
        transmitColor = transmittance / maxT;  // Normalized sunset color
    } else {
        transmitColor = vec3(1.0, 0.3, 0.1);  // Deep red for very thick atmosphere
    }

    // Blend from blue (low depth) to transmitted color (high depth = orange/red)
    float depthFactor = 1.0 - exp(-opticalDepth * 2.0 * uSunsetStrength);
    vec3 blueScatter = vec3(0.4, 0.7, 1.0);
    vec3 scatterColor = mix(blueScatter, transmitColor, depthFactor);

    // Apply the incoming light color to the scatter color
    vec3 scatteredLight = incomingLight * scatterColor;

    // For lava planets, tint toward orange
    vec3 lavaAtmosTint = vec3(1.0, 0.4, 0.1);
    scatteredLight = mix(scatteredLight, incomingLight * lavaAtmosTint, isDesert * 0.7);

    // Final atmosphere color
    vec3 atmosColor = scatteredLight * atmosDensity * uAtmosIntensity * 1.5;

    // Alpha follows density
    float atmosAlpha = clamp(atmosDensity * 0.8, 0.0, 1.0);
    // ========================================
    // PLANET SURFACE RENDERING
    // ========================================
    vec3 col = vec3(0.0);

    // Ocean color - deep blue with depth variation based on terrain height
    vec3 oceanColor = vec3(0.05, 0.15, 0.35);
    float oceanDepth = smoothstep(seaLevel - 0.3, seaLevel, heightC);
    oceanColor = mix(vec3(0.02, 0.08, 0.2), vec3(0.2078, 0.5137, 0.6902), oceanDepth);

    // ========================================
    // BIOME-SPECIFIC SURFACE COLORS
    // ========================================

    // --- OCEANIC BIOME: Green land with white sand beaches ---
    vec3 oceanicLand = vec3(0.15, 0.45, 0.2);
    oceanicLand = mix(oceanicLand, vec3(0.1, 0.35, 0.15), smoothstep(0.1, 0.4, heightC));
    vec3 oceanicSand = vec3(0.95, 0.9, 0.75);
    float oceanicSandMask = smoothstep(seaLevel, seaLevel + 0.03, heightC) * smoothstep(seaLevel + 0.08, seaLevel + 0.03, heightC);
    vec3 oceanicSurface = mix(oceanicLand, oceanicSand, oceanicSandMask);

    // --- LAVA/VOLCANIC BIOME: Dark rock with glowing lava rivers ---
    vec3 lavaRockDark = vec3(0.12, 0.08, 0.06);  // Very dark volcanic rock
    vec3 lavaRockMid = vec3(0.25, 0.15, 0.1);    // Medium volcanic rock
    vec3 lavaRockLight = vec3(0.35, 0.2, 0.12); // Lighter rock on peaks
    // Height-based rock coloring
    vec3 lavaSurface = mix(lavaRockDark, lavaRockMid, smoothstep(-0.3, 0.1, heightC));
    lavaSurface = mix(lavaSurface, lavaRockLight, smoothstep(0.2, 0.5, heightC));
    // Glowing lava color for the "ocean" (low areas) - ultra bright and emissive
    vec3 lavaGlow = vec3(1.0, 0.5, 0.1);        // Very bright orange-yellow lava
    vec3 lavaHot = vec3(1.0, 0.8, 0.3);         // White-hot center
    vec3 lavaCool = vec3(0.9, 0.2, 0.05);       // Cooler orange lava
    // Lava pulses with time for animated glow - faster and more intense
    float lavaPulse = sin(t * 0.8 + heightC * 6.0) * 0.5 + 0.5;
    float lavaPulse2 = sin(t * 1.2 + heightC * 3.0) * 0.3 + 0.7;
    vec3 lavaColor = mix(lavaCool, lavaGlow, lavaPulse * 0.6 + 0.4);
    lavaColor = mix(lavaColor, lavaHot, lavaPulse2 * lavaPulse * 0.4);
    oceanColor = mix(oceanColor, lavaColor, isDesert);

    // --- MOUNTAIN/ICE BIOME: Rocky with ice caps ---
    vec3 mountainRock = vec3(0.35, 0.32, 0.3);  // Gray rock base
    vec3 mountainGrass = vec3(0.2, 0.35, 0.2); // Some grass at low altitudes
    vec3 mountainSnow = vec3(0.95, 0.97, 1.0); // White ice/snow
    // Height-based layering: grass -> rock -> snow
    float grassMask = smoothstep(seaLevel, seaLevel + 0.15, heightC) * smoothstep(0.2, 0.1, heightC);
    float snowMask = smoothstep(0.25, 0.45, heightC);
    vec3 mountainSurface = mountainRock;
    mountainSurface = mix(mountainSurface, mountainGrass, grassMask);
    mountainSurface = mix(mountainSurface, mountainSnow, snowMask);
    // Thin sand/gravel beach at water edge
    vec3 mountainBeach = vec3(0.6, 0.55, 0.5);
    float mountainBeachMask = smoothstep(seaLevel, seaLevel + 0.02, heightC) * smoothstep(seaLevel + 0.06, seaLevel + 0.02, heightC);
    mountainSurface = mix(mountainSurface, mountainBeach, mountainBeachMask);

    // Select biome surface color
    vec3 landColor = oceanicSurface * isOceanic + lavaSurface * isDesert + mountainSurface * isMountain;

    // Blend land with ocean
    vec3 surfaceColor = mix(landColor, oceanColor, oceanMask);

    // ========================================
    // PBR SURFACE COMPOSITION
    // ========================================
    // Diffuse: already energy-conserving (multiplied by (1-F)/PI in lighting loop)
    // Specular: full Cook-Torrance BRDF already computed

    // Diffuse lighting - reduced for ocean (darker water, more reflective)
    float diffuseStrength = mix(2.5, 1.2, oceanMask);  // Boosted for PBR energy conservation
    col += surfaceColor * totalDiffuse * diffuseStrength * planetMask;

    // Specular - PBR handles intensity via BRDF, just need scene-level scaling
    float iceSpecular = snowMask * isMountain * 0.5; // Ice gets extra boost
    float landSpecStrength = 1.0 + iceSpecular;
    float oceanSpecStrength = 1.5;  // Water is more reflective
    vec3 specColor = mix(vec3(1.0), vec3(1.0), oceanMask);  // White specular for both (PBR)
    // Ice/snow gets tinted specular
    specColor = mix(specColor, vec3(0.95, 0.97, 1.0), snowMask * isMountain * 0.3);
    // Use oceanSpecular (low roughness) for ocean, totalSpecular (high roughness) for land
    vec3 finalSpecular = mix(totalSpecular * landSpecStrength, oceanSpecular * oceanSpecStrength, oceanMask);
    col += specColor * finalSpecular * planetMask;

    // Ocean SSS - translucent turquoise subsurface scattering
    vec3 sssColor = vec3(0.15, 0.6, 0.65); // Turquoise/cyan tint
    // Tighter wrap for focused translucency effect
    float sssWrap = 0.15;
    // Back-lighting component - light shining through from behind
    float backLight0 = pow(max(0.0, -dot(N, L0) * 0.5 + 0.5), 3.0);
    float backLight1 = pow(max(0.0, -dot(N, L1) * 0.5 + 0.5), 3.0);
    float backLight2 = pow(max(0.0, -dot(N, L2) * 0.5 + 0.5), 3.0);
    float backLightMouse = pow(max(0.0, -dot(N, mouseL) * 0.5 + 0.5), 3.0);
    // Wrap lighting for edge translucency
    float sssNdL0 = pow(max(0.0, (dot(N, L0) + sssWrap) / (1.0 + sssWrap)), 1.5);
    float sssNdL1 = pow(max(0.0, (dot(N, L1) + sssWrap) / (1.0 + sssWrap)), 1.5);
    float sssNdL2 = pow(max(0.0, (dot(N, L2) + sssWrap) / (1.0 + sssWrap)), 1.5);
    float sssMouseNdL = pow(max(0.0, (dot(N, mouseL) + sssWrap) / (1.0 + sssWrap)), 1.5);
    // Combine wrap and backlight for translucent look
    vec3 sss = sssColor * (
        uLightColor0 * (sssNdL0 * 0.6 + backLight0 * 1.2) * atten0 +
        uLightColor1 * (sssNdL1 * 0.6 + backLight1 * 1.2) * atten1 +
        uLightColor2 * (sssNdL2 * 0.6 + backLight2 * 1.2) * atten2 +
        vec3(1.0) * (sssMouseNdL * 0.6 + backLightMouse * 1.2) * mouseAtten
    ) * 2.0 * uSSSIntensity;
    // Apply SSS only to ocean areas (not lava)
    col += sss * oceanMask * planetMask * (1.0 - isDesert);

    // Lava emission - glowing lava emits its own light (super bright)
    float lavaEmission = oceanMask * isDesert * (lavaPulse * 0.5 + 0.5) * (lavaPulse2 * 0.3 + 0.7);
    col += lavaColor * lavaEmission * 3.5 * uLavaIntensity * planetMask;
    // Add extra bloom-like glow for hottest areas
    col += lavaHot * lavaEmission * lavaPulse * 0.8 * uLavaIntensity * planetMask;

    // No ambient light in space

    // Fresnel rim on surface - using Schlick approximation for PBR
    // This adds the view-dependent rim reflection at grazing angles
    vec3 rimF0 = mix(landF0, oceanF0, oceanMask);
    vec3 fresnelRim = fresnelSchlick(NdV, rimF0) * planetMask;
    // Rim lighting from environment/atmosphere reflection
    vec3 rimColor = mix(vec3(0.5, 0.6, 0.7), vec3(0.6, 0.8, 1.0), oceanMask);
    col += rimColor * fresnelRim * totalAttenuation * 0.3;
    col += planetColor * vGlow * (0.15 + fresnelRim.r * 0.3);

    // Blend atmosphere with surface
    // The atmosphere affects both:
    // 1. The terrain surface (atmospheric haze tinting the ground)
    // 2. The space around the planet (visible atmosphere shell)

    // Over terrain: blend atmosphere color based on density (haze effect)
    // Stronger at the limb (low NdV) where we look through more atmosphere
    // Also apply shadow factor so atmosphere is darker on the night side
    float limbFactor = pow(1.0 - NdV, 2.0);  // More atmosphere at edges
    float terrainAtmosBlend = atmosAlpha * (0.3 + limbFactor * 0.7) * planetMask * shadowFactor;
    col = mix(col, atmosColor / max(atmosAlpha, 0.01), terrainAtmosBlend);

    // Outside planet: additive atmosphere glow (already has shadow baked into atmosColor via incomingLight)
    col += atmosColor * (1.0 - planetMask);
    

    // ========================================
    // LAVA GLOW EMISSION - light projected outside the planet
    // ========================================
    float lavaGlowAlpha = 0.0;
    if (isDesert > 0.5 && d > planetRadius * 0.9) {
        // Sample lava intensity from the planet edge toward center
        // Use radial direction to find where lava would be
        vec2 dir = d > 0.001 ? normalize(uv) : vec2(0.0, 1.0);

        // Check multiple sample points along the edge
        float lavaGlowAccum = 0.0;
        for (int i = 0; i < 8; i++) {
            // Sample at different angles around this pixel
            float sampleAngle = float(i) * 0.785398; // PI/4 increments
            vec2 rotDir = vec2(
                dir.x * cos(sampleAngle) - dir.y * sin(sampleAngle),
                dir.x * sin(sampleAngle) + dir.y * cos(sampleAngle)
            );

            // Sample height at edge of planet in this direction
            vec2 edgeSampleUV = rotDir * planetRadius * 0.95;
            vec2 edgeHeightCoord = edgeSampleUV * 2.5 + vIndex * 10.0;
            float edgeHeight = snoise(edgeHeightCoord) * 0.6
                             + snoise(edgeHeightCoord * 2.0 + 1.5) * 0.25;

            // Check if this edge point has lava (below sea level)
            float edgeLavaMask = smoothstep(seaLevel + 0.08, seaLevel - 0.02, edgeHeight);

            // Distance falloff from planet - slower falloff for longer rays
            float distFromPlanet = max(0.0, d - planetRadius);
            float glowFalloff = exp(-distFromPlanet * 4.0);

            // Directional factor - stronger glow in direction of lava
            float dirFactor = max(0.0, dot(dir, rotDir));

            lavaGlowAccum += edgeLavaMask * glowFalloff * dirFactor;
        }
        lavaGlowAccum /= 8.0;

        // Pulsing glow synced with lava animation - brighter
        float glowPulse = sin(t * 0.8) * 0.35 + 0.65;
        float glowPulse2 = sin(t * 1.3) * 0.2 + 0.8;

        // Add lava glow color outside the planet - much brighter orange-red
        vec3 lavaGlowOuter = vec3(1.0, 0.4, 0.1);  // Bright orange
        vec3 lavaGlowHot = vec3(1.0, 0.7, 0.3);    // Hot yellow-white core
        vec3 lavaGlowColor = mix(lavaGlowOuter, lavaGlowHot, glowPulse2 * 0.5);
        lavaGlowColor *= lavaGlowAccum * glowPulse * 4.0 * uLavaIntensity;
        col += lavaGlowColor * (1.0 - planetMask);

        // Store lava glow alpha for later (alpha not declared yet)
        lavaGlowAlpha = lavaGlowAccum * glowPulse * 0.8 * uLavaIntensity * (1.0 - planetMask);
    }

    // Tone mapping
    col = col / (col + vec3(0.7));
    col = pow(col, vec3(0.95));

    // Alpha calculation
    float alpha = 0.0;
    alpha += planetMask * 0.98;
    alpha += atmosAlpha * (1.0 - planetMask * 0.5);
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= outerFade;
    alpha *= smoothstep(0.0, 0.5, ap);
    alpha *= vAlpha;

    // Add lava glow alpha for visibility outside planet
    alpha = max(alpha, lavaGlowAlpha);

    // ========================================
    // ASTEROIDS - orbiting around desert planets
    // ========================================
    if (isDesert > 0.5) {
        float orbitRadius = planetRadius * 1.5;
        float asteroidSize = planetRadius * 0.095;

        // Multiple asteroids at different orbit phases
        for (int i = 0; i < 4; i++) {
            float fi = float(i);
            float phase = fi * 1.5708; // PI/2 spacing
            float orbitSpeed = 0.25 + fi * 0.06;
            float asteroidAngle = t * orbitSpeed + phase + vIndex * 2.0;

            // Elliptical orbit with some variation
            float orbitA = orbitRadius * (1.0 + fi * 0.1);
            float orbitB = orbitRadius * (0.6 + fi * 0.08);
            vec2 asteroidPos = vec2(
                cos(asteroidAngle) * orbitA,
                sin(asteroidAngle) * orbitB
            );

            // Vary asteroid size per asteroid
            float thisSize = asteroidSize * (0.5 + fi * 0.2);

            // Irregular asteroid shape using noise
            vec2 asteroidUV = (uv - asteroidPos) / thisSize;
            float asteroidNoise = snoise(asteroidUV * 3.0 + fi * 5.0) * 0.25;
            float asteroidShape = length(asteroidUV) - (1.0 + asteroidNoise);
            float asteroidMask = 1.0 - smoothstep(-0.15, 0.05, asteroidShape);

            // Simple lighting for asteroid
            vec3 asteroidN = normalize(vec3(asteroidUV * 0.8, sqrt(max(0.0, 1.0 - dot(asteroidUV, asteroidUV) * 0.7))));
            float asteroidLight = max(0.0, dot(asteroidN, normalize(vec3(0.5, 0.5, 1.0))));

            // Rocky brown/gray asteroid color
            vec3 asteroidColor = vec3(0.35, 0.3, 0.25) * (0.4 + asteroidLight * 0.6);
            asteroidColor += vec3(0.08, 0.06, 0.04) * snoise(asteroidUV * 6.0 + fi);

            // Tone map asteroid
            asteroidColor = asteroidColor / (asteroidColor + vec3(0.7));

            // Hide asteroid when behind planet (simple depth test)
            float inFront = step(planetRadius * 0.9, length(asteroidPos));

            col = mix(col, asteroidColor, asteroidMask * inFront);
            alpha = max(alpha, asteroidMask * 0.85 * inFront);
        }
    }

    gl_FragColor = vec4(col, alpha);
}
`;
