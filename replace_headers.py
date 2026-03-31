import os
import glob
import re

base_dir = r'd:\\Future Tech Companies\\Grounds Maintenance Services\\AR-Grounds\\argrounds-website\\argrounds-final'

html_files = glob.glob(os.path.join(base_dir, '*.html')) + glob.glob(os.path.join(base_dir, 'admin', '*.html'))

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace the header image but leave the footer (which has filter: invert) alone.
    # The header pattern:
    
    if '../assets/' in content:
        # Admin files
        new_html = '<div style=\"display: flex; align-items: center; gap: 12px;\">\\n        <img src=\"../assets/brand/Icon.svg\" alt=\"Icon\" style=\"height: 44px; width: auto;\" />\\n        <img src=\"../assets/brand/Header Text.svg\" alt=\"Grounds Maintenance\" style=\"height: 32px; width: auto;\" />\\n      </div>'
        pattern = r'<img src=\"../assets/brand/Landscape Transparent Banner\.svg\"[^>]*style=\"height:\s*\d+px;\s*width:\s*auto;\"[^>]*/>'
    else:
        # Main files
        new_html = '<div style=\"display: flex; align-items: center; gap: 12px;\">\\n        <img src=\"assets/brand/Icon.svg\" alt=\"Icon\" style=\"height: 48px; width: auto;\" />\\n        <img src=\"assets/brand/Header Text.svg\" alt=\"Grounds Maintenance\" style=\"height: 34px; width: auto;\" />\\n      </div>'
        pattern = r'<img src=\"assets/brand/Landscape Transparent Banner\.svg\"[^>]*style=\"height:\s*\d+px;\s*width:\s*auto;\"[^>]*/>'
        
    replaced, num = re.subn(pattern, new_html, content)
    if num > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(replaced)
        print(f'Updated {filepath}')

for f in html_files:
    replace_in_file(f)
