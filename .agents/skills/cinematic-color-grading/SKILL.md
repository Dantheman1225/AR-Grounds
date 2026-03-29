---
name: Cinematic Color Grading
description: Strategic rules on using HSL and defining color hierarchies for a wow-factor web design.
---

# Cinematic Color Grading

A modern web experience feels more fluid when colors are treated as lighting, not flat buckets of paint.

1. **Brand Tints via HSL**: 
   When using primary colors, declare them in HSL natively:
   ```css
   :root {
     --primary-h: 210;
     --primary-s: 100%;
     --primary-l: 50%;
   }
   ```
   This allows you to create dynamic background layers like `hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)` for sub-cards.
2. **True Dark Mode avoids Black**: 
   A perfect cinematic dark mode uses very dark tones pulled from the brand palette, e.g. a dark slate `#0B0E14` instead of `#000000`, creating a cooler, sleeker ambiance.
3. **Glassmorphism**: 
   To mimic high-end materials, rely on semi-transparent backgrounds with a backdrop-filter blur:
   `background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.1);`. 
4. **Vibrant Accents on Dark Backgrounds**: 
   If elements require absolute focus (like a "Get a Quote" CTAs), use a highly saturated gradient accent instead of a flat background color. (e.g. `linear-gradient(135deg, #10B981, #047857)`).
5. **Glow Emphasizes Importance**: 
   Create soft glows around important UI elements using box shadows: `box-shadow: 0 0 40px rgba(16, 185, 129, 0.2);`. It acts as a spotlight for the user's eye and feels cinematic.
