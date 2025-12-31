// BACKUP: Glass refraction shader with procedural sky
// This version has expensive FBM-based cloud generation
// Saved for reference - use glass-refraction.glsl for production

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
uniform float u_sunAngle;
uniform float u_causticsEnabled;
uniform float u_causticsIntensity;
uniform float u_absorptionEnabled;
uniform float u_thickness;
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

// Smooth noise for organic shapes
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
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
// CUBEMAP-STYLE ENVIRONMENT SAMPLING
// Supports single light or multiple lights
// Uses realistic inverse-square light falloff
// ============================================

// Compute light influence on a direction (for sky coloring)
float computeLightInfluence(vec3 dir, vec3 lightDir) {
    float sunDot = dot(dir, lightDir);
    float angularDist = 1.0 - sunDot;
    float lightScale = 3.0;
    float lightFalloff = 2.0;
    return 1.0 / (1.0 + pow(angularDist * lightScale, lightFalloff));
}

// Sample environment with multiple lights
vec3 sampleEnvironmentMultiLight(vec3 dir) {
    float t = u_time * 0.15;
    vec2 uv = dir.xy * 0.5 + 0.5;

    // Get all three lights
    LightData light0 = getLight0();
    LightData light1 = getLight1();
    LightData light2 = getLight2();

    // Compute influence of each light
    float influence0 = computeLightInfluence(dir, light0.direction) * light0.intensity;
    float influence1 = computeLightInfluence(dir, light1.direction) * light1.intensity;
    float influence2 = computeLightInfluence(dir, light2.direction) * light2.intensity;

    // Combined light influence and color
    float totalInfluence = influence0 + influence1 + influence2;
    vec3 combinedColor = light0.color * influence0 + light1.color * influence1 + light2.color * influence2;

    // FBM-based cloud pattern - higher frequency for smaller clouds
    vec2 q = vec2(fbm(uv * 3.0 + t * 0.3), fbm(uv * 3.0 + vec2(5.2, 1.3)));
    vec2 r = vec2(fbm(uv * 4.5 + q + t * 0.2), fbm(uv * 4.5 + q + vec2(1.7, 9.2)));
    float f = fbm(uv * 2.5 + r);

    // Sky gradient
    float verticalGrad = dir.y * 0.5 + 0.5;
    vec3 horizonColor = vec3(0.15, 0.1, 0.2);
    vec3 zenithColor = vec3(0.02, 0.05, 0.12);
    vec3 baseSky = mix(horizonColor, zenithColor, smoothstep(0.0, 0.8, verticalGrad));

    // Tint sky towards combined light color
    vec3 tintColor = combinedColor * 0.5 + vec3(0.3);
    baseSky = mix(baseSky, tintColor * 0.3, min(totalInfluence * 0.4, 0.5));

    // Clouds with increased contrast
    vec3 cloudBright = combinedColor + vec3(0.6);
    vec3 cloudDark = vec3(0.02, 0.02, 0.04);
    vec3 cloudMid = vec3(0.1, 0.08, 0.15);

    // Cloud blending - tighter smoothstep for sharper edges
    float cloudMask = smoothstep(0.35, 0.6, f);
    vec3 clouds = mix(cloudDark, cloudMid, smoothstep(0.2, 0.45, f));
    clouds = mix(clouds, cloudBright, smoothstep(0.5, 0.7, f) * min(totalInfluence + 0.35, 1.0));

    vec3 color = mix(baseSky, clouds, cloudMask * 0.9);

    // Wisps - higher frequency
    float highlight = fbm(uv * 7.0 + vec2(t * 0.5, 0.0));
    color = mix(color, combinedColor * 0.65, smoothstep(0.5, 0.75, highlight) * 0.22);

    // Add glow from each light source
    color += light0.color * influence0 * 0.4;
    color += light1.color * influence1 * 0.4;
    color += light2.color * influence2 * 0.4;

    return color;
}

// Single-light version (original)
vec3 sampleEnvironment(vec3 dir, vec3 sunDir, vec3 sunColor) {
    float t = u_time * 0.15;

    // Map 3D direction to 2D for cloud sampling
    vec2 uv = dir.xy * 0.5 + 0.5;

    // Realistic light falloff using inverse-power law
    float sunInfluence = computeLightInfluence(dir, sunDir);

    // FBM-based cloud pattern - higher frequency for smaller clouds
    vec2 q = vec2(fbm(uv * 3.0 + t * 0.3), fbm(uv * 3.0 + vec2(5.2, 1.3)));
    vec2 r = vec2(fbm(uv * 4.5 + q + t * 0.2), fbm(uv * 4.5 + q + vec2(1.7, 9.2)));
    float f = fbm(uv * 2.5 + r);

    // Sky gradient
    float verticalGrad = dir.y * 0.5 + 0.5;

    // Base sky colors - dark blue/purple tones
    vec3 horizonColor = vec3(0.15, 0.1, 0.2);
    vec3 zenithColor = vec3(0.02, 0.05, 0.12);
    vec3 baseSky = mix(horizonColor, zenithColor, smoothstep(0.0, 0.8, verticalGrad));

    // Warm tones near sun using realistic falloff
    vec3 warmHorizon = vec3(0.6, 0.35, 0.12);
    vec3 warmMid = vec3(0.4, 0.25, 0.15);
    baseSky = mix(baseSky, warmMid, sunInfluence * 0.5);
    baseSky = mix(baseSky, warmHorizon, sunInfluence * sunInfluence * 0.4);

    // Clouds with increased contrast
    vec3 cloudBright = vec3(1.0, 0.85, 0.7);
    vec3 cloudDark = vec3(0.02, 0.02, 0.04);
    vec3 cloudMid = vec3(0.1, 0.08, 0.15);

    // Cloud blending - tighter smoothstep for sharper edges
    float cloudMask = smoothstep(0.35, 0.6, f);
    vec3 clouds = mix(cloudDark, cloudMid, smoothstep(0.2, 0.45, f));
    clouds = mix(clouds, cloudBright, smoothstep(0.5, 0.7, f) * (sunInfluence + 0.35));

    vec3 color = mix(baseSky, clouds, cloudMask * 0.9);

    // Golden streaks near sun - higher frequency
    float warmStreak = fbm(uv * 7.0 + vec2(t * 0.4, -t * 0.2));
    vec3 goldenWisp = vec3(0.7, 0.5, 0.25);
    color = mix(color, goldenWisp, smoothstep(0.5, 0.75, warmStreak) * sunInfluence * 0.5);

    // Wisps - higher frequency
    float highlight = fbm(uv * 8.0 + vec2(t * 0.5, 0.0));
    vec3 hlWarm = vec3(0.85, 0.65, 0.45);
    vec3 hlCool = vec3(0.1, 0.08, 0.18);
    vec3 hlColor = mix(hlCool, hlWarm, sunInfluence);
    color = mix(color, hlColor, smoothstep(0.5, 0.72, highlight) * 0.28);

    // Soft sun glow (no hard disc) - uses inverse-square falloff
    color += sunColor * sunInfluence * 0.5;

    return color;
}

