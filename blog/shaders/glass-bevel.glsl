precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_n;
uniform float u_bevelWidth;
uniform float u_bevelDepth;
uniform vec2 u_resolution;

// Squircle SDF: |x/a|^n + |y/b|^n = 1
float sdSquircle(vec2 p, vec2 size, float n) {
    vec2 d = abs(p) / size;
    float dist = pow(pow(d.x, n) + pow(d.y, n), 1.0 / n);
    return (dist - 1.0) * min(size.x, size.y);
}

// Bevel geometry struct
struct BevelGeometry {
    vec2 gradDir;      // XY: direction pointing outward toward edge
    float bevelAmount; // Z: surface tilt amount
    float edgeFactor;  // How close to edge (0=center, 1=edge)
};

// Compute bevel geometry in pixel space
BevelGeometry computeBevelGeometry(vec2 p, vec2 shapeSize, float squircleN, float edgeWidth, float bevelDepth) {
    BevelGeometry result;

    float d = sdSquircle(p, shapeSize, squircleN);
    float edgeDist = -d; // Distance from edge going inward

    // Edge factor: 1 at edge, 0 deep inside
    result.edgeFactor = 1.0 - smoothstep(0.0, edgeWidth, edgeDist);

    // Zone position: 0 at inner edge of bevel, 1 at outer edge
    float zonePos = clamp(1.0 - edgeDist / edgeWidth, 0.0, 1.0);

    // Lens curvature profile
    float x2 = zonePos * zonePos * bevelDepth;
    float denom = max(1.0 - x2, 0.01);
    float surfaceAngle = atan(zonePos * sqrt(bevelDepth) / sqrt(denom));
    result.bevelAmount = surfaceAngle * result.edgeFactor;

    // Compute gradient using finite differences in pixel space
    float eps = max(2.0, edgeWidth * 0.05);
    float dx = sdSquircle(p + vec2(eps, 0.0), shapeSize, squircleN) - sdSquircle(p - vec2(eps, 0.0), shapeSize, squircleN);
    float dy = sdSquircle(p + vec2(0.0, eps), shapeSize, squircleN) - sdSquircle(p - vec2(0.0, eps), shapeSize, squircleN);
    result.gradDir = normalize(vec2(dx, dy) + 0.0001);

    return result;
}

void main() {
    vec2 uv = v_uv;

    // Work in pixel space - same as glass-ingredients.glsl
    vec2 p = (uv - 0.5) * u_resolution;

    // Fill the canvas: use height with padding for square shape
    float padding = 40.0;
    float squareSize = (min(u_resolution.x, u_resolution.y) - padding) * 0.5;
    vec2 size = vec2(squareSize);

    // Compute SDF
    float d = sdSquircle(p, size, u_n);

    // Compute bevel geometry in pixel space (same p and size as SDF)
    BevelGeometry bevel = computeBevelGeometry(p, size, u_n, u_bevelWidth, u_bevelDepth);

    // Dark background
    vec3 bg = vec3(0.02, 0.03, 0.05);

    // Visualize bevel output: XY direction as RG, Z amount as B
    // Map direction from [-1,1] to [0,1] for visualization
    vec3 bevelViz = vec3(
        (bevel.gradDir * 0.5 + 0.5) * bevel.bevelAmount,
        bevel.bevelAmount
    );

    // Anti-aliased edge - same as glass-ingredients.glsl
    float mask = 1.0 - smoothstep(-1.5, 1.5, d);

    // Compose
    vec3 color = mix(bg, bevelViz, mask);

    gl_FragColor = vec4(color, 1.0);
}
