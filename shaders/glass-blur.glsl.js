/**
 * Glass Blur Shaders - Apple LiquidGlass-inspired frosted glass effect
 * WebGL 1 compatible version
 *
 * Features:
 * - Squircle SDF (superellipse) for Apple-style smooth corners
 * - Physically-based lens curvature refraction: 1 - sqrt(1 - x²)
 * - World-space specular highlights from globalLights
 * - Chromatic aberration at edges
 * - Separable Gaussian blur at reduced resolution
 */

// ============================================================================
// BLUR SHADERS - Optimized separable Gaussian blur (WebGL 1)
// ============================================================================

// Shared vertex shader for fullscreen quad
window.GLASS_BLUR_VERTEX_SHADER = `
precision highp float;

attribute vec2 aPosition;
varying vec2 vUV;

void main() {
    vUV = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Horizontal blur pass - optimized 9-tap Gaussian kernel with linear sampling
window.GLASS_BLUR_H_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uBlurRadius;

varying vec2 vUV;

void main() {
    // Optimized Gaussian weights using linear sampling
    // This samples between texels to get 2 samples in 1 fetch
    float weights[3];
    weights[0] = 0.227027027;  // center
    weights[1] = 0.316216216;  // combined 1+2
    weights[2] = 0.070270270;  // combined 3+4

    float offsets[3];
    offsets[0] = 0.0;
    offsets[1] = 1.384615385;  // optimized offset
    offsets[2] = 3.230769231;

    vec2 texOffset = uTexelSize * uBlurRadius;

    vec4 result = texture2D(uSource, vUV) * weights[0];

    for (int i = 1; i < 3; i++) {
        vec2 offset = vec2(offsets[i] * texOffset.x, 0.0);
        result += texture2D(uSource, vUV + offset) * weights[i];
        result += texture2D(uSource, vUV - offset) * weights[i];
    }

    gl_FragColor = result;
}
`;

// Vertical blur pass - optimized 9-tap Gaussian kernel
window.GLASS_BLUR_V_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uBlurRadius;

varying vec2 vUV;

void main() {
    float weights[3];
    weights[0] = 0.227027027;
    weights[1] = 0.316216216;
    weights[2] = 0.070270270;

    float offsets[3];
    offsets[0] = 0.0;
    offsets[1] = 1.384615385;
    offsets[2] = 3.230769231;

    vec2 texOffset = uTexelSize * uBlurRadius;

    vec4 result = texture2D(uSource, vUV) * weights[0];

    for (int i = 1; i < 3; i++) {
        vec2 offset = vec2(0.0, offsets[i] * texOffset.y);
        result += texture2D(uSource, vUV + offset) * weights[i];
        result += texture2D(uSource, vUV - offset) * weights[i];
    }

    gl_FragColor = result;
}
`;

// Kawase blur - ultra-fast blur for additional smoothing passes
window.GLASS_KAWASE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uOffset;

varying vec2 vUV;

void main() {
    vec2 off = uTexelSize * uOffset;

    vec4 sum = texture2D(uSource, vUV);
    sum += texture2D(uSource, vUV + vec2(-off.x, -off.y));
    sum += texture2D(uSource, vUV + vec2( off.x, -off.y));
    sum += texture2D(uSource, vUV + vec2(-off.x,  off.y));
    sum += texture2D(uSource, vUV + vec2( off.x,  off.y));

    gl_FragColor = sum * 0.2;
}
`;

// ============================================================================
// GLASS PANEL SHADER - SDF-based refraction with rounded rectangle
// ============================================================================

