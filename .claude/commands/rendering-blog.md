---
name: rendering-blog
description: Create professional blog posts about rendering techniques with animated SVG diagrams and code examples. Use this skill when writing technical articles about shaders, graphics programming, or real-time rendering for the portfolio blog.
license: MIT
---

This skill guides creation of high-quality technical blog posts about rendering techniques for the portfolio website's Blog section. Posts feature animated SVG diagrams, syntax-highlighted code examples, and clear explanations of graphics programming concepts.

## Blog Architecture Overview

The blog system uses JSON-based content stored in `blog/posts/`. Each post is a `.json` file with structured sections that get rendered dynamically.

### File Structure
```
blog/
├── index.json           # Registry of all posts and categories
├── posts/
│   ├── post-slug.json   # Individual post content
│   └── ...
├── images/              # Optional thumbnail images
└── BLOG_GUIDE.md        # Documentation
```

### Post JSON Schema

```json
{
    "id": "post-slug",
    "title": "Main Title",
    "subtitle": "Descriptive subtitle",
    "date": "YYYY-MM-DD",
    "category": "rendering|simulation|optimization|vfx",
    "tags": ["tag1", "tag2", "tag3"],
    "readTime": "X min",
    "featured": false,
    "thumbnail": null,
    "excerpt": "Brief description for the card preview (1-2 sentences).",
    "sections": [
        // Content sections go here
    ],
    "related": ["other-post-id"]
}
```

## Section Types

### 1. Intro Section
Opening paragraph with special styling (left border accent).

```json
{
    "type": "intro",
    "content": "Opening paragraph that introduces the technique and hooks the reader."
}
```

### 2. Heading Section
Section headers with `//` prefix styling.

```json
{
    "type": "heading",
    "level": 2,
    "content": "Section Title"
}
```
Use level 2 for main sections, level 3 for subsections.

### 3. Paragraph Section
Standard text content.

```json
{
    "type": "paragraph",
    "content": "Body text explaining concepts. Can include technical details and mathematical notation."
}
```

### 4. Code Section
Syntax-highlighted code blocks with header showing title and language.

```json
{
    "type": "code",
    "language": "glsl",
    "title": "Descriptive Code Title",
    "content": "// GLSL code here\nvec3 color = vec3(1.0);\n..."
}
```

**Languages supported**: `glsl`, `hlsl`, `javascript`, `cpp`, `python`

**Code formatting tips**:
- Use `\\n` for newlines in JSON strings
- Include comments explaining key operations
- Show practical, working examples
- Keep snippets focused (20-40 lines ideal)

### 5. List Section
Bulleted lists for key points, features, or considerations.

```json
{
    "type": "list",
    "items": [
        "First point with explanation",
        "Second point with details",
        "Third point highlighting important consideration"
    ]
}
```

### 6. Image Section
For diagrams, screenshots, or visual examples.

```json
{
    "type": "image",
    "src": "blog/images/filename.jpg",
    "alt": "Descriptive alt text",
    "caption": "Optional caption explaining the image"
}
```

### 7. Callout Section
Highlighted boxes for tips, warnings, or important information.

```json
{
    "type": "callout",
    "variant": "tip|warning|info",
    "content": "Important note or tip for the reader."
}
```

**Variants**:
- `tip` (teal): Best practices, optimization hints
- `warning` (amber): Common pitfalls, gotchas
- `info` (blue): Additional context, related concepts

### 8. Shader Demo Section
Interactive WebGL shader demos with real-time parameter controls. Shader code is stored directly in the JSON.

