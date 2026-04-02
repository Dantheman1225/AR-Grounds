import os
import re

site_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final"

for root, dirs, files in os.walk(site_dir):
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                html = file.read()
            
            original_html = html

            # 1. Remove the white box path from the Icon SVG
            # It looks like: <path class="st1" d="M-.04,1984.16V-.16h2122.08v1984.32H-.04ZM1844.11,1020.95c0-480.16-389.17-869.41-869.24-869.41S105.63,540.79,105.63,1020.95s389.17,869.41,869.24,869.41,869.24-389.25,869.24-869.41Z"/>
            # We can use a regex to match it and remove it. It's the only path starting with M-.04,1984.16...
            white_box_regex = re.compile(
                r'<path\s+class="st1"\s+d="M-\.04.*?Z"\s*/>',
                re.DOTALL
            )
            # Also, just in case there's no class="st1", let's be more robust
            white_box_regex2 = re.compile(
                r'<path[^>]*d="M-\.04[^>]*Z"\s*/>'
            )
            
            html = white_box_regex2.sub('', html)
            
            # Since admin SVGs had colors replaced, what if class="st1" became something else?
            # The regex2 doesn't depend on class, just the unique path data.

            # 2. Make the header text bigger
            # We injected: <svg class="brand-text" style="height: 34px; width: auto; flex-shrink: 0;"
            html = html.replace('height: 34px; width: auto; flex-shrink: 0;" id="Layer_1" data-name="Layer 1"',
                                'height: 42px; width: auto; flex-shrink: 0;" id="Layer_1" data-name="Layer 1"')
            
            # And for the admin sidebar which might have used 32px height:
            html = html.replace('height: 32px; width: auto; flex-shrink: 0;" id="Layer_1" data-name="Layer 1"',
                                'height: 38px; width: auto; flex-shrink: 0;" id="Layer_1" data-name="Layer 1"')

            if html != original_html:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(html)
                print(f"Fixed icon box and text size: {path}")

print("Done.")
