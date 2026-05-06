import os
import glob
import re

nav_html = """<ul id="nav-menu" class="nav-menu">
          <li><a href="/">Home</a></li>
          <li><a href="/services/">Services</a></li>
          <li><a href="/learning-center/">Learning Center</a></li>
          <li><a href="/gallery.html">Gallery</a></li>
          <li><a href="/about.html">About</a></li>
          <li><a href="/quote.html" class="nav-cta">Free Quote</a></li>
        </ul>"""

files = glob.glob('**/*.html', recursive=True)
count = 0
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace from <ul id="nav-menu"...> to </ul>
    new_content, num_subs = re.subn(r'<ul id="nav-menu" class="nav-menu">[\s\S]*?</ul>', nav_html, content)
    
    if num_subs > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        print(f"Updated {filepath}")

print(f"Total files updated: {count}")
