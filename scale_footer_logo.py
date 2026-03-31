import re
import os

site = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

pages = ["index.html","gallery.html","services.html","contact.html",
         "quote.html","faq.html","thank-you.html","404.html"]
admin_pages = ["dashboard.html","leads.html","jobs.html","customers.html",
               "payments.html","photos.html","settings.html"]

# Update footer brand image: scale up to 60px height for readability
# Ensuring it uses Landscape Transparent Banner.svg

NEW_SRC = "assets/brand/Landscape Transparent Banner.svg"
NEW_HEIGHT = "60px"
NEW_STYLE = f"height: {NEW_HEIGHT}; width: auto; margin-bottom: 16px; filter: invert(1) brightness(1.5);"

def process_content(content, prefix=""):
    # 1. Update the src to Landscape Transparent Banner.svg if it's not already
    src_pat = re.compile(
        r'(<div class="footer-brand">\s*<img [^>]*src=")[^"]*(")',
        re.IGNORECASE
    )
    content = src_pat.sub(r'\1' + prefix + NEW_SRC + r'\2', content)
    
    # 2. Update the style attribute
    style_pat = re.compile(
        r'(<div class="footer-brand">\s*<img [^>]*style=")[^"]*(")',
        re.IGNORECASE
    )
    new_style_content = f'height: {NEW_HEIGHT}; width: auto; margin-bottom: 20px; filter: invert(1) brightness(1.5);'
    
    if style_pat.search(content):
        content = style_pat.sub(r'\1' + new_style_content + r'\2', content)
    else:
        # If no style tag, add it
        img_pat = re.compile(
            r'(<div class="footer-brand">\s*<img [^>]*)(/?>)',
            re.IGNORECASE
        )
        content = img_pat.sub(r'\1 style="' + new_style_content + r'" \2', content)
    
    return content

for page in pages:
    path = os.path.join(site, page)
    if not os.path.exists(path): continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = process_content(content, "")
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated footer in {page}")

for page in admin_pages:
    path = os.path.join(site, "admin", page)
    if not os.path.exists(path): continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = process_content(content, "../")
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated footer in admin/{page}")

print("Footer logo scaling complete.")
