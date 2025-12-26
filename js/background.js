// ============================================
// BACKGROUND NEBULA EFFECT (Three.js)
// DISABLED - Now rendered in skill-graph.js WebGL context
// Uses distant sphere sampling with light integration from skill graph
// ============================================
(function initBackground() {
    // Nebula is now rendered in skill-graph.js for unified WebGL context
    // This allows planets to sample the background texture for fog/atmosphere
    return;

    var canvas = document.getElementById('gpu-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    if (!window.NEBULA_BACKGROUND_FRAGMENT_SHADER) {
        console.error('Nebula background shader not loaded!');
        return;
    }

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false,
        alpha: true,
        premultipliedAlpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(cachedWindowWidth, cachedWindowHeight);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    document.addEventListener('mousemove', function(e) {
        mouse.targetX = e.clientX / cachedWindowWidth;
        mouse.targetY = 1.0 - e.clientY / cachedWindowHeight;
    }, { passive: true });

    var geometry = new THREE.PlaneGeometry(2, 2);
    var material = new THREE.ShaderMaterial({
        vertexShader: backgroundVertexShader,
        fragmentShader: backgroundFragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uResolution: { value: new THREE.Vector2(cachedWindowWidth, cachedWindowHeight) },
            uCameraRotX: { value: 0 },
            uCameraRotY: { value: 0 },
            uLight0: { value: new THREE.Vector2(0, 0) },
            uLight1: { value: new THREE.Vector2(0, 0) },
            uLight2: { value: new THREE.Vector2(0, 0) },
            uLightColor0: { value: new THREE.Vector3(1.0, 0.67, 0.2) },
            uLightColor1: { value: new THREE.Vector3(0.6, 0.3, 0.8) },
            uLightColor2: { value: new THREE.Vector3(0.2, 0.87, 1.0) },
            uLight0Intensity: { value: 1.0 },
            uLight1Intensity: { value: 1.0 },
            uLight2Intensity: { value: 1.0 },
            uNebulaIntensity: { value: 0.25 },
            uNebulaScale: { value: 2.0 },
            uNebulaDetail: { value: 2.0 },
            uNebulaSpeed: { value: 0.08 },
            uLightInfluence: { value: 0.4 },
            uColorVariation: { value: 0.8 },
            uDustDensity: { value: 0.4 },
            uStarDensity: { value: 0.25 },
            uFractalIntensity: { value: 0.15 },
            uFractalScale: { value: 8.0 },
            uFractalSpeed: { value: 0.03 },
            uFractalSaturation: { value: 3.0 },
            uFractalFalloff: { value: 3.0 },
            uVignetteStrength: { value: 0.3 },
            uNebulaColorPurple: { value: new THREE.Vector3(0.12, 0.04, 0.18) },
            uNebulaColorCyan: { value: new THREE.Vector3(0.04, 0.12, 0.20) },
            uNebulaColorBlue: { value: new THREE.Vector3(0.03, 0.06, 0.15) },
            uNebulaColorGold: { value: new THREE.Vector3(0.15, 0.10, 0.03) },
            // God rays uniforms
            uGodRaysIntensity: { value: 0.8 },
            uGodRaysRadius: { value: 0.4 },
            uGodRaysFalloff: { value: 2.5 },
            uGodRaysNoiseScale: { value: 4.0 },
            uGodRaysNoiseStrength: { value: 0.1 },
            // Screen-space light positions (camera-transformed)
            uLight0Screen: { value: new THREE.Vector2(0, 0) },
            uLight1Screen: { value: new THREE.Vector2(0, 0) },
            uLight2Screen: { value: new THREE.Vector2(0, 0) }
        },
        transparent: true,
        depthWrite: false
    });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var time = 0;
    function animate() {
        requestAnimationFrame(animate);

        // Early exit if nebula is disabled - skip all uniform updates
        if (window.renderToggles && !window.renderToggles.nebula) {
            return;
        }

        time += 0.016;
        mouse.x += (mouse.targetX - mouse.x) * 0.02;
        mouse.y += (mouse.targetY - mouse.y) * 0.02;
        material.uniforms.uTime.value = time;
        material.uniforms.uMouse.value.set(mouse.x, mouse.y);

        material.uniforms.uCameraRotX.value = window.globalCameraRotX || 0;
        material.uniforms.uCameraRotY.value = window.globalCameraRotY || 0;

        var lights = window.globalLights;
        if (lights) {
            var res = lights.resolution || { width: cachedWindowWidth, height: cachedWindowHeight };
            material.uniforms.uResolution.value.set(res.width, res.height);

            if (lights.light0) {
                material.uniforms.uLight0.value.set(lights.light0.x, lights.light0.y);
                if (lights.light0.color) {
                    material.uniforms.uLightColor0.value.set(
                        lights.light0.color[0], lights.light0.color[1], lights.light0.color[2]
                    );
                }
                material.uniforms.uLight0Intensity.value = lights.light0.intensity || 1.0;
                // Screen-space position (camera-transformed)
                if (lights.light0.screenX !== undefined) {
                    material.uniforms.uLight0Screen.value.set(lights.light0.screenX, lights.light0.screenY);
                }
            }
            if (lights.light1) {
                material.uniforms.uLight1.value.set(lights.light1.x, lights.light1.y);
                if (lights.light1.color) {
                    material.uniforms.uLightColor1.value.set(
                        lights.light1.color[0], lights.light1.color[1], lights.light1.color[2]
                    );
                }
                material.uniforms.uLight1Intensity.value = lights.light1.intensity || 1.0;
                // Screen-space position (camera-transformed)
                if (lights.light1.screenX !== undefined) {
                    material.uniforms.uLight1Screen.value.set(lights.light1.screenX, lights.light1.screenY);
                }
            }
            if (lights.light2) {
                material.uniforms.uLight2.value.set(lights.light2.x, lights.light2.y);
                if (lights.light2.color) {
                    material.uniforms.uLightColor2.value.set(
                        lights.light2.color[0], lights.light2.color[1], lights.light2.color[2]
                    );
                }
                material.uniforms.uLight2Intensity.value = lights.light2.intensity || 1.0;
                // Screen-space position (camera-transformed)
                if (lights.light2.screenX !== undefined) {
                    material.uniforms.uLight2Screen.value.set(lights.light2.screenX, lights.light2.screenY);
                }
            }
        }

        // Read nebula parameters from global
        material.uniforms.uNebulaIntensity.value = nebulaParams.intensity;
        material.uniforms.uNebulaScale.value = nebulaParams.scale;
        material.uniforms.uNebulaDetail.value = nebulaParams.detail;
        material.uniforms.uNebulaSpeed.value = nebulaParams.speed;
        material.uniforms.uColorVariation.value = nebulaParams.colorVariation;
        material.uniforms.uDustDensity.value = nebulaParams.dustDensity;
        material.uniforms.uStarDensity.value = nebulaParams.starDensity;
        material.uniforms.uLightInfluence.value = nebulaParams.lightInfluence;
        material.uniforms.uFractalIntensity.value = nebulaParams.fractalIntensity;
        material.uniforms.uFractalScale.value = nebulaParams.fractalScale;
        material.uniforms.uFractalSpeed.value = nebulaParams.fractalSpeed;
        material.uniforms.uFractalSaturation.value = nebulaParams.fractalSaturation;
        material.uniforms.uFractalFalloff.value = nebulaParams.fractalFalloff;
        material.uniforms.uVignetteStrength.value = nebulaParams.vignetteStrength;
        material.uniforms.uNebulaColorPurple.value.set(nebulaParams.colorPurple[0], nebulaParams.colorPurple[1], nebulaParams.colorPurple[2]);
        material.uniforms.uNebulaColorCyan.value.set(nebulaParams.colorCyan[0], nebulaParams.colorCyan[1], nebulaParams.colorCyan[2]);
        material.uniforms.uNebulaColorBlue.value.set(nebulaParams.colorBlue[0], nebulaParams.colorBlue[1], nebulaParams.colorBlue[2]);
        material.uniforms.uNebulaColorGold.value.set(nebulaParams.colorGold[0], nebulaParams.colorGold[1], nebulaParams.colorGold[2]);

        // Read god rays parameters from global (if available)
        if (window.godRaysParams) {
            material.uniforms.uGodRaysIntensity.value = window.godRaysParams.lightIntensity || 0.8;
            material.uniforms.uGodRaysRadius.value = window.godRaysParams.lightRadius || 0.4;
            material.uniforms.uGodRaysFalloff.value = window.godRaysParams.lightFalloff || 2.5;
            material.uniforms.uGodRaysNoiseScale.value = window.godRaysParams.noiseScale || 4.0;
            material.uniforms.uGodRaysNoiseStrength.value = window.godRaysParams.noiseStrength || 0.1;
        }

        var t0 = window.renderTiming.start();
        renderer.render(scene, camera);
        window.renderTiming.end('nebula', t0);
    }

    animate();

    window.addEventListener('resize', function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

    console.log('Nebula background initialized with light integration');
})();
