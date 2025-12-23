// God Rays / Volumetric Light Post-Process Shader
// Lightweight fullscreen pass for atmospheric fog and light glow
// The GLSL code is inside the template literal strings below

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
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uLight0;
uniform vec2 uLight1;
uniform vec2 uLight2;
uniform vec3 uLightColor0;
uniform vec3 uLightColor1;
uniform vec3 uLightColor2;
uniform float uZoom;
uniform vec2 uZoomCenter;
uniform float uCameraRotX;  // Camera pitch
uniform float uCameraRotY;  // Camera yaw

// Controllable parameters
uniform float uRayIntensity;      // Ray intensity multiplier (default 0.5)
uniform float uRayFalloff;        // Ray falloff exponent (default 4.0)
uniform float uGlowIntensity;     // Glow intensity multiplier (default 0.5)
uniform float uGlowSize;          // Glow size/falloff (default 4.0)
uniform float uFogDensity;        // Fog noise density (default 6.0)
uniform float uAmbientFog;        // Ambient fog intensity (default 0.08)
uniform float uAnimSpeed;         // Animation speed multiplier (default 1.0)
uniform float uNoiseScale;        // Noise frequency scale (default 1.0)
uniform float uNoiseOctaves;      // Noise detail/octaves blend (default 1.0)
uniform float uNoiseContrast;     // Noise contrast/sharpness (default 1.0)

// ========================================
// 3D NOISE FOR CAMERA ROTATION
// ========================================

