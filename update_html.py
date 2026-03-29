import os
import re

target_dir = r'd:/Future Tech Companies/Grounds Maintenance Services/AR-Grounds/argrounds-website/argrounds-final'

favicon_tags = '''
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
'''

nav_logo_html = '''<img src="assets/brand/logo.svg" alt="Grounds Maintenance" style="height: 48px; width: auto;" />'''
footer_logo_html = '''<img src="assets/brand/Logo Full Size Landscape.png" alt="Grounds Maintenance" style="height: 54px; margin-bottom: 12px;" />'''
admin_logo_html = '''<img src="../assets/brand/logo.svg" alt="Grounds Maintenance" style="height: 36px; display: block; margin: 0 auto;" />'''

re_old_favicon = re.compile(r'<link rel="icon" href="\.\.?/assets/favicon\.svg".*?>\n?', re.MULTILINE)
re_brand_nav = re.compile(r'(<a [^>]*class="brand"[^>]*>).*?(</a>)', re.DOTALL)
re_footer_brand = re.compile(r'(<div class="footer-brand">).*?(<strong>Grounds( Maintenance)?</strong>)', re.DOTALL)

for root, dirs, files in os.walk(target_dir):
    for filename in files:
        if filename.endswith('.html'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            
            # 1. Update Favicon
            if 'favicon-32x32.png' not in new_content:
                new_content = re_old_favicon.sub('', new_content)
                new_content = new_content.replace('</head>', f'{favicon_tags}</head>')

            # 2. Update Nav Logo
            def nav_repl(m):
                prefix = "../" if "admin" in filepath else ""
                nav_replacement = nav_logo_html.replace('src="assets', f'src="{prefix}assets')
                return f'{m.group(1)}\n        {nav_replacement}\n      {m.group(2)}'
            new_content = re_brand_nav.sub(nav_repl, new_content)

            # 3. Update Footer Logo
            def foot_repl(m):
                prefix = "../" if "admin" in filepath else ""
                footer_replacement = footer_logo_html.replace('src="assets', f'src="{prefix}assets')
                return f'{m.group(1)}\n        {footer_replacement}\n        <div>'
            new_content = re_footer_brand.sub(foot_repl, new_content)

            # 4. Update Admin Sidebar Logo
            re_admin_logo = re.compile(r'(<div class="sidebar-logo">).*?(</div>)', re.DOTALL)
            def admin_repl(m):
                return f'{m.group(1)}\n      {admin_logo_html}\n    {m.group(2)}'
            if 'admin' in filepath:
                new_content = re_admin_logo.sub(admin_repl, new_content)

            # 5. Fix admin login layout
            re_admin_login = re.compile(r'(<div class="admin-login-logo">).*?(</div>)', re.DOTALL)
            def login_repl(m):
                return f'{m.group(1)}\n      {admin_logo_html}\n    {m.group(2)}'
            if 'login.html' in filepath:
                new_content = re_admin_login.sub(login_repl, new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated HTML: {filepath}')
