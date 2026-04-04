import os, glob
import re

folder = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final'
html_files = glob.glob(os.path.join(folder, '**', '*.html'), recursive=True)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The background path starts with M-.04,1984.16V-.16h2122.08
    # We will remove this path from any SVG inside the footer.
    
    def remove_bg(m):
        fcontent = m.group(0)
        # Remove the exact background path
        new_fcontent = re.sub(r'<path\s+class="st1"\s+d="M-\.04,1984\.16V-\.16h2122\.08v1984\.32H-\.04ZM.*?/>', '', fcontent, flags=re.DOTALL)
        return new_fcontent

    new_content = re.sub(r'<footer.*?</footer>', remove_bg, content, flags=re.DOTALL|re.IGNORECASE)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Fixed icon background in', filepath)

print("Done")
