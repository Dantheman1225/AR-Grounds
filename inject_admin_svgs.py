import os
import re

brand_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media"
site_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final"

def get_svg(filename):
    with open(os.path.join(brand_dir, filename), 'r', encoding='utf-8') as f:
        svg = f.read()
    return re.sub(r'<\?xml[^>]*\?>\n?', '', svg).strip()

icon_svg = get_svg('Icon SVG code.SVG')
text_svg = get_svg('Header Text SVG code.note')

icon_svg = icon_svg.replace('<svg ', '<svg class="brand-icon" style="height: 48px; width: auto; flex-shrink: 0;" ')
text_svg = text_svg.replace('<svg ', '<svg class="brand-text" style="height: 34px; width: auto; flex-shrink: 0;" ')

for root, _, files in os.walk(site_dir):
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                html = file.read()
                
            original = html
            
            # Replace img tags that reference the logos
            html = re.sub(r'<img [^>]*src="\.\./assets/brand/Icon\.svg"[^>]*>', icon_svg, html)
            html = re.sub(r'<img [^>]*src="\.\./assets/brand/Header Text\.svg"[^>]*>', text_svg, html)

            html = re.sub(r'<img [^>]*src="assets/brand/Icon\.svg"[^>]*>', icon_svg, html)
            html = re.sub(r'<img [^>]*src="assets/brand/Header Text\.svg"[^>]*>', text_svg, html)

            # If Landscape banner was used in sidebar, we'll replace it too
            if 'admin-sidebar' in html:
                # wait, let's just make sure landscape is not caught
                pass

            if html != original:
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(html)
                print(f"Patched Imgs: {filepath}")
