precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_n;
uniform float u_bevelWidth;
uniform float u_bevelDepth;
uniform float u_ior;
uniform float u_dispersion;
uniform float u_specularEnabled;
uniform float u_specularSharpness;
uniform float u_fresnelEnabled;
uniform float u_reflectionIntensity;
uniform float u_causticsEnabled;
uniform float u_causticsIntensity;
uniform float u_absorptionEnabled;
uniform float u_thickness;
uniform float u_skyboxOffset;  // Offset skybox rotation to align sun with light
// Multi-light support (3 lights with angle/elevation controls)
uniform float u_multiLightEnabled;
uniform float u_light0Angle;
uniform float u_light0Elevation;
uniform vec3 u_light0Color;
uniform float u_light0Intensity;
uniform float u_light1Angle;
uniform float u_light1Elevation;
uniform vec3 u_light1Color;
uniform float u_light1Intensity;
uniform float u_light2Angle;
uniform float u_light2Elevation;
uniform vec3 u_light2Color;
uniform float u_light2Intensity;
uniform vec2 u_resolution;
uniform sampler2D u_skybox;         // Sharp skybox for reflections
uniform sampler2D u_skyboxBlurred;  // Pre-blurred skybox for refraction

// ACES Filmic Tonemapping
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Squircle SDF
float sdSquircle(vec2 p, vec2 size, float n) {
    vec2 d = abs(p) / size;
    float dist = pow(pow(d.x, n) + pow(d.y, n), 1.0 / n);
    return (dist - 1.0) * min(size.x, size.y);
}

// Bevel geometry - identical to production shader
struct BevelGeometry {
    vec2 gradDir;
    float bevelAmount;
    float edgeFactor;
};

BevelGeometry computeBevelGeometry(vec2 p, vec2 shapeSize, float squircleN, float edgeWidth, float bevelDepth) {
    BevelGeometry result;
    float d = sdSquircle(p, shapeSize, squircleN);
    float edgeDist = -d;

    result.edgeFactor = 1.0 - smoothstep(0.0, edgeWidth, edgeDist);
    float zonePos = clamp(1.0 - edgeDist / edgeWidth, 0.0, 1.0);

    // Lens curvature profile: circular arc derivative gives surface angle
    float x2 = zonePos * zonePos * bevelDepth;
    float denom = max(1.0 - x2, 0.01);
    float surfaceAngle = atan(zonePos * sqrt(bevelDepth) / sqrt(denom));
    result.bevelAmount = surfaceAngle * result.edgeFactor;

    // Gradient via finite differences
    float eps = max(2.0, edgeWidth * 0.05);
    float dx = sdSquircle(p + vec2(eps, 0.0), shapeSize, squircleN) - sdSquircle(p - vec2(eps, 0.0), shapeSize, squircleN);
    float dy = sdSquircle(p + vec2(0.0, eps), shapeSize, squircleN) - sdSquircle(p - vec2(0.0, eps), shapeSize, squircleN);
    result.gradDir = normalize(vec2(dx, dy) + 0.0001);

    return result;
}

// Refraction - exactly as in production shader
vec2 computeRefraction(BevelGeometry bevel) {
    return bevel.gradDir * bevel.bevelAmount;
}

// Simple hash for cheap patterns
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Forward declarations
vec3 getLightDirection(float t);
vec3 getLightColor(vec3 lightDir);

// ============================================
// MULTI-LIGHT STRUCTURES (defined early for use in environment)
// ============================================
vec3 getLightDirFromAngles(float angle, float elevation) {
    float cosElev = cos(elevation);
    return normalize(vec3(
        sin(angle) * cosElev,
        sin(elevation),
        cos(angle) * cosElev
    ));
}

struct LightData {
    vec3 direction;
    vec3 color;
    float intensity;
};

LightData getLight0() {
    LightData light;
    light.direction = getLightDirFromAngles(u_light0Angle, u_light0Elevation);
    light.color = u_light0Color;
    light.intensity = u_light0Intensity;
    return light;
}

