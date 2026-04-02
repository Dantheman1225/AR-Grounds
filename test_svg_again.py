import re
path = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final\index.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'<svg class="footer-logo"[^>]*>(.*?)</svg>', text, re.DOTALL)
if m:
    svg_content = m.group(1)
    paths = re.findall(r'<path[^>]*>', svg_content)
    polygons = re.findall(r'<polygon[^>]*>', svg_content)
    rects = re.findall(r'<rect[^>]*>', svg_content)
    print(f'Total paths: {len(paths)}')
    print(f'Total polygons: {len(polygons)}')
    print(f'Total rects: {len(rects)}')
    for p in paths + polygons + rects:
        clean_p = re.sub(r'd="[^"]*"', 'd="..."', p)
        clean_p = re.sub(r'points="[^"]*"', 'points="..."', clean_p)
        print(clean_p)
