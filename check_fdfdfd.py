import re
with open(r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media\Land Scape Banner SVG code.svg', 'r', encoding='utf-8') as f:
    text = f.read()

paths = re.findall(r'<path[^>]*d="M([0-9\.]+)[^>]*fill:\s*(#[fF]{6}|#fdfdfd)[^>]*>', text)
print('FDFDFD paths:')
for x, c in paths:
    if float(x) > 300:
        print(f'Path X={x}')
        
polys = re.findall(r'<polygon[^>]*points="([0-9\.]+)[^>]*fill:\s*(#[fF]{6}|#fdfdfd)[^>]*>', text)
print('FDFDFD polys:')
for p, c in polys:
    if float(p) > 300:
        print(f'Poly X={p}')
        
# Let's also verify IF ANY part of path 2 natively draws "Grounds MAINTENANCE" text at all!
