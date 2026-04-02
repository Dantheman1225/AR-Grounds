import os
import re

def process_svg(svg_text):
    # 1. Strip the background bounding box so path 2 draws positive text/circle
    svg_text = svg_text.replace('M0,404.25V0h1536v404.25H0Z', '')

    # We need a regex that matches the entire path/polygon/rect tag
    def modify_tag(match):
        tag = match.group(0)
        
        # Determine X coordinate to know if it's Left (Icon) or Right (Text)
        x_match = re.search(r'd="[^\d-]*M?([-+]?\d*\.?\d+)', tag)
        if not x_match:
            x_match = re.search(r'points="([-+]?\d*\.?\d+)', tag)
        if not x_match:
            x_match = re.search(r'x="([\d\.]+)"', tag)
            
        x_coord = 0
        if x_match:
            x_coord = float(x_match.group(1))

        # Check the fill color
        color_match = re.search(r'fill:\s*(#[a-fA-F0-9]{6})', tag)
        if not color_match:
            return tag
            
        orig_color = color_match.group(1).lower()
        new_tag = tag

        if orig_color == '#fdfdfd':
            # This is path 2 (background circle + left text) OR an inner hole overlay
            if x_coord < 300:
                # X=0 is path 2. X=236 is the white curve highlights in the icon.
                # Both should be solid white.
                new_tag = new_tag.replace('fill: #fdfdfd', 'fill: #ffffff')
            else:
                # X > 300: These are the explicit "stickers" drawn perfectly inside the holes 
                # of "Grounds MAINTENANCE". We color them the exact footer background so they act as holes!
                new_tag = new_tag.replace('fill: #fdfdfd', 'fill: #0a1f12')
                
        elif orig_color == '#23432c':
            # These are the explicit right-side text characters ("PRESSURE WASHING").
            # They must be white text.
            new_tag = new_tag.replace('fill: #23432c', 'fill: #ffffff')
            # And they need evenodd applied, because they are natively exported with overlapping
            # subpaths that don't reveal their holes under nonzero default rules.
            # Only add it if not present.
            if 'fill-rule' not in new_tag:
                # Add it right after the opening tag
                new_tag = new_tag.replace('<path ', '<path fill-rule="evenodd" ')
                new_tag = new_tag.replace('<polygon ', '<polygon fill-rule="evenodd" ')

        return new_tag

    # Execute the replacement for all shape elements
    svg_text = re.sub(r'<(path|polygon|rect)[^>]*>', modify_tag, svg_text)

    # Wrap properly
    m = re.search(r'(<svg[^>]*>.*?</svg>)', svg_text, re.DOTALL)
    if m:
        final_svg = m.group(1)
        final_svg = re.sub(r'<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 404.25">',
                           '<svg class="footer-logo" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 404.25">', final_svg)
        return final_svg
    return svg_text

orig_path = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media\Land Scape Banner SVG code.svg'
with open(orig_path, 'r', encoding='utf-8') as f:
    clean_svg = f.read()

perfect_svg = process_svg(clean_svg)

site_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final"
for root, dirs, files in os.walk(site_dir):
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                html = file.read()
            
            new_html = re.sub(r'<svg class="footer-logo"[^>]*>.*?</svg>', perfect_svg, html, flags=re.DOTALL)
            
            if new_html != html:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_html)
                print(f"Updated full-color icon SVG: {path}")

print("Done seamlessly mapping original logo colors.")
