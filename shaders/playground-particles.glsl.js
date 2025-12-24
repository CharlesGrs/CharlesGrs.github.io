// ============================================
// PLAYGROUND PARTICLE SYSTEM SHADERS (WebGL 2)
// Transform feedback GPU particle simulation
// SDF Shape Morphing with 4 animated shapes
// ============================================

// Simulation vertex shader - updates particle positions via transform feedback
window.PLAYGROUND_SIMULATION_VS = `#version 300 es
    precision highp float;

    in vec4 aPosition;
    in float aLife;

    out vec4 vPosition;
    out float vLife;

    uniform float uTime;
    uniform float uDeltaTime;
    uniform vec2 uMouse;
    uniform vec2 uMouseVel;
    uniform float uAttraction;
    uniform float uTurbulence;
    uniform float uSpeed;
    uniform vec2 uResolution;
    uniform float uBurst;
    uniform vec2 uBurstPos;
    uniform int uMode;
    uniform float uMouseDown;

    #define PI 3.14159265359
    #define TAU 6.28318530718

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // Simple noise
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

    vec2 curlNoise(vec2 p, float t) {
        float eps = 0.1;
        float n1 = noise(vec2(p.x, p.y + eps) + t);
        float n2 = noise(vec2(p.x, p.y - eps) + t);
        float n3 = noise(vec2(p.x + eps, p.y) + t);
        float n4 = noise(vec2(p.x - eps, p.y) + t);
        return vec2(n1 - n2, -(n3 - n4));
    }

    // SDF Primitives
    float sdCircle(vec2 p, float r) {
        return length(p) - r;
    }

    float sdBox(vec2 p, vec2 b) {
        vec2 d = abs(p) - b;
        return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }

    float sdStar(vec2 p, float r) {
        float an = PI / 5.0;
        float en = PI / 2.4;
        vec2 acs = vec2(cos(an), sin(an));
        vec2 ecs = vec2(cos(en), sin(en));
        float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
        p = length(p) * vec2(cos(bn), abs(sin(bn)));
        p -= r * acs;
        p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
        return length(p) * sign(p.x);
    }

    float sdHeart(vec2 p) {
        p.x = abs(p.x);
        if (p.y + p.x > 1.0)
            return length(p - vec2(0.25, 0.75)) - 0.35;
        return length(p - vec2(0.0, 1.0)) * 0.5 - 0.5 + p.y * 0.5;
    }

    vec2 rotate(vec2 p, float a) {
        float c = cos(a), s = sin(a);
        return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    }

    // Get animated SDF - cycles through 4 shapes
    float getSDF(vec2 p, float t) {
        float scale = 0.5 + sin(t * 0.5) * 0.1;
        vec2 rp = rotate(p, t * 0.2);

        float cycleDuration = 6.0;
        float phase = mod(t, cycleDuration * 4.0) / cycleDuration;
        int shape = int(floor(phase));
        float morph = smoothstep(0.7, 1.0, fract(phase));

        float d1, d2;

        if (shape == 0) {
            d1 = sdCircle(p, scale * 0.5);
            d2 = sdStar(rp, scale * 0.5);
        } else if (shape == 1) {
            d1 = sdStar(rp, scale * 0.5);
            d2 = sdHeart(p * 2.0 + vec2(0.0, 0.5)) * 0.3;
        } else if (shape == 2) {
            d1 = sdHeart(p * 2.0 + vec2(0.0, 0.5)) * 0.3;
            d2 = sdBox(rp, vec2(scale * 0.4, scale * 0.4));
        } else {
            d1 = sdBox(rp, vec2(scale * 0.4, scale * 0.4));
            d2 = sdCircle(p, scale * 0.5);
        }

        return mix(d1, d2, morph);
    }

    // Gradient of SDF
    vec2 sdfGradient(vec2 p, float t) {
        float eps = 0.01;
        float d = getSDF(p, t);
        return normalize(vec2(
            getSDF(p + vec2(eps, 0.0), t) - d,
            getSDF(p + vec2(0.0, eps), t) - d
        ) + 0.0001);
    }

    void main() {
        vec2 pos = aPosition.xy;
        vec2 vel = aPosition.zw;
        float life = aLife;

        float dt = uDeltaTime * uSpeed;
        vec2 mousePos = uMouse * 2.0 - 1.0;
        vec2 force = vec2(0.0);

        float particleHash = hash(pos + vec2(life));

        // SDF attraction
        float sdf = getSDF(pos, uTime);
        vec2 grad = sdfGradient(pos, uTime);

        // Attract to surface
        force -= grad * sdf * uAttraction * 1.5;

        // Flow along surface
        vec2 tangent = vec2(-grad.y, grad.x);
        float flowDir = particleHash > 0.5 ? 1.0 : -1.0;
        force += tangent * (0.15 + particleHash * 0.1) * flowDir;

        // Noise
        force += curlNoise(pos * 3.0, uTime * 0.3) * uTurbulence * 0.1;

        // Prevent collapse
        if (abs(sdf) < 0.03) {
            force += grad * 0.1 * sign(sdf);
        }

        // Mouse repulsion
        vec2 toMouse = pos - mousePos;
        float mouseDist = length(toMouse);
        float repelRadius = 0.4 + uMouseDown * 0.3;

        if (mouseDist < repelRadius) {
            float str = (1.0 - mouseDist / repelRadius);
            str = str * str * 2.0;
            force += normalize(toMouse + 0.001) * str * (1.0 + uMouseDown * 2.0);
            force += vec2(-toMouse.y, toMouse.x) * str * 0.5;
        }

        // Burst effect
        if (uBurst > 0.0) {
            vec2 burstCenter = uBurstPos * 2.0 - 1.0;
            vec2 fromBurst = pos - burstCenter;
            float burstDist = length(fromBurst);
            if (burstDist < 0.3) {
                force += normalize(fromBurst + 0.001) * uBurst * (0.3 - burstDist) * 5.0;
            }
        }

        // Physics
        vel += force * dt;
        vel *= 0.96;

        float speed = length(vel);
        if (speed > 0.6) vel = vel / speed * 0.6;

        pos += vel * dt;

        // Boundary
        if (abs(pos.x) > 1.3 || abs(pos.y) > 1.3) {
            float angle = hash(pos + uTime) * TAU;
            pos = vec2(cos(angle), sin(angle)) * (0.3 + hash(pos.yx) * 0.4);
            vel *= 0.1;
        }

        life = mod(life + dt * 0.1 + speed * 0.1, 1.0);

        vPosition = vec4(pos, vel);
        vLife = life;
    }
`;