```json
{
    "type": "shader-demo",
    "id": "unique-demo-id",
    "title": "Demo Caption",
    "width": 700,
    "height": 400,
    "vertexShader": "attribute vec2 a_position;\nvarying vec2 v_texCoord;\nvoid main() {\n    v_texCoord = a_position * 0.5 + 0.5;\n    gl_Position = vec4(a_position, 0.0, 1.0);\n}",
    "fragmentShader": "precision highp float;\nvarying vec2 v_texCoord;\nuniform float u_time;\nuniform float u_param1;\n\nvoid main() {\n    vec2 uv = v_texCoord;\n    // Your shader code here\n    gl_FragColor = vec4(uv, 0.5, 1.0);\n}",
    "uniforms": {
        "u_time": { "type": "float", "value": 0.0 },
        "u_param1": { "type": "float", "value": 0.5 },
        "u_resolution": { "type": "vec2", "value": [700, 400] }
    },
    "controls": [
        {
            "uniform": "u_param1",
            "label": "Parameter Name",
            "min": 0,
            "max": 1,
            "step": 0.01,
            "default": 0.5
        }
    ]
}
```

**Key Points**:
- `vertexShader`: GLSL vertex shader code with `\n` for newlines
- `fragmentShader`: GLSL fragment shader code with `\n` for newlines
- `uniforms`: Define uniform variables (u_time is auto-updated for animation)
- `controls`: Optional sliders that modify uniforms in real-time
- Built-in uniforms: `u_time` (auto), `u_resolution` (canvas size)

**Shader Tips**:
- Use `precision highp float;` for WebGL compatibility
- Keep shaders simple for performance (runs every frame)
- Use the teal/gold color palette for consistency with site theme

### 9. SVG Diagram Section
Animated technical diagrams generated via JavaScript.

```json
{
    "type": "svg-diagram",
    "id": "unique-diagram-id",
    "title": "Diagram Caption",
    "width": 700,
    "height": 300
}
```

**IMPORTANT**: Each SVG diagram requires a corresponding generator function in `js/blog-diagrams.js` inside the `blogSvgDiagrams` object (exposed as `window.blogSvgDiagrams`).

## Creating SVG Diagram Generators

For each `svg-diagram` section, add a generator function to `js/blog-diagrams.js`:

```javascript
// Inside the IIFE in blog-diagrams.js
var svgDiagrams = {
    // ... existing diagrams ...

    'your-diagram-id': function(container, w, h) {
        var svg = createSvg(w, h);

        // Build your diagram using helper functions:
        // - createCircle(cx, cy, r, fill, stroke)
        // - createEllipse(cx, cy, rx, ry, fill, stroke)
        // - createRect(x, y, w, h, r, fill, stroke, strokeWidth)
        // - createLine(x1, y1, x2, y2, stroke, strokeWidth)
        // - createPath(d, fill, stroke, strokeWidth)
        // - createText(x, y, text, className)
        // - createGroup(transform)
        // - createArrow(x1, y1, x2, y2, color)
        // - createDoubleArrow(x1, y1, x2, y2, color)

        // For complex shapes not covered by helpers, create custom functions:
        // function createCustomShape(x, y, size) {
        //     var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        //     el.setAttribute('d', 'M' + x + ',' + y + ' L...');
        //     el.setAttribute('fill', 'none');
        //     el.setAttribute('stroke', '#2dd4bf');
        //     return el;
        // }

        // Add SMIL animations inside elements:
        // element.innerHTML = '<animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite"/>';

        container.appendChild(svg);
    }
};

// Exposed globally at the end of the IIFE:
window.blogSvgDiagrams = svgDiagrams;
```

### SVG Helper Functions Available

| Function | Purpose |
|----------|---------|
| `createSvg(w, h)` | Create SVG element with viewBox |
| `createGroup(transform)` | Create `<g>` for grouping |
| `createCircle(cx, cy, r, fill, stroke)` | Circle element |
| `createEllipse(cx, cy, rx, ry, fill, stroke)` | Ellipse element |
| `createRect(x, y, w, h, r, fill, stroke, strokeWidth)` | Rectangle with rounded corners |
| `createLine(x1, y1, x2, y2, stroke, strokeWidth)` | Line element |
| `createPath(d, fill, stroke, strokeWidth)` | Path with d attribute |
| `createText(x, y, text, className)` | Text element (centered) |
| `createArrow(x1, y1, x2, y2, color)` | Arrow with head |
| `createDoubleArrow(x1, y1, x2, y2, color)` | Bidirectional arrow |

### SVG Text Classes

