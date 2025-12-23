// Debug Quad Shader - draws wireframe quad overlay on nodes
// Used to visualize the billboard quad bounds

window.DEBUG_QUAD_VERTEX_SHADER = `
attribute vec2 aPosition;
uniform vec2 uCenter;
uniform float uSize;
uniform vec2 uResolution;
uniform float uZoom;
uniform float uCameraRotX;
uniform float uCameraRotY;

varying vec2 vLocalPos;

void main() {
    vLocalPos = aPosition;

    // Billboard quad corners in local space (-1 to 1)
    vec2 corner = aPosition * uSize;

    // Apply zoom
    corner *= uZoom;

    // Position in screen space
    vec2 screenPos = uCenter + corner;

    // Convert to clip space
    vec2 clipPos = (screenPos / uResolution) * 2.0 - 1.0;
    clipPos.y = -clipPos.y;

    gl_Position = vec4(clipPos, 0.0, 1.0);
}
`;

window.DEBUG_QUAD_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vLocalPos;
uniform vec3 uColor;
uniform float uTime;

void main() {
    vec2 uv = vLocalPos;

    // Draw border/wireframe
    float borderWidth = 0.05;
    float edge = max(abs(uv.x), abs(uv.y));
    float border = smoothstep(1.0 - borderWidth, 1.0, edge);

    // Animated dash pattern along the border
    float dashFreq = 8.0;
    float angle = atan(uv.y, uv.x);
    float dash = sin(angle * dashFreq + uTime * 2.0) * 0.5 + 0.5;
    dash = smoothstep(0.3, 0.7, dash);

    // Corner markers
    float cornerSize = 0.2;
    float cornerDist = min(
        length(abs(uv) - vec2(1.0, 1.0)),
        min(
            length(abs(uv) - vec2(1.0, 0.0)),
            length(abs(uv) - vec2(0.0, 1.0))
        )
    );
    float corners = 1.0 - smoothstep(0.0, cornerSize, cornerDist);

    // Combine border and corners
    float alpha = max(border * dash * 0.8, corners * 0.6);

    // Subtle fill
    float fill = 0.05;
    alpha = max(alpha, fill);

    gl_FragColor = vec4(uColor, alpha);
}
`;
