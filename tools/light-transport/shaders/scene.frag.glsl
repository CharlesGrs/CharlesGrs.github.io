#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform vec3 uSigma;
uniform float uMaxDepth;
uniform int uPhenomenon;
uniform float uParticleSize;
uniform float uDensity;
uniform float uTime;
uniform vec2 uResolution;
uniform float uCameraRotX;
uniform float uCameraRotY;

#define PI 3.14159265359
#define MAX_STEPS 64
#define MAX_DIST 50.0
#define SURF_DIST 0.001

// ============ Noise Functions ============
float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise3D(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// 2D overload for convenience
float fbm(vec2 p) {
    return fbm(vec3(p, 0.0));
}

// ============ Scattering Physics ============
float rayleighCoeff(float wavelength, float base) {
    float lambda = wavelength / 550.0;
    return base / pow(lambda, 4.0);
}

float mieCoeff(float size, float wavelength, float base) {
    float x = 6.283185 * size / (wavelength / 1000.0);
    if (x < 0.1) return rayleighCoeff(wavelength, base);
    if (x > 10.0) return base;
    float t = (x - 0.1) / 9.9;
    return mix(rayleighCoeff(wavelength, base), base, t);
}

// Henyey-Greenstein phase function for Mie
float hgPhase(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return (1.0 - g2) / (4.0 * PI * pow(denom, 1.5));
}

// Rayleigh phase function
float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
}

vec3 getSigma() {
    vec3 wavelengths = vec3(700.0, 550.0, 450.0);
    vec3 sigma;

    if (uPhenomenon == 0) {
        // Beer-Lambert: direct absorption coefficients
        sigma = uSigma;
    } else if (uPhenomenon == 1) {
        // Rayleigh: wavelength-dependent scattering
        float base = (uSigma.r + uSigma.g + uSigma.b) / 3.0;
        sigma = vec3(
            rayleighCoeff(wavelengths.r, base),
            rayleighCoeff(wavelengths.g, base),
            rayleighCoeff(wavelengths.b, base)
        ) * uDensity;
    } else if (uPhenomenon == 2) {
        // Mie: particle-size dependent
        float base = (uSigma.r + uSigma.g + uSigma.b) / 3.0;
        sigma = vec3(
            mieCoeff(uParticleSize, wavelengths.r, base),
            mieCoeff(uParticleSize, wavelengths.g, base),
            mieCoeff(uParticleSize, wavelengths.b, base)
        ) * uDensity;
    } else {
        // Combined: absorption + scattering
        vec3 absorption = uSigma;
        vec3 scattering = vec3(
            mieCoeff(uParticleSize, wavelengths.r, 0.1),
            mieCoeff(uParticleSize, wavelengths.g, 0.1),
            mieCoeff(uParticleSize, wavelengths.b, 0.1)
        ) * uDensity;
        sigma = absorption + scattering;
    }

    return sigma * 0.5; // Scale for scene
}

vec3 getTransmittance(float depth, vec3 sigma) {
    return exp(-sigma * depth);
}

