import re
path = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final\index.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'<svg class="footer-logo"[^>]*>(.*?)</svg>', text, re.DOTALL)
if m:
    svg_content = m.group(1)
    paths = re.findall(r'<(path|polygon)[^>]*fill:\s*#(ffffff|0a1f12)[^>]*>', svg_content)
    print(f'Total elements colored white or charcoal: {len(paths)}')
    # Let's count them
    w = sum(1 for p in paths if p[1] == 'ffffff')
    c = sum(1 for p in paths if p[1] == '0a1f12')
    print(f'White: {w}, Charcoal: {c}')
    
    # Let's grab all occurrences of '#0a1f12' to see what they are
    charcoal_els = re.findall(r'<(path|polygon)[^>]*fill:\s*#0a1f12[^>]*>', svg_content)
    print(f'Actual tag count charcoal: {len(charcoal_els)}')
