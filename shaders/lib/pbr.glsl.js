// ============================================
// SHARED PBR LIBRARY
// Physically Based Rendering functions
// Include with: ${window.GLSL_PBR}
// ============================================

window.GLSL_PBR = `
#ifndef PI
#define PI 3.14159265359
#endif

// ============================================
// FRESNEL
// ============================================

// Schlick's approximation
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// With roughness for IBL
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ============================================
// NORMAL DISTRIBUTION FUNCTIONS
// ============================================

// GGX/Trowbridge-Reitz
float distributionGGX(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH2 = NdotH * NdotH;
    float denom = NdotH2 * (a2 - 1.0) + 1.0;
    return a2 / (PI * denom * denom);
}

// Blinn-Phong
float distributionBlinnPhong(float NdotH, float roughness) {
    float shininess = 2.0 / (roughness * roughness) - 2.0;
    return (shininess + 2.0) / (2.0 * PI) * pow(NdotH, shininess);
}

// ============================================
// GEOMETRY / VISIBILITY FUNCTIONS
// ============================================

// Schlick-GGX
float geometrySchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

// Smith's method combining view and light directions
float geometrySmith(float NdotV, float NdotL, float roughness) {
    float ggx1 = geometrySchlickGGX(NdotV, roughness);
    float ggx2 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

// ============================================
// COOK-TORRANCE BRDF
// ============================================

// Returns (specular contribution, average fresnel)
vec4 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, float roughness, vec3 F0) {
    vec3 H = normalize(V + L);
    float NdotV = max(dot(N, V), 0.001);
    float NdotL = max(dot(N, L), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float HdotV = max(dot(H, V), 0.0);

    float D = distributionGGX(NdotH, roughness);
    float G = geometrySmith(NdotV, NdotL, roughness);
    vec3 F = fresnelSchlick(HdotV, F0);

    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = numerator / denominator;

    float avgF = (F.r + F.g + F.b) / 3.0;
    return vec4(specular * NdotL, avgF);
}

// Full PBR with diffuse + specular
vec3 pbrDirect(vec3 N, vec3 V, vec3 L, vec3 albedo, float roughness, float metallic, vec3 lightColor) {
    vec3 F0 = mix(vec3(0.04), albedo, metallic);

    vec3 H = normalize(V + L);
    float NdotV = max(dot(N, V), 0.001);
    float NdotL = max(dot(N, L), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float HdotV = max(dot(H, V), 0.0);

    float D = distributionGGX(NdotH, roughness);
    float G = geometrySmith(NdotV, NdotL, roughness);
    vec3 F = fresnelSchlick(HdotV, F0);

    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = numerator / denominator;

    vec3 kS = F;
    vec3 kD = (1.0 - kS) * (1.0 - metallic);
    vec3 diffuse = kD * albedo / PI;

    return (diffuse + specular) * lightColor * NdotL;
}

// ============================================
// SUBSURFACE SCATTERING (Approximation)
// ============================================

// Simple wrap lighting for SSS effect
vec3 subsurfaceScattering(vec3 N, vec3 L, vec3 sssColor, float wrap) {
    float NdotL = dot(N, L);
    float diffuseWrap = max(0.0, (NdotL + wrap) / (1.0 + wrap));
    float scatter = smoothstep(0.0, 1.0, diffuseWrap);
    return sssColor * scatter;
}

// Back-lit SSS
vec3 subsurfaceBacklit(vec3 N, vec3 V, vec3 L, vec3 sssColor, float distortion, float power) {
    vec3 H = normalize(L + N * distortion);
    float VdotH = pow(clamp(dot(V, -H), 0.0, 1.0), power);
    return sssColor * VdotH;
}

// ============================================
// COLOR SPACE CONVERSIONS
// ============================================

vec3 sRGBToLinear(vec3 color) {
    return pow(color, vec3(2.2));
}

vec3 linearToSRGB(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
}

// ============================================
// TONE MAPPING
// ============================================

// Reinhard
vec3 tonemapReinhard(vec3 color) {
    return color / (1.0 + color);
}

// Reinhard extended
vec3 tonemapReinhardExtended(vec3 color, float whitePoint) {
    vec3 numerator = color * (1.0 + color / (whitePoint * whitePoint));
    return numerator / (1.0 + color);
}

// ACES filmic
vec3 tonemapACES(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Uncharted 2 filmic
vec3 uncharted2Tonemap(vec3 x) {
    float A = 0.15;
    float B = 0.50;
    float C = 0.10;
    float D = 0.20;
    float E = 0.02;
    float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 tonemapUncharted2(vec3 color, float exposure) {
    float W = 11.2;
    color *= exposure;
    vec3 curr = uncharted2Tonemap(color);
    vec3 whiteScale = 1.0 / uncharted2Tonemap(vec3(W));
    return curr * whiteScale;
}
`;
