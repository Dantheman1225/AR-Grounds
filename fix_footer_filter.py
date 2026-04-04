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

    # Revert to filter: invert(1) brightness(1.5);
    new_html = html.replace('filter: brightness(0) invert(1);', 'filter: invert(1) brightness(1.5);')

    if new_html != html:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_html)
        print(f"Updated {os.path.basename(filepath)}")

print("Done restoring invert filter.")
