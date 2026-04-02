import os
import re

def process_svg(svg_text):
    # Strip bounding box
    svg_text = svg_text.replace('M0,404.25V0h1536v404.25H0Z', '')

    def modify_tag(match):
        tag = match.group(0)
        
        x_match = re.search(r'd="[^\d-]*M?([-+]?\d*\.?\d+)', tag)
        if not x_match:
            x_match = re.search(r'points="([-+]?\d*\.?\d+)', tag)
        if not x_match:
            x_match = re.search(r'x="([\d\.]+)"', tag)
            
        x_coord = 0
        if x_match:
            x_coord = float(x_match.group(1))

        color_match = re.search(r'fill:\s*(#[a-fA-F0-9]{6})', tag)
        if not color_match:
            return tag
            
        orig_color = color_match.group(1).lower()
        new_tag = tag

        if orig_color == '#fdfdfd':
            if x_coord < 300:
                # Path 2 and Icon highlights.
                new_tag = new_tag.replace('fill: #fdfdfd', 'fill: #ffffff')
                # CRITICALLY: Path 2 NEEDS evenodd to not blob out its native holes!
                if 'fill-rule' not in new_tag:
                    new_tag = new_tag.replace('<path ', '<path fill-rule="evenodd" ')
            else:
                # Explicit off-white hole faker tags placed over dark green right text or left shapes.
                # Must be the exact footer color to fake transparency on the dark footer.
                new_tag = new_tag.replace('fill: #fdfdfd', 'fill: #0a1f12')
                
        elif orig_color == '#23432c':
            # Right side text shapes. Must be white.
            new_tag = new_tag.replace('fill: #23432c', 'fill: #ffffff')
            # They also natively export as compound paths sometimes and need evenodd.
            if 'fill-rule' not in new_tag:
                new_tag = new_tag.replace('<path ', '<path fill-rule="evenodd" ')
                new_tag = new_tag.replace('<polygon ', '<polygon fill-rule="evenodd" ')

        return new_tag

    svg_text = re.sub(r'<(path|polygon|rect)[^>]*>', modify_tag, svg_text)

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
    if '.git' in root: continue
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                html = file.read()
            
            new_html = re.sub(r'<svg class="footer-logo"[^>]*>.*?</svg>', perfect_svg, html, flags=re.DOTALL)
            
            if new_html != html:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_html)
                print(f"Updated full-color icon SVG + native holes mapping: {path}")

print("Done. Absolute final fix for native nested path rendering holes + logo.")
