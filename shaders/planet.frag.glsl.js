// Planet Fragment Shader - Clean PBR with 2 Materials
// The GLSL code is inside the template literal string below
window.PLANET_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;
varying vec2 vCenter;
varying vec2 vOriginalCenter;
varying float vRadius;
varying float vOriginalRadius;
varying vec3 vColor;
varying float vAlpha;
varying float vAppear;
varying float vGlow;
varying float vIndex;
varying float vIsLight;
varying float vWorldZ;
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
uniform float uFogIntensity;
uniform float uCameraRotX;
uniform float uCameraRotY;
uniform vec3 uCameraPos;

uniform sampler2D uBackgroundTexture;
uniform float uUseBackgroundTexture;
uniform vec2 uFBORes;

// ========================================
// ATMOSPHERE PARAMETERS (kept from original)
// ========================================
uniform float uAtmosIntensity;
uniform float uAtmosThickness;
uniform float uAtmosPower;
uniform float uScatterR;
uniform float uScatterG;
uniform float uScatterB;
uniform float uScatterScale;
uniform float uSunsetStrength;

// ========================================
// TERRAIN PARAMETERS
// ========================================
uniform float uNoiseScale;
uniform float uSeaLevel;
uniform float uNormalStrength;

// ========================================
// MATERIAL A (Below sea level - e.g., water/lava)
// ========================================
uniform vec3 uMatABaseColor;
uniform float uMatARoughness;
uniform vec3 uMatASSSColor;
uniform float uMatASSSDistance;

// ========================================
// MATERIAL B (Above sea level - e.g., land/rock)
// ========================================
uniform vec3 uMatBBaseColor;
uniform float uMatBRoughness;
uniform vec3 uMatBSSSColor;
uniform float uMatBSSSDistance;

#define PI 3.14159265

// ========================================
// PBR FUNCTIONS
// ========================================

float distributionGGX(float NdH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdH2 = NdH * NdH;
    float denom = NdH2 * (a2 - 1.0) + 1.0;
    return a2 / (PI * denom * denom);
}

float geometrySchlickGGX(float NdV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    return NdV / (NdV * (1.0 - k) + k);
}

float geometrySmith(float NdV, float NdL, float roughness) {
    float ggx1 = geometrySchlickGGX(NdV, roughness);
    float ggx2 = geometrySchlickGGX(NdL, roughness);
    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Cook-Torrance BRDF
vec4 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, float roughness, vec3 F0) {
    vec3 H = normalize(V + L);
    float NdV = max(dot(N, V), 0.001);
    float NdL = max(dot(N, L), 0.0);
    float NdH = max(dot(N, H), 0.0);
    float HdV = max(dot(H, V), 0.0);

    float D = distributionGGX(NdH, roughness);
    float G = geometrySmith(NdV, NdL, roughness);
    vec3 F = fresnelSchlick(HdV, F0);

    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdV * NdL + 0.0001;
    vec3 specular = numerator / denominator;

    float avgF = (F.r + F.g + F.b) / 3.0;
    return vec4(specular * NdL, avgF);
}