// ============ Scene SDFs ============
float sdPlane(vec3 p, vec3 n, float h) {
    return dot(p, n) + h;
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdCylinder(vec3 p, float r, float h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// Tree silhouette for Mie scene
float sdTree(vec3 p, vec3 treePos) {
    vec3 q = p - treePos;
    float trunk = sdCylinder(q, 0.15, 3.0);
    float canopy = sdSphere(q - vec3(0, 4.5, 0), 2.0);
    return min(trunk, canopy);
}

// ============ Scene Distance Functions ============
float sceneBeerLambert(vec3 p) {
    // Underwater: water surface above, sandy floor below
    float surface = -p.y + 8.0 + sin(p.x * 0.5 + uTime) * 0.3 + sin(p.z * 0.7 + uTime * 0.7) * 0.2;
    float floor = p.y + 5.0 + fbm(p * 0.5) * 0.5;
    return min(surface, floor);
}

float sceneRayleigh(vec3 p) {
    // Atmosphere: ground plane
    float ground = p.y + 1.0;
    return ground;
}

float sceneMie(vec3 p) {
    // Foggy forest: ground with trees
    float ground = p.y + 0.5 + fbm(p.xz * 0.3) * 0.3;

    // Add some tree silhouettes
    float trees = MAX_DIST;
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec3 treePos = vec3(
            sin(fi * 2.4) * 8.0 + cos(fi * 1.1) * 4.0,
            0.0,
            -5.0 - fi * 4.0 + sin(fi * 3.7) * 3.0
        );
        trees = min(trees, sdTree(p, treePos));
    }

    return min(ground, trees);
}

float sceneCombined(vec3 p) {
    // Murky water with particles
    float surface = -p.y + 6.0 + sin(p.x * 0.3 + uTime * 0.5) * 0.4;
    float floor = p.y + 4.0 + fbm(p * 0.3 + uTime * 0.1) * 0.8;
    return min(surface, floor);
}

float sceneSDF(vec3 p) {
    if (uPhenomenon == 0) return sceneBeerLambert(p);
    if (uPhenomenon == 1) return sceneRayleigh(p);
    if (uPhenomenon == 2) return sceneMie(p);
    return sceneCombined(p);
}

vec3 getNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        sceneSDF(p + e.xyy) - sceneSDF(p - e.xyy),
        sceneSDF(p + e.yxy) - sceneSDF(p - e.yxy),
        sceneSDF(p + e.yyx) - sceneSDF(p - e.yyx)
    ));
}

// ============ God Rays / Volumetric Light ============
vec3 volumetricLight(vec3 ro, vec3 rd, vec3 lightDir, vec3 sigma, float maxDist) {
    vec3 inscatter = vec3(0.0);
    float stepSize = maxDist / 32.0;

    for (int i = 0; i < 32; i++) {
        float t = float(i) * stepSize;
        vec3 p = ro + rd * t;

        // Check if we're in the medium
        float d = sceneSDF(p);
        if (d < 0.1) continue;

        // Transmittance to this point
        vec3 T = getTransmittance(t, sigma);

        // Light visibility with noise for god rays
        float lightDist = max(0.0, dot(p, -lightDir));
        vec3 lightT = getTransmittance(lightDist * 0.3, sigma);

        // Phase function
        float cosTheta = dot(rd, -lightDir);
        float phase;
        if (uPhenomenon == 1) {
            phase = rayleighPhase(cosTheta);
        } else if (uPhenomenon == 2 || uPhenomenon == 3) {
            phase = hgPhase(cosTheta, 0.7);
        } else {
            phase = 0.25 / PI;
        }

        // Add noise for volumetric variation
        float noiseVal = fbm(p * 0.5 + uTime * 0.1);
        float density = 1.0 + noiseVal * 0.5;

        inscatter += T * lightT * phase * sigma * density * stepSize;
    }

    return inscatter;
}

// ============ Caustics ============
float caustics(vec3 p) {
    vec2 uv = p.xz * 0.5;
    float c = 0.0;

    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float scale = 1.0 + fi * 0.5;
        float speed = 0.3 + fi * 0.1;

        vec2 st = uv * scale;
        st += vec2(sin(uTime * speed + st.y * 2.0), cos(uTime * speed * 0.7 + st.x * 2.0)) * 0.3;

        float wave = sin(st.x * 3.0 + uTime) * sin(st.y * 3.0 + uTime * 0.8);
        c += wave * (1.0 / (1.0 + fi));
    }

    return smoothstep(-0.2, 1.0, c) * 0.5;
}