window.GLASS_PANEL_VERTEX_SHADER = `
precision highp float;

attribute vec2 aPosition;

uniform vec4 uPanelRect;  // x, y, width, height in clip space (-1 to 1)
uniform vec2 uResolution;

varying vec2 vUV;
varying vec2 vLocalUV;
varying vec2 vScreenUV;

void main() {
    // Local UV within panel (0-1)
    vLocalUV = aPosition * 0.5 + 0.5;

    // Transform to panel position in clip space
    vec2 clipPos = uPanelRect.xy + vLocalUV * uPanelRect.zw;

    // Screen UV for sampling blur texture (0-1 range)
    vScreenUV = clipPos * 0.5 + 0.5;

    vUV = vLocalUV;

    gl_Position = vec4(clipPos, 0.0, 1.0);
}
`;

window.GLASS_PANEL_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uBlurredScene;
uniform vec2 uResolution;
uniform vec2 uPanelSize;       // Panel size in pixels

// Glass material properties
uniform float uCornerRadius;
uniform float uEdgeSoftness;
uniform float uRefractStrength;
uniform float uSquircleN;      // Squircle exponent (4.0 = Apple-style, 2.0 = ellipse)
uniform float uGlassOpacity;
uniform vec3 uGlassTint;
uniform float uChromaticAberration;

// Specular highlight properties
uniform float uSpecularIntensity;
uniform float uSpecularSharpness;
uniform float uFresnelPower;

// Edge control properties
uniform float uEdgeWidth;          // How far effects extend from edge (multiplier of corner radius)
uniform float uBevelDepth;         // How pronounced the 3D bevel effect is (0-1)

// Caustics properties
uniform float uCausticsIntensity;  // Brightness of caustic effect (0-2)
uniform float uCausticsScale;      // Size of caustic pattern (0.5-3)

// World-space lights
uniform vec3 uLight0WorldPos;  // World position (x, y, z)
uniform vec3 uLight0Color;
uniform float uLight0Intensity;
uniform vec3 uLight1WorldPos;
uniform vec3 uLight1Color;
uniform float uLight1Intensity;
uniform vec3 uLight2WorldPos;
uniform vec3 uLight2Color;
uniform float uLight2Intensity;

// Camera and panel position
uniform vec3 uCameraPos;       // Camera world position
uniform vec3 uPanelWorldPos;   // Panel center world position (for accurate light directions)
uniform float uAspectRatio;    // Width / Height for correct light directions

// Tone mapping (must match post-process)
uniform float uExposure;
uniform int uToneMapping;

varying vec2 vUV;
varying vec2 vLocalUV;
varying vec2 vScreenUV;

// ACES Filmic Tone Mapping (same as post-process.glsl.js)
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Reinhard Tone Mapping
vec3 Reinhard(vec3 x) {
    return x / (1.0 + x);
}

