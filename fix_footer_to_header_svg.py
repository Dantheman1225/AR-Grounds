import os, glob
import re

folder = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final'
html_files = glob.glob(os.path.join(folder, '**', '*.html'), recursive=True)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def repl_footer(m):
        fcontent = m.group(0)
        
        # Replace the landscape footer img tag with the two header SVGs
        # We look for <img ... Landscape ... > and replace it.
        # It could be class="footer-logo"
        replacement = '''<div class="flex items-center gap-3 mb-6" style="filter: brightness(0) invert(1);">
            <img src="assets/brand/Icon.svg" alt="Grounds Icon" style="height: 60px; width: auto;">
            <img src="assets/brand/Header Text.svg" alt="Grounds Maintenance" style="height: 48px; width: auto;">
        </div>'''
        
        new_fcontent = re.sub(r'<img[^>]*Landscape[^>]*\.svg[^>]*>', replacement, fcontent)
        return new_fcontent
        
    new_content = re.sub(r'<footer.*?</footer>', repl_footer, content, flags=re.DOTALL|re.IGNORECASE)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Updated', filepath)
print("Done")
