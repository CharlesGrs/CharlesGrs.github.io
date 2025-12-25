// Planet Vertex Shader - Perspective camera with billboards in 3D sphere
window.PLANET_VERTEX_SHADER = `
attribute vec2 aPos;
attribute vec2 aCenter;
attribute float aRadius;
attribute vec3 aColor;
attribute float aAlpha;
attribute float aAppear;
attribute float aGlow;
attribute float aIndex;
attribute float aIsLight;
attribute float aDepth;
attribute float aZ;  // Z position in world space

varying vec2 vUV;
varying vec2 vCenter;
varying vec2 vOriginalCenter;  // Original screen-space center for lighting
varying float vRadius;
varying float vOriginalRadius; // Original radius for lighting
varying vec3 vColor;
varying float vAlpha;
varying float vAppear;
varying float vGlow;
varying float vIndex;
varying float vIsLight;
varying float vWorldZ;  // Pass world Z to fragment shader

uniform vec2 uRes;
uniform float uMinDim;      // Minimum dimension for consistent world scale
uniform float uCameraRotX;  // Camera rotation around X axis (pitch)
uniform float uCameraRotY;  // Camera rotation around Y axis (yaw)
uniform vec3 uCameraPos;    // Camera position XYZ (free camera)

void main() {
    vUV = aPos;
    vColor = aColor;
    vAppear = aAppear;
    vGlow = aGlow;
    vIndex = aIndex;
    vIsLight = aIsLight;
    vWorldZ = aZ;

    // Camera rotation
    float cosRotX = cos(uCameraRotX);
    float sinRotX = sin(uCameraRotX);
    float cosRotY = cos(uCameraRotY);
    float sinRotY = sin(uCameraRotY);

    // Free camera: direct position
    vec3 cameraPos = uCameraPos;

    // Camera basis vectors (from rotation angles, not looking at origin)
    vec3 cameraForward = vec3(sinRotY * cosRotX, -sinRotX, cosRotY * cosRotX);
    vec3 cameraRight = vec3(cosRotY, 0.0, -sinRotY);
    vec3 cameraUp = cross(cameraForward, cameraRight);

    // Convert 2D screen position to 3D world position
    vec2 screenCenter = uRes * 0.5;
    vec2 offsetFromCenter = aCenter - screenCenter;

    // Scale factor to convert screen pixels to world units
    // Use uMinDim for consistent scaling (nodes are placed using minDim)
    float worldScale = 1.0 / uMinDim;

    // Node position in world space (now with actual Z position from aZ)
    vec3 nodePos = vec3(offsetFromCenter.x * worldScale, -offsetFromCenter.y * worldScale, aZ);

    // Vector from camera to node
    vec3 toNode = nodePos - cameraPos;

    // Project node onto camera's view plane
    float zDist = dot(toNode, cameraForward);

    // Cull if behind camera
    if (zDist < 0.01) {
        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
        vAlpha = 0.0;
        vRadius = 0.0;
        vCenter = vec2(0.0);
        vOriginalCenter = aCenter;
        vOriginalRadius = aRadius;
        return;
    }

    // Perspective projection (1/distance)
    float perspectiveScale = 1.0 / zDist;

    // Project node position onto screen
    float projX = dot(toNode, cameraRight) * perspectiveScale;
    float projY = dot(toNode, cameraUp) * perspectiveScale;

    // Convert back to screen coordinates
    vec2 projectedCenter = screenCenter + vec2(projX * uRes.x, -projY * uRes.y);

    // Scale the radius by perspective
    float scaledRadius = aRadius * perspectiveScale;

    // Build quad vertices
    vec2 quadPos = projectedCenter + aPos * scaledRadius * 3.0;

    // Convert to clip space
    vec2 clipPos = (quadPos / uRes) * 2.0 - 1.0;
    gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);

    // Pass to fragment shader
    vCenter = projectedCenter;
    vOriginalCenter = aCenter;  // Original for lighting calculations
    vRadius = scaledRadius;
    vOriginalRadius = aRadius;  // Original for lighting calculations
    vAlpha = aAlpha;

    // Fade when very close to camera (based on perspective depth, not zoom)
    if (zDist < 0.2) {
        vAlpha *= zDist / 0.2;
    }
}
`;
