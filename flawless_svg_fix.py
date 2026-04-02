import os
import re

# Read pristine original SVG
orig_path = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media\Land Scape Banner SVG code.svg'
with open(orig_path, 'r', encoding='utf-8') as f:
    clean_svg = f.read()

# 1. Modify the SVG strings natively
# We need to strip the original background box so it reveals the text as positive.
# The background box is exactly: M0,404.25V0h1536v404.25H0Z
clean_svg = clean_svg.replace('M0,404.25V0h1536v404.25H0Z', '')

# 2. Recolor the elements
# `fill: #fdfdfd;` appears in path 2 (the massive text path) AND 9 other polygons (the left-side loops).
# To handle this carefully:
# We know path 2 is the ONLY path with M243.71,203.84
clean_svg = clean_svg.replace('style="fill: #fdfdfd;"', 'style="fill: var(--fdfdfd-placeholder);"')

# Now map everything:
# Right-side text explicit shapes (#23432c). We make them white, AND add evenodd so their native holes work perfectly!
clean_svg = clean_svg.replace('style="fill: #23432c;"', 'style="fill: #ffffff; fill-rule: evenodd;"')

# Left-side shadow `#244131` => `#e8ece9`
clean_svg = clean_svg.replace('style="fill: #244131;"', 'style="fill: #e8ece9;"')

# Leaf dark green `#526c3d` => `#7fe8a2`
clean_svg = clean_svg.replace('style="fill: #526c3d;"', 'style="fill: #7fe8a2;"')

# Leaf shadow `#b6c0b9` => `#e8ece9`
clean_svg = clean_svg.replace('style="fill: #b6c0b9;"', 'style="fill: #e8ece9;"')

# Now for the placeholders:
# `path 2` is the text outline. Make it white, no evenodd needed because the loops are explicitly masked.
clean_svg = clean_svg.replace('<path d="M243.71,203.84', '<path style="fill: #ffffff;" d="M243.71,203.84')
clean_svg = clean_svg.replace('style="fill: var(--fdfdfd-placeholder);"', 'style="fill: #0a1f12;"')
# Clean out duplicate style attributes if we accidentally made 2
clean_svg = clean_svg.replace('style="fill: #ffffff;" d="M243.71,203.84c-2.58-151-227.61-150.97-230.17,0,2.58,150.99,227.61,150.97,230.17,0ZM825.12,93.69l-.03,215.36h5s.03-215.36.03-215.36h-5ZM873.11,106.05v4.01h636.7v-4.01h-636.7ZM318.24,113.81', 
                              'd="M243.71,203.84c-2.58-151-227.61-150.97-230.17,0,2.58,150.99,227.61,150.97,230.17,0ZM825.12,93.69l-.03,215.36h5s.03-215.36.03-215.36h-5ZM873.11,106.05v4.01h636.7v-4.01h-636.7ZM318.24,113.81')
clean_svg = clean_svg.replace('<path d="M243.71', '<path style="fill: #ffffff;" d="M243.71')

# Now extract just the <svg ...> contents
m = re.search(r'(<svg[^>]*>.*?</svg>)', clean_svg, re.DOTALL)
final_svg = m.group(1)

# Ensure the logo scales properly
final_svg = re.sub(r'<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 404.25">',
                   '<svg class="footer-logo" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 404.25">', final_svg)

site_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final"

html_files = []
for root, dirs, files in os.walk(site_dir):
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

for path in html_files:
    with open(path, 'r', encoding='utf-8') as file:
        html = file.read()
    
    # Replace the existing footer svg with the perfect native one
    new_html = re.sub(r'<svg class="footer-logo"[^>]*>.*?</svg>', final_svg, html, flags=re.DOTALL)
    
    if new_html != html:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(new_html)
        print(f"Injected perfect pristine native SVG: {path}")

print("Done. Native pristine SVG accurately recolored and applied to all files.")
