// Glass Blur Shaders - LiquidGlass-inspired frosted glass effect (WebGL 1)

window.GLASS_BLUR_VERTEX_SHADER = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUV;

void main() {
    vUV = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

window.GLASS_BLUR_H_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uBlurRadius;
varying vec2 vUV;

void main() {
    // 9-tap Gaussian weights optimized for linear sampling (2 taps per fetch)
    float weights[3];
    weights[0] = 0.227027027;
    weights[1] = 0.316216216;
    weights[2] = 0.070270270;

    // Bilinear-optimized offsets
    float offsets[3];
    offsets[0] = 0.0;
    offsets[1] = 1.384615385;
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

window.GLASS_PANEL_VERTEX_SHADER = `
precision highp float;
attribute vec2 aPosition;
uniform vec4 uPanelRect;
uniform vec2 uResolution;
varying vec2 vUV;
varying vec2 vLocalUV;
varying vec2 vScreenUV;

void main() {
    vLocalUV = aPosition * 0.5 + 0.5;
    vec2 clipPos = uPanelRect.xy + vLocalUV * uPanelRect.zw;
    vScreenUV = clipPos * 0.5 + 0.5;
    vUV = vLocalUV;
    gl_Position = vec4(clipPos, 0.0, 1.0);
}
`;

window.GLASS_PANEL_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uBlurredScene;
uniform vec2 uResolution;
uniform vec2 uPanelSize;
uniform float uEdgeSoftness;
uniform float uIOR; // Index of Refraction (1.0=air, 1.5=glass, 2.0+=crystal)
uniform float uSquircleN;
uniform float uSpecularIntensity;
uniform float uSpecularSharpness;
uniform float uEdgeWidth;
uniform float uBevelDepth;
uniform float uCausticsIntensity;
uniform float uCausticsScale;
uniform float uDispersion;
uniform float uThickness;
uniform vec3 uLight0WorldPos;
uniform vec3 uLight0Color;
uniform float uLight0Intensity;
uniform vec3 uLight1WorldPos;
uniform vec3 uLight1Color;
uniform float uLight1Intensity;
uniform vec3 uLight2WorldPos;
uniform vec3 uLight2Color;
uniform float uLight2Intensity;
uniform vec3 uCameraPos;
uniform vec3 uPanelWorldPos;
uniform float uAspectRatio;
uniform float uExposure;
uniform sampler2D uSdfTexture;
uniform int uSdfBumpEnabled;
uniform float uSdfBumpStrength;
uniform float uSdfBumpPow;
uniform vec2 uSdfOffset;
uniform float uSdfScale;
uniform float uSdfDistance;
uniform float uDustDensity;
uniform float uDustSize;
uniform float uDustBrightness;

varying vec2 vUV;
varying vec2 vLocalUV;
varying vec2 vScreenUV;

// ACES filmic curve: (x(ax+b))/(x(cx+d)+e)
vec3 applyToneMapping(vec3 color) {
    color *= uExposure;
    float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

// Squircle SDF: |x/a|^n + |y/b|^n = 1
float sdSquircle(vec2 p, vec2 size, float n) {
    vec2 d = abs(p) / size;
    float dist = pow(pow(d.x, n) + pow(d.y, n), 1.0 / n);
    return (dist - 1.0) * min(size.x, size.y);
}

struct BevelGeometry {
    vec2 gradDir;
    float bevelAmount;
    float edgeFactor;
};

BevelGeometry computeBevelGeometry(vec2 uv, vec2 size, float squircleN, float edgeWidth, float bevelDepth) {
    BevelGeometry result;
    vec2 p = (uv - 0.5) * size;
    vec2 halfSize = size * 0.5;

    float d = sdSquircle(p, halfSize, squircleN);
    float edgeDist = -d;

    result.edgeFactor = 1.0 - smoothstep(0.0, edgeWidth, edgeDist);
    float zonePos = clamp(1.0 - edgeDist / edgeWidth, 0.0, 1.0);
    // Lens curvature profile: circular arc derivative gives surface angle
    // surfaceAngle = atan(x / sqrt(r² - x²)) where x = zonePos, r² = 1/bevelDepth
    // For bevelDepth=1: max angle = 45° (π/4) at edge
    // Clamp to avoid division by zero at the singularity
    float x2 = zonePos * zonePos * bevelDepth;
    float denom = max(1.0 - x2, 0.01); // Prevent sqrt of negative or near-zero
    float surfaceAngle = atan(zonePos * sqrt(bevelDepth) / sqrt(denom));
    result.bevelAmount = surfaceAngle * result.edgeFactor;

    float eps = max(2.0, edgeWidth * 0.05);
    float dx = sdSquircle(p + vec2(eps, 0.0), halfSize, squircleN) - sdSquircle(p - vec2(eps, 0.0), halfSize, squircleN);
    float dy = sdSquircle(p + vec2(0.0, eps), halfSize, squircleN) - sdSquircle(p - vec2(0.0, eps), halfSize, squircleN);
    result.gradDir = normalize(vec2(dx, dy) / size + 0.0001);

    return result;
}

vec2 computeRefraction(BevelGeometry bevel) {
    return bevel.gradDir * bevel.bevelAmount;
}

float fresnelSchlick(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

float computePhongSpecular(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 cameraLookDir, vec3 panelNormal, float shininess, float F0) {
    float dotCheck = dot(lightDir, cameraLookDir);
    vec3 reflectedLight = reflect(-lightDir, normal);
    float RdotV = dot(reflectedLight, viewDir);
    float normalTilt = 1.0 - max(dot(normal, panelNormal), 0.0);
    float threshold = mix(0.0, -0.5, normalTilt);

    if (dotCheck < threshold) return 0.0;
    if (RdotV <= 0.0) return 0.0;

    vec3 halfVec = normalize(viewDir + lightDir);
    float NdotH = max(dot(normal, halfVec), 0.0);
    float F = fresnelSchlick(NdotH, F0);
    float exponent = shininess * shininess / 32.0;
    float normFactor = (exponent + 2.0) / 6.28318530718; // 2PI
    float specLobe = normFactor * pow(RdotV, exponent);

    return F * specLobe;
}

vec3 computeSpecularHighlights(BevelGeometry bevel, vec2 screenUV) {
    vec3 panelToCamera = uCameraPos - uPanelWorldPos;
    float distToCamera = length(panelToCamera);
    vec3 panelNormal = distToCamera > 0.001 ? panelToCamera / distToCamera : vec3(0.0, 0.0, 1.0);

    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 panelRight = normalize(cross(worldUp, panelNormal));
    if (length(cross(worldUp, panelNormal)) < 0.001) panelRight = vec3(1.0, 0.0, 0.0);
    vec3 panelUp = cross(panelNormal, panelRight);

    vec3 surfacePos = uCameraPos;
    vec3 viewDir = -panelNormal;
    vec3 cameraLookDir = -panelNormal;

    vec2 worldGrad = normalize(bevel.gradDir * vec2(uAspectRatio, 1.0) + 0.0001);
    vec3 bevelWorldDir = panelRight * (-worldGrad.x) + panelUp * (-worldGrad.y);

    float bevelAngle = bevel.bevelAmount * 0.785398 * uBevelDepth; // PI/4 = 45deg max
    float sinB = sin(bevelAngle);
    float cosB = cos(bevelAngle);
    vec3 normal = normalize(panelNormal * cosB + bevelWorldDir * sinB);

    float F0 = 0.04; // Glass fresnel at normal incidence: ((1-1.5)/(1+1.5))²
    vec3 specular = vec3(0.0);

    if (uLight0Intensity > 0.01) {
        vec3 lightDir = normalize(uLight0WorldPos - surfacePos);
        specular += uLight0Color * computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0) * uLight0Intensity;
    }
    if (uLight1Intensity > 0.01) {
        vec3 lightDir = normalize(uLight1WorldPos - surfacePos);
        specular += uLight1Color * computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0) * uLight1Intensity;
    }
    if (uLight2Intensity > 0.01) {
        vec3 lightDir = normalize(uLight2WorldPos - surfacePos);
        specular += uLight2Color * computePhongSpecular(normal, viewDir, lightDir, cameraLookDir, panelNormal, uSpecularSharpness, F0) * uLight2Intensity;
    }

    return specular * uSpecularIntensity;
}

vec3 computeCaustics(BevelGeometry bevel, vec2 screenUV) {
    if (uCausticsIntensity < 0.001 || bevel.edgeFactor < 0.01) return vec3(0.0);

    vec3 panelToCamera = uCameraPos - uPanelWorldPos;
    float distToCamera = length(panelToCamera);
    vec3 panelNormal = distToCamera > 0.001 ? panelToCamera / distToCamera : vec3(0.0, 0.0, 1.0);

    // Build panel coordinate frame
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 panelRight = normalize(cross(worldUp, panelNormal));
    if (length(cross(worldUp, panelNormal)) < 0.001) panelRight = vec3(1.0, 0.0, 0.0);
    vec3 panelUp = cross(panelNormal, panelRight);

    // Bevel gradient in world space - this is the direction the cylindrical lens focuses ALONG
    // Light perpendicular to this direction gets focused the most
    vec2 worldGrad = normalize(bevel.gradDir * vec2(uAspectRatio, 1.0) + 0.0001);
    vec3 bevelAxis = panelRight * worldGrad.x + panelUp * worldGrad.y;
    // The focusing direction is perpendicular to the bevel axis (in the panel plane)
    vec3 focusDir = cross(panelNormal, bevelAxis);

    // Caustic band shape: peaks within the bevel zone (0-1 range)
    float bandShape = pow(bevel.edgeFactor * (1.0 - bevel.edgeFactor * 0.5), 0.5 / uCausticsScale);

    // Focusing power from bevel curvature AND IOR
    // Lens power is proportional to (n - 1) where n is refractive index
    // Air=1.0, Water=1.33, Glass=1.5, Crystal=1.8, Diamond=2.4
    // Normalized so glass (1.5) gives factor of 1.0
    float iorFactor = (uIOR - 1.0) / 0.5; // glass=1.0, diamond=2.8, water=0.66
    float focusingPower = bevel.bevelAmount * bevel.bevelAmount * 2.0 * iorFactor;

    vec3 caustics = vec3(0.0);

    if (uLight0Intensity > 0.01) {
        vec3 lightDir = normalize(uLight0WorldPos - uPanelWorldPos);
        // Project light onto panel plane
        vec3 lightOnPanel = lightDir - panelNormal * dot(lightDir, panelNormal);
        float lightOnPanelLen = length(lightOnPanel);
        // How much of the light is in the focusing direction (perpendicular to bevel axis)
        // Use squared falloff and add baseline so it never goes fully black
        float rawAlignment = lightOnPanelLen > 0.01 ? abs(dot(normalize(lightOnPanel), focusDir)) : 0.0;
        float focusAlignment = 0.3 + 0.7 * rawAlignment * rawAlignment;
        // Light must also be coming from the front
        float frontFacing = max(dot(lightDir, panelNormal), 0.0);
        caustics += uLight0Color * min(uLight0Intensity, 2.0) * focusingPower * focusAlignment * frontFacing * bandShape;
    }
    if (uLight1Intensity > 0.01) {
        vec3 lightDir = normalize(uLight1WorldPos - uPanelWorldPos);
        vec3 lightOnPanel = lightDir - panelNormal * dot(lightDir, panelNormal);
        float lightOnPanelLen = length(lightOnPanel);
        float rawAlignment = lightOnPanelLen > 0.01 ? abs(dot(normalize(lightOnPanel), focusDir)) : 0.0;
        float focusAlignment = 0.3 + 0.7 * rawAlignment * rawAlignment;
        float frontFacing = max(dot(lightDir, panelNormal), 0.0);
        caustics += uLight1Color * min(uLight1Intensity, 2.0) * focusingPower * focusAlignment * frontFacing * bandShape;
    }
    if (uLight2Intensity > 0.01) {
        vec3 lightDir = normalize(uLight2WorldPos - uPanelWorldPos);
        vec3 lightOnPanel = lightDir - panelNormal * dot(lightDir, panelNormal);
        float lightOnPanelLen = length(lightOnPanel);
        float rawAlignment = lightOnPanelLen > 0.01 ? abs(dot(normalize(lightOnPanel), focusDir)) : 0.0;
        float focusAlignment = 0.3 + 0.7 * rawAlignment * rawAlignment;
        float frontFacing = max(dot(lightDir, panelNormal), 0.0);
        caustics += uLight2Color * min(uLight2Intensity, 2.0) * focusingPower * focusAlignment * frontFacing * bandShape;
    }

    return max(caustics, vec3(0.0)) * uCausticsIntensity;
}

// Procedural dust particles on glass surface
// Uses layered hash functions to create natural-looking dust distribution
float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

vec3 computeDust(vec2 localUV, vec2 panelSize) {
    if (uDustDensity < 0.001 || uDustBrightness < 0.001) return vec3(0.0);

    // Scale UV to create dust cells - smaller size = more particles
    float cellScale = 800.0 / max(uDustSize, 0.1);
    vec2 scaledUV = localUV * panelSize / vec2(max(panelSize.x, panelSize.y)) * cellScale;

    // Get cell coordinates
    vec2 cellId = floor(scaledUV);
    vec2 cellUV = fract(scaledUV);

    vec3 dust = vec3(0.0);

    // Check this cell and neighbors for smooth falloff
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 id = cellId + neighbor;

            // Random position within cell
            float rand = hash21(id);
            if (rand > uDustDensity) continue; // Skip based on density

            // Random offset for particle position within cell
            vec2 particlePos = vec2(hash21(id + 0.1), hash21(id + 0.2)) * 0.8 + 0.1;
            vec2 diff = neighbor + particlePos - cellUV;

            // Distance to particle center
            float dist = length(diff);

            // Particle size variation
            float sizeVar = 0.3 + hash21(id + 0.3) * 0.7;
            float particleRadius = 0.15 * sizeVar;

            // Soft circular particle
            float particle = 1.0 - smoothstep(0.0, particleRadius, dist);

            // Brightness variation per particle
            float brightness = 0.5 + hash21(id + 0.4) * 0.5;

            dust += vec3(particle * brightness);
        }
    }

    // Accumulate light from all sources
    vec3 panelToCamera = uCameraPos - uPanelWorldPos;
    vec3 panelNormal = normalize(panelToCamera);
    vec3 viewDir = panelNormal;

    vec3 lightContrib = vec3(0.0);

    // Dust catches specular highlights from lights
    if (uLight0Intensity > 0.01) {
        vec3 lightDir = normalize(uLight0WorldPos - uPanelWorldPos);
        vec3 halfVec = normalize(viewDir + lightDir);
        float NdotH = max(dot(panelNormal, halfVec), 0.0);
        float spec = pow(NdotH, 32.0);
        lightContrib += uLight0Color * uLight0Intensity * (0.2 + spec * 0.8);
    }
    if (uLight1Intensity > 0.01) {
        vec3 lightDir = normalize(uLight1WorldPos - uPanelWorldPos);
        vec3 halfVec = normalize(viewDir + lightDir);
        float NdotH = max(dot(panelNormal, halfVec), 0.0);
        float spec = pow(NdotH, 32.0);
        lightContrib += uLight1Color * uLight1Intensity * (0.2 + spec * 0.8);
    }
    if (uLight2Intensity > 0.01) {
        vec3 lightDir = normalize(uLight2WorldPos - uPanelWorldPos);
        vec3 halfVec = normalize(viewDir + lightDir);
        float NdotH = max(dot(panelNormal, halfVec), 0.0);
        float spec = pow(NdotH, 32.0);
        lightContrib += uLight2Color * uLight2Intensity * (0.2 + spec * 0.8);
    }

    return dust * lightContrib * uDustBrightness;
}