// ========================================
// NOISE FUNCTIONS
// ========================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise3D(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
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

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// ========================================
// TERRAIN HEIGHT (5 octaves FBM)
// ========================================
float terrainHeight(vec3 pos, float scale) {
    float height = 0.0;
    float amplitude = 0.5;
    float frequency = scale;

    // 5 octaves
    height += snoise3D(pos * frequency) * amplitude;
    frequency *= 2.0; amplitude *= 0.5;
    height += snoise3D(pos * frequency) * amplitude;
    frequency *= 2.0; amplitude *= 0.5;
    height += snoise3D(pos * frequency) * amplitude;
    frequency *= 2.0; amplitude *= 0.5;
    height += snoise3D(pos * frequency) * amplitude;
    frequency *= 2.0; amplitude *= 0.5;
    height += snoise3D(pos * frequency) * amplitude;

    return height;
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

    // Discard sun/light particles (handled by sun shader)
    if (vIsLight > 0.5) {
        discard;
    }

    // ========================================
    // PLANET ROTATION
    // ========================================
    float rotZSq = planetRadius * planetRadius - d * d;
    float rotZ = rotZSq > 0.0 ? sqrt(rotZSq) : 0.0;
    vec3 spherePos = vec3(uv, rotZ);

    float axisSeed = vIndex * 1.618033988749;
    vec3 rotAxis = normalize(vec3(
        sin(axisSeed * 2.3 + 0.5),
        cos(axisSeed * 3.7 + 1.2),
        sin(axisSeed * 1.9 + 2.8)
    ));

    float rotSpeed = 0.03 + 0.05 * fract(axisSeed * 7.3);
    float rotAngle = t * rotSpeed;

    float cosA = cos(rotAngle);
    float sinA = sin(rotAngle);
    vec3 rotatedPos = spherePos * cosA
                    + cross(rotAxis, spherePos) * sinA
                    + rotAxis * dot(rotAxis, spherePos) * (1.0 - cosA);

    vec3 rotatedPosNorm = normalize(rotatedPos);
    vec3 planetOffset = vec3(vIndex * 10.0, vIndex * 7.3, vIndex * 5.1);

    // ========================================
    // TERRAIN HEIGHT CALCULATION
    // ========================================
    float eps = 0.02;

    // Tangent frame for normal calculation
    vec3 sphereUp = abs(rotatedPosNorm.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 sphereTangent = normalize(cross(sphereUp, rotatedPosNorm));
    vec3 sphereBitangent = cross(rotatedPosNorm, sphereTangent);

    // Sample terrain at center and offsets
    vec3 terrainCoord = rotatedPosNorm + planetOffset;
    float heightC = terrainHeight(terrainCoord, uNoiseScale);
    float heightX = terrainHeight(rotatedPosNorm + sphereTangent * eps + planetOffset, uNoiseScale);
    float heightY = terrainHeight(rotatedPosNorm + sphereBitangent * eps + planetOffset, uNoiseScale);

    // ========================================
    // MATERIAL BLENDING (based on sea level)
    // ========================================
    float seaLevel = uSeaLevel;
    float materialMask = smoothstep(seaLevel - 0.02, seaLevel + 0.02, heightC);

    // Material A = below sea level, Material B = above sea level
    vec3 baseColor = mix(uMatABaseColor, uMatBBaseColor, materialMask);
    float roughness = mix(uMatARoughness, uMatBRoughness, materialMask);
    vec3 sssColor = mix(uMatASSSColor, uMatBSSSColor, materialMask);
    float sssDistance = mix(uMatASSSDistance, uMatBSSSDistance, materialMask);

    // ========================================
    // NORMAL CALCULATION (from terrain height)
    // ========================================
    float planetMask = 1.0 - smoothstep(planetRadius - 0.003, planetRadius + 0.001, d);
    float zSq = planetRadius * planetRadius - d * d;
    float z = zSq > 0.0 ? sqrt(zSq) : 0.0;
    vec3 baseN = d < planetRadius ? normalize(vec3(uv, z)) : vec3(0.0, 0.0, 1.0);

    // Terrain normal perturbation
    float terrainGradX = -(heightX - heightC) / eps * uNormalStrength;
    float terrainGradY = -(heightY - heightC) / eps * uNormalStrength;

    vec3 up = abs(baseN.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, baseN));
    vec3 bitangent = cross(baseN, tangent);

    vec3 N = normalize(baseN + tangent * terrainGradX + bitangent * terrainGradY);
    N = N * planetMask + baseN * (1.0 - planetMask);

    vec3 V = vec3(0.0, 0.0, 1.0);

    // ========================================
    // CAMERA SETUP
    // ========================================
    float cosRotX = cos(uCameraRotX);
    float sinRotX = sin(uCameraRotX);
    float cosRotY = cos(uCameraRotY);
    float sinRotY = sin(uCameraRotY);

    vec3 cameraPos = uCameraPos;
    vec3 cameraForward = vec3(sinRotY * cosRotX, -sinRotX, cosRotY * cosRotX);
    vec3 cameraRight = vec3(cosRotY, 0.0, -sinRotY);
    vec3 cameraUp = cross(cameraForward, cameraRight);

    float worldScale = 1.0 / uRes.x;
    vec2 screenCenter = uRes * 0.5;

    vec2 planetScreenOffset = vOriginalCenter - screenCenter;
    vec3 planetWorldPos = vec3(planetScreenOffset.x * worldScale, -planetScreenOffset.y * worldScale, vWorldZ);

    // World space vectors
    vec3 N_world = normalize(cameraRight * N.x - cameraUp * N.y - cameraForward * N.z);
    vec3 V_world = -cameraForward;
    float radiusWorld = vOriginalRadius * worldScale;
    vec3 surfaceWorldPos = planetWorldPos + N_world * radiusWorld;

    // ========================================
    // PBR LIGHTING
    // ========================================
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);
    float totalAttenuation = 0.0;
    vec3 F0 = vec3(0.04); // Dielectric F0

    // Light 0
    vec3 L0 = normalize(uLight0WorldPos - surfaceWorldPos);
    float dist0 = length(uLight0WorldPos - surfaceWorldPos);
    float atten0 = 1.0 / (1.0 + uLight0Atten * 200.0 * dist0 * dist0);
    float NdL0 = max(dot(N_world, L0), 0.0);

    vec4 pbr0 = cookTorranceBRDF(N_world, V_world, L0, roughness, F0);
    totalSpecular += uLightColor0 * pbr0.xyz * atten0 * uLight0Intensity;
    float diffuseWeight0 = (1.0 - pbr0.w) / PI;
    totalDiffuse += uLightColor0 * NdL0 * atten0 * diffuseWeight0 * uLight0Intensity;
    totalAttenuation += atten0 * uLight0Intensity;

    // Light 1
    vec3 L1 = normalize(uLight1WorldPos - surfaceWorldPos);
    float dist1 = length(uLight1WorldPos - surfaceWorldPos);
    float atten1 = 1.0 / (1.0 + uLight1Atten * 200.0 * dist1 * dist1);
    float NdL1 = max(dot(N_world, L1), 0.0);

    vec4 pbr1 = cookTorranceBRDF(N_world, V_world, L1, roughness, F0);
    totalSpecular += uLightColor1 * pbr1.xyz * atten1 * uLight1Intensity;
    float diffuseWeight1 = (1.0 - pbr1.w) / PI;
    totalDiffuse += uLightColor1 * NdL1 * atten1 * diffuseWeight1 * uLight1Intensity;
    totalAttenuation += atten1 * uLight1Intensity;

    // Light 2
    vec3 L2 = normalize(uLight2WorldPos - surfaceWorldPos);
    float dist2 = length(uLight2WorldPos - surfaceWorldPos);
    float atten2 = 1.0 / (1.0 + uLight2Atten * 200.0 * dist2 * dist2);
    float NdL2 = max(dot(N_world, L2), 0.0);

    vec4 pbr2 = cookTorranceBRDF(N_world, V_world, L2, roughness, F0);
    totalSpecular += uLightColor2 * pbr2.xyz * atten2 * uLight2Intensity;
    float diffuseWeight2 = (1.0 - pbr2.w) / PI;
    totalDiffuse += uLightColor2 * NdL2 * atten2 * diffuseWeight2 * uLight2Intensity;
    totalAttenuation += atten2 * uLight2Intensity;

    // Mouse light
    vec2 mouseScreenOffset = uMouse - screenCenter;
    vec3 mouseWorldPos = vec3(mouseScreenOffset.x * worldScale, -mouseScreenOffset.y * worldScale, 0.0);
    vec3 toMouse = mouseWorldPos - cameraPos;
    vec3 mouseLightPos = vec3((mouseWorldPos.xy - planetWorldPos.xy) * 0.003, -1.0);
    vec3 mouseL = normalize(mouseLightPos);
    float mouseDist = length(mouseLightPos);
    float mouseAtten = 0.15 / (mouseDist * mouseDist + 0.01);
    mouseAtten = min(mouseAtten, 2.5) * uMouseLightEnabled;
    float mouseNdL = max(dot(N, mouseL), 0.0);

    vec4 mousePBR = cookTorranceBRDF(N, V, mouseL, roughness, F0);
    totalSpecular += vec3(1.0) * mousePBR.xyz * mouseAtten;
    float mouseDiffuseWeight = (1.0 - mousePBR.w) / PI;
    totalDiffuse += vec3(1.0) * mouseNdL * mouseAtten * mouseDiffuseWeight;
    totalAttenuation += mouseAtten;

    float NdV = max(dot(N, V), 0.001);

    // ========================================
    // SUBSURFACE SCATTERING
    // ========================================
    float sssWrap = 0.5;
    float sssNdL0 = max(0.0, (dot(N_world, L0) + sssWrap) / (1.0 + sssWrap));
    float sssNdL1 = max(0.0, (dot(N_world, L1) + sssWrap) / (1.0 + sssWrap));
    float sssNdL2 = max(0.0, (dot(N_world, L2) + sssWrap) / (1.0 + sssWrap));

    // Backlight contribution
    float backLight0 = pow(max(0.0, -dot(N_world, L0)), 2.0);
    float backLight1 = pow(max(0.0, -dot(N_world, L1)), 2.0);
    float backLight2 = pow(max(0.0, -dot(N_world, L2)), 2.0);

    vec3 sss = sssColor * sssDistance * (
        uLightColor0 * (sssNdL0 + backLight0 * 0.5) * atten0 * uLight0Intensity +
        uLightColor1 * (sssNdL1 + backLight1 * 0.5) * atten1 * uLight1Intensity +
        uLightColor2 * (sssNdL2 + backLight2 * 0.5) * atten2 * uLight2Intensity
    );

    // ========================================
    // PHYSICALLY-BASED ATMOSPHERIC SCATTERING
    // ========================================
    float pAtmosIntensity = uAtmosIntensity;
    float pAtmosThickness = uAtmosThickness;
    float pAtmosPower = uAtmosPower;
    float pScatterR = uScatterR;
    float pScatterG = uScatterG;
    float pScatterB = uScatterB;
    float pScatterScale = uScatterScale;
    float pSunsetStrength = uSunsetStrength;

    float atmosRadius = planetRadius + 0.4 * pAtmosThickness;
    float atmosThickness = atmosRadius - planetRadius;

    vec3 sphereNormal = vec3(0.0, 0.0, 1.0);
    float sphereZ = 0.0;
    if (d < planetRadius) {
        float zSq2 = planetRadius * planetRadius - d * d;
        sphereZ = sqrt(max(0.0, zSq2));
        sphereNormal = normalize(vec3(uv, sphereZ));
    }

    vec3 lightDir0 = L0;
    vec3 lightDir1 = L1;
    vec3 lightDir2 = L2;

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

    vec3 combinedLightDir = normalize(
        lightDir0 * atten0 * uLight0Intensity +
        lightDir1 * atten1 * uLight1Intensity +
        lightDir2 * atten2 * uLight2Intensity +
        mouseL * mouseAtten * 0.5
    );

    float lightDot = d < planetRadius ? max(0.0, dot(sphereNormal, combinedLightDir)) : 0.5;
    float shadowFactor = smoothstep(-0.1, 0.3, lightDot);

    float atmosShadow0 = 1.0;
    float atmosShadow1 = 1.0;
    float atmosShadow2 = 1.0;
    float atmosShadowMouse = 1.0;

    if (d < planetRadius) {
        atmosShadow0 = smoothstep(0.0, 0.5, NdL0);
        atmosShadow1 = smoothstep(0.0, 0.5, NdL1);
        atmosShadow2 = smoothstep(0.0, 0.5, NdL2);
        atmosShadowMouse = smoothstep(0.0, 0.5, mouseNdL);

        atmosShadow0 = max(atmosShadow0, 0.1);
        atmosShadow1 = max(atmosShadow1, 0.1);
        atmosShadow2 = max(atmosShadow2, 0.1);
        atmosShadowMouse = max(atmosShadowMouse, 0.1);
    } else if (d < atmosRadius) {
        float r = planetRadius;
        float penumbraWidth = r * 0.2;

        vec2 D0 = light0Dir2D;
        float perpDist0 = abs(uv.x * D0.y - uv.y * D0.x);
        float alongRay0 = dot(uv, D0);
        if (alongRay0 < 0.0 && perpDist0 < r + penumbraWidth) {
            float behindPlanet = -alongRay0 / r;
            float shadowStart = smoothstep(0.0, 1.0, behindPlanet);
            float shadowCore = smoothstep(r + penumbraWidth, r - penumbraWidth, perpDist0);
            atmosShadow0 = 1.0 - shadowCore * shadowStart;
        }

        vec2 D1 = light1Dir2D;
        float perpDist1 = abs(uv.x * D1.y - uv.y * D1.x);
        float alongRay1 = dot(uv, D1);
        if (alongRay1 < 0.0 && perpDist1 < r + penumbraWidth) {
            float behindPlanet1 = -alongRay1 / r;
            float shadowStart1 = smoothstep(0.0, 1.0, behindPlanet1);
            float shadowCore1 = smoothstep(r + penumbraWidth, r - penumbraWidth, perpDist1);
            atmosShadow1 = 1.0 - shadowCore1 * shadowStart1;
        }

        vec2 D2 = light2Dir2D;
        float perpDist2 = abs(uv.x * D2.y - uv.y * D2.x);
        float alongRay2 = dot(uv, D2);
        if (alongRay2 < 0.0 && perpDist2 < r + penumbraWidth) {
            float behindPlanet2 = -alongRay2 / r;
            float shadowStart2 = smoothstep(0.0, 1.0, behindPlanet2);
            float shadowCore2 = smoothstep(r + penumbraWidth, r - penumbraWidth, perpDist2);
            atmosShadow2 = 1.0 - shadowCore2 * shadowStart2;
        }

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

    vec3 beta = vec3(pScatterR, pScatterG, pScatterB);
    float densityFalloff = pAtmosPower;

    float opticalDepth = 0.0;

    if (d < atmosRadius) {
        float atmosZ = sqrt(max(0.0, atmosRadius * atmosRadius - d * d));

        if (d < planetRadius) {
            float planetZ2 = sqrt(max(0.0, planetRadius * planetRadius - d * d));
            float pathLength = atmosZ - planetZ2;

            float numSamples = 4.0;
            for (float i = 0.0; i < 4.0; i++) {
                float t2 = (i + 0.5) / numSamples;
                float sampleZ = planetZ2 + t2 * (atmosZ - planetZ2);
                float sampleR = sqrt(d * d + sampleZ * sampleZ);
                float sampleHeight01 = (sampleR - planetRadius) / atmosThickness;
                float sampleDensity = exp(-sampleHeight01 * densityFalloff) * (1.0 - sampleHeight01);
                opticalDepth += sampleDensity * (pathLength / numSamples);
            }
        } else {
            float pathLength = 2.0 * atmosZ;

            float numSamples = 6.0;
            for (float i = 0.0; i < 6.0; i++) {
                float t2 = (i + 0.5) / numSamples;
                float sampleZ = atmosZ * (1.0 - 2.0 * t2);
                float sampleR = sqrt(d * d + sampleZ * sampleZ);
                float sampleHeight01 = (sampleR - planetRadius) / atmosThickness;
                sampleHeight01 = clamp(sampleHeight01, 0.0, 1.0);
                float sampleDensity = exp(-sampleHeight01 * densityFalloff) * (1.0 - sampleHeight01);
                opticalDepth += sampleDensity * (pathLength / numSamples);
            }
        }
    }

    opticalDepth *= pScatterScale;

    float atmosDensity = 0.0;

    if (d < atmosRadius) {
        float normalizedDist = d / atmosRadius;
        atmosDensity = exp(-normalizedDist * normalizedDist * densityFalloff * 0.1) * (1.0 - normalizedDist);
        atmosDensity *= pAtmosThickness;
    }

    float quadEdgeFade = 1.0 - smoothstep(0.85, 1.4, scaledD);
    atmosDensity *= quadEdgeFade;
    atmosDensity *= mix(0.3, 1.0, shadowFactor);

    vec3 incomingLight = vec3(0.0);
    incomingLight += uLightColor0 * atten0 * uLight0Intensity * atmosShadow0;
    incomingLight += uLightColor1 * atten1 * uLight1Intensity * atmosShadow1;
    incomingLight += uLightColor2 * atten2 * uLight2Intensity * atmosShadow2;
    incomingLight += vec3(1.0) * mouseAtten * 0.3 * atmosShadowMouse;

    vec3 transmittance = exp(-beta * opticalDepth * pSunsetStrength);

    vec3 transmitColor = transmittance;
    float maxT = max(transmittance.r, max(transmittance.g, transmittance.b));
    if (maxT > 0.001) {
        transmitColor = transmittance / maxT;
    } else {
        transmitColor = vec3(1.0, 0.3, 0.1);
    }

    vec3 blueScatter = vec3(1.0) - exp(-beta * 8.0);

    float depthFactor = 1.0 - exp(-opticalDepth * 2.0 * pSunsetStrength);
    vec3 scatterColor = mix(blueScatter, transmitColor, depthFactor);

    vec3 scatteredLight = incomingLight * scatterColor;

    vec3 atmosColor = scatteredLight * atmosDensity * pAtmosIntensity * 1.5;

    float atmosAlpha = clamp(atmosDensity * 0.8, 0.0, 1.0);

    // ========================================
    // FINAL COLOR COMPOSITION
    // ========================================
    vec3 col = vec3(0.0);

    // Diffuse
    col += baseColor * totalDiffuse * 2.5 * planetMask;

    // Specular
    col += totalSpecular * 3.0 * planetMask;

    // SSS
    col += sss * planetMask;

    // Ambient
    vec3 lightEnvColor = (uLightColor0 * atten0 * uLight0Intensity + uLightColor1 * atten1 * uLight1Intensity + uLightColor2 * atten2 * uLight2Intensity) / max(totalAttenuation, 0.001);
    col += baseColor * lightEnvColor * uAmbientIntensity * 0.1 * planetMask;

    // Fresnel rim
    vec3 fresnelRim = fresnelSchlickRoughness(NdV, F0, roughness) * planetMask;
    float rimIntensity = mix(0.04, 0.15, 1.0 - roughness);
    vec3 rimEnvColor = mix(lightEnvColor, scatterColor, 0.3);
    col += rimEnvColor * fresnelRim * totalAttenuation * rimIntensity;

    // Atmosphere blend over terrain
    float limbFactor = pow(1.0 - NdV, 2.0);
    float terrainAtmosBlend = atmosAlpha * (0.3 + limbFactor * 0.7) * planetMask * shadowFactor;
    col = mix(col, atmosColor / max(atmosAlpha, 0.01), terrainAtmosBlend);

    // Fog
    vec2 screenUV = gl_FragCoord.xy / uFBORes;
    vec3 bgColor = texture2D(uBackgroundTexture, screenUV).rgb;
    float distToCamera = length(surfaceWorldPos - cameraPos);
    float fogAmount = 1.0 - exp(-distToCamera * uFogIntensity);
    vec3 fogColor = bgColor;
    col = mix(col, fogColor, fogAmount * planetMask);

    // Atmosphere glow outside planet
    vec3 foggedAtmosColor = mix(atmosColor, fogColor * atmosAlpha, clamp(fogAmount, 0.0, 1.0));
    col += foggedAtmosColor * (1.0 - planetMask);

    // Alpha
    float alpha = 0.0;
    alpha += planetMask * 1.0;
    alpha += atmosAlpha * (1.0 - planetMask * 0.5);
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= outerFade;

    gl_FragColor = vec4(col, alpha);
}
`;
