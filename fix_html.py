import os, glob
import re

folder = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final'
html_files = glob.glob(os.path.join(folder, '**', '*.html'), recursive=True)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # We want to target the footer logo specifically.
    # We know the footer logo image has class="footer-logo", or src that has "Landscape Transparent Banner" or "Landscape%20Transparent%20Banner"
    # Actually, we can just replace the references to the transparent or footer banner in the whole file EXCEPT header?
    # No, header uses "Landscape Transparent Banner.svg" too! Wait.
    # If the header uses it, does the header need it pure white or dark?
    # The header has a light background, so it needs the dark one.
    # The footer has a dark background, so it needs the white one.
    
    # We should only replace the logo inside the footer section.
    # We can use Beautiful Soup or just string splits.
    
    import bs4
    soup = bs4.BeautifulSoup(content, 'html.parser')
    
    # Find all footers
    footers = soup.find_all('footer')
    changed = False
    for footer in footers:
        imgs = footer.find_all('img')
        for img in imgs:
            src = img.get('src', '')
            if 'Landscape' in src and 'Banner' in src:
                # Replace src with White Footer
                new_src = src.replace('Landscape Transparent Banner.svg', 'Landscape White Footer.svg')
                new_src = new_src.replace('Landscape%20Transparent%20Banner.svg', 'Landscape%20White%20Footer.svg')
                new_src = new_src.replace('Landscape%20Banner%20Footer.svg', 'Landscape%20White%20Footer.svg')
                new_src = new_src.replace('Landscape Banner Footer.svg', 'Landscape White Footer.svg')
                img['src'] = new_src
                
                # Remove filter from style
                style = img.get('style', '')
                if style:
                    style = re.sub(r'filter:\s*[^;]+;?', '', style).strip()
                    img['style'] = style
                
                changed = True
                
    if changed:
        # Since bs4 alters formatting sometimes, we can also just use it to find lines, or just write it back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        print('Updated', filepath)
