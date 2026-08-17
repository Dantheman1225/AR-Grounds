import glob
import re

files = glob.glob('**/*.html', recursive=True)

# Replacements for paths to be absolute
def make_absolute(content):
    content = re.sub(r'href="css/', r'href="/css/', content)
    content = re.sub(r'src="js/', r'src="/js/', content)
    content = re.sub(r'href="assets/', r'href="/assets/', content)
    content = re.sub(r'src="assets/', r'src="/assets/', content)
    content = re.sub(r"url\('assets/", "url('/assets/", content)
    content = re.sub(r'href="favicon.ico"', 'href="/favicon.ico"', content)
    return content

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = make_absolute(content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated paths in {filepath}")
