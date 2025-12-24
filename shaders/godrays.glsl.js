// God Rays / Volumetric Light Post-Process Shader
// SDF-based light halos with noise displacement at SDF edge
// Creates fake volumetric lighting by warping the light boundary

window.GODRAYS_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUV;

void main() {
    vUV = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

window.GODRAYS_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;

// Scene uniforms
uniform vec2 uResolution;
uniform float uTime;

// Light positions (screen space pixels)
uniform vec2 uLight0;
uniform vec2 uLight1;
uniform vec2 uLight2;

// Light colors
uniform vec3 uLightColor0;
uniform vec3 uLightColor1;
uniform vec3 uLightColor2;

// Camera rotation (for consistent world-space noise)
uniform float uCameraRotX;
uniform float uCameraRotY;

// ========================================
// SDF LIGHT CONTROLS
// ========================================
uniform float uLightFalloff;      // Falloff curve power (default 2.0, range 0.5-8.0)
uniform float uLightRadius;       // Base radius multiplier (default 0.3, range 0.1-1.0)
uniform float uLightIntensity;    // Overall light intensity (default 1.0)
uniform float uLightSaturation;   // Color saturation boost (default 1.5)

// ========================================
// 3D NOISE CONTROLS (SDF Edge Displacement)
// ========================================
uniform float uNoiseScale;        // Noise frequency (default 3.0, range 0.5-10.0)
uniform float uNoiseSpeed;        // Animation speed (default 0.02)
uniform float uNoiseStrength;     // SDF displacement amount (default 0.15, range 0-0.5)
uniform float uNoiseContrast;     // Noise contrast/sharpness (default 1.0)
uniform float uNoiseOctaves;      // Detail level 0-1 blends octaves (default 0.5)
uniform float uNoiseBrightness;   // Noise brightness offset (default 0.0, range -0.5 to 0.5)

// ========================================
// VOLUMETRIC CONTROLS
// ========================================
uniform float uVolumetricDensity; // Fog density around lights (default 1.0)
uniform float uVolumetricFalloff; // How fast volumetric fades (default 3.0)
uniform float uAmbientNoise;      // Global ambient noise intensity (default 0.05)

// ========================================
// 3D NOISE FUNCTIONS
// ========================================

float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// Smooth 3D value noise with quintic interpolation
float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    // Quintic interpolation for C2 continuity (smoother derivatives)
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    // 8 corners of the cube
    float a = hash31(i);
    float b = hash31(i + vec3(1.0, 0.0, 0.0));
    float c = hash31(i + vec3(0.0, 1.0, 0.0));
    float d = hash31(i + vec3(1.0, 1.0, 0.0));
    float e = hash31(i + vec3(0.0, 0.0, 1.0));
    float f1 = hash31(i + vec3(1.0, 0.0, 1.0));
    float g = hash31(i + vec3(0.0, 1.0, 1.0));
    float h = hash31(i + vec3(1.0, 1.0, 1.0));

    // Trilinear interpolation
    return mix(
        mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
        mix(mix(e, f1, u.x), mix(g, h, u.x), u.y),
        u.z
    );
}

// FBM with controllable octaves
float fbm3D(vec3 p, float octaveBlend) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float totalAmplitude = 0.0;

    // Base octave (always full)
    value += noise3D(p * frequency) * amplitude;
    totalAmplitude += amplitude;

    // Second octave (blend in)
    amplitude *= 0.5;
    frequency *= 2.0;
    value += noise3D(p * frequency) * amplitude * octaveBlend;
    totalAmplitude += amplitude * octaveBlend;

    // Third octave (blend in squared for finer detail)
    amplitude *= 0.5;
    frequency *= 2.0;
    float octave3 = octaveBlend * octaveBlend;
    value += noise3D(p * frequency) * amplitude * octave3;
    totalAmplitude += amplitude * octave3;

    return value / totalAmplitude;
}

// ========================================
// WORLD SPACE CONVERSION
// ========================================

// Convert screen UV + light position to world-space 3D point for noise sampling
// This creates noise that is anchored in world space around each light
vec3 getWorldNoisePosition(vec2 uv, vec2 lightUV, float lightIndex) {
    // Direction from light to current pixel (in UV space)
    vec2 delta = uv - lightUV;

    // Aspect correct
    delta.x *= uResolution.x / uResolution.y;

    // Distance from light center
    float dist = length(delta);

    // Angle around light (for radial noise pattern)
    float angle = atan(delta.y, delta.x);

    // Create a 3D position based on angle and distance (cylindrical coords)
    vec3 pos = vec3(
        cos(angle) * dist * 5.0,
        sin(angle) * dist * 5.0,
        dist * 2.0
    );

    // Apply camera rotation so noise stays fixed in world space
    // Rotate around Y (yaw)
    float cy = cos(uCameraRotY);
    float sy = sin(uCameraRotY);
    pos = vec3(pos.x * cy + pos.z * sy, pos.y, -pos.x * sy + pos.z * cy);

    // Rotate around X (pitch)
    float cx = cos(uCameraRotX);
    float sx = sin(uCameraRotX);
    pos = vec3(pos.x, pos.y * cx - pos.z * sx, pos.y * sx + pos.z * cx);

    // Add light index offset AFTER rotation (so each light has unique but consistent noise)
    pos.z += lightIndex * 50.0;

    return pos;
}

