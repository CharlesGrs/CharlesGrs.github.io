// Debug Quad Vertex Shader - Matches planet shader projection
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

varying vec2 vUV;
varying float vScreenSize;  // Scaled radius in pixels for constant border width

void main() {
    vUV = aPosition;

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

    // Scale factor to convert screen pixels to world units (same as planet shader)
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

    // Perspective projection (1/distance)
    float perspectiveScale = 1.0 / zDist;

    // Project node position onto screen
    float projX = dot(toNode, cameraRight) * perspectiveScale;
    float projY = dot(toNode, cameraUp) * perspectiveScale;

    // Convert back to screen coordinates
    vec2 projectedCenter = screenCenter + vec2(projX * uResolution.x, -projY * uResolution.y);

    // Scale the radius by perspective
    float scaledRadius = uSize * perspectiveScale;
    vScreenSize = scaledRadius * 3.0;  // Pass screen-space size to fragment shader

    // Build quad vertices
    vec2 quadPos = projectedCenter + aPosition * scaledRadius * 3.0;

    // Convert to clip space
    vec2 clipPos = (quadPos / uResolution) * 2.0 - 1.0;
    gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);
}`;

window.DEBUG_QUAD_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUV;
varying float vScreenSize;

void main() {
    // Constant screen-space border width in pixels
    float borderPixels = 1.5;
    // Convert to UV space based on current quad size
    float w = borderPixels / vScreenSize;

    float e = max(abs(vUV.x), abs(vUV.y));
    float border = smoothstep(1.0 - w * 2.0, 1.0, e);
    float diag = 1.0 - smoothstep(0.0, w * 2.0, abs(vUV.x - vUV.y));
    float a = max(border, diag) * 0.9;
    if (a < 0.01) discard;
    gl_FragColor = vec4(1.0, 0.5, 0.0, a);
}`;
