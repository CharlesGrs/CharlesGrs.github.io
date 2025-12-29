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

### 8. SVG Diagram Section (CRITICAL)
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

**IMPORTANT**: Each SVG diagram requires a corresponding generator function in `js/blog.js` inside the `svgDiagrams` object.

## Creating SVG Diagram Generators

For each `svg-diagram` section, add a generator function to `js/blog.js`:

```javascript
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

        // Add SMIL animations inside elements:
        // element.innerHTML = '<animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite"/>';

        container.appendChild(svg);
    }
};
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

3. **Add SVG diagram generators**: Add functions to `svgDiagrams` object in `js/blog.js`

4. **Test locally**: Run `python -m http.server 8000` and verify at `http://localhost:8000`

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
