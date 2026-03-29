import re
import os

site = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

# Revert footer to use the ORIGINAL dark SVG (Landscape Transparent Banner.svg)
# + mix-blend-mode: multiply to make the white bg disappear on dark footer
# + brightness + invert to make the dark text appear white

pages = ["index.html","gallery.html","services.html","contact.html",
         "quote.html","faq.html","thank-you.html","404.html"]
admin_pages = ["dashboard.html","leads.html","jobs.html","customers.html",
               "payments.html","photos.html","settings.html"]

def fix_footer_final(content, prefix=""):
    # Replace any footer brand img (either footer svg variant) with the correct approach
    pat = re.compile(
        r'(<div class="footer-brand">\s*<img src=")[^"]*(")',
        re.IGNORECASE
    )
    new_src = prefix + 'assets/brand/Landscape Transparent Banner.svg'
    return pat.sub(
        lambda m: m.group(1) + new_src + m.group(2),
        content
    )

def fix_footer_style(content):
    # Fix the style on the footer img to use mix-blend-mode: multiply + invert for white-on-dark
    pat = re.compile(
        r'(Landscape Transparent Banner\.svg"[^>]*style=")[^"]*(")',
        re.IGNORECASE
    )
    new_style = 'height: 42px; margin-bottom: 12px; filter: invert(1) brightness(1.5);'
    return pat.sub(lambda m: m.group(1) + new_style + m.group(2), content)

for page in pages:
    path = os.path.join(site, page)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    # Check if it's the footer (not header) instance we're targeting
    # For footer, we apply invert filter. Header uses the same SVG but NO filter.
    # So: replace separately by splitting
    
    # Step 1: Make footer use original SVG
    content = fix_footer_final(content, prefix="")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Footer fixed: {page}")

for page in admin_pages:
    path = os.path.join(site, "admin", page)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = fix_footer_final(content, prefix="../")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Footer fixed: admin/{page}")

print("Done.")