LightData getLight1() {
    LightData light;
    light.direction = getLightDirFromAngles(u_light1Angle, u_light1Elevation);
    light.color = u_light1Color;
    light.intensity = u_light1Intensity;
    return light;
}

LightData getLight2() {
    LightData light;
    light.direction = getLightDirFromAngles(u_light2Angle, u_light2Elevation);
    light.color = u_light2Color;
    light.intensity = u_light2Intensity;
    return light;
}

// ============================================
// EQUIRECTANGULAR SKYBOX SAMPLING
// Samples from u_skybox texture using direction vector
// ============================================

// Convert 3D direction to equirectangular UV coordinates
vec2 dirToEquirectangular(vec3 dir) {
    // Spherical coordinates: theta (azimuth), phi (elevation)
    float theta = atan(dir.x, dir.z); // -PI to PI
    float phi = asin(clamp(dir.y, -1.0, 1.0)); // -PI/2 to PI/2

    // Convert to UV (0-1 range)
    // U: horizontal angle mapped to 0-1
    // V: vertical angle - flip so up is top of texture
    vec2 uv;
    uv.x = (theta / 3.14159265359) * 0.5 + 0.5;
    uv.y = 0.5 - (phi / 3.14159265359); // Flip vertical

    return uv;
}

// Sample sharp skybox texture (for reflections)
vec3 sampleSkybox(vec3 dir) {
    vec2 uv = dirToEquirectangular(dir);
    return texture2D(u_skybox, uv).rgb;
}

// Sample blurred skybox texture (for refraction through frosted glass)
vec3 sampleSkyboxBlurred(vec3 dir) {
    vec2 uv = dirToEquirectangular(dir);
    return texture2D(u_skyboxBlurred, uv).rgb;
}

// Compute light influence on a direction (for specular highlights)
float computeLightInfluence(vec3 dir, vec3 lightDir) {
    float sunDot = dot(dir, lightDir);
    float angularDist = 1.0 - sunDot;
    return 1.0 / (1.0 + angularDist * angularDist * 9.0);
}

// Sample environment with multiple lights (sharp - for reflections)
vec3 sampleEnvironmentMultiLight(vec3 dir) {
    // Sample sharp skybox texture
    vec3 color = sampleSkybox(dir);

    // Get all three lights for specular glow overlay
    LightData light0 = getLight0();
    LightData light1 = getLight1();
    LightData light2 = getLight2();

    // Add subtle light glow on top of skybox
    float influence0 = computeLightInfluence(dir, light0.direction) * light0.intensity;
    float influence1 = computeLightInfluence(dir, light1.direction) * light1.intensity;
    float influence2 = computeLightInfluence(dir, light2.direction) * light2.intensity;

    color += light0.color * influence0 * 0.3;
    color += light1.color * influence1 * 0.3;
    color += light2.color * influence2 * 0.3;

    return color;
}

// Sample blurred environment with multiple lights (for refraction)
vec3 sampleEnvironmentMultiLightBlurred(vec3 dir) {
    // Sample blurred skybox texture
    vec3 color = sampleSkyboxBlurred(dir);

    // Get all three lights for specular glow overlay
    LightData light0 = getLight0();
    LightData light1 = getLight1();
    LightData light2 = getLight2();

    // Add subtle light glow on top of skybox
    float influence0 = computeLightInfluence(dir, light0.direction) * light0.intensity;
    float influence1 = computeLightInfluence(dir, light1.direction) * light1.intensity;
    float influence2 = computeLightInfluence(dir, light2.direction) * light2.intensity;

    color += light0.color * influence0 * 0.3;
    color += light1.color * influence1 * 0.3;
    color += light2.color * influence2 * 0.3;

    return color;
}

// Single-light version (sharp - for reflections)
vec3 sampleEnvironment(vec3 dir, vec3 sunDir, vec3 sunColor) {
    // Sample sharp skybox texture
    vec3 color = sampleSkybox(dir);

    // Add sun glow
    float sunInfluence = computeLightInfluence(dir, sunDir);
    color += sunColor * sunInfluence * 0.3;

    return color;
}

