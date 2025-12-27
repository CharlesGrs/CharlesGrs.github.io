// Space Particles Shaders - Static star field
// WebGL 1 compatible with constant screen-space size stars

window.SPACE_PARTICLE_VERTEX_SHADER = `
    attribute vec3 aPosition;  // xyz = world position
    attribute vec2 aStarData;  // x = brightness (0-1), y = color variation (0-1)

    uniform vec2 uResolution;
    uniform float uTime;

    // Particle appearance
    uniform float uParticleSize;    // Base particle size in screen pixels
    uniform float uBrightness;      // Overall brightness multiplier

    // Camera
    uniform float uCameraRotX;      // Camera pitch
    uniform float uCameraRotY;      // Camera yaw
    uniform vec3 uCameraPos;        // Camera position XYZ

    varying float vBrightness;      // Star brightness
    varying float vColorVar;        // Color variation for tinting
    varying float vTwinklePhase;    // Phase for twinkling

    void main() {
        vec3 particlePos = aPosition;

        // Camera rotation
        float cosRotX = cos(uCameraRotX);
        float sinRotX = sin(uCameraRotX);
        float cosRotY = cos(uCameraRotY);
        float sinRotY = sin(uCameraRotY);

        vec3 cameraPos = uCameraPos;

        // Camera basis vectors
        vec3 cameraForward = vec3(sinRotY * cosRotX, -sinRotX, cosRotY * cosRotX);
        vec3 cameraRight = vec3(cosRotY, 0.0, -sinRotY);
        vec3 cameraUp = cross(cameraForward, cameraRight);

        // Vector from camera to particle
        vec3 toParticle = particlePos - cameraPos;

        // Distance from camera along view direction
        float zDist = dot(toParticle, cameraForward);

        // Cull if behind camera (near plane)
        if (zDist < 0.01) {
            gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
            gl_PointSize = 0.0;
            vBrightness = 0.0;
            vColorVar = 0.0;
            vTwinklePhase = 0.0;
            return;
        }

        // Perspective projection
        float perspectiveScale = 1.0 / zDist;
        vec2 screenCenter = uResolution * 0.5;
        float projX = dot(toParticle, cameraRight) * perspectiveScale;
        float projY = dot(toParticle, cameraUp) * perspectiveScale;
        vec2 projectedPos = screenCenter + vec2(projX, -projY) * uResolution.x;

        // Convert to clip space
        vec2 clipPos = (projectedPos / uResolution) * 2.0 - 1.0;
        clipPos.y = -clipPos.y;

        // Frustum culling - discard stars far outside view (with margin for point size)
        float cullMargin = 1.5; // Allow some margin for stars near edge
        if (abs(clipPos.x) > cullMargin || abs(clipPos.y) > cullMargin) {
            gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
            gl_PointSize = 0.0;
            vBrightness = 0.0;
            vColorVar = 0.0;
            vTwinklePhase = 0.0;
            return;
        }

        gl_Position = vec4(clipPos, 0.0, 1.0);

        // Constant screen-space size (no perspective scaling)
        gl_PointSize = uParticleSize;

        // Pass star data to fragment shader
        vBrightness = aStarData.x;
        vColorVar = aStarData.y;
        vTwinklePhase = aPosition.x * 17.3 + aPosition.y * 31.7 + aPosition.z * 43.1; // Deterministic phase from position
    }
`;

window.SPACE_PARTICLE_FRAGMENT_SHADER = `
    precision highp float;

    varying float vBrightness;
    varying float vColorVar;
    varying float vTwinklePhase;

    uniform float uTime;
    uniform float uBrightness;      // Global brightness multiplier

    // Star colors (interpolated based on color variation)
    uniform vec3 uStarColorCool;    // Cool/blue stars
    uniform vec3 uStarColorWarm;    // Warm/yellow stars
    uniform vec3 uStarColorHot;     // Hot/white-blue stars

    void main() {
        vec2 coord = gl_PointCoord * 2.0 - 1.0;
        float r = length(coord);

        // Soft circular falloff with bright center
        float core = exp(-r * r * 8.0);  // Bright core
        float glow = exp(-r * r * 2.0) * 0.3;  // Soft glow
        float shape = core + glow;

        // Anti-aliased edge
        float edge = smoothstep(1.0, 0.8, r);
        shape *= edge;

        if (shape < 0.001) discard;

        // Twinkling effect
        float twinkle = sin(uTime * 2.0 + vTwinklePhase) * 0.15 +
                        sin(uTime * 3.7 + vTwinklePhase * 1.3) * 0.1 + 1.0;

        // Star color based on color variation
        // 0-0.33: cool (blue-white), 0.33-0.66: warm (yellow-white), 0.66-1: hot (bright white-blue)
        vec3 starColor;
        if (vColorVar < 0.33) {
            starColor = mix(uStarColorCool, vec3(1.0), vColorVar * 3.0);
        } else if (vColorVar < 0.66) {
            starColor = mix(uStarColorWarm, vec3(1.0), (vColorVar - 0.33) * 3.0);
        } else {
            starColor = mix(vec3(1.0), uStarColorHot, (vColorVar - 0.66) * 3.0);
        }

        // Final brightness with HDR boost for brightest stars
        float baseBrightness = shape * vBrightness * twinkle * uBrightness;

        // HDR boost - brightest stars can exceed 1.0 for bloom
        // Stars with high brightness (>0.7) get extra HDR headroom
        float hdrBoost = 1.0 + smoothstep(0.5, 1.0, vBrightness) * 1.5;
        float finalBrightness = baseBrightness * hdrBoost;

        if (finalBrightness < 0.001) discard;

        // Additive blending output (HDR values will bloom)
        gl_FragColor = vec4(starColor * finalBrightness, min(finalBrightness, 1.0));
    }
`;
