// ============================================
// THREE.JS BACKGROUND SHADERS
// Used by the Three.js nebula background effect
// ============================================

// Simple vertex shader for fullscreen quad
window.BACKGROUND_VERTEX_SHADER = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;