// Single-light blurred version (for refraction)
vec3 sampleEnvironmentBlurred(vec3 dir, vec3 sunDir, vec3 sunColor) {
    // Sample blurred skybox texture
    vec3 color = sampleSkyboxBlurred(dir);

    // Add sun glow
    float sunInfluence = computeLightInfluence(dir, sunDir);
    color += sunColor * sunInfluence * 0.3;

    return color;
}

// Convert UV to view direction
vec3 uvToViewDir(vec2 uv) {
    vec2 centered = (uv - 0.5) * 2.0;
    float fov = 1.2; // ~70 degree FOV
    return normalize(vec3(centered.x * fov, centered.y * fov, -1.0));
}

// Rotate direction around Y axis (for skybox rotation locked to sun)
vec3 rotateY(vec3 dir, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(
        dir.x * c + dir.z * s,
        dir.y,
        -dir.x * s + dir.z * c
    );
}

// Get current rotation angle (time-based + offset for alignment)
float getSkyboxRotation() {
    return u_time * 0.3 + u_skyboxOffset;
}

// Sharp background (for outside glass / reflections)
vec3 sharpBackground(vec2 uv) {
    vec3 viewDir = uvToViewDir(uv);

    // Rotate skybox to match sun angle (so they move together)
    float rotation = getSkyboxRotation();
    vec3 rotatedDir = rotateY(viewDir, rotation);

    vec3 color;
    if (u_multiLightEnabled > 0.5) {
        color = sampleEnvironmentMultiLight(rotatedDir);
    } else {
        vec3 sunDir = getLightDirection(u_time);
        vec3 sunColor = getLightColor(sunDir);
        color = sampleEnvironment(rotatedDir, sunDir, sunColor);
    }

    // Soft vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.2);
    vignette = smoothstep(0.0, 0.7, vignette);
    color *= 0.7 + 0.3 * vignette;

    return color;
}

// Blurred background (for refraction through frosted glass)
vec3 proceduralBackground(vec2 uv) {
    vec3 viewDir = uvToViewDir(uv);

    // Rotate skybox to match sun angle (so they move together)
    float rotation = getSkyboxRotation();
    vec3 rotatedDir = rotateY(viewDir, rotation);

    vec3 color;
    if (u_multiLightEnabled > 0.5) {
        color = sampleEnvironmentMultiLightBlurred(rotatedDir);
    } else {
        vec3 sunDir = getLightDirection(u_time);
        vec3 sunColor = getLightColor(sunDir);
        color = sampleEnvironmentBlurred(rotatedDir, sunDir, sunColor);
    }

    // Soft vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.2);
    vignette = smoothstep(0.0, 0.7, vignette);
    color *= 0.7 + 0.3 * vignette;

    return color;
}

// Background sample - texture is pre-blurred offline for performance
vec3 blurredBackground(vec2 uv, float blurAmount) {
    // Texture already blurred - just sample directly
    return proceduralBackground(uv);
}

// Chromatic dispersion - separate RGB channel offsets
vec3 blurredBackgroundChromatic(vec2 uv, float blurAmount, vec2 dispersionDir, float dispersionAmount) {
    vec2 uvR = uv - dispersionDir * dispersionAmount;
    vec2 uvG = uv;
    vec2 uvB = uv + dispersionDir * dispersionAmount;

    // Sample pre-blurred texture with chromatic offset
    return vec3(
        proceduralBackground(uvR).r,
        proceduralBackground(uvG).g,
        proceduralBackground(uvB).b
    );
}

// Get light direction - time-based rotation
// Full 3D orbit: sun goes around the glass in all directions
vec3 getLightDirection(float t) {
    float angle = t * 0.3;

    // 3D spherical orbit - sun travels around the glass panel
    // As angle increases: front -> right -> back -> left -> front
    // With vertical bob to make it more interesting
    float elevation = sin(angle * 0.5) * 0.3; // Gentle vertical motion

    return normalize(vec3(
        sin(angle),           // X: left-right oscillation
        elevation,            // Y: up-down bob
        cos(angle)            // Z: front-back (full range -1 to 1)
    ));
}