// ============ Sun Rendering ============
vec3 renderSun(vec3 rd, vec3 lightDir, vec3 sigma) {
    float sunDot = dot(rd, -lightDir);

    // Sun disc
    float sunDisc = smoothstep(0.995, 0.999, sunDot);

    // Sun glow / halo
    float sunGlow = pow(max(0.0, sunDot), 8.0);

    // Scattering halo (stronger for Rayleigh)
    float halo = pow(max(0.0, sunDot), 64.0);

    vec3 sunColor = vec3(1.0, 0.95, 0.8);

    if (uPhenomenon == 1) {
        // Rayleigh: sun appears more orange/red when low
        float horizon = 1.0 - abs(lightDir.y);
        sunColor = mix(vec3(1.0, 0.9, 0.7), vec3(1.0, 0.5, 0.2), horizon * horizon);
    }

    return sunColor * (sunDisc * 2.0 + sunGlow * 0.5 + halo * 0.3);
}

// ============ Sky Rendering ============
vec3 skyColor(vec3 rd, vec3 lightDir, vec3 sigma) {
    if (uPhenomenon == 1) {
        // Rayleigh sky gradient
        float y = max(0.0, rd.y);
        float horizon = 1.0 - y;

        // Zenith to horizon gradient
        vec3 zenith = vec3(0.1, 0.3, 0.8);
        vec3 horizonColor = vec3(0.6, 0.7, 0.9);

        // Sun influence
        float sunInfluence = pow(max(0.0, dot(rd, -lightDir)), 4.0);
        vec3 sunScatter = vec3(1.0, 0.6, 0.3) * sunInfluence;

        vec3 sky = mix(zenith, horizonColor, pow(horizon, 0.5));
        sky += sunScatter * 0.4;

        return sky + renderSun(rd, lightDir, sigma);
    } else if (uPhenomenon == 2) {
        // Foggy sky - just dim grey
        return vec3(0.4, 0.42, 0.45) * (0.5 + rd.y * 0.3);
    } else {
        // Underwater/murky - dark blue gradient
        return vec3(0.02, 0.05, 0.1) * (0.5 + rd.y * 0.5);
    }
}

