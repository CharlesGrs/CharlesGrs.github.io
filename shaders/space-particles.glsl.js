// Space Particles Shaders - Depth of Field particle system
// WebGL 1 compatible with shooting star support

window.SPACE_PARTICLE_VERTEX_SHADER = `
    attribute vec3 aPosition;  // xyz = world position (in sphere around origin)
    attribute float aLife;     // 0-1 lifecycle for twinkling, or shooting star data packed

    uniform vec2 uResolution;
    uniform float uTime;

    // DoF parameters
    uniform float uFocusDistance;   // Distance from camera where particles are in focus
    uniform float uFocusRange;      // Range around focus distance that's sharp
    uniform float uNearBlurDist;    // Distance where near blur starts
    uniform float uFarBlurDist;     // Distance where far blur starts
    uniform float uMaxBlurSize;     // Maximum blur circle size
    uniform float uApertureSize;    // Affects bokeh intensity (f-stop simulation)

    // Particle appearance
    uniform float uParticleSize;    // Base particle size
    uniform float uBrightness;      // Overall brightness
    uniform float uSphereRadius;    // Particle distribution sphere radius

    // Render control
    uniform float uPlanetZ;         // Z depth where planets live
    uniform float uRenderPass;      // 0 = all, 1 = far only, 2 = near only
    uniform float uCameraRotX;      // Camera pitch
    uniform float uCameraRotY;      // Camera yaw
    uniform vec3 uCameraPos;        // Camera position XYZ (free camera)

    varying float vBlurAmount;      // 0 = sharp, 1 = max blur
    varying float vLife;
    varying float vAlpha;
    varying vec3 vWorldPos;
    varying float vCameraDist;      // Distance from camera
    varying float vShootingStar;    // 0 = normal, 1 = shooting star (gold), 2 = shooting star (teal)
    varying float vShootingProgress; // 0-1 progress through shooting star animation

    void main() {
        vec3 particlePos = aPosition;
        vWorldPos = particlePos;

        // Decode life value: integer part encodes shooting star type, fractional is life/progress
        // 0.x = normal particle, 1.x = gold shooting star, 2.x = teal shooting star
        float lifeEncoded = aLife;
        vShootingStar = floor(lifeEncoded);
        vShootingProgress = fract(lifeEncoded);
        float actualLife = vShootingProgress;

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

        // Vector from camera to particle
        vec3 toParticle = particlePos - cameraPos;

        // Distance from camera along view direction
        float zDist = dot(toParticle, cameraForward);
        vCameraDist = zDist;

        // Render pass culling
        if (uRenderPass > 0.5) {
            bool isFar = zDist > 0.95;
            bool wantFar = uRenderPass < 1.5;
            if (isFar != wantFar) {
                gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
                gl_PointSize = 0.0;
                vAlpha = 0.0;
                vBlurAmount = 0.0;
                vLife = 0.0;
                return;
            }
        }

        // Cull if behind camera
        if (zDist < 0.01) {
            gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
            gl_PointSize = 0.0;
            vAlpha = 0.0;
            vBlurAmount = 0.0;
            vLife = 0.0;
            return;
        }

        // Perspective projection
        float perspectiveScale = 1.0 / zDist;
        vec2 screenCenter = uResolution * 0.5;
        float projX = dot(toParticle, cameraRight) * perspectiveScale;
        float projY = dot(toParticle, cameraUp) * perspectiveScale;
        vec2 projectedPos = screenCenter + vec2(projX, -projY) * uResolution.x;

        // Convert to clip space
        vec2 clipPos = (projectedPos / uResolution) * 2.0 - 1.0;
        clipPos.y = -clipPos.y;
        gl_Position = vec4(clipPos, 0.0, 1.0);

        // Calculate blur amount based on distance from focus plane
        // Using actual camera distance for proper DoF
        float distFromFocus = abs(zDist - uFocusDistance);

        // Calculate Circle of Confusion (CoC)
        // Near blur (closer than focus)
        float nearBlur = 0.0;
        if (zDist < uFocusDistance) {
            nearBlur = smoothstep(uFocusDistance - uFocusRange, uNearBlurDist, uFocusDistance - zDist);
        }

        // Far blur (further than focus)
        float farBlur = 0.0;
        if (zDist > uFocusDistance) {
            farBlur = smoothstep(uFocusDistance + uFocusRange, uFarBlurDist, zDist - uFocusDistance + uFocusDistance);
        }

        // Combine blur amounts
        vBlurAmount = clamp(max(nearBlur, farBlur) * uApertureSize, 0.0, 1.0);

        // Base particle size with perspective
        float baseSize = uParticleSize * perspectiveScale;

        // Add blur size (Circle of Confusion)
        float blurSize = vBlurAmount * uMaxBlurSize * perspectiveScale;
        float finalSize = baseSize + blurSize;

        // Twinkling
        float twinkle = sin(actualLife * 6.28318 + uTime * 2.0) * 0.15 + 1.0;

        // Shooting stars are small, bright points (no blur/bokeh)
        float shootingScale = 1.0;
        float shootingAlpha = 1.0;
        float shootingSize = 0.0; // Override for shooting stars
        if (vShootingStar > 0.5) {
            // Shooting stars: small bright points with fade in/out
            float fadeIn = smoothstep(0.0, 0.1, vShootingProgress);
            float fadeOut = 1.0 - smoothstep(0.6, 1.0, vShootingProgress);
            // Small, sharp size (ignore blur, just use base size with perspective)
            shootingSize = baseSize * 1.5 * fadeIn * fadeOut;
            shootingAlpha = fadeIn * fadeOut * 3.0; // Extra bright
            // Force no blur for shooting stars
            vBlurAmount = 0.0;
        }

        // Use shooting star size if active, otherwise normal size
        float pointSize = vShootingStar > 0.5 ? shootingSize : finalSize * twinkle;
        gl_PointSize = max(pointSize, 1.0);

        // Alpha: sharper particles are brighter, blurry ones dimmer but more spread out
        float focusAlpha = 1.0 - vBlurAmount * 0.5;

        // Fade near camera
        float cameraAlpha = smoothstep(0.0, 0.2, zDist);

        vLife = actualLife;
        vAlpha = clamp(focusAlpha * cameraAlpha * shootingAlpha, 0.0, 1.0) * uBrightness;
    }
`;

