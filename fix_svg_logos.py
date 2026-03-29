import re
import os
import shutil

brand_src = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/Brand Media"
brand_dest = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final/assets/brand"
site = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

# ============================================================
# 1. Create a footer-safe (inverted/white) version of the SVG
#    by replacing dark fill #133217 with white, and removing
#    any background rect elements.
# ============================================================
print("Creating footer-safe SVG...")
banner_path = os.path.join(brand_dest, "Landscape Transparent Banner.svg")
with open(banner_path, "r", encoding="utf-8") as f:
    svg = f.read()

# Create footer version: swap dark green to white so it reads on dark bg
footer_svg = svg
footer_svg = re.sub(r'fill="#133217"', 'fill="#ffffff"', footer_svg, flags=re.IGNORECASE)
footer_svg = re.sub(r'fill="#133d31"', 'fill="#ffffff"', footer_svg, flags=re.IGNORECASE)
footer_svg = re.sub(r"fill='#133217'", "fill='#ffffff'", footer_svg, flags=re.IGNORECASE)
# Remove any background rect without explicit fill (defaults to black/white unpredictably)
footer_svg = re.sub(r'<rect x="0" width="\d+" y="0" height="\d+"/>', '', footer_svg)

footer_dest = os.path.join(brand_dest, "Landscape Banner Footer.svg")
with open(footer_dest, "w", encoding="utf-8") as f:
    f.write(footer_svg)
print(f"  Saved: {footer_dest}")

# ============================================================
# 2. Patch all public pages: footer to use the white SVG
# ============================================================
pages = ["index.html","gallery.html","services.html","contact.html",
         "quote.html","faq.html","thank-you.html","404.html"]
admin_pages = ["dashboard.html","leads.html","jobs.html","customers.html",
               "payments.html","photos.html","settings.html","login.html"]

def patch_footer_logo(content, prefix=""):
    # Replace whatever is currently in the footer-brand img src
    old_pat = re.compile(
        r'(<div class="footer-brand">\s*<img src=")[^"]*(")',
        re.IGNORECASE
    )
    return old_pat.sub(
        lambda m: m.group(1) + prefix + 'assets/brand/Landscape Banner Footer.svg' + m.group(2),
        content
    )

def patch_header_logo(content, prefix=""):
    # Ensure header uses Landscape Transparent Banner.svg at correct height
    old_pat = re.compile(
        r'(<div class="container nav-wrap">.*?class="brand"[^>]*>)\s*<img src="[^"]*"[^>]*>(\s*</a>)',
        re.IGNORECASE | re.DOTALL
    )
    new_img = f'\n        <img src="{prefix}assets/brand/Landscape Transparent Banner.svg" alt="Grounds Maintenance" style="height: 36px; width: auto;" />\n      '
    return old_pat.sub(lambda m: m.group(1) + new_img + m.group(2), content)

# Patch public pages
for page in pages:
    path = os.path.join(site, page)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = patch_footer_logo(content, prefix="")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Patched footer: {page}")

# Patch admin pages
for page in admin_pages:
    path = os.path.join(site, "admin", page)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = patch_footer_logo(content, prefix="../")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Patched footer: admin/{page}")

# ============================================================
# 3. Fix admin/login.html specifically — it has a special
#    centered logo layout, not a .brand anchor
# ============================================================
print("\nFixing admin/login.html logo block...")
login_path = os.path.join(site, "admin", "login.html")
with open(login_path, "r", encoding="utf-8") as f:
    login = f.read()

# Replace the dual-image admin-login-logo with a single banner SVG
old_logo = re.compile(
    r'<div class="admin-login-logo">.*?</div>',
    re.DOTALL | re.IGNORECASE
)
new_logo = (
    '<div class="admin-login-logo" style="display:flex;justify-content:center;margin-bottom:8px;">\n'
    '      <img src="../assets/brand/Landscape Transparent Banner.svg" '
    'alt="Grounds Maintenance" style="height: 40px; width: auto;" />\n'
    '    </div>'
)
login = old_logo.sub(new_logo, login)
with open(login_path, "w", encoding="utf-8") as f:
    f.write(login)
print("  admin/login.html fixed.")

# ============================================================
# 4. Fix admin sidebar logos (dashboard, leads, etc.)
#    Admin pages use .admin-sidebar .brand or similar
# ============================================================
print("\nFixing admin sidebar logos...")
for page in admin_pages:
    if page == "login.html":
        continue
    path = os.path.join(site, "admin", page)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Fix any dual Icon.svg + Header Text.svg combos remaining
    dual_pat = re.compile(
        r'<img src="[^"]*Icon\.svg"[^>]*?aria-hidden="true"[^/]*/>\s*\n?\s*<img src="[^"]*Header Text\.svg"[^>]*/>', 
        re.IGNORECASE
    )
    replacement = '<img src="../assets/brand/Landscape Transparent Banner.svg" alt="Grounds Maintenance" style="height: 32px; width: auto;" />'
    content = dual_pat.sub(replacement, content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  admin/{page} sidebar logo fixed.")

print("\nAll done! Footer SVG is now white-on-dark, header SVG stays dark-on-white.")
