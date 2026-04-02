import os
import re

site_dir = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

html_files = []
for root, dirs, files in os.walk(site_dir):
    for f in files:
        if f.endswith(".html"):
            html_files.append(os.path.join(root, f))

def replace_footer(html, is_admin):
    img_src = "../assets/brand/Landscape Transparent Banner.svg" if is_admin else "assets/brand/Landscape Transparent Banner.svg"
    new_footer = f'''<div class="footer-brand">
        <img src="{img_src}" alt="Grounds Maintenance Logo" style="height: 60px; width: auto; margin-bottom: 20px; filter: invert(1) brightness(1.5);">
        <p>Pressure washing for Central Arkansas homeowners.</p>
      </div>'''
    
    # regex to find <div class="footer-brand">...</div> containing any content, across multiple lines
    # careful with nesting
    pattern = re.compile(r'<div\s+class="footer-brand">.*?(?=<div class="footer-cols">)', re.IGNORECASE | re.DOTALL)
    
    # Actually wait! The regex should cover <div class="footer-brand"> to its closing tag before <div class="footer-cols">
    # Let's match from <div class="footer-brand"> to </div\s*>\s*<div class="footer-cols">
    pattern2 = re.compile(r'<div\s+class="footer-brand">.*?</div\s*>\s*(?=<div class="footer-cols">)', re.IGNORECASE | re.DOTALL)
    
    new_html = pattern2.sub(new_footer + '\n      ', html)
    return new_html

for filepath in html_files:
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    is_admin = 'admin' in filepath
    new_html = replace_footer(html, is_admin)
    
    if new_html != html:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_html)
        print(f"Updated {os.path.basename(filepath)}")

print("Done.")