// Get light color based on direction
vec3 getLightColor(vec3 lightDir) {
    float warmth = lightDir.x * 0.5 + 0.5; // 0 = cold, 1 = warm
    vec3 warmColor = vec3(1.0, 0.8, 0.4);  // Golden sunset
    vec3 coolColor = vec3(0.6, 0.7, 0.9);  // Cool blue
    return mix(coolColor, warmColor, warmth);
}

// Sample environment for reflections - uses single or multi-light
vec3 sampleReflection(vec3 reflectDir) {
    // Reflections show what's BEHIND the viewer (positive Z), not behind the glass
    // The reflect() function gives us the correct optical direction, but since our
    // background shows what's behind the glass (-Z), we need to flip Z for reflections
    // to sample the opposite hemisphere of the skybox
    vec3 mirrorDir = vec3(reflectDir.x, reflectDir.y, -reflectDir.z);

    // Apply same rotation as background so reflections rotate with skybox
    float rotation = getSkyboxRotation();
    vec3 rotatedDir = rotateY(mirrorDir, rotation);

    if (u_multiLightEnabled > 0.5) {
        return sampleEnvironmentMultiLight(rotatedDir);
    } else {
        vec3 sunDir = getLightDirection(u_time);
        vec3 sunColor = getLightColor(sunDir);
        return sampleEnvironment(rotatedDir, sunDir, sunColor);
    }
}

// Fresnel using Schlick approximation
float fresnelSchlick(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Phong specular - matches production shader
float computePhongSpecular(vec3 normal, vec3 viewDir, vec3 lightDir, float shininess, float F0) {
    vec3 reflectedLight = reflect(-lightDir, normal);
    float RdotV = dot(reflectedLight, viewDir);

    if (RdotV <= 0.0) return 0.0;

    vec3 halfVec = normalize(viewDir + lightDir);
    float NdotH = max(dot(normal, halfVec), 0.0);
    float F = fresnelSchlick(NdotH, F0);
    float exponent = shininess * shininess / 32.0;
    float normFactor = (exponent + 2.0) / 6.28318530718; // 2PI
    float specLobe = normFactor * pow(RdotV, exponent);

    return F * specLobe;
}

// Compute surface normal from bevel geometry
vec3 computeSurfaceNormal(BevelGeometry bevel) {
    vec3 panelNormal = vec3(0.0, 0.0, 1.0);
    float bevelAngle = bevel.bevelAmount * 0.785398 * u_bevelDepth; // PI/4 = 45deg max
    float sinB = sin(bevelAngle);
    float cosB = cos(bevelAngle);
    // Bevel tilts OUTWARD (follows gradient direction) for convex glass
    vec3 bevelDir = vec3(bevel.gradDir.x, bevel.gradDir.y, 0.0);
    return normalize(panelNormal * cosB + bevelDir * sinB);
}

// Compute specular from a single light source
vec3 computeSpecularFromLight(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 lightColor, float intensity) {
    float F0 = 0.04;
    vec3 halfVec = normalize(viewDir + lightDir);
    float NdotH = max(dot(normal, halfVec), 0.0);
    float NdotL = max(dot(normal, lightDir), 0.0);
    float fresnel = fresnelSchlick(NdotH, F0);
    float exponent = u_specularSharpness * u_specularSharpness / 32.0;
    float spec = pow(NdotH, exponent);
    float norm = (exponent + 2.0) / 6.28318;
    return lightColor * fresnel * spec * norm * NdotL * 2.0 * intensity;
}

// Compute specular highlights - supports single or multi-light
vec3 computeSpecularHighlights(BevelGeometry bevel) {
    vec3 normal = computeSurfaceNormal(bevel);
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    if (u_multiLightEnabled > 0.5) {
        // Multi-light mode: accumulate specular from all 3 lights
        LightData light0 = getLight0();
        LightData light1 = getLight1();
        LightData light2 = getLight2();

        vec3 specular = vec3(0.0);
        specular += computeSpecularFromLight(normal, viewDir, light0.direction, light0.color, light0.intensity);
        specular += computeSpecularFromLight(normal, viewDir, light1.direction, light1.color, light1.intensity);
        specular += computeSpecularFromLight(normal, viewDir, light2.direction, light2.color, light2.intensity);
        return specular;
    } else {
        // Single orbiting light
        vec3 lightDir = getLightDirection(u_time);
        vec3 lightColor = getLightColor(lightDir);
        return computeSpecularFromLight(normal, viewDir, lightDir, lightColor, 1.0);
    }
}

// Compute Fresnel reflection/refraction blend
// Takes UV to compute per-pixel view direction for proper mirror effect
vec3 computeFresnelReflection(BevelGeometry bevel, vec3 refractedColor, vec2 uv) {
    vec3 normal = computeSurfaceNormal(bevel);

    // Per-pixel view direction based on screen position
    // This creates a proper mirror effect where different parts of the glass
    // reflect different parts of the environment
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0)); // Looking at the glass

    // Fresnel - how much light is reflected vs refracted
    float NdotV = max(dot(normal, viewDir), 0.0);

    // Use higher F0 for more visible reflections (artistic choice over physical accuracy)
    // Real glass is 0.04, but we use 0.1-0.2 for better visual impact
    float F0 = 0.15;
    float fresnel = fresnelSchlick(NdotV, F0);

    // Boost fresnel on beveled edges where normal is tilted
    // This makes the edge reflections more pronounced
    float edgeBoost = 1.0 - NdotV; // Higher when viewing at angle
    fresnel = mix(fresnel, 1.0, edgeBoost * edgeBoost * 0.5);

    // Scale by reflection intensity uniform
    fresnel = clamp(fresnel * u_reflectionIntensity, 0.0, 1.0);

    // For reflection direction, use per-pixel incoming ray direction
    // The incoming ray varies across the screen (like looking through a window)
    vec3 incomingRay = uvToViewDir(uv); // Ray from viewer through this pixel

    // Reflect this ray off the surface normal
    vec3 reflectDir = reflect(incomingRay, normal);

    // Sample environment map for reflection (sharp skybox)
    vec3 reflected = sampleReflection(reflectDir);

    // Blend refraction and reflection based on Fresnel
    return mix(refractedColor, reflected, fresnel);
}