// Mirror UV to stay in valid range
vec2 mirrorUV(vec2 uv) {
    return abs(mod(uv + 1.0, 2.0) - 1.0);
}

struct SdfBump {
    vec2 gradient;
    float bumpAmount;
};

SdfBump computeSdfBump(vec2 localUV) {
    SdfBump result;
    result.gradient = vec2(0.0);
    result.bumpAmount = 0.0;

    if (uSdfBumpEnabled == 0) return result;

    vec2 flippedUV = vec2(localUV.x, 1.0 - localUV.y);
    vec2 sdfUV = (flippedUV - 0.5) / uSdfScale + 0.5 + uSdfOffset;

    if (sdfUV.x < 0.0 || sdfUV.x > 1.0 || sdfUV.y < 0.0 || sdfUV.y > 1.0) return result;

    float sdfValue = texture2D(uSdfTexture, sdfUV).r;
    float edgeWidth = uSdfDistance * 0.5;
    float distMask = 1.0 - smoothstep(0.0, edgeWidth, abs(sdfValue - 0.5));

    float eps = 0.005 / uSdfScale;
    float dx = texture2D(uSdfTexture, sdfUV + vec2(eps, 0.0)).r - texture2D(uSdfTexture, sdfUV - vec2(eps, 0.0)).r;
    float dy = texture2D(uSdfTexture, sdfUV + vec2(0.0, eps)).r - texture2D(uSdfTexture, sdfUV - vec2(0.0, eps)).r;

    dx = sign(dx) * pow(abs(dx), uSdfBumpPow);
    dy = sign(dy) * pow(abs(dy), uSdfBumpPow);
    result.gradient = vec2(dx, -dy);

    float strength = abs(uSdfBumpStrength);
    float signDir = sign(uSdfBumpStrength);
    result.bumpAmount = length(result.gradient) * strength * distMask;

    if (length(result.gradient) > 0.001) result.gradient = normalize(result.gradient) * signDir;

    return result;
}

