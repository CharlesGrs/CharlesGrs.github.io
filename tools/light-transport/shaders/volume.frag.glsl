#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform vec3 uSigmaA;        // Absorption coefficients
uniform float uRayleighDensity;
uniform float uMieDensity;
uniform float uParticleSize; // in nanometers
uniform float uAnisotropy;   // Henyey-Greenstein g
uniform int uEffects;        // bit flags: 1=absorption, 2=rayleigh, 4=mie
uniform int uViewMode;       // 0=transmitted, 1=scattered, 2=combined
uniform vec2 uResolution;
uniform float uCameraRotX;
uniform float uCameraRotY;
uniform float uCameraZoom;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uLightDir;      // Fixed light direction

#define PI 3.14159265359
#define SPHERE_RADIUS 1.0
#define MAX_STEPS 80
#define STEP_SIZE 0.025

// Wavelengths in nm
const vec3 WAVELENGTHS = vec3(700.0, 550.0, 450.0);

// ============ Scattering Physics ============

// Rayleigh coefficient: σ ∝ 1/λ^4
// Blue (450nm) scatters ~5.5x more than red (700nm)
vec3 rayleighCoefficients(float baseDensity) {
    vec3 lambda = WAVELENGTHS / 550.0;
    return baseDensity / (lambda * lambda * lambda * lambda);
}

// Mie coefficient based on size parameter x = 2πr/λ
vec3 mieCoefficients(float particleSizeNm, float baseDensity) {
    vec3 x = 2.0 * PI * (particleSizeNm / 2.0) / WAVELENGTHS;

    vec3 result;
    for (int i = 0; i < 3; i++) {
        float xi = x[i];
        if (xi < 0.1) {
            // Rayleigh regime (small particles)
            float lambda = WAVELENGTHS[i] / 550.0;
            result[i] = baseDensity / pow(lambda, 4.0);
        } else if (xi > 10.0) {
            // Geometric regime (large particles) - wavelength independent
            result[i] = baseDensity;
        } else {
            // Mie transition regime
            float t = (xi - 0.1) / 9.9;
            float lambda = WAVELENGTHS[i] / 550.0;
            float rayleigh = baseDensity / pow(lambda, 4.0);
            result[i] = mix(rayleigh, baseDensity, t);
        }
    }
    return result;
}

// Rayleigh phase function - symmetric forward/backward
float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
}

// Henyey-Greenstein phase function - forward-peaked for Mie
float hgPhase(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return (1.0 - g2) / (4.0 * PI * pow(denom, 1.5));
}

// Beer-Lambert transmittance
vec3 transmittance(vec3 sigma, float depth) {
    return exp(-sigma * depth);
}

// ============ Ray-Sphere Intersection ============
vec2 raySphere(vec3 ro, vec3 rd, float radius) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - radius * radius;
    float h = b * b - c;
    if (h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
}

// ============ Volumetric Ray March ============
void rayMarchSphere(vec3 ro, vec3 rd, vec3 lightDir, out vec3 transmitted, out vec3 scattered) {
    vec2 hit = raySphere(ro, rd, SPHERE_RADIUS);

    transmitted = vec3(0.0);
    scattered = vec3(0.0);

    if (hit.x < 0.0) {
        transmitted = vec3(1.0);
        return;
    }

    float tNear = max(hit.x, 0.0);
    float tFar = hit.y;
    float pathLength = tFar - tNear;

    // Build coefficients from enabled effects
    vec3 sigmaA = vec3(0.0);
    vec3 sigmaS = vec3(0.0);

    bool hasAbsorption = (uEffects & 1) != 0;
    bool hasRayleigh = (uEffects & 2) != 0;
    bool hasMie = (uEffects & 4) != 0;

    // Scale factor to make effects visible in unit sphere
    float scaleAbsorption = 2.0;
    float scaleScattering = 4.0;

    if (hasAbsorption) {
        sigmaA = uSigmaA * scaleAbsorption;
    }

    if (hasRayleigh) {
        // Rayleigh with strong wavelength dependence
        sigmaS += rayleighCoefficients(uRayleighDensity * scaleScattering);
    }

    if (hasMie) {
        // Mie - mostly wavelength independent for large particles
        sigmaS += mieCoefficients(uParticleSize, uMieDensity * scaleScattering);
    }

    vec3 sigmaT = sigmaA + sigmaS;

    // If no effects enabled, show empty sphere with faint outline
    if (!hasAbsorption && !hasRayleigh && !hasMie) {
        transmitted = vec3(0.98);
        scattered = vec3(0.02) * (1.0 - smoothstep(0.0, 0.1, abs(pathLength - 0.1)));
        return;
    }

    // Ray march through sphere
    vec3 accumulated = vec3(0.0);
    vec3 T = vec3(1.0);

    float t = tNear;
    float cosTheta = dot(rd, -lightDir);

    for (int i = 0; i < MAX_STEPS; i++) {
        if (t > tFar) break;

        vec3 p = ro + rd * t;
        float distFromCenter = length(p);

        // Uniform density throughout sphere (more physically accurate for demonstration)
        float localDensity = smoothstep(SPHERE_RADIUS, SPHERE_RADIUS * 0.3, distFromCenter);

        // Local coefficients
        vec3 localSigmaS = sigmaS * localDensity;
        vec3 localSigmaT = sigmaT * localDensity;

        // Shadow ray - how much light reaches this point
        vec2 lightHit = raySphere(p, -lightDir, SPHERE_RADIUS);
        float lightDist = max(lightHit.y, 0.0);
        vec3 lightT = transmittance(localSigmaT, lightDist);

        // Phase function
        float phase = 0.25 / PI;
        if (hasRayleigh && !hasMie) {
            phase = rayleighPhase(cosTheta);
        } else if (hasMie) {
            phase = hgPhase(cosTheta, uAnisotropy);
        } else if (hasAbsorption && !hasRayleigh && !hasMie) {
            // Pure absorption - no scattering, just show transmitted color
            phase = 0.0;
        }

        // In-scattering contribution
        vec3 inscatter = T * localSigmaS * phase * lightT;
        accumulated += inscatter * STEP_SIZE;

        // Update transmittance along view ray
        T *= transmittance(localSigmaT, STEP_SIZE);

        t += STEP_SIZE;

        if (max(max(T.r, T.g), T.b) < 0.001) break;
    }

    // Background light transmitted through sphere
    transmitted = T;

    // Use uniform light color and intensity
    vec3 lightColor = uLightColor * uLightIntensity;
    scattered = accumulated * lightColor;
}

