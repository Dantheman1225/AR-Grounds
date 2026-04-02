import re
with open(r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\Brand Media\Land Scape Banner SVG code.svg', 'r', encoding='utf-8') as f:
    text = f.read()

paths = re.findall(r'<path[^>]*d="M([0-9\.]+)[^>]*fill:\s*#23432c[^>]*>', text)
left_side = []
for p in paths:
    if float(p) < 800:
        left_side.append(p)
print('Left side #23432c path starting Xs:', left_side)