// Uncharted 2 / Filmic Tone Mapping
vec3 Uncharted2Tonemap(vec3 x) {
    float A = 0.15;
    float B = 0.50;
    float C = 0.10;
    float D = 0.20;
    float E = 0.02;
    float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 FilmicToneMapping(vec3 color) {
    vec3 curr = Uncharted2Tonemap(color * 2.0);
    vec3 whiteScale = vec3(1.0) / Uncharted2Tonemap(vec3(11.2));
    return curr * whiteScale;
}

vec3 applyToneMapping(vec3 color) {
    color *= uExposure;
    if (uToneMapping == 1) {
        color = ACESFilm(color);
    } else if (uToneMapping == 2) {
        color = Reinhard(color);
    } else if (uToneMapping == 3) {
        color = FilmicToneMapping(color);
    }
    return color;
}

// ============================================================================
// SQUIRCLE SDF - Superellipse for Apple-style smooth corners
// Formula: |x/a|^n + |y/b|^n = 1
// n=2: ellipse, n=4: squircle (Apple style), n→∞: rectangle
// ============================================================================
float sdSquircle(vec2 p, vec2 size, float n) {
    vec2 d = abs(p) / size;
    float dist = pow(pow(d.x, n) + pow(d.y, n), 1.0 / n);
    return (dist - 1.0) * min(size.x, size.y);
}

// Squircle with corner radius - blends between squircle and rounded rect
float sdSquircleRounded(vec2 p, vec2 size, float radius, float n) {
    // Inset size by radius
    vec2 innerSize = size - radius;

    // For points inside the inner rectangle, use squircle
    // For points outside, blend with rounded corner behavior
    vec2 d = abs(p);

    if (d.x <= innerSize.x && d.y <= innerSize.y) {
        // Inside inner region - pure squircle
        return sdSquircle(p, size, n);
    }

    // Corner region - use squircle distance but with corner rounding
    vec2 cornerP = max(d - innerSize, 0.0);
    float cornerDist = length(cornerP) - radius;

    // Blend with squircle for smooth transition
    float squircleDist = sdSquircle(p, size, n);

    return max(squircleDist, cornerDist);
}

// ============================================================================
// UNIFIED BEVEL GEOMETRY - Used by both refraction and specular
// Returns: gradDir (2D direction), bevelAmount (0-1), edgeFactor (0-1)
// ============================================================================
struct BevelGeometry {
    vec2 gradDir;      // 2D gradient direction (outward from shape center)
    float bevelAmount; // How much the surface is tilted (0 = flat, 1 = max bevel)
    float edgeFactor;  // 0 = center, 1 = at edge
};

BevelGeometry computeBevelGeometry(vec2 uv, vec2 size, float radius, float squircleN, float edgeWidth, float bevelDepth) {
    BevelGeometry result;

    // Work in pixel space for consistent bevel width regardless of aspect ratio
    vec2 p = (uv - 0.5) * size;

    // Edge detection using squircle SDF in pixel space
    float d = sdSquircleRounded(p, size * 0.5, radius, squircleN);
    float edgeDist = -d; // positive inside (pixels from edge)

    // Effect zone in pixels - same width on all edges
    float effectZone = radius * edgeWidth;
    result.edgeFactor = 1.0 - smoothstep(0.0, effectZone, edgeDist);

    // Normalized position within the edge zone (0 at inner edge, 1 at outer edge)
    float zonePos = clamp(1.0 - edgeDist / effectZone, 0.0, 1.0);

    // Physical lens curvature: 1 - sqrt(1 - x²)
    // bevelDepth controls how pronounced the curve is
    result.bevelAmount = (1.0 - sqrt(1.0 - zonePos * zonePos * bevelDepth)) * result.edgeFactor;

    // Compute gradient direction from SDF (points outward from shape)
    // Use aspect-corrected epsilon for proper gradient on non-square panels
    float eps = max(2.0, radius * 0.05);
    float dx = sdSquircleRounded(p + vec2(eps, 0.0), size * 0.5, radius, squircleN) -
               sdSquircleRounded(p - vec2(eps, 0.0), size * 0.5, radius, squircleN);
    float dy = sdSquircleRounded(p + vec2(0.0, eps), size * 0.5, radius, squircleN) -
               sdSquircleRounded(p - vec2(0.0, eps), size * 0.5, radius, squircleN);

    // Normalize gradient but scale by aspect ratio so UV offset is uniform
    vec2 grad = vec2(dx, dy);
    // Convert pixel-space gradient to UV-space gradient
    result.gradDir = normalize(grad / size + 0.0001);

    return result;
}

// Compute UV offset for refraction based on bevel geometry
vec2 computeRefraction(BevelGeometry bevel) {
    // gradDir is already in UV space (aspect-corrected), just scale by bevel amount
    return bevel.gradDir * bevel.bevelAmount;
}

// ============================================================================
// SPECULAR HIGHLIGHTS - Physically-based reflection from world-space lights
//
// Physics of glass reflection:
// - Light reflects off the front surface according to the law of reflection
// - For us to SEE the reflection, the reflected ray must point toward our eye
// - Fresnel equations determine HOW MUCH light reflects (vs refracts through)
// - At normal incidence (looking straight at glass): ~4% reflects (F0 = 0.04)
// - At grazing angles: approaches 100% reflection
//
// Uses the same BevelGeometry as refraction for consistency
// ============================================================================

// Fresnel-Schlick approximation
// F0 = reflectance at normal incidence (0.04 for glass/air interface)
// cosTheta = dot(normal, viewDir) or dot(normal, halfVec)
float fresnelSchlick(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Compute specular contribution from a single light
// All vectors must be normalized and in world space
// Returns: specular intensity (Fresnel already applied)
//
// Key insight for glass reflection (like looking through a window):
// - You see REFLECTIONS of things BEHIND YOU (on your side of the glass)
// - You see THROUGH the glass to things in FRONT (on the other side)
//
// Think about it: when you look at a window during the day, you see:
// - The scene outside (transmitted through the glass)
// - Reflections of the room behind you (reflected off the glass surface)
//
// For the specular highlight to be visible:
// 1. The light must be BEHIND the camera (same side as camera relative to panel)
// 2. The reflected light ray must point toward the camera
//
// viewDir: from surface toward camera (normalized)
// lightDir: from surface toward light (normalized)
// panelNormal: flat panel normal pointing toward camera (normalized)
float computePhongSpecular(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 cameraLookDir, vec3 panelNormal, float shininess, float F0) {
    // For a UI glass panel (billboard in front of camera):
    // Window reflection physics - we see reflections of things BEHIND us

    float dotCheck = dot(lightDir, cameraLookDir);

    // Reflect the light off the surface
    vec3 reflectedLight = reflect(-lightDir, normal);
    float RdotV = dot(reflectedLight, viewDir);

    // How much is the normal tilted from the panel normal?
    float normalTilt = 1.0 - max(dot(normal, panelNormal), 0.0);

    // For flat areas: reject lights in front (dotCheck < 0)
    // For tilted edges: allow lights from the side (threshold more negative)
    float threshold = mix(0.0, -0.5, normalTilt);

    // Reject lights that are in front of camera (negative dot = light in front)
    if (dotCheck < threshold) return 0.0;

    // Reflected light must point toward camera (positive RdotV)
    if (RdotV <= 0.0) return 0.0;

    // Fresnel: how much light reflects at this angle
    vec3 halfVec = normalize(viewDir + lightDir);
    float NdotH = max(dot(normal, halfVec), 0.0);
    float F = fresnelSchlick(NdotH, F0);

    // Phong specular lobe with improved sharpness mapping
    // Remap shininess (4-128) to exponent with smoother response
    // Square the shininess to make the slider more responsive at low values
    float exponent = shininess * shininess / 32.0;  // 4->0.5, 24->18, 64->128, 128->512
    float normFactor = (exponent + 2.0) / 6.28318530718;
    float specLobe = normFactor * pow(RdotV, exponent);

    return F * specLobe;
}

vec3 computeSpecularHighlights(BevelGeometry bevel, vec2 screenUV) {
    // ========================================
    // WORLD-SPACE GEOMETRY SETUP
    // ========================================

    // Panel faces the camera (like a billboard)
    vec3 panelToCamera = uCameraPos - uPanelWorldPos;
    float distToCamera = length(panelToCamera);

    // Panel normal points toward camera
    vec3 panelNormal = distToCamera > 0.001 ? panelToCamera / distToCamera : vec3(0.0, 0.0, 1.0);

    // Build orthonormal basis for the panel surface
    // Handle edge case where panel normal is parallel to world up
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 panelRight = normalize(cross(worldUp, panelNormal));
    if (length(cross(worldUp, panelNormal)) < 0.001) {
        panelRight = vec3(1.0, 0.0, 0.0);
    }
    vec3 panelUp = cross(panelNormal, panelRight);

    // For a UI panel, use camera position as the reference point for light calculations
    // The panel floats in front of the camera, so light directions should be relative to camera
    vec3 surfacePos = uCameraPos;  // Use camera position as reference

    // View direction: from camera toward panel (for reflection calculations)
    // Inverted from panelNormal because reflect() expects incoming direction
    vec3 viewDir = -panelNormal;  // Direction from camera toward panel

    // Camera look direction (for checking if light is in front or behind)
    vec3 cameraLookDir = -panelNormal;  // Direction camera is looking (into scene)

    // ========================================
    // SURFACE NORMAL WITH BEVEL
    // ========================================
    // The bevel creates a curved edge like a lens
    // gradDir is the 2D direction pointing outward from shape center (in UV space)
    // We need to convert this to world space on the panel plane

    // gradDir was computed as normalize(grad / size) where grad is in pixels
    // So gradDir.x corresponds to panel right, gradDir.y to panel up
    // But gradDir was normalized after dividing by size, so we need to
    // scale it back to get proper world-space direction

    // The bevel tilts the normal outward from the panel center
    // bevelAmount controls how much the normal tilts (0 = flat, higher = more tilt)
    // For a physical lens edge, the normal tilts smoothly from facing-camera to facing-outward

    // Convert UV-space gradient to world-space direction on panel plane
    // Account for aspect ratio: gradDir.x was divided by width, gradDir.y by height
    vec2 worldGrad = bevel.gradDir * vec2(uAspectRatio, 1.0);
    worldGrad = normalize(worldGrad + 0.0001);

    // UV space: x = right, y = up (but both are inverted in screen space)
    vec3 bevelWorldDir = panelRight * (-worldGrad.x) + panelUp * (-worldGrad.y);

    // Tilt the normal based on bevel amount
    // bevelAmount is from lens curvature formula, ranges 0 to ~0.3 typically
    // Scale to a reasonable angle (max ~45 degrees at edges)
    float maxBevelAngle = 0.785398; // 45 degrees in radians
    float bevelAngle = bevel.bevelAmount * maxBevelAngle * uBevelDepth;

    // Construct tilted normal: rotate panelNormal toward bevelWorldDir by bevelAngle
    float sinB = sin(bevelAngle);
    float cosB = cos(bevelAngle);
    vec3 normal = normalize(panelNormal * cosB + bevelWorldDir * sinB);

    // ========================================
    // ACCUMULATE SPECULAR FROM ALL LIGHTS
    // ========================================

    // Glass F0 = 0.04 (4% reflection at normal incidence)
    // This comes from ((n1-n2)/(n1+n2))^2 where n1=1 (air), n2=1.5 (glass)
    //
    // CHROMATIC ABERRATION: Different wavelengths have different refractive indices,
    // which means different F0 values. The Fresnel equations depend on n:
    //   F0 = ((n1-n2)/(n1+n2))^2
    // For crown glass (typical values):
    //   Red (656nm):   n ≈ 1.514 → F0 ≈ 0.0408
    //   Green (550nm): n ≈ 1.519 → F0 ≈ 0.0417
    //   Blue (486nm):  n ≈ 1.528 → F0 ≈ 0.0432
    //
    // The higher F0 for blue means more blue light reflects at normal incidence,
    // creating subtle color fringing at specular highlight edges.

    float F0_base = 0.04;

    // Per-channel F0 based on dispersion (controlled by chromatic aberration param)
    float dispersion = uChromaticAberration;
    float F0_R = F0_base * mix(1.0, 0.96, dispersion);   // Red reflects slightly less
    float F0_G = F0_base;                                 // Green is baseline
    float F0_B = F0_base * mix(1.0, 1.06, dispersion);   // Blue reflects slightly more

    vec3 specular = vec3(0.0);

    // Light 0
    if (uLight0Intensity > 0.01) {
        vec3 lightDir = normalize(uLight0WorldPos - surfacePos);

        // Per-channel specular with chromatic aberration via different F0 values
        float specR = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_R);
        float specG = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_G);
        float specB = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_B);

        specular += uLight0Color * vec3(specR, specG, specB) * uLight0Intensity;
    }

    // Light 1
    if (uLight1Intensity > 0.01) {
        vec3 lightDir = normalize(uLight1WorldPos - surfacePos);

        float specR = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_R);
        float specG = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_G);
        float specB = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_B);

        specular += uLight1Color * vec3(specR, specG, specB) * uLight1Intensity;
    }

    // Light 2
    if (uLight2Intensity > 0.01) {
        vec3 lightDir = normalize(uLight2WorldPos - surfacePos);

        float specR = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_R);
        float specG = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_G);
        float specB = computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0_B);

        specular += uLight2Color * vec3(specR, specG, specB) * uLight2Intensity;
    }

    return specular * uSpecularIntensity;
}