// Background: what we see through the glass (looking into -Z)
vec3 proceduralBackground(vec2 uv) {
    // Convert screen UV to a direction looking behind the glass
    vec2 centered = (uv - 0.5) * 2.0;
    float z = sqrt(max(0.0, 1.0 - dot(centered, centered) * 0.5));
    vec3 viewDir = normalize(vec3(centered.x, centered.y, -z));

    vec3 color;
    if (u_multiLightEnabled > 0.5) {
        color = sampleEnvironmentMultiLight(viewDir);
    } else {
        vec3 sunDir = getLightDirection(u_time);
        vec3 sunColor = getLightColor(sunDir);
        color = sampleEnvironment(viewDir, sunDir, sunColor);
    }

    // Soft vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.2);
    vignette = smoothstep(0.0, 0.7, vignette);
    color *= 0.7 + 0.3 * vignette;

    return color;
}

// Blurred background sample - box blur with variable radius
vec3 blurredBackground(vec2 uv, float blurAmount) {
    vec3 color = vec3(0.0);

    // Blur radius in UV space
    float radius = blurAmount * 0.015;

    // 9-tap box blur
    float samples = 0.0;
    for (float x = -1.0; x <= 1.0; x += 1.0) {
        for (float y = -1.0; y <= 1.0; y += 1.0) {
            vec2 offset = vec2(x, y) * radius;
            color += proceduralBackground(uv + offset);
            samples += 1.0;
        }
    }

    return color / samples;
}

// Blurred background with chromatic dispersion
// Blue bends more than red (higher IOR for shorter wavelengths)
vec3 blurredBackgroundChromatic(vec2 uv, float blurAmount, vec2 dispersionDir, float dispersionAmount) {
    // Sample each channel at different offsets
    // Red bends least, blue bends most
    vec2 uvR = uv - dispersionDir * dispersionAmount;
    vec2 uvG = uv;
    vec2 uvB = uv + dispersionDir * dispersionAmount;

    // Reduce blur for chromatic sampling to preserve color separation
    float reducedBlur = blurAmount * 0.5;

    return vec3(
        blurredBackground(uvR, reducedBlur).r,
        blurredBackground(uvG, reducedBlur).g,
        blurredBackground(uvB, reducedBlur).b
    );
}

// Get light direction - controlled by u_sunAngle uniform
// Full 3D orbit: sun goes around the glass in all directions
vec3 getLightDirection(float t) {
    // Use u_sunAngle if set (> -99), otherwise animate with time
    float angle = u_sunAngle > -99.0 ? u_sunAngle : t * 0.3;

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
    if (u_multiLightEnabled > 0.5) {
        return sampleEnvironmentMultiLight(reflectDir);
    } else {
        vec3 sunDir = getLightDirection(u_time);
        vec3 sunColor = getLightColor(sunDir);
        return sampleEnvironment(reflectDir, sunDir, sunColor);
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
vec3 computeFresnelReflection(BevelGeometry bevel, vec3 refractedColor) {
    vec3 normal = computeSurfaceNormal(bevel);
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    // Fresnel - how much light is reflected vs refracted
    float NdotV = max(dot(normal, viewDir), 0.0);
    float F0 = 0.04; // Glass at normal incidence
    float fresnel = fresnelSchlick(NdotV, F0);

    // Boost fresnel for more visible reflections on the bevel
    // The bevel creates grazing angles where reflection should be strong
    fresnel = fresnel + bevel.edgeFactor * 0.3;

    // Scale by reflection intensity uniform
    fresnel = fresnel * u_reflectionIntensity;

    // Compute reflection direction
    vec3 reflectDir = reflect(-viewDir, normal);

    // Sample environment map for reflection
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

    // Background without refraction (sharp)
    vec3 bg = proceduralBackground(uv);

    // Anti-aliased mask
    float mask = 1.0 - smoothstep(-1.5, 1.5, d);

    // Apply Fresnel reflection if enabled
    vec3 glassColor = refracted;
    if (u_fresnelEnabled > 0.5) {
        glassColor = computeFresnelReflection(bevel, refracted);
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
