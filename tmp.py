import re
import os

files = [
    'Landscape Transparent Banner.svg', 
    'Header Text.svg', 
    'Icon.svg', 
    'Grounds Square Banner.svg'
]

base = r'd:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/Brand Media'
for file in files:
    try:
        with open(os.path.join(base, file), 'r', encoding='utf-8') as f:
            content = f.read()
            fills = set(re.findall(r'fill=\"(#[0-9a-fA-F]{3,6})\"', content))
            styles = set(re.findall(r'fill:(#[0-9a-fA-F]{3,6})', content))
            print(f'{file:35} | Fills', fills | styles)
    except Exception as e:
        print(e)
