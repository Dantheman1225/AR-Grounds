import os
import glob
import re

brand_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media"
site_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final"

def get_svg(filename):
    with open(os.path.join(brand_dir, filename), 'r', encoding='utf-8') as f:
        svg = f.read()
    return re.sub(r'<\?xml[^>]*\?>\n?', '', svg).strip()

# Read the raw SVG path codes
try:
    icon_svg = get_svg('Icon SVG code.SVG')
except:
    icon_svg = get_svg('Icon SVG code.svg')
    
try:
    text_svg = get_svg('Header Text SVG code.note')
except:
    text_svg = get_svg('Header Text SVG code.svg')

# The user explicitly said: "just use the header icon and header text SVG code in the footer"
# Since they wanted it to display well on dark, we can automatically turn dark greens to white and light greens to lighter,
# OR we can just inject them as is, but we will brighten them so they look good on a dark footer.
# But wait, the user said "It already has a transparent background so you could just place it in the footer that's the most direct method."
# Let's apply a fill="currentColor" or just leave it. I will leave it as is, but maybe add a class so the user can control it.
# Actually, the path fills are hardcoded in the SVGs. So we will replace the dark text hex codes to white.

# Replace dark greens with white (or `#fdfdfd`) and lighter greens with `#7fe8a2` (brand colors) for the footer text to be visible on dark background.
def whiten_svg(svg_content):
    # These are typical Canva or exported SVG colors used previously
    svg_content = svg_content.replace('#1a6b3c', '#ffffff') 
    svg_content = svg_content.replace('#0a0c0a', '#ffffff')
    svg_content = svg_content.replace('#23432c', '#ffffff')
    svg_content = svg_content.replace('#244131', '#e8ece9')
    svg_content = svg_content.replace('#152916', '#ffffff')
    svg_content = svg_content.replace('#000000', '#ffffff')
    return svg_content

footer_icon_svg = whiten_svg(icon_svg)
footer_text_svg = whiten_svg(text_svg)

# Add scaling via inline styles or classes
def inject_scale(svg, cls, inline_style):
    return svg.replace('<svg ', f'<svg class="{cls}" style="{inline_style}" ')

footer_icon_svg = inject_scale(footer_icon_svg, 'footer-icon-svg', 'height: 48px; width: auto; flex-shrink: 0;')
footer_text_svg = inject_scale(footer_text_svg, 'footer-text-svg', 'height: 36px; width: auto; flex-shrink: 0;')

footer_logo_html = f'''<a href="index.html" class="flex items-center gap-3 mb-6 group" style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
    {footer_icon_svg}
    {footer_text_svg}
</a>'''

html_files = glob.glob(os.path.join(site_dir, '**', '*.html'), recursive=True)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    original_html = html

    # Target the footer block and inject the raw SVGs.
    # The previous script might have left `<a href="index.html" class="flex items-center gap-3 mb-6 group"> <img src=...> ... </a>` 
    # Or `<div class="footer-brand">`
    def repl_footer(m):
        fcontent = m.group(0)
        
        # Replace the entire <a href="index.html" class="flex... group"> ... </a> inside the footer
        new_fcontent = re.sub(
            r'<a href="index\.html" class="flex items-center gap-3 mb-6 group"[\s\S]*?</a>',
            footer_logo_html,
            fcontent
        )
        
        # If the above didn't change anything, it means the <a> tag is missing or different, let's target the exact div we injected previously:
        if new_fcontent == fcontent:
            new_fcontent = re.sub(
                r'<div class="flex items-center gap-3 mb-6" style="filter: brightness\(0\) invert\(1\);".*?</div>',
                footer_logo_html,
                fcontent,
                flags=re.DOTALL
            )
            
        # What if it's the original <img src="assets/brand/Landscape White Footer.svg"...>
        if new_fcontent == fcontent:
            new_fcontent = re.sub(
                r'<img[^>]*Landscape\s+White[^>]*>',
                footer_logo_html,
                fcontent,
                flags=re.IGNORECASE
            )
            
        return new_fcontent

    html = re.sub(r'<footer.*?</footer>', repl_footer, html, flags=re.DOTALL|re.IGNORECASE)
    
    if html != original_html:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print('Updated', filepath)

print("Done")