// ============================================
// CAUSTICS - Cylindrical Lens Focusing
// Light passes THROUGH the glass from behind,
// refracts at the back surface, and focuses on our side
// ============================================

// Compute caustics from a single light
vec3 computeCausticsFromLight(BevelGeometry bevel, vec3 lightDir, vec3 lightColor, float intensity) {
    vec3 backNormal = vec3(0.0, 0.0, -1.0);

    // Caustics appear when light comes from BEHIND the glass
    float backFacing = max(dot(lightDir, backNormal), 0.0);
    if (backFacing < 0.01) return vec3(0.0);

    vec3 focusDir = vec3(-bevel.gradDir.x, -bevel.gradDir.y, 0.0);

    float causticsScale = 0.8;
    float bandShape = pow(bevel.edgeFactor * (1.0 - bevel.edgeFactor * 0.5), 0.5 / causticsScale);

    float iorFactor = (u_ior - 1.0) / 0.5;
    float focusingPower = bevel.bevelAmount * bevel.bevelAmount * 2.0 * iorFactor;

    float rawAlignment = dot(lightDir.xy, focusDir.xy);
    float focusAlignment = 0.3 + 0.7 * rawAlignment * rawAlignment;

    return lightColor * focusingPower * focusAlignment * backFacing * bandShape * intensity;
}

vec3 computeCaustics(BevelGeometry bevel) {
    vec3 caustics = vec3(0.0);

    if (u_multiLightEnabled > 0.5) {
        // Multi-light: accumulate caustics from all lights
        LightData light0 = getLight0();
        LightData light1 = getLight1();
        LightData light2 = getLight2();

        caustics += computeCausticsFromLight(bevel, light0.direction, light0.color, light0.intensity);
        caustics += computeCausticsFromLight(bevel, light1.direction, light1.color, light1.intensity);
        caustics += computeCausticsFromLight(bevel, light2.direction, light2.color, light2.intensity);
    } else {
        // Single orbiting light
        vec3 lightDir = getLightDirection(u_time);
        vec3 lightColor = getLightColor(lightDir);
        caustics = computeCausticsFromLight(bevel, lightDir, lightColor, 1.0);
    }

    return caustics * u_causticsIntensity;
}