// Simulation fragment shader - dummy output (transform feedback captures varyings)
window.PLAYGROUND_SIMULATION_FS = `#version 300 es
    precision highp float;
    out vec4 fragColor;
    void main() {
        fragColor = vec4(0.0);
    }
`;

// Render vertex shader - displays particles with velocity-based sizing
window.PLAYGROUND_RENDER_VS = `#version 300 es
    precision highp float;
    precision highp int;

    in vec4 aPosition;
    in float aLife;

    out float vLife;
    out float vSpeed;
    out vec2 vVelocity;
    out vec2 vPosition;

    uniform vec2 uResolution;
    uniform float uHue;
    uniform int uMode;

    void main() {
        vec2 pos = aPosition.xy;
        vec2 vel = aPosition.zw;

        vLife = aLife;
        vSpeed = length(vel);
        vVelocity = vel;
        vPosition = pos;

        // Adjust for aspect ratio
        float aspect = uResolution.x / uResolution.y;
        vec2 adjusted = pos;
        adjusted.x /= aspect;

        gl_Position = vec4(adjusted, 0.0, 1.0);

        // Size based on velocity - particles on surface are slightly larger
        gl_PointSize = 1.2 + vSpeed * 3.5;
    }
`;

// Render fragment shader - colorful particles with palette cycling
window.PLAYGROUND_RENDER_FS = `#version 300 es
    precision highp float;
    precision highp int;

    in float vLife;
    in float vSpeed;
    in vec2 vVelocity;
    in vec2 vPosition;

    uniform float uHue;
    uniform float uTime;
    uniform int uMode;

    out vec4 fragColor;

    #define PI 3.14159265359
    #define TAU 6.28318530718

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    // Beautiful gradient palettes
    vec3 palette1(float t) {
        // Sunset/fire palette
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 0.7, 0.4);
        vec3 d = vec3(0.0, 0.15, 0.2);
        return a + b * cos(TAU * (c * t + d));
    }

    vec3 palette2(float t) {
        // Ocean/aurora palette
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.3, 0.2, 0.2);
        return a + b * cos(TAU * (c * t + d));
    }

    vec3 palette3(float t) {
        // Neon cyberpunk palette
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(2.0, 1.0, 0.0);
        vec3 d = vec3(0.5, 0.2, 0.25);
        return a + b * cos(TAU * (c * t + d));
    }

    void main() {
        vec2 coord = gl_PointCoord * 2.0 - 1.0;
        float r = length(coord);
        if (r > 1.0) discard;

        // Soft glowing particle
        float core = 1.0 - smoothstep(0.0, 0.3, r);
        float glow = 1.0 - smoothstep(0.2, 1.0, r);
        float alpha = mix(glow * 0.5, 1.0, core);

        // Position-based coloring
        float posAngle = atan(vPosition.y, vPosition.x) / TAU + 0.5;
        float distFromCenter = length(vPosition);
        float velAngle = atan(vVelocity.y, vVelocity.x) / TAU + 0.5;

        // Time-varying palette cycling
        float cycleDuration = 64.0; // Match shape cycle
        float palettePhase = mod(uTime / cycleDuration, 1.0);

        // Base color from position angle for rainbow flow along shapes
        float baseHue = uHue / 360.0;
        float colorPhase = posAngle + vLife * 0.3 + uTime * 0.05 + baseHue;

        // Mix between palettes based on time
        vec3 col1 = palette1(colorPhase);
        vec3 col2 = palette2(colorPhase + 0.1);
        vec3 col3 = palette3(colorPhase + 0.2);

        float paletteMix = sin(uTime * 0.2) * 0.5 + 0.5;
        float paletteMix2 = sin(uTime * 0.15 + 1.0) * 0.5 + 0.5;

        vec3 col = mix(mix(col1, col2, paletteMix), col3, paletteMix2 * 0.5);

        // Add speed-based brightness and hue shift
        col *= 0.6 + vSpeed * 1.2;

        // Fast particles get white-hot core
        if (vSpeed > 0.2) {
            float heat = (vSpeed - 0.2) * 2.0;
            col = mix(col, vec3(1.0, 0.95, 0.85), heat * core);
        }

        // Subtle shimmer based on velocity direction
        float shimmer = sin(velAngle * TAU * 4.0 + uTime * 5.0) * 0.15 + 0.85;
        col *= shimmer;

        // Distance-based saturation - particles near center are brighter
        col *= 0.8 + (1.0 - min(distFromCenter, 1.0)) * 0.4;

        // Pulsing glow synchronized with shape breathing
        float breathe = sin(uTime * 0.5) * 0.1 + 0.9;
        col *= breathe;

        // Core highlight
        col += vec3(1.0, 0.98, 0.95) * core * 0.3;

        // Alpha based on speed and life
        alpha *= 0.5 + vSpeed * 0.4 + vLife * 0.1;

        fragColor = vec4(col, alpha);
    }
`;
