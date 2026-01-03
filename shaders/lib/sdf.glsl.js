// ============================================
// SHARED SDF PRIMITIVES LIBRARY
// Common signed distance functions
// Include with: ${window.GLSL_SDF}
// ============================================

window.GLSL_SDF = `
// ============================================
// 2D SDF PRIMITIVES
// ============================================

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

float sdBox2D(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdRoundedBox2D(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float sdSegment2D(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// ============================================
// 3D SDF PRIMITIVES
// ============================================

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdPlane(vec3 p, vec3 n, float h) {
    return dot(p, n) + h;
}

float sdCylinder(vec3 p, float r, float h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

float sdCone(vec3 p, vec2 c, float h) {
    float q = length(p.xz);
    return max(dot(c.xy, vec2(q, p.y)), -h - p.y);
}

// ============================================
// SDF OPERATIONS
// ============================================

// Union (combine shapes)
float opUnion(float d1, float d2) {
    return min(d1, d2);
}

// Subtraction (carve out)
float opSubtraction(float d1, float d2) {
    return max(-d1, d2);
}

// Intersection (keep overlap)
float opIntersection(float d1, float d2) {
    return max(d1, d2);
}

// Smooth union
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

// Smooth subtraction
float opSmoothSubtraction(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d2, -d1, h) + k * h * (1.0 - h);
}

// Smooth intersection
float opSmoothIntersection(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}

// ============================================
// DOMAIN OPERATIONS
// ============================================

// Repeat space infinitely
vec3 opRepeat(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
}

// Repeat space with limited instances
vec3 opRepeatLimited(vec3 p, float c, vec3 l) {
    return p - c * clamp(floor(p / c + 0.5), -l, l);
}

// Mirror across a plane
float opMirror(inout vec3 p, vec3 n, float d) {
    float dist = dot(p, n) - d;
    p -= 2.0 * min(0.0, dist) * n;
    return dist;
}

// Onion (hollow out a shape)
float opOnion(float d, float thickness) {
    return abs(d) - thickness;
}

// ============================================
// UTILITY
// ============================================

// Calculate normal from SDF
#define CALC_NORMAL(sdf, p) normalize(vec3( \\
    sdf(p + vec3(0.001, 0.0, 0.0)) - sdf(p - vec3(0.001, 0.0, 0.0)), \\
    sdf(p + vec3(0.0, 0.001, 0.0)) - sdf(p - vec3(0.0, 0.001, 0.0)), \\
    sdf(p + vec3(0.0, 0.0, 0.001)) - sdf(p - vec3(0.0, 0.0, 0.001)) \\
))

// Soft shadow using SDF
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 64; i++) {
        if (t >= maxt) break;
        // Note: Replace 'sceneSDF' with your scene function
        // float h = sceneSDF(ro + rd * t);
        // res = min(res, k * h / t);
        // t += clamp(h, 0.01, 0.2);
        // if (res < 0.001) break;
    }
    return clamp(res, 0.0, 1.0);
}
`;