void main() {
    vec2 pixelSize = uPanelSize;
    vec2 p = (vLocalUV - 0.5) * pixelSize;
    vec2 b = pixelSize * 0.5;

    float d = sdSquircle(p, b, uSquircleN);
    float mask = 1.0 - smoothstep(-uEdgeSoftness, uEdgeSoftness, d);

    if (mask < 0.001) discard;

    BevelGeometry bevel = computeBevelGeometry(vLocalUV, pixelSize, uSquircleN, uEdgeWidth, uBevelDepth);

    SdfBump sdfBump = computeSdfBump(vLocalUV);
    if (sdfBump.bumpAmount > 0.001) {
        vec2 combinedGrad = bevel.gradDir * bevel.bevelAmount + sdfBump.gradient * sdfBump.bumpAmount;
        float combinedAmount = length(combinedGrad);
        if (combinedAmount > 0.001) {
            bevel.gradDir = normalize(combinedGrad);
            bevel.bevelAmount = combinedAmount;
        }
    }

    vec2 lensRefract = computeRefraction(bevel);
    // Snell's law: deviation angle ≈ (n-1) × surface_angle for small angles
    // bevelAmount is now the actual surface tilt in radians, so this is physically correct
    float refractScale = uIOR - 1.0;
    vec2 baseOffset = lensRefract * refractScale;

    // Chromatic dispersion: RGB channels sample at different offsets along bevel direction
    // Physically, blue bends more than red due to higher IOR
    float dispersionAmount = uDispersion * 0.003 * bevel.edgeFactor; // Only at edges
    vec2 dispersionDir = length(bevel.gradDir) > 0.01 ? bevel.gradDir : vec2(1.0, 0.0);

    vec2 uvR = vScreenUV + baseOffset - dispersionDir * dispersionAmount;
    vec2 uvG = vScreenUV + baseOffset;
    vec2 uvB = vScreenUV + baseOffset + dispersionDir * dispersionAmount;

    vec3 blurredColor = vec3(
        texture2D(uBlurredScene, mirrorUV(uvR)).r,
        texture2D(uBlurredScene, mirrorUV(uvG)).g,
        texture2D(uBlurredScene, mirrorUV(uvB)).b
    );

    // Beer's Law absorption: thicker glass absorbs more light
    // uThickness is in centimeters, absorption coefficients in cm⁻¹
    // Soda-lime glass (common window glass) absorption due to iron oxide impurities
    vec3 absorptionCoeff = vec3(0.02, 0.005, 0.015); // cm⁻¹ (R, G, B) - green transmits best
    float pathLength = (1.0 - bevel.edgeFactor * 0.5) * uThickness; // cm, thinner at beveled edges
    vec3 absorption = exp(-absorptionCoeff * pathLength);
    blurredColor *= absorption;

    vec3 color = applyToneMapping(blurredColor);
    color += computeSpecularHighlights(bevel, vScreenUV);
    color += computeCaustics(bevel, vScreenUV);
    color += computeDust(vLocalUV, pixelSize);

    gl_FragColor = vec4(vec3(color), mask);
}
`;

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

window.GLASS_BLIT_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uSource;
varying vec2 vUV;

void main() {
    gl_FragColor = texture2D(uSource, vUV);
}
`;