// Sample displacement noise for SDF edge warping
float sampleEdgeNoise(vec2 uv, vec2 lightUV, float lightIndex) {
    vec3 worldPos = getWorldNoisePosition(uv, lightUV, lightIndex);

    // Scale and animate
    vec3 noisePos = worldPos * uNoiseScale + vec3(0.0, 0.0, uTime * uNoiseSpeed);

    // Sample FBM
    float n = fbm3D(noisePos, uNoiseOctaves);

    // Apply contrast
    n = pow(n, uNoiseContrast);

    // Apply brightness offset and center around 0 for displacement
    n = n + uNoiseBrightness;

    // Return centered value (-0.5 to +0.5 range for displacement)
    return n - 0.5;
}

// ========================================
// SDF LIGHT FUNCTIONS
// ========================================

// Smooth circular SDF for light (returns distance)
float lightSDF(vec2 uv, vec2 lightPos) {
    vec2 lightUV = lightPos / uResolution;
    lightUV.y = 1.0 - lightUV.y; // Flip Y

    // Aspect-corrected distance
    vec2 delta = uv - lightUV;
    delta.x *= uResolution.x / uResolution.y;

    return length(delta);
}

// Get light UV (for noise sampling)
vec2 getLightUV(vec2 lightPos) {
    vec2 lightUV = lightPos / uResolution;
    lightUV.y = 1.0 - lightUV.y;
    return lightUV;
}

// Light falloff function with controls
float lightFalloff(float dist, float radius) {
    // Smooth falloff using inverse power
    float normalizedDist = dist / radius;
    float falloff = 1.0 / (1.0 + pow(normalizedDist, uLightFalloff));

    // Soft fade at very far distances (1.5 in UV space = covers most of screen)
    falloff *= smoothstep(1.5, 0.0, dist);

    return falloff;
}

// Saturate color
vec3 saturateColor(vec3 color, float amount) {
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    return clamp(mix(vec3(luma), color, amount), 0.0, 1.0);
}

// ========================================
// VOLUMETRIC LIGHT WITH SDF DISPLACEMENT
// ========================================

vec3 volumetricLight(vec2 uv, vec2 lightPos, vec3 lightColor, float lightIndex) {
    // Get light UV for calculations
    vec2 lightUV = getLightUV(lightPos);

    // Get base SDF distance
    float baseDist = lightSDF(uv, lightPos);

    // Early out only for very distant pixels (full screen coverage)
    if (baseDist > 2.0) return vec3(0.0);

    // Sample noise for SDF edge displacement
    // Noise strength increases toward the edge for organic boundary
    float edgeFactor = smoothstep(0.0, uLightRadius * 1.5, baseDist);
    float noise = sampleEdgeNoise(uv, lightUV, lightIndex);

    // Displace the SDF - noise warps the light boundary
    // More displacement at the edges, less at center (keeps core solid)
    float displacement = noise * uNoiseStrength * edgeFactor;
    float warpedDist = baseDist + displacement;

    // Clamp to prevent negative distances (which would cause artifacts)
    warpedDist = max(warpedDist, 0.001);

    // Apply falloff to the warped SDF
    float light = lightFalloff(warpedDist, uLightRadius);

    // Add subtle secondary glow layer (unaffected by noise for stable core)
    float coreGlow = lightFalloff(baseDist, uLightRadius * 0.3) * 0.3;
    light = max(light, coreGlow);

    // Apply density control
    light *= uVolumetricDensity;

    // Saturate and apply color
    vec3 saturatedColor = saturateColor(lightColor, uLightSaturation);

    return saturatedColor * light * uLightIntensity;
}

// ========================================
// AMBIENT VOLUMETRIC FOG
// ========================================

vec3 ambientFog(vec2 uv) {
    if (uAmbientNoise < 0.001) return vec3(0.0);

    // Sample noise in screen space with camera rotation for consistency
    vec2 centered = (uv - 0.5) * 2.0;
    centered.x *= uResolution.x / uResolution.y;

    vec3 noisePos = vec3(centered * uNoiseScale * 0.5, uTime * uNoiseSpeed * 0.5);

    // Apply camera rotation
    float cy = cos(uCameraRotY * 0.5);
    float sy = sin(uCameraRotY * 0.5);
    noisePos = vec3(noisePos.x * cy + noisePos.z * sy, noisePos.y, -noisePos.x * sy + noisePos.z * cy);

    float noise = fbm3D(noisePos, uNoiseOctaves);
    noise = pow(noise, uNoiseContrast);

    vec3 ambientColor = vec3(0.02, 0.03, 0.05);
    return ambientColor * noise * uAmbientNoise;
}

// ========================================
// MAIN
// ========================================

void main() {
    vec2 uv = vUV;

    // Debug: visualize light positions
    vec2 light0UV = uLight0 / uResolution;
    light0UV.y = 1.0 - light0UV.y;
    float d0 = length(uv - light0UV);

    vec2 light1UV = uLight1 / uResolution;
    light1UV.y = 1.0 - light1UV.y;
    float d1 = length(uv - light1UV);

    vec2 light2UV = uLight2 / uResolution;
    light2UV.y = 1.0 - light2UV.y;
    float d2 = length(uv - light2UV);

    // Simple radial glow for debugging
    vec3 color = vec3(0.0);
    color += uLightColor0 * 0.3 / (1.0 + d0 * 3.0);
    color += uLightColor1 * 0.3 / (1.0 + d1 * 3.0);
    color += uLightColor2 * 0.3 / (1.0 + d2 * 3.0);

    gl_FragColor = vec4(color, 1.0);
}
`;