| Class | Style |
|-------|-------|
| `diagram-title` | 16px Outfit, white |
| `diagram-label` | 13px Outfit, white |
| `diagram-label-small` | 11px JetBrains Mono, secondary |
| `diagram-label-tiny` | 9px JetBrains Mono, muted |

### Color Palette for Diagrams

| Color | Usage |
|-------|-------|
| `#2dd4bf` (teal) | Primary accent, data flow |
| `#e8b923` (gold) | Secondary accent, highlights |
| `rgba(45, 212, 191, 0.X)` | Teal with opacity |
| `rgba(232, 185, 35, 0.X)` | Gold with opacity |
| `rgba(255, 255, 255, 0.X)` | White with opacity |

### Animation Examples

**Pulsing circle**:
```javascript
circle.innerHTML = '<animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite"/>';
```

**Flowing highlight**:
```javascript
rect.innerHTML = '<animate attributeName="fill" values="rgba(45,212,191,0.1);rgba(45,212,191,0.3);rgba(45,212,191,0.1)" dur="2s" repeatCount="indefinite"/>';
```

**Drawing animation**:
```javascript
path.setAttribute('stroke-dasharray', '200');
path.setAttribute('stroke-dashoffset', '200');
path.innerHTML = '<animate attributeName="stroke-dashoffset" from="200" to="0" dur="1.5s" fill="freeze"/>';
```

**Staggered animation**:
```javascript
elements.forEach(function(el, i) {
    el.innerHTML = '<animate ... begin="' + (i * 0.2) + 's" .../>';
});
```

## Diagram Ideas for Rendering Techniques

### Pipeline/Flow Diagrams
- Show data flow through render passes
- Animate a "highlight" traveling through stages
- Use boxes connected by arrows
- Add resolution/format labels

### Comparison Diagrams
- Side-by-side before/after
- Split with VS divider
- Animate the difference (e.g., blur spreading)

### Mathematical Visualizations
- Graph curves (threshold functions, falloff)
- Bar charts (weight distributions)
- Coordinate systems with labeled axes

### Kernel/Pattern Diagrams
- Grid of sample points with weights
- Size encodes importance
- Pulse animation on samples

### Architecture Diagrams
- FBO ping-pong setups
- Mip chain pyramids
- Multi-pass pipelines

## Writing Guidelines

### Technical Accuracy
- Explain the mathematical foundations
- Reference established techniques (cite papers/sources in text)
- Show working code that matches explanations
- Include uniform/parameter recommendations

### Progressive Complexity
1. Start with high-level concept (what and why)
2. Explain the algorithm (how)
3. Show implementation details (code)
4. Discuss optimization and variations

### Code Comments
```glsl
// Calculate luminance using perceptual weights (BT.709)
float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));

// Soft knee - smooth transition around threshold
// Prevents harsh cutoffs and visible banding artifacts
float kneeWidth = uSoftKnee * 0.5 + 0.1;
```

### Practical Focus
- Real performance considerations
- Mobile/desktop differences
- Common pitfalls and solutions
- Tunable parameters with recommended ranges

## Category Guidelines

| Category | Focus |
|----------|-------|
| `rendering` | Lighting, shading, PBR, materials |
| `vfx` | Post-processing, bloom, particles |
| `simulation` | Physics, fluids, procedural |
| `optimization` | Performance, GPU, algorithms |

## Adding a New Post

1. **Create the JSON file**: `blog/posts/your-post-slug.json`

2. **Register in index**: Add `"your-post-slug"` to `blog/index.json` posts array

3. **Add SVG diagram generators**: Add functions to `blogSvgDiagrams` object in `js/blog-diagrams.js`

4. **Generate static HTML pages**: Run `node tools/build-blog.js` to generate SEO-friendly static pages

5. **Test locally**: Run `python -m http.server 8000` and verify at `http://localhost:8000`

6. **Generate LinkedIn version** (optional): Run `node tools/blog-to-linkedin.js your-post-slug` to create LinkedIn article with auto-generated diagram screenshots

## Static HTML Generation (SEO)

The blog uses a hybrid approach for SEO:
- **JSON files** store the content (easy to edit)
- **Static HTML pages** are generated for search engines and social sharing
- **JS-rendered version** provides the interactive portfolio experience

