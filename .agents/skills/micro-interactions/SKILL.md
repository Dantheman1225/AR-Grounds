---
name: Fluid Micro-Interactions
description: Principles for utilizing transitions, hovers, and dynamic visual states to breathe life into web design.
---

# Fluid Micro-Interactions

A static site feels dead in the age of dynamic web apps. To achieve a wow-factor, implement fluid micro-interactions across user touch points.

1. **Bezier Curve Transitions**: 
   Linear and `ease` transitions look robotic and cheap. Use custom bezier curves, like `transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);` which creates a fast initial reaction that smoothly settles into place. 
2. **Hover Scalability via Transforms**:
   When hovering over cards or buttons, gently scaling up the element by `1.02` to `1.05` via `transform: translateY(-4px) scale(1.02)` adds a sense of tangibility to the UI. Do not animate padding, top, or margin, as they cause repaints and stuttering. Only rely on `transform` and `opacity`.
3. **Cursor Reactivity**: 
   A primary button should respond visibly: `filter: brightness(1.2)` or modifying the underlying gradient `background-position` and creating a softer button shadow.
4. **Reveal Up Animations**: 
   Content shouldn't just instantly hit the screen—it should animate gracefully into view (`transform: translateY(20px)` mapped to opacity). This gives the illusion of speed and premium polish as they scroll or navigate across the page.
5. **Reduced Motion**: 
   Respect `@media (prefers-reduced-motion: reduce)` by wrapping major animations inside it, ensuring that users with accessibility needs do not encounter nausea-inducing scaling, but the core design aesthetic holds up.
