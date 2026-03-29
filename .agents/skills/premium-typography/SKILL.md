---
name: Premium Typography Mastery
description: Guidelines for implementing cinematic, conversion-focused typography in web design.
---

# Premium Typography Mastery

When building web applications or websites with high wow-factor and premium aesthetics, follow these rules:

1. **Avoid Default Fonts**: Never use system default fonts like Arial or Times New Roman unless for fallback. Always default to sleek, modern Sans-Serif or highly curated Serif fonts (e.g. Inter, Outfit, Playfair Display).
2. **Letter Spacing**: Use slight negative letter spacing on headings (e.g. `letter-spacing: -0.02em;` to `-0.05em;`) to create a tighter, more substantial and punchy feeling. Use slight positive letter spacing (`0.05em`) to uppercase sub-headings (eyebrows) for breathability.
3. **Contrast and Hierarchy**: Create massive contrast between `h1`/`h2` headings and `<p>` body text. If the body text is 18px (for readability), the primary hero heading should be dramatically large (e.g. `clamp(3rem, 5vw + 1rem, 6rem)`). 
4. **Line Height**: Headings require tight line-heights (`1.0` to `1.1`), while body text requires generous line heights (`1.5` to `1.7`) for maximum readability.
5. **Color Muting**: Pure black (`#000`) on Pure White (`#FFF`), or vice versa, causes eye strain. Soften text colors slightly. For dark mode, use an off-white like `#F4F4F5`. For light mode, use a very dark slate or gray `#18181B`. Always mute secondary text properties with opacity or lighter hex codes to define clear hierarchy without relying solely on font sizes.
