// ============================================
// GLSL SHADER LIBRARY INDEX
// Load this file to get all shared GLSL utilities
// ============================================

// Import all library files
// In HTML, include them in order:
//   <script src="shaders/lib/noise.glsl.js"></script>
//   <script src="shaders/lib/sdf.glsl.js"></script>
//   <script src="shaders/lib/pbr.glsl.js"></script>
//   <script src="shaders/lib/scattering.glsl.js"></script>

// Or for tools that need these, include index.js which loads them dynamically

(function() {
    const libs = ['noise', 'sdf', 'pbr', 'scattering'];
    const basePath = document.currentScript?.src.replace(/index\.js$/, '') || '/shaders/lib/';

    libs.forEach(lib => {
        const script = document.createElement('script');
        script.src = `${basePath}${lib}.glsl.js`;
        script.async = false;
        document.head.appendChild(script);
    });
})();

// ============================================
// USAGE IN SHADERS
// ============================================
//
// For JavaScript template literals (existing pattern):
//
//   window.MY_SHADER = `
//   precision highp float;
//   ${window.GLSL_NOISE}
//   ${window.GLSL_PBR}
//
//   void main() {
//       float n = fbm3D(position);
//       vec3 color = pbrDirect(N, V, L, albedo, roughness, metallic, lightColor);
//   }
//   `;
//
// For external .glsl files (new pattern), use ShaderLoader.loadWithLibs():
//
//   const shaders = await ShaderLoader.loadWithLibs({
//       vertex: 'shaders/my.vert.glsl',
//       fragment: 'shaders/my.frag.glsl'
//   }, ['noise', 'pbr']);

// ============================================
// AVAILABLE LIBRARIES
// ============================================
//
// GLSL_NOISE - Noise functions:
//   - hash21, hash31, hash33 - Hash functions
//   - valueNoise2D, valueNoise3D - Value noise
//   - simplexNoise3D - Simplex noise (higher quality)
//   - fbm2D, fbm3D, fbmSimplex3D - Fractal Brownian Motion
//   - domainWarp2D, domainWarp3D - Domain warping
//   - worleyNoise3D - Cellular/Worley noise
//
// GLSL_SDF - Signed Distance Functions:
//   - sdCircle, sdBox2D, sdSegment2D - 2D primitives
//   - sdSphere, sdBox, sdCylinder, sdCapsule, sdTorus, sdCone - 3D primitives
//   - opUnion, opSubtraction, opIntersection - Boolean ops
//   - opSmoothUnion, opSmoothSubtraction, opSmoothIntersection - Smooth blends
//   - opRepeat, opRepeatLimited, opMirror, opOnion - Domain ops
//
// GLSL_PBR - Physically Based Rendering:
//   - fresnelSchlick, fresnelSchlickRoughness - Fresnel
//   - distributionGGX, distributionBlinnPhong - NDF
//   - geometrySchlickGGX, geometrySmith - Geometry term
//   - cookTorranceBRDF, pbrDirect - Full BRDF
//   - subsurfaceScattering, subsurfaceBacklit - SSS approximations
//   - sRGBToLinear, linearToSRGB - Color space
//   - tonemapReinhard, tonemapACES, tonemapUncharted2 - Tone mapping
//
// GLSL_SCATTERING - Light transport:
//   - beerLambert - Absorption
//   - rayleighCoeff, rayleighCoeffRGB, rayleighPhase - Rayleigh scattering
//   - mieCoeff, henyeyGreenstein, cornetteShanks - Mie scattering
//   - extinction, scatteringAlbedo - Combined transport
//   - atmosphericSky - Simple sky model
//   - applyFog, applyHeightFog - Fog effects
