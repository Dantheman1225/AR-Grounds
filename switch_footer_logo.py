import os
import re

site_dir = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

html_files = []
for root, dirs, files in os.walk(site_dir):
    for f in files:
        if f.endswith(".html"):
            html_files.append(os.path.join(root, f))

for filepath in html_files:
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    # We want to replace the img in <div class="footer-brand">
    # from Landscape Transparent Banner.svg with Landscape Banner Footer.svg
    # and remove the filter
    
    new_html = re.sub(
        r'(<div class="footer-brand">\s*<img src="[^"]*)Landscape Transparent Banner.svg(" alt=".*?" style="height: 60px; width: auto; margin-bottom: 20px;) filter: invert\(1\) brightness\(1\.5\);(">)',
        r'\g<1>Landscape Banner Footer.svg\g<2>\g<3>',
        html
    )
    
    if new_html != html:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_html)
        print(f"Updated {os.path.basename(filepath)}")

print("Done switching to Landscape Banner Footer.svg")
