import re
with open(r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media\Land Scape Banner SVG code.svg', 'r', encoding='utf-8') as f:
    text = f.read()

paths = re.findall(r'<path[^>]*d="M([0-9\.]+)[^>]*fill:\s*(#[0-9a-fA-F]+)[^>]*>', text)
for x, c in paths:
    if float(x) < 300:
        print(f'Icon element X={x}, Color={c}')
        
# also polygons
polys = re.findall(r'<polygon[^>]*points="([0-9\.]+)[^>]*fill:\s*(#[0-9a-fA-F]+)[^>]*>', text)
for p, c in polys:
    if float(p) < 300:
        print(f'Icon Polygon X={p}, Color={c}')