// ============================================================================
// CAUSTICS - Light focusing through curved glass edges
// ============================================================================
// Caustics are the bright patterns created when light refracts through
// curved transparent surfaces, focusing into concentrated bright spots.
// At the curved bevel edges of our glass panel, light rays converge,
// creating characteristic bright bands.
//
// Physics: When parallel light rays pass through a curved lens surface,
// they converge at different focal points based on the curvature.
// The caustic intensity is proportional to the rate of change of
// the refraction angle (second derivative of the surface).

vec3 computeCaustics(BevelGeometry bevel, vec2 screenUV) {
    if (uCausticsIntensity < 0.001) return vec3(0.0);

    // Only compute caustics near edges where there's curvature
    if (bevel.edgeFactor < 0.01) return vec3(0.0);

    // ========================================
    // FAKE GLASS VOLUME WITH INVERTED NORMALS
    // ========================================
    // Real glass has thickness. Light enters through the front curved surface,
    // travels through the glass, then exits through the back surface.
    // We fake this by computing refraction through TWO surfaces:
    // 1. Front surface: normal tilted outward (what we already have)
    // 2. Back surface: same shape but inverted normal (tilted inward)
    //
    // Caustics form where light rays CONVERGE after passing through both surfaces.
    // A convex lens (curved outward on both sides) focuses light.
    // Our bevel creates a similar effect at the edges.

    // Setup world space (same as specular)
    vec3 panelToCamera = uCameraPos - uPanelWorldPos;
    vec3 panelNormal = normalize(panelToCamera);

    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 panelRight = normalize(cross(worldUp, panelNormal));
    if (length(cross(worldUp, panelNormal)) < 0.001) {
        panelRight = vec3(1.0, 0.0, 0.0);
    }
    vec3 panelUp = cross(panelNormal, panelRight);

    // Convert bevel gradient to world space
    vec2 worldGrad = bevel.gradDir * vec2(uAspectRatio, 1.0);
    worldGrad = normalize(worldGrad + 0.0001);
    vec3 bevelWorldDir = panelRight * (-worldGrad.x) + panelUp * (-worldGrad.y);

    // Compute front and back surface normals
    float maxBevelAngle = 0.785398; // 45 degrees
    float bevelAngle = bevel.bevelAmount * maxBevelAngle * uBevelDepth;

    float sinB = sin(bevelAngle);
    float cosB = cos(bevelAngle);

    // Front surface normal: tilts OUTWARD from center (toward edge)
    vec3 frontNormal = normalize(panelNormal * cosB + bevelWorldDir * sinB);

    // Back surface normal: points INTO the glass, tilted same way as front
    // This creates a biconvex lens effect at the edges
    vec3 backNormal = normalize(-panelNormal * cosB - bevelWorldDir * sinB);

    // ========================================
    // LIGHT FOCUSING CALCULATION
    // ========================================
    // Compute caustic intensity based on curvature and light alignment.
    // Single bright band with subtle warm tint (no complex CA on caustics).

    vec3 caustics = vec3(0.0);

    // Process primary light (light 0)
    if (uLight0Intensity > 0.01) {
        vec3 lightDir = normalize(uLight0WorldPos - uCameraPos);

        // Caustics appear when looking TOWARD the light
        float lightTransmission = max(dot(lightDir, panelNormal), 0.0);

        // Curvature causes focusing
        float focusingPower = bevel.bevelAmount * bevel.bevelAmount * 8.0;

        // Light aligned with bevel direction gets focused more
        float lightBevelAlign = abs(dot(lightDir, bevelWorldDir));

        // Simple band shape
        float bandShape = bevel.edgeFactor * (1.0 - bevel.edgeFactor * 0.5);
        bandShape = pow(bandShape, 0.5 / uCausticsScale);

        float causticStrength = focusingPower * lightTransmission * lightBevelAlign * bandShape;

        // Warm tint for focused sunlight
        vec3 lightContrib = uLight0Color * uLight0Intensity * max(causticStrength, 0.0);
        lightContrib *= vec3(1.1, 1.0, 0.9);

        caustics += lightContrib;
    }

    // Process secondary light (light 1)
    if (uLight1Intensity > 0.01) {
        vec3 lightDir = normalize(uLight1WorldPos - uCameraPos);
        float lightTransmission = max(dot(lightDir, panelNormal), 0.0);
        float focusingPower = bevel.bevelAmount * bevel.bevelAmount * 8.0;
        float lightBevelAlign = abs(dot(lightDir, bevelWorldDir));

        float bandShape = bevel.edgeFactor * (1.0 - bevel.edgeFactor * 0.5);
        bandShape = pow(bandShape, 0.5 / uCausticsScale);

        float causticStrength = focusingPower * lightTransmission * lightBevelAlign * bandShape;

        vec3 lightContrib = uLight1Color * uLight1Intensity * max(causticStrength, 0.0);
        lightContrib *= vec3(1.1, 1.0, 0.9);

        caustics += lightContrib;
    }

    // Process tertiary light (light 2)
    if (uLight2Intensity > 0.01) {
        vec3 lightDir = normalize(uLight2WorldPos - uCameraPos);
        float lightTransmission = max(dot(lightDir, panelNormal), 0.0);
        float focusingPower = bevel.bevelAmount * bevel.bevelAmount * 8.0;
        float lightBevelAlign = abs(dot(lightDir, bevelWorldDir));

        float bandShape = bevel.edgeFactor * (1.0 - bevel.edgeFactor * 0.5);
        bandShape = pow(bandShape, 0.5 / uCausticsScale);

        float causticStrength = focusingPower * lightTransmission * lightBevelAlign * bandShape;

        vec3 lightContrib = uLight2Color * uLight2Intensity * max(causticStrength, 0.0);
        lightContrib *= vec3(1.1, 1.0, 0.9);

        caustics += lightContrib;
    }

    // Ensure we only ADD light, never subtract
    return max(caustics, vec3(0.0)) * uCausticsIntensity;
}