// ============ Main Render ============
void main() {
    vec2 uv = (vUV - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    // Camera setup
    vec3 ro, rd;
    vec3 lightDir;

    // Rotation matrices
    float cx = cos(uCameraRotX), sx = sin(uCameraRotX);
    float cy = cos(uCameraRotY), sy = sin(uCameraRotY);

    mat3 rotX = mat3(1, 0, 0, 0, cx, -sx, 0, sx, cx);
    mat3 rotY = mat3(cy, 0, sy, 0, 1, 0, -sy, 0, cy);
    mat3 camRot = rotY * rotX;

    if (uPhenomenon == 0) {
        // Beer-Lambert: underwater looking up
        ro = vec3(0.0, -2.0, 0.0);
        rd = normalize(vec3(uv.x, uv.y + 0.5, 1.0));
        rd = camRot * rd;
        lightDir = normalize(vec3(0.2, -0.9, 0.1));
    } else if (uPhenomenon == 1) {
        // Rayleigh: ground level looking at sky
        ro = vec3(0.0, 0.5, 0.0);
        rd = normalize(vec3(uv.x, uv.y + 0.3, 1.0));
        rd = camRot * rd;
        // Animate sun position
        float sunAngle = uTime * 0.1;
        lightDir = normalize(vec3(sin(sunAngle) * 0.5, -0.7 - cos(sunAngle) * 0.3, -0.5));
    } else if (uPhenomenon == 2) {
        // Mie: eye level in fog
        ro = vec3(0.0, 1.5, 5.0);
        rd = normalize(vec3(uv.x, uv.y, -1.0));
        rd = camRot * rd;
        lightDir = normalize(vec3(0.3, -0.5, -0.8));
    } else {
        // Combined: in murky water
        ro = vec3(0.0, -1.0, 0.0);
        rd = normalize(vec3(uv.x, uv.y + 0.2, 1.0));
        rd = camRot * rd;
        lightDir = normalize(vec3(0.1, -0.8, 0.2));
    }

    vec3 sigma = getSigma();
    vec3 col = vec3(0.0);

    // Ray march
    float t = 0.0;
    bool hit = false;
    vec3 hitPos;

    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = sceneSDF(p);

        if (d < SURF_DIST) {
            hit = true;
            hitPos = p;
            break;
        }

        if (t > MAX_DIST) break;
        t += d * 0.8;
    }

    // Calculate scene color
    if (hit) {
        vec3 N = getNormal(hitPos);
        float NdotL = max(0.0, dot(N, -lightDir));

        // Distance through medium
        float depth = length(hitPos - ro);
        vec3 T = getTransmittance(depth, sigma);

        vec3 surfaceColor;

        if (uPhenomenon == 0) {
            // Underwater floor: sandy with caustics
            if (hitPos.y < -4.0) {
                surfaceColor = vec3(0.6, 0.55, 0.4) * (0.5 + NdotL * 0.5);
                surfaceColor += caustics(hitPos) * vec3(0.3, 0.5, 0.6);
            } else {
                // Water surface from below
                surfaceColor = vec3(0.5, 0.7, 0.9) * (0.8 + NdotL * 0.2);
            }
        } else if (uPhenomenon == 1) {
            // Ground
            surfaceColor = vec3(0.2, 0.25, 0.15) * (0.3 + NdotL * 0.7);
        } else if (uPhenomenon == 2) {
            // Forest floor and trees
            if (hitPos.y < 0.0) {
                surfaceColor = vec3(0.15, 0.12, 0.08) * (0.2 + NdotL * 0.3);
            } else {
                surfaceColor = vec3(0.05, 0.03, 0.02); // Tree silhouette
            }
        } else {
            // Murky floor
            surfaceColor = vec3(0.3, 0.25, 0.2) * (0.3 + NdotL * 0.4);
            surfaceColor += caustics(hitPos) * vec3(0.2, 0.3, 0.3) * 0.5;
        }

        col = surfaceColor * T;
    } else {
        // Sky / background
        col = skyColor(rd, lightDir, sigma);

        if (uPhenomenon == 0) {
            // Looking up from underwater - light rays from surface
            float depth = 10.0;
            col *= getTransmittance(depth, sigma);
        }
    }

    // Add volumetric scattering / god rays
    float rayMarchDist = hit ? length(hitPos - ro) : MAX_DIST;
    vec3 inscatter = volumetricLight(ro, rd, lightDir, sigma, rayMarchDist);

    // Light color based on phenomenon
    vec3 lightColor = vec3(1.0, 0.95, 0.9);
    if (uPhenomenon == 1) {
        float sunHeight = -lightDir.y;
        lightColor = mix(vec3(1.0, 0.5, 0.3), vec3(1.0, 0.98, 0.95), sunHeight);
    } else if (uPhenomenon == 0 || uPhenomenon == 3) {
        lightColor = vec3(0.7, 0.85, 1.0); // Underwater tint
    }

    col += inscatter * lightColor * 2.0;

    // Underwater caustic light shafts
    if (uPhenomenon == 0) {
        float shafts = 0.0;
        for (int i = 0; i < 16; i++) {
            float fi = float(i);
            vec3 p = ro + rd * (fi * 0.8);
            float c = caustics(p + vec3(0, uTime * 0.5, 0));
            shafts += c * exp(-fi * 0.15);
        }
        col += shafts * vec3(0.2, 0.4, 0.5) * 0.3;
    }

    // Mie halos around light
    if (uPhenomenon == 2) {
        float halo = pow(max(0.0, dot(rd, -lightDir)), 16.0);
        col += halo * vec3(1.0, 0.95, 0.85) * 0.5;
    }

    // Tone mapping
    col = col / (1.0 + col);
    col = pow(col, vec3(0.9)); // Slight gamma

    // Vignette
    float vignette = 1.0 - length(vUV - 0.5) * 0.5;
    col *= vignette;

    fragColor = vec4(col, 1.0);
}
