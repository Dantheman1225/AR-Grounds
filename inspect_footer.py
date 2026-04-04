import glob
import re

files = glob.glob(r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final\index.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        m = re.findall(r'<footer[^>]*>', content)
        print("Footers in", f, m)
        
        for match in re.finditer(r'(<footer[^>]*>.*?</footer>)', content, re.DOTALL | re.IGNORECASE):
            if 'site-footer' in match.group(0) or 'class="bg-' in match.group(1):
                print(match.group(0)[:800])
                print('-----')
