import os
import re

base = r'd:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final'

pages = [
    'index.html', 'gallery.html', 'services.html', 'contact.html', 
    'quote.html', 'faq.html', '404.html', 'thank-you.html'
]
admin_pages = [
    'dashboard.html', 'leads.html', 'jobs.html', 'customers.html', 
    'payments.html', 'photos.html', 'settings.html', 'login.html'
]

def fix_header(content, level=''):
    prefix = '../' if level == 'admin' else ''
    
    # Match the old logo.svg
    pat1 = re.compile(r'<img src="[^"]*logo\.svg"[^>]*>', re.IGNORECASE)
    # Match the dual image setup
    pat2 = re.compile(r'<a href="[^"]*" class="brand" [^>]*>\s*<img src="[^"]*Icon\.svg"[^>]*>\s*<img src="[^"]*Header Text\.svg"[^>]*>\s*</a>', re.IGNORECASE)
    
    # We want to replace it with Landscape Transparent Banner.svg for wide headers
    banner_img = f'<img src="{prefix}assets/brand/Landscape Transparent Banner.svg" alt="Grounds Maintenance" style="height: 38px; width: auto;" />'
    
    # For pat2, we rebuild the <a> tag
    if 'index.html' in str(content) or 'gallery' in str(content):
        # don't know file name from content easily without passing it, but we can just use generic regex
        pass

    content = pat1.sub(banner_img, content)
    
    # Fix the dual image by replacing the inner imgs
    def dual_repl(m):
        a_tag_start = m.group(0).split('<img')[0]
        # remove the flex-display styles we added
        a_tag_clean = a_tag_start.replace(' style="display: flex; align-items: center; gap: 8px; text-decoration: none;"', '')
        return a_tag_clean + banner_img + '\n      </a>'
    
    content = pat2.sub(dual_repl, content)
    return content

def fix_footer(content, level=''):
    prefix = '../' if level == 'admin' else ''
    
    # Find footer logo pattern. We look for Logo Full Size Landscape.png or Landscape Transparent Banner.svg in footer
    # Because we reverted, it might be Logo Full Size Landscape.jpg or .png
    # The div is usually <div class="footer-brand">
    
    def footer_repl(m):
        return f'<div class="footer-brand">\n        <img src="{prefix}assets/brand/Landscape Transparent Banner.svg" alt="Grounds Maintenance" style="height: 42px; margin-bottom: 12px; filter: brightness(0) invert(1);" />'
    
    pat = re.compile(r'<div class="footer-brand">\s*<img src="[^"]*(?:Logo Full Size Landscape\.png|Landscape Transparent Banner\.svg)"[^>]*>', re.IGNORECASE)
    content = pat.sub(footer_repl, content)
    
    return content
    
for page in pages:
    path = os.path.join(base, page)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = fix_header(content, level='')
    content = fix_footer(content, level='')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for page in admin_pages:
    path = os.path.join(base, 'admin', page)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = fix_header(content, level='admin')
    content = fix_footer(content, level='admin')
    
    # Also fix admin sidebar, which class is .brand
    # Above fix_header handles any logo.svg replaced with the new banner
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Unified SVG deployed.")
