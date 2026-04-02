import os

site_dir = r"d:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final"

for root, dirs, files in os.walk(site_dir):
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                html = file.read()
            
            original_html = html

            # The background bounding box for the landscape banner begins exactly as:
            # M0,404.25V0h1536v404.25H0ZM
            # If we remove '0,404.25V0h1536v404.25H0Z', the 'M' stays and connects to the next coordinate!
            # The next coordinate is 243.71... so M0,404.25V0h1536v404.25H0ZM243... becomes M243...
            
            html = html.replace('M0,404.25V0h1536v404.25H0ZM', 'M')

            if html != original_html:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(html)
                print(f"Removed inverted landscape box: {path}")

print("Done.")
