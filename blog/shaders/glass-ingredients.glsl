precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_n;
uniform vec2 u_resolution;

// Squircle SDF: |x/a|^n + |y/b|^n = 1
float sdSquircle(vec2 p, vec2 size, float n) {
    vec2 d = abs(p) / size;
    float dist = pow(pow(d.x, n) + pow(d.y, n), 1.0 / n);
    return (dist - 1.0) * min(size.x, size.y);
}

void main() {
    vec2 uv = v_uv;

    // Work in pixel space
    vec2 p = (uv - 0.5) * u_resolution;

    // Fill the canvas: use height with padding for square shape
    float padding = 40.0;
    float squareSize = (min(u_resolution.x, u_resolution.y) - padding) * 0.5;
    vec2 size = vec2(squareSize);

    // Compute SDF
    float d = sdSquircle(p, size, u_n);

    // Colors
    vec3 darkBlue = vec3(0.02, 0.05, 0.12);
    vec3 cyan = vec3(0.176, 0.831, 0.749);  // --accent-teal
    vec3 gold = vec3(0.91, 0.725, 0.137);   // --accent-gold
    vec3 darkGold = vec3(0.35, 0.25, 0.05);
    vec3 bg = vec3(0.02, 0.03, 0.05);

    // Strip parameters
    float stripWidth = 6.0;
    float stripGap = 20.0;
    float stripPeriod = stripWidth + stripGap;

    // Distance from boundary
    float distFromEdge = abs(d);

    // Create strips
    float stripPhase = mod(distFromEdge, stripPeriod);
    float aa = 1.5;
    float strip = smoothstep(0.0, aa, stripPhase) * (1.0 - smoothstep(stripWidth - aa, stripWidth, stripPhase));

    // Gradient along distance - normalize to fade range
    float maxDist = 180.0;
    float t = clamp(distFromEdge / maxDist, 0.0, 1.0);

    // Inside vs outside
    float inside = step(d, 0.0);

    // Outside: cyan -> dark blue gradient
    vec3 outsideColor = mix(cyan, darkBlue, t);

    // Inside: gold -> dark gold gradient
    vec3 insideColor = mix(gold, darkGold, t);

    // Choose color based on side
    vec3 stripColor = mix(outsideColor, insideColor, inside);

    // Fill color between strips (slightly darker than strips)
    vec3 outsideFill = mix(cyan * 0.4, darkBlue * 0.8, t);
    vec3 insideFill = mix(gold * 0.5, darkGold * 0.8, t);
    vec3 fillColor = mix(outsideFill, insideFill, inside);

    // Compose - strips on fill (not black background)
    vec3 color = mix(fillColor, stripColor, strip);

    gl_FragColor = vec4(color, 1.0);
}