### Generated Files

Running `node tools/build-blog.js` creates:
- `/blog/index.html` - Blog listing page
- `/blog/{post-id}/index.html` - Individual post pages

### URLs

| URL | Description |
|-----|-------------|
| `charlesgrs.github.io/blog/` | Static blog index |
| `charlesgrs.github.io/blog/post-slug/` | Static post page (SEO-friendly) |
| `charlesgrs.github.io/?post=post-slug` | Portfolio with post auto-opened (deep link) |

### Static Page Features

Each generated post page includes:
- Full Open Graph meta tags (og:title, og:description, og:image)
- Twitter Card meta tags
- JSON-LD structured data (TechArticle schema)
- Canonical URLs
- "View in Portfolio" link that deep-links to `/?post=post-slug`
- Same styling as portfolio blog (uses css/blog.css)
- Embedded JS for shader demos and SVG diagrams

### Deep Linking

The portfolio supports opening a specific blog post via URL parameter:
```
https://charlesgrs.github.io/?post=screen-space-atmospheric-scattering
```

This automatically:
1. Switches to the Blog tab
2. Opens the specified post

Static pages link to this URL via the "View in Portfolio" button.

### Build Workflow

After creating or editing a post:
```bash
# Generate/regenerate all static HTML pages
node tools/build-blog.js

# Commit everything
git add .
git commit -m "Add new blog post: Post Title"
git push
```

### Social Sharing

With static HTML pages, sharing a post URL on Twitter/LinkedIn/Facebook will show:
- Post title
- Post excerpt/description
- Thumbnail image (from `blog/images/`)

Test your OG tags at:
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/
- Facebook: https://developers.facebook.com/tools/debug/

## Example: Complete Post Structure

```json
{
    "id": "technique-name",
    "title": "Technique Name: Descriptive Subtitle",
    "subtitle": "Brief one-line description",
    "date": "2024-12-29",
    "category": "rendering",
    "tags": ["tag1", "tag2", "glsl"],
    "readTime": "12 min",
    "featured": false,
    "thumbnail": null,
    "excerpt": "Learn how to implement X technique for real-time rendering applications.",
    "sections": [
        {
            "type": "intro",
            "content": "Hook paragraph explaining what this technique achieves and why it matters."
        },
        {
            "type": "svg-diagram",
            "id": "overview-diagram",
            "title": "Technique Overview",
            "width": 700,
            "height": 250
        },
        {
            "type": "heading",
            "level": 2,
            "content": "The Algorithm"
        },
        {
            "type": "paragraph",
            "content": "Explanation of the core algorithm..."
        },
        {
            "type": "code",
            "language": "glsl",
            "title": "Core Implementation",
            "content": "// GLSL code\n..."
        },
        {
            "type": "svg-diagram",
            "id": "detail-diagram",
            "title": "Visual Explanation",
            "width": 600,
            "height": 200
        },
        {
            "type": "heading",
            "level": 2,
            "content": "Performance Considerations"
        },
        {
            "type": "list",
            "items": [
                "Key optimization 1",
                "Key optimization 2"
            ]
        },
        {
            "type": "callout",
            "variant": "tip",
            "content": "Pro tip for better results."
        }
    ],
    "related": ["related-post-id"]
}
```

## Quality Checklist

Before publishing a post:

- [ ] JSON validates (no syntax errors)
- [ ] All SVG diagram IDs have matching generator functions
- [ ] Code examples compile/run correctly
- [ ] Diagrams animate smoothly
- [ ] Mobile responsive (diagrams scale)
- [ ] Category and tags are appropriate
- [ ] Excerpt is compelling (150-200 chars)
- [ ] Related posts are valid IDs
- [ ] Read time is realistic

## Final Principles

**Teach through visualization**: Every complex concept should have an animated diagram that makes it click.

**Working code over pseudocode**: Readers should be able to copy, paste, and learn.

**Respect the reader's time**: Dense information, clear structure, no fluff.

**Show the math, explain the why**: Graphics programming is applied mathematics—embrace it.
