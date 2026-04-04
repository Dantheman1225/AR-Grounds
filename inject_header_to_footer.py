import os, glob
import re

folder = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final'
html_files = glob.glob(os.path.join(folder, '**', '*.html'), recursive=True)

header_logo_html = '''<a href="index.html" class="flex items-center gap-3 mb-6 group">
            <img src="assets/brand/Icon.svg" alt="Grounds Icon" class="h-10 sm:h-12 w-auto transition-transform duration-300 group-hover:scale-105">
            <img src="assets/brand/Header Text.svg" alt="Grounds Maintenance" class="h-8 sm:h-10 w-auto opacity-90 transition-opacity duration-300 group-hover:opacity-100">
        </a>'''

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(
        r'<div class="flex items-center gap-3 mb-6" style="filter: brightness\(0\) invert\(1\);">\s*<img src="assets/brand/Icon.svg"[^>]*>\s*<img src="assets/brand/Header Text.svg"[^>]*>\s*</div>',
        header_logo_html,
        content,
        flags=re.DOTALL
    )
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Updated', filepath)

print("Done")
