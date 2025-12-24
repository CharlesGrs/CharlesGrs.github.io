// Planet Fragment Shader - Edit this file for IDE syntax highlighting
// The GLSL code is inside the template literal string below
window.PLANET_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;
varying vec2 vCenter;
varying vec2 vOriginalCenter;  // Original screen-space center for lighting
varying float vRadius;
varying float vOriginalRadius; // Original radius for lighting
varying vec3 vColor;
varying float vAlpha;
varying float vAppear;
varying float vGlow;
varying float vIndex;
varying float vIsLight;
varying float vWorldZ;  // World Z position for 3D sphere distribution
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uTime;
uniform vec2 uLight0;
uniform vec2 uLight1;
uniform vec2 uLight2;
uniform vec3 uLightColor0;
uniform vec3 uLightColor1;
uniform vec3 uLightColor2;
uniform float uLight0Intensity;
uniform float uLight1Intensity;
uniform float uLight2Intensity;
uniform float uLight0Atten;
uniform float uLight1Atten;
uniform float uLight2Atten;
uniform float uLight0Z;
uniform float uLight1Z;
uniform float uLight2Z;
uniform vec3 uLight0WorldPos;
uniform vec3 uLight1WorldPos;
uniform vec3 uLight2WorldPos;
uniform vec2 uLight0ScreenPos;
uniform vec2 uLight1ScreenPos;
uniform vec2 uLight2ScreenPos;
uniform float uMouseLightEnabled;
uniform float uAmbientIntensity;
uniform float uFogIntensity;  // Fog intensity (colored by env light)
uniform float uCameraRotX;  // Camera rotation around X axis (pitch)
uniform float uCameraRotY;  // Camera rotation around Y axis (yaw)
uniform vec3 uCameraPos;  // Camera position XYZ (free camera)

// Background texture for fog/atmosphere sampling
uniform sampler2D uBackgroundTexture;
uniform float uUseBackgroundTexture;  // 1.0 if texture is available, 0.0 otherwise
uniform vec2 uFBORes;  // FBO resolution (actual canvas pixels with DPR)

// ========================================
// PER-PLANET TYPE PARAMETERS
// Set A: Oceanic/Mountain planets (biome 0 and 2)
// Set B: Lava/Desert planets (biome 1)
// ========================================

// Planet A (Oceanic/Mountain) parameters
uniform float uNoiseScaleA;
uniform float uTerrainHeightA;
uniform float uAtmosIntensityA;
uniform float uAtmosThicknessA;
uniform float uAtmosPowerA;
uniform float uScatterRA;
uniform float uScatterGA;
uniform float uScatterBA;
uniform float uScatterScaleA;
uniform float uSunsetStrengthA;
uniform float uOceanRoughnessA;
uniform float uSSSIntensityA;
uniform float uSSSWrapA;
uniform float uSSSBacklightA;
uniform vec3 uSSSColorA;
uniform float uSeaLevelA;
uniform float uLandRoughnessA;
uniform float uNormalStrengthA;

// Planet B (Lava/Desert) parameters
uniform float uNoiseScaleB;
uniform float uTerrainHeightB;
uniform float uAtmosIntensityB;
uniform float uAtmosThicknessB;
uniform float uAtmosPowerB;
uniform float uScatterRB;
uniform float uScatterGB;
uniform float uScatterBB;
uniform float uScatterScaleB;
uniform float uSunsetStrengthB;
uniform float uLavaIntensityB;
uniform float uLandRoughnessB;
uniform float uSeaLevelB;
uniform float uNormalStrengthB;

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

