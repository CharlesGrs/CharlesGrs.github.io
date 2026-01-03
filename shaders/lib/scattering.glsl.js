// ============================================
// SHARED SCATTERING LIBRARY
// Light transport and atmospheric scattering functions
// Include with: ${window.GLSL_SCATTERING}
// ============================================

window.GLSL_SCATTERING = `
#ifndef PI
#define PI 3.14159265359
#endif

// ============================================
// BEER-LAMBERT LAW
// ============================================

// Basic absorption/transmittance
vec3 beerLambert(vec3 sigma, float depth) {
    return exp(-sigma * depth);
}

float beerLambert(float sigma, float depth) {
    return exp(-sigma * depth);
}

// ============================================
// RAYLEIGH SCATTERING
// For particles much smaller than wavelength (air molecules)
// ============================================

// Rayleigh scattering coefficient (1/lambda^4 relationship)
float rayleighCoeff(float wavelengthNm, float baseCoeff) {
    float lambda = wavelengthNm / 550.0; // Normalize to green
    return baseCoeff / pow(lambda, 4.0);
}

// RGB Rayleigh coefficients
vec3 rayleighCoeffRGB(float baseCoeff) {
    return vec3(
        rayleighCoeff(700.0, baseCoeff),  // Red
        rayleighCoeff(550.0, baseCoeff),  // Green
        rayleighCoeff(450.0, baseCoeff)   // Blue
    );
}

// Rayleigh phase function
float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
}

// ============================================
// MIE SCATTERING
// For particles similar in size to wavelength (dust, water droplets)
// ============================================

// Mie coefficient interpolation (Rayleigh → uniform based on particle size)
float mieCoeff(float particleSizeUm, float wavelengthNm, float baseCoeff) {
    float x = 2.0 * PI * particleSizeUm / (wavelengthNm / 1000.0);
    if (x < 0.1) return rayleighCoeff(wavelengthNm, baseCoeff);
    if (x > 10.0) return baseCoeff;
    float t = (x - 0.1) / 9.9;
    return mix(rayleighCoeff(wavelengthNm, baseCoeff), baseCoeff, t);
}

// Henyey-Greenstein phase function
// g > 0: forward scattering (typical for fog: 0.7-0.9)
// g < 0: back scattering
// g = 0: isotropic
float henyeyGreenstein(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return (1.0 - g2) / (4.0 * PI * pow(denom, 1.5));
}

// Cornette-Shanks (improved HG for Mie)
float cornetteShanks(float cosTheta, float g) {
    float g2 = g * g;
    float num = 3.0 * (1.0 - g2) * (1.0 + cosTheta * cosTheta);
    float denom = 2.0 * (2.0 + g2) * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
    return num / (4.0 * PI * denom);
}

// ============================================
// COMBINED TRANSPORT
// ============================================

// Extinction = absorption + scattering
vec3 extinction(vec3 sigmaA, vec3 sigmaS) {
    return sigmaA + sigmaS;
}

// Single scattering albedo (ratio of scattering to extinction)
// 0 = pure absorption, 1 = pure scattering
vec3 scatteringAlbedo(vec3 sigmaA, vec3 sigmaS) {
    vec3 sigmaT = sigmaA + sigmaS;
    return sigmaS / max(sigmaT, vec3(0.0001));
}

// ============================================
// ATMOSPHERIC SKY
// ============================================

// Simple sky gradient with Rayleigh
vec3 atmosphericSky(vec3 rd, vec3 sunDir, float density) {
    // View ray angle above horizon
    float y = max(0.0, rd.y);
    float horizon = 1.0 - y;

    // Optical depth increases at horizon
    float opticalDepth = density / (y + 0.1);

    // Rayleigh coefficients
    vec3 rayleigh = rayleighCoeffRGB(1.0);

    // Transmittance through atmosphere
    vec3 T = beerLambert(rayleigh * opticalDepth, 1.0);

    // Base sky colors
    vec3 zenith = vec3(0.1, 0.3, 0.8);
    vec3 horizonColor = vec3(0.6, 0.7, 0.9);

    // Sun contribution
    float sunDot = max(0.0, dot(rd, sunDir));
    float sunInfluence = pow(sunDot, 4.0);
    vec3 sunScatter = vec3(1.0, 0.6, 0.3) * sunInfluence;

    vec3 sky = mix(zenith, horizonColor, pow(horizon, 0.5));
    sky = sky * T + sunScatter * 0.4;

    return sky;
}

// ============================================
// VOLUMETRIC INTEGRATION HELPERS
// ============================================

// In-scattering from a single ray march step
vec3 inscatter(vec3 T, vec3 sigma, float phase, vec3 lightColor, float stepSize) {
    return T * sigma * phase * lightColor * stepSize;
}

// Simple volumetric fog
vec3 applyFog(vec3 color, vec3 fogColor, float depth, float density) {
    float fog = 1.0 - exp(-depth * density);
    return mix(color, fogColor, fog);
}

// Distance-based fog with height falloff
vec3 applyHeightFog(vec3 color, vec3 fogColor, vec3 ro, vec3 rd, float t, float density, float heightFalloff) {
    float a = density;
    float b = heightFalloff;

    // Analytical integration of exponential height fog
    float fogAmount = a / b * exp(-ro.y * b) * (1.0 - exp(-t * rd.y * b)) / rd.y;
    fogAmount = clamp(fogAmount, 0.0, 1.0);

    return mix(color, fogColor, fogAmount);
}
`;
