// Selection Quad Vertex Shader - Animated selection indicator for skill nodes
window.DEBUG_QUAD_VERTEX_SHADER = `
attribute vec2 aPosition;
uniform vec2 uCenter;
uniform vec2 uResolution;
uniform vec3 uCameraPos;
uniform float uSize;
uniform float uCameraRotX;
uniform float uCameraRotY;
uniform float uWorldZ;
uniform float uMinDim;
uniform float uTime;
uniform float uQuadExpand; // Must match planet/sun shader quad expansion

varying vec2 vUV;
varying float vScreenSize;
varying float vTime;

void main() {
    vUV = aPosition;
    vTime = uTime;

    // Camera rotation
    float cosRotX = cos(uCameraRotX);
    float sinRotX = sin(uCameraRotX);
    float cosRotY = cos(uCameraRotY);
    float sinRotY = sin(uCameraRotY);

    // Camera basis vectors (same as planet shader)
    vec3 cameraForward = vec3(sinRotY * cosRotX, -sinRotX, cosRotY * cosRotX);
    vec3 cameraRight = vec3(cosRotY, 0.0, -sinRotY);
    vec3 cameraUp = cross(cameraForward, cameraRight);

    // Convert 2D screen position to 3D world position
    vec2 screenCenter = uResolution * 0.5;
    vec2 offsetFromCenter = uCenter - screenCenter;

    // Scale factor to convert screen pixels to world units
    float worldScale = 1.0 / uMinDim;

    // Node position in world space
    vec3 nodePos = vec3(offsetFromCenter.x * worldScale, -offsetFromCenter.y * worldScale, uWorldZ);

    // Vector from camera to node
    vec3 toNode = nodePos - uCameraPos;

    // Project node onto camera's view plane
    float zDist = dot(toNode, cameraForward);

    // Cull if behind camera
    if (zDist < 0.01) {
        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
        vScreenSize = 0.0;
        return;
    }

    // Perspective projection
    float perspectiveScale = 1.0 / zDist;

    // Project node position onto screen
    float projX = dot(toNode, cameraRight) * perspectiveScale;
    float projY = dot(toNode, cameraUp) * perspectiveScale;

    // Convert back to screen coordinates
    vec2 projectedCenter = screenCenter + vec2(projX * uResolution.x, -projY * uResolution.y);

    // Scale the radius by perspective
    float scaledRadius = uSize * perspectiveScale;
    float quadMult = uQuadExpand > 0.0 ? uQuadExpand : 3.0;
    vScreenSize = scaledRadius * quadMult;

    // Build quad vertices
    vec2 quadPos = projectedCenter + aPosition * scaledRadius * quadMult;

    // Convert to clip space
    vec2 clipPos = (quadPos / uResolution) * 2.0 - 1.0;
    gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);
}`;

window.DEBUG_QUAD_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;
varying float vScreenSize;
varying float vTime;

// Cyan accent color
const vec3 SELECTION_COLOR = vec3(0.18, 0.83, 0.75); // #2dd4bf teal/cyan
const vec3 HIGHLIGHT_COLOR = vec3(0.6, 1.0, 0.95);

void main() {
    vec2 absUV = abs(vUV);
    float edgeDist = max(absUV.x, absUV.y);

    // Adaptive line width based on screen size (thicker when small/distant)
    float baseWidth = 2.0 / vScreenSize;
    float lineWidth = max(baseWidth, 0.03); // Minimum width for visibility

    // Smooth edge falloff for anti-aliasing
    float aa = 1.5 / vScreenSize;

    // Main border - simple clean line
    float border = smoothstep(1.0 - lineWidth - aa, 1.0 - lineWidth, edgeDist)
                 * smoothstep(1.0 + aa, 1.0, edgeDist);

    // Animated marching ants effect
    // Calculate position along perimeter (0-4 for each edge)
    vec2 p = vUV * 0.5 + 0.5; // 0 to 1
    float perim;

    // Determine which edge and position along it
    float distTop = p.y;
    float distRight = 1.0 - p.x;
    float distBottom = 1.0 - p.y;
    float distLeft = p.x;
    float minDist = min(min(distTop, distRight), min(distBottom, distLeft));

    // Smooth edge selection to avoid discontinuities
    if (minDist == distTop) {
        perim = p.x;
    } else if (minDist == distRight) {
        perim = 1.0 + p.y;
    } else if (minDist == distBottom) {
        perim = 2.0 + (1.0 - p.x);
    } else {
        perim = 3.0 + (1.0 - p.y);
    }

    // Marching dash pattern - scale frequency with size for consistency
    float dashScale = max(vScreenSize / 80.0, 1.0);
    float dashFreq = 8.0 * dashScale;
    float dashPhase = perim * dashFreq - vTime * 1.2;

    // Soft dash shape (no hard edges)
    float dash = smoothstep(0.3, 0.5, fract(dashPhase)) * smoothstep(0.8, 0.6, fract(dashPhase));

    // Breathing pulse
    float pulse = 0.7 + 0.3 * sin(vTime * 2.0);

    // Corner accents - brighter at corners
    float cornerDist = min(absUV.x, absUV.y);
    float cornerBoost = smoothstep(0.3, 0.0, cornerDist) * 0.3;

    // Combine: solid border with animated intensity
    float intensity = border * (0.5 + 0.5 * dash) * pulse;
    intensity += border * 0.3; // Base visibility
    intensity += cornerBoost * border; // Brighter corners

    // Soft outer glow
    float glow = smoothstep(1.0 + lineWidth * 3.0, 1.0, edgeDist)
               * smoothstep(0.85, 1.0, edgeDist) * 0.2 * pulse;
    intensity += glow;

    // Spherical radial gradient - squared falloff for sphere-like shading
    float r = length(vUV); // 0 at center, 1 at edge of inscribed circle
    float sphereShade = 1.0 - r * r; // Quadratic falloff simulates sphere surface
    sphereShade = max(sphereShade, 0.0);
    float innerFill = sphereShade * 0.15 * pulse;

    if (intensity < 0.01 && innerFill < 0.005) discard;

    // Color with slight highlight on bright parts
    vec3 color = mix(SELECTION_COLOR, HIGHLIGHT_COLOR, intensity * 0.3);

    // Inner fill color - brighter in center like a lit sphere
    vec3 fillColor = mix(SELECTION_COLOR, HIGHLIGHT_COLOR, sphereShade * 0.5);

    // Blend border and inner fill
    float totalAlpha = intensity + innerFill * (1.0 - intensity);
    vec3 finalColor = color * intensity + fillColor * innerFill * (1.0 - intensity);

    gl_FragColor = vec4(finalColor, totalAlpha);
}`;