// Mirror UV function - reflects UVs that go outside 0-1 range
// This creates seamless sampling at edges without hard cutoffs
#define mirrorUV(uv) abs(mod(uv + 1.0, 2.0) - 1.0)

void main() {
    vec2 pixelSize = uPanelSize;
    vec2 p = (vLocalUV - 0.5) * pixelSize;
    vec2 b = pixelSize * 0.5;

    // Compute squircle SDF and mask
    float d = sdSquircleRounded(p, b, uCornerRadius, uSquircleN);
    float mask = 1.0 - smoothstep(-uEdgeSoftness, uEdgeSoftness, d);

    if (mask < 0.001) {
        discard;
    }

    // ========================================
    // UNIFIED BEVEL GEOMETRY
    // ========================================
    // Compute bevel geometry ONCE and use for both refraction and specular
    // This ensures both effects use identical surface normal calculations
    BevelGeometry bevel = computeBevelGeometry(vLocalUV, pixelSize, uCornerRadius, uSquircleN, uEdgeWidth, uBevelDepth);

    // Get UV offset for refraction from unified bevel geometry
    vec2 lensRefract = computeRefraction(bevel);

    // ========================================
    // PHYSICALLY-BASED CHROMATIC ABERRATION
    // ========================================
    // Dispersion occurs because refractive index varies with wavelength.
    // Using Cauchy's equation approximation: n(λ) ≈ A + B/λ²
    // For crown glass: n_red ≈ 1.514, n_green ≈ 1.517, n_blue ≈ 1.524
    // Abbe number V ≈ 60 for crown glass
    //
    // The refraction angle scales with (n-1), so relative dispersion:
    // Red refracts least, blue refracts most
    // Ratio: n_blue/n_green ≈ 1.0046, n_red/n_green ≈ 0.998

    // Dispersion coefficients (relative to green as baseline)
    // Based on typical crown glass dispersion
    const float disperseR = 0.996;  // Red refracts ~0.4% less than green
    const float disperseG = 1.000;  // Green is baseline
    const float disperseB = 1.008;  // Blue refracts ~0.8% more than green

    // Base refraction strength
    float refractScale = uRefractStrength * 0.02;

    vec3 blurredColor;
    if (uChromaticAberration > 0.001) {
        // Apply wavelength-dependent refraction
        // Each color channel gets its own refraction offset based on dispersion
        float aberrationScale = 1.0 + (uChromaticAberration - 1.0) * 0.5;  // Scale the dispersion effect

        vec2 refractR = lensRefract * refractScale * disperseR * aberrationScale;
        vec2 refractG = lensRefract * refractScale * disperseG;
        vec2 refractB = lensRefract * refractScale * disperseB * aberrationScale;

        vec2 uvR = mirrorUV(vScreenUV + refractR);
        vec2 uvG = mirrorUV(vScreenUV + refractG);
        vec2 uvB = mirrorUV(vScreenUV + refractB);

        blurredColor.r = texture2D(uBlurredScene, uvR).r;
        blurredColor.g = texture2D(uBlurredScene, uvG).g;
        blurredColor.b = texture2D(uBlurredScene, uvB).b;
    } else {
        vec2 refractOffset = lensRefract * refractScale;
        vec2 baseUV = mirrorUV(vScreenUV + refractOffset);
        blurredColor = texture2D(uBlurredScene, baseUV).rgb;
    }

    // Apply tone mapping to match the post-processed background
    vec3 color = applyToneMapping(blurredColor);

    // Apply glass tint
    color = mix(color, color * uGlassTint, uGlassOpacity);

    // ========================================
    // SPECULAR HIGHLIGHTS
    // ========================================
    // Use the SAME bevel geometry for specular as we used for refraction
    // This ensures both effects have consistent surface normals
    vec3 specular = computeSpecularHighlights(bevel, vScreenUV);
    color += specular;

    // ========================================
    // CAUSTICS
    // ========================================
    // Light focusing through curved glass edges creates bright bands
    vec3 caustics = computeCaustics(bevel, vScreenUV);
    color += caustics;

    // Alpha: fully opaque with soft edges from SDF mask
    float alpha = mask;

    gl_FragColor = vec4(color, alpha);
}
`;

// ============================================================================
// DOWNSAMPLE SHADER - Bilinear 4-tap downsample
// ============================================================================

window.GLASS_DOWNSAMPLE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexelSize;

varying vec2 vUV;

void main() {
    vec2 off = uTexelSize * 0.5;

    vec4 sum = texture2D(uSource, vUV + vec2(-off.x, -off.y));
    sum += texture2D(uSource, vUV + vec2( off.x, -off.y));
    sum += texture2D(uSource, vUV + vec2(-off.x,  off.y));
    sum += texture2D(uSource, vUV + vec2( off.x,  off.y));

    gl_FragColor = sum * 0.25;
}
`;

// ============================================================================
// BLIT SHADER - Simple copy
// ============================================================================

window.GLASS_BLIT_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSource;

varying vec2 vUV;

void main() {
    gl_FragColor = texture2D(uSource, vUV);
}
`;
