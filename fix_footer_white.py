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

    # Find the image inside <div class="footer-brand">
    # We'll replace it with the transparent banner and pure white filter
    
    def replacer(match):
        img_src_path = match.group(1) # get the relative path part
        # Construct the new img tag
        return f'{img_src_path}Landscape Transparent Banner.svg" alt="Grounds Maintenance Logo" style="height: 60px; width: auto; margin-bottom: 20px; filter: brightness(0) invert(1);">'
    
    new_html = re.sub(
        r'(<div class="footer-brand">\s*<img src="[^"]*?)(Landscape Banner Footer\.svg|Landscape Transparent Banner\.svg)["\'][^>]*>',
        r'\g<1>Landscape Transparent Banner.svg" alt="Grounds Maintenance Logo" style="height: 60px; width: auto; margin-bottom: 20px; filter: brightness(0) invert(1);">',
        html
    )
    
    # Just to be safe if the pattern didn't match the exact attributes
    # Actually let's use a simpler replacer for the src
    
    new_html = re.sub(r'src="([^"]*)Landscape Banner Footer.svg"[^>]*>', 
                      r'src="\g<1>Landscape Transparent Banner.svg" alt="Grounds Maintenance Logo" style="height: 60px; width: auto; margin-bottom: 20px; filter: brightness(0) invert(1);">', 
                      html)
    
    # Also fix anything that already has Landscape Transparent Banner.svg but wrong filter
    new_html = re.sub(r'src="([^"]*)Landscape Transparent Banner.svg"[^>]*filter:[^>]*>', 
                      r'src="\g<1>Landscape Transparent Banner.svg" alt="Grounds Maintenance Logo" style="height: 60px; width: auto; margin-bottom: 20px; filter: brightness(0) invert(1);">', 
                      new_html)

    if new_html != html:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_html)
        print(f"Updated {os.path.basename(filepath)}")

print("Done restoring white footer logos.")
