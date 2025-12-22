// Planet Vertex Shader - Edit this file for IDE syntax highlighting
// Then copy the shader string content to modify the rendering
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
varying vec2 vUV;
varying vec2 vCenter;
varying float vRadius;
varying vec3 vColor;
varying float vAlpha;
varying float vAppear;
varying float vGlow;
varying float vIndex;
varying float vIsLight;
uniform vec2 uRes;
uniform float uZoom;
uniform vec2 uZoomCenter;

void main() {
    vUV = aPos;
    vCenter = aCenter;
    vRadius = aRadius;
    vColor = aColor;
    vAlpha = aAlpha;
    vAppear = aAppear;
    vGlow = aGlow;
    vIndex = aIndex;
    vIsLight = aIsLight;
    vec2 p = aCenter + aPos * aRadius * 3.0;
    // Apply zoom centered on uZoomCenter
    vec2 zoomed = (p - uZoomCenter) * uZoom + uZoomCenter;
    vec2 c = (zoomed / uRes) * 2.0 - 1.0;
    gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
}
`;
