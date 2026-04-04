import os, glob, re

folder = r'd:\Future Tech Companies\Grounds Maintenance Services\AR-Grounds\argrounds-website\argrounds-final'
html_files = glob.glob(os.path.join(folder, '**', '*.html'), recursive=True)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Target only the footer-icon-svg element and restore original green colors
    # The script previously changed #23432c -> #ffffff and #526c3d -> #ffffff
    def restore_icon_colors(m):
        icon_svg = m.group(0)
        # Restore the style block colors inside the icon SVG
        icon_svg = re.sub(
            r'(\.st0\s*\{\s*fill:\s*)#ffffff(\s*;\s*\})',
            r'\g<1>#23432c\2',
            icon_svg
        )
        icon_svg = re.sub(
            r'(\.st2\s*\{\s*fill:\s*)#ffffff(\s*;\s*\})',
            r'\g<1>#526c3d\2',
            icon_svg
        )
        return icon_svg

    new_content = re.sub(
        r'<svg[^>]*class="footer-icon-svg"[^>]*>.*?</svg>',
        restore_icon_colors,
        content,
        flags=re.DOTALL
    )

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Restored icon colors in', os.path.basename(filepath))

print("Done")
