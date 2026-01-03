/**
 * Shader Loader for Light Transport Lab
 * Loads GLSL shaders from external files
 */

const ShaderLoader = {
    cache: new Map(),

    /**
     * Load a shader file and return its content
     * @param {string} url - Path to the shader file
     * @returns {Promise<string>} - Shader source code
     */
    async load(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load shader: ${url} (${response.status})`);
        }

        const source = await response.text();
        this.cache.set(url, source);
        return source;
    },

    /**
     * Load multiple shaders in parallel
     * @param {Object} shaders - Object mapping names to URLs
     * @returns {Promise<Object>} - Object mapping names to shader sources
     */
    async loadAll(shaders) {
        const entries = Object.entries(shaders);
        const sources = await Promise.all(
            entries.map(([name, url]) => this.load(url))
        );

        const result = {};
        entries.forEach(([name], index) => {
            result[name] = sources[index];
        });
        return result;
    },

    /**
     * Compile a shader from source
     * @param {WebGL2RenderingContext} gl - WebGL context
     * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param {string} source - GLSL source code
     * @returns {WebGLShader|null} - Compiled shader or null on error
     */
    compile(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const typeName = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
            console.error(`${typeName} shader compilation error:`, gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    },

    /**
     * Create a program from vertex and fragment shader sources
     * @param {WebGL2RenderingContext} gl - WebGL context
     * @param {string} vertSource - Vertex shader source
     * @param {string} fragSource - Fragment shader source
     * @returns {WebGLProgram|null} - Linked program or null on error
     */
    createProgram(gl, vertSource, fragSource) {
        const vs = this.compile(gl, gl.VERTEX_SHADER, vertSource);
        if (!vs) return null;

        const fs = this.compile(gl, gl.FRAGMENT_SHADER, fragSource);
        if (!fs) {
            gl.deleteShader(vs);
            return null;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        // Shaders can be deleted after linking
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    },

    /**
     * Get uniform locations for a program
     * @param {WebGL2RenderingContext} gl - WebGL context
     * @param {WebGLProgram} program - Compiled program
     * @param {string[]} uniformNames - Array of uniform names
     * @returns {Object} - Object mapping uniform names to locations
     */
    getUniforms(gl, program, uniformNames) {
        const uniforms = {};
        for (const name of uniformNames) {
            uniforms[name] = gl.getUniformLocation(program, name);
        }
        return uniforms;
    },

    /**
     * Get attribute locations for a program
     * @param {WebGL2RenderingContext} gl - WebGL context
     * @param {WebGLProgram} program - Compiled program
     * @param {string[]} attributeNames - Array of attribute names
     * @returns {Object} - Object mapping attribute names to locations
     */
    getAttributes(gl, program, attributeNames) {
        const attributes = {};
        for (const name of attributeNames) {
            attributes[name] = gl.getAttribLocation(program, name);
        }
        return attributes;
    }
};

// Export for module usage or attach to window for script usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShaderLoader;
} else {
    window.ShaderLoader = ShaderLoader;
}
