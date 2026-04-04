import os, glob
import re

folder = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final'
html_files = glob.glob(os.path.join(folder, '**', '*.html'), recursive=True)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to target the footer logo specifically.
    def replace_footer(m):
        footer_html = m.group(0)
        # Replace the src
        footer_html = re.sub(
            r'(src=["\'].*?)Landscape.*?Banner.*?\.svg(["\'])',
            r'\1Landscape White Footer.svg\2',
            footer_html
        )
        footer_html = re.sub(
            r'(src=["\'].*?)Landscape.*?Footer.*?\.svg(["\'])',
            r'\1Landscape White Footer.svg\2',
            footer_html
        )
        
        # Remove any filter from a style string inside an image tag in the footer
        # A bit hacky but works for inline styles like style="filter: ...;"
        def remove_filter(img_match):
            img_tag = img_match.group(0)
            img_tag = re.sub(r'filter:\s*(invert|brightness)\([^)]+\);?', '', img_tag)
            img_tag = re.sub(r'filter:\s*(invert|brightness)\([^)]+\)\s*(invert|brightness)\([^)]+\);?', '', img_tag)
            img_tag = re.sub(r'style="\s*height:\s*80px;\s*"', 'style="height: 80px;"', img_tag)
            return img_tag
            
        footer_html = re.sub(r'<img[^>]*Landscape\s+White\s+Footer\.svg[^>]*>', remove_filter, footer_html)
        return footer_html

    new_content = re.sub(r'<footer\s+.*?</footer>', replace_footer, content, flags=re.DOTALL | re.IGNORECASE)
    new_content = re.sub(r'<footer>.*?</footer>', replace_footer, new_content, flags=re.DOTALL | re.IGNORECASE)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Updated', filepath)
print("Done!")
