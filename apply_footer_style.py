import re
import os

site = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

pages = ["index.html","gallery.html","services.html","contact.html",
         "quote.html","faq.html","thank-you.html","404.html"]
admin_pages = ["dashboard.html","leads.html","jobs.html","customers.html",
               "payments.html","photos.html","settings.html"]

# Target only the footer-brand div and fix the img style within it
FOOTER_PAT = re.compile(
    r'(<div class="footer-brand">\s*<img src="[^"]*"[^>]*style=")[^"]*(")',
    re.IGNORECASE
)
FOOTER_STYLE = 'height: 42px; margin-bottom: 12px; filter: invert(1) brightness(1.5);'

FOOTER_NO_STYLE_PAT = re.compile(
    r'(<div class="footer-brand">\s*<img src="[^"]*")(\s*/?>)',
    re.IGNORECASE
)
FOOTER_WITH_STYLE = r'\1 style="' + FOOTER_STYLE + r'" />'

for page in pages:
    path = os.path.join(site, page)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = FOOTER_PAT.sub(lambda m: m.group(1) + FOOTER_STYLE + m.group(2), content)
    if new_content == content:
        # No style attr found, add it
        new_content = FOOTER_NO_STYLE_PAT.sub(FOOTER_WITH_STYLE, content)
    
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  Style applied: {page}")
    else:
        print(f"  No change: {page}")

for page in admin_pages:
    path = os.path.join(site, "admin", page)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = FOOTER_PAT.sub(lambda m: m.group(1) + FOOTER_STYLE + m.group(2), content)
    if new_content == content:
        new_content = FOOTER_NO_STYLE_PAT.sub(FOOTER_WITH_STYLE, content)
    
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  Style applied: admin/{page}")

print("Done.")
