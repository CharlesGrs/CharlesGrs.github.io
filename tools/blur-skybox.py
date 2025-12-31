#!/usr/bin/env python3
"""
Blur the skybox texture for cheaper real-time rendering.
Handles horizontal wrapping for seamless equirectangular textures.
Usage: python tools/blur-skybox.py
"""

from PIL import Image, ImageFilter
import os

input_path = os.path.join(os.path.dirname(__file__), '..', 'blog', 'shaders', 'skybox.jpg')
output_path = os.path.join(os.path.dirname(__file__), '..', 'blog', 'shaders', 'skybox-blurred.jpg')

# Load image
img = Image.open(input_path)
print(f'Input: {input_path}')
print(f'Size: {img.size}')

width, height = img.size
blur_radius = 8

# For seamless horizontal blur on equirectangular:
# 1. Extend the image by copying edges to create wrap-around
# 2. Blur the extended image
# 3. Crop back to original size

# Create extended image (add blur_radius pixels on left and right from opposite edges)
extended_width = width + blur_radius * 2
extended = Image.new('RGB', (extended_width, height))

# Copy main image to center
extended.paste(img, (blur_radius, 0))

# Copy right edge to left padding (for seamless wrap)
right_strip = img.crop((width - blur_radius, 0, width, height))
extended.paste(right_strip, (0, 0))

# Copy left edge to right padding
left_strip = img.crop((0, 0, blur_radius, height))
extended.paste(left_strip, (width + blur_radius, 0))

# Apply Gaussian blur to extended image
blurred_extended = extended.filter(ImageFilter.GaussianBlur(radius=blur_radius))

# Crop back to original size
blurred = blurred_extended.crop((blur_radius, 0, blur_radius + width, height))

# Save
blurred.save(output_path, 'JPEG', quality=85)

print(f'Output: {output_path}')
print(f'Done!')