float hash3D(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(
            mix(hash3D(i), hash3D(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash3D(i + vec3(0.0, 1.0, 0.0)), hash3D(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
        ),
        mix(
            mix(hash3D(i + vec3(0.0, 0.0, 1.0)), hash3D(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash3D(i + vec3(0.0, 1.0, 1.0)), hash3D(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
        ),
        f.z
    );
}

// Convert screen position to a point on a distant sphere, rotated by camera
vec3 screenToSphere(vec2 screenPos) {
    // Treat screen as a view into a sphere - convert to spherical coords
    // screenPos is in -1 to 1 range
    float fov = 1.0; // Field of view factor

    // Create ray direction from screen position
    vec3 rayDir = normalize(vec3(screenPos.x * fov, screenPos.y * fov, 1.0));

    // Apply camera rotation (inverse - we rotate the ray)
    float cosRotX = cos(-uCameraRotX);
    float sinRotX = sin(-uCameraRotX);
    float cosRotY = cos(-uCameraRotY);
    float sinRotY = sin(-uCameraRotY);

    // Rotate around X axis (pitch)
    float ry = rayDir.y * cosRotX - rayDir.z * sinRotX;
    float rz = rayDir.y * sinRotX + rayDir.z * cosRotX;
    rayDir.y = ry;
    rayDir.z = rz;

    // Rotate around Y axis (yaw)
    float rx = rayDir.x * cosRotY + rayDir.z * sinRotY;
    rz = -rayDir.x * sinRotY + rayDir.z * cosRotY;
    rayDir.x = rx;
    rayDir.z = rz;

    // The ray direction IS the point on the unit sphere
    return rayDir;
}

// Controllable FBM with 3D noise on distant sphere
float fbm3D(vec2 screenPos) {
    // Sample noise on a distant sphere rotated by camera
    vec3 p = screenToSphere(screenPos) * uNoiseScale;

    // Base octave
    float n = noise3D(p) * 0.5;

    // Additional octaves (controlled by uNoiseOctaves)
    n += noise3D(p * 2.0) * 0.25 * uNoiseOctaves;
    n += noise3D(p * 4.0) * 0.125 * uNoiseOctaves * uNoiseOctaves;

    // Apply contrast (power function)
    n = pow(n, uNoiseContrast);

    return n;
}

// Legacy 2D noise for compatibility
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

// Controllable FBM with noise parameters (2D version for backward compat)
float fbm(vec2 p) {
    // Apply noise scale
    p *= uNoiseScale;

    // Base octave
    float n = noise(p) * 0.5;

    // Additional octaves (controlled by uNoiseOctaves)
    n += noise(p * 2.0) * 0.25 * uNoiseOctaves;
    n += noise(p * 4.0) * 0.125 * uNoiseOctaves * uNoiseOctaves;

    // Apply contrast (power function)
    n = pow(n, uNoiseContrast);

    return n;
}

// ========================================
// RADIAL LIGHT RAYS (6 samples)
// ========================================

// Saturate color - boost saturation significantly
vec3 saturateColor(vec3 color, float amount) {
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 saturated = mix(vec3(luma), color, 1.0 + amount);
    // Clamp to valid range to prevent negative/overflow artifacts
    return clamp(saturated, 0.0, 1.0);
}

vec3 lightRays(vec2 uv, vec2 lightPos, vec3 lightColor, float intensity) {
    vec2 lightUV = lightPos / uResolution;
    lightUV.y = 1.0 - lightUV.y;

    vec2 delta = lightUV - uv;
    float dist = length(delta);

    if (dist > 0.6) return vec3(0.0);

    // Saturate the light color heavily
    vec3 saturatedColor = saturateColor(lightColor, 2.0);

    // 6 samples toward light
    vec3 accum = vec3(0.0);
    vec2 step = delta / 6.0;
    vec2 pos = uv;

    for (int i = 0; i < 6; i++) {
        float d = length(lightUV - pos);
        float falloff = exp(-d * uRayFalloff);

        // Sample noise on distant sphere - matches camera rotation
        // Apply uNoiseScale to control noise frequency
        vec2 noisePos = (pos - 0.5) * 2.0 * uFogDensity;
        vec3 spherePos = screenToSphere(noisePos) * max(uNoiseScale, 0.01);
        float fog = noise3D(spherePos + vec3(0.0, 0.0, uTime * 0.02 * uAnimSpeed)) * 0.5
                  + noise3D(spherePos * 2.0) * 0.25 * uNoiseOctaves;
        fog = clamp(fog, 0.0, 1.0);
        fog = pow(fog + 0.001, max(uNoiseContrast, 0.1));
        accum += saturatedColor * falloff * fog * intensity * uRayIntensity;

        pos += step;
    }

    return accum * 0.12;
}

// ========================================
// SOFT GLOW
// ========================================

vec3 glow(vec2 uv, vec2 lightPos, vec3 lightColor, float intensity) {
    vec2 lightUV = lightPos / uResolution;
    lightUV.y = 1.0 - lightUV.y;

    float dist = length(uv - lightUV);

    // Saturate the light color heavily
    vec3 saturatedColor = saturateColor(lightColor, 2.0);

    // Two-layer glow with controllable size
    float g = exp(-dist * uGlowSize) * 0.6 + exp(-dist * uGlowSize * 3.0) * 0.4;
    g *= intensity * uGlowIntensity;

    // Sample noise on distant sphere - matches camera rotation
    // Apply uNoiseScale to control noise frequency
    vec2 noisePos = (uv - 0.5) * 2.0 * 4.0 + lightUV * 2.0;
    vec3 spherePos = screenToSphere(noisePos) * max(uNoiseScale, 0.01);
    float noiseVar = noise3D(spherePos + vec3(0.0, 0.0, uTime * 0.01 * uAnimSpeed)) * 0.5
                   + noise3D(spherePos * 2.0) * 0.25;
    noiseVar = clamp(noiseVar, 0.0, 1.0);
    g *= 0.7 + noiseVar * 0.5;

    // Fade with distance
    g *= smoothstep(0.6, 0.0, dist);

    return saturatedColor * g;
}

// ========================================
// PERSPECTIVE CAMERA HELPERS
// ========================================

// Transform world position to screen position
// Uses simple zoom-as-scale approach (camera rotation not supported in post-process)
vec2 worldToScreen(vec2 worldPos) {
    vec2 screenCenter = uResolution * 0.5;
    vec2 offsetFromCenter = worldPos - screenCenter;
    // Zoom is a simple scale factor
    vec2 scaledOffset = offsetFromCenter * uZoom;
    return screenCenter + scaledOffset;
}

// Transform screen UV to world UV (inverse zoom for sampling)
vec2 screenToWorldUV(vec2 screenUV) {
    // Screen center in UV space
    vec2 centerUV = vec2(0.5);
    vec2 offsetFromCenter = screenUV - centerUV;
    // Inverse zoom
    vec2 worldOffset = offsetFromCenter / uZoom;
    return centerUV + worldOffset;
}

// ========================================
// MAIN
// ========================================

void main() {
    // Screen-space UV (0-1)
    vec2 screenUV = vUV;

    // Transform light positions from world space to screen space with perspective
    vec2 light0Screen = worldToScreen(uLight0);
    vec2 light1Screen = worldToScreen(uLight1);
    vec2 light2Screen = worldToScreen(uLight2);

    vec3 fog = vec3(0.0);

    // Light rays from each source (using screen-space positions)
    fog += lightRays(screenUV, light0Screen, uLightColor0, 0.5);
    fog += lightRays(screenUV, light1Screen, uLightColor1, 0.5);
    fog += lightRays(screenUV, light2Screen, uLightColor2, 0.5);

    // Soft glow halos (using screen-space positions)
    fog += glow(screenUV, light0Screen, uLightColor0, 0.5);
    fog += glow(screenUV, light1Screen, uLightColor1, 0.5);
    fog += glow(screenUV, light2Screen, uLightColor2, 0.5);

    // Subtle ambient fog - sample noise on distant sphere
    // Apply uNoiseScale to control noise frequency
    vec2 worldUV = screenToWorldUV(screenUV);
    vec2 ambientNoisePos = (worldUV - 0.5) * 2.0 * 3.0;
    vec3 ambientSpherePos = screenToSphere(ambientNoisePos) * max(uNoiseScale, 0.01);
    float ambient = noise3D(ambientSpherePos + vec3(0.0, 0.0, uTime * 0.005 * uAnimSpeed)) * 0.5
                  + noise3D(ambientSpherePos * 2.0) * 0.25;
    ambient = clamp(ambient, 0.0, 1.0);
    ambient = pow(ambient + 0.001, max(uNoiseContrast, 0.1)) * uAmbientFog;
    fog += vec3(0.03, 0.04, 0.05) * ambient;

    // Soft tone mapping
    fog = fog / (fog + vec3(0.8));

    // Soft alpha - gradual falloff based on intensity
    float intensity = (fog.r + fog.g + fog.b) / 3.0;
    float alpha = smoothstep(0.0, 0.3, intensity) * 0.6;
    alpha = pow(alpha, 0.7); // Soften the blend curve

    gl_FragColor = vec4(fog, alpha);
}
`;