// Render the light source (sun/lamp indicator)
vec3 renderLightSource(vec3 rd, vec3 lightDir, vec3 lightColor) {
    float sunDot = dot(rd, -lightDir);

    // Sun disc
    float sunDisc = smoothstep(0.985, 0.995, sunDot);

    // Sun glow/corona
    float sunGlow = pow(max(0.0, sunDot), 8.0) * 0.6;
    float sunHalo = pow(max(0.0, sunDot), 32.0) * 0.8;

    return lightColor * (sunDisc * 2.0 + sunGlow + sunHalo);
}

void main() {
    vec2 uv = (vUV - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    // Camera setup
    float cx = cos(uCameraRotX), sx = sin(uCameraRotX);
    float cy = cos(uCameraRotY), sy = sin(uCameraRotY);

    mat3 rotX = mat3(1, 0, 0, 0, cx, -sx, 0, sx, cx);
    mat3 rotY = mat3(cy, 0, sy, 0, 1, 0, -sy, 0, cy);
    mat3 camRot = rotY * rotX;

    vec3 ro = camRot * vec3(0.0, 0.0, uCameraZoom);
    vec3 rd = normalize(camRot * vec3(uv, -1.5));

    // Use fixed light direction from uniform
    vec3 lightDir = uLightDir;

    // Check if ray hits sphere
    vec2 sphereHit = raySphere(ro, rd, SPHERE_RADIUS);

    vec3 col;

    if (sphereHit.x > 0.0) {
        // Ray hits sphere - render volumetric
        vec3 transmitted, scattered;
        rayMarchSphere(ro, rd, lightDir, transmitted, scattered);

        // Background light transmitted through sphere
        vec3 background = vec3(1.0); // White light behind sphere
        vec3 transmittedColor = background * transmitted * 0.3;

        // View mode selection
        if (uViewMode == 0) {
            // Transmitted only
            col = transmittedColor;
        } else if (uViewMode == 1) {
            // Scattered only
            col = scattered;
        } else {
            // Combined (default)
            col = scattered + transmittedColor;
        }

        // Sphere outline for visibility
        vec3 hitPoint = ro + rd * sphereHit.x;
        vec3 normal = normalize(hitPoint);
        float rim = pow(1.0 - abs(dot(rd, normal)), 4.0);
        col += vec3(0.15, 0.2, 0.25) * rim * 0.4;
    } else {
        // Background with light source
        col = mix(vec3(0.03, 0.04, 0.06), vec3(0.06, 0.08, 0.12), vUV.y);

        // Render the visible light source
        col += renderLightSource(rd, lightDir, uLightColor);
    }

    // Tone mapping
    col = col / (1.0 + col);
    col = pow(col, vec3(0.85));

    // Subtle vignette
    float vignette = 1.0 - length(vUV - 0.5) * 0.35;
    col *= vignette;

    fragColor = vec4(col, 1.0);
}
