# Blog System Guide

This blog system allows you to easily add rendering technique articles without any build step.

## Quick Start

1. Create a new JSON file in `blog/posts/` with your article content
2. Add the post ID to `blog/index.json`
3. Refresh the page - your post will appear

## File Structure

```
blog/
├── index.json           # List of all posts and categories
├── posts/
│   ├── your-post.json   # Individual post files
│   └── ...
├── images/              # Images for your posts
│   ├── thumbnail.jpg
│   └── ...
└── BLOG_GUIDE.md        # This guide
```

## Creating a New Post

### 1. Create the post file

Create `blog/posts/my-new-post.json`:

```json
{
    "id": "my-new-post",
    "title": "Your Post Title",
    "subtitle": "A short subtitle",
    "date": "2024-12-20",
    "category": "rendering",
    "tags": ["webgl", "glsl", "shaders"],
    "readTime": "5 min",
    "featured": false,
    "thumbnail": "my-thumbnail.jpg",
    "excerpt": "A brief description that appears on the card.",
    "sections": [
        // Content sections go here
    ]
}
```

### 2. Add to index

Add the post ID to `blog/index.json`:

```json
{
    "posts": [
        "my-new-post",
        "existing-post"
    ]
}
```

## Content Sections

Each section in the `sections` array has a `type` and content-specific properties:

### Intro
Large, emphasized opening paragraph.
```json
{
    "type": "intro",
    "content": "Your intro text here..."
}
```

### Heading
Section headers (level 2 or 3).
```json
{
    "type": "heading",
    "level": 2,
    "content": "Section Title"
}
```

### Paragraph
Regular text content.
```json
{
    "type": "paragraph",
    "content": "Your paragraph text..."
}
```

### Code
Syntax-highlighted code blocks.
```json
{
    "type": "code",
    "language": "glsl",
    "title": "Fragment Shader",
    "content": "void main() {\n    gl_FragColor = vec4(1.0);\n}"
}
```

Supported languages: `glsl`, `javascript`, `c`, `cpp`

### List
Bulleted lists.
```json
{
    "type": "list",
    "items": [
        "First point",
        "Second point",
        "Third point"
    ]
}
```

### Image
Images with optional captions.
```json
{
    "type": "image",
    "src": "my-image.jpg",
    "alt": "Description of image",
    "caption": "Optional caption text"
}
```

Images should be placed in `blog/images/`.

### Callout
Highlighted tips, warnings, or info boxes.
```json
{
    "type": "callout",
    "variant": "tip",
    "content": "Pro tip: Always profile before optimizing!"
}
```

Variants: `tip` (teal), `warning` (amber), `info` (blue)

## Categories

Available categories:
- `rendering` - Shaders, lighting, post-processing
- `simulation` - Physics, particles, compute
- `optimization` - Performance tips, profiling
- `vfx` - Visual effects, procedural content

## Featured Posts

Set `"featured": true` to make a post span two columns in the grid.
Use sparingly - ideally 1-2 featured posts at a time.

## Tips

1. **Image optimization**: Keep thumbnails under 200KB, use WebP when possible
2. **Code formatting**: Use `\n` for newlines, `\t` for tabs in code blocks
3. **Date format**: Always use `YYYY-MM-DD` format
4. **Read time**: Estimate ~200 words per minute
5. **Excerpts**: Keep under 200 characters for clean card display
