#!/usr/bin/env python3
"""
Favicon Generator
Generates all favicon sizes from a source image.

Usage:
    python tools/generate-favicons.py <source_image>
    python tools/generate-favicons.py favicon.png
"""

from PIL import Image
import os
import sys

def generate_favicons(src_path, dst_dir='assets/favicon'):
    # Get script directory to resolve relative paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    # Resolve paths relative to project root
    if not os.path.isabs(src_path):
        src_path = os.path.join(project_root, src_path)
    if not os.path.isabs(dst_dir):
        dst_dir = os.path.join(project_root, dst_dir)

    # Create output directory if needed
    os.makedirs(dst_dir, exist_ok=True)

    # Load source image
    img = Image.open(src_path)
    print(f'Loaded {src_path} ({img.width}x{img.height})')

    # Convert to RGBA if needed
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Create different sizes
    sizes = [
        ('favicon-16x16.png', 16),
        ('favicon-32x32.png', 32),
        ('apple-touch-icon.png', 180),
        ('android-chrome-192x192.png', 192),
        ('android-chrome-512x512.png', 512),
    ]

    for filename, size in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(dst_dir, filename), 'PNG')
        print(f'  Created {filename}')

    # Create ICO file with multiple sizes
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = [img.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
    ico_images[0].save(os.path.join(dst_dir, 'favicon.ico'), format='ICO', sizes=ico_sizes)
    print(f'  Created favicon.ico')

    print(f'\nAll favicons generated in {dst_dir}')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python generate-favicons.py <source_image>')
        print('Example: python tools/generate-favicons.py favicon.png')
        sys.exit(1)

    generate_favicons(sys.argv[1])
