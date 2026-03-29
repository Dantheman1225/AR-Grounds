import re
import os

site = r"d:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final"

pages = ["index.html","gallery.html","services.html","contact.html",
         "quote.html","faq.html","thank-you.html","404.html"]
admin_pages = ["dashboard.html","leads.html","jobs.html","customers.html",
               "payments.html","photos.html","settings.html","login.html"]

# Remove the leftover filter from the footer img since the SVG is already white
def clean_filter(content):
    return re.sub(
        r'(Landscape Banner Footer\.svg"[^>]*?)filter:[^;]+;?\s*',
        r'\1',
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
    cleaned = clean_filter(content)
    if cleaned != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(cleaned)
        print(f"  Cleaned filter: {level+'/' if level else ''}{page}")
    else:
        print(f"  No filter found: {level+'/' if level else ''}{page}")

print("Done.")