window.SPACE_PARTICLE_FRAGMENT_SHADER = `
    #extension GL_OES_standard_derivatives : enable
    precision highp float;

    varying float vBlurAmount;  // 0 = sharp, 1 = max blur
    varying float vLife;
    varying float vAlpha;
    varying vec3 vWorldPos;
    varying float vCameraDist;
    varying float vShootingStar;    // 0 = normal, 1 = gold shooting star, 2 = teal shooting star
    varying float vShootingProgress; // 0-1 animation progress

    uniform float uTime;
    uniform vec2 uResolution;

    // Sun light uniforms
    uniform vec2 uLight0;
    uniform vec2 uLight1;
    uniform vec2 uLight2;
    uniform vec3 uLightColor0;
    uniform vec3 uLightColor1;
    uniform vec3 uLightColor2;
    uniform float uLight0Intensity;
    uniform float uLight1Intensity;
    uniform float uLight2Intensity;

    // Circle quality uniforms
    uniform float uCircleSoftness;    // Edge softness (0 = hard, 1 = very soft)
    uniform float uBokehRingWidth;    // Width of bokeh ring (0 = filled, 1 = thin ring)
    uniform float uBokehRingIntensity; // Brightness of ring edge
    uniform float uLightFalloff;      // How quickly light falls off with distance

    // Shooting star colors
    uniform vec3 uShootingGoldColor;  // Gold shooting star color
    uniform vec3 uShootingTealColor;  // Teal shooting star color

    // Base particle color
    uniform vec3 uBaseParticleColor;  // Default particle color

    void main() {
        vec2 coord = gl_PointCoord * 2.0 - 1.0;
        float r = length(coord);

        // High quality circle with smooth anti-aliased edge
        // Use smoothstep for AA (fwidth requires extension)
        float aaEdge = smoothstep(1.0, 0.95, r);

        if (aaEdge < 0.001) discard;

        // Bokeh shape based on blur amount
        float sharpness = 1.0 - vBlurAmount;

        // Sharp particles: gaussian falloff (bright center)
        float gaussianShape = exp(-r * r * (3.0 + sharpness * 5.0));

        // Blurry particles: bokeh disc with optional ring
        // Ring effect - brighter at edges like real lens bokeh
        float ringRadius = 0.7 + uBokehRingWidth * 0.25;
        float ringFalloff = 0.15 + (1.0 - uBokehRingWidth) * 0.3;
        float ring = smoothstep(ringRadius - ringFalloff, ringRadius, r) *
                     smoothstep(1.0, ringRadius + ringFalloff, r);
        float disc = smoothstep(1.0, 0.0, r * 0.5);  // Soft filled disc

        // Combine ring and disc based on ring intensity
        float bokehShape = mix(disc, disc + ring * uBokehRingIntensity, vBlurAmount);

        // Blend between sharp gaussian and blurry bokeh
        float shape = mix(gaussianShape, bokehShape, vBlurAmount);

        // Apply AA edge
        shape *= aaEdge;

        // Apply softness
        float softShape = mix(shape, shape * smoothstep(1.0, 1.0 - uCircleSoftness, r), uCircleSoftness);

        // Calculate lighting from 3 suns
        vec2 particleScreen = vWorldPos.xy * uResolution * 0.5 + uResolution * 0.5;

        vec3 totalLight = vec3(0.0);

        // Sun 0
        float dist0 = length(particleScreen - uLight0);
        float influence0 = 1.0 / (1.0 + dist0 * uLightFalloff * 0.001);
        totalLight += uLightColor0 * influence0 * uLight0Intensity;

        // Sun 1
        float dist1 = length(particleScreen - uLight1);
        float influence1 = 1.0 / (1.0 + dist1 * uLightFalloff * 0.001);
        totalLight += uLightColor1 * influence1 * uLight1Intensity;

        // Sun 2
        float dist2 = length(particleScreen - uLight2);
        float influence2 = 1.0 / (1.0 + dist2 * uLightFalloff * 0.001);
        totalLight += uLightColor2 * influence2 * uLight2Intensity;

        // Light intensity for visibility
        float lightIntensity = length(totalLight);

        // Tint color based on nearby suns
        vec3 lightColor = lightIntensity > 0.001 ? normalize(totalLight) : vec3(1.0);

        // Base color from uniform, tinted by sun colors
        // Sharp particles pick up more color, blurry ones stay neutral (like real bokeh)
        vec3 baseColor = uBaseParticleColor;
        float colorStrength = sharpness * 0.7;
        vec3 color = mix(baseColor, lightColor, colorStrength);

        // Shooting star colors from uniforms
        if (vShootingStar > 1.5) {
            // Teal shooting star
            color = uShootingTealColor;
            // Add white core that fades as it progresses
            float coreIntensity = 1.0 - vShootingProgress * 0.8;
            color = mix(color, vec3(1.0), coreIntensity * 0.5);
        } else if (vShootingStar > 0.5) {
            // Gold shooting star
            color = uShootingGoldColor;
            // Add white core that fades as it progresses
            float coreIntensity = 1.0 - vShootingProgress * 0.8;
            color = mix(color, vec3(1.0), coreIntensity * 0.5);
        }

        // Twinkling - more pronounced for in-focus particles (disabled for shooting stars)
        float twinkle = 1.0;
        if (vShootingStar < 0.5) {
            twinkle = sin(vLife * 6.28318 * 3.0 + uTime) * (0.05 + sharpness * 0.1) + 0.95;
        }
        color *= twinkle;

        // Final brightness - blurred particles fade to invisible
        // sharpness = 1 means in focus, sharpness = 0 means max blur (invisible)
        float focusBrightness = sharpness * sharpness; // Quadratic falloff for smooth fade
        float boostedLight = lightIntensity * 8.0;
        float brightness = softShape * vAlpha * focusBrightness * min(boostedLight, 2.5);

        // Shooting stars are extra bright (and ignore blur fade)
        if (vShootingStar > 0.5) {
            brightness = softShape * vAlpha * min(boostedLight, 2.5) * 1.5;
        }

        // Discard very dim particles (including fully blurred ones)
        if (brightness < 0.005) discard;

        // Additive blending output
        gl_FragColor = vec4(color, brightness);
    }
`;
