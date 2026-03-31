import os
import re

brand_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media"
site_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final"

def get_svg(filename):
    with open(os.path.join(brand_dir, filename), 'r', encoding='utf-8') as f:
        svg = f.read()
    return re.sub(r'<\?xml[^>]*\?>\n?', '', svg).strip()

icon_svg = get_svg('Icon SVG code.SVG')
text_svg = get_svg('Header Text SVG code.note')
footer_svg = get_svg('Land Scape Banner SVG code.svg')

# Colorize Footer SVG for Dark Background
footer_svg = footer_svg.replace('#23432c', '#ffffff')
footer_svg = footer_svg.replace('#244131', '#e8ece9')
footer_svg = footer_svg.replace('#152916', '#ffffff')
footer_svg = footer_svg.replace('#526c3d', '#7fe8a2')
footer_svg = footer_svg.replace('#fdfdfd', '#ffffff')

# Add sizing and classes
def inject_scale(svg, cls, inline_style):
    return svg.replace('<svg ', f'<svg class="{cls}" style="{inline_style}" ')

icon_svg = inject_scale(icon_svg, 'brand-icon', 'height: 48px; width: auto; flex-shrink: 0;')
text_svg = inject_scale(text_svg, 'brand-text', 'height: 34px; width: auto; flex-shrink: 0;')
footer_svg = inject_scale(footer_svg, 'footer-logo', 'height: 48px; width: auto; max-width: 100%; display: block;')

# A separate landscape for admin
admin_landscape = inject_scale(get_svg('Land Scape Banner SVG code.svg'), 'brand-logo', 'height: 32px; width: auto;')

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    original_html = html

    # 1. Header Replacements (Public Pages)
    # They have <a href="#top" class="brand"...> ... </a>
    # We want to replace the inside of the <a> tag.
    # The user wants "the SVG icon... to act as a home button. Also if you click on it, and the header text SVG code, I want that to be the website name."
    # We will put both inside the `.brand` link.
    header_regex = re.compile(
        r'(<a[^>]*class="brand"[^>]*>)\s*(?:<div[^>]*>)?.*?(?:</div>)?\s*(</a>)',
        re.DOTALL | re.IGNORECASE
    )
    
    new_header_inner = f'''
        <div style="display: flex; align-items: center; gap: 12px;">
        {icon_svg}
        {text_svg}
      </div>
      '''
    html = header_regex.sub(lambda m: m.group(1) + new_header_inner + m.group(2), html)

    # 2. Login Page Replacements
    # Has <div class="admin-login-logo">
    login_regex = re.compile(
        r'(<div class="admin-login-logo"[^>]*>).*?(</div>)',
        re.DOTALL | re.IGNORECASE
    )
    if 'login.html' in filepath and login_regex.search(html):
        new_login_inner = f'''
        <div style="display: flex; align-items: center; gap: 12px; justify-content: center; margin-bottom: 8px;">
        {icon_svg}
        {text_svg}
        </div>
        '''
        html = login_regex.sub(lambda m: m.group(1) + new_login_inner + m.group(2), html)

    # 3. Footer Replacement
    # Has <div class="footer-brand">\s*<img ...
    # We'll replace the first <img> inside .footer-brand
    footer_regex = re.compile(
        r'(<div class="footer-brand">\s*)<img[^>]*>(.*?)',
        re.IGNORECASE | re.DOTALL
    )
    if footer_regex.search(html):
        html = footer_regex.sub(lambda m: f'{m.group(1)}{footer_svg}{m.group(2)}', html, count=1)

    if html != original_html:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Patched: {filepath}")

for root, dirs, files in os.walk(site_dir):
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(root, f)
            try:
                process_file(path)
            except Exception as e:
                print(f"Error processing {path}: {e}")
