import os
import re

site_dir = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

# 1. Fix index.html
index_path = os.path.join(site_dir, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    index_html = f.read()

index_html = index_html.replace("background-image: url('assets/gallery/IMG_0359.webp')", "background-image: url('assets/gallery/Driveway Before.webp')")
index_html = index_html.replace("background-image: url('assets/gallery/IMG_0361.webp')", "background-image: url('assets/gallery/Driveway After.webp')")

index_html = index_html.replace("background-image: url('assets/gallery/IMG_0362.webp')", "background-image: url('assets/gallery/Front Door Before.webp')")
index_html = index_html.replace("background-image: url('assets/gallery/IMG_0363.webp')", "background-image: url('assets/gallery/Front Door After.webp')")

index_html = index_html.replace("background-image: url('assets/gallery/IMG_0366.webp')", "background-image: url('assets/gallery/Driveway 2 Before.webp')")
index_html = index_html.replace("background-image: url('assets/gallery/IMG_0367.webp')", "background-image: url('assets/gallery/Driveway 2 After.webp')")

with open(index_path, "w", encoding="utf-8") as f:
    f.write(index_html)
print("Updated index.html")

# 2. Fix gallery.html
gallery_path = os.path.join(site_dir, "gallery.html")
with open(gallery_path, "r", encoding="utf-8") as f:
    gallery_html = f.read()

pairs = [
    ("Driveway Before.webp", "Driveway After.webp"), # Card 1
    ("Driveway 2 Before.webp", "Driveway 2 After.webp"), # Card 2
    ("Front Door Before.webp", "Front Door After.webp"), # Card 3
    ("Loading Dock Before.webp", "Loading Dock After.webp"), # Card 4
    ("Resturant Back Door Before.webp", "Resturant Back Door After.webp"), # Card 5
]

# We want to replace each:
# <div class="gallery-panel gallery-panel--before">
#   <span class="gallery-label">BEFORE</span>
#   <div class="gallery-placeholder">...</div>
# </div>
# with:
# <div class="gallery-panel gallery-panel--before" style="background-image: url('assets/gallery/xxx'); background-size: cover; background-position: center;">
#   <span class="gallery-label">BEFORE</span>
# </div>

import re

# Use regex to find and replace the before and after panels
pattern_before = re.compile(
    r'<div class="gallery-panel gallery-panel--before">\s*<span class="gallery-label">BEFORE</span>\s*<div class="gallery-placeholder">.*?</div>\s*</div>',
    re.DOTALL
)
pattern_after = re.compile(
    r'<div class="gallery-panel gallery-panel--after">\s*<span class="gallery-label">AFTER</span>\s*<div class="gallery-placeholder gallery-placeholder--clean">.*?</div>\s*</div>',
    re.DOTALL
)

def repl_before(match, idx=[0]):
    i = idx[0]
    out = f'<div class="gallery-panel gallery-panel--before" style="background-image: url(\'assets/gallery/{pairs[i % len(pairs)][0]}\'); background-size: cover; background-position: center;">\n                <span class="gallery-label">BEFORE</span>\n              </div>'
    idx[0] += 1
    return out

def repl_after(match, idx=[0]):
    i = idx[0]
    out = f'<div class="gallery-panel gallery-panel--after" style="background-image: url(\'assets/gallery/{pairs[i % len(pairs)][1]}\'); background-size: cover; background-position: center;">\n                <span class="gallery-label">AFTER</span>\n              </div>'
    idx[0] += 1
    return out

gallery_html = pattern_before.sub(repl_before, gallery_html)
gallery_html = pattern_after.sub(repl_after, gallery_html)

# Let's also hide that "gallery-note" since the placeholders are gone!
gallery_html = gallery_html.replace(
    '<div class="gallery-note reveal-up">', 
    '<div class="gallery-note reveal-up" style="display:none;">'
)

with open(gallery_path, "w", encoding="utf-8") as f:
    f.write(gallery_html)
print("Updated gallery.html")

