import os
from bs4 import BeautifulSoup

site_dir = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

html_files = []
for root, dirs, files in os.walk(site_dir):
    for f in files:
        if f.endswith(".html"):
            html_files.append(os.path.join(root, f))

for filepath in html_files:
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    footers = soup.find_all(class_="footer-brand")
    
    modified = False
    for fb in footers:
        # Check if we are in admin dir
        is_admin = 'admin' in filepath
        img_src = "../assets/brand/Landscape Transparent Banner.svg" if is_admin else "assets/brand/Landscape Transparent Banner.svg"
        
        # Clear out current contents
        fb.clear()
        
        # Add the new img
        img = soup.new_tag("img", src=img_src, alt="Grounds Maintenance Logo", style="height: 60px; width: auto; margin-bottom: 20px; filter: invert(1) brightness(1.5);")
        fb.append(img)
        
        # Add the paragraph
        p = soup.new_tag("p")
        p.string = "Pressure washing for Central Arkansas homeowners."
        fb.append(p)
        
        modified = True

    if modified:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(str(soup))
        print(f"Updated {os.path.basename(filepath)}")

print("Done.")