// ============================================
// ABSORPTION - Beer's Law
// Light loses energy as it travels through glass
// ============================================
vec3 computeAbsorption(BevelGeometry bevel, vec3 color) {
    // Beer's Law: I = I₀ × e^(-α × d)
    // α = absorption coefficient (per cm), d = path length (cm)

    // Soda-lime glass absorption coefficients (cm⁻¹)
    // Iron oxide impurities cause the characteristic green tint
    // Green transmits best, red and blue are absorbed more
    vec3 absorptionCoeff = vec3(0.02, 0.005, 0.015);

    // Path length: thicker in center, thinner at beveled edges
    float pathLength = (1.0 - bevel.edgeFactor * 0.5) * u_thickness;

    // Exponential falloff per Beer's Law
    vec3 transmission = exp(-absorptionCoeff * pathLength);

    return color * transmission;
}

void main() {
    vec2 uv = v_uv;
    vec2 p = (uv - 0.5) * u_resolution;

    float padding = 40.0;
    float squareSize = (min(u_resolution.x, u_resolution.y) - padding) * 0.5;
    vec2 size = vec2(squareSize);

    float d = sdSquircle(p, size, u_n);
    BevelGeometry bevel = computeBevelGeometry(p, size, u_n, u_bevelWidth, u_bevelDepth);

    // Compute refraction offset
    vec2 lensRefract = computeRefraction(bevel);

    // Snell's law: deviation angle ≈ (n-1) × surface_angle for small angles
    float refractScale = u_ior - 1.0;
    vec2 baseOffset = lensRefract * refractScale;

    // Blur amount: base blur + extra blur at edges
    float baseBlur = 1.0;
    float edgeBlur = 2.0 * bevel.edgeFactor;
    float totalBlur = baseBlur + edgeBlur;

    // Chromatic dispersion: RGB channels refract at different angles
    // Only applies at edges where there's curvature
    // Higher multiplier for procedural background (needs more offset to be visible)
    float dispersionAmount = u_dispersion * 0.02 * bevel.edgeFactor;
    vec2 dispersionDir = length(bevel.gradDir) > 0.01 ? bevel.gradDir : vec2(1.0, 0.0);

    // Sample blurred background with refraction and optional dispersion
    vec3 refracted;
    if (u_dispersion > 0.01) {
        refracted = blurredBackgroundChromatic(uv + baseOffset * 0.5, totalBlur, dispersionDir, dispersionAmount);
    } else {
        refracted = blurredBackground(uv + baseOffset * 0.5, totalBlur);
    }

    // Apply absorption if enabled (before Fresnel, as it affects transmitted light)
    if (u_absorptionEnabled > 0.5) {
        refracted = computeAbsorption(bevel, refracted);
    }

    // Background without refraction (sharp skybox for outside glass)
    vec3 bg = sharpBackground(uv);

    // Anti-aliased mask
    float mask = 1.0 - smoothstep(-1.5, 1.5, d);

    // Apply Fresnel reflection if enabled
    vec3 glassColor = refracted;
    if (u_fresnelEnabled > 0.5) {
        glassColor = computeFresnelReflection(bevel, refracted, uv);
    }

    // Compose - blurred refracted interior with optional Fresnel
    vec3 color = mix(bg, glassColor, mask);

    // Add specular highlights if enabled
    if (u_specularEnabled > 0.5) {
        vec3 specular = computeSpecularHighlights(bevel);
        color += specular * mask;
    }

    // Add caustics if enabled
    if (u_causticsEnabled > 0.5) {
        vec3 caustics = computeCaustics(bevel);
        color += caustics * mask;
    }

    // Apply ACES tonemapping
    color = ACESFilm(color);

    gl_FragColor = vec4(color, 1.0);
}