// Fresnel-Schlick with roughness attenuation
// For environment/rim reflections, rough surfaces reduce Fresnel effect
// Smooth surfaces (low roughness) get full Fresnel, rough surfaces get attenuated
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    // The max(vec3(1.0 - roughness), F0) term ensures that at grazing angles,
    // smooth surfaces reflect strongly while rough surfaces are attenuated
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
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
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// 3D Simplex noise
float snoise3D(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients: 7x7 points over a square, mapped onto an octahedron
    float n_ = 0.142857142857; // 1.0/7.0
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// 2D Simplex noise (kept for compatibility)
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

    float planetRadius = 0.6;
    float atmosphereThickness = 0.65;
    float atmosphereOuter = planetRadius + atmosphereThickness;

    // Sun/light rendering is now handled by separate sun shader
    // This shader only handles planets
    if (vIsLight > 0.5) {
        discard;
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
    float eps = 0.06;

    // Biome type based on planet index (cycles through 3 types)
    // 0 = Oceanic (lots of water, green land)
    // 1 = Desert/Lava (volcanic planet)
    // 2 = Mountain/Ice (moderate water, ice on peaks)
    float biomeSelector = mod(vIndex, 3.0);
    float isOceanic = step(0.5, 1.0 - abs(biomeSelector - 0.0));
    float isDesert = step(0.5, 1.0 - abs(biomeSelector - 1.0));
    float isMountain = step(0.5, 1.0 - abs(biomeSelector - 2.0));

    // ========================================
    // SELECT PARAMETERS BASED ON PLANET TYPE
    // ========================================
    // isDesert = 1.0 for lava planets, 0.0 for oceanic/mountain
    float pNoiseScale = mix(uNoiseScaleA, uNoiseScaleB, isDesert);
    float pTerrainHeight = mix(uTerrainHeightA, uTerrainHeightB, isDesert);
    float pAtmosIntensity = mix(uAtmosIntensityA, uAtmosIntensityB, isDesert);
    float pAtmosThickness = mix(uAtmosThicknessA, uAtmosThicknessB, isDesert);
    float pAtmosPower = mix(uAtmosPowerA, uAtmosPowerB, isDesert);
    float pScatterR = mix(uScatterRA, uScatterRB, isDesert);
    float pScatterG = mix(uScatterGA, uScatterGB, isDesert);
    float pScatterB = mix(uScatterBA, uScatterBB, isDesert);
    float pScatterScale = mix(uScatterScaleA, uScatterScaleB, isDesert);
    float pSunsetStrength = mix(uSunsetStrengthA, uSunsetStrengthB, isDesert);
    float pOceanRoughness = uOceanRoughnessA;  // Only for oceanic planets
    float pSSSIntensity = uSSSIntensityA;      // Only for oceanic planets
    float pSSSWrap = uSSSWrapA;                // SSS wrap lighting amount
    float pSSSBacklight = uSSSBacklightA;      // SSS backlight intensity
    vec3 pSSSColor = uSSSColorA;               // SSS color
    float pLavaIntensity = uLavaIntensityB;    // Only for lava planets
    float pSeaLevel = mix(uSeaLevelA, uSeaLevelB, isDesert);
    float pLandRoughness = mix(uLandRoughnessA, uLandRoughnessB, isDesert);
    float pNormalStrength = mix(uNormalStrengthA, uNormalStrengthB, isDesert);

    // ========================================
    // PLANET ROTATION ON RANDOM AXIS
    // ========================================
    // Convert 2D UV to 3D sphere position for rotation
    float rotZSq = planetRadius * planetRadius - d * d;
    float rotZ = rotZSq > 0.0 ? sqrt(rotZSq) : 0.0;
    vec3 spherePos = vec3(uv, rotZ);

    // Generate random rotation axis per planet (seeded by vIndex)
    // Using golden ratio based offsets for good distribution
    float axisSeed = vIndex * 1.618033988749;
    vec3 rotAxis = normalize(vec3(
        sin(axisSeed * 2.3 + 0.5),
        cos(axisSeed * 3.7 + 1.2),
        sin(axisSeed * 1.9 + 2.8)
    ));

    // Rotation speed varies per planet (0.02 to 0.08 radians per time unit)
    float rotSpeed = 0.03 + 0.05 * fract(axisSeed * 7.3);
    float rotAngle = t * rotSpeed;

    // Rodrigues' rotation formula: rotate spherePos around rotAxis by rotAngle
    float cosA = cos(rotAngle);
    float sinA = sin(rotAngle);
    vec3 rotatedPos = spherePos * cosA
                    + cross(rotAxis, spherePos) * sinA
                    + rotAxis * dot(rotAxis, spherePos) * (1.0 - cosA);

    // Normalize rotated position to unit sphere for consistent noise sampling
    vec3 rotatedPosNorm = normalize(rotatedPos);

    // Offset for per-planet variation
    vec3 planetOffset = vec3(vIndex * 10.0, vIndex * 7.3, vIndex * 5.1);

    // Multi-octave height for terrain using 3D noise on sphere surface
    // This eliminates UV distortion at poles and creates seamless terrain
    // Scale down noise frequency for larger continental features
    float terrainScale = pNoiseScale * 0.15;
    vec3 heightCoord3D = rotatedPosNorm * terrainScale + planetOffset;
    float heightC = snoise3D(heightCoord3D) * 0.5
                  + snoise3D(heightCoord3D * 2.0 + 1.5) * 0.25
                  + snoise3D(heightCoord3D * 4.0 + 3.0) * 0.15
                  + snoise3D(heightCoord3D * 8.0 + 5.5) * 0.1
                  + snoise3D(heightCoord3D * 16.0 + 8.0) * 0.05;

    // For normals, sample at offset positions in tangent space
    // Build tangent frame on sphere
    vec3 sphereUp = abs(rotatedPosNorm.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 sphereTangent = normalize(cross(sphereUp, rotatedPosNorm));
    vec3 sphereBitangent = cross(rotatedPosNorm, sphereTangent);

    // Sample height at offset positions along tangent and bitangent
    vec3 heightCoordX = (rotatedPosNorm + sphereTangent * eps) * terrainScale + planetOffset;
    vec3 heightCoordY = (rotatedPosNorm + sphereBitangent * eps) * terrainScale + planetOffset;

    float heightX = snoise3D(heightCoordX) * 0.5
                  + snoise3D(heightCoordX * 2.0 + 1.5) * 0.25
                  + snoise3D(heightCoordX * 4.0 + 3.0) * 0.15
                  + snoise3D(heightCoordX * 8.0 + 5.5) * 0.1
                  + snoise3D(heightCoordX * 16.0 + 8.0) * 0.05;
    float heightY = snoise3D(heightCoordY) * 0.5
                  + snoise3D(heightCoordY * 2.0 + 1.5) * 0.25
                  + snoise3D(heightCoordY * 4.0 + 3.0) * 0.15
                  + snoise3D(heightCoordY * 8.0 + 5.5) * 0.1
                  + snoise3D(heightCoordY * 16.0 + 8.0) * 0.05;

    // Sea level varies per biome
    // Oceanic: low sea level = more water
    // Desert: very low sea level = almost no water (just oases)
    // Mountain: medium sea level = moderate water
    float seaLevel = -0.05 * isOceanic + -0.45 * isDesert + 0.0 * isMountain + pSeaLevel;
    float oceanMask = smoothstep(seaLevel + 0.08, seaLevel - 0.02, heightC);

    // Deform planet radius based on terrain height
    // Higher terrain = larger radius (mountains bulge out)
    // Clamp land height to positive values for displacement
    float landHeight = max(heightC - seaLevel, 0.0);

    // Mountain biome: apply power function for sharper peaks but clamped to stay within bounds
    float mountainHeight = pow(min(landHeight, 0.6) * 1.2, 1.8) * 0.08; // Clamped exponential for sharp but contained peaks
    float normalHeight = landHeight * 0.04;
    float terrainDisplacement = (normalHeight * (1.0 - isMountain) + mountainHeight * isMountain) * pTerrainHeight;
    // Clamp maximum displacement to 15% of planet radius
    terrainDisplacement = min(terrainDisplacement, planetRadius * 0.15 * pTerrainHeight);
    float deformedRadius = planetRadius + terrainDisplacement;

    // Planet mask with height-deformed edge
    float planetMask = 1.0 - smoothstep(deformedRadius - 0.003, deformedRadius + 0.001, d);
    float zSq = planetRadius * planetRadius - d * d;
    float z = zSq > 0.0 ? sqrt(zSq) : 0.0;
    vec3 baseN = d < deformedRadius ? normalize(vec3(uv, z)) : vec3(0.0, 0.0, 1.0);

    // View direction: screen-space orthographic (always looking straight at screen)
    // This keeps lighting consistent regardless of camera rotation
    vec3 V = vec3(0.0, 0.0, 1.0);

    // Compute terrain gradients from heightmap
    // Mountain biome gets stronger normals for dramatic peaks
    // Base normal strength from UI, with mountain multiplier
    float normalStrength = pNormalStrength * (1.0 + isMountain * 1.5);
    float terrainGradX = -(heightX - heightC) / eps * normalStrength;
    float terrainGradY = -(heightY - heightC) / eps * normalStrength;

    // Ocean wave normal deformation - subtle animated ripples
    // Using 3D noise on sphere surface for seamless waves
    // Reduced scale (4.0 instead of 12.0) for larger, more visible wave patterns
    float waveScale = 4.0;
    float waveSpeed = t * 0.2;
    vec3 waveOffset = vec3(waveSpeed, waveSpeed * 0.7, waveSpeed * 0.5);
    vec3 waveCoord3D = rotatedPosNorm * waveScale + planetOffset * 0.5;

    float wave1 = snoise3D(waveCoord3D + waveOffset);
    float wave2 = snoise3D(waveCoord3D * 1.3 - waveOffset * 0.8 + 2.5);
    float waveEps = 0.03;
    float waveC = (wave1 + wave2 * 0.6);

    // Sample wave at offset positions using sphere tangent frame
    vec3 waveCoordX = (rotatedPosNorm + sphereTangent * waveEps) * waveScale + planetOffset * 0.5;
    vec3 waveCoordY = (rotatedPosNorm + sphereBitangent * waveEps) * waveScale + planetOffset * 0.5;

    float waveX = snoise3D(waveCoordX + waveOffset)
                + snoise3D(waveCoordX * 1.3 - waveOffset * 0.8 + 2.5) * 0.6;
    float waveY = snoise3D(waveCoordY + waveOffset)
                + snoise3D(waveCoordY * 1.3 - waveOffset * 0.8 + 2.5) * 0.6;
    float waveGradX = (waveX - waveC) / waveEps * 0.012;
    float waveGradY = (waveY - waveC) / waveEps * 0.012;

    // Build tangent space basis from spherical normal
    // Tangent and bitangent are perpendicular to baseN and to each other
    vec3 up = abs(baseN.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, baseN));
    vec3 bitangent = cross(baseN, tangent);

    // Mix terrain and wave gradients based on ocean mask
    float gradX = mix(terrainGradX, waveGradX, oceanMask);
    float gradY = mix(terrainGradY, waveGradY, oceanMask);

    // Perturb normal in tangent space (along sphere surface), then normalize
    // This ensures deformations follow the sphere's curvature
    vec3 N = normalize(baseN + tangent * gradX + bitangent * gradY);
    N = N * planetMask + baseN * (1.0 - planetMask);

    // Lighting stays in screen space (orthographic) - no rotation applied to normals
    // The camera rotation only affects the 3D projection, not the lighting model

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
    // F0 values boosted for more visible reflections at normal incidence
    // Standard dielectric F0 = 0.04, but we increase for artistic visibility
    vec3 landF0 = vec3(0.06);  // Boosted from 0.04 for more visible land reflections
    // Water F0 based on IOR 1.33: ((1.33-1)/(1.33+1))^2 = 0.02, but boosted for visibility
    vec3 oceanF0 = vec3(0.04, 0.045, 0.05);  // Boosted with slight blue tint for water
    float landRoughness = pLandRoughness;  // Land roughness from UI
    float oceanRoughness = max(0.01, pOceanRoughness);  // Ocean roughness from UI, lower minimum for sharper reflections

    // ========================================
    // CAMERA-RELATIVE LIGHT DIRECTION CALCULATION
    // ========================================
    // Both lights and planets are on the XY plane at Z=0 in world space.
    // The normals N are in screen space (orthographic, not rotated).
    // We need to compute where each light PROJECTS TO on screen after camera rotation,
    // then use that projected 2D offset for lighting (converted to 3D with Z depth).
    //
    // This matches how the vertex shader projects 3D world positions to 2D screen.

    // Camera rotation values (same as vertex shader)
    float cosRotX = cos(uCameraRotX);
    float sinRotX = sin(uCameraRotX);
    float cosRotY = cos(uCameraRotY);
    float sinRotY = sin(uCameraRotY);

    // Free camera: direct position
    vec3 cameraPos = uCameraPos;

    // Camera basis vectors (from rotation angles, not looking at origin)
    vec3 cameraForward = vec3(sinRotY * cosRotX, -sinRotX, cosRotY * cosRotX);
    vec3 cameraRight = vec3(cosRotY, 0.0, -sinRotY);
    vec3 cameraUp = cross(cameraForward, cameraRight);

    // Scale factor to convert screen pixels to world units (same as vertex shader)
    float worldScale = 1.0 / uRes.x;
    vec2 screenCenter = uRes * 0.5;

    // Helper function: project a world position to screen coordinates
    // (Same math as vertex shader but inline)
    // Returns the projected 2D screen position

    // Planet world position (from original screen position + world Z)
    vec2 planetScreenOffset = vOriginalCenter - screenCenter;
    vec3 planetWorldPos = vec3(planetScreenOffset.x * worldScale, -planetScreenOffset.y * worldScale, vWorldZ);

    // ---- MOUSE LIGHT (toggle with spacebar) ----
    // Convert mouse screen position to world position
    vec2 mouseScreenOffset = uMouse - screenCenter;
    vec3 mouseWorldPos = vec3(mouseScreenOffset.x * worldScale, -mouseScreenOffset.y * worldScale, 0.0);

    // Project both positions to screen using camera transform
    vec3 toPlanet = planetWorldPos - cameraPos;
    float planetZDist = dot(toPlanet, cameraForward);
    float planetPerspScale = 1.0 / max(planetZDist, 0.01);
    vec2 planetProj = vec2(dot(toPlanet, cameraRight), -dot(toPlanet, cameraUp)) * planetPerspScale;

    vec3 toMouse = mouseWorldPos - cameraPos;
    float mouseZDist = dot(toMouse, cameraForward);
    float mousePerspScale = 1.0 / max(mouseZDist, 0.01);
    vec2 mouseProj = vec2(dot(toMouse, cameraRight), -dot(toMouse, cameraUp)) * mousePerspScale;

    // The lighting offset is the difference in projected screen positions
    vec2 mouseLightOffset = (mouseProj - planetProj) * uRes.x;
    // Convert to 3D light direction (screen-space, Z toward viewer)
    vec3 mouseLightPos = vec3(mouseLightOffset * 0.003, -1.0);
    vec3 mouseL = normalize(mouseLightPos);
    float mouseDist = length(mouseLightPos);
    float mouseAtten = 0.15 / (mouseDist * mouseDist + 0.01);
    mouseAtten = min(mouseAtten, 2.5) * uMouseLightEnabled;
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

    // ---- WORLD SPACE VECTORS FOR PBR ----
    // Transform normal to world space
    // N is in screen/view space: X = right on screen, Y = up on screen, Z = toward viewer
    // Match the convention used for planetWorldPos (positive X = right, negative Y = up in screen)
    vec3 N_world = normalize(cameraRight * N.x - cameraUp * N.y - cameraForward * N.z);

    // View direction in world space (from surface toward camera)
    // V is (0,0,1) in screen space, which corresponds to -cameraForward in world space
    // (camera looks along +cameraForward, so view direction is opposite)
    vec3 V_world = -cameraForward;

    // Compute surface point in world space (planet center + world normal * radius)
    // vOriginalRadius is in screen pixels, convert to world units
    float radiusWorld = vOriginalRadius * worldScale;
    vec3 surfaceWorldPos = planetWorldPos + N_world * radiusWorld;

    // ---- LIGHT 0 ----
    // Light world position (passed directly from JavaScript)
    vec3 light0WorldPos = uLight0WorldPos;

    // Light direction in world space (from surface toward light)
    vec3 L0 = normalize(light0WorldPos - surfaceWorldPos);

    // Distance-based attenuation: 1 / (1 + k * d^2)
    // uLight0Atten controls falloff rate (higher = faster falloff)
    float dist0 = length(light0WorldPos - surfaceWorldPos);
    float atten0 = 1.0 / (1.0 + uLight0Atten * dist0 * dist0);
    float NdL0 = max(dot(N_world, L0), 0.0);

    // PBR specular using world-space vectors (N_world, V_world, L0 all in same space)
    vec4 pbr0 = cookTorranceBRDF(N_world, V_world, L0, landRoughness, landF0);
    totalSpecular += uLightColor0 * pbr0.xyz * atten0 * uLight0Intensity;
    totalFresnel += pbr0.w * atten0 * uLight0Intensity;
    vec4 oceanPBR0 = cookTorranceBRDF(N_world, V_world, L0, oceanRoughness, oceanF0);
    oceanSpecular += uLightColor0 * oceanPBR0.xyz * atten0 * uLight0Intensity;
    oceanFresnel += oceanPBR0.w * atten0 * uLight0Intensity;
    float diffuseWeight0 = (1.0 - pbr0.w) / PI;
    totalDiffuse += uLightColor0 * NdL0 * atten0 * diffuseWeight0 * uLight0Intensity;
    totalAttenuation += atten0 * uLight0Intensity;

    // ---- LIGHT 1 ----
    vec3 light1WorldPos = uLight1WorldPos;
    vec3 L1 = normalize(light1WorldPos - surfaceWorldPos);
    float dist1 = length(light1WorldPos - surfaceWorldPos);
    float atten1 = 1.0 / (1.0 + uLight1Atten * dist1 * dist1);
    float NdL1 = max(dot(N_world, L1), 0.0);

    // PBR specular using world-space vectors
    vec4 pbr1 = cookTorranceBRDF(N_world, V_world, L1, landRoughness, landF0);
    totalSpecular += uLightColor1 * pbr1.xyz * atten1 * uLight1Intensity;
    totalFresnel += pbr1.w * atten1 * uLight1Intensity;
    vec4 oceanPBR1 = cookTorranceBRDF(N_world, V_world, L1, oceanRoughness, oceanF0);
    oceanSpecular += uLightColor1 * oceanPBR1.xyz * atten1 * uLight1Intensity;
    oceanFresnel += oceanPBR1.w * atten1 * uLight1Intensity;
    float diffuseWeight1 = (1.0 - pbr1.w) / PI;
    totalDiffuse += uLightColor1 * NdL1 * atten1 * diffuseWeight1 * uLight1Intensity;
    totalAttenuation += atten1 * uLight1Intensity;

    // ---- LIGHT 2 ----
    vec3 light2WorldPos = uLight2WorldPos;
    vec3 L2 = normalize(light2WorldPos - surfaceWorldPos);
    float dist2 = length(light2WorldPos - surfaceWorldPos);
    float atten2 = 1.0 / (1.0 + uLight2Atten * dist2 * dist2);
    float NdL2 = max(dot(N_world, L2), 0.0);

    // PBR specular using world-space vectors
    vec4 pbr2 = cookTorranceBRDF(N_world, V_world, L2, landRoughness, landF0);
    totalSpecular += uLightColor2 * pbr2.xyz * atten2 * uLight2Intensity;
    totalFresnel += pbr2.w * atten2 * uLight2Intensity;
    vec4 oceanPBR2 = cookTorranceBRDF(N_world, V_world, L2, oceanRoughness, oceanF0);
    oceanSpecular += uLightColor2 * oceanPBR2.xyz * atten2 * uLight2Intensity;
    oceanFresnel += oceanPBR2.w * atten2 * uLight2Intensity;
    float diffuseWeight2 = (1.0 - pbr2.w) / PI;
    totalDiffuse += uLightColor2 * NdL2 * atten2 * diffuseWeight2 * uLight2Intensity;
    totalAttenuation += atten2 * uLight2Intensity;

    float NdV = max(dot(N, V), 0.001);

    // ========================================
    // PHYSICALLY-BASED ATMOSPHERIC SCATTERING
    // ========================================
    // Treating the 2D quad as a 3D sphere viewed from front
    // Atmosphere shell extends from planetRadius to atmosRadius

    float atmosRadius = planetRadius + 0.4 * pAtmosThickness;
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

    // View direction: screen-space orthographic (same as V)
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    // Calculate primary light direction in 3D (from planet center toward light)
    // Reuse the already-computed light directions from surface lighting
    vec3 lightDir0 = L0;
    vec3 lightDir1 = L1;
    vec3 lightDir2 = L2;
    vec3 mouseLightDir = mouseL;

    // Screen-space light DIRECTIONS for atmosphere shadow ray-circle intersection
    //
    // Both vCenter and uLight*ScreenPos are in screen pixels (after camera transform)
    // computed with identical math in JavaScript, so we can directly compute direction.
    //
    // Direction from planet center to light in UV space
    // Both screen and UV have same Y convention here (tested)
    vec2 light0Dir2D = normalize(vec2(
        uLight0ScreenPos.x - vCenter.x,
        uLight0ScreenPos.y - vCenter.y
    ) + vec2(0.0001));

    vec2 light1Dir2D = normalize(vec2(
        uLight1ScreenPos.x - vCenter.x,
        uLight1ScreenPos.y - vCenter.y
    ) + vec2(0.0001));

    vec2 light2Dir2D = normalize(vec2(
        uLight2ScreenPos.x - vCenter.x,
        uLight2ScreenPos.y - vCenter.y
    ) + vec2(0.0001));

    // Combined light direction (weighted average of all lights)
    vec3 combinedLightDir = normalize(
        lightDir0 * atten0 * uLight0Intensity +
        lightDir1 * atten1 * uLight1Intensity +
        lightDir2 * atten2 * uLight2Intensity +
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
        // Outside planet - use perpendicular distance method with light DIRECTION
        // For a directional light (or distant point light), we treat light as a direction
        // Shadow occurs when the ray from uv in direction of light passes through planet
        float r = planetRadius;
        float penumbraWidth = r * 0.2;  // Sharper shadow edges

        // Light 0: perpendicular distance from origin to ray (uv + t*dir)
        // Cross product in 2D: |uv x dir| = |uv.x*dir.y - uv.y*dir.x|
        vec2 D0 = light0Dir2D;
        float perpDist0 = abs(uv.x * D0.y - uv.y * D0.x);
        // Only shadow if light is "ahead" (we're on the shadow side of planet)
        float alongRay0 = dot(uv, D0);
        if (alongRay0 < 0.0 && perpDist0 < r + penumbraWidth) {
            // Fade shadow in starting from planet edge
            float behindPlanet = -alongRay0 / r;  // 0 at edge, 1 at one radius behind
            float shadowStart = smoothstep(0.0, 1.0, behindPlanet);
            float shadowCore = smoothstep(r + penumbraWidth, r - penumbraWidth, perpDist0);
            atmosShadow0 = 1.0 - shadowCore * shadowStart;
        }

        // Light 1
        vec2 D1 = light1Dir2D;
        float perpDist1 = abs(uv.x * D1.y - uv.y * D1.x);
        float alongRay1 = dot(uv, D1);
        if (alongRay1 < 0.0 && perpDist1 < r + penumbraWidth) {
            float behindPlanet1 = -alongRay1 / r;
            float shadowStart1 = smoothstep(0.0, 1.0, behindPlanet1);
            float shadowCore1 = smoothstep(r + penumbraWidth, r - penumbraWidth, perpDist1);
            atmosShadow1 = 1.0 - shadowCore1 * shadowStart1;
        }

        // Light 2
        vec2 D2 = light2Dir2D;
        float perpDist2 = abs(uv.x * D2.y - uv.y * D2.x);
        float alongRay2 = dot(uv, D2);
        if (alongRay2 < 0.0 && perpDist2 < r + penumbraWidth) {
            float behindPlanet2 = -alongRay2 / r;
            float shadowStart2 = smoothstep(0.0, 1.0, behindPlanet2);
            float shadowCore2 = smoothstep(r + penumbraWidth, r - penumbraWidth, perpDist2);
            atmosShadow2 = 1.0 - shadowCore2 * shadowStart2;
        }

        // Mouse light
        vec2 DM = normalize(mouseL.xy + vec2(0.0001));
        float perpDistM = abs(uv.x * DM.y - uv.y * DM.x);
        float alongRayM = dot(uv, DM);
        if (alongRayM < 0.0 && perpDistM < r + penumbraWidth) {
            float behindPlanetM = -alongRayM / r;
            float shadowStartM = smoothstep(0.0, 1.0, behindPlanetM);
            float shadowCoreM = smoothstep(r + penumbraWidth, r - penumbraWidth, perpDistM);
            atmosShadowMouse = 1.0 - shadowCoreM * shadowStartM;
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
    vec3 beta = vec3(pScatterR, pScatterG, pScatterB);

    // ========================================
    // PHYSICALLY-BASED ATMOSPHERIC SCATTERING
    // Based on Sebastian Lague's atmosphere shader
    // Adapted for 2D quad rendering
    // ========================================

    float densityFalloff = pAtmosPower;

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
    opticalDepth *= pScatterScale;

    // ========================================
    // ATMOSPHERE DENSITY (visibility/alpha)
    // ========================================
    float atmosDensity = 0.0;

    if (d < atmosRadius) {
        float normalizedDist = d / atmosRadius;
        atmosDensity = exp(-normalizedDist * normalizedDist * densityFalloff * 0.1) * (1.0 - normalizedDist);
        atmosDensity *= pAtmosThickness;
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
    incomingLight += uLightColor0 * atten0 * uLight0Intensity * atmosShadow0;
    incomingLight += uLightColor1 * atten1 * uLight1Intensity * atmosShadow1;
    incomingLight += uLightColor2 * atten2 * uLight2Intensity * atmosShadow2;
    incomingLight += vec3(1.0) * mouseAtten * 0.3 * atmosShadowMouse;
    // No ambient light in space - only direct light sources

    // TRANSMITTANCE-BASED SCATTERING for sunset colors
    // Transmittance = what passes through: exp(-beta * depth)
    // Blue has highest beta, so it gets removed first = red/orange remains at high depth
    // pSunsetStrength controls how strongly depth affects transmittance
    vec3 transmittance = exp(-beta * opticalDepth * pSunsetStrength);

    // Normalize transmittance to get the hue (what color remains after scattering)
    vec3 transmitColor = transmittance;
    float maxT = max(transmittance.r, max(transmittance.g, transmittance.b));
    if (maxT > 0.001) {
        transmitColor = transmittance / maxT;  // Normalized sunset color
    } else {
        transmitColor = vec3(1.0, 0.3, 0.1);  // Deep red for very thick atmosphere
    }

    // Derive scatter color from beta coefficients (Rayleigh scattering)
    // Higher beta = scatters more of that wavelength = brighter in scattered light
    // For Earth: beta_blue > beta_green > beta_red, so sky is blue
    // We use 1 - exp(-beta * scale) to convert scattering coefficient to color intensity
    vec3 blueScatter = vec3(1.0) - exp(-beta * 8.0);  // Scale factor for visible color

    // Blend from scattered color (low depth) to transmitted color (high depth = sunset)
    float depthFactor = 1.0 - exp(-opticalDepth * 2.0 * pSunsetStrength);
    vec3 scatterColor = mix(blueScatter, transmitColor, depthFactor);

    // Apply the incoming light color to the scatter color
    vec3 scatteredLight = incomingLight * scatterColor;

    // Final atmosphere color
    vec3 atmosColor = scatteredLight * atmosDensity * pAtmosIntensity * 1.5;


    // Alpha follows density
    float atmosAlpha = clamp(atmosDensity * 0.8, 0.0, 1.0);
    // ========================================
    // PLANET SURFACE RENDERING
    // ========================================
    vec3 col = vec3(0.0);

    // Ocean color - vibrant stylized water with depth variation
    // Deep areas are rich dark blue, shallow areas are vibrant turquoise
    vec3 oceanDeep = vec3(0.02, 0.06, 0.18);      // Deep ocean - dark rich blue
    vec3 oceanMid = vec3(0.05, 0.2, 0.45);        // Mid depth - saturated blue
    vec3 oceanShallow = vec3(0.1, 0.5, 0.6);      // Shallow - vibrant teal/turquoise
    float oceanDepth = smoothstep(seaLevel - 0.4, seaLevel, heightC);
    float shallowMask = smoothstep(seaLevel - 0.1, seaLevel - 0.02, heightC);
    vec3 oceanColor = mix(oceanDeep, oceanMid, oceanDepth);
    oceanColor = mix(oceanColor, oceanShallow, shallowMask * 0.7);

    // View-dependent color enhancement - water looks more vibrant at grazing angles
    float oceanViewFactor = pow(1.0 - NdV, 2.0);
    vec3 oceanGrazing = vec3(0.149, 0.702, 0.4431);    // Bright teal at edges
    oceanColor = mix(oceanColor, oceanGrazing, oceanViewFactor * 0.4 * oceanMask);

    // ========================================
    // BIOME-SPECIFIC SURFACE COLORS
    // ========================================

    // --- OCEANIC BIOME: Green land with white sand beaches ---
    vec3 oceanicLand = vec3(0.2392, 0.7137, 0.3176);
    oceanicLand = mix(oceanicLand, vec3(0.1, 0.35, 0.15), smoothstep(0.1, 0.4, heightC));
    vec3 oceanicSand = vec3(0.95, 0.9, 0.75);
    float oceanicSandMask = smoothstep(seaLevel, seaLevel + 0.03, heightC) * smoothstep(seaLevel + 0.08, seaLevel + 0.03, heightC);
    vec3 oceanicSurface = mix(oceanicLand, oceanicSand, oceanicSandMask);

    // --- LAVA/VOLCANIC BIOME: Dark rock with glowing lava rivers ---
    vec3 lavaRockDark = vec3(0.5961, 0.5216, 0.4863);  // Very dark volcanic rock
    vec3 lavaRockMid = vec3(0.25, 0.15, 0.1);    // Medium volcanic rock
    vec3 lavaRockLight = vec3(0.5608, 0.4431, 0.3804); // Lighter rock on peaks
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
    // Significantly boosted specular strength for clearly visible reflections
    // The Cook-Torrance BRDF output is physically correct but can appear dim without proper HDR
    float iceSpecular = snowMask * isMountain * 1.5; // Ice gets extra boost
    float landSpecStrength = 3.0 + iceSpecular;      // Boosted from 2.0 for visible land highlights
    float oceanSpecStrength = 6.5;  // Water is highly reflective - boosted for stylized look

    // Specular color - tinted by environment for stylized reflections
    vec3 landSpecColor = vec3(1.0);  // White specular for land (PBR standard)
    // Ice/snow gets tinted specular
    landSpecColor = mix(landSpecColor, vec3(0.95, 0.97, 1.0), snowMask * isMountain * 0.3);

    // Ocean specular picks up environment color for vibrant reflections
    vec3 lightEnvColor = (uLightColor0 * atten0 * uLight0Intensity + uLightColor1 * atten1 * uLight1Intensity + uLightColor2 * atten2 * uLight2Intensity) / max(totalAttenuation, 0.001);
    // Blend between white specular and environment-tinted specular
    // This creates colorful sun reflections on water
    vec3 oceanSpecColor = mix(vec3(1.0), lightEnvColor, 0.4);
    // Add slight cyan tint to complement the water color
    oceanSpecColor = mix(oceanSpecColor, vec3(0.85, 0.95, 1.0), 0.2);

    vec3 specColor = mix(landSpecColor, oceanSpecColor, oceanMask);

    // Use oceanSpecular (low roughness) for ocean, totalSpecular (high roughness) for land
    vec3 finalSpecular = mix(totalSpecular * landSpecStrength, oceanSpecular * oceanSpecStrength, oceanMask);

    // Add extra sparkle on wave peaks for stylized look
    float waveHighlight = smoothstep(0.3, 0.8, waveC) * oceanMask;
    finalSpecular += oceanSpecular * waveHighlight * 2.0 * oceanMask;

    col += specColor * finalSpecular * planetMask;

    // Ocean SSS - subsurface scattering for translucent water
    // Uses the wave-deformed normal (N_world) for SSS to respect water normals

    // Wrap lighting - light wraps around edges for translucency effect
    float sssNdL0 = max(0.0, (dot(N_world, L0) + pSSSWrap) / (1.0 + pSSSWrap));
    float sssNdL1 = max(0.0, (dot(N_world, L1) + pSSSWrap) / (1.0 + pSSSWrap));
    float sssNdL2 = max(0.0, (dot(N_world, L2) + pSSSWrap) / (1.0 + pSSSWrap));
    float sssNdL_mouse = max(0.0, (dot(N_world, mouseL) + pSSSWrap) / (1.0 + pSSSWrap));

    // Back-lighting - glow when light is behind the surface
    float backLight0 = pow(max(0.0, -dot(N_world, L0)), 2.0) * pSSSBacklight;
    float backLight1 = pow(max(0.0, -dot(N_world, L1)), 2.0) * pSSSBacklight;
    float backLight2 = pow(max(0.0, -dot(N_world, L2)), 2.0) * pSSSBacklight;
    float backLightMouse = pow(max(0.0, -dot(N_world, mouseL)), 2.0) * pSSSBacklight;

    // Combine wrap lighting and backlight for translucent look
    vec3 sss = pSSSColor * (
        uLightColor0 * (sssNdL0 + backLight0) * atten0 * uLight0Intensity +
        uLightColor1 * (sssNdL1 + backLight1) * atten1 * uLight1Intensity +
        uLightColor2 * (sssNdL2 + backLight2) * atten2 * uLight2Intensity +
        vec3(1.0) * (sssNdL_mouse + backLightMouse) * mouseAtten
    ) * pSSSIntensity;

    // Apply SSS only to ocean areas (not lava)
    col += sss * oceanMask * planetMask * (1.0 - isDesert);

    // Lava emission - glowing lava emits its own light (super bright)
    float lavaEmission = oceanMask * isDesert * (lavaPulse * 0.5 + 0.5) * (lavaPulse2 * 0.3 + 0.7);
    col += lavaColor * lavaEmission * 3.5 * pLavaIntensity * planetMask;
    // Add extra bloom-like glow for hottest areas
    col += lavaHot * lavaEmission * lavaPulse * 0.8 * pLavaIntensity * planetMask;

    // Ambient light (controllable via UI) - uses light environment color
    // Reduced to 10% for realistic space lighting
    col += surfaceColor * lightEnvColor * uAmbientIntensity * 0.1 * planetMask;

    // Fresnel rim on surface - using roughness-adjusted Schlick for physically correct PBR
    // Smooth surfaces (ocean) get strong rim reflections, rough surfaces (land) get weak rims
    vec3 rimF0 = mix(landF0, oceanF0, oceanMask);
    float rimRoughness = mix(landRoughness, oceanRoughness, oceanMask);
    // Use roughness-adjusted Fresnel: smooth = strong rim, rough = weak rim
    vec3 fresnelRim = fresnelSchlickRoughness(NdV, rimF0, rimRoughness) * planetMask;

    // Enhanced rim lighting from environment/atmosphere reflection
    // Reduced intensity - we're in space with minimal ambient light
    float rimIntensityByRoughness = mix(0.04, 0.15, 1.0 - rimRoughness);  // 10% of original

    // Rim color for fresnel reflections - uses lightEnvColor blended with atmosphere scatter
    vec3 rimEnvColor = mix(lightEnvColor, scatterColor, 0.3); // Blend with atmosphere scatter color
    vec3 rimColor = mix(rimEnvColor * 0.6, rimEnvColor * 1.0, oceanMask); // Ocean reflects more
    col += rimColor * fresnelRim * totalAttenuation * rimIntensityByRoughness;
    // Glow contribution - scales with ambient and actual lighting (reduced for space)
    col += planetColor * vGlow * uAmbientIntensity * 0.1;
    col += planetColor * vGlow * fresnelRim.r * 0.04 * min(totalAttenuation, 1.0);

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

    // ========================================
    // FOG EFFECT - env light colored atmospheric haze
    // ========================================
    vec2 screenUV = gl_FragCoord.xy / uFBORes;
    vec3 bgColor = texture2D(uBackgroundTexture, screenUV).rgb;

    // Fog based on actual 3D distance from camera to planet
    float distToCamera = length(surfaceWorldPos - cameraPos);
    float fogAmount = 1.0 - exp(-distToCamera * uFogIntensity);
    vec3 fogColor = bgColor;

    // Apply fog to planet surface (where planetMask = 1)
    // Surface color fades toward background with distance
    col = mix(col, fogColor, fogAmount * planetMask);

    // Outside planet: additive atmosphere glow
    // Apply fog TO the atmosphere color before adding it
    // Blend atmosphere toward fog color (weighted by atmosAlpha to maintain transparency)
    vec3 foggedAtmosColor = mix(atmosColor, fogColor * atmosAlpha, clamp(fogAmount, 0.0, 1.0));
    col += foggedAtmosColor * (1.0 - planetMask);


    // Alpha calculation
    float alpha = 0.0;
    alpha += planetMask * 1.0;
    alpha += atmosAlpha * (1.0 - planetMask * 0.5);
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= outerFade;
    // alpha *= smoothstep(0.0, 0.5, ap);
    //alpha *= vAlpha;



    // Output with premultiplied alpha for proper compositing
    gl_FragColor = vec4(col , alpha);
}
`;
