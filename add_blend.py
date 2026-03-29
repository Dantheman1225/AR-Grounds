import re
import os

site = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

pages = ["index.html","gallery.html","services.html","contact.html",
         "quote.html","faq.html","thank-you.html","404.html"]
admin_pages = ["dashboard.html","leads.html","jobs.html","customers.html",
               "payments.html","photos.html","settings.html","login.html"]

# Add mix-blend-mode: screen to footer SVG img so white bg disappears on dark footer
def add_blend_mode(content):
    return re.sub(
        r'(Landscape Banner Footer\.svg"[^>]*style=")([^"]*?)(")',
        lambda m: m.group(1) + m.group(2).rstrip() + ' mix-blend-mode: screen;' + m.group(3),
        content,
        flags=re.IGNORECASE
    )

all_pages = [(p, "") for p in pages] + [(p, "admin") for p in admin_pages]

for page, level in all_pages:
    path = os.path.join(site, level, page) if level else os.path.join(site, page)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    updated = add_blend_mode(content)
    if updated != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(updated)
        print(f"  Added mix-blend-mode: {level+'/' if level else ''}{page}")

print("Done.")
